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

- Source lint, strict type checking, five security/governance tests, static secret scan, route generation, and production build: VERIFIED on 2026-09-06 UTC.
- GitHub source release: VERIFIED at commit `11798295d783a0d8a82dbd815525a9c34a440480` on `main` and `staging`.
- Vercel production build: VERIFIED READY as deployment `dpl_6PeRxfjSRUd7XhTJwqMajPxEEdwc`; Node.js lambdas ran in `iad1` and generated 46 pages.
- Vercel deployment alias validation: VERIFIED HTTP 200 for `/universities`, both university detail pages, and `/api/universities` on `tax-practitioner-virtual-office.vercel.app`.
- Protected `/learn`: VERIFIED unavailable without configured production identity; current request resolves to the fail-closed identity setup route.
- Canonical `rosstaxsoftware.com` route: BLOCKED. Live request returned a third-party 403 challenge rather than the Vercel application; `www` could not be fetched. DNS/canonical routing is not verified.
- Database migration 006: NOT APPLIED; no production database adapter is configured.
- Clerk production keys in Vercel: NOT CONFIGURED at the time of validation; authenticated learning and tutor execution remain fail closed.
- Vercel AI Gateway authentication, budget and Gemini request: NOT VERIFIED.
- University Entra tenant/application identifiers, claims, pilot users and SAML sign-in: NOT VERIFIED.
- SCIM Directory Sync and group-to-role mapping: DEFERRED until SAML pilot passes.
- Program approvals, catalog publication, enrollment, credential issuance and regulated claims: BLOCKED pending institutional/legal review.

AI personas are implemented as governed software identities; this record does not represent them as human employees or licensed professionals.

## Rollback

Immediate rollback candidate: Vercel deployment `dpl_4iZTYXjY9fyfgsLYLP7TcKgJunqS` from commit `dea47f9a34ac45922a5977497c26ddf2a4d11a8a`. Roll back from Vercel Deployments without deleting users, data, audit records, the Clerk development instance, or release evidence.
