import { NextResponse } from "next/server";
import { requireIdentity } from "@/lib/identity";
import { applicationReadiness, proposedDegreeInventory, regulatoryApplicant, regulatoryHardGates, regulatorySections } from "@/lib/regulatory-application";

const allowedRoles = new Set(["owner", "super_admin", "compliance_officer", "university_admin", "auditor"]);

export async function GET() {
  try {
    const identity = await requireIdentity();
    if (!identity.roles.some((role) => allowedRoles.has(role))) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({
      institution: regulatoryApplicant.proposedInstitutionName,
      applicant: regulatoryApplicant,
      programs: proposedDegreeInventory,
      sections: regulatorySections,
      readiness: applicationReadiness(),
      hardGates: regulatoryHardGates,
      transmissionReady: false,
      notice: "Application-preparation data only. External authorization, accreditation, federal participation, enrollment transmission, and degree conferral are not claimed.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ error: "REGULATORY_READINESS_UNAVAILABLE" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
