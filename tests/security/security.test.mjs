import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { redact, redactText } from "../../lib/security/redaction.ts";
import { decryptEnvelope, encryptEnvelope } from "../../lib/security/envelope.ts";
import { validateXmlInput } from "../../lib/security/xml.ts";

test("redacts regulated identifiers and structured credentials", () => {
  const source = `SSN ${["123", "45", "6789"].join("-")} EIN ${["12", "3456789"].join("-")}`;
  assert.equal(redactText(source), "SSN ***-**-**** EIN **-*******");
  assert.deepEqual(redact({ email: "person@example.com", nested: { note: "call 512-489-6749" } }), {
    email: "[REDACTED]",
    nested: { note: "call [REDACTED_PHONE]" },
  });
});

test("AES-GCM envelope round trips and rejects tampering", async () => {
  const key = randomBytes(32);
  const provider = { getKey: async () => key };
  const envelope = await encryptEnvelope(Buffer.from("restricted taxpayer data"), {
    tenantId: "tenant-1", resourceType: "document", resourceId: "doc-1", keyId: "test", keyVersion: "1",
  }, provider);
  assert.equal(Buffer.from(await decryptEnvelope(envelope, provider)).toString(), "restricted taxpayer data");
  const replacement = envelope.ciphertext[0] === "A" ? "B" : "A";
  await assert.rejects(() => decryptEnvelope({ ...envelope, ciphertext: `${replacement}${envelope.ciphertext.slice(1)}` }, provider));
});

test("XML gate rejects entities and accepts bounded XML 1.0", () => {
  assert.doesNotThrow(() => validateXmlInput('<?xml version="1.0"?><root/>', "application/xml"));
  assert.throws(() => validateXmlInput('<?xml version="1.0"?><!DOCTYPE x [<!ENTITY y SYSTEM "file:///etc/passwd">]><x>&y;</x>', "application/xml"));
});
