"use client";

import { SignIn, SignUp } from "@clerk/nextjs";

export default function ClerkAuthCard({ mode }: { mode: "sign-in" | "sign-up" }) {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!configured) {
    return (
      <div className="authNotice" role="status">
        Identity configuration is not available in this environment.
      </div>
    );
  }

  return mode === "sign-in" ? (
    <SignIn signUpUrl="/sign-up" forceRedirectUrl="/office" />
  ) : (
    <SignUp signInUrl="/sign-in" forceRedirectUrl="/office" />
  );
}
