import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metrics Dashboard | REVREBEL",
  description: "Live hotel segment and channel performance reporting.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
                title: "Sign in to Metrics",
                titleCombined: "Sign in to Metrics",
                subtitle: "Sign in to unlock smarter metrics",
                subtitleCombined: "Sign in to unlock smarter metrics",
                actionText: "Need access?",
                actionLink: "Request access",
                actionText__join_waitlist: "Need access?",
                actionLink__join_waitlist: "Request access",
              },
            },
            waitlist: {
              start: {
                title: "Level Up with Metrics",
                subtitle: "Connect the dots into a clearer view of property performance.",
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
