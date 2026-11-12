"use client";

import type { CSSProperties } from "react";
import {
  RevrebelOAuthConsent,
  RevrebelSignIn,
  RevrebelSignUp,
  RevrebelTaskChooseOrganization,
  RevrebelTaskResetPassword,
  RevrebelTaskSetupMFA,
  RevrebelUserProfile,
  RevrebelWaitlist,
} from "../../../../../webflow/clerk-react/ClerkComponents";

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

export function ClerkSurfacePreview({ surface }: { surface: ClerkPreviewSurface }) {
  let content;

  switch (surface) {
    case "sign-in":
      content = <RevrebelSignIn />;
      break;
    case "sign-up":
      content = <RevrebelSignUp />;
      break;
    case "waitlist":
      content = <RevrebelWaitlist />;
      break;
    case "oauth-consent":
      content = <RevrebelOAuthConsent />;
      break;
    case "choose-organization":
      content = <RevrebelTaskChooseOrganization />;
      break;
    case "reset-password":
      content = <RevrebelTaskResetPassword />;
      break;
    case "setup-mfa":
      content = <RevrebelTaskSetupMFA />;
      break;
    case "user-profile":
      content = <RevrebelUserProfile />;
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
      {content}
    </div>
  );
}
