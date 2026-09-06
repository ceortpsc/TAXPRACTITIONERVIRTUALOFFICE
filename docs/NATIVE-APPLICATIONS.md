# Native Applications Runbook

## Production registration

- Clerk application: `app_3IvgjrZGO91W0pBTQ7htGkKkT8r`
- Production instance: `ins_3Iw6GQOWIBq9DTw01mJGuzWqxlg`
- Frontend API: `clerk.rosstaxsoftware.com`
- Native API: enabled and saved on 2026-09-06
- Android namespace: `RossTaxPro`
- Android package: `com.rosstaxsoftware.virtualoffice`
- Android hosted-auth callback: `clerk://com.rosstaxsoftware.virtualoffice.callback`
- iOS bundle ID reserved in source: `com.rosstaxsoftware.virtualoffice`
- iOS registration status: blocked pending Apple App ID prefix/Team ID

## Security model

The application embeds only the Clerk publishable key. Clerk sessions are persisted with `expo-secure-store` through Clerk's token cache. Secret keys, passwords, one-time codes, recovery codes, full taxpayer identifiers and payment credentials are prohibited in the mobile bundle, client logs and support chat.

Production hosted authentication validates callbacks against the native application registered in Clerk. Android SHA-256 signing fingerprints must be added after EAS/Google Play signing credentials exist. iOS requires the Apple Team ID/App ID prefix before Clerk registration and store signing.

## Build gates

```bash
cd apps/mobile
npm ci
npm run typecheck
npm run doctor
eas build --platform android --profile production
eas build --platform ios --profile production
```

Store binaries are not considered deployed until EAS signing succeeds, physical-device authentication is verified, and Apple/Google review or managed distribution completes.

