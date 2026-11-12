"use client";

import type { ReactNode } from "react";
import { ClerkProvider, SignIn, Waitlist } from "@clerk/react";
import {
  clerkAuthAppearance,
  clerkLocalization,
} from "../../../../webflow/clerk-react/clerk-theme";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const SIGN_IN_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/client-hub/sign-in";
const REQUEST_ACCESS_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/client-hub/request-access";
const FORCE_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL || "/client-hub";
const FALLBACK_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/client-hub";

function MissingKey() {
  return (
    <div
      role="alert"
      style={{
        maxWidth: 560,
        padding: 24,
        border: "2px solid #e05047",
        borderRadius: 8,
        color: "#163666",
        background: "#fff",
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <strong>Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</strong>
      <p style={{ marginBottom: 0 }}>
        Add your Clerk development publishable key to
        <code> apps/design-system/.env.local</code>, then restart the Fumadocs dev server.
      </p>
    </div>
  );
}

function ArchivedLayoutProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) return <MissingKey />;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={SIGN_IN_URL}
      signUpUrl={REQUEST_ACCESS_URL}
      waitlistUrl={REQUEST_ACCESS_URL}
      signInForceRedirectUrl={FORCE_REDIRECT_URL}
      signInFallbackRedirectUrl={FALLBACK_REDIRECT_URL}
      signUpForceRedirectUrl={FORCE_REDIRECT_URL}
      signUpFallbackRedirectUrl={FALLBACK_REDIRECT_URL}
      localization={clerkLocalization}
    >
      {children}
    </ClerkProvider>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section
        className="auth-card-frame"
        aria-label="REVREBEL client portal access"
      >
        {children}
      </section>
    </main>
  );
}

export function ArchivedClerkSignInPreview() {
  return (
    <ArchivedLayoutProvider>
      <AuthShell>
        <SignIn
          appearance={clerkAuthAppearance}
          routing="hash"
          forceRedirectUrl={FORCE_REDIRECT_URL}
          fallbackRedirectUrl={FALLBACK_REDIRECT_URL}
          waitlistUrl={REQUEST_ACCESS_URL}
          withSignUp={false}
        />
      </AuthShell>
    </ArchivedLayoutProvider>
  );
}

export function ArchivedClerkWaitlistPreview() {
  return (
    <ArchivedLayoutProvider>
      <AuthShell>
        <Waitlist
          appearance={clerkAuthAppearance}
          signInUrl={SIGN_IN_URL}
        />
      </AuthShell>
    </ArchivedLayoutProvider>
  );
}
