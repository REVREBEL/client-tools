"use client";

import React, { ReactNode, useEffect } from "react";
import { ClerkProvider } from "@clerk/react";
import { clerkAuthAppearance, clerkLocalization } from "./clerk-theme";
import "./clerk-auth.css";

export type ClerkSurfaceProps = {
  publishableKey?: string;
  signInUrl?: string;
  signUpUrl?: string;
  waitlistUrl?: string;
  afterAuthUrl?: string;
  chooseOrganizationUrl?: string;
  resetPasswordUrl?: string;
  setupMfaUrl?: string;
};

export const DEFAULT_PUBLISHABLE_KEY = "pk_live_Y2xlcmsucmV2cmViZWwuaW8k";

export function ClerkProviderShell({
  children,
  publishableKey = DEFAULT_PUBLISHABLE_KEY,
  signInUrl = "/client-hub/sign-in",
  signUpUrl = "/client-hub/sign-up",
  waitlistUrl = "/client-hub/request-access",
  afterAuthUrl = "/client-hub",
  chooseOrganizationUrl = "/client-hub/tasks/choose-organization",
  resetPasswordUrl = "/client-hub/tasks/reset-password",
  setupMfaUrl = "/client-hub/tasks/setup-mfa",
}: ClerkSurfaceProps & { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={clerkAuthAppearance}
      localization={clerkLocalization}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      waitlistUrl={waitlistUrl}
      signInForceRedirectUrl={afterAuthUrl}
      signInFallbackRedirectUrl={afterAuthUrl}
      signUpForceRedirectUrl={afterAuthUrl}
      signUpFallbackRedirectUrl={afterAuthUrl}
      taskUrls={{
        "choose-organization": chooseOrganizationUrl,
        "reset-password": resetPasswordUrl,
        "setup-mfa": setupMfaUrl,
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

export function StrictOriginReferrerPolicy() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="referrer"]') as HTMLMetaElement | null;
    const created = !meta;
    const previous = meta?.content;

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "referrer";
      document.head.appendChild(meta);
    }

    meta.content = "strict-origin-when-cross-origin";

    return () => {
      if (created) meta?.remove();
      else if (meta && previous) meta.content = previous;
    };
  }, []);

  return null;
}
