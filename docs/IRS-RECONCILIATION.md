# IRS authorization and workflow reconciliation

This register compares user-supplied ACA, API Client ID, e-file, and IRIS application snapshots. It does not amend or confirm an IRS record.

## Entity release gate

Keep each legal entity as a separate tenant until authoritative documents establish the correct ownership and authorized relationship. A DBA is an alias—not a replacement for the legal entity or EIN. The supplied records conflict on legal entity, EIN, address spelling, business name, and phone. Production transmission is blocked until the responsible official approves a verified entity matrix and the IRS records are corrected where necessary.

## Functional release gates

- e-file: validate provider option, form family, ETIN environment, EFIN status, and transmission status.
- ACA AIR: keep test software IDs outside production queues until assurance testing is complete.
- IRIS: separate Portal and A2A TCCs and enforce form plus T/P eligibility.
- IRS APIs: use exact registered redirects and store secrets outside Git.
- Refund casework: distinguish research, prepared, submitted, received, pending, and resolved states.

## TC 570 and TC 810 boundary

TC 570 or TC 810 can indicate a stopped or frozen refund. The practitioner workflow identifies the responsible function, collects authorization and evidence, records contacts, prepares permitted responses or referrals, and monitors the account. Only an authorized IRS function can input or release IRS transaction codes. The application therefore never labels a case “reversed” or “released” without authoritative account evidence.

## Refund trace footprint

Before opening a trace workflow, verify the taxpayer, tax period, payment method, issue transaction and date, non-receipt claim, address/direct-deposit facts, and applicable waiting period. Track Form 3911 or oral-statement eligibility, IRS/BFS references, contact history, replacement/claim status, and final disposition.

## Security

Rotate any secret transmitted in a document or chat. Never commit taxpayer data, OAuth secrets, access tokens, private keys, or unmasked government identifiers. Require MFA, tenant isolation, least privilege, encryption, immutable audit events, retention controls, and incident response.

## Official procedure sources

- IRS IRM 21.4.1, Refund Research
- IRS IRM 21.4.2, Refund Trace and Limited Payability
- IRS IRM 21.4.3, Returned Refunds/Releases
- IRS IRM 21.4.4, Manual Refunds
- IRS IRM 21.5.6, Freeze Codes
- IRS IRM 21.5.10, Examination Issues
- IRS IRM 25.25.6 and 25.25.13, taxpayer protection and return-integrity account resolution

Procedures must be reviewed against the current official IRM before production release.
