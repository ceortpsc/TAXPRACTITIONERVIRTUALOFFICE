import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedEnvelope = {
  alg: "A256GCM";
  keyId: string;
  keyVersion: string;
  iv: string;
  ciphertext: string;
  tag: string;
  aad: string;
  createdAt: string;
};

export interface KeyProvider {
  getKey(keyId: string, keyVersion: string): Promise<Uint8Array>;
}

function assertAes256Key(key: Uint8Array) {
  if (key.byteLength !== 32) throw new Error("A256GCM requires an exact 32-byte key");
}

export async function encryptEnvelope(
  plaintext: Uint8Array,
  context: { tenantId: string; resourceType: string; resourceId: string; keyId: string; keyVersion: string },
  provider: KeyProvider,
): Promise<EncryptedEnvelope> {
  const key = await provider.getKey(context.keyId, context.keyVersion);
  assertAes256Key(key);
  const iv = randomBytes(12);
  const aad = Buffer.from(JSON.stringify({
    tenantId: context.tenantId,
    resourceType: context.resourceType,
    resourceId: context.resourceId,
    keyVersion: context.keyVersion,
  }));
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    alg: "A256GCM",
    keyId: context.keyId,
    keyVersion: context.keyVersion,
    iv: iv.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    aad: aad.toString("base64url"),
    createdAt: new Date().toISOString(),
  };
}

export async function decryptEnvelope(envelope: EncryptedEnvelope, provider: KeyProvider): Promise<Uint8Array> {
  if (envelope.alg !== "A256GCM") throw new Error("Unsupported encryption algorithm");
  const key = await provider.getKey(envelope.keyId, envelope.keyVersion);
  assertAes256Key(key);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64url"));
  decipher.setAAD(Buffer.from(envelope.aad, "base64url"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64url")), decipher.final()]);
}
