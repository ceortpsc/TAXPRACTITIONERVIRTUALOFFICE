import { NextResponse } from "next/server";
import { engineReadiness } from "@/lib/runtime/engine-registry";
import { planWorkerSweep, workerGroups, type WorkerGroupCode } from "@/lib/workers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isWorkerGroup(value: string | null): value is WorkerGroupCode {
  return Boolean(value && workerGroups.some((group) => group.code === value));
}

async function delegateToExternalAdapter(plan: ReturnType<typeof planWorkerSweep>) {
  const url = process.env.WORKER_ADAPTER_URL;
  const token = process.env.WORKER_ADAPTER_TOKEN;
  if (!url || !token) return { configured: false, dispatched: false, state: "adapter_required" as const };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Worker-Run-Id": plan.runId,
    },
    body: JSON.stringify(plan),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  let adapterBody: { error?: string; state?: string; dataMutationClaimed?: boolean } | null = null;
  try {
    adapterBody = await response.json();
  } catch {
    adapterBody = null;
  }

  if (!response.ok) {
    const state = response.status === 503
      ? "adapter_degraded"
      : response.status === 501
        ? "adapter_blocked"
        : "adapter_error";
    return {
      configured: true,
      dispatched: false,
      state,
      status: response.status,
      reason: adapterBody?.error ?? "ADAPTER_REQUEST_FAILED",
      dataMutationClaimed: adapterBody?.dataMutationClaimed === true,
    } as const;
  }

  return {
    configured: true,
    dispatched: true,
    state: "delegated" as const,
    status: response.status,
    dataMutationClaimed: adapterBody?.dataMutationClaimed === true,
  };
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const requestedGroup = url.searchParams.get("group");
  if (requestedGroup && !isWorkerGroup(requestedGroup)) return NextResponse.json({ error: "Unknown worker group." }, { status: 400 });
  const group: WorkerGroupCode | undefined = isWorkerGroup(requestedGroup) ? requestedGroup : undefined;

  const plan = planWorkerSweep({ group });
  const localResults = plan.workers
    .filter((worker) => worker.code === "runtime_readiness" || worker.code === "integration_health")
    .map((worker) => {
      if (worker.code === "runtime_readiness") return { code: worker.code, state: "completed", evidence: engineReadiness() };
      return {
        code: worker.code,
        state: "completed",
        evidence: {
          identity: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY),
          databaseReference: Boolean(process.env.DATABASE_URL),
          aiGateway: Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN),
          workerAdapter: Boolean(process.env.WORKER_ADAPTER_URL && process.env.WORKER_ADAPTER_TOKEN),
        },
      };
    });

  const adapterCandidates = plan.workers.filter((worker) => worker.code !== "runtime_readiness" && worker.code !== "integration_health");
  const adapter = adapterCandidates.length ? await delegateToExternalAdapter({ ...plan, workers: adapterCandidates }) : { configured: false, dispatched: false, state: "not_required" as const };

  return NextResponse.json({
    ok: true,
    correlationId: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    plan,
    localResults,
    externalAdapter: adapter,
    controls: {
      idempotentPlan: true,
      boundedConcurrency: true,
      retriesDefined: true,
      deadLetterDefined: true,
      dataMutationClaimed: adapter.dataMutationClaimed === true,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
