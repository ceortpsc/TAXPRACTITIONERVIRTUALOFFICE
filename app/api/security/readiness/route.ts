import { NextResponse } from "next/server";
import { securityReadiness } from "@/lib/security/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const controls = securityReadiness();
  const gated = Object.values(controls).filter((control) => control.status === "gated").length;
  return NextResponse.json({
    status: gated === 0 ? "ready" : "configuration_required",
    standard: "IRS-aligned safeguards; not an IRS certification",
    controls,
  }, { headers: { "Cache-Control": "no-store" } });
}
