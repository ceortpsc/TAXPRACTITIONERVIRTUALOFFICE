-- RTPSC Operational Control Plane read models.
-- Bind :tenant_id in the database adapter and SET LOCAL app.tenant_id before execution.

-- Latest deployment evidence by environment/provider.
select distinct on (environment, provider)
  deployment_evidence_id,
  environment,
  provider,
  provider_deployment_id,
  commit_sha,
  state,
  source_uri,
  observed_at
from ops_deployment_evidence
where tenant_id = :tenant_id
order by environment, provider, observed_at desc;

-- Latest health observation for each registered component.
select distinct on (component_key)
  health_observation_id,
  component_key,
  state,
  evidence_class,
  source,
  detail,
  correlation_id,
  observed_at
from ops_health_observation
where tenant_id = :tenant_id
order by component_key, observed_at desc;

-- Active incidents ordered by severity and age.
select
  incident_id,
  severity,
  title,
  status,
  correlation_id,
  source,
  started_at,
  mitigated_at,
  resolved_at
from ops_incident
where tenant_id = :tenant_id
  and status in ('OPEN','INVESTIGATING','MITIGATED')
order by
  case severity when 'P1' then 1 when 'P2' then 2 when 'P3' then 3 else 4 end,
  started_at asc;

-- Active quota reservations that have not expired.
select
  reservation_id,
  quota_key,
  resource_type,
  resource_id,
  amount,
  state,
  correlation_id,
  reserved_at,
  expires_at
from ops_quota_reservation
where tenant_id = :tenant_id
  and state in ('HELD','COMMITTED')
  and (expires_at is null or expires_at > now())
order by reserved_at asc;

-- Upcoming or active maintenance windows.
select
  maintenance_window_id,
  title,
  environment,
  starts_at,
  ends_at,
  state,
  approved_by,
  correlation_id
from ops_maintenance_window
where tenant_id = :tenant_id
  and state in ('APPROVED','ACTIVE')
  and ends_at >= now()
order by starts_at asc;

-- Append-only operator action evidence.
select
  ops_action_audit_id,
  actor_subject,
  action,
  target_type,
  target_id,
  state,
  reason,
  correlation_id,
  idempotency_key,
  before_hash,
  after_hash,
  occurred_at
from ops_action_audit
where tenant_id = :tenant_id
order by occurred_at desc
limit :limit;
