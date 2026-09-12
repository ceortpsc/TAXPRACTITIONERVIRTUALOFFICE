import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const lock = JSON.parse(await readFile(resolve(root, "database/schema.lock.json"), "utf8"));

test("schema lock uses sha256 and tracks operational control-plane artifacts", () => {
  assert.equal(lock.algorithm, "sha256");
  assert.ok(lock.version >= 13);
  assert.ok(lock.files["database/migrations/015_operational_control_plane.sql"]);
  assert.ok(lock.files["database/migrations/016_tax_practitioner_master_files.sql"]);
  assert.ok(lock.files["database/migrations/017_worker_control_plane.sql"]);
  assert.ok(lock.files["database/queries/control_plane.sql"]);
});

test("every schema lock entry exists and matches its sha256 digest", async () => {
  for (const [relativePath, expected] of Object.entries(lock.files)) {
    const data = await readFile(resolve(root, relativePath));
    const actual = createHash("sha256").update(data).digest("hex");
    assert.equal(actual, expected, `${relativePath} is out of sync with database/schema.lock.json`);
  }
});
