import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const signIn = readFileSync(new URL("../../app/sign-in/[[...sign-in]]/page.tsx", import.meta.url), "utf8");
const signUp = readFileSync(new URL("../../app/sign-up/[[...sign-up]]/page.tsx", import.meta.url), "utf8");
const authCard = readFileSync(new URL("../../app/auth/ClerkAuthCard.tsx", import.meta.url), "utf8");
const provider = readFileSync(new URL("../../app/ClerkRuntimeProvider.tsx", import.meta.url), "utf8");
const vercel = readFileSync(new URL("../../vercel.json", import.meta.url), "utf8");

test("sign-in and sign-up use the Clerk client surface instead of the prior placeholder", () => {
  assert.match(signIn, /ClerkAuthCard/);
  assert.match(signUp, /ClerkAuthCard/);
  assert.doesNotMatch(signIn, /Sign-in is being secured/);
  assert.doesNotMatch(signUp, /Account enrollment is not active/);
  assert.match(authCard, /<SignIn/);
  assert.match(authCard, /<SignUp/);
});

test("Clerk Core 3 auth boundary uses Show instead of removed SignedIn or SignedOut components", () => {
  assert.match(provider, /Show/);
  assert.match(provider, /when="signed-in"/);
  assert.doesNotMatch(provider, /SignedIn/);
  assert.doesNotMatch(provider, /SignedOut/);
  assert.doesNotMatch(provider, /Protect/);
});

test("production CSP permits the live Clerk frontend API host", () => {
  assert.match(vercel, /https:\/\/clerk\.taxprac\.rosstaxsoftware\.com/);
  assert.match(vercel, /script-src/);
  assert.match(vercel, /connect-src/);
});
