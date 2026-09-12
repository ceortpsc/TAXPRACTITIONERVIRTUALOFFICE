BEGIN;

CREATE TABLE worker_groups(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  code text NOT NULL,
  name text NOT NULL,
  responsibilities jsonb NOT NULL DEFAULT '[]',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE worker_definitions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  group_id uuid REFERENCES worker_groups(id),
  code text NOT NULL,
  queue_name text NOT NULL,
  execution_mode text NOT NULL CHECK(execution_mode IN ('scheduled','event','hybrid')),
  risk text NOT NULL CHECK(risk IN ('standard','controlled','high')),
  responsibilities jsonb NOT NULL DEFAULT '[]',
  required_capabilities jsonb NOT NULL DEFAULT '[]',
  max_attempts integer NOT NULL DEFAULT 3 CHECK(max_attempts BETWEEN 1 AND 20),
  base_delay_seconds integer NOT NULL DEFAULT 30 CHECK(base_delay_seconds BETWEEN 1 AND 86400),
  concurrency_limit integer NOT NULL DEFAULT 1 CHECK(concurrency_limit BETWEEN 1 AND 1000),
  timeout_seconds integer NOT NULL DEFAULT 60 CHECK(timeout_seconds BETWEEN 1 AND 1800),
  dead_letter_enabled boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE worker_assignments(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  worker_definition_id uuid NOT NULL REFERENCES worker_definitions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  role_id uuid REFERENCES roles(id),
  responsibility text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CHECK(user_id IS NOT NULL OR role_id IS NOT NULL)
);

CREATE TABLE worker_runs(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  run_key text NOT NULL,
  environment app_environment NOT NULL,
  trigger_type text NOT NULL CHECK(trigger_type IN ('cron','event','manual','recovery')),
  requested_group text,
  status task_status NOT NULL DEFAULT 'queued',
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  summary jsonb NOT NULL DEFAULT '{}',
  UNIQUE(tenant_id, run_key)
);

CREATE TABLE worker_run_items(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  run_id uuid NOT NULL REFERENCES worker_runs(id) ON DELETE CASCADE,
  worker_definition_id uuid REFERENCES worker_definitions(id),
  worker_code text NOT NULL,
  status task_status NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  leased_until timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  last_error_code text,
  result jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX worker_run_queue ON worker_run_items(status, leased_until, started_at);
CREATE INDEX worker_run_history ON worker_runs(environment, created_at DESC);

CREATE TABLE worker_dead_letters(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  run_item_id uuid REFERENCES worker_run_items(id),
  worker_code text NOT NULL,
  idempotency_key text NOT NULL,
  error_code text NOT NULL,
  payload_hash text,
  attempts integer NOT NULL,
  first_failed_at timestamptz NOT NULL,
  dead_lettered_at timestamptz NOT NULL DEFAULT now(),
  resolution_status text NOT NULL DEFAULT 'open' CHECK(resolution_status IN ('open','replayed','resolved','discarded')),
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  resolution_note text
);

ALTER TABLE worker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_run_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_dead_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_worker_assignments ON worker_assignments
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);

CREATE POLICY tenant_isolation_worker_runs ON worker_runs
  USING (tenant_id IS NULL OR tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id IS NULL OR tenant_id=current_setting('app.tenant_id',true)::uuid);

CREATE POLICY tenant_isolation_worker_run_items ON worker_run_items
  USING (tenant_id IS NULL OR tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id IS NULL OR tenant_id=current_setting('app.tenant_id',true)::uuid);

CREATE POLICY tenant_isolation_worker_dead_letters ON worker_dead_letters
  USING (tenant_id IS NULL OR tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id IS NULL OR tenant_id=current_setting('app.tenant_id',true)::uuid);

COMMIT;
