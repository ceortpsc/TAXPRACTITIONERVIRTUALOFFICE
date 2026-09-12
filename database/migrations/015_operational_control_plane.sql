-- RTPSC Operational Control Plane
-- Evidence-first operational records for deployments, health, quotas, maintenance,
-- incidents, topology, and append-only operator actions.

create table if not exists ops_deployment_evidence (
  deployment_evidence_id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  environment text not null check (environment in ('local','development','alpha','beta','staging','preview','production')),
  provider text not null,
  provider_deployment_id text,
  commit_sha text,
  state text not null check (state in ('UNKNOWN','QUEUED','BUILDING','READY','FAILED','CANCELED')),
  source_uri text,
  evidence_hash text,
  observed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists ops_deployment_evidence_env_observed_idx
  on ops_deployment_evidence(environment, observed_at desc);

create table if not exists ops_health_observation (
  health_observation_id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  component_key text not null,
  state text not null check (state in ('VERIFIED','READY','DEGRADED','CONFIGURATION_REQUIRED','UNKNOWN')),
  evidence_class text not null check (evidence_class in ('RUNTIME','CONFIGURATION','PROVIDER_REPORTED','POLICY','DESIGN_CONTROL')),
  source text not null,
  correlation_id text,
  detail text not null,
  evidence_hash text,
  observed_at timestamptz not null default now()
);

create index if not exists ops_health_observation_component_idx
  on ops_health_observation(component_key, observed_at desc);

create table if not exists ops_quota_policy (
  quota_policy_id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  quota_key text not null,
  scope text not null,
  hard_limit bigint,
  soft_limit bigint,
  unit text not null,
  source text not null,
  effective_at timestamptz not null default now(),
  expires_at timestamptz,
  check (hard_limit is null or hard_limit >= 0),
  check (soft_limit is null or soft_limit >= 0),
  unique (tenant_id, quota_key, scope, effective_at)
);

create table if not exists ops_quota_reservation (
  reservation_id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  quota_key text not null,
  resource_type text not null,
  resource_id text not null,
  amount bigint not null check (amount > 0),
  state text not null check (state in ('HELD','COMMITTED','RELEASED','EXPIRED','CANCELED')),
  correlation_id text not null,
  idempotency_key text not null,
  reserved_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (tenant_id, idempotency_key)
);

create index if not exists ops_quota_reservation_state_idx
  on ops_quota_reservation(state, expires_at);

create table if not exists ops_maintenance_window (
  maintenance_window_id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  title text not null,
  environment text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  state text not null check (state in ('DRAFT','REVIEW','APPROVED','ACTIVE','COMPLETED','CANCELED')),
  approved_by text,
  approval_reason text,
  correlation_id text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists ops_maintenance_window_state_idx
  on ops_maintenance_window(state, starts_at);

create table if not exists ops_incident (
  incident_id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  severity text not null check (severity in ('P1','P2','P3','P4')),
  title text not null,
  status text not null check (status in ('OPEN','INVESTIGATING','MITIGATED','RESOLVED','CLOSED')),
  correlation_id text not null,
  source text not null,
  started_at timestamptz not null default now(),
  mitigated_at timestamptz,
  resolved_at timestamptz,
  postmortem_ref text
);

create index if not exists ops_incident_status_idx
  on ops_incident(status, severity, started_at desc);

create table if not exists ops_topology_node (
  topology_node_id uuid primary key default gen_random_uuid(),
  node_key text not null unique,
  display_name text not null,
  node_type text not null,
  evidence_class text not null default 'DESIGN_CONTROL',
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists ops_topology_edge (
  topology_edge_id uuid primary key default gen_random_uuid(),
  source_node_key text not null references ops_topology_node(node_key),
  target_node_key text not null references ops_topology_node(node_key),
  protocol text,
  direction text not null default 'OUTBOUND',
  policy_gate text,
  active boolean not null default true,
  unique(source_node_key, target_node_key, protocol)
);

create table if not exists ops_action_audit (
  ops_action_audit_id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_subject text not null,
  action text not null,
  target_type text not null,
  target_id text,
  state text not null check (state in ('REQUESTED','HELD','APPROVED','EXECUTED','REJECTED','FAILED')),
  reason text not null,
  correlation_id text not null,
  idempotency_key text,
  before_hash text,
  after_hash text,
  occurred_at timestamptz not null default now()
);

create index if not exists ops_action_audit_correlation_idx
  on ops_action_audit(correlation_id, occurred_at desc);
create unique index if not exists ops_action_audit_idempotency_idx
  on ops_action_audit(tenant_id, idempotency_key)
  where idempotency_key is not null;

-- Tenant isolation for tenant-bound operational evidence.
alter table ops_deployment_evidence enable row level security;
alter table ops_health_observation enable row level security;
alter table ops_quota_policy enable row level security;
alter table ops_quota_reservation enable row level security;
alter table ops_maintenance_window enable row level security;
alter table ops_incident enable row level security;
alter table ops_action_audit enable row level security;

-- Application sessions must SET LOCAL app.tenant_id to the authenticated tenant UUID.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = current_schema() and tablename = 'ops_deployment_evidence' and policyname = 'ops_deployment_tenant') then
    create policy ops_deployment_tenant on ops_deployment_evidence using (tenant_id::text = current_setting('app.tenant_id', true)) with check (tenant_id::text = current_setting('app.tenant_id', true));
  end if;
  if not exists (select 1 from pg_policies where schemaname = current_schema() and tablename = 'ops_health_observation' and policyname = 'ops_health_tenant') then
    create policy ops_health_tenant on ops_health_observation using (tenant_id::text = current_setting('app.tenant_id', true)) with check (tenant_id::text = current_setting('app.tenant_id', true));
  end if;
  if not exists (select 1 from pg_policies where schemaname = current_schema() and tablename = 'ops_quota_policy' and policyname = 'ops_quota_policy_tenant') then
    create policy ops_quota_policy_tenant on ops_quota_policy using (tenant_id::text = current_setting('app.tenant_id', true)) with check (tenant_id::text = current_setting('app.tenant_id', true));
  end if;
  if not exists (select 1 from pg_policies where schemaname = current_schema() and tablename = 'ops_quota_reservation' and policyname = 'ops_quota_reservation_tenant') then
    create policy ops_quota_reservation_tenant on ops_quota_reservation using (tenant_id::text = current_setting('app.tenant_id', true)) with check (tenant_id::text = current_setting('app.tenant_id', true));
  end if;
  if not exists (select 1 from pg_policies where schemaname = current_schema() and tablename = 'ops_maintenance_window' and policyname = 'ops_maintenance_tenant') then
    create policy ops_maintenance_tenant on ops_maintenance_window using (tenant_id::text = current_setting('app.tenant_id', true)) with check (tenant_id::text = current_setting('app.tenant_id', true));
  end if;
  if not exists (select 1 from pg_policies where schemaname = current_schema() and tablename = 'ops_incident' and policyname = 'ops_incident_tenant') then
    create policy ops_incident_tenant on ops_incident using (tenant_id::text = current_setting('app.tenant_id', true)) with check (tenant_id::text = current_setting('app.tenant_id', true));
  end if;
  if not exists (select 1 from pg_policies where schemaname = current_schema() and tablename = 'ops_action_audit' and policyname = 'ops_action_audit_tenant') then
    create policy ops_action_audit_tenant on ops_action_audit for select using (tenant_id::text = current_setting('app.tenant_id', true));
    create policy ops_action_audit_insert on ops_action_audit for insert with check (tenant_id::text = current_setting('app.tenant_id', true));
  end if;
end $$;

-- Intentionally no UPDATE/DELETE policy for ops_action_audit.
-- Provider facts are inserted as evidence; dashboards must not overwrite provider source records.
