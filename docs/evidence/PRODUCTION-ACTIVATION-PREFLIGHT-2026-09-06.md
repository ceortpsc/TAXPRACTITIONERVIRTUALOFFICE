# Production activation preflight evidence — 2026-09-06

## Release decision

**Result: BLOCKED / FAIL-CLOSED.** The staging regulatory release is not approved for promotion to `main` because the live production runtime does not currently have a configured database or Clerk identity provider, and the repository is not yet managed by Prisma Migrate.

## Release candidates

- Repository: `ceortpsc/TAXPRACTITIONERVIRTUALOFFICE`
- Production deployment: `dpl_Crny1JsLxWuLzxyVcpzQYhf32xbb`
- Production commit: `819121d900ad207e1d54e3d26b33054daaa75a85`
- Staging candidate: `7fc84ea4a552aa9f8b8f599d4000c521eb91b779`
- Staging deployment: `dpl_6tpSRYFjWhGAgf6bkxgA939PC7Mc`
- Staging deployment state: `READY`

## Ordered activation gate

| Stage | State | Evidence / disposition |
|---|---|---|
| 1. Preflight | **FAIL** | Live production `/api/health` reports application `ready`, but database, identity, IRS API, and Stripe are `not_configured`. |
| 2. Backup | **BLOCKED** | No configured production `DATABASE_URL` is present in the running deployment, so no authoritative PostgreSQL backup target is available to this release process. No backup was claimed. |
| 3. Database migration | **BLOCKED** | Repository contains PostgreSQL SQL migrations in `database/migrations/*.sql`, but `package.json` has no Prisma dependency and the repository has no `prisma/schema.prisma` or Prisma migration history. `prisma migrate deploy` was therefore not executed. Existing databases must be baselined before Prisma Migrate is introduced. |
| 4. Clerk production configuration | **BLOCKED** | Live production health reports identity `not_configured`. Required environment values include `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`; SAML/owner activation remains separate evidence. |
| 5. Vercel production deployment | **NOT PROMOTED** | Candidate staging build is `READY`; production remains on the prior known-good `main` deployment. |
| 6. Domain / DNS verification | **PARTIAL** | Vercel project has `rosstaxsoftware.com` and `www.rosstaxsoftware.com` assigned with no alias error. The custom domain is fronted by Cloudflare and returned a managed challenge to automated probing. Authoritative A/CNAME/NS/TXT record values were not independently captured in this run. |
| 7. Gemini synthetic test | **BLOCKED** | `/api/ai/assist` requires configured Clerk and an authenticated organization session before invoking Vercel AI Gateway / Gemini. Identity is not configured in production, so no valid production synthetic was run. |
| 8. Fail-closed authorization tests | **PASS WITH LIMITATION** | Protected routing remains fail-closed while identity is absent. The regulatory API was corrected on staging to return `503 IDENTITY_NOT_CONFIGURED` before identity access when Clerk keys are missing. Vercel preview SSO intercepts external unauthenticated probes before the application response, so the deployed app-level 503 could not be externally observed in this run. |
| 9. Release evidence | **PASS** | This record captures exact candidate/deployment identifiers, verified blockers, and the no-promotion decision. |

## Prisma migration boundary

Official Prisma guidance uses `prisma migrate deploy` for applying existing Prisma migrations in staging/production and recommends running it through CI/CD. It does not detect schema drift and does not create migration history for an already-existing non-Prisma database. An existing production database must be baselined before adopting Prisma Migrate.

This application currently uses controlled raw PostgreSQL migrations. Converting it to Prisma Migrate is a separate migration-governance change and must not be inferred merely by adding a build command.

## Fail-closed correction in this release candidate

The regulatory readiness endpoint now checks for both Clerk runtime keys before calling the identity layer. Missing Clerk configuration returns `503 IDENTITY_NOT_CONFIGURED`; unauthenticated configured sessions return `401`; authenticated users without an allowed institutional role return `403`.

The security test now asserts the Clerk configuration gate and the 503/401/403 status contract.

## Conditions required before production promotion

1. Provision or identify the production PostgreSQL database and verify ownership, encryption, backup/restore capability, and `DATABASE_URL` injection into the production environment.
2. Produce a successful timestamped backup and restore-verification record.
3. Decide migration authority: continue the controlled SQL migration runner, or formally baseline the existing database into Prisma Migrate before using `prisma migrate deploy`.
4. Configure Clerk production keys, allowed origins/domains, MFA, owner/admin access, and any SAML connection; verify successful sign-in and break-glass behavior.
5. Configure the Vercel AI Gateway credential or validated OIDC path and run an authenticated Gemini synthetic with no sensitive taxpayer data.
6. Capture authoritative DNS records and verify apex/www routing, TLS, and Cloudflare-to-Vercel origin behavior.
7. Execute the complete quality/security suite with an available CI runner and archive its results.
8. Only then promote the candidate to `main`, verify the production deployment, re-run health/auth/Gemini probes, and append final release evidence.

## Claims boundary

No database backup, database migration, Clerk production activation, Gemini production invocation, or production promotion is represented as completed by this record. The release remains intentionally blocked until the above dependencies are authoritative and testable.
