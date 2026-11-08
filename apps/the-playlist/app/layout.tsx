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

const SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "https://www.revrebel.io/sign-in";
const CLIENT_HUB_URL = process.env.NEXT_PUBLIC_CLIENT_HUB_URL || "https://www.revrebel.io/client-hub";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          signInUrl={SIGN_IN_URL}
          signInForceRedirectUrl={CLIENT_HUB_URL}
          signInFallbackRedirectUrl={CLIENT_HUB_URL}
          signUpForceRedirectUrl={CLIENT_HUB_URL}
          signUpFallbackRedirectUrl={CLIENT_HUB_URL}
        >
          <div data-client-tool="playlist">{children}</div>
        </ClerkProvider>
      </body>
    </html>
  );
}
