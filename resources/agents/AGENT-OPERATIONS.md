# Agent operations handbook

Agents operate through scoped tools, not shared credentials. Each action carries actor, tenant, case, purpose, source, policy decision, timestamp, correlation ID, and outcome. Tool results are authoritative; narrative claims are not.

Agent types: intake coordinator, transcript analyst, notice classifier, refund trace assistant, compliance reviewer, transmission preparer, acknowledgment monitor, billing assistant, training coach, and audit reporter. Each receives only the minimum permissions in `lib/rbac.ts`.

Trigger handlers must be idempotent. Failed calls use bounded retries, then dead-letter routing. Human approval expires after material input changes. Agents cannot approve their own work.
