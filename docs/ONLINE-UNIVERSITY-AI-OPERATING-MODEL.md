# Ross Online University AI Operating Model

## Scope

Ross Tax Pro University and Ross E-Drive University are designed as 100% online learning environments. AI personas may provide instruction, tutoring, objective grading, navigation, content drafting, progress monitoring, and operational recommendations. Humans remain accountable for policy, admissions exceptions, accommodations, discipline, appeals, subjective grades, completion decisions, credentials, finance, regulatory representations, and public commitments.

## Operating chain

1. Clerk authenticates the user and resolves the active Organization.
2. Server authorization resolves role, university, program, course, and resource scope.
3. The learning workspace loads only assigned records from the server-controlled tenant context.
4. AI input is bounded, redacted, audited, and routed through Vercel AI Gateway.
5. Persona policy restricts tools and prohibited actions.
6. Objective outcomes may be automated; consequential outcomes enter a human approval queue.
7. Worker definitions create alerts for inactivity, stale content, audit gaps, and AI-usage exceptions.

## Identity federation

Use Clerk Enterprise SSO with Microsoft Entra ID SAML for university users. Keep the connection disabled during configuration, scope it to approved domains or Clerk Organizations, require Entra assignment, map required claims, and pilot with assigned, unassigned, external, and cross-organization test users. Add SCIM Directory Sync only after SAML and tenant-isolation tests pass. Never map university groups to global corporate administrator roles.

## Production gates

- Clerk production keys must exist only in Vercel managed secrets.
- AI Gateway must have an authenticated OIDC or managed API-key path, model access, budget limits, and verified logs.
- Database migration 006 must be applied and verified before persistent academic records are enabled.
- Program authorization, catalog terms, tuition, credential wording, and regulatory status must be independently approved before publication or enrollment.
- Synthetic data only until privacy, security, retention, incident response, vendor, and applicable education controls are approved.
