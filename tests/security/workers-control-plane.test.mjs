import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../../lib/workers.ts", import.meta.url), "utf8");

const groupCodes = [
  "tax_operations",
  "client_service",
  "identity_security",
  "platform_operations",
  "integrations_delivery",
  "education",
];

const workerCodes = [
  "master_file_reconciliation",
  "support_sla_sweep",
  "integration_health",
  "access_review",
  "knowledge_freshness",
  "outbox_dispatch",
  "audit_chain_verify",
  "runtime_readiness",
  "university_student_success",
  "university_content_freshness",
  "university_ai_usage_reconcile",
];

test("every governed business group and worker remains registered", () => {
  for (const group of groupCodes) assert.match(source, new RegExp(`\\"${group}\\"`));
  for (const worker of workerCodes) assert.match(source, new RegExp(`code: \\"${worker}\\"`));
  assert.equal(new Set(workerCodes).size, workerCodes.length);
});

test("worker definitions retain responsibilities retry dead-letter concurrency and idempotency controls", () => {
  assert.match(source, /responsibilities:/);
  assert.match(source, /idempotency:/);
  assert.match(source, /retry: \{ maxAttempts:/);
  assert.match(source, /deadLetter: true/);
  assert.match(source, /concurrency:/);
  assert.match(source, /timeoutSeconds:/);
});

test("worker planning supports group scoping and bounded run evidence", () => {
  assert.match(source, /planWorkerSweep/);
  assert.match(source, /!input\.group \|\| worker\.group === input\.group/);
  assert.match(source, /runId: crypto\.randomUUID\(\)/);
  assert.match(source, /status: "planned" as const/);
});

test("data-dependent workers fail closed without durable adapter", () => {
  assert.match(source, /env\.WORKER_ADAPTER_URL && env\.WORKER_ADAPTER_TOKEN/);
  assert.match(source, /worker\.code === "runtime_readiness" \|\| worker\.code === "integration_health" \? "active" : durableAdapter \? "active" : "adapter_required"/);
  assert.match(source, /persistent_worker_target/);
  assert.match(source, /vercel_cron/);
});
