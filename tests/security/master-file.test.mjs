import test from "node:test";
import assert from "node:assert/strict";
import { buildMasterFileRecord, masterFileChecks, validateMasterFileInput } from "../../lib/master-file.ts";

test("master file creates only masked taxpayer identity material", () => {
  const record = buildMasterFileRecord({
    displayName: "Example Taxpayer",
    clientType: "individual",
    tinLast4: "6789",
    taxPeriod: "202512",
    mft: "30",
    sourceType: "account_transcript",
    sourceReference: "DOC-2026-001",
    authorizationKind: "Form 2848",
  }, { userId: "user_test", organizationId: "org_test", environment: "test" });

  assert.equal(record.client.tinLast4, "6789");
  assert.equal(record.integrity.algorithm, "sha256");
  assert.match(record.integrity.digest, /^[0-9a-f]{64}$/);
  assert.equal(Object.keys(record.checkpoints).length, masterFileChecks.length);
  assert.ok(Object.values(record.checkpoints).every((checkpoint) => checkpoint.state === "not_available"));
});

test("master file rejects full or malformed identifier input", () => {
  assert.throws(() => validateMasterFileInput({
    displayName: "Example Taxpayer",
    clientType: "individual",
    tinLast4: "123456789",
    taxPeriod: "202512",
    sourceType: "account_transcript",
    authorizationKind: "Form 2848",
  }), /INVALID_TIN_LAST4/);
});

test("master file rejects invalid tax periods", () => {
  assert.throws(() => validateMasterFileInput({
    displayName: "Example Taxpayer",
    clientType: "individual",
    tinLast4: "6789",
    taxPeriod: "202513",
    sourceType: "account_transcript",
    authorizationKind: "Form 2848",
  }), /INVALID_TAX_PERIOD/);
});
