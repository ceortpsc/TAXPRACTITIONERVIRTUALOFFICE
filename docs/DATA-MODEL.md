# Data model, query, and branch controls

`database/migrations/001_core.sql` is the authoritative PostgreSQL schema. Every tenant-bound request sets `app.tenant_id` inside the database transaction; row-level security is defense in depth, not a replacement for server authorization. Sensitive values are encrypted outside SQL literals and secrets are represented only by secret-manager references.

The seed is safe by design: it creates a verification-required tenant and test/not-configured integration records without real credentials or taxpayer data. `database/queries/operations.sql` contains parameterized operational queries. Never concatenate client input into SQL.

## Branch mapping

| Branch | Environment | Write rule |
|---|---|---|
| `main` | production | protected, verified commits only |
| `staging` | test/staging | integration testing and release candidates |
| `feature/*` | preview | scoped development through pull requests |

The working tree must remain reproducible from the canonical `package-lock.json`. Do not add competing npm, Yarn, or pnpm lockfiles. GitHub CI uses `npm ci`; direct connector deployments may use a manifest-safe install because the connector cannot transmit the full lockfile, but production Git integration should use the committed lockfile.
