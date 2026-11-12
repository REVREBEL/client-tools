"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  ClerkProvider,
  OAuthConsent,
  Show,
  SignIn,
  SignUp,
  TaskChooseOrganization,
  TaskResetPassword,
  TaskSetupMFA,
  UserProfile,
  Waitlist,
} from "@clerk/react";
import {
  clerkAuthAppearance,
  clerkLocalization,
} from "../../../../webflow/clerk-react/clerk-theme";
import type { ClerkPreviewSurface } from "./surfaces";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const previewTokens = {
  "--rr-blue": "#163666",
  "--rr-blue-dark": "#0d274e",
  "--rr-aqua": "#71c9c5",
  "--rr-frost": "#eff5f6",
  "--rr-white": "#fafafa",
  "--rr-muted": "#536782",
  "--rr-danger": "#e05047",
  "--rr-display": '"Khand", "Arial Narrow", sans-serif',
  "--rr-body": '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as CSSProperties;

function Provider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
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

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={clerkAuthAppearance}
      localization={clerkLocalization}
      signInUrl="/clerk-preview/sign-in"
      signUpUrl="/clerk-preview/sign-up"
      waitlistUrl="/clerk-preview/waitlist"
      signInForceRedirectUrl="/docs/clerk-preview"
      signInFallbackRedirectUrl="/docs/clerk-preview"
      signUpForceRedirectUrl="/docs/clerk-preview"
      signUpFallbackRedirectUrl="/docs/clerk-preview"
      taskUrls={{
        "choose-organization": "/clerk-preview/choose-organization",
        "reset-password": "/clerk-preview/reset-password",
        "setup-mfa": "/clerk-preview/setup-mfa",
      }}
    >
      <main className="rr-auth-page">
        <section className="rr-auth-card-frame" aria-label="REVREBEL client portal access">
          {children}
        </section>
      </main>
    </ClerkProvider>
  );
}

export function ClerkSurfacePreview({ surface }: { surface: ClerkPreviewSurface }) {
  let content;

  switch (surface) {
    case "sign-in":
      content = (
        <SignIn
          appearance={clerkAuthAppearance}
          routing="hash"
          forceRedirectUrl="/docs/clerk-preview"
          fallbackRedirectUrl="/docs/clerk-preview"
          waitlistUrl="/clerk-preview/waitlist"
          withSignUp={false}
        />
      );
      break;
    case "sign-up":
      content = (
        <SignUp
          appearance={clerkAuthAppearance}
          routing="hash"
          forceRedirectUrl="/docs/clerk-preview"
          fallbackRedirectUrl="/docs/clerk-preview"
          signInUrl="/clerk-preview/sign-in"
        />
      );
      break;
    case "waitlist":
      content = (
        <Waitlist
          appearance={clerkAuthAppearance}
          signInUrl="/clerk-preview/sign-in"
        />
      );
      break;
    case "oauth-consent":
      content = (
        <Show when="signed-in">
          <OAuthConsent appearance={clerkAuthAppearance} />
        </Show>
      );
      break;
    case "choose-organization":
      content = (
        <TaskChooseOrganization
          appearance={clerkAuthAppearance}
          redirectUrlComplete="/docs/clerk-preview"
        />
      );
      break;
    case "reset-password":
      content = (
        <TaskResetPassword
          appearance={clerkAuthAppearance}
          redirectUrlComplete="/docs/clerk-preview"
        />
      );
      break;
    case "setup-mfa":
      content = (
        <TaskSetupMFA
          appearance={clerkAuthAppearance}
          redirectUrlComplete="/docs/clerk-preview"
        />
      );
      break;
    case "user-profile":
      content = (
        <UserProfile
          appearance={clerkAuthAppearance}
          routing="hash"
        />
      );
      break;
  }

  return (
    <div
      style={{
        ...previewTokens,
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#ffffff",
      }}
    >
      <Provider>{content}</Provider>
    </div>
  );
}
