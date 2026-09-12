# RTPSC Operations Control Center

The Operations Control Center is an evidence-first control plane for deployment, health, security, optimization, quota, maintenance, support, topology, engines, workers, integrations, and persistence readiness.

## Surfaces

- `/operations` — authenticated control-plane UI for authorized roles.
- `/api/operations/[section]` — no-store evidence endpoint for one operations section.
- `/api/system/registry` — synchronized registry of routes, runtime engines, worker assignments, integrations, and persistence artifacts.
- `/api/health` — public minimal readiness probe; it reports configuration state without returning secrets.

## Authorization

Control-plane evidence requires one of: `owner`, `super_admin`, `firm_admin`, `compliance_officer`, or `auditor`. Authentication is enforced through Clerk Core 3 resource checks and the explicit protected-prefix route policy.

## Evidence policy

External or provider status is never inferred from design intent. Provider facts remain `UNKNOWN` or `CONFIGURATION_REQUIRED` until runtime or provider evidence exists. Database persistence is not considered durable until `DATABASE_URL` is configured and the relevant migration has been applied. Data-dependent workers remain gated until the durable worker adapter is configured.

## Persistence

- Migration `015_operational_control_plane.sql` — deployment evidence, health observations, quota policy/reservations, maintenance windows, incidents, topology, and append-only operator action evidence.
- Migration `016_tax_practitioner_master_files.sql` — Tax Practitioner Master File persistence.
- Migration `017_worker_control_plane.sql` — worker groups, assignments, runs, run items, and dead-letter evidence.
- `database/queries/control_plane.sql` — parameterized operational read models.

Tenant-bound operational tables enable row-level security and expect the database adapter to `SET LOCAL app.tenant_id` for the authenticated tenant before tenant-scoped operations.

## Production gates

A successful Vercel build validates compilation, type generation, route rendering, and framework integration. It does not prove database migrations, external IRS/payment connectivity, or durable worker execution. Those remain separately gated by verified configuration and provider evidence.
