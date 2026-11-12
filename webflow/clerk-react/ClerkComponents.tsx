"use client";

import React from "react";
import {
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
  ClerkProviderShell,
  ClerkSurfaceProps,
  StrictOriginReferrerPolicy,
} from "./ClerkProviderShell";
import { clerkAuthAppearance } from "./clerk-theme";

type RouteProps = ClerkSurfaceProps & {
  path?: string;
};

export function RevrebelSignIn({
  path = "/client-hub/sign-in",
  signUpUrl = "/client-hub/sign-up",
  waitlistUrl = "/client-hub/request-access",
  afterAuthUrl = "/client-hub",
  ...providerProps
}: RouteProps) {
  return (
    <ClerkProviderShell
      {...providerProps}
      signInUrl={path}
      signUpUrl={signUpUrl}
      waitlistUrl={waitlistUrl}
      afterAuthUrl={afterAuthUrl}
    >
      <SignIn
        appearance={clerkAuthAppearance}
        routing="hash"
        forceRedirectUrl={afterAuthUrl}
        fallbackRedirectUrl={afterAuthUrl}
        waitlistUrl={waitlistUrl}
        withSignUp={false}
      />
    </ClerkProviderShell>
  );
}

export function RevrebelSignUp({
  path = "/client-hub/sign-up",
  signInUrl = "/client-hub/sign-in",
  afterAuthUrl = "/client-hub",
  ...providerProps
}: RouteProps) {
  return (
    <ClerkProviderShell
      {...providerProps}
      signUpUrl={path}
      signInUrl={signInUrl}
      afterAuthUrl={afterAuthUrl}
    >
      <SignUp
        appearance={clerkAuthAppearance}
        routing="hash"
        forceRedirectUrl={afterAuthUrl}
        fallbackRedirectUrl={afterAuthUrl}
        signInUrl={signInUrl}
      />
    </ClerkProviderShell>
  );
}

export function RevrebelWaitlist({
  signInUrl = "/client-hub/sign-in",
  ...providerProps
}: ClerkSurfaceProps) {
  return (
    <ClerkProviderShell {...providerProps} signInUrl={signInUrl}>
      <Waitlist appearance={clerkAuthAppearance} 
      signInUrl={signInUrl} />
    </ClerkProviderShell>
  );
}

export function RevrebelOAuthConsent(props: ClerkSurfaceProps) {
  return (
    <ClerkProviderShell {...props}>
      <StrictOriginReferrerPolicy />
      <Show when="signed-in">
        <OAuthConsent appearance={clerkAuthAppearance} />
      </Show>
    </ClerkProviderShell>
  );
}

type TaskProps = ClerkSurfaceProps & {
  redirectUrlComplete?: string;
};

export function RevrebelTaskChooseOrganization({
  redirectUrlComplete = "/client-hub",
  ...providerProps
}: TaskProps) {
  return (
    <ClerkProviderShell {...providerProps}>
      <TaskChooseOrganization
        appearance={clerkAuthAppearance}
        redirectUrlComplete={redirectUrlComplete}
      />
    </ClerkProviderShell>
  );
}

export function RevrebelTaskResetPassword({
  redirectUrlComplete = "/client-hub",
  ...providerProps
}: TaskProps) {
  return (
    <ClerkProviderShell {...providerProps}>
      <TaskResetPassword
        appearance={clerkAuthAppearance}
        redirectUrlComplete={redirectUrlComplete}
      />
    </ClerkProviderShell>
  );
}

export function RevrebelTaskSetupMFA({
  redirectUrlComplete = "/client-hub",
  ...providerProps
}: TaskProps) {
  return (
    <ClerkProviderShell {...providerProps}>
      <TaskSetupMFA
        appearance={clerkAuthAppearance}
        redirectUrlComplete={redirectUrlComplete}
      />
    </ClerkProviderShell>
  );
}

export function RevrebelUserProfile({
  path = "/client-hub/profile",
  ...providerProps
}: RouteProps) {
  return (
    <ClerkProviderShell {...providerProps}>
      <UserProfile
        appearance={clerkAuthAppearance}
        routing="hash"
      />
    </ClerkProviderShell>
  );
}
