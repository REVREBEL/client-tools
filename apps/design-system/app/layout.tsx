import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { fontPreconnects, fontStylesheets } from '@revrebel/tokens/fonts';
import './global.css';

export const metadata: Metadata = {
  title: {
    default: 'REVREBEL Design System',
    template: '%s | REVREBEL Design System',
  },
  description: 'Component design system and implementation guidance for REVREBEL Client Tools.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {fontPreconnects.map((href) => (
          <link key={href} rel="preconnect" href={href} crossOrigin="" />
        ))}
        {fontStylesheets.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>
        <RootProvider search={{ enabled: false }} theme={{ enabled: false }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
