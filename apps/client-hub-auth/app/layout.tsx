import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client Hub Sign In | REVREBEL",
  description: "Secure sign in for the REVREBEL Client Hub.",
  robots: { index: false, follow: false, nocache: true },
};

const SIGN_IN_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";
const HUB_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL || "/client-hub";
const FALLBACK_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || HUB_URL;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          signInUrl={SIGN_IN_URL}
          signInForceRedirectUrl={HUB_URL}
          signInFallbackRedirectUrl={FALLBACK_URL}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
