-- Set app.tenant_id in the transaction before executing any tenant query.
-- Student dashboard: membership is resolved server-side; the browser cannot select tenant scope.
SELECT e.id AS enrollment_id,c.code,c.title,e.status,e.score,MAX(lp.last_activity_at) AS last_activity_at,COALESCE(AVG(lp.percent_complete),0) AS progress_percent
FROM enrollments e JOIN courses c ON c.id=e.course_id LEFT JOIN learning_progress lp ON lp.enrollment_id=e.id
WHERE e.tenant_id=current_setting('app.tenant_id')::uuid AND e.user_id=$1
GROUP BY e.id,c.code,c.title,e.status,e.score ORDER BY last_activity_at DESC NULLS LAST;

-- Claim student-success cases without double processing.
SELECT lp.id FROM learning_progress lp WHERE lp.tenant_id=current_setting('app.tenant_id')::uuid AND lp.status='active' AND lp.last_activity_at<now()-interval '7 days'
ORDER BY lp.last_activity_at FOR UPDATE SKIP LOCKED LIMIT 100;

-- Human academic decisions waiting for review.
SELECT ad.id,ad.decision_type,ad.subject_user_id,ad.facts,ad.created_at FROM academic_decisions ad
WHERE ad.tenant_id=current_setting('app.tenant_id')::uuid AND ad.status IN ('proposed','human_review','appealed')
ORDER BY ad.created_at FOR UPDATE SKIP LOCKED LIMIT 50;

-- Certificate gate: no credential may issue without human-approved completion decision.
SELECT EXISTS(SELECT 1 FROM academic_decisions ad WHERE ad.tenant_id=current_setting('app.tenant_id')::uuid AND ad.subject_user_id=$1 AND ad.decision_type='program_completion' AND ad.status='approved' AND ad.human_decision_by IS NOT NULL) AS credential_release_allowed;
