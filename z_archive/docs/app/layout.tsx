import type { Metadata } from "next";
import AccessGate from "./access-gate";
import "./globals.css";
import { isPortalAuthorized } from "./lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Now Now Resource Hub | REVREBEL",
  description:
    "Guidance, implementation references, and supporting documentation for the Now Now NoHo commercial strategy audit.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/revrebel-brand-icon.png",
    shortcut: "/revrebel-brand-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authorized = await isPortalAuthorized();

  return (
    <html lang="en">
      <body>{authorized ? children : <AccessGate />}</body>
    </html>
  );
}
