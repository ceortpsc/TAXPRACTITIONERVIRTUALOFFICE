# Production deployment evidence — Identity release

Date: 2026-09-05 UTC

## Release identity

- GitHub repository: `ceortpsc/TAXPRACTITIONERVIRTUALOFFICE`
- Promoted commit: `eb0e6719400fb0bf849c94b5f7747bc6c7e71c82`
- Vercel project: `prj_PBc91N58cpGGThaOxB3RbFB0p3Lo`
- Deployment: `dpl_yFD3ReTR7FqddbVnsEKbFk6FPuhx`
- Production URL: `https://tax-practitioner-virtual-office.vercel.app`
- Region: `iad1`
- Framework: Next.js 16.3.4
- Result: `READY`; production aliases assigned; alias error `null`

## Build evidence

Vercel CLI 59.11.7 downloaded 79 deployment files, installed dependencies, compiled successfully in 5.7 seconds, completed TypeScript validation in 3.6 seconds, generated all 14 pages, completed the build in 16 seconds, deployed outputs, and uploaded the build cache. Local `npm run check` also passed ESLint, TypeScript, and the production build.

## Route validation

| Route | Result | Evidence |
| --- | --- | --- |
| `/` | 200 | Public application rendered |
| `/refunds` | 200 | Fail-closed identity gate rendered because Clerk is not configured |
| `/casework` | 200 | Fail-closed identity gate rendered because Clerk is not configured |
| `/master-file` | 200 | Fail-closed identity gate rendered because Clerk is not configured |
| `/settings` | 200 | Fail-closed identity gate rendered because Clerk is not configured |
| `/sign-in` | 200 | Identity configuration state rendered |
| `/office` | 200 after redirect | Redirected to `/identity/setup-required`; protected content was not disclosed |
| `/identity/setup-required` | 200 | Setup gate rendered |
| `/api/health` | 200 | Application reported ready; dependency gates reported accurately |
| `/api/authorizations` | 200 | Masked authorization registry returned |
| `/api/andrea/policy` | 405 on GET | Expected: endpoint is POST-only |
| `/sitemap.xml` | 200 | XML returned |
| `/robots.txt` | 200 | Policy returned |
| `/route-registry.xml` | 200 | XML registry returned |

Runtime error and fatal log scan for the deployment returned no entries during the validation window.

## Build-warning remediation

- Node is pinned to `24.x`, matching the configured Vercel runtime, so future major Node releases cannot silently replace the production runtime.
- ESLint remains pinned to 9.39.5 because Next.js 16.3.4's bundled React lint plugins reject ESLint 10.10 at runtime. Upgrade is gated on a compatible `eslint-config-next` release; forcing ESLint 10 would disable a working quality gate.
- The only pending dependency install script, `unrs-resolver@1.12.2`, was traced to Next.js ESLint resolution. Its native-resolver postinstall is narrowly approved through `allowScripts`; no wildcard install-script permission is granted.

## Infrastructure and engine state

| Layer | State | Production evidence / gate |
| --- | --- | --- |
| Application runtime | Active | Vercel deployment `READY` |
| Public pages and XML | Active | HTTP route checks passed |
| Identity code | Deployed, fail-closed | Clerk SDK, proxy, sign-in, owner invitation script, and RBAC metadata logic built |
| Clerk SAML | Not configured | Publishable key, secret key, connection ID, IdP metadata, paid plan, email, and validation evidence absent |
| PostgreSQL | Not configured | `/api/health` reports `database: not_configured`; migrations were not executed without a database target |
| IRS API/transmission | Not configured | `/api/health` reports `irsApi: not_configured`; production sending remains prohibited |
| Stripe | Not configured | `/api/health` reports `stripe: not_configured`; payment execution remains prohibited |
| Owner invitation | Prepared, not sent | Requires Clerk secret and successful SAML test; no password stored |
| Owner phone | Pending verification | `+1 512-489-6749`; cannot be marked verified without Clerk verification |

## Vercel settings reconciliation

- On-demand concurrent builds: not changed. This is a paid-capacity dashboard control and was not exposed by the connected Vercel management interface.
- Skew protection: not changed or represented as enabled. The connected project inspection response does not expose this setting. Enable it in Project Settings → Advanced, then capture authoritative project-setting evidence.
- Build queueing was not observed for this release; direct production deployment initialized immediately.

## Required activation sequence

1. Provision a production PostgreSQL endpoint and encrypted `DATABASE_URL`; back up, run migrations 001–003 transactionally, verify schema locks and row-level-security policies, then record migration hashes.
2. Install Clerk through Vercel, configure `rosstaxsoftware.com` SAML metadata, verify email delivery and MFA, test break-glass access, and run the idempotent owner invitation script.
3. Install and separately validate IRS and Stripe production credentials. Passing a build is not proof of authorization or external connectivity.
4. Enable skew protection in Vercel and decide whether paid concurrent-build capacity is operationally justified.
5. Repeat authenticated end-to-end tests and archive the resulting identifiers, timestamps, outcomes, and approvals.
