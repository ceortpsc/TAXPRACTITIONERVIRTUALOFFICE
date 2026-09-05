# Tax Practitioner Virtual Office

Multipage Next.js 16 foundation for Ross Tax Pro Software Co.: refund tracking, federal refund trace footprints, Master File reconciliation, TC 570/810 casework, intervention controls, document governance, and IRS authorization gates.

The software supports authorized research and resolution workflows. It does not input, reverse, or release IRS transaction codes and does not guarantee refunds.

## Run

```bash
npm install
npm run dev
```

Use `npm run check` for lint, TypeScript, and production build verification. Review `docs/IRS-RECONCILIATION.md` before connecting production systems.

## Operating package

- `docs/`: architecture and IRS reconciliation
- `policies/`: execution and approval boundaries
- `runbooks/`: deployment, rollback, and refund casework
- `resources/agents/`: Andrea and specialist-agent instructions
- `resources/employees/`: workforce onboarding and security handbook
- `design/` and `public/assets/`: brand tokens, logo, and generated hero art
- `scripts/runtime/`: environment preflight checks
- `scripts/deploy/`: deployment and rollback controls
- `output/pdf/`: generated controlled manuals

Run `node scripts/runtime/preflight.mjs` before deployment and `python3 scripts/generate_pdfs.py` after controlled-document updates.
