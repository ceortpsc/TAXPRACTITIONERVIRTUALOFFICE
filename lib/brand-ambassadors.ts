export type BrandAmbassador = {
  id: string;
  name: string;
  role: string;
  division: string;
  description: string;
  asset: string;
  accent: "gold" | "silver" | "navy" | "cream";
  primary?: boolean;
  capabilities: readonly string[];
};

export const brandAmbassadors: readonly BrandAmbassador[] = [
  {
    id: "andreaa",
    name: "Andreaa Chan’nel",
    role: "Digital Concierge & Brand Persona",
    division: "Ross Tax Pro Software Co.",
    description:
      "A guided front door to RTPSC platforms, training, support, tax-practice workflows, payroll, and document intelligence. Andreaa is a digital persona and may make mistakes; consequential tax, payroll, academic, legal, or financial decisions remain subject to human review.",
    asset: "/brand/andreaa-persona.svg",
    accent: "gold",
    primary: true,
    capabilities: ["Navigation", "Product guidance", "Support triage", "Knowledge routing"],
  },
  {
    id: "tax-operations",
    name: "Tax Operations Ambassador",
    role: "Tax Practice Experience",
    division: "Tax Practitioner Virtual Office",
    description:
      "Highlights preparation workflows, authorization gates, secure casework, transcript support, master files, notices, and compliance controls.",
    asset: "/brand/ambassador-tax-operations.svg",
    accent: "navy",
    capabilities: ["Preparation", "Casework", "Master files", "Compliance"],
  },
  {
    id: "learning",
    name: "Learning Ambassador",
    role: "Education & Professional Growth",
    division: "Ross Tax Pro University",
    description:
      "Connects learners to programs, coursework, professional-development resources, student services, and human-reviewed academic workflows.",
    asset: "/brand/ambassador-learning.svg",
    accent: "cream",
    capabilities: ["Programs", "Learning paths", "Student services", "Professional growth"],
  },
  {
    id: "payroll",
    name: "Payroll Operations Ambassador",
    role: "Workforce & Payroll Experience",
    division: "Ross Prime Payroll",
    description:
      "Introduces workforce onboarding, timekeeping, payroll ledgers, compliance controls, pay-cycle operations, and employer-service workflows.",
    asset: "/brand/ambassador-payroll.svg",
    accent: "silver",
    capabilities: ["Workforce", "Timekeeping", "Payroll", "Employer services"],
  },
] as const;
