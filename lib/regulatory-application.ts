export type RegulatoryStatus =
  | "seeded"
  | "draft"
  | "evidence_required"
  | "external_verification_required"
  | "internal_review_required"
  | "signature_required"
  | "blocked"
  | "ready_for_internal_review";

export type RegulatorySection = {
  number: number;
  code: string;
  title: string;
  owner: string;
  status: RegulatoryStatus;
  autofill: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
};

export const regulatoryApplicant = {
  legalApplicantName: "Ross Tax Pro Software Co.",
  proposedInstitutionName: "Ross Tax Pro University",
  entityType: "Private for-profit corporation; federal S-corporation tax election is a tax classification, not a separate entity type",
  formationJurisdiction: "Arkansas",
  formationDate: "2026-04-06",
  entityId: "811606215",
  proposedTexasLocation: "2509 Cody Poe Rd Unit B, Killeen, TX 76549",
  corporateWebsite: "https://rosstaxsoftware.com",
  deliveryModel: ["online", "scheduled_live", "asynchronous"],
  chiefExecutiveLegalName: "Condre D. Ross",
  chiefExecutivePreferredName: "Andreaa Chan’nel",
  actualDegreeStudentCount: 0,
  degreeAuthorityStatus: "NOT_VERIFIED",
  institutionalAccreditationStatus: "NOT_VERIFIED",
  titleIVStatus: "DISABLED",
  opeidStatus: "NOT_ASSIGNED_OR_VERIFIED",
  federalSchoolCodeStatus: "NOT_ASSIGNED_OR_VERIFIED",
  eduDomainStatus: "NOT_VERIFIED",
  degreeEnrollmentStatus: "DISABLED",
  degreeConferralStatus: "DISABLED",
  syntheticSimulationStatus: "ENABLED_WITH_SYNTHETIC_LABEL",
} as const;

export const proposedDegreeInventory = [
  { code: "AA-BUS", title: "Business Administration", credential: "Associate of Arts", authorization: "PROPOSED" },
  { code: "AS-ACCT", title: "Accounting", credential: "Associate of Science", authorization: "PROPOSED" },
  { code: "BA-BUS", title: "Business Administration", credential: "Bachelor of Arts", authorization: "PROPOSED" },
  { code: "BS-ACCT", title: "Accounting", credential: "Bachelor of Science", authorization: "PROPOSED" },
] as const;

