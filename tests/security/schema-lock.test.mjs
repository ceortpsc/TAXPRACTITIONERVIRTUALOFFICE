import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const lock = JSON.parse(await readFile(resolve(root, "database/schema.lock.json"), "utf8"));

test("schema lock uses sha256 and tracks operational and evidence control-plane artifacts", () => {
  assert.equal(lock.algorithm, "sha256");
  assert.ok(lock.version >= 16);
  for (const path of [
    "database/migrations/015_operational_control_plane.sql",
    "database/migrations/016_tax_practitioner_master_files.sql",
    "database/migrations/017_worker_control_plane.sql",
    "database/migrations/018_evidence_ledger.sql",
    "database/migrations/019_irs_provider_authority.sql",
    "database/migrations/020_runtime_forensic_evidence.sql",
    "database/queries/control_plane.sql",
    "mappings/irs-provider-authority-map.json"
  ]) {
    assert.ok(lock.files[path], path);
  }
});

test("every schema lock entry exists and matches its sha256 digest", async () => {
  for (const [relativePath, expected] of Object.entries(lock.files)) {
    const data = await readFile(resolve(root, relativePath));
    const actual = createHash("sha256").update(data).digest("hex");
    assert.equal(actual, expected, `${relativePath} is out of sync with database/schema.lock.json`);
  }
});
