"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  ClerkProvider,
  OAuthConsent,
  SignIn,
  SignUp,
  TaskChooseOrganization,
  TaskResetPassword,
  TaskSetupMFA,
  UserProfile,
  Waitlist,
  useSession,
  useUser,
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

function StateDiagnostic({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      style={{
        width: "min(560px, 100%)",
        padding: 24,
        border: "2px solid #163666",
        borderRadius: 8,
        background: "#eff5f6",
        color: "#163666",
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        lineHeight: 1.5,
      }}
    >
      <strong style={{ display: "block", marginBottom: 8 }}>{title}</strong>
      <div>{children}</div>
    </div>
  );
}

export function ClerkSurfacePreview({ surface }: { surface: ClerkPreviewSurface }) {
  const { session, isLoaded: isSessionLoaded } = useSession();
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();
  const currentTask = session?.currentTask?.key;
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
    case "oauth-consent": {
      const hasOAuthParams =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("client_id") &&
        new URLSearchParams(window.location.search).has("redirect_uri");

      content =
        isUserLoaded && isSignedIn && hasOAuthParams ? (
          <OAuthConsent appearance={clerkAuthAppearance} />
        ) : (
          <StateDiagnostic title="OAuth Consent is not eligible to render">
            {!isUserLoaded
              ? "Clerk session is still loading."
              : !isSignedIn
                ? "This component requires an authenticated user."
                : "This component also requires a real OAuth authorization request with client_id and redirect_uri query parameters."}
          </StateDiagnostic>
        );
      break;
    }
    case "choose-organization":
      content =
        isSessionLoaded && currentTask === "choose-organization" ? (
          <TaskChooseOrganization
            appearance={clerkAuthAppearance}
            redirectUrlComplete="/docs/clerk-preview"
          />
        ) : (
          <StateDiagnostic title="Choose Organization is not eligible to render">
            {isSessionLoaded
              ? `Current Clerk task: ${currentTask ?? "none"}. This component only renders when the pending session task is choose-organization.`
              : "Clerk session is still loading."}
          </StateDiagnostic>
        );
      break;
    case "reset-password":
      content =
        isSessionLoaded && currentTask === "reset-password" ? (
          <TaskResetPassword
            appearance={clerkAuthAppearance}
            redirectUrlComplete="/docs/clerk-preview"
          />
        ) : (
          <StateDiagnostic title="Reset Password is not eligible to render">
            {isSessionLoaded
              ? `Current Clerk task: ${currentTask ?? "none"}. This component only renders when the pending session task is reset-password.`
              : "Clerk session is still loading."}
          </StateDiagnostic>
        );
      break;
    case "setup-mfa":
      content =
        isSessionLoaded && currentTask === "setup-mfa" ? (
          <TaskSetupMFA
            appearance={clerkAuthAppearance}
            redirectUrlComplete="/docs/clerk-preview"
          />
        ) : (
          <StateDiagnostic title="Setup MFA is not eligible to render">
            {isSessionLoaded
              ? `Current Clerk task: ${currentTask ?? "none"}. This component only renders when the pending session task is setup-mfa.`
              : "Clerk session is still loading."}
          </StateDiagnostic>
        );
      break;
    case "user-profile":
      content =
        isUserLoaded && isSignedIn ? (
          <UserProfile
            appearance={clerkAuthAppearance}
            routing="hash"
          />
        ) : (
          <StateDiagnostic title="User Profile is not eligible to render">
            {isUserLoaded
              ? "This component requires an authenticated user."
              : "Clerk session is still loading."}
          </StateDiagnostic>
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
