BEGIN;

-- Stripe + CRM + order operations control plane.
-- No PAN, CVC, raw bank account, Stripe secret, or full payment credential is stored here.
-- Stripe object references and cryptographic/event evidence are non-secret correlation material.

CREATE TABLE commerce_catalog_items (
  catalog_key text PRIMARY KEY,
  category text NOT NULL CHECK(category IN ('tax_services','payroll','education','software','professional_services','settlement')),
  display_name text NOT NULL,
  description text NOT NULL,
  billing_kind text NOT NULL CHECK(billing_kind IN ('one_time','recurring','quote','custom')),
  currency char(3) NOT NULL DEFAULT 'usd' CHECK(currency ~ '^[a-z]{3}$'),
  amount_cents bigint CHECK(amount_cents IS NULL OR amount_cents >= 0),
  recurring_interval text CHECK(recurring_interval IS NULL OR recurring_interval IN ('day','week','month','year')),
  recurring_interval_count integer CHECK(recurring_interval_count IS NULL OR recurring_interval_count BETWEEN 1 AND 156),
  stripe_product_reference text,
  stripe_price_lookup_key text,
  purchase_order_allowed boolean NOT NULL DEFAULT false,
  signed_agreement_required boolean NOT NULL DEFAULT false,
  direct_checkout_enabled boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  catalog_version text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(
    (billing_kind IN ('one_time','recurring') AND amount_cents IS NOT NULL)
    OR billing_kind IN ('quote','custom')
  ),
  CHECK(
    billing_kind <> 'recurring'
    OR (recurring_interval IS NOT NULL AND recurring_interval_count IS NOT NULL)
  ),
  CHECK(
    NOT direct_checkout_enabled
    OR stripe_price_lookup_key IS NOT NULL
  )
);
CREATE UNIQUE INDEX commerce_catalog_lookup_key_unique
  ON commerce_catalog_items(stripe_price_lookup_key)
  WHERE stripe_price_lookup_key IS NOT NULL;

CREATE TABLE crm_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  client_id uuid REFERENCES clients(id),
  display_name text NOT NULL CHECK(char_length(display_name) BETWEEN 2 AND 180),
  account_type text NOT NULL CHECK(account_type IN ('individual','business','organization','student','employer','partner')),
  status text NOT NULL DEFAULT 'prospect' CHECK(status IN ('prospect','active','on_hold','closed')),
  billing_email_ciphertext bytea,
  billing_phone_ciphertext bytea,
  currency char(3) NOT NULL DEFAULT 'usd' CHECK(currency ~ '^[a-z]{3}$'),
  stripe_customer_id text,
  owner_user_id uuid REFERENCES users(id),
  source text NOT NULL DEFAULT 'application',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, id),
  UNIQUE(tenant_id, stripe_customer_id)
);
CREATE INDEX crm_accounts_client_idx ON crm_accounts(tenant_id, client_id, status);
CREATE INDEX crm_accounts_owner_idx ON crm_accounts(tenant_id, owner_user_id, status);

CREATE TABLE crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  account_id uuid NOT NULL REFERENCES crm_accounts(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK(char_length(display_name) BETWEEN 2 AND 180),
  role_title text,
  email_ciphertext bytea,
  phone_ciphertext bytea,
  primary_contact boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, id)
);
CREATE UNIQUE INDEX crm_primary_contact_unique
  ON crm_contacts(account_id)
  WHERE primary_contact;

CREATE TABLE crm_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  account_id uuid NOT NULL REFERENCES crm_accounts(id),
  client_id uuid REFERENCES clients(id),
  catalog_key text REFERENCES commerce_catalog_items(catalog_key),
  name text NOT NULL,
  stage text NOT NULL DEFAULT 'qualification' CHECK(stage IN ('qualification','discovery','proposal','agreement','authorized','won','lost')),
  estimated_amount_cents bigint CHECK(estimated_amount_cents IS NULL OR estimated_amount_cents >= 0),
  currency char(3) NOT NULL DEFAULT 'usd',
  owner_user_id uuid REFERENCES users(id),
  expected_close_date date,
  agreement_reference text,
  purchase_order_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  UNIQUE(tenant_id, id)
);
CREATE INDEX crm_opportunities_pipeline_idx ON crm_opportunities(tenant_id, stage, expected_close_date, updated_at DESC);

