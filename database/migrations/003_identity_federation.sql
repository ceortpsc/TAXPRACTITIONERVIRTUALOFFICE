BEGIN;
CREATE TABLE identity_connections(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  provider text NOT NULL CHECK(provider IN ('clerk')),
  protocol text NOT NULL CHECK(protocol IN ('saml')),
  external_connection_id text NOT NULL,
  email_domain text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','testing','active','suspended')),
  metadata_fingerprint text,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, provider, external_connection_id)
);
CREATE TABLE identity_role_mappings(
  connection_id uuid NOT NULL REFERENCES identity_connections(id) ON DELETE CASCADE,
  external_value text NOT NULL,
  role_code text NOT NULL,
  approval_required boolean NOT NULL DEFAULT true,
  PRIMARY KEY(connection_id, external_value, role_code)
);
CREATE TABLE identity_sync_events(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  connection_id uuid REFERENCES identity_connections(id),
  external_subject_hash text NOT NULL,
  action text NOT NULL,
  decision text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX identity_sync_tenant_time ON identity_sync_events(tenant_id, occurred_at DESC);
COMMIT;
