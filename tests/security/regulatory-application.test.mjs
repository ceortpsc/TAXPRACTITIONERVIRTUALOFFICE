import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("regulatory application contains all 26 controlled sections", async () => {
  const registry = await readFile(new URL("../../lib/regulatory-application.ts", import.meta.url), "utf8");
  for (let section = 1; section <= 26; section += 1) {
    assert.match(registry, new RegExp(`number: ${section}(?:,|\\s)`));
  }
  assert.match(registry, /actualDegreeStudentCount: 0/);
  assert.match(registry, /degreeEnrollmentStatus: "DISABLED"/);
  assert.match(registry, /degreeConferralStatus: "DISABLED"/);
  assert.match(registry, /titleIVStatus: "DISABLED"/);
});

test("consequential higher-education claims and transmissions are hard-disabled", async () => {
  const registry = await readFile(new URL("../../lib/regulatory-application.ts", import.meta.url), "utf8");
  assert.match(registry, /actualDegreeEnrollment: false/);
  assert.match(registry, /degreeConferral: false/);
  assert.match(registry, /titleIVProcessing: false/);
  assert.match(registry, /nsldsTransmission: false/);
  assert.match(registry, /eduDomainApprovalClaim: false/);
  assert.match(registry, /accreditationClaim: false/);
  assert.match(registry, /stateAuthorizationClaim: false/);
  assert.match(registry, /transmissionReady: false/);
});

test("regulatory readiness API requires identity and limits institutional roles", async () => {
  const route = await readFile(new URL("../../app/api/academics/regulatory/route.ts", import.meta.url), "utf8");
  assert.match(route, /requireIdentity/);
  assert.match(route, /owner/);
  assert.match(route, /compliance_officer/);
  assert.match(route, /university_admin/);
  assert.match(route, /status: 403/);
  assert.match(route, /status: 401/);
});
