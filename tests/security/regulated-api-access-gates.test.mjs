import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const identity = readFileSync(new URL("../../lib/identity.ts", import.meta.url), "utf8");
const workersRoute = readFileSync(new URL("../../app/api/workers/route.ts", import.meta.url), "utf8");
const masterFilesRoute = readFileSync(new URL("../../app/api/master-files/route.ts", import.meta.url), "utf8");

test("issued identity carries the active organization context", () => {
  assert.match(identity, /const \{ userId, orgId \} = await auth\(\)/);
  assert.match(identity, /organizationId: orgId \?\? null/);
  assert.match(identity, /accessStatus !== "issued"/);
  assert.match(identity, /!user\.twoFactorEnabled/);
});

test("worker evidence requires issued identity, organization, and audit permission", () => {
  assert.match(workersRoute, /requireIdentity\(\)/);
  assert.match(workersRoute, /ORGANIZATION_SESSION_REQUIRED/);
  assert.match(workersRoute, /authorize\(/);
  assert.match(workersRoute, /"audit\.read"/);
  assert.match(workersRoute, /status: 403/);
  assert.doesNotMatch(workersRoute, /import \{ auth \} from "@clerk\/nextjs\/server"/);
});

test("master file API separates read and write permissions", () => {
  assert.match(masterFilesRoute, /requireIdentity\(\)/);
  assert.match(masterFilesRoute, /ORGANIZATION_SESSION_REQUIRED/);
  assert.match(masterFilesRoute, /authorize\(/);
  assert.match(masterFilesRoute, /requireMasterFilePermission\("client\.read"\)/);
  assert.match(masterFilesRoute, /requireMasterFilePermission\("client\.write"\)/);
  assert.match(masterFilesRoute, /requiredPermission: permission/);
  assert.doesNotMatch(masterFilesRoute, /import \{ auth \} from "@clerk\/nextjs\/server"/);
});
