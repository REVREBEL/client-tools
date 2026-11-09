// packages/tokens/src/fonts.ts
// Hosted stylesheets for the families named in the tokens. Render these as
// <link rel="stylesheet"> in each app's root layout.
// "Logic Monoscript" (blockquote) is not on a public CDN; it falls back to monospace
// until the font files are added.
export const fontStylesheets = [
  "https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Fira+Code:wght@400;500;700&family=Khand:wght@300;400;500;600;700&family=Noto+Emoji&display=swap",
  "https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&f[]=supreme@300,400,500,700&display=swap",
] as const;

export const fontPreconnects = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://api.fontshare.com",
  "https://cdn.fontshare.com",
] as const;
