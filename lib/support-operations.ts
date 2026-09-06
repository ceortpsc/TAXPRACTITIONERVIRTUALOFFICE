export type SupportQueue="customer_care"|"tax_operations"|"virtual_office"|"etrac"|"university"|"edrive"|"payroll_hr"|"pdf_editor"|"identity_access"|"billing"|"web_domains"|"integrations"|"security"|"outage";
export type SupportPriority="P1"|"P2"|"P3"|"P4";

export const departments=[
 {code:"care",name:"Customer Care",coverage:"General inquiries, intake, appointments, service recovery, complaints and status communication",roles:["Customer Service Representative I","Customer Service Representative II","Escalations Specialist","Customer Care Team Lead"]},
 {code:"taxops",name:"Tax Operations Support",coverage:"Tax-software navigation, approved workflow support, case routing, document intake and practitioner escalation",roles:["Tax Software Support Specialist","Case Workflow Specialist","Transmittal Support Liaison","Tax Operations Lead"]},
 {code:"platform",name:"Platform Product Support",coverage:"Virtual Office, eTRAC, Tax Pro University, E-Drive University, Prime Payroll & HR and PDF Editor",roles:["Virtual Office Specialist","eTRAC Specialist","LMS & University Specialist","E-Drive Student Support Specialist","Payroll & HR Product Specialist","PDF/OCR Product Specialist","Product Support Lead"]},
 {code:"service_desk",name:"IT Service Desk",coverage:"Devices, browsers, connectivity, application incidents, approved remote assistance and endpoint restoration",roles:["IT Support Representative I","IT Support Representative II","Endpoint Support Engineer","Service Desk Lead"]},
 {code:"identity",name:"Identity & Access",coverage:"Clerk, SAML, OAuth, MFA, organizations, account lifecycle and RBAC mapping",roles:["Identity Support Specialist","Identity & Access Administrator","Privileged Access Reviewer"]},
 {code:"cloud",name:"Cloud, Web & Integrations",coverage:"Vercel deployments, domains, DNS, APIs, webhooks, email routing, Stripe and approved third-party integrations",roles:["Web Operations Specialist","Integration Support Engineer","Cloud Platform Engineer","Site Reliability Engineer"]},
 {code:"security",name:"Security & Privacy Response",coverage:"Suspected compromise, phishing, privacy events, evidence preservation, containment and required escalation",roles:["Security Operations Analyst","Privacy Response Coordinator","Incident Commander"]},
 {code:"quality",name:"Quality, Knowledge & Workforce Enablement",coverage:"Interaction QA, knowledge management, training, scheduling, workforce analytics and continuous improvement",roles:["Support Quality Analyst","Knowledge Manager","Support Trainer","Workforce Coordinator","Support Operations Manager","Director of Enterprise Support"]},
] as const;

export const platformCoverage=[
 {platform:"Corporate Gateway",queue:"web_domains",services:["Public pages","appointments","contact routing","access-point navigation"]},
 {platform:"Tax Practitioner Virtual Office",queue:"virtual_office",services:["casework","document vault","RBAC","work queues"]},
 {platform:"eTRAC",queue:"etrac",services:["refund-status presentation","trace workflow","transcript-event display","escalation routing"]},
 {platform:"Ross Tax Pro University",queue:"university",services:["enrollment","LMS access","courses","certificates"]},
 {platform:"Ross E-Drive University",queue:"edrive",services:["student onboarding","parent-taught support","course progress","completion records"]},
 {platform:"Ross Prime Payroll & HR",queue:"payroll_hr",services:["employer onboarding","employee access","timekeeping","payroll case routing"]},
 {platform:"Ross PDF Editor",queue:"pdf_editor",services:["upload","OCR","form editing","export troubleshooting"]},
 {platform:"Tax Software & Transmittals",queue:"tax_operations",services:["software navigation","validation messages","acknowledgment routing","authorized practitioner escalation"]},
] as const;

