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
