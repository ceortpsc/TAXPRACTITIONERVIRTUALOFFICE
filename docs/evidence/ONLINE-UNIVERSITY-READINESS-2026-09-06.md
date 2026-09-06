# Online University Release Evidence — 2026-09-06

## Implemented

- Public online-university directory and institution pages.
- Protected `/learn` workspace.
- Public university/program/persona API.
- Authenticated organization-scoped AI tutor API.
- Eight governed AI faculty and staff persona definitions.
- University academic schema, RLS foundations, queries, workers, and human-decision gates.
- Clerk–Entra SAML and optional SCIM architecture documented from the supplied directive.

## Verification status

- Source lint, strict type checking, security tests, secret scan, and production build: pending final execution after this change set.
- GitHub immutable commit and Vercel production deployment: pending.
- Database migration 006: NOT APPLIED; no production database adapter is configured.
- Clerk production keys in Vercel: NOT VERIFIED.
- Vercel AI Gateway authentication, budget and Gemini request: NOT VERIFIED.
- University Entra tenant/application identifiers, claims, pilot users and SAML sign-in: NOT VERIFIED.
- SCIM Directory Sync and group-to-role mapping: DEFERRED until SAML pilot passes.
- Program approvals, catalog publication, enrollment, credential issuance and regulated claims: BLOCKED pending institutional/legal review.

AI personas are implemented as governed software identities; this record does not represent them as human employees or licensed professionals.
