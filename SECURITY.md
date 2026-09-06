# Security policy

Never submit taxpayer information, credentials, OAuth secrets, access tokens, private keys, or unmasked government identifiers through public issues or commits. Rotate exposed credentials immediately, preserve audit evidence, and review access logs. This public repository must contain no production taxpayer data.

The application uses authenticated AES-256-GCM envelopes with tenant/resource context, centralized log redaction, hostile-XML rejection, tenant RLS, separation of duties, and append-only signed audit-chain storage. Production key material must remain in a managed KMS/HSM; repository and deployment metadata may contain key identifiers only.

These controls are designed to support an IRS-aligned security program. They are not an IRS certification, authorization to access taxpayer data, or substitute for an independent assessment, written information security plan, incident-response program, or applicable IRS assurance testing.
