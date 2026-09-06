export type UniversityCode = "rtpu" | "redu";
export type DeliveryMode = "asynchronous" | "scheduled_live" | "self_paced" | "parent_taught";

export const universities = {
  rtpu: {
    code: "rtpu" as const,
    slug: "ross-tax-pro-university",
    name: "Ross Tax Pro University",
    statement: "A 100% online, AI-assisted professional learning environment for tax practice, compliance, office leadership, and career development.",
    programs: [
      { code: "TPC-1", title: "Tax Professional Certificate I", mode: "self_paced" as DeliveryMode, hours: 40 },
      { code: "TPC-2", title: "Tax Professional Certificate II", mode: "self_paced" as DeliveryMode, hours: 60 },
      { code: "TPD", title: "Tax Practitioner Development", mode: "asynchronous" as DeliveryMode, hours: 80 },
      { code: "TOM", title: "Tax Office Management", mode: "asynchronous" as DeliveryMode, hours: 50 },
    ],
  },
  redu: {
    code: "redu" as const,
    slug: "ross-e-drive-university",
    name: "Ross E-Drive University",
    statement: "A 100% online driver-education environment supporting self-paced and parent-taught learning, progress controls, assessments, and completion readiness.",
    programs: [
      { code: "TEEN-SP", title: "Teen Driver Education — Self-Paced", mode: "self_paced" as DeliveryMode, hours: 32 },
      { code: "TEEN-PT", title: "Teen Driver Education — Parent-Taught", mode: "parent_taught" as DeliveryMode, hours: 32 },
      { code: "ADULT-6", title: "Adult Driver Education", mode: "self_paced" as DeliveryMode, hours: 6 },
    ],
  },
} as const;

export const universityPersonas = [
  { code: "ai_chancellor", title: "AI Chancellor", function: "Coordinates institutional plans, policy retrieval, and executive dashboards.", approval: "Human executive approval required for policy, finance, accreditation, personnel, or public commitments." },
  { code: "ai_dean", title: "AI Academic Dean", function: "Coordinates curriculum maps, faculty coverage, learning outcomes, and academic-quality alerts.", approval: "Human academic administrator approves curriculum and program changes." },
  { code: "ai_faculty", title: "AI Faculty Instructor", function: "Delivers lessons, examples, practice activities, explanations, and guided discussion at any hour.", approval: "Qualified human faculty owns course standards and reviews disputed or consequential outcomes." },
  { code: "ai_tutor", title: "AI Tutor", function: "Provides personalized explanations, study plans, practice questions, and formative feedback.", approval: "Cannot issue credentials, alter final records, or make disciplinary decisions." },
  { code: "ai_registrar", title: "AI Registrar Assistant", function: "Checks enrollment completeness, prerequisites, progress, and record exceptions.", approval: "Human registrar approves official record changes, withdrawals, completions, and credentials." },
  { code: "ai_student_success", title: "AI Student Success Coach", function: "Detects disengagement signals and recommends approved interventions and resources.", approval: "Human staff reviews welfare, accommodation, discipline, and high-impact interventions." },
  { code: "ai_instructional_designer", title: "AI Instructional Designer", function: "Drafts objectives, lesson structures, rubrics, accessibility alternatives, and content refresh plans.", approval: "Human curriculum owner approves publication." },
  { code: "ai_assessment", title: "AI Assessment Proctor Assistant", function: "Grades objective items, flags integrity anomalies, and prepares review packets.", approval: "Human reviewer resolves subjective grading, appeals, integrity findings, and final credential decisions." },
] as const;

export function universityBySlug(slug: string) {
  return Object.values(universities).find((university) => university.slug === slug);
}
