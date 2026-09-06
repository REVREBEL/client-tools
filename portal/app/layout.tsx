import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Client Tools | REVREBEL",
    template: "%s | REVREBEL Client Tools",
  },
  description: "Secure client tools for REVREBEL engagements.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SIGN_IN_URL = `${BASE_PATH}/sign-in`;
const REQUEST_ACCESS_URL = `${BASE_PATH}/request-access`;
const PORTAL_HOME_URL = BASE_PATH || "/";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          signInUrl={SIGN_IN_URL}
          signUpUrl={REQUEST_ACCESS_URL}
          waitlistUrl={REQUEST_ACCESS_URL}
          signInFallbackRedirectUrl={
            process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || PORTAL_HOME_URL
          }
          signUpFallbackRedirectUrl={PORTAL_HOME_URL}
          localization={{
            signIn: {
              start: {
                title: "Sign in to Client Tools",
                titleCombined: "Sign in to Client Tools",
                subtitle: "One account for your REVREBEL workspace",
                subtitleCombined: "One account for your REVREBEL workspace",
                actionText: "Need access?",
                actionLink: "Request access",
                actionText__join_waitlist: "Need access?",
                actionLink__join_waitlist: "Request access",
              },
            },
            waitlist: {
              start: {
                title: "Request Client Access",
                subtitle: "Request access to your REVREBEL client workspace.",
                formButton: "Request Access",
                actionText: "Already have access?",
                actionLink: "Sign in",
              },
              success: {
                title: "Request received",
                subtitle: "You’re on the access list.",
                message: "Once approved, we’ll send confirmation straight to your inbox.",
              },
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