export const regulatorySections: readonly RegulatorySection[] = [
  { number: 1, code: "IDENTITY", title: "Institution Identity", owner: "Executive Administration", status: "ready_for_internal_review", autofill: ["Legal applicant", "Proposed institution name", "formation jurisdiction/date", "entity ID", "Texas location", "website", "delivery model"], requiredEvidence: ["Formation filing", "good-standing evidence", "address/occupancy evidence", "approved institutional naming evidence if required"], blockers: ["Protected-name and degree-authority status require external verification"] },
  { number: 2, code: "LEGAL", title: "Legal Organization", owner: "General Counsel / Corporate Secretary", status: "evidence_required", autofill: ["Controlling entity", "organization type", "state of formation", "formation date"], requiredEvidence: ["Formation documents", "bylaws", "ownership register", "organizational chart", "foreign registration evidence if applicable"], blockers: ["Corporate records must be documentary-verified"] },
  { number: 3, code: "BOARD", title: "Governing Board", owner: "Board Secretary", status: "internal_review_required", autofill: ["Candidate director roster", "corporate roles"], requiredEvidence: ["Board appointments/resolutions", "addresses", "professional titles", "conflict disclosures", "compensation disclosures", "governance bylaws"], blockers: ["Candidate corporate directors are not automatically an institutional governing board"] },
  { number: 4, code: "EXEC", title: "Chief Executive Administration", owner: "Board of Directors", status: "evidence_required", autofill: ["CEO legal name", "CEO preferred/professional name"], requiredEvidence: ["Executed appointment", "CV/resume", "verified degree transcripts", "chief academic officer appointment and credentials"], blockers: ["Chief Academic Officer cannot be auto-appointed", "Honorary credentials cannot be represented as earned credentials"] },
  { number: 5, code: "MISSION", title: "Institutional Mission", owner: "President / Board", status: "internal_review_required", autofill: ["Proposed mission narrative", "measurable institutional outcomes"], requiredEvidence: ["Board-approved mission statement", "strategic-plan alignment"], blockers: ["Board adoption required"] },
  { number: 6, code: "FINANCE", title: "Financial Capacity", owner: "CFO", status: "evidence_required", autofill: ["Financial evidence checklist", "three-year budget template"], requiredEvidence: ["Institutional cash/reserve evidence", "three-year projected budget", "tuition/fee schedule", "audited statements or applicable new-institution evidence"], blockers: ["No financial amounts may be invented", "Corporate operating revenue is not automatically university revenue"] },
  { number: 7, code: "SURETY", title: "Surety Instrument", owner: "CFO / Compliance", status: "evidence_required", autofill: ["Surety calculation inputs", "instrument checklist"], requiredEvidence: ["Applicable surety worksheet", "issued instrument", "issuer verification"], blockers: ["Amount and issuer require external documents"] },
  { number: 8, code: "POLICY", title: "Institutional Policies", owner: "Compliance / Academic Affairs", status: "internal_review_required", autofill: ["Policy register", "document-control states"], requiredEvidence: ["Approved policy versions", "approval minutes/resolutions", "effective dates"], blockers: ["Draft policies cannot be represented as adopted"] },
  { number: 9, code: "FACULTY", title: "Faculty", owner: "Chief Academic Officer", status: "evidence_required", autofill: ["Faculty schema", "credential-review workflow", "course-coverage matrix"], requiredEvidence: ["CVs", "official transcripts", "licenses/certifications where applicable", "contracts/appointments", "qualification determinations"], blockers: ["No faculty credential may be fabricated", "AI personas cannot occupy human faculty credential slots"] },
  { number: 10, code: "PROGRAMS", title: "Academic Programs", owner: "Academic Affairs", status: "external_verification_required", autofill: ["AA Business Administration", "AS Accounting", "BA Business Administration", "BS Accounting"], requiredEvidence: ["Approved program scope", "degree plans", "program need evidence", "state authorization decision"], blockers: ["Proposed inventory is not authorized inventory", "Initial application scope must be confirmed with the regulator"] },
  { number: 11, code: "GENED", title: "General Education", owner: "Curriculum Committee", status: "internal_review_required", autofill: ["Associate general-education threshold validator", "baccalaureate general-education percentage validator", "distribution matrix"], requiredEvidence: ["Course inventory", "general-education matrix", "credit-hour calculations"], blockers: ["Program totals must be finalized before validation can pass"] },
  { number: 12, code: "CURRIC", title: "Curriculum", owner: "Curriculum Committee", status: "internal_review_required", autofill: ["Program outcomes", "course sequence", "prerequisites", "learning outcomes", "assessment map", "faculty coverage", "resource mapping"], requiredEvidence: ["Syllabi", "course descriptions", "credit/contact-hour rationale", "rubrics", "faculty approvals"], blockers: ["Final curriculum requires faculty/governance approval"] },
  { number: 13, code: "RESOURCES", title: "Learning Resources", owner: "Library / Academic Affairs", status: "evidence_required", autofill: ["eLibrary taxonomy", "OER/resource mapping", "course-resource registry"], requiredEvidence: ["Active licenses/subscriptions", "resource-access evidence", "development plan"], blockers: ["Listed copyrighted resources do not prove licensed access"] },
  { number: 14, code: "LIBRARY", title: "Library", owner: "Library Services", status: "evidence_required", autofill: ["Library inventory schema", "ISBN/ISSN mapping", "course-resource mapping"], requiredEvidence: ["License records", "catalog inventory", "accessibility evidence", "user-access evidence"], blockers: ["Library holdings require documentary proof"] },
  { number: 15, code: "SERVICES", title: "Student Services", owner: "Student Services Director", status: "ready_for_internal_review", autofill: ["Advising", "orientation", "tutoring", "career services", "accessibility", "technical support", "retention workflows"], requiredEvidence: ["Staffing assignments", "service procedures", "student handbook references", "service metrics"], blockers: ["Live staffing and service capacity must be verified"] },
  { number: 16, code: "ADMISSIONS", title: "Admissions", owner: "Admissions Office", status: "blocked", autofill: ["Application workflow", "identity/document intake", "readiness review", "program decision", "acknowledgments"], requiredEvidence: ["Admissions policy", "admission-document standards", "enrollment agreement", "catalog and handbook acknowledgments"], blockers: ["Actual degree enrollment remains disabled until state authority is verified"] },
  { number: 17, code: "REGISTRAR", title: "Registrar", owner: "Registrar", status: "ready_for_internal_review", autofill: ["Registration", "add/drop", "withdrawal", "attendance", "grades", "GPA", "degree audit", "transcripts", "holds", "record corrections"], requiredEvidence: ["Registrar procedures", "authorized staff roster", "record-change controls", "degree-conferral controls"], blockers: ["Official degree conferral remains disabled"] },
  { number: 18, code: "RECORDS", title: "Academic Records", owner: "Registrar / Information Security", status: "internal_review_required", autofill: ["Primary record store", "independent secure copy", "retention fields", "transcript history"], requiredEvidence: ["Backup architecture", "retention schedule", "security controls", "recovery test evidence"], blockers: ["Production database execution and recovery must be verified"] },
  { number: 19, code: "COMPLAINTS", title: "Student Complaints", owner: "Student Affairs / Compliance", status: "ready_for_internal_review", autofill: ["Intake", "acknowledgment", "routing", "investigation", "determination", "appeal", "closure"], requiredEvidence: ["Approved complaint policy", "student handbook language", "escalation/regulatory notice"], blockers: ["Final external complaint route must match applicable authorization status"] },
  { number: 20, code: "FACILITIES", title: "Facilities / Technology", owner: "COO / CIO", status: "evidence_required", autofill: ["Next.js portal", "LMS", "SIS", "virtual classroom", "RBAC", "eLibrary", "gradebook", "assessment", "audit logging"], requiredEvidence: ["Occupancy rights", "physical-space details if applicable", "technology inventory", "disaster-recovery evidence", "accessibility evidence"], blockers: ["Physical facility claims require verification"] },
  { number: 21, code: "DISTANCE", title: "Distance Education", owner: "Chief Academic Officer / CIO", status: "ready_for_internal_review", autofill: ["Scheduled live classes", "asynchronous modules", "recorded lectures", "identity verification", "integrity", "accessibility", "student support"], requiredEvidence: ["Distance-education policy", "faculty training", "student support plan", "effectiveness measures", "identity-verification controls"], blockers: ["Authorized operation and production identity verification must be established"] },
  { number: 22, code: "EFFECTIVENESS", title: "Institutional Effectiveness", owner: "Institutional Research", status: "internal_review_required", autofill: ["Mission-goal-KPI map", "program outcomes", "course outcomes", "improvement-action loop"], requiredEvidence: ["Assessment plan", "baseline methodology", "documented review cycle"], blockers: ["Historical outcomes cannot be fabricated before authorized operation"] },
  { number: 23, code: "EXHIBITS", title: "Degree Program Exhibits", owner: "Academic Affairs / Registrar", status: "evidence_required", autofill: ["Program cover sheet", "degree plan", "course descriptions", "general-education matrix", "sample transcript", "sample diploma"], requiredEvidence: ["Program-specific exhibits", "faculty matrix", "learning-resource matrix", "budget", "catalog pages"], blockers: ["Samples must be clearly marked SAMPLE — NOT AN AWARDED CREDENTIAL"] },
  { number: 24, code: "EVIDENCE", title: "Supporting Evidence", owner: "Compliance", status: "evidence_required", autofill: ["Appendix index A-Z", "evidence IDs", "document-control metadata"], requiredEvidence: ["All referenced appendices", "document hashes/version IDs", "source verification"], blockers: ["Missing evidence prevents submission readiness"] },
  { number: 25, code: "SITEVISIT", title: "Site Visit Preparation", owner: "Accreditation / Compliance", status: "internal_review_required", autofill: ["Mock-review checklist", "evidence-room index", "technology demonstration plan"], requiredEvidence: ["Mock review report", "remediation log", "site-visit evidence packets"], blockers: ["Site-visit readiness requires a completed evidence package"] },
  { number: 26, code: "ATTEST", title: "Certification / Attestation", owner: "Board Chair / Chief Executive", status: "signature_required", autofill: ["Completeness calculation", "open exceptions", "submission blockers"], requiredEvidence: ["Authorized board signature", "chief executive signature", "signature dates", "final reviewed application"], blockers: ["Signatures cannot be automated or fabricated"] },
] as const;

export const regulatoryHardGates = {
  actualDegreeEnrollment: false,
  degreeConferral: false,
  titleIVProcessing: false,
  nsldsTransmission: false,
  eduDomainApprovalClaim: false,
  accreditationClaim: false,
  stateAuthorizationClaim: false,
} as const;

export function applicationReadiness() {
  const total = regulatorySections.length;
  const blocked = regulatorySections.filter((section) => section.status === "blocked").length;
  const evidenceRequired = regulatorySections.filter((section) => section.status === "evidence_required").length;
  const externalVerification = regulatorySections.filter((section) => section.status === "external_verification_required").length;
  const signatureRequired = regulatorySections.filter((section) => section.status === "signature_required").length;
  const readyForInternalReview = regulatorySections.filter((section) => section.status === "ready_for_internal_review").length;
  return { total, blocked, evidenceRequired, externalVerification, signatureRequired, readyForInternalReview, transmissionReady: false };
}
