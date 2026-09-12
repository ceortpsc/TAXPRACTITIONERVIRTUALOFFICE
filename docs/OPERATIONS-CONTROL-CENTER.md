# RTPSC Operations Control Center

## Scope

The Operations Control Center implements the operational navigation requested for the Tax Practitioner Virtual Office:

- Deployments
- Health & troubleshooting
- Security & compliance
- Optimization
- Quotas & reservations
- Maintenance
- Support
- App Topology (Preview)

The control center is intentionally evidence-first. Runtime facts may be `VERIFIED`; configured policy may be `READY`; missing external/provider evidence is `UNKNOWN` or `CONFIGURATION_REQUIRED`. The UI must never turn absence of evidence into a success state.

## Access control

`/operations` is a protected route. The server page and `/api/operations/[section]` both enforce identity. The operations surface is restricted to owner, super administrator, firm administrator, compliance officer, and auditor roles.

The API is `no-store` and returns `X-RTPSC-Evidence-Policy: provider-claims-require-evidence` so stale operational state is not silently cached as current.

## Evidence classes

| Class | Meaning |
| --- | --- |
| RUNTIME | Directly observed by the running application process |
| CONFIGURATION | Derived from presence/absence of required configuration references |
| PROVIDER_REPORTED | Supplied by a hosting/integration provider and never inferred |
| POLICY | RTPSC application or release policy |
| DESIGN_CONTROL | Approved topology, route, worker, or architectural control |

## Deployment behavior

The application recognizes Vercel runtime metadata when Vercel exposes it. Commit SHA and provider environment are reported as provider evidence only when the corresponding runtime variables exist. Production promotion remains outside this read-only console and must follow release approval policy.

## Health and security

Health consolidates application runtime evidence and configuration gates for PostgreSQL, identity, IRS integration, and audit signing. Security reuses the canonical security-readiness registry and explicitly states that engineering readiness is not an IRS certification.

## Optimization and quotas

Optimization shows measured process memory plus architecture-level controls. It does not invent latency, throughput, or availability percentages. Quotas are application policy limits unless a provider quota adapter supplies evidence; provider account quota therefore remains `UNKNOWN` by default.

## Maintenance and workers

Maintenance projects the registered worker directory and a preferred maintenance window. Long-running tasks remain guarded worker operations with bounded retry policy; the console does not bypass worker queues.

## Support

Support links the authenticated support console, guidance API, and request-correlation controls. Regulated identifiers are not exposed as diagnostic payloads.

## App topology

The topology preview is a design-control graph:

`Browser / Mobile -> Edge + Identity Gateway -> Versioned Application APIs -> Domain Services -> Private Connector Adapters -> Durable Worker Queues -> PostgreSQL + Evidence Store -> Append-only Audit Ledger`

The graph is architecture, not a claim that every external provider is currently reachable.

## Database migration

`database/migrations/015_operational_control_plane.sql` adds evidence records for deployments and health, quota policy/reservations, maintenance windows, incidents, topology nodes/edges, and append-only operations action audit records. Provider observations are stored as evidence rather than overwriting source records.

## Production promotion

Required release sequence:

1. CI lint, typecheck, security tests, security check, and Next.js build pass.
2. Preview deployment is reviewed.
3. Runtime evidence is checked for `UNKNOWN` and `CONFIGURATION_REQUIRED` conditions.
4. Database migration is reviewed before execution.
5. Production promotion receives the required independent approval.
6. Production health and security evidence are re-checked after promotion.

No production transmission or regulated external action is enabled merely by deploying this control center.
