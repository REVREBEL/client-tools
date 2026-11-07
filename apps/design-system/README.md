# REVREBEL Design System Docs

Fumadocs documentation and interactive component previews for the Client Tools design system.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4 + PostCSS
- Fumadocs
- `@fumadocs/story`

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Static build

```bash
npm run build
```

Next.js writes the static export to `out/`. GitHub Actions deploys that folder to GitHub Pages.

The GitHub Pages build adds the `/client-tools` base path automatically; local development stays at `/`.
