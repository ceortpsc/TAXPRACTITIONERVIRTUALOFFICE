# Runtime Engine and Worker Control Plane

## Purpose

This control plane defines how the Tax Practitioner Virtual Office separates request-time routing/rendering from regulated domain engines, AI advisory services, scheduled workers, and durable external worker adapters.

## Engine topology

The runtime registry in `lib/runtime/engine-registry.ts` is the authoritative source for engine identity, ownership, stage scope, criticality, execution model, dependencies, concurrency, and timeout policy.

Registered engines:

1. Edge Routing Engine — host mapping, request correlation, protected-resource routing.
2. Application Rendering Engine — App Router SSR/client hydration and cache boundaries.
3. Clerk Identity Engine — authentication, organization sessions, MFA/SSO lifecycle.
4. Tax Practitioner Master File Engine — normalized taxpayer master records and integrity seals.
5. Workflow Orchestration Engine — domain events, tasks, approvals, idempotency, dead-letter routing.
6. Background Worker Engine — scheduled/event jobs, retries, bounded concurrency, run evidence.
7. AI Assistant Engine — approved agent routing, prompt redaction, provider dispatch, human-review gates.
8. Audit and Security Engine — redaction, audit evidence, readiness, release controls.
9. Integration Adapter Engine — provider adapters, signed webhooks, idempotent transmission, health state.

## Staging and promotion

Supported stages are development, preview, test, and production. Every engine declares its stage scope. Production promotion is evidence-gated: identity, build/type checks, security tests, route smoke tests, runtime configuration, and rollback readiness must be verified before release.

Preview deployments are used for code validation. Production claims are based only on production deployment evidence and live route checks.

## Worker groups and responsibilities

`lib/workers.ts` defines six governed groups:

- Tax Operations — master-file reconciliation, tax-source freshness, exception routing.
- Client Service — SLA sweeps, outreach queues, escalation routing.
- Identity & Security — access review, audit-chain verification, security exceptions.
- Platform Operations — engine readiness, worker health, deployment evidence.
- Integrations & Delivery — provider health, outbox delivery, webhook recovery.
- Education Operations — student progress, content freshness, AI-learning usage reconciliation.

Every worker has a unique code, owning group, queue, responsibilities, required capabilities, idempotency contract, risk level, retry policy, concurrency limit, timeout, and dead-letter policy.

## Scheduling and background execution

The Vercel cron route `/api/cron/workers` executes stateless readiness workers locally and builds a governed run plan for all other workers. Data-dependent or long-running jobs are delegated only when both `WORKER_ADAPTER_URL` and `WORKER_ADAPTER_TOKEN` are configured.

The external adapter contract is intentionally fail-closed. Without a verified durable adapter, data-dependent workers report `adapter_required`; they do not claim that client records, tasks, transmissions, or audit rows were mutated.

## Master File persistence

The application layer creates a canonical sealed record using only the final four TIN digits. Durable PostgreSQL storage is defined by migration `016_tax_practitioner_master_files.sql`. Until a production database adapter is activated and verified, the API labels records as portable sealed records rather than claiming database persistence.

## Security and engineering principles

- deny by default for protected resources
- tenant isolation and row-level security for durable data
- no full taxpayer identifier accepted by the Master File creation surface
- bounded concurrency and timeouts
- explicit idempotency keys
- retry with dead-letter routing for high-risk workers
- separation of preparer, reviewer, and execution responsibilities
- no secret values returned by readiness endpoints
- no production completion claim without provider/runtime evidence
- human review required for consequential AI-assisted outputs
- append-only operational evidence for significant actions

## Scaling model

Request-time engines remain stateless/provider-managed where possible. Queue-backed engines are isolated from rendering and identity paths. Concurrency is declared per engine and worker so a saturated delivery or reconciliation queue cannot consume the entire web runtime. Persistent workers can be scaled independently behind the adapter contract without changing the public Next.js routing surface.
