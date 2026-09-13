import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const proxySource = fs.readFileSync(new URL("../../proxy.ts", import.meta.url), "utf8");
const authSource = fs.readFileSync(
  new URL("../../app/auth/ClerkAuthCard.tsx", import.meta.url),
  "utf8",
);

test("Clerk frontend API is proxied through the application origin", () => {
  assert.match(proxySource, /frontendApiProxy:\s*\{\s*enabled:\s*true\s*\}/);
  assert.match(proxySource, /"\/__clerk\/:path\*"/);
});

test("all regulated workspaces remain behind the identity gate", () => {
  for (const route of [
    "/office",
    "/operations",
    "/refunds",
    "/casework",
    "/master-file",
    "/settings",
    "/support-console",
    "/learn",
  ]) {
    assert.match(proxySource, new RegExp(`"${route.replace("/", "\\/")}"`));
  }
});

test("the identity surface exposes loading, failure, and retry states", () => {
  assert.match(authSource, /Loading secure sign-in/);
  assert.match(authSource, /Secure sign-in could not load/);
  assert.match(authSource, /Retry secure sign-in/);
  assert.match(authSource, /No taxpayer data has been transmitted/);
});
