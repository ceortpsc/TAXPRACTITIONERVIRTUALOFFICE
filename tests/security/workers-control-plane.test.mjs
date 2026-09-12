import test from "node:test";
import assert from "node:assert/strict";
import { planWorkerSweep, workerAssignmentSummary, workerDirectory, workerGroups, workerReadiness } from "../../lib/workers.ts";

test("every worker has one governed group and unique code", () => {
  const codes = workerDirectory.map((worker) => worker.code);
  const groups = new Set(workerGroups.map((group) => group.code));
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(workerDirectory.every((worker) => groups.has(worker.group)));
  assert.ok(workerDirectory.every((worker) => worker.responsibilities.length > 0));
  assert.ok(workerDirectory.every((worker) => worker.retry.maxAttempts > 0));
  assert.ok(workerDirectory.filter((worker) => worker.risk === "high").every((worker) => worker.retry.deadLetter));
});

test("every business group owns at least one worker", () => {
  const summary = workerAssignmentSummary();
  assert.equal(summary.length, workerGroups.length);
  assert.ok(summary.every((group) => group.workers.length > 0));
});

test("worker plan scopes to a requested group", () => {
  const plan = planWorkerSweep({ group: "identity_security", stage: "test" });
  assert.equal(plan.stage, "test");
  assert.ok(plan.workers.length > 0);
  assert.ok(plan.workers.every((worker) => worker.group === "identity_security"));
});

test("data-dependent workers fail closed without durable adapter", () => {
  const readiness = workerReadiness({ VERCEL_ENV: "production" });
  assert.equal(readiness.find((worker) => worker.code === "runtime_readiness")?.state, "active");
  assert.equal(readiness.find((worker) => worker.code === "master_file_reconciliation")?.state, "adapter_required");
});
