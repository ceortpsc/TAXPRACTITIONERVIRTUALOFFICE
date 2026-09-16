BEGIN;

-- RTPSC evidence ledger
-- Immutable source artifacts are stored outside PostgreSQL; this ledger stores provenance,
-- cryptographic hashes, correlations, and append-only chain-of-custody observations.

CREATE TABLE evidence_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  client_id uuid REFERENCES clients(id),
  case_id uuid REFERENCES cases(id),
  provider text NOT NULL,
  source_system text NOT NULL,
  artifact_type text NOT NULL,
  external_reference text,
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  object_key text NOT NULL,
  mime_type text,
  size_bytes bigint CHECK(size_bytes IS NULL OR size_bytes >= 0),
  sha256 char(64) NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),
  provider_hash text,
  source_created_at timestamptz,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  acquisition_method text NOT NULL CHECK(acquisition_method IN ('provider_api','webhook','secure_upload','mailbox_export','runtime_capture','user_provided','migration_import')),
  evidence_class text NOT NULL CHECK(evidence_class IN ('PROVIDER_NATIVE','RUNTIME','NETWORK','USER_PROVIDED','DERIVED')),
  verification_status text NOT NULL DEFAULT 'ACQUIRED' CHECK(verification_status IN ('ACQUIRED','HASH_VERIFIED','PROVIDER_REPORTED','PROVIDER_VERIFIED','DISPUTED','INVALID')),
  immutable boolean NOT NULL DEFAULT true CHECK(immutable),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, sha256)
);

CREATE INDEX evidence_artifacts_case_time_idx ON evidence_artifacts(tenant_id, case_id, acquired_at DESC);
CREATE INDEX evidence_artifacts_provider_time_idx ON evidence_artifacts(tenant_id, provider, acquired_at DESC);
CREATE INDEX evidence_artifacts_correlation_idx ON evidence_artifacts(tenant_id, correlation_id);

CREATE TABLE evidence_chain_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  artifact_id uuid NOT NULL REFERENCES evidence_artifacts(id),
  event_type text NOT NULL CHECK(event_type IN ('ACQUIRED','HASH_VERIFIED','COPIED','EXPORTED','VIEWED','CORRELATED','PROVIDER_REPORTED','PROVIDER_VERIFIED','DISPUTED')),
  actor_user_id uuid REFERENCES users(id),
  actor_subject text,
  previous_chain_hash char(64) CHECK(previous_chain_hash IS NULL OR previous_chain_hash ~ '^[0-9a-f]{64}$'),
  event_hash char(64) NOT NULL CHECK(event_hash ~ '^[0-9a-f]{64}$'),
  reason text,
  correlation_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX evidence_chain_artifact_idx ON evidence_chain_events(tenant_id, artifact_id, occurred_at, id);
CREATE INDEX evidence_chain_correlation_idx ON evidence_chain_events(tenant_id, correlation_id, occurred_at);

CREATE TABLE evidence_correlations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  artifact_id uuid NOT NULL REFERENCES evidence_artifacts(id),
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  relation_type text NOT NULL,
  correlation_id uuid NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, artifact_id, resource_type, resource_id, relation_type)
);

CREATE INDEX evidence_correlations_resource_idx ON evidence_correlations(tenant_id, resource_type, resource_id);

CREATE TABLE evidence_verifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  artifact_id uuid NOT NULL REFERENCES evidence_artifacts(id),
  verification_type text NOT NULL CHECK(verification_type IN ('HASH','PROVIDER_REFERENCE','SIGNATURE','DELIVERY','HUMAN_REVIEW')),
  result text NOT NULL CHECK(result IN ('PASS','FAIL','INCONCLUSIVE')),
  verifier_user_id uuid REFERENCES users(id),
  verifier_subject text,
  provider_reference text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id uuid NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX evidence_verifications_artifact_idx ON evidence_verifications(tenant_id, artifact_id, verified_at DESC);

ALTER TABLE evidence_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_chain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidence_artifacts_select ON evidence_artifacts FOR SELECT
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY evidence_artifacts_insert ON evidence_artifacts FOR INSERT
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);

CREATE POLICY evidence_chain_select ON evidence_chain_events FOR SELECT
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY evidence_chain_insert ON evidence_chain_events FOR INSERT
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);

CREATE POLICY evidence_correlations_select ON evidence_correlations FOR SELECT
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY evidence_correlations_insert ON evidence_correlations FOR INSERT
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);

CREATE POLICY evidence_verifications_select ON evidence_verifications FOR SELECT
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY evidence_verifications_insert ON evidence_verifications FOR INSERT
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);

-- Deliberately no UPDATE or DELETE policies. New facts are appended as new records.

COMMIT;
