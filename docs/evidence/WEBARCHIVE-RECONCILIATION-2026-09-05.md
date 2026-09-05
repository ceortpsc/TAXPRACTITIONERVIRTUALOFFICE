# Web archive authorization reconciliation - September 5, 2026

## Evidence received

- Format: Apple Safari Webarchive
- Captured URL: `https://tax-practitioner-virtual-office.vercel.app/`
- Main resource: `text/html`, UTF-8, 2,902 bytes
- Supporting resources: seven JavaScript chunks
- SHA-256: `f8a409830987327bca56610dc11736de7a269c65da61f09b90ef69accd7b2c29`

The captured HTML contains only the selected authorization-row cells: `OAuth clients`, `2 active`, `ISP`, and `REVIEW`. It does not contain OAuth credentials, full client identifiers, redirect verification, scope verification, connectivity results, or an IRS application document.

## Reconciled interpretation

`Active` is retained as the IRS/source-reported registration status. `Review` is retained as the internal platform gate. They are separate facts, not contradictory statuses. An active registration does not prove that the deployed application possesses valid credentials, uses the correct OAuth client, has matching scopes and redirects, or has passed an end-to-end production test.

## Configuration applied

- Separate `IRS/source status` and `Platform gate` columns.
- Counts described as registered authorities rather than configured runtime connections.
- A masked `/api/authorizations` registry endpoint.
- A machine-readable `config/authorization-registry.json` reconciliation record.
- Production OAuth execution remains disabled until credential and connectivity evidence exists.

## Remaining verification gates

1. Identify the intended OAuth client for each product and environment.
2. Confirm exact registered redirect URLs and approved scopes.
3. Store current client secrets only in the production secret manager.
4. Run authorization-code, token refresh, revocation, error, and audit-log tests.
5. Record an authoritative successful test before changing the platform gate from `review` to `active`.
