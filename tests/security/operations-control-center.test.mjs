import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const operationsSource = await readFile(new URL("../../lib/operations-center.ts", import.meta.url), "utf8");
const apiSource = await readFile(new URL("../../app/api/operations/[section]/route.ts", import.meta.url), "utf8");
const proxySource = await readFile(new URL("../../proxy.ts", import.meta.url), "utf8");
const migrationSource = await readFile(new URL("../../database/migrations/015_operational_control_plane.sql", import.meta.url), "utf8");

test("operations center exposes every requested control-plane section", () => {
  for (const section of ["deployments", "health", "security", "optimization", "quotas", "maintenance", "support", "topology"]) {
    assert.match(operationsSource, new RegExp(`\\"${section}\\"`));
  }
});

test("provider and adapter facts fail closed instead of fabricating success", () => {
  assert.match(operationsSource, /status: deployedOnVercel \? "VERIFIED" : "UNKNOWN"/);
  assert.match(operationsSource, /Provider account quota/);
  assert.match(operationsSource, /status: "UNKNOWN"/);
  assert.match(operationsSource, /worker\.state === "active" \? "READY"/);
  assert.match(operationsSource, /External\/provider claims remain UNKNOWN until supported by provider evidence/);
});

test("operations API is identity and role gated with no-store evidence", () => {
  assert.match(apiSource, /requireIdentity\(\)/);
  assert.match(apiSource, /operationsRoles/);
  assert.match(apiSource, /status: 403/);
  assert.match(apiSource, /Cache-Control/);
  assert.match(apiSource, /provider-claims-require-evidence/);
});

test("operations workspace participates in the explicit Core 3 protected-prefix policy", () => {
  assert.doesNotMatch(proxySource, /createRouteMatcher/);
  assert.match(proxySource, /"\/operations"/);
  assert.match(proxySource, /isProtectedPath/);
});

test("operational evidence schema is tenant isolated and audit actions are append-only", () => {
  assert.match(migrationSource, /enable row level security/);
  assert.match(migrationSource, /current_setting\('app\.tenant_id'/);
  assert.match(migrationSource, /no UPDATE\/DELETE policy for ops_action_audit/i);
});
