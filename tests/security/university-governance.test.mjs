import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("online learning workspace and tutor are authentication gated", async () => {
  const proxy = await readFile(new URL("../../proxy.ts", import.meta.url), "utf8");
  const tutor = await readFile(new URL("../../app/api/universities/tutor/route.ts", import.meta.url), "utf8");
  assert.match(proxy, /"\/learn\(\.\*\)"/);
  assert.match(tutor, /identity\.userId/);
  assert.match(tutor, /identity\.orgId/);
  assert.match(tutor, /status:401/);
});

test("academic completion and integrity decisions require human review", async () => {
  const migration = await readFile(new URL("../../database/migrations/006_online_university_ai_operations.sql", import.meta.url), "utf8");
  assert.match(migration, /human_governance_required boolean NOT NULL DEFAULT true/);
  assert.match(migration, /CHECK\(status NOT IN \('approved','rejected'\) OR human_decision_by IS NOT NULL\)/);
  assert.match(migration, /academic_integrity_flags/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
});
