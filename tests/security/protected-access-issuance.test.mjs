import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const identity = readFileSync(new URL("../../lib/identity.ts", import.meta.url), "utf8");
const guardedPages = [
  "../../app/office/page.tsx",
  "../../app/operations/page.tsx",
  "../../app/refunds/page.tsx",
  "../../app/casework/page.tsx",
  "../../app/master-file/page.tsx",
  "../../app/settings/page.tsx",
  "../../app/support-console/page.tsx",
  "../../app/learn/page.tsx",
];

test("protected application pages enforce issued identity", () => {
  for (const relativePath of guardedPages) {
    const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    assert.match(source, /requireIdentity\(\)/, `${relativePath} must call requireIdentity()`);
  }
});

test("identity fails closed without an issued role and MFA", () => {
  assert.match(identity, /accessStatus !== "issued"/);
  assert.match(identity, /assignedRoles\.length === 0/);
  assert.match(identity, /!user\.twoFactorEnabled/);
  assert.match(identity, /MFA_REQUIRED/);
});
