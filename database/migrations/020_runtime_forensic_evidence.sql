BEGIN;

-- Provider/runtime forensic evidence surfaces.
-- Payloads and secrets are not persisted in these normalized tables. Raw evidence belongs in
-- immutable object storage and is referenced through evidence_artifacts.

CREATE TABLE return_audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  client_id uuid REFERENCES clients(id),
  case_id uuid REFERENCES cases(id),
  return_reference text NOT NULL,
  tax_year integer CHECK(tax_year BETWEEN 1990 AND 2200),
  return_type text,
  event_type text NOT NULL,
  operation text,
  field_path text,
  actor_user_id uuid REFERENCES users(id),
  actor_subject text,
  session_id text,
  request_id text,
  before_hash text,
  after_hash text,
  revision_number bigint,
  ip_hash text,
  user_agent_hash text,
  evidence_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX return_audit_lookup_idx ON return_audit_events(tenant_id, return_reference, occurred_at DESC);

CREATE TABLE return_access_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  client_id uuid REFERENCES clients(id),
  case_id uuid REFERENCES cases(id),
  return_reference text NOT NULL,
  access_type text NOT NULL CHECK(access_type IN ('VIEW','EXPORT','PRINT','DOWNLOAD','SIGN','TRANSMIT')),
  actor_user_id uuid REFERENCES users(id),
  actor_subject text,
  authorization_decision text NOT NULL CHECK(authorization_decision IN ('ALLOW','DENY')),
  authorization_basis text,
  session_id text,
  request_id text,
  ip_hash text,
  user_agent_hash text,
  evidence_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX return_access_lookup_idx ON return_access_events(tenant_id, return_reference, occurred_at DESC);

CREATE TABLE return_revision_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  client_id uuid REFERENCES clients(id),
  case_id uuid REFERENCES cases(id),
  return_reference text NOT NULL,
  revision_number bigint NOT NULL,
  schema_version text,
  software_version text,
  payload_hash char(64) NOT NULL CHECK(payload_hash ~ '^[0-9a-f]{64}$'),
  evidence_artifact_id uuid REFERENCES evidence_artifacts(id),
  created_by uuid REFERENCES users(id),
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, return_reference, revision_number)
);

CREATE TABLE mef_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  client_id uuid REFERENCES clients(id),
  case_id uuid REFERENCES cases(id),
  transmission_id uuid REFERENCES transmissions(id),
  submission_reference text,
  message_reference text,
  tax_year integer NOT NULL CHECK(tax_year BETWEEN 1990 AND 2200),
  form_family text NOT NULL,
  environment app_environment NOT NULL,
  schema_version text NOT NULL,
  business_rule_version text,
  payload_hash char(64) NOT NULL CHECK(payload_hash ~ '^[0-9a-f]{64}$'),
  payload_artifact_id uuid REFERENCES evidence_artifacts(id),
  status transmission_status NOT NULL,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mef_submissions_lookup_idx ON mef_submissions(tenant_id, tax_year, status, created_at DESC);

CREATE TABLE mef_transmission_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  submission_id uuid NOT NULL REFERENCES mef_submissions(id),
  attempt_number integer NOT NULL CHECK(attempt_number > 0),
  endpoint_label text,
  connection_started_at timestamptz,
  transmitted_at timestamptz,
  completed_at timestamptz,
  protocol_status text,
  provider_message_reference text,
  request_hash char(64) CHECK(request_hash IS NULL OR request_hash ~ '^[0-9a-f]{64}$'),
  response_hash char(64) CHECK(response_hash IS NULL OR response_hash ~ '^[0-9a-f]{64}$'),
  request_artifact_id uuid REFERENCES evidence_artifacts(id),
  response_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  UNIQUE(submission_id, attempt_number)
);

CREATE TABLE mef_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  submission_id uuid NOT NULL REFERENCES mef_submissions(id),
  acknowledgment_id uuid REFERENCES acknowledgments(id),
  provider_ack_reference text,
  acknowledgment_type text,
  status text NOT NULL,
  schema_version text,
  payload_hash char(64) NOT NULL CHECK(payload_hash ~ '^[0-9a-f]{64}$'),
  raw_artifact_id uuid REFERENCES evidence_artifacts(id),
  received_at timestamptz NOT NULL,
  correlation_id uuid NOT NULL
);

