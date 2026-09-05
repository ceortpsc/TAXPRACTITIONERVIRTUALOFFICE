# Production readiness evidence - September 5, 2026

## Deployment

- Project: `tax-practitioner-virtual-office`
- Platform: Vercel
- Environment: production
- Region: `iad1`
- Production URL: `https://tax-practitioner-virtual-office.vercel.app`
- Deployment ID: `dpl_EQ3hEJvAPmC3E9qdzeXJXtyxy4oD`
- Deployment state: `READY`
- Framework: Next.js 16.3.4 with Turbopack
- Source baseline: GitHub commit `b73bec4931950ab2f401bb15bd05433b262d2da3`

The first direct-manifest deployment failed before release because `npm ci` did not receive a complete lockfile. The production manifest was corrected to use a manifest-safe install command. GitHub CI continues to use the canonical committed `package-lock.json`.

## Live route evidence

All checks were executed against the production alias at `2026-09-05T13:04:06.498Z`.

| Route | HTTP | Content type | Bytes | Result |
|---|---:|---|---:|---|
| `/` | 200 | `text/html` | 19,842 | PASS |
| `/refunds` | 200 | `text/html` | 13,098 | PASS |
| `/casework` | 200 | `text/html` | 12,300 | PASS |
| `/master-file` | 200 | `text/html` | 12,775 | PASS |
| `/settings` | 200 | `text/html` | 18,051 | PASS |
| `/sitemap.xml` | 200 | `application/xml` | 883 | PASS |
| `/robots.txt` | 200 | `text/plain` | 156 | PASS |
| `/route-registry.xml` | 200 | `application/xml` | 2,108 | PASS |
| `/schemas/route-registry.xsd` | 200 | `application/xml` | 1,565 | PASS |
| `/opensearch.xml` | 200 | `application/xml` | 381 | PASS |
| `/api/health` | 200 | `application/json` | 200 | PASS |

Vercel runtime error scan: no runtime errors found in the selected one-hour post-deployment window.

## Readiness boundaries

Public pages, XML discovery, schema delivery, and the application health endpoint are operational. Database, authentication, IRS, Stripe, and taxpayer-data functions remain configuration-gated and are not represented as active until credentials, infrastructure, migrations, and end-to-end test evidence exist.
