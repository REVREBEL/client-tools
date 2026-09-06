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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/request-access"
          waitlistUrl="/request-access"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
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
