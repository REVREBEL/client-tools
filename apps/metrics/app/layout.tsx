import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metrics Dashboard | REVREBEL",
  description: "Live hotel segment and channel performance reporting.",
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/client-hub/sign-in";
const SIGN_UP_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/client-hub/request-access";
const FORCE_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL || "/client-hub";
const FALLBACK_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/client-hub";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();
  if (!userId) redirect(SIGN_IN_URL);
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
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
