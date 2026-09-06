export const roles=["owner","super_admin","compliance_officer","firm_admin","transmitter","tax_practitioner","case_manager","reviewer","support","university_admin","instructor","program_staff","admissions_officer","enrollment_specialist","registrar","academic_advisor","counselor","social_worker","financial_aid_officer","bursar","accountant","student_services_director","student","client","auditor"] as const;
export type Role=typeof roles[number];
export const permissions=["tenant.manage","users.manage","roles.manage","client.read","client.write","case.read","case.write","transcript.import","transcript.review","document.read","document.write","transmission.prepare","transmission.approve","transmission.send","refund_trace.prepare","refund_trace.approve","integration.manage","billing.manage","audit.read","training.manage","university.catalog.manage","university.course.teach","university.admissions.manage","university.enrollment.manage","university.records.review","university.progress.read","university.assessment.review","university.advising.manage","university.counseling.manage","university.social_services.manage","university.aid_readiness.manage","university.student_billing.manage","university.accounting.manage","university.communications.manage","support.ticket.read","support.ticket.write","support.chat.respond","support.escalate","support.knowledge.publish","support.incident.manage","identity.session.revoke"] as const;
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
 admissions_officer:["university.admissions.manage","university.enrollment.manage","document.read","document.write","support.ticket.read","support.ticket.write"],
 enrollment_specialist:["university.enrollment.manage","university.progress.read","document.read","document.write","support.ticket.read","support.ticket.write"],
 registrar:["university.enrollment.manage","university.records.review","university.progress.read","audit.read"],
 academic_advisor:["university.advising.manage","university.progress.read","document.read","support.ticket.read","support.ticket.write"],
 counselor:["university.counseling.manage","university.progress.read","support.ticket.read","support.ticket.write","support.escalate"],
 social_worker:["university.social_services.manage","support.ticket.read","support.ticket.write","support.escalate"],
 financial_aid_officer:["university.aid_readiness.manage","document.read","document.write","audit.read"],
 bursar:["university.student_billing.manage","billing.manage","document.read","document.write","audit.read"],
 accountant:["university.accounting.manage","university.student_billing.manage","billing.manage","audit.read"],
 student_services_director:["university.admissions.manage","university.enrollment.manage","university.records.review","university.progress.read","university.advising.manage","university.counseling.manage","university.social_services.manage","university.aid_readiness.manage","university.student_billing.manage","university.communications.manage","support.ticket.read","support.ticket.write","support.escalate","audit.read"],
 student:["university.progress.read"],client:["client.read","document.read","document.write"],auditor:["client.read","case.read","document.read","audit.read"]
};
export type Principal={id:string;tenantId:string;roles:Role[];mfaVerified:boolean;suspended?:boolean};
export type Resource={tenantId:string;ownerId?:string};
export function authorize(principal:Principal,permission:Permission,resource:Resource){if(principal.suspended||!principal.mfaVerified||principal.tenantId!==resource.tenantId)return false;return principal.roles.some(role=>grants[role].includes(permission));}
export function requiresIndependentApproval(preparerId:string,approverId:string){return preparerId!==approverId;}
