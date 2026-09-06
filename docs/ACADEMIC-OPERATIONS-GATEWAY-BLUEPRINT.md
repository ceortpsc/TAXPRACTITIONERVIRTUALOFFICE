# Academic Operations, Aid, Proctoring and Clearinghouse Blueprint

## Control plane

Application intake flows through draft, submission, identity review, document review, academic review, financial review, decision, and enrollment. Every transition is tenant-scoped, idempotent, versioned, audited, and role-authorized. Denial, waitlist, credit evaluation, aid packaging, records correction, withdrawal, and conferment require human decisions.

## Financial aid

FAFSA assistance is limited to education and readiness until the institution has documented federal Title IV eligibility and certification. The platform must never promise aid, calculate an official award, use a school code, originate/disburse aid, or exchange federal records before authorization, agreements, security controls, and official identifiers are verified. Student consent, professional judgment, verification, satisfactory academic progress, return-of-funds, reconciliation, and records retention require approved policies and qualified staff.

## Texas oversight

Degree programs require an approved institutional authority path. Career/vocational programs require a documented Texas Workforce Commission applicability or exemption determination. Homeschool curriculum support must not be marketed as TEA accreditation. GED preparation must refer learners to the official Texas testing and credential process.

## Clearinghouse adapters

Adapters are defined for Enrollment Reporting, DegreeVerify, DiplomaVerify, transcript exchange, and acknowledgement reconciliation. They remain disabled until a signed participation agreement, institution identifiers, secure transport, file specifications, testing certification, reporting calendar, privacy review, designated data owner, and rollback plan exist. Each outbound batch requires validation, hash, human approval, idempotency key, delivery receipt, acknowledgement reconciliation, error queue, and audit event.

## Proctoring

Modes are practice, live human, record-and-review, and approved vendor. High-stakes remote proctoring requires identity assurance, informed consent, accommodation handling, privacy impact assessment, retention limits, device/network requirements, incident procedures, human review of flags, appeals, vendor security review, and alternative arrangements. Automated signals cannot independently invalidate an exam or discipline a learner.

## Analytics

Dashboards may show application funnel, time in state, document completeness, enrollment yield, course participation, mastery, pacing, retention risk, credits attempted/earned, GPA, satisfactory academic progress status, proctoring review backlog, source freshness, transmission acceptance/rejection, and conferment readiness. Small-cell suppression, tenant boundaries, role filters, and no protected-attribute inference are mandatory.

## Production gates

1. Institutional and program authority documented.
2. Accreditation claims reviewed and supported.
3. Database migrations applied to the approved production database.
4. Clerk production authentication and tenant isolation verified.
5. FERPA/privacy/security program approved.
6. Program catalog, refund/cancellation, complaint, teach-out, accessibility, faculty, library, and records policies approved.
7. Title IV functions either officially authorized or technically disabled.
8. Clearinghouse integrations contracted, tested, and certified or disabled.
9. Proctoring vendor and alternatives approved or high-stakes remote proctoring disabled.
10. Synthetic end-to-end tests, monitoring, incident response, and rollback verified.

The current implementation is a fail-closed architecture. It is not evidence that any external authority, accreditor, aid program, clearinghouse, or proctoring provider has approved or connected the institution.
