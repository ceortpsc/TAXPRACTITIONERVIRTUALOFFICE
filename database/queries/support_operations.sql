-- Atomic queue claim: call inside a transaction after setting app.tenant_id.
SELECT id FROM support_tickets WHERE tenant_id=$1 AND assigned_user_id IS NULL AND status IN('received','classified','routed') ORDER BY priority,created_at FOR UPDATE SKIP LOCKED LIMIT 1;

-- SLA exceptions for escalation workers.
SELECT ticket_number,priority,status,acknowledge_due_at,update_due_at,resolution_due_at FROM support_tickets WHERE tenant_id=$1 AND status NOT IN('resolved','closed') AND (acknowledge_due_at<now() OR update_due_at<now() OR resolution_due_at<now()) ORDER BY priority,created_at;

-- Claim due worker runs with bounded concurrency.
SELECT wr.id FROM worker_runs wr JOIN worker_definitions wd ON wd.id=wr.worker_id WHERE wr.tenant_id=$1 AND wd.enabled AND wr.status IN('queued','ready') ORDER BY wr.id FOR UPDATE SKIP LOCKED LIMIT $2;

-- Agent activity awaiting human approval.
SELECT ar.id,ap.code,ar.decision,ar.status,ar.started_at FROM ai_agent_runs ar JOIN ai_agent_profiles ap ON ap.id=ar.agent_profile_id WHERE ar.tenant_id=$1 AND ar.status='pending_approval' ORDER BY ar.started_at;

-- Knowledge freshness control.
SELECT source_code,title,authority,url,last_verified_at,expires_at FROM knowledge_sources WHERE tenant_id=$1 AND status='active' AND (last_verified_at IS NULL OR last_verified_at<now()-interval '30 days' OR expires_at<now()) ORDER BY expires_at NULLS FIRST;
