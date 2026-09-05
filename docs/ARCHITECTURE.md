# Platform architecture and automation contract

## Runtime layers

1. Edge and web: TLS, rate limiting, bot protection, secure headers, request IDs.
2. Identity: OIDC/OAuth 2.0, phishing-resistant MFA, session revocation, recovery controls.
3. Application: Next.js App Router, server-side policy checks, validated route handlers.
4. Domain: tenant, client, authorization, case, transcript, refund, notice, document, task, transmission, acknowledgment, payment, training, and audit modules.
5. Data: PostgreSQL-compatible transactional store, encrypted object vault, append-only audit events, queue/outbox, cache.
6. Integration: IRS-approved interfaces only, Stripe, email/SMS, storage, identity, and signed webhooks.
7. Delivery: GitHub Actions, dependency review, tests, preview, approval, production promotion, monitoring, and rollback.

## RBAC and separation of duties

Policy is deny-by-default, tenant-scoped, MFA-gated, and server-enforced. UI visibility is never authorization. A preparer cannot approve the same transmission. High-risk actions require a second authorized principal and an immutable audit event. Client access is restricted to records explicitly owned or shared under the same tenant.

## Pipeline contract

Every inbound request receives a correlation ID. Every command has an idempotency key. Domain changes and outbound messages use a transactional outbox. Workers lease tasks, retry with bounded exponential backoff, and move exhausted work to a dead-letter queue. Webhooks require signature verification, timestamp tolerance, replay protection, schema validation, and tenant resolution.

Transmission moves only through: draft → validated → awaiting approval → approved → queued → sent → acknowledged → accepted/rejected. Any identity, authority, environment, schema, signature, or reconciliation failure moves the item to quarantine.

## Required production resources

- separate development, preview, test, and production environments
- managed relational database with point-in-time recovery
- KMS-backed secrets and encryption keys
- private encrypted object storage with malware scanning
- durable queue, scheduler, webhook receiver, and dead-letter queue
- centralized logs, metrics, traces, alerting, and audit export
- backups, restore testing, incident response, retention, legal hold, and vendor review

No external integration is considered active until credentials, scopes, callback URLs, signatures, sandbox tests, production approval, monitoring, and rollback have all been verified.
