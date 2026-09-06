BEGIN;

CREATE TABLE encryption_key_registry(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  key_id text NOT NULL,
  key_version text NOT NULL,
  provider text NOT NULL CHECK(provider IN ('aws-kms','gcp-kms','azure-key-vault','vercel-marketplace-kms')),
  purpose text NOT NULL CHECK(purpose IN ('data-encryption','audit-signing','webhook-signing')),
  status text NOT NULL DEFAULT 'active' CHECK(status IN ('pending','active','decrypt-only','revoked')),
  activated_at timestamptz,
  rotate_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,key_id,key_version)
);

CREATE TABLE encrypted_payloads(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  algorithm text NOT NULL CHECK(algorithm='A256GCM'),
  key_id text NOT NULL,
  key_version text NOT NULL,
  iv bytea NOT NULL CHECK(octet_length(iv)=12),
  ciphertext bytea NOT NULL,
  authentication_tag bytea NOT NULL CHECK(octet_length(authentication_tag)=16),
  aad jsonb NOT NULL,
  plaintext_sha256 text NOT NULL CHECK(plaintext_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,resource_type,resource_id,key_version)
);

CREATE TABLE audit_chain(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  audit_event_id bigint NOT NULL REFERENCES audit_events(id),
  previous_hash text,
  event_hash text NOT NULL CHECK(event_hash ~ '^[a-f0-9]{64}$'),
  signing_key_id text NOT NULL,
  signature text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,audit_event_id),
  UNIQUE(tenant_id,event_hash)
);

ALTER TABLE encryption_key_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_chain ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_key_registry ON encryption_key_registry USING (tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_isolation_encrypted_payloads ON encrypted_payloads USING (tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_isolation_audit_chain ON audit_chain USING (tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);

REVOKE UPDATE, DELETE ON audit_chain FROM PUBLIC;
COMMIT;
