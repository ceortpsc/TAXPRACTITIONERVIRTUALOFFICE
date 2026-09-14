import { NextResponse } from "next/server";
import { requireIdentity } from "@/lib/identity";
import { authorize } from "@/lib/rbac";
import { runtimeWorkerEvidence } from "@/lib/workers";

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

export async function GET() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.json(
      { error: "IDENTITY_NOT_CONFIGURED" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const principal = await requireIdentity();
    if (!principal.organizationId) {
      return NextResponse.json(
        { error: "ORGANIZATION_SESSION_REQUIRED" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const permitted = authorize(
      {
        id: principal.subject,
        tenantId: principal.organizationId,
        roles: principal.roles,
        mfaVerified: principal.mfaVerified,
      },
      "audit.read",
      { tenantId: principal.organizationId },
    );
    if (!permitted) {
      return NextResponse.json(
        { error: "FORBIDDEN", detail: "Worker control-plane evidence requires audit.read." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({
      controlPlane: runtimeWorkerEvidence(),
      note: "A registered worker is not evidence of a completed business action. Data-dependent workers remain adapter-gated until the durable worker adapter is configured and verified.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return identityFailure(error);
  }
}
