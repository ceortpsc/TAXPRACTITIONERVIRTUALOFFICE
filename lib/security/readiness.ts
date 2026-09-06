export type SecurityControl = { status: "ready" | "gated"; detail: string };

export function securityReadiness(): Record<string, SecurityControl> {
  return {
    transportSecurity: { status: "ready", detail: "HSTS and secure response headers are enforced" },
    applicationEncryption: { status: "ready", detail: "AES-256-GCM envelope format with authenticated context is implemented" },
    productionKeyManagement: {
      status: process.env.ENCRYPTION_KEY_ID && process.env.ENCRYPTION_KEY_VERSION ? "ready" : "gated",
      detail: "Requires managed key ID and version; private key material is not exposed",
    },
    auditSigning: {
      status: process.env.AUDIT_SIGNING_KEY_ID ? "ready" : "gated",
      detail: "Requires a managed audit signing key reference",
    },
    certificate: {
      status: process.env.TLS_CERTIFICATE_REFERENCE ? "ready" : "gated",
      detail: "Requires a deployed certificate reference and independent validation",
    },
    redaction: { status: "ready", detail: "Structured secrets, taxpayer identifiers, contacts, and tokens are redacted" },
    hostileXmlDefense: { status: "ready", detail: "DOCTYPE and ENTITY input is rejected with a one MiB limit" },
  };
}