export const positions=[
 {title:"Customer Service Representative I",persona:"Warm, composed, concise first-contact guide",owns:"Authentication, intake, documented answers, appointment and correct routing",never:"Tax advice, refund promises, credential collection, compliance overrides"},
 {title:"Customer Service Representative II",persona:"Experienced de-escalation and service-recovery professional",owns:"Complex contacts, callbacks, complaint recovery and cross-team coordination",never:"Representing assumptions as facts or altering controlled records"},
 {title:"Escalations Specialist",persona:"Ownership-driven resolution coordinator",owns:"Executive complaints, repeated failures, vulnerable-customer support and written resolution",never:"Suppressing adverse facts or bypassing legal/privacy review"},
 {title:"Tax Software Support Specialist",persona:"Precise product educator",owns:"Navigation, error reproduction, approved knowledge and practitioner handoff",never:"Selecting tax positions or telling a customer what to claim"},
 {title:"Product Support Specialist",persona:"Platform-specific workflow expert",owns:"Functional triage for assigned Ross platforms and reproducible defect reports",never:"Production fixes, database edits or unsupported workarounds"},
 {title:"IT Support Representative I",persona:"Patient, methodical service-desk technician",owns:"Endpoint, browser, session and connectivity runbooks",never:"Asking for passwords/MFA codes or installing unapproved software"},
 {title:"IT Support Representative II",persona:"Evidence-first technical investigator",owns:"Sanitized logs, complex incidents, vendor coordination and reversible recovery",never:"Unapproved production changes or secrets in tickets"},
 {title:"Identity & Access Administrator",persona:"Least-privilege control specialist",owns:"Clerk, SAML, OAuth, MFA, sessions, organizations and approved RBAC",never:"Approving own privileged access or bypassing separation of duties"},
 {title:"Integration Support Engineer",persona:"Contract-and-telemetry focused investigator",owns:"APIs, webhooks, gateways, idempotency and integration health",never:"Replaying financial or tax transmissions without approval"},
 {title:"Cloud Platform / SRE",persona:"Reliability and recovery engineer",owns:"Vercel, domains, runtime health, observability, incidents and rollback",never:"Unlogged emergency changes or destructive action without authority"},
 {title:"Security Operations Analyst",persona:"Containment-first security responder",owns:"Triage, evidence preservation, containment coordination and incident escalation",never:"Public attribution, evidence deletion or ordinary-ticket disclosure"},
 {title:"Support Quality Analyst",persona:"Fair, evidence-based coach",owns:"QA calibration, coaching, policy adherence and corrective-action verification",never:"Retaliatory scoring or live PII in training samples"},
 {title:"Knowledge Manager / Trainer",persona:"Plain-language policy translator",owns:"Versioned articles, curricula, certification and change communication",never:"Publishing unapproved legal, tax or security instructions"},
 {title:"Team Lead / Incident Commander",persona:"Impact-first operational leader",owns:"Queue health, approvals, P1/P2 command, status cadence and handoff",never:"Speculation, silent downgrades or closure without validation"},
 {title:"Director of Enterprise Support",persona:"Accountable cross-platform executive",owns:"Strategy, staffing, SLAs, vendor governance, risk acceptance and executive reporting",never:"Weakening mandatory controls for convenience"},
] as const;

export const priorityPolicy={
 P1:{label:"Critical",acknowledgeMinutes:5,updateMinutes:15,targetMinutes:60},
 P2:{label:"High",acknowledgeMinutes:15,updateMinutes:30,targetMinutes:240},
 P3:{label:"Normal",acknowledgeMinutes:60,updateMinutes:240,targetMinutes:1440},
 P4:{label:"Low",acknowledgeMinutes:240,updateMinutes:1440,targetMinutes:4320},
} as const;

export const seededTickets=[
 {id:"SUP-260901",priority:"P2",platform:"Identity & Access",subject:"Staff member cannot complete SSO",status:"triaged",next:"Verify domain, assignment and auth event; never request credentials."},
 {id:"SUP-260902",priority:"P3",platform:"Customer Care",subject:"Customer requests case-status explanation",status:"assigned",next:"Authenticate, state only recorded facts and document the contact."},
 {id:"SUP-260903",priority:"P3",platform:"PDF Editor",subject:"Document upload validation failed",status:"waiting customer",next:"Request sanitized error metadata through the secure channel."},
 {id:"SUP-260904",priority:"P2",platform:"Prime Payroll & HR",subject:"Employer payroll preview unavailable",status:"escalated",next:"Freeze submission, preserve run identifier and route to payroll product support."},
] as const;

export function recommendSupportAction(input:{queue:SupportQueue;priority:SupportPriority;summary:string}){
 const p=priorityPolicy[input.priority],s=input.summary.toLowerCase();
 const security=/breach|phish|malware|stolen|exposed|unauthorized|password|mfa|social security|ssn/.test(s);
 const tax=/guarantee|refund date|reverse.*810|remove.*570|what.*claim|increase.*refund/.test(s);
 const money=/card number|bank account|routing number|chargeback/.test(s);
 const steps=["Verify identity with the approved minimum-data flow.","Record facts, timestamps, impact and error identifiers; label assumptions as unverified.","Use the versioned knowledge article and perform only reversible, role-authorized actions."];
 if(security)steps.unshift("Stop ordinary troubleshooting; preserve evidence and escalate to Security & Privacy Response.");
 if(tax)steps.push("Do not provide a tax determination or release promise; route to an authorized tax practitioner.");
 if(money)steps.push("Do not collect full payment credentials; use the approved hosted payment workflow.");
 steps.push(`Acknowledge within ${p.acknowledgeMinutes} minutes; update at least every ${p.updateMinutes} minutes while active.`);
 return {classification:security?"security":input.queue,priority:input.priority,steps,requiresApproval:security||tax||input.priority==="P1",disclaimer:"Decision support only. Human verification, authorization, documentation and escalation remain mandatory."};
}