CREATE TABLE mef_business_rule_results (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  mef_acknowledgment_id uuid NOT NULL REFERENCES mef_acknowledgments(id),
  rule_id text NOT NULL,
  severity text,
  field_reference text,
  provider_message text,
  rule_version text,
  source_artifact_id uuid REFERENCES evidence_artifacts(id),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE irs_api_authorization_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  client_id uuid REFERENCES clients(id),
  case_id uuid REFERENCES cases(id),
  authorization_id uuid REFERENCES authorizations(id),
  authorization_kind text NOT NULL,
  tax_periods text[] NOT NULL DEFAULT '{}',
  scope_set text[] NOT NULL DEFAULT '{}',
  provider_reference_masked text,
  valid_from timestamptz,
  expires_at timestamptz,
  verification_status text NOT NULL DEFAULT 'UNVERIFIED' CHECK(verification_status IN ('UNVERIFIED','DOCUMENTED','PROVIDER_VERIFIED','EXPIRED','REVOKED')),
  source_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE irs_api_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  client_id uuid REFERENCES clients(id),
  case_id uuid REFERENCES cases(id),
  api_client_registration_id uuid REFERENCES provider_api_client_registrations(id),
  authorization_context_id uuid REFERENCES irs_api_authorization_context(id),
  api_name text NOT NULL,
  api_version text,
  endpoint_label text NOT NULL,
  http_method text NOT NULL,
  requested_scopes text[] NOT NULL DEFAULT '{}',
  provider_request_id text,
  attempt_number integer NOT NULL DEFAULT 1 CHECK(attempt_number > 0),
  status_code integer CHECK(status_code IS NULL OR status_code BETWEEN 100 AND 599),
  request_hash char(64) CHECK(request_hash IS NULL OR request_hash ~ '^[0-9a-f]{64}$'),
  response_hash char(64) CHECK(response_hash IS NULL OR response_hash ~ '^[0-9a-f]{64}$'),
  request_artifact_id uuid REFERENCES evidence_artifacts(id),
  response_artifact_id uuid REFERENCES evidence_artifacts(id),
  requested_at timestamptz NOT NULL,
  responded_at timestamptz,
  correlation_id uuid NOT NULL
);
CREATE INDEX irs_api_requests_lookup_idx ON irs_api_requests(tenant_id, api_name, requested_at DESC);

CREATE TABLE bank_product_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  client_id uuid REFERENCES clients(id),
  case_id uuid REFERENCES cases(id),
  provider text NOT NULL,
  provider_case_reference text,
  return_reference text,
  tax_year integer CHECK(tax_year BETWEEN 1990 AND 2200),
  product_type text,
  application_reference_masked text,
  opening_status text,
  source_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  opened_at timestamptz,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bank_product_status_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  bank_product_case_id uuid NOT NULL REFERENCES bank_product_cases(id),
  provider_status text NOT NULL,
  provider_event_reference text,
  source_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL
);

CREATE TABLE bank_product_ledger_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  bank_product_case_id uuid NOT NULL REFERENCES bank_product_cases(id),
  external_transaction_reference text,
  transaction_type text NOT NULL,
  amount numeric(14,2),
  currency char(3) NOT NULL DEFAULT 'USD',
  fee_type text,
  fee_amount numeric(14,2),
  debit_credit text CHECK(debit_credit IS NULL OR debit_credit IN ('DEBIT','CREDIT')),
  running_balance numeric(14,2),
  provider_status text,
  posting_date date,
  effective_date date,
  source_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bank_product_disbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  bank_product_case_id uuid NOT NULL REFERENCES bank_product_cases(id),
  provider_disbursement_reference text,
  method text,
  gross_amount numeric(14,2),
  fee_amount numeric(14,2),
  net_amount numeric(14,2),
  currency char(3) NOT NULL DEFAULT 'USD',
  ach_trace_reference_masked text,
  destination_fingerprint text,
  provider_status text,
  return_code text,
  return_reference text,
  initiated_at timestamptz,
  disbursed_at timestamptz,
  returned_at timestamptz,
  source_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  client_id uuid REFERENCES clients(id),
  case_id uuid REFERENCES cases(id),
  rfc_message_id text,
  provider_message_id text,
  thread_reference text,
  direction text NOT NULL CHECK(direction IN ('INBOUND','OUTBOUND','INTERNAL')),
  envelope_from_masked text,
  envelope_recipient_count integer CHECK(envelope_recipient_count IS NULL OR envelope_recipient_count >= 0),
  subject_hash text,
  message_date timestamptz,
  received_at timestamptz,
  raw_eml_artifact_id uuid REFERENCES evidence_artifacts(id),
  source_kind text NOT NULL CHECK(source_kind IN ('RFC822_SOURCE','PROVIDER_EXPORT','RENDERED_COPY')),
  correlation_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE email_headers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  email_message_id uuid NOT NULL REFERENCES email_messages(id),
  ordinal integer NOT NULL CHECK(ordinal >= 0),
  header_name text NOT NULL,
  header_value_ciphertext bytea,
  header_value_hash text,
  UNIQUE(email_message_id, ordinal)
);

CREATE TABLE email_delivery_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  email_message_id uuid NOT NULL REFERENCES email_messages(id),
  provider_event_id text,
  event_type text NOT NULL CHECK(event_type IN ('QUEUED','ACCEPTED','DELIVERED','DEFERRED','BOUNCED','BLOCKED','COMPLAINT')),
  smtp_status text,
  enhanced_smtp_status text,
  remote_mta_masked text,
  attempt_number integer CHECK(attempt_number IS NULL OR attempt_number > 0),
  source_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL
);

