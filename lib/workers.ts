export const workerDirectory=[
 {code:"support_sla_sweep",schedule:"daily",queue:"support",purpose:"Find overdue acknowledgments and updates; create escalation tasks.",idempotency:"support-sla:{ticket}:{window}"},
 {code:"integration_health",schedule:"daily",queue:"operations",purpose:"Evaluate configured integration health without exposing secrets.",idempotency:"integration-health:{provider}:{date}"},
 {code:"access_review",schedule:"daily",queue:"identity",purpose:"Flag suspended, expired or anomalous access assignments for human review.",idempotency:"access-review:{tenant}:{date}"},
 {code:"knowledge_freshness",schedule:"daily",queue:"compliance",purpose:"Flag stale source records and time-sensitive tax guidance.",idempotency:"knowledge-refresh:{source}:{revision}"},
 {code:"outbox_dispatch",schedule:"continuous_external",queue:"delivery",purpose:"Dispatch approved outbox events with retry, signature and dead-letter controls.",idempotency:"outbox:{topic}:{idempotency_key}"},
 {code:"audit_chain_verify",schedule:"daily",queue:"security",purpose:"Verify append-only audit-chain continuity and report gaps.",idempotency:"audit-chain:{tenant}:{date}"},
 {code:"university_student_success",schedule:"daily",queue:"education",purpose:"Flag stalled learning progress and create human-review outreach tasks.",idempotency:"student-success:{enrollment}:{date}"},
 {code:"university_content_freshness",schedule:"daily",queue:"education",purpose:"Flag lessons, sources, assessments and program rules due for human review.",idempotency:"content-freshness:{content}:{version}"},
 {code:"university_ai_usage_reconcile",schedule:"daily",queue:"education",purpose:"Reconcile AI learning-session status, token use and missing audit outcomes.",idempotency:"ai-learning-usage:{session}"},
] as const;
export function workerReadiness(){return workerDirectory.map(w=>({...w,state:"registered",execution:w.schedule==="daily"?"vercel_cron":"external_worker_required"}))}
