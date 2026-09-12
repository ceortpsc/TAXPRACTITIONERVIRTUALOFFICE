import { NextResponse } from "next/server";
import { requireIdentity } from "@/lib/identity";
import { systemRegistrySnapshot } from "@/lib/runtime/system-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const controlPlaneRoles = new Set(["owner", "super_admin", "firm_admin", "compliance_officer", "auditor"]);

export async function GET() {
  try {
    const principal = await requireIdentity();
    if (!principal.roles.some((role) => controlPlaneRoles.has(role))) {
      return NextResponse.json(
        { error: "FORBIDDEN", detail: "System registry access requires a control-plane role." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(systemRegistrySnapshot(), {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-RTPSC-Registry": "evidence-first",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
}
