# Security release evidence — 2026-09-06

## Scope

Release 0.2.0 adds centralized sensitive-data redaction, AES-256-GCM authenticated encryption envelopes, secure XML input gates, security response headers, a public non-secret readiness contract, schema-locked database security tables, key/certificate operations guidance, and staged firewall recommendations.

## Verification record

| Check | Result | Evidence |
|---|---|---|
| ESLint | PASS | `npm run lint` exited 0 |
| TypeScript | PASS | `tsc --noEmit` exited 0 |
| Security unit tests | PASS | 3/3: redaction, encryption round-trip/tamper rejection, hostile XML rejection |
| Static secret scan | PASS | No private-key blocks, live Stripe secrets, or SSN-shaped values |
| Production dependency audit | PASS | `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities |
| Next.js production build | PASS | Next.js 16.3.4 compiled and generated 14 pages; `/api/security/readiness` registered |
| Database migration | VALIDATED, NOT APPLIED | `004_security_envelopes.sql` is schema-locked; no configured production database exists |
| Managed encryption key | GATED | Requires `ENCRYPTION_KEY_ID` and `ENCRYPTION_KEY_VERSION` in an approved KMS/HSM |
| Audit signing key | GATED | Requires `AUDIT_SIGNING_KEY_ID` in an approved KMS/HSM |
| Certificate reference | GATED | Requires `TLS_CERTIFICATE_REFERENCE` after certificate validation |
| Firewall policy | STAGED | Log-only recommendations supplied; publication requires owner review |

## Claims boundary

This is verifiable implementation and deployment evidence, not an IRS certification. Authority to transmit, suitability status, assurance testing, written security-program governance, incident response, privacy review, and independent assessment remain separate production gates.

## Expected production probes

- `GET /api/health` returns application readiness without secrets.
- `GET /api/security/readiness` returns implemented and gated controls without key values.
- `GET /route-registry.xml` includes the security readiness route.
- Response headers include CSP, HSTS, anti-framing, MIME-sniffing prevention, permissions policy, and cross-origin isolation controls.
