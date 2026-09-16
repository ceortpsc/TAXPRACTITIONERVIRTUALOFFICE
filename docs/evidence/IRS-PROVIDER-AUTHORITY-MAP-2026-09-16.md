# IRS Provider Authority and Runtime Evidence Map

**Classification:** public-safe engineering map  
**Source posture:** documented snapshot, not runtime credential verification  
**Date mapped:** 2026-09-16

## Canonical phrasing

The uploaded bundle establishes documentary snapshots of IRS enrollment/application records and one rendered bank-product dispute correspondence. The IRS documents may establish that an application, provider option, identifier, or API client was shown with a particular status at the time the PDF was produced. They do **not** establish that this application's production runtime currently holds the corresponding credential, that a specific API call or MeF transmission occurred, or that a downstream bank/Stripe transaction occurred.

The rendered SBTPG/Green Dot correspondence is an application-side communication artifact. It is not a provider-native SBTPG ledger, ACH trace, complete RFC822 email source, delivery report, or independent verification of claims written in the message.

## Extracted document classes

| Source | Documentary class | Safe mapped facts | Runtime conclusion |
|---|---|---|---|
| `api1-copy.pdf` | IRS API Client ID Application | Application completed; API label; selected APIs SOR/TDS/TINM/IRIS; ISP integration; client status shown Active | Runtime IRS API configuration remains separately verifiable |
| `api2-copy.pdf` | IRIS Application for TCC | Transmitter and Software Developer roles; A2A/Portal methods; active TCC records shown in source | No inference that this application has performed a production IRIS transmission |
| `api3.pdf` | ACA Application for TCC | Issuer/Transmitter/Software Developer roles; active TCC records; 2025 in-house software package shown Test | No inference that ACA production transmission occurred |
| `api4.pdf` | e-File Application | Provider options shown Accepted; EFIN shown Active; production/test ETIN roles; forms transmission status shown Test | Provider enrollment is distinct from installed production credentials and live MeF execution |
| `pp.pdf` | Rendered email/case correspondence | Bank-product dispute context and references to requested evidence | Not provider-native ledger, `.eml`, complete headers, delivery proof, or disbursement trace |

Full sensitive identifiers and third-party PII remain in the user-supplied source documents and are intentionally excluded from the public repository map.

## Evidence model

### 1. Immutable source layer

`018_evidence_ledger.sql` introduces:

- `evidence_artifacts` - immutable object-store references and SHA-256 provenance.
- `evidence_chain_events` - append-only chain-of-custody observations.
- `evidence_correlations` - relationships from an artifact to a return, case, transmission, request, webhook, or provider record.
- `evidence_verifications` - independent verification events without rewriting the original artifact.

Ordinary tenant sessions receive SELECT and INSERT policies only. No UPDATE or DELETE policy is created for evidence rows.

### 2. IRS provider authority layer

`019_irs_provider_authority.sql` separates provider enrollment evidence from live integrations:

- `provider_authority_applications`
- `provider_authority_roles`
- `provider_authority_identifiers`
- `provider_api_client_registrations`
- `provider_form_authorizations`
- `provider_software_packages`

EFIN, ETIN, TCC, software IDs, API client IDs, application tracking numbers, redirect URLs, and similar values are designed to be encrypted/masked rather than committed as seed data.

### 3. Runtime forensic layer

`020_runtime_forensic_evidence.sql` maps the nine requested evidence families:

| Requested evidence | Storage surface |
|---|---|
| Tax return audit/access | `return_audit_events`, `return_access_events`, `return_revision_snapshots` |
| IRS MeF transmissions/acknowledgments | `mef_submissions`, `mef_transmission_attempts`, `mef_acknowledgments`, `mef_business_rule_results` |
| IRS API calls | `irs_api_authorization_context`, `irs_api_requests` |
| SBTPG/bank-product history | `bank_product_cases`, `bank_product_status_events`, `bank_product_ledger_entries`, `bank_product_disbursements` |
| Email source/headers/delivery | `email_messages`, `email_headers`, `email_delivery_events` |
| Application jobs/workers | existing worker control plane + `worker_attempt_logs` |
| Webhook delivery/retries | existing `webhook_events` + `webhook_delivery_attempts` |
| Proxy/tunnel/firewall/access | `network_request_events`, `security_edge_events` |
| Stripe | `stripe_events`, `stripe_api_requests` |

## Evidence-state rules

Use these distinctions consistently:

- **DOCUMENTED_SNAPSHOT** - appears in a supplied/provider document.
- **RUNTIME_OBSERVED** - captured by the running application or infrastructure.
- **PROVIDER_REPORTED** - retrieved directly from a provider response/export.
- **PROVIDER_VERIFIED** - independently matched to a provider reference or signature.
- **CORRELATED** - linked by controlled identifiers/timestamps/hashes; correlation is not independent verification.
- **DISPUTED** - evidence or provider status conflicts with another source.
- **UNAVAILABLE** - expected evidence was not produced or retained.

## Gap map from the uploaded bundle

1. **Return audit/access logs:** not present in the uploaded PDFs.
2. **MeF transmission/ack records:** enrollment authority is present; transaction-level MeF evidence is not.
3. **IRS API request logs:** API client enrollment is present; request/response runtime logs are not.
4. **SBTPG case/ledger/disbursement trace:** a dispute correspondence is present; provider-native case history/ledger/trace is not.
5. **Email source with complete headers/delivery:** a rendered email is present; `.eml`, complete headers, and delivery events are not.
6. **Worker queues/logs:** not present in the bundle; the repository has a worker control plane that the new attempt ledger extends.
7. **Webhook delivery/retry:** not present in the bundle.
8. **Proxy/tunnel/firewall/access logs:** not present in the bundle.
9. **Stripe events:** not present in the bundle and must remain empty unless Stripe is actually connected and produces evidence.

## Ingestion rule

Never seed provider/runtime events solely from narrative correspondence. Ingest the uploaded PDFs as `USER_PROVIDED` evidence artifacts, then create provider/runtime records only when a provider-native export, signed/verified response, `.eml`, infrastructure log, or application runtime record exists.
