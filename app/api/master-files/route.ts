import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildMasterFileRecord, masterFileChecks, type MasterFileCreateInput } from "@/lib/master-file";
import { runtimeStage } from "@/lib/runtime/engine-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireIdentity() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) return { error: "IDENTITY_NOT_CONFIGURED", status: 503 } as const;
  const identity = await auth();
  if (!identity.userId) return { error: "AUTHENTICATION_REQUIRED", status: 401 } as const;
  if (!identity.orgId) return { error: "ORGANIZATION_SESSION_REQUIRED", status: 409 } as const;
  return { identity } as const;
}

export async function GET() {
  const access = await requireIdentity();
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  return NextResponse.json({
    module: "tax-practitioner-master-file",
    stage: runtimeStage(),
    checks: masterFileChecks.map(([code, label]) => ({ code, label })),
    persistence: {
      durable: false,
      mode: "sealed-portable-record",
      migration: "database/migrations/016_tax_practitioner_master_files.sql",
      note: "Durable persistence becomes active only when the production database adapter is explicitly configured and verified.",
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const access = await requireIdentity();
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await request.json().catch(() => null) as MasterFileCreateInput | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "INVALID_JSON_BODY" }, { status: 400 });

  try {
    const record = buildMasterFileRecord(body, {
      userId: access.identity.userId,
      organizationId: access.identity.orgId,
      environment: runtimeStage(),
    });
    return NextResponse.json({
      record,
      persistence: {
        durable: false,
        mode: "sealed-portable-record",
        nextGate: "activate and verify the migration-backed storage adapter",
      },
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "MASTER_FILE_VALIDATION_FAILED";
    return NextResponse.json({ error: code }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
