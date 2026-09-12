import { createPublicKey, verify as verifySignature } from "node:crypto";

const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;
const CLOCK_SKEW_SECONDS = 60;
const jwksCache = new Map();

function decodeJsonSegment(segment) {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  } catch {
    throw new Error("INVALID_OIDC_TOKEN");
  }
}

function parseToken(token) {
  if (typeof token !== "string" || token.length < 32 || token.length > 16_384) throw new Error("INVALID_OIDC_TOKEN");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("INVALID_OIDC_TOKEN");
  const header = decodeJsonSegment(parts[0]);
  const payload = decodeJsonSegment(parts[1]);
  if (!header || typeof header !== "object" || !payload || typeof payload !== "object") throw new Error("INVALID_OIDC_TOKEN");
  return { header, payload, signingInput: `${parts[0]}.${parts[1]}`, signature: Buffer.from(parts[2], "base64url") };
}

function validateIssuer(value, owner) {
  if (typeof value !== "string") throw new Error("INVALID_OIDC_ISSUER");
  let issuer;
  try {
    issuer = new URL(value);
  } catch {
    throw new Error("INVALID_OIDC_ISSUER");
  }
  if (issuer.protocol !== "https:" || issuer.hostname !== "oidc.vercel.com" || issuer.search || issuer.hash) {
    throw new Error("INVALID_OIDC_ISSUER");
  }
  const pathname = issuer.pathname.replace(/\/$/, "");
  if (pathname && pathname !== `/${owner}`) throw new Error("INVALID_OIDC_ISSUER");
  return pathname ? `https://oidc.vercel.com${pathname}` : "https://oidc.vercel.com";
}

function includesAudience(audience, expected) {
  if (typeof audience === "string") return audience === expected;
  if (Array.isArray(audience)) return audience.some((value) => value === expected);
  return false;
}

function validateClaims(payload, env, nowSeconds) {
  const expectedOwnerId = env.VERCEL_EXPECTED_OWNER_ID;
  const expectedProjectId = env.VERCEL_EXPECTED_PROJECT_ID;
  const expectedEnvironment = env.VERCEL_EXPECTED_ENVIRONMENT || "production";
  if (!expectedOwnerId || !expectedProjectId) throw new Error("OIDC_EXPECTATION_NOT_CONFIGURED");

  if (typeof payload.owner !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(payload.owner)) throw new Error("INVALID_OIDC_CLAIMS");
  if (typeof payload.project !== "string" || !/^[A-Za-z0-9_.-]{1,256}$/.test(payload.project)) throw new Error("INVALID_OIDC_CLAIMS");
  if (payload.owner_id !== expectedOwnerId || payload.project_id !== expectedProjectId || payload.environment !== expectedEnvironment) {
    throw new Error("OIDC_SOURCE_MISMATCH");
  }

  const expectedAudience = env.VERCEL_EXPECTED_AUDIENCE || `https://vercel.com/${payload.owner}`;
  if (!includesAudience(payload.aud, expectedAudience)) throw new Error("OIDC_AUDIENCE_MISMATCH");

  const expectedSubject = `owner:${payload.owner}:project:${payload.project}:environment:${expectedEnvironment}`;
  if (payload.sub !== expectedSubject) throw new Error("OIDC_SUBJECT_MISMATCH");

  const exp = Number(payload.exp);
  const nbf = Number(payload.nbf ?? payload.iat);
  const iat = Number(payload.iat);
  if (!Number.isFinite(exp) || !Number.isFinite(nbf) || !Number.isFinite(iat)) throw new Error("INVALID_OIDC_TIMESTAMPS");
  if (exp <= nowSeconds - CLOCK_SKEW_SECONDS) throw new Error("OIDC_EXPIRED");
  if (nbf > nowSeconds + CLOCK_SKEW_SECONDS || iat > nowSeconds + CLOCK_SKEW_SECONDS) throw new Error("OIDC_NOT_YET_VALID");
  if (exp - iat > 24 * 60 * 60) throw new Error("OIDC_LIFETIME_TOO_LONG");

  return { expectedAudience, expectedSubject };
}

async function fetchJwks(issuer) {
  const cached = jwksCache.get(issuer);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const jwksUrl = `${issuer}/.well-known/jwks`;
  const response = await fetch(jwksUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error("OIDC_JWKS_UNAVAILABLE");
  const value = await response.json();
  if (!value || !Array.isArray(value.keys) || value.keys.length < 1 || value.keys.length > 20) throw new Error("INVALID_OIDC_JWKS");
  jwksCache.set(issuer, { value, expiresAt: Date.now() + JWKS_CACHE_TTL_MS });
  return value;
}

export async function verifyVercelOidcToken(token, options = {}) {
  const env = options.env || process.env;
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const { header, payload, signingInput, signature } = parseToken(token);

  if (header.alg !== "RS256" || typeof header.kid !== "string" || header.kid.length < 1 || header.kid.length > 256) {
    throw new Error("INVALID_OIDC_HEADER");
  }

  const issuer = validateIssuer(payload.iss, payload.owner);
  validateClaims(payload, env, nowSeconds);

  const jwks = options.jwks || await fetchJwks(issuer);
  const key = jwks.keys.find((candidate) => candidate && candidate.kid === header.kid && candidate.kty === "RSA");
  if (!key) throw new Error("OIDC_KEY_NOT_FOUND");

  let publicKey;
  try {
    publicKey = createPublicKey({ key, format: "jwk" });
  } catch {
    throw new Error("INVALID_OIDC_KEY");
  }

  const verified = verifySignature("RSA-SHA256", Buffer.from(signingInput), publicKey, signature);
  if (!verified) throw new Error("INVALID_OIDC_SIGNATURE");

  return {
    ownerId: payload.owner_id,
    projectId: payload.project_id,
    environment: payload.environment,
    subject: payload.sub,
    issuer,
  };
}
