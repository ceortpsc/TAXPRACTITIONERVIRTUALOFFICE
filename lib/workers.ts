export const workerDirectory=[
 {code:"support_sla_sweep",schedule:"daily",queue:"support",purpose:"Find overdue acknowledgments and updates; create escalation tasks.",idempotency:"support-sla:{ticket}:{window}"},
 {code:"integration_health",schedule:"daily",queue:"operations",purpose:"Evaluate configured integration health without exposing secrets.",idempotency:"integration-health:{provider}:{date}"},
 {code:"access_review",schedule:"daily",queue:"identity",purpose:"Flag suspended, expired or anomalous access assignments for human review.",idempotency:"access-review:{tenant}:{date}"},
 {code:"knowledge_freshness",schedule:"daily",queue:"compliance",purpose:"Flag stale source records and time-sensitive tax guidance.",idempotency:"knowledge-refresh:{source}:{revision}"},
 {code:"outbox_dispatch",schedule:"continuous_external",queue:"delivery",purpose:"Dispatch approved outbox events with retry, signature and dead-letter controls.",idempotency:"outbox:{topic}:{idempotency_key}"},
 {code:"audit_chain_verify",schedule:"daily",queue:"security",purpose:"Verify append-only audit-chain continuity and report gaps.",idempotency:"audit-chain:{tenant}:{date}"},
] as const;
export function workerReadiness(){return workerDirectory.map(w=>({...w,state:"registered",execution:w.schedule==="daily"?"vercel_cron":"external_worker_required"}))}
