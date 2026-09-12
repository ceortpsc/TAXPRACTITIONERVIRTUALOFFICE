import { NextResponse } from "next/server";
import { requireIdentity } from "@/lib/identity";
import { getOperationsSection, operationsSectionIds } from "@/lib/operations-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const operationsRoles = new Set(["owner", "super_admin", "firm_admin", "compliance_officer", "auditor"]);

export async function GET(_request: Request, context: { params: Promise<{ section: string }> }) {
  try {
    const principal = await requireIdentity();
    if (!principal.roles.some((role) => operationsRoles.has(role))) {
      return NextResponse.json(
        { error: "FORBIDDEN", detail: "Operations evidence requires an authorized control-plane role." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { section } = await context.params;
    if (!operationsSectionIds.includes(section as (typeof operationsSectionIds)[number])) {
      return NextResponse.json(
        { error: "NOT_FOUND", allowedSections: operationsSectionIds },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const result = getOperationsSection(section);
    if (!result) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-RTPSC-Evidence-Policy": "provider-claims-require-evidence",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
}