CREATE TABLE worker_attempt_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  run_item_id uuid NOT NULL REFERENCES worker_run_items(id),
  worker_code text NOT NULL,
  attempt_number integer NOT NULL CHECK(attempt_number > 0),
  lease_reference text,
  queue_message_reference text,
  idempotency_key text,
  runtime_instance text,
  outcome text NOT NULL CHECK(outcome IN ('SUCCESS','RETRY','FAILED','DEAD_LETTER','BLOCKED')),
  error_class text,
  error_code text,
  sanitized_error_message text,
  input_hash text,
  output_hash text,
  log_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(run_item_id, attempt_number)
);

CREATE TABLE webhook_delivery_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  webhook_event_id uuid NOT NULL REFERENCES webhook_events(id),
  attempt_number integer NOT NULL CHECK(attempt_number > 0),
  provider_delivery_id text,
  endpoint_reference text,
  signature_scheme text,
  signature_valid boolean,
  http_status integer CHECK(http_status IS NULL OR http_status BETWEEN 100 AND 599),
  request_hash text,
  response_hash text,
  retry_reason text,
  next_retry_at timestamptz,
  request_artifact_id uuid REFERENCES evidence_artifacts(id),
  response_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  delivery_started_at timestamptz,
  received_at timestamptz,
  completed_at timestamptz,
  UNIQUE(webhook_event_id, attempt_number)
);

CREATE TABLE network_request_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  request_id text,
  trace_id text,
  correlation_id uuid NOT NULL,
  provider text NOT NULL,
  edge_service text,
  environment app_environment NOT NULL,
  hostname text,
  http_method text,
  route_template text,
  response_status integer CHECK(response_status IS NULL OR response_status BETWEEN 100 AND 599),
  source_ip_hash text,
  user_agent_hash text,
  forwarded_chain_hash text,
  tls_protocol text,
  authenticated_subject text,
  bytes_in bigint CHECK(bytes_in IS NULL OR bytes_in >= 0),
  bytes_out bigint CHECK(bytes_out IS NULL OR bytes_out >= 0),
  firewall_action text,
  firewall_rule_id text,
  risk_classification text,
  raw_log_artifact_id uuid REFERENCES evidence_artifacts(id),
  started_at timestamptz NOT NULL,
  duration_ms bigint CHECK(duration_ms IS NULL OR duration_ms >= 0)
);
CREATE INDEX network_request_events_time_idx ON network_request_events(tenant_id, started_at DESC);

CREATE TABLE security_edge_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  provider text NOT NULL,
  edge_service text NOT NULL,
  action text NOT NULL CHECK(action IN ('ALLOW','BLOCK','CHALLENGE','RATE_LIMIT','LOG')),
  rule_reference text,
  reason text,
  source_fingerprint text,
  destination_reference text,
  provider_event_reference text,
  raw_log_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL
);

CREATE TABLE stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  stripe_event_id text NOT NULL,
  event_type text NOT NULL,
  api_version text,
  livemode boolean NOT NULL,
  connected_account_reference text,
  request_id text,
  request_idempotency_key text,
  primary_object_type text,
  primary_object_id text,
  pending_webhooks integer CHECK(pending_webhooks IS NULL OR pending_webhooks >= 0),
  signature_valid boolean,
  payload_hash char(64) NOT NULL CHECK(payload_hash ~ '^[0-9a-f]{64}$'),
  raw_event_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  event_created_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, stripe_event_id)
);

CREATE TABLE stripe_api_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  operation text NOT NULL,
  http_method text NOT NULL,
  object_type text,
  object_id text,
  stripe_request_id text,
  idempotency_key text,
  livemode boolean NOT NULL,
  status_code integer CHECK(status_code IS NULL OR status_code BETWEEN 100 AND 599),
  request_hash text,
  response_hash text,
  request_artifact_id uuid REFERENCES evidence_artifacts(id),
  response_artifact_id uuid REFERENCES evidence_artifacts(id),
  correlation_id uuid NOT NULL,
  initiated_at timestamptz NOT NULL,
  completed_at timestamptz
);

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'return_audit_events','return_access_events','return_revision_snapshots',
    'mef_submissions','mef_transmission_attempts','mef_acknowledgments','mef_business_rule_results',
    'irs_api_authorization_context','irs_api_requests',
    'bank_product_cases','bank_product_status_events','bank_product_ledger_entries','bank_product_disbursements',
    'email_messages','email_headers','email_delivery_events',
    'worker_attempt_logs','webhook_delivery_attempts','network_request_events','security_edge_events',
    'stripe_events','stripe_api_requests'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
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

-- Unresolved pre-tenant webhook/network/worker rows remain invisible to tenant sessions because
-- tenant_id NULL does not satisfy the tenant SELECT policy. Service-role ingestion may resolve them.
-- Evidence rows are append-only: no ordinary UPDATE or DELETE policies are created.

COMMIT;
