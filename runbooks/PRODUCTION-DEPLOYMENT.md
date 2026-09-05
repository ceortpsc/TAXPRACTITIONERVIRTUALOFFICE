# Production deployment runbook

1. Confirm the approved legal-entity and DBA matrix.
2. Rotate every credential previously shared outside the secrets manager.
3. Create isolated development, preview, test, and production environments.
4. Configure database, identity, encrypted storage, queue, email, Stripe, and approved IRS integrations.
5. Run `scripts/runtime/preflight.mjs` and `npm run check`.
6. Apply database migrations with a verified backup and rollback plan.
7. Deploy preview and complete accessibility, security, RBAC, tenant-isolation, webhook, idempotency, and recovery tests.
8. Obtain compliance and owner approval.
9. Promote the same immutable artifact to production.
10. Validate `/api/health`, logs, traces, alerts, webhooks, callbacks, and a synthetic non-taxpayer workflow.
11. Record release evidence and monitor. Roll back on authentication, isolation, reconciliation, or acknowledgment failure.
