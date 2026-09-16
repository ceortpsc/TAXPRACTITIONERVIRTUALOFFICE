BEGIN;

-- IRS provider/application authority evidence.
-- Sensitive provider identifiers are stored encrypted and/or masked. The public repository
-- contains schema only; it MUST NOT seed EFINs, ETINs, TCCs, API client IDs, EINs, SSNs,
-- redirect URLs, personal contact data, or application tracking numbers.

CREATE TABLE provider_authority_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  source_artifact_id uuid NOT NULL REFERENCES evidence_artifacts(id),
  provider text NOT NULL,
  application_type text NOT NULL,
  application_status text NOT NULL,
  legal_entity_reference text,
  dba_reference text,
  business_structure text,
  tracking_identifier_ciphertext bytea,
  tracking_identifier_masked text,
  suitability_status text,
  snapshot_observed_at timestamptz,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  UNIQUE(tenant_id, source_artifact_id, application_type)
);

CREATE TABLE provider_authority_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  application_id uuid NOT NULL REFERENCES provider_authority_applications(id),
  participant_reference text,
  role_type text NOT NULL,
  signature_status text,
  provider_option_status text,
  service_type text,
  observed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX provider_authority_roles_app_idx ON provider_authority_roles(tenant_id, application_id, role_type);

CREATE TABLE provider_authority_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  application_id uuid NOT NULL REFERENCES provider_authority_applications(id),
  identifier_type text NOT NULL CHECK(identifier_type IN ('EFIN','ETIN','TCC','SOFTWARE_ID','API_CLIENT_ID','OTHER')),
  identifier_ciphertext bytea,
  identifier_masked text,
  identifier_fingerprint text,
  fingerprint_scheme text CHECK(fingerprint_scheme IS NULL OR fingerprint_scheme IN ('HMAC-SHA256','PROVIDER_TOKEN')),
  environment app_environment,
  role_type text,
  transmission_method text,
  status text,
  effective_at timestamptz,
  tax_year integer CHECK(tax_year IS NULL OR tax_year BETWEEN 1990 AND 2200),
  source_artifact_id uuid NOT NULL REFERENCES evidence_artifacts(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CHECK(identifier_ciphertext IS NOT NULL OR identifier_masked IS NOT NULL OR identifier_fingerprint IS NOT NULL)
);

CREATE INDEX provider_authority_identifiers_lookup_idx
  ON provider_authority_identifiers(tenant_id, identifier_type, status, effective_at DESC);

CREATE TABLE provider_api_client_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  application_id uuid NOT NULL REFERENCES provider_authority_applications(id),
  source_artifact_id uuid NOT NULL REFERENCES evidence_artifacts(id),
  api_label text NOT NULL,
  client_identifier_ciphertext bytea,
  client_identifier_masked text,
  client_identifier_fingerprint text,
  fingerprint_scheme text CHECK(fingerprint_scheme IS NULL OR fingerprint_scheme IN ('HMAC-SHA256','PROVIDER_TOKEN')),
  selected_apis text[] NOT NULL DEFAULT '{}',
  integration_type text,
  redirect_uri_ciphertext bytea,
  redirect_uri_status text NOT NULL DEFAULT 'not_recorded' CHECK(redirect_uri_status IN ('not_recorded','truncated_source','recorded_encrypted','verified_runtime')),
  status text NOT NULL,
  environment app_environment,
  observed_at timestamptz,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CHECK(client_identifier_ciphertext IS NOT NULL OR client_identifier_masked IS NOT NULL OR client_identifier_fingerprint IS NOT NULL)
);

CREATE TABLE provider_form_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  application_id uuid NOT NULL REFERENCES provider_authority_applications(id),
  role_type text NOT NULL,
  forms text[] NOT NULL DEFAULT '{}',
  transmission_method text,
  provider_option_status text,
  service_type text,
  test_production_indicator text,
  tax_year integer CHECK(tax_year IS NULL OR tax_year BETWEEN 1990 AND 2200),
  source_artifact_id uuid NOT NULL REFERENCES evidence_artifacts(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX provider_form_authorizations_lookup_idx
  ON provider_form_authorizations(tenant_id, role_type, tax_year, provider_option_status);

CREATE TABLE provider_software_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  application_id uuid NOT NULL REFERENCES provider_authority_applications(id),
  source_artifact_id uuid NOT NULL REFERENCES evidence_artifacts(id),
  package_type text,
  tax_year integer NOT NULL CHECK(tax_year BETWEEN 1990 AND 2200),
  product_name text,
  package_status text,
  forms text[] NOT NULL DEFAULT '{}',
  transmission_methods text[] NOT NULL DEFAULT '{}',
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE provider_authority_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_authority_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_authority_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_api_client_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_form_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_software_packages ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'provider_authority_applications',
    'provider_authority_roles',
    'provider_authority_identifiers',
    'provider_api_client_registrations',
    'provider_form_authorizations',
    'provider_software_packages'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (tenant_id=current_setting(''app.tenant_id'',true)::uuid)',
      t || '_select', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (tenant_id=current_setting(''app.tenant_id'',true)::uuid)',
      t || '_insert', t
    );
  END LOOP;
END $$;

-- Authority snapshots are evidence. Corrections are appended from a new source snapshot;
-- no UPDATE or DELETE policies are granted to ordinary tenant sessions.

COMMIT;
