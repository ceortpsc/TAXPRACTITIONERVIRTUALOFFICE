import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { createWorkerAdapterServer } from "../../services/worker-adapter/server.mjs";

const original = {
  token: process.env.WORKER_ADAPTER_TOKEN,
  database: process.env.DATABASE_URL,
  execution: process.env.WORKER_ADAPTER_EXECUTION_ENABLED,
};

let server;
let baseUrl;

before(async () => {
  process.env.WORKER_ADAPTER_TOKEN = "test-worker-adapter-token-32-bytes";
  delete process.env.DATABASE_URL;
  process.env.WORKER_ADAPTER_EXECUTION_ENABLED = "false";

  server = createWorkerAdapterServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (original.token === undefined) delete process.env.WORKER_ADAPTER_TOKEN;
  else process.env.WORKER_ADAPTER_TOKEN = original.token;
  if (original.database === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = original.database;
  if (original.execution === undefined) delete process.env.WORKER_ADAPTER_EXECUTION_ENABLED;
  else process.env.WORKER_ADAPTER_EXECUTION_ENABLED = original.execution;
});

const plan = {
  runId: "test-run-12345678",
  stage: "test",
  createdAt: new Date().toISOString(),
  workers: [
    {
      code: "master_file_reconciliation",
      group: "tax_operations",
      queue: "tax-operations",
      execution: "hybrid",
      risk: "high",
      retry: { maxAttempts: 5, baseDelaySeconds: 30, deadLetter: true },
      concurrency: 10,
      timeoutSeconds: 120,
      status: "planned",
    },
  ],
};

test("adapter health exposes readiness without secrets", async () => {
  const response = await fetch(`${baseUrl}/healthz`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "degraded");
  assert.equal(body.checks.token, "configured");
  assert.equal(body.checks.database, "not_configured");
  assert.equal(body.capabilities.dataMutationClaimed, false);
  assert.equal(JSON.stringify(body).includes("test-worker-adapter-token"), false);
});

test("adapter rejects unauthenticated worker plans", async () => {
  const response = await fetch(`${baseUrl}/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(plan),
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "UNAUTHORIZED" });
});

test("adapter accepts authenticated plan shape but blocks execution without dedicated database", async () => {
  const response = await fetch(`${baseUrl}/`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.WORKER_ADAPTER_TOKEN}`,
      "content-type": "application/json",
      "x-worker-run-id": plan.runId,
    },
    body: JSON.stringify(plan),
  });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error, "DATABASE_REQUIRED");
  assert.equal(body.state, "blocked");
  assert.equal(body.dataMutationClaimed, false);
  assert.deepEqual(body.acceptedWorkers, ["master_file_reconciliation"]);
});
