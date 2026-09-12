BEGIN;

CREATE TABLE tax_master_files(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  client_id uuid REFERENCES clients(id),
  external_record_id uuid NOT NULL,
  owner_user_id uuid REFERENCES users(id),
  display_name text NOT NULL CHECK(char_length(display_name) BETWEEN 2 AND 120),
  client_type text NOT NULL CHECK(client_type IN ('individual','business','estate','trust','exempt')),
  tin_last4 char(4) NOT NULL CHECK(tin_last4 ~ '^[0-9]{4}$'),
  tax_period char(6) NOT NULL CHECK(tax_period ~ '^[0-9]{6}$'),
  mft text,
  status text NOT NULL DEFAULT 'intake' CHECK(status IN ('intake','research','reconciliation','review','hold','resolved','closed')),
  source_type text NOT NULL CHECK(source_type IN ('account_transcript','return_transcript','record_of_account','wage_income','authorized_document','manual_verified')),
  source_reference text,
  authorization_kind text NOT NULL,
  authorization_expires_at date,
  integrity_sha256 char(64) NOT NULL CHECK(integrity_sha256 ~ '^[0-9a-f]{64}$'),
  schema_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, external_record_id),
  UNIQUE(tenant_id, integrity_sha256)
);

CREATE INDEX tax_master_file_lookup ON tax_master_files(tenant_id, tax_period, status, created_at DESC);
CREATE INDEX tax_master_file_client_lookup ON tax_master_files(tenant_id, client_id, tax_period);

CREATE TABLE tax_master_file_checkpoints(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  master_file_id uuid NOT NULL REFERENCES tax_master_files(id) ON DELETE CASCADE,
  checkpoint_code text NOT NULL CHECK(checkpoint_code IN ('entity_tin','tax_period_mft','return_posting','credits_payments','refund_transactions','freeze_holds','offsets_liabilities','notices_controls','pending_transactions','statute_authorization')),
  state text NOT NULL DEFAULT 'not_available' CHECK(state IN ('not_available','pass','flag','hold')),
  evidence_document_id uuid REFERENCES documents(id),
  source_id uuid REFERENCES transcript_sources(id),
  notes text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(master_file_id, checkpoint_code)
);

CREATE INDEX tax_master_checkpoint_state ON tax_master_file_checkpoints(tenant_id, state, updated_at DESC);

CREATE TABLE tax_master_file_events(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  master_file_id uuid NOT NULL REFERENCES tax_master_files(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES users(id),
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_type text NOT NULL DEFAULT 'application',
  details jsonb NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tax_master_events_lookup ON tax_master_file_events(tenant_id, master_file_id, occurred_at DESC);

ALTER TABLE tax_master_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_master_file_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_master_file_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_tax_master_files ON tax_master_files
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);

CREATE POLICY tenant_isolation_tax_master_checkpoints ON tax_master_file_checkpoints
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);

CREATE POLICY tenant_isolation_tax_master_events ON tax_master_file_events
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);

COMMIT;
