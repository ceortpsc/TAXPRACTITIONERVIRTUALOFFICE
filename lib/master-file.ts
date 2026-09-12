import { createHash } from "node:crypto";

export const masterFileChecks = [
  ["entity_tin", "Entity / TIN match"],
  ["tax_period_mft", "Tax period and MFT"],
  ["return_posting", "Return posting"],
  ["credits_payments", "Credits and payments"],
  ["refund_transactions", "Refund transactions"],
  ["freeze_holds", "Freeze and hold conditions"],
  ["offsets_liabilities", "Offsets and liabilities"],
  ["notices_controls", "Notices and control bases"],
  ["pending_transactions", "Pending transactions"],
  ["statute_authorization", "Statute and authorization gates"],
] as const;

export type MasterFileCheckCode = (typeof masterFileChecks)[number][0];
export type MasterFileCheckState = "not_available" | "pass" | "flag" | "hold";
export type MasterFileClientType = "individual" | "business" | "estate" | "trust" | "exempt";
export type MasterFileSourceType = "account_transcript" | "return_transcript" | "record_of_account" | "wage_income" | "authorized_document" | "manual_verified";

export type MasterFileCreateInput = {
  displayName: string;
  clientType: MasterFileClientType;
  tinLast4: string;
  taxPeriod: string;
  mft?: string;
  sourceType: MasterFileSourceType;
  sourceReference?: string;
  authorizationKind: string;
  authorizationExpiresAt?: string;
};

export type MasterFileContext = {
  userId: string;
  organizationId: string;
  environment: string;
};

function normalizeText(value: unknown, max: number, code: string) {
  if (typeof value !== "string") throw new Error(code);
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function assertDate(value: unknown, field: string) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`INVALID_${field.toUpperCase()}`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`INVALID_${field.toUpperCase()}`);
  return value;
}

export function validateMasterFileInput(input: MasterFileCreateInput) {
  if (!input || typeof input !== "object") throw new Error("INVALID_MASTER_FILE_INPUT");
  const displayName = normalizeText(input.displayName, 120, "INVALID_DISPLAY_NAME");
  if (displayName.length < 2) throw new Error("INVALID_DISPLAY_NAME");
  if (typeof input.tinLast4 !== "string" || !/^[0-9]{4}$/.test(input.tinLast4)) throw new Error("INVALID_TIN_LAST4");
  if (typeof input.taxPeriod !== "string" || !/^\d{4}(?:0[1-9]|1[0-2])$/.test(input.taxPeriod)) throw new Error("INVALID_TAX_PERIOD");
  if (!(["individual", "business", "estate", "trust", "exempt"] as const).includes(input.clientType)) throw new Error("INVALID_CLIENT_TYPE");
  if (!(["account_transcript", "return_transcript", "record_of_account", "wage_income", "authorized_document", "manual_verified"] as const).includes(input.sourceType)) throw new Error("INVALID_SOURCE_TYPE");
  const authorizationKind = normalizeText(input.authorizationKind, 80, "INVALID_AUTHORIZATION_KIND");
  if (authorizationKind.length < 2) throw new Error("INVALID_AUTHORIZATION_KIND");
  const authorizationExpiresAt = input.authorizationExpiresAt ? assertDate(input.authorizationExpiresAt, "authorization_expiry") : undefined;

  return {
    displayName,
    clientType: input.clientType,
    tinLast4: input.tinLast4,
    taxPeriod: input.taxPeriod,
    mft: input.mft ? normalizeText(input.mft, 12, "INVALID_MFT").toUpperCase() : undefined,
    sourceType: input.sourceType,
    sourceReference: input.sourceReference ? normalizeText(input.sourceReference, 120, "INVALID_SOURCE_REFERENCE") : undefined,
    authorizationKind,
    authorizationExpiresAt,
  };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function buildMasterFileRecord(input: MasterFileCreateInput, context: MasterFileContext) {
  const normalized = validateMasterFileInput(input);
  const recordId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const record = {
    schemaVersion: "2026.09.12",
    recordId,
    organizationId: context.organizationId,
    ownerSubject: context.userId,
    environment: context.environment,
    client: {
      displayName: normalized.displayName,
      clientType: normalized.clientType,
      tinLast4: normalized.tinLast4,
    },
    module: {
      taxPeriod: normalized.taxPeriod,
      mft: normalized.mft || null,
    },
    source: {
      type: normalized.sourceType,
      reference: normalized.sourceReference || null,
      receivedAt: createdAt,
    },
    authorization: {
      kind: normalized.authorizationKind,
      expiresAt: normalized.authorizationExpiresAt || null,
    },
    checkpoints: Object.fromEntries(masterFileChecks.map(([code, label]) => [code, { label, state: "not_available" as MasterFileCheckState }])),
    status: "intake",
    createdAt,
  };
  const integritySha256 = createHash("sha256").update(stableJson(record)).digest("hex");
  return {
    ...record,
    integrity: {
      algorithm: "sha256",
      digest: integritySha256,
      sealedAt: createdAt,
    },
  };
}
