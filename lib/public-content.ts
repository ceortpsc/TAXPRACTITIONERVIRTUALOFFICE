export const publicPageContent = {
  platforms: {
    eyebrow: "ONE CORPORATE GATEWAY",
    title: "Purpose-built platforms. One accountable ecosystem.",
    description: "Access tax operations, practitioner education, driver education, payroll and HR, secure document services, and the virtual office through one governed corporate environment.",
    items: ["Tax Practitioner Virtual Office", "Ross Tax Pro University", "Ross E-Drive University", "Ross Prime Payroll & HR", "Ross PDF Universal Editor", "eTRAC Refund Intelligence"],
  },
  solutions: {
    eyebrow: "SOLUTIONS",
    title: "Operational clarity for complex service work.",
    description: "Structured intake, secure casework, document governance, training, workflow controls, and human-reviewed assistance for professional teams.",
    items: ["Client intake and case management", "Refund research and trace planning", "Document vault and controlled workflows", "Role-based operations", "Audit-ready activity records", "Human-reviewed AI assistance"],
  },
  training: {
    eyebrow: "TRAINING",
    title: "Learn the work. Practice the standard. Lead with confidence.",
    description: "Self-paced orientation, role-based learning, supervised practice, career development, and compliance-centered professional education.",
    items: ["New-hire orientation", "Tax practitioner development", "Office management", "Security and privacy", "Customer service", "Leadership pathways"],
  },
  "tax-professionals": {
    eyebrow: "TAX PROFESSIONALS",
    title: "A controlled workspace for accountable practice.",
    description: "Organize client service, research, reviews, documents, escalations, and internal approvals without promising outcomes or bypassing professional judgment.",
    items: ["Secure virtual office", "Case timelines", "Review gates", "Knowledge resources", "Support routing", "Continuing development"],
  },
  employers: {
    eyebrow: "EMPLOYERS",
    title: "People operations built around disciplined controls.",
    description: "Workforce support, payroll-readiness planning, training, and HR workflows remain gated until each regulated or money-movement capability is separately approved.",
    items: ["Workforce onboarding", "Role assignments", "Training records", "Timekeeping readiness", "Policy acknowledgments", "Human approval controls"],
  },
  students: {
    eyebrow: "STUDENTS",
    title: "Structured education with a practical destination.",
    description: "Explore career-oriented learning across tax preparation, compliance, business operations, and approved driver-education programs.",
    items: ["Self-paced learning", "Practice exercises", "Instructor support", "Progress milestones", "Certificates", "Career resources"],
  },
  about: {
    eyebrow: "ABOUT ROSS TAX PRO",
    title: "More than software. A disciplined operating movement.",
    description: "Ross Tax Pro Software Co builds technology, training, and professional-service infrastructure designed around security, accountability, and opportunity.",
    items: ["Mission-led technology", "Compliance-centered design", "Professional education", "Human accountability", "Accessible support", "Continuous improvement"],
  },
  careers: {
    eyebrow: "CAREERS",
    title: "Build systems that help professionals do better work.",
    description: "Career paths span tax operations, customer service, education, engineering, security, compliance, marketing, and corporate support.",
    items: ["Tax operations", "Customer care", "IT support", "Education", "Software engineering", "Corporate services"],
  },
  support: {
    eyebrow: "SUPPORT",
    title: "The right help, routed to the right team.",
    description: "Support covers account access, virtual-office navigation, training, platform incidents, and approved service questions. Never submit taxpayer data through public channels.",
    items: ["Customer care", "Technical support", "Identity assistance", "Training support", "Incident escalation", "Knowledge resources"],
  },
  contact: {
    eyebrow: "CONTACT",
    title: "Start with a secure, accountable conversation.",
    description: "Contact the corporate team for platform, training, career, partnership, and support inquiries. Sensitive tax or identity documents belong only in approved authenticated channels.",
    items: ["Corporate inquiries", "Platform demonstrations", "Training enrollment", "Career questions", "Partnerships", "Secure support routing"],
  },
} as const;

export type PublicPageSlug = keyof typeof publicPageContent;

export function isPublicPageSlug(value: string): value is PublicPageSlug {
  return Object.prototype.hasOwnProperty.call(publicPageContent, value);
}
