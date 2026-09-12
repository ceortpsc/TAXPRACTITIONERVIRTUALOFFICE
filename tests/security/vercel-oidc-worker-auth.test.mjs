import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { verifyVercelOidcToken } from "../../services/worker-adapter/vercel-oidc.mjs";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicJwk = publicKey.export({ format: "jwk" });
publicJwk.kid = "rtpsc-test-key";
publicJwk.alg = "RS256";
publicJwk.use = "sig";

const env = {
  VERCEL_EXPECTED_OWNER_ID: "team_MNVMTV4RF7C2VbLtpGSVArb8",
  VERCEL_EXPECTED_PROJECT_ID: "prj_PBc91N58cpGGThaOxB3RbFB0p3Lo",
  VERCEL_EXPECTED_ENVIRONMENT: "production",
};

const nowSeconds = 1_789_237_000;

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function makeToken(overrides = {}) {
  const header = { typ: "JWT", alg: "RS256", kid: publicJwk.kid };
  const payload = {
    iss: "https://oidc.vercel.com/condrer-3533",
    aud: "https://vercel.com/condrer-3533",
    sub: "owner:condrer-3533:project:tax-practitioner-virtual-office:environment:production",
    owner: "condrer-3533",
    owner_id: env.VERCEL_EXPECTED_OWNER_ID,
    project: "tax-practitioner-virtual-office",
    project_id: env.VERCEL_EXPECTED_PROJECT_ID,
    environment: "production",
    iat: nowSeconds - 10,
    nbf: nowSeconds - 10,
    exp: nowSeconds + 3600,
    ...overrides,
  };
  const signingInput = `${encode(header)}.${encode(payload)}`;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput), privateKey).toString("base64url");
  return `${signingInput}.${signature}`;
}

test("Vercel workload identity accepts a valid signed production token", async () => {
  const identity = await verifyVercelOidcToken(makeToken(), {
    env,
    nowSeconds,
    jwks: { keys: [publicJwk] },
  });
  assert.equal(identity.ownerId, env.VERCEL_EXPECTED_OWNER_ID);
  assert.equal(identity.projectId, env.VERCEL_EXPECTED_PROJECT_ID);
  assert.equal(identity.environment, "production");
});

test("Vercel workload identity rejects a token from a different project", async () => {
  await assert.rejects(
    verifyVercelOidcToken(makeToken({ project_id: "prj_wrong" }), {
      env,
      nowSeconds,
      jwks: { keys: [publicJwk] },
    }),
    /OIDC_SOURCE_MISMATCH/,
  );
});

test("Vercel workload identity rejects expired tokens", async () => {
  await assert.rejects(
    verifyVercelOidcToken(makeToken({ iat: nowSeconds - 7200, nbf: nowSeconds - 7200, exp: nowSeconds - 3600 }), {
      env,
      nowSeconds,
      jwks: { keys: [publicJwk] },
    }),
    /OIDC_EXPIRED/,
  );
});

test("Vercel workload identity rejects tampered signatures", async () => {
  const token = makeToken();
  const [head, payload] = token.split(".");
  const invalidSignature = Buffer.alloc(256, 7).toString("base64url");
  await assert.rejects(
    verifyVercelOidcToken(`${head}.${payload}.${invalidSignature}`, {
      env,
      nowSeconds,
      jwks: { keys: [publicJwk] },
    }),
    /INVALID_OIDC_SIGNATURE/,
  );
});
