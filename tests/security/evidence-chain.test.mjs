import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const ledger = await readFile(resolve(root, "database/migrations/018_evidence_ledger.sql"), "utf8");
const authority = await readFile(resolve(root, "database/migrations/019_irs_provider_authority.sql"), "utf8");
const runtime = await readFile(resolve(root, "database/migrations/020_runtime_forensic_evidence.sql"), "utf8");
const map = JSON.parse(await readFile(resolve(root, "mappings/irs-provider-authority-map.json"), "utf8"));

test("evidence ledger is append-only for tenant sessions", () => {
  assert.match(ledger, /CREATE TABLE evidence_artifacts/);
  assert.match(ledger, /CREATE TABLE evidence_chain_events/);
  assert.match(ledger, /no UPDATE or DELETE policies/i);
  assert.doesNotMatch(ledger, /FOR UPDATE/);
  assert.doesNotMatch(ledger, /FOR DELETE/);
});

test("IRS authority schema stores regulated identifiers without public seed values", () => {
  assert.match(authority, /provider_authority_identifiers/);
  assert.match(authority, /identifier_ciphertext bytea/);
  assert.match(authority, /identifier_masked text/);
  assert.match(authority, /HMAC-SHA256/);
  assert.match(authority, /provider_api_client_registrations/);
});

test("runtime evidence schema covers all requested evidence families", () => {
  for (const table of [
    "return_audit_events",
    "return_access_events",
    "mef_submissions",
    "mef_acknowledgments",
    "irs_api_requests",
    "bank_product_ledger_entries",
    "bank_product_disbursements",
    "email_headers",
    "email_delivery_events",
    "worker_attempt_logs",
    "webhook_delivery_attempts",
    "network_request_events",
    "security_edge_events",
    "stripe_events",
    "stripe_api_requests"
  ]) {
    assert.match(runtime, new RegExp(`CREATE TABLE ${table}`), table);
  }
});

test("public evidence map is redacted and preserves documentary/runtime distinction", () => {
  assert.equal(map.classification, "PUBLIC_SAFE_EVIDENCE_MAP");
  assert.equal(map.sourceStatus, "DOCUMENTED_SNAPSHOT");
  assert.equal(map.runtimeStatus, "NOT_INFERRED_FROM_DOCUMENTS");
  const serialized = JSON.stringify(map);
  assert.doesNotMatch(serialized, /\b\d{3}-\d{2}-\d{4}\b/); // no SSN
  assert.doesNotMatch(serialized, /\b33-4891499\b/); // no full EIN
  assert.doesNotMatch(serialized, /\b748335\b/); // no full EFIN
  assert.doesNotMatch(serialized, /1280a487-33b6-4959-afb9-f1dd5c70fcc5/); // no full API client ID
  assert.equal(map.sources.find((s) => s.sourceRef === "bank-product-dispute-correspondence").documentType, "RENDERED_EMAIL_COPY_WITH_ATTACHMENT_IMAGE");
});
