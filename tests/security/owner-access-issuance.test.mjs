import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../../scripts/identity/invite-owner.mjs", import.meta.url), "utf8");

test("owner access is issued, never silently created", () => {
  assert.match(source, /ACCESS_ISSUANCE_ACTION/);
  assert.match(source, /pending_enrollment/);
  assert.match(source, /No existing verified identity/);
  assert.doesNotMatch(source, /createUser\s*\(/);
});

test("owner issuance fails closed on identity and MFA controls", () => {
  assert.match(source, /Duplicate production identities detected/);
  assert.match(source, /verification\?\.status !== "verified"/);
  assert.match(source, /!user\.twoFactorEnabled/);
  assert.match(source, /roles: \["owner"\]/);
});

test("IRS-issued identifiers remain private and auditable", () => {
  assert.match(source, /privateMetadata/);
  assert.match(source, /classification: "restricted"/);
  assert.match(source, /source: "IRS-issued"/);
  assert.match(source, /identifierFingerprints/);

  const metadataUpdate = source.slice(
    source.indexOf("await client.users.updateUserMetadata"),
    source.indexOf("  privateMetadata:")
  );
  assert.doesNotMatch(metadataUpdate, /professionalIdentifiers|\bptin\b|\bcaf\b|\befin\b/);
});

test("invitation does not grant an active owner role or require issued identifiers", () => {
  const invitationStart = source.indexOf('if (action === "invite")');
  const issuanceValidation = source.indexOf("validateIssuedIdentifiers();");
  const invitation = source.slice(invitationStart, issuanceValidation);

  assert.ok(invitationStart >= 0);
  assert.ok(issuanceValidation > invitationStart);
  assert.match(invitation, /process\.exit\(0\)/);
  assert.match(invitation, /requestedRole: "owner"/);
  assert.doesNotMatch(invitation, /roles:\s*\["owner"\]/);
  assert.doesNotMatch(invitation, /validateIssuedIdentifiers|professionalIdentifiers|\bptin\b|\bcaf\b|\befin\b/);
});
