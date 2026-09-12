import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const registrySource = await readFile(new URL("../../lib/runtime/system-registry.ts", import.meta.url), "utf8");
const routeSource = await readFile(new URL("../../app/api/system/registry/route.ts", import.meta.url), "utf8");

test("system registry synchronizes routes engines workers persistence and integrations", () => {
  for (const token of ["routeRegistry", "engineReadiness", "workerReadiness", "persistenceRegistry", "integrationRegistry"]) {
    assert.match(registrySource, new RegExp(token));
  }
  assert.match(registrySource, /015_operational_control_plane\.sql/);
  assert.match(registrySource, /016_tax_practitioner_master_files\.sql/);
  assert.match(registrySource, /017_worker_control_plane\.sql/);
});

test("registry exposes state only and never returns credentials", () => {
  assert.match(registrySource, /returnsSecrets: false/);
  assert.doesNotMatch(registrySource, /process\.env\[[^\]]+\]\s*[,}]/);
  assert.match(registrySource, /state: allConfigured \? "configured" : "configuration_required"/);
});

test("registry API requires identity plus an authorized control-plane role", () => {
  assert.match(routeSource, /requireIdentity\(\)/);
  assert.match(routeSource, /controlPlaneRoles/);
  assert.match(routeSource, /status: 403/);
  assert.match(routeSource, /Cache-Control/);
});
