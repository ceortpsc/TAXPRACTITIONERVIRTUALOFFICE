# Security keys, certificates, and release gate

This application implements IRS-aligned safeguards; it does not claim IRS certification. Independent security, privacy, legal, and compliance assessments remain required before regulated production processing.

## Production gate

1. Provision separate managed keys for data encryption and audit signing in an approved KMS/HSM.
2. Grant the production workload encrypt/decrypt access by workload identity; never export private key material.
3. Set `ENCRYPTION_KEY_ID`, `ENCRYPTION_KEY_VERSION`, and `AUDIT_SIGNING_KEY_ID` as encrypted deployment variables.
4. Attach and validate the public TLS certificate, then store only its manager reference in `TLS_CERTIFICATE_REFERENCE`.
5. Apply migration `004_security_envelopes.sql` under a change ticket, verify RLS, and record its checksum.
6. Run `npm run check`, deploy an immutable revision, verify `/api/security/readiness`, and retain the evidence artifact.
7. Rotate keys every 90 days or immediately after suspected exposure. Preserve decrypt-only versions until retention obligations expire.

## Prohibited actions

- Do not commit JSON service-account keys, PEM private keys, database passwords, taxpayer data, or JWT secrets.
- Do not put `DATA_ENCRYPTION_KEY_B64` in production; it is reserved for isolated development testing.
- Do not log plaintext payloads, authentication headers, cookies, identifiers, or decrypted documents.
- Do not activate transmissions solely because the software deployed successfully; authorization and assurance gates remain separate.
