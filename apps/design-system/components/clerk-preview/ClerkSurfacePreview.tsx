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

export const clerkPreviewSurfaces = [
  "sign-in",
  "sign-up",
  "waitlist",
  "oauth-consent",
  "choose-organization",
  "reset-password",
  "setup-mfa",
  "user-profile",
] as const;

export type ClerkPreviewSurface = (typeof clerkPreviewSurfaces)[number];

const publishableKey = "pk_live_Y2xlcmsucmV2cmViZWwuaW8k";

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
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={clerkAuthAppearance}
      localization={clerkLocalization}
      signInUrl="/client-hub/sign-in"
      signUpUrl="/client-hub/sign-up"
      waitlistUrl="/client-hub/request-access"
      signInForceRedirectUrl="/client-hub"
      signInFallbackRedirectUrl="/client-hub"
      signUpForceRedirectUrl="/client-hub"
      signUpFallbackRedirectUrl="/client-hub"
      taskUrls={{
        "choose-organization": "/client-hub/tasks/choose-organization",
        "reset-password": "/client-hub/tasks/reset-password",
        "setup-mfa": "/client-hub/tasks/setup-mfa",
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
          forceRedirectUrl="/client-hub"
          fallbackRedirectUrl="/client-hub"
          waitlistUrl="/client-hub/request-access"
          withSignUp={false}
        />
      );
      break;
    case "sign-up":
      content = (
        <SignUp
          appearance={clerkAuthAppearance}
          routing="hash"
          forceRedirectUrl="/client-hub"
          fallbackRedirectUrl="/client-hub"
          signInUrl="/client-hub/sign-in"
        />
      );
      break;
    case "waitlist":
      content = (
        <Waitlist
          appearance={clerkAuthAppearance}
          signInUrl="/client-hub/sign-in"
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
          redirectUrlComplete="/client-hub"
        />
      );
      break;
    case "reset-password":
      content = (
        <TaskResetPassword
          appearance={clerkAuthAppearance}
          redirectUrlComplete="/client-hub"
        />
      );
      break;
    case "setup-mfa":
      content = (
        <TaskSetupMFA
          appearance={clerkAuthAppearance}
          redirectUrlComplete="/client-hub"
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
