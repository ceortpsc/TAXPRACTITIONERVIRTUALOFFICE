import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function workerAdapterState() {
  const url = process.env.WORKER_ADAPTER_URL;
  const token = process.env.WORKER_ADAPTER_TOKEN;
  if (!url || !token) return "not_configured" as const;

  try {
    const healthUrl = new URL("/healthz", url);
    const response = await fetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return "unreachable" as const;
    const body = await response.json() as { status?: string };
    if (body.status === "ready") return "ready" as const;
    if (body.status === "degraded") return "degraded" as const;
    return "unknown" as const;
  } catch {
    return "unreachable" as const;
  }
}

export async function GET() {
  const clerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
  const irsConfigured = Boolean(
    process.env.IRS_CLIENT_ID && process.env.IRS_CLIENT_SECRET && process.env.IRS_REDIRECT_URI,
  );
  const stripeConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
  );

  return NextResponse.json({
    status: "ok",
    service: "tax-practitioner-virtual-office",
    checks: {
      application: "ready",
      database: process.env.DATABASE_URL ? "configured" : "not_configured",
      identity: clerkConfigured ? "configured" : "not_configured",
      irsApi: irsConfigured ? "configured" : "not_configured",
      stripe: stripeConfigured ? "configured" : "not_configured",
      workerAdapter: await workerAdapterState(),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
