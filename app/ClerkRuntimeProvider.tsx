"use client";

import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";

export default function ClerkRuntimeProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) return <>{children}</>;

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
      <SignedIn>
        <div
          aria-label="Authenticated user profile"
          style={{ position: "fixed", top: 18, right: 18, zIndex: 1000 }}
        >
          <UserButton />
        </div>
      </SignedIn>
    </ClerkProvider>
  );
}