CREATE TABLE purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  account_id uuid NOT NULL REFERENCES crm_accounts(id),
  client_id uuid REFERENCES clients(id),
  opportunity_id uuid REFERENCES crm_opportunities(id),
  po_number text NOT NULL CHECK(char_length(po_number) BETWEEN 1 AND 80),
  status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','review','approved','partially_billed','fulfilled','cancelled','rejected')),
  currency char(3) NOT NULL DEFAULT 'usd',
  authorized_amount_cents bigint NOT NULL CHECK(authorized_amount_cents >= 0),
  document_id uuid REFERENCES documents(id),
  issued_at date,
  expires_at date,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, po_number),
  CHECK(expires_at IS NULL OR issued_at IS NULL OR expires_at >= issued_at)
);
CREATE INDEX purchase_orders_status_idx ON purchase_orders(tenant_id, status, updated_at DESC);

CREATE TABLE sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  order_number text NOT NULL,
  account_id uuid NOT NULL REFERENCES crm_accounts(id),
  client_id uuid REFERENCES clients(id),
  opportunity_id uuid REFERENCES crm_opportunities(id),
  purchase_order_id uuid REFERENCES purchase_orders(id),
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','awaiting_agreement','authorized','checkout_created','payment_pending','paid','partially_refunded','refunded','disputed','cancelled','failed')),
  currency char(3) NOT NULL DEFAULT 'usd',
  subtotal_cents bigint NOT NULL DEFAULT 0 CHECK(subtotal_cents >= 0),
  tax_cents bigint NOT NULL DEFAULT 0 CHECK(tax_cents >= 0),
  total_cents bigint NOT NULL DEFAULT 0 CHECK(total_cents >= 0),
  agreement_reference text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  stripe_invoice_id text,
  stripe_customer_id text,
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES users(id),
  authorized_by uuid REFERENCES users(id),
  authorized_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, order_number),
  UNIQUE(tenant_id, correlation_id),
  UNIQUE(stripe_checkout_session_id)
);
CREATE INDEX sales_orders_status_idx ON sales_orders(tenant_id, status, updated_at DESC);
CREATE INDEX sales_orders_account_idx ON sales_orders(tenant_id, account_id, created_at DESC);
CREATE INDEX sales_orders_stripe_pi_idx ON sales_orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX sales_orders_stripe_invoice_idx ON sales_orders(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

CREATE TABLE sales_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  order_id uuid NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  catalog_key text NOT NULL REFERENCES commerce_catalog_items(catalog_key),
  description text NOT NULL,
  quantity numeric(12,3) NOT NULL DEFAULT 1 CHECK(quantity > 0),
  unit_amount_cents bigint NOT NULL CHECK(unit_amount_cents >= 0),
  line_total_cents bigint NOT NULL CHECK(line_total_cents >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sales_order_lines_order_idx ON sales_order_lines(tenant_id, order_id, created_at);

CREATE TABLE billing_settlement_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  account_id uuid NOT NULL REFERENCES crm_accounts(id),
  client_id uuid REFERENCES clients(id),
  order_id uuid REFERENCES sales_orders(id),
  catalog_key text NOT NULL REFERENCES commerce_catalog_items(catalog_key),
  agreement_reference text NOT NULL CHECK(char_length(agreement_reference) BETWEEN 4 AND 120),
  agreement_document_id uuid REFERENCES documents(id),
  client_reference text NOT NULL CHECK(char_length(client_reference) BETWEEN 2 AND 120),
  amount_cents bigint NOT NULL CHECK(amount_cents BETWEEN 100 AND 5000000),
  currency char(3) NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','checkout_created','paid','voided','expired')),
  requested_by uuid NOT NULL REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  expires_at timestamptz,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(approved_by IS NULL OR approved_by <> requested_by),
  UNIQUE(tenant_id, correlation_id),
  UNIQUE(stripe_checkout_session_id)
);
CREATE INDEX billing_settlement_status_idx ON billing_settlement_authorizations(tenant_id, status, created_at DESC);

CREATE TABLE stripe_revenue_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  stripe_event_id text NOT NULL UNIQUE CHECK(stripe_event_id ~ '^evt_[A-Za-z0-9]+$'),
  event_type text NOT NULL,
  livemode boolean NOT NULL,
  provider_created_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload_sha256 char(64) NOT NULL CHECK(payload_sha256 ~ '^[0-9a-f]{64}$'),
  stripe_object_id text,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  order_id uuid REFERENCES sales_orders(id),
  correlation_id uuid NOT NULL,
  processing_result text NOT NULL CHECK(processing_result IN ('received','correlated','applied','duplicate','ignored','failed')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stripe_revenue_event_tenant_time_idx ON stripe_revenue_events(tenant_id, recorded_at DESC);
CREATE INDEX stripe_revenue_event_correlation_idx ON stripe_revenue_events(correlation_id, recorded_at DESC);

CREATE TABLE billing_customer_portal_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  account_id uuid NOT NULL REFERENCES crm_accounts(id),
  stripe_customer_id text NOT NULL,
  requested_by uuid NOT NULL REFERENCES users(id),
  correlation_id uuid NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX billing_portal_audit_idx ON billing_customer_portal_audit(tenant_id, account_id, requested_at DESC);

ALTER TABLE crm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_settlement_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_customer_portal_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_crm_accounts ON crm_accounts
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_isolation_crm_contacts ON crm_contacts
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_isolation_crm_opportunities ON crm_opportunities
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_isolation_purchase_orders ON purchase_orders
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_isolation_sales_orders ON sales_orders
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_isolation_sales_order_lines ON sales_order_lines
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_isolation_settlement_authorizations ON billing_settlement_authorizations
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_isolation_stripe_revenue_events_select ON stripe_revenue_events FOR SELECT
  USING (tenant_id IS NULL OR tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_isolation_stripe_revenue_events_insert ON stripe_revenue_events FOR INSERT
  WITH CHECK (tenant_id IS NULL OR tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_isolation_billing_portal_audit ON billing_customer_portal_audit
  USING (tenant_id=current_setting('app.tenant_id',true)::uuid)
  WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);

-- Provider events are append-only evidence. No UPDATE/DELETE RLS policy is defined for stripe_revenue_events.

INSERT INTO commerce_catalog_items(
  catalog_key,category,display_name,description,billing_kind,currency,amount_cents,
  recurring_interval,recurring_interval_count,stripe_product_reference,stripe_price_lookup_key,
  purchase_order_allowed,signed_agreement_required,direct_checkout_enabled,catalog_version
) VALUES
('tax_consultation_standard','tax_services','Tax Consultation — Standard','Structured tax consultation and service scoping.','one_time','usd',79999,NULL,NULL,'rtpsc_tax_consultation_standard','rtpsc_tax_consultation_standard_usd_2026',true,false,true,'2026-09-16'),
('tax_consultation_executive','tax_services','Tax Consultation — Executive','Extended executive tax and operations consultation.','one_time','usd',99999,NULL,NULL,'rtpsc_tax_consultation_executive','rtpsc_tax_consultation_executive_usd_2026',true,false,true,'2026-09-16'),
('individual_tax_return_2026','tax_services','Individual Tax Return Preparation — 2026','Base individual federal income-tax return preparation service.','one_time','usd',149999,NULL,NULL,'rtpsc_individual_tax_return_2026','rtpsc_individual_tax_return_2026_usd',false,true,true,'2026-09-16'),
('schedule_c_return_2026','tax_services','Schedule C / Self-Employed Return — 2026','Base individual return preparation including one Schedule C business.','one_time','usd',149999,NULL,NULL,'rtpsc_schedule_c_return_2026','rtpsc_schedule_c_return_2026_usd',false,true,true,'2026-09-16'),
('business_return_2026','tax_services','Business Return Preparation — 2026','Base business-return preparation service.','one_time','usd',199999,NULL,NULL,'rtpsc_business_return_2026','rtpsc_business_return_2026_usd',true,true,true,'2026-09-16'),
('rental_investment_return_2026','tax_services','Rental / Investment Return — 2026','Base rental-property or investment reporting return service.','one_time','usd',164999,NULL,NULL,'rtpsc_rental_investment_return_2026','rtpsc_rental_investment_return_2026_usd',false,true,true,'2026-09-16'),
('amended_return_1040x','tax_services','Amended Individual Return — Form 1040-X','Preparation of an amended individual income-tax return.','one_time','usd',89999,NULL,NULL,'rtpsc_amended_return_1040x','rtpsc_amended_return_1040x_usd_2026',false,true,true,'2026-09-16'),
('prime_payroll_monthly','payroll','Ross Prime Payroll Management','Monthly payroll-management and employer workflow service.','recurring','usd',29999,'month',1,'rtpsc_prime_payroll_monthly','rtpsc_prime_payroll_monthly_usd_2026',true,true,true,'2026-09-16'),
('edrive_driver_education','education','Ross E-Drive University — Online Driver Education','Online driver-education enrollment product.','one_time','usd',11999,NULL,NULL,'rtpsc_edrive_driver_education','rtpsc_edrive_driver_education_usd_2026',false,true,true,'2026-09-16'),
('nexus_os_premium_monthly','software','ChatTaxPro Nexus OS — Premium','Premium monthly governed tax-practice software subscription.','recurring','usd',49900,'month',1,'rtpsc_nexus_os_premium_monthly','rtpsc_nexus_os_premium_monthly_usd_2026',true,true,true,'2026-09-16'),
('rapid_response_audit_defense','professional_services','Rapid Response Audit Defense','Quote-based notice-response and audit-defense service.','quote','usd',NULL,NULL,NULL,'rtpsc_rapid_response_audit_defense',NULL,true,true,false,'2026-09-16'),
('pdf_editor_business','software','Ross PDF Universal Editor — Business','Quote-based business document editing, OCR, signing, and export tooling.','quote','usd',NULL,NULL,NULL,'rtpsc_pdf_editor_business',NULL,true,true,false,'2026-09-16'),
('tax_pro_university_program','education','Ross Tax Pro University — Program Enrollment','Quote-based professional education program enrollment.','quote','usd',NULL,NULL,NULL,'rtpsc_tax_pro_university_program',NULL,true,true,false,'2026-09-16'),
('balance_settlement','settlement','Balance Settlement Payment','Authorized payment toward an existing signed balance or installment agreement.','custom','usd',NULL,NULL,NULL,'prod_V717h7hDwYMLEx','rtp_balance_settlement_custom_amount',true,true,false,'2026-09-16'),
('saas_subscription_settlement','settlement','SaaS Subscription Settlement','Authorized settlement for a signed software subscription balance.','custom','usd',NULL,NULL,NULL,'prod_V7173myjbxqBFp','rtp_saas_subscription_settlement_custom_amount',true,true,false,'2026-09-16'),
('token_pack_settlement','settlement','Token Pack Purchase Settlement','Authorized settlement or negotiated token-pack purchase payment.','custom','usd',NULL,NULL,NULL,'prod_V717yGkeg5z5kH','rtp_token_pack_settlement_custom_amount',true,true,false,'2026-09-16'),
('implementation_setup_settlement','settlement','Implementation Setup Fee Settlement','Authorized implementation/setup balance payment.','custom','usd',NULL,NULL,NULL,'prod_V717nQxzX7k5sf','rtp_implementation_setup_settlement_custom_amount',true,true,false,'2026-09-16'),
('ero_efile_operations_settlement','settlement','ERO E-file Operations Settlement','Authorized ERO/e-file operations balance payment; payment does not authorize filing or transmission.','custom','usd',NULL,NULL,NULL,'prod_V7180tnlgXniW9','rtp_ero_efile_operations_settlement_custom_amount',true,true,false,'2026-09-16');

COMMIT;
