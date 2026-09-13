"use client";

import { Component, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";

function AuthFallback({ failed = false }: { failed?: boolean }) {
  return (
    <div className="authNotice" role={failed ? "alert" : "status"} aria-live="polite">
      <strong>{failed ? "Secure sign-in could not load." : "Loading secure sign-in…"}</strong>
      <p>
        {failed
          ? "Refresh this page or temporarily disable content blocking for rosstaxsoftware.com. No taxpayer data has been transmitted."
          : "Connecting to the RTPSC identity service."}
      </p>
      {failed ? (
        <button type="button" className="button primary" onClick={() => window.location.reload()}>
          Retry secure sign-in
        </button>
      ) : null}
    </div>
  );
}

class AuthErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("RTPSC identity surface failed", { message: error.message, componentStack: info.componentStack });
    this.props.onError();
  }

  render() {
    return this.state.failed ? <AuthFallback failed /> : this.props.children;
  }
}

export default function ClerkAuthCard({ mode }: { mode: "sign-in" | "sign-up" }) {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!configured) return;

    const detectReady = () => {
      const host = hostRef.current;
      const clerkLoaded = Boolean((window as Window & { Clerk?: { loaded?: boolean } }).Clerk?.loaded);
      const rendered = Boolean(host?.querySelector(".cl-rootBox, form, input, button"));
      if (clerkLoaded && rendered) setReady(true);
    };

    detectReady();
    const observer = new MutationObserver(detectReady);
    if (hostRef.current) observer.observe(hostRef.current, { childList: true, subtree: true });

    const interval = window.setInterval(detectReady, 250);
    const timeout = window.setTimeout(() => {
      detectReady();
      if (!(window as Window & { Clerk?: { loaded?: boolean } }).Clerk?.loaded) setFailed(true);
    }, 8000);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [configured]);

  if (!configured) {
    return (
      <div className="authNotice" role="alert">
        Identity configuration is not available in this environment.
      </div>
    );
  }

  return (
    <AuthErrorBoundary onError={() => setFailed(true)}>
      <div className="authSurface" aria-busy={!ready && !failed}>
        {!ready ? <AuthFallback failed={failed} /> : null}
        <div ref={hostRef} hidden={failed}>
          {mode === "sign-in" ? (
            <SignIn signUpUrl="/sign-up" forceRedirectUrl="/office" />
          ) : (
            <SignUp signInUrl="/sign-in" forceRedirectUrl="/office" />
          )}
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
