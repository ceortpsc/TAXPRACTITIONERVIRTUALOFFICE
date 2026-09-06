# Clerk SAML Identity Runbook

## Intended connection

- Application: Tax Practitioner Virtual Office
- Verified login domain: `rosstaxsoftware.com`
- Initial owner: `ceo@rosstaxsoftware.com`
- Owner phone: `+1 512-489-6749` (pending Clerk verification)
- Username metadata: `CONDREROS`
- Application role: `owner`
- MFA: mandatory
- Password bootstrap: prohibited; use a one-time Clerk invitation and IdP authentication

## 1. Provision Clerk

Install Clerk through the Vercel Marketplace for the production, preview, and development environments. Confirm `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` exist. Never copy either value into source control.

## 2. Create the SAML connection

In Clerk, create a Custom SAML Provider restricted to `rosstaxsoftware.com`. Record the Clerk ACS URL and SP Entity ID in the approved secrets/evidence system. Give those two values to the IdP administrator.

The IdP must return `mail`; `firstName` and `lastName` are recommended. Administrative roles are assigned in Clerk after identity verification. Do not accept `owner`, `super_admin`, or `firm_admin` directly from an unapproved SAML assertion.

## 3. Complete IdP configuration

Prefer an IdP metadata URL. Otherwise configure its SSO URL, issuer/entity ID, and active signing certificate. Assign only the authorized workforce group. Verify certificate expiration monitoring.

## 4. Test before enabling

1. Keep the SAML connection disabled.
2. Test in preview with a non-owner account and confirm domain enforcement, signed assertion validation, email mapping, logout, session expiration, and denial for unassigned users.
3. Test the owner account and confirm MFA.
4. Confirm `/office`, `/refunds`, `/casework`, `/master-file`, and `/settings` reject anonymous access.
5. Preserve test identifiers, timestamps, outcomes, and reviewer approval without storing assertions or secrets.
6. Enable the connection during an approved access window and keep a Clerk break-glass administrator outside the domain-routing rule.

## 5. Create or reconcile the owner

After secrets and `APP_URL` are installed, run `npm run identity:invite-owner`. The script is idempotent: it issues a one-time invitation when absent or reconciles the `owner` role and pending phone metadata for an existing matching Clerk user. It never marks the phone as verified, accepts a password, or stores one.

## 6. Production gate

Production readiness requires: paid Clerk plan, email enabled, domain ownership verified, IdP metadata verified, certificate monitoring, MFA, break-glass test, invitation accepted, role review, route protection test, audit evidence, and rollback rehearsal. Do not enable domain-wide redirection before every item passes.
# Account Portal activation

The Account Portal dashboard preview requires an authenticated application session. Configure its sign-in, sign-up, unauthorized-sign-in, user-profile, organization-profile, and create-organization redirects to the production application. Store the hosted portal origin as `NEXT_PUBLIC_CLERK_ACCOUNT_PORTAL_URL`; it is a public URL, never a secret.

Application routes are `/sign-in`, `/sign-up`, and `/office`. After keys are installed, create the first owner account, require MFA, confirm the `rosstaxsoftware.com` domain, validate SAML with a non-owner test account, and only then enable domain enforcement. Do not enable SAML before the break-glass owner login has been tested.
