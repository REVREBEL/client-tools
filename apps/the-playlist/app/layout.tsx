import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Strategy Playlist | REVREBEL",
  description: "Client strategy playlist, sequencing, tracking, and workspace setup.",
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";
const SIGN_UP_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/client-hub/request-access";
const FORCE_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL || "/client-hub";
const FALLBACK_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/client-hub";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          signInUrl={SIGN_IN_URL}
          signUpUrl={SIGN_UP_URL}
          signInForceRedirectUrl={FORCE_REDIRECT_URL}
          signInFallbackRedirectUrl={FALLBACK_REDIRECT_URL}
          signUpForceRedirectUrl={FORCE_REDIRECT_URL}
          signUpFallbackRedirectUrl={FALLBACK_REDIRECT_URL}
        >
          <div data-client-tool="playlist">{children}</div>
        </ClerkProvider>
      </body>
    </html>
  );
}
