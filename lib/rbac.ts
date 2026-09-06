export const roles=["owner","super_admin","compliance_officer","firm_admin","transmitter","tax_practitioner","case_manager","reviewer","support","university_admin","instructor","program_staff","registrar","student","client","auditor"] as const;
export type Role=typeof roles[number];
export const permissions=["tenant.manage","users.manage","roles.manage","client.read","client.write","case.read","case.write","transcript.import","transcript.review","document.read","document.write","transmission.prepare","transmission.approve","transmission.send","refund_trace.prepare","refund_trace.approve","integration.manage","billing.manage","audit.read","training.manage","university.catalog.manage","university.course.teach","university.enrollment.manage","university.records.review","university.progress.read","university.assessment.review","support.ticket.read","support.ticket.write","support.chat.respond","support.escalate","support.knowledge.publish","support.incident.manage","identity.session.revoke"] as const;
export type Permission=typeof permissions[number];
const grants:Record<Role,readonly Permission[]>={
 owner:permissions,super_admin:permissions,
 compliance_officer:["client.read","case.read","case.write","transcript.review","document.read","transmission.approve","refund_trace.approve","audit.read","training.manage"],
 firm_admin:["users.manage","client.read","client.write","case.read","case.write","document.read","document.write","transmission.prepare","refund_trace.prepare","integration.manage","billing.manage","audit.read","support.ticket.read","support.ticket.write","support.chat.respond","support.escalate","support.knowledge.publish","support.incident.manage","identity.session.revoke"],
 transmitter:["client.read","case.read","transcript.review","document.read","transmission.prepare","transmission.send","audit.read"],
 tax_practitioner:["client.read","client.write","case.read","case.write","transcript.import","transcript.review","document.read","document.write","transmission.prepare","refund_trace.prepare"],
 case_manager:["client.read","case.read","case.write","transcript.review","document.read","document.write","refund_trace.prepare"],
 reviewer:["client.read","case.read","transcript.review","document.read","transmission.approve","refund_trace.approve","audit.read"],
 support:["client.read","case.read","case.write","support.ticket.read","support.ticket.write","support.chat.respond","support.escalate"],
 university_admin:["users.manage","training.manage","university.catalog.manage","university.course.teach","university.enrollment.manage","university.records.review","university.progress.read","university.assessment.review","audit.read"],
 instructor:["university.course.teach","university.progress.read","university.assessment.review","document.read"],
 program_staff:["university.enrollment.manage","university.progress.read","support.ticket.read","support.ticket.write"],
 registrar:["university.enrollment.manage","university.records.review","university.progress.read","audit.read"],
 student:["university.progress.read"],client:["client.read","document.read","document.write"],auditor:["client.read","case.read","document.read","audit.read"]
};
export type Principal={id:string;tenantId:string;roles:Role[];mfaVerified:boolean;suspended?:boolean};
export type Resource={tenantId:string;ownerId?:string};
export function authorize(principal:Principal,permission:Permission,resource:Resource){if(principal.suspended||!principal.mfaVerified||principal.tenantId!==resource.tenantId)return false;return principal.roles.some(role=>grants[role].includes(permission));}
export function requiresIndependentApproval(preparerId:string,approverId:string){return preparerId!==approverId;}
