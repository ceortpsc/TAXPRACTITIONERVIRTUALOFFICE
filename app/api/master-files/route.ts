import { NextResponse } from "next/server";
import { requireIdentity, type IdentityPrincipal } from "@/lib/identity";
import { buildMasterFileRecord, masterFileChecks, type MasterFileCreateInput } from "@/lib/master-file";
import { authorize, type Permission } from "@/lib/rbac";
import { runtimeStage } from "@/lib/runtime/engine-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function identityFailure(error: unknown) {
  const code = error instanceof Error ? error.message : "IDENTITY_VERIFICATION_FAILED";
  if (code === "UNAUTHENTICATED") {
    return NextResponse.json({ error: code }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  if (code === "ACCESS_NOT_ISSUED" || code === "MFA_REQUIRED") {
    return NextResponse.json({ error: code }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(
    { error: "IDENTITY_VERIFICATION_FAILED" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

async function requireMasterFilePermission(permission: Permission): Promise<
  | { principal: IdentityPrincipal; organizationId: string }
  | { response: NextResponse }
> {
  try {
    const principal = await requireIdentity();
    if (!principal.organizationId) {
      return {
        response: NextResponse.json(
          { error: "ORGANIZATION_SESSION_REQUIRED" },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        ),
      };
    }

    const permitted = authorize(
      {
        id: principal.subject,
        tenantId: principal.organizationId,
        roles: principal.roles,
        mfaVerified: principal.mfaVerified,
      },
      permission,
      { tenantId: principal.organizationId },
    );
    if (!permitted) {
      return {
        response: NextResponse.json(
          { error: "FORBIDDEN", requiredPermission: permission },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        ),
      };
    }

    return { principal, organizationId: principal.organizationId };
  } catch (error) {
    return { response: identityFailure(error) };
  }
}

export async function GET() {
  const access = await requireMasterFilePermission("client.read");
  if ("response" in access) return access.response;

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
  const access = await requireMasterFilePermission("client.write");
  if ("response" in access) return access.response;

  const body = await request.json().catch(() => null) as MasterFileCreateInput | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "INVALID_JSON_BODY" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const record = buildMasterFileRecord(body, {
      userId: access.principal.subject,
      organizationId: access.organizationId,
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
