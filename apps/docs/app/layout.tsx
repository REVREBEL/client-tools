import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Docs Hub | REVREBEL",
  description: "Secure client documentation, resources, campaign references, and media.",
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: "/revrebel-brand-icon.png", shortcut: "/revrebel-brand-icon.png" },
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
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
