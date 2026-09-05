-- Open case queue with next action and evidence counts
SELECT c.case_number,c.title,c.case_type,c.status,c.priority,c.follow_up_at,c.next_action,count(DISTINCT d.id) AS documents,count(DISTINCT t.id) FILTER(WHERE t.status NOT IN('completed','cancelled')) AS open_tasks FROM cases c LEFT JOIN documents d ON d.case_id=c.id LEFT JOIN tasks t ON t.case_id=c.id WHERE c.tenant_id=$1 AND c.status NOT IN('resolved','closed') GROUP BY c.id ORDER BY c.priority,c.follow_up_at NULLS FIRST;

-- Active TC 570/810 candidates. Final determination remains a reviewed engine result.
WITH latest AS(SELECT case_id,transaction_code,max(transaction_date) event_date FROM transcript_events WHERE tenant_id=$1 AND transaction_code IN(570,571,572,810,811) GROUP BY case_id,transaction_code) SELECT c.case_number,max(event_date) FILTER(WHERE transaction_code=570) tc570,max(event_date) FILTER(WHERE transaction_code IN(571,572)) tc570_release,max(event_date) FILTER(WHERE transaction_code=810) tc810,max(event_date) FILTER(WHERE transaction_code=811) tc810_release FROM cases c JOIN latest l ON l.case_id=c.id WHERE c.tenant_id=$1 GROUP BY c.id;

-- Transmission readiness, enforcing independent approval and active integration.
SELECT tr.id,tr.system,tr.environment,tr.status,(tr.prepared_by IS DISTINCT FROM tr.approved_by AND tr.approved_by IS NOT NULL) independent_approval,(i.status='active') integration_active FROM transmissions tr LEFT JOIN integrations i ON i.tenant_id=tr.tenant_id AND i.provider='irs' AND i.environment=tr.environment WHERE tr.tenant_id=$1 AND tr.status IN('validated','awaiting_approval','approved','queued');

-- Due automation work for workers using SKIP LOCKED inside a transaction.
SELECT id FROM tasks WHERE status IN('queued','ready') AND (due_at IS NULL OR due_at<=now()) ORDER BY due_at NULLS FIRST,created_at FOR UPDATE SKIP LOCKED LIMIT $1;
