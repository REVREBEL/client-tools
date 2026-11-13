# Webflow Cloud Client Portal

This repository is a single Next.js application built by Webflow Cloud from the repository root and mounted at `/portal`.

## Webflow Cloud setup

- Application path / framework directory: repository root (`./`)
- Environment mount path: `/portal`
- Tracked branch: `main`
- Framework: Next.js

`package.json`, `next.config.ts`, `webflow.json`, `wrangler.json`, `app/`, `public/`, and the shared build configuration all live at the repository root.

Do not hard-code `basePath` or `assetPrefix` in `next.config.ts`. Webflow Cloud injects both values from the environment mount path during its production build.

Set `NEXT_PUBLIC_BASE_PATH=/portal` only for browser-side `fetch()` calls, raw asset URLs, and third-party paths that Next.js cannot prefix automatically. Internal Next.js navigation must stay relative to the application root:

- `<Link href="/playlist">` becomes `/apps/playlist` after Webflow mounts the app.
- Do **not** build Next.js links as `${NEXT_PUBLIC_BASE_PATH}/playlist`; that produces `/apps/apps/playlist`.
- Raw `fetch()`, plain asset URLs, and third-party redirect properties can use `NEXT_PUBLIC_BASE_PATH` when they need the externally mounted URL.

Server-side authentication redirects are a separate case. Webflow Cloud executes the Next.js app behind its `*.wf-app-prod.cosmic.webflow.services` service origin, so a server redirect can otherwise expose that internal hostname to the browser. `PORTAL_PUBLIC_ORIGIN` provides the canonical browser origin for Clerk and protected-route redirects.

## Repository layout

```text
app/                      # Next.js App Router and shared portal shell
  (portal)/
    docs/                  # /docs inside the mounted application
    metrics/               # /metrics inside the mounted application
    playlist/              # /playlist and Playlist child views
portal/
  docs/                    # Docs Hub source module
  metrics/                 # Metrics source module
  playlist/                # Playlist source module + Apps Script
public/                    # shared static assets
package.json
next.config.ts
webflow.json
wrangler.json
```

Because Webflow mounts the whole application at `/portal`, the public URLs are:

- `/portal`
- `/apps/docs`
- `/apps/metrics`
- `/apps/playlist`
- `/apps/playlist/tracking`
- `/apps/playlist/sequencer`
- `/apps/playlist/setup`
- `/apps/docs/manage`

The physical `app/` directory is a Next.js framework convention. It does not create an `/app` URL and does not conflict with another Webflow Cloud application mounted at `/app`.

## Required environment variables

### Routing

- `NEXT_PUBLIC_BASE_PATH=/portal`
- `PORTAL_PUBLIC_ORIGIN=https://www.revrebel.io`

`PORTAL_PUBLIC_ORIGIN` is intentionally environment-driven rather than hard-coded. It is used for server-side Clerk redirects so users remain on the public Webflow domain instead of being sent to the internal Webflow Cloud service hostname.

### Clerk

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/apps/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/apps/request-access`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/portal`

### Google Sheets

- `GOOGLE_CLIENT_EMAIL` — service-account client email
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — matching service-account private key
- `METRICS_SPREADSHEET_ID` — Metrics source spreadsheet
- `METRICS_SEGMENT_GID` — Metrics `segment_dataset` tab GID
- `METRICS_SOURCE_GID` — Metrics `source_dataset` tab GID
- `DOCS_SPREADSHEET_ID` — Docs Hub source spreadsheet
- `DOCS_SPREADSHEET_GID` — Docs Hub source tab GID
- `PLAYLIST_SPREADSHEET_ID` — Playlist source spreadsheet
- `PLAYLIST_DATA_SHEET` — Action Item tab, normally `Action Items`
- `PLAYLIST_SETUP_SHEET` — optional; defaults to `Setup`

The Metrics, Docs Hub, and Playlist spreadsheet IDs remain intentionally separate so each tool can move to its own workbook without application-code changes. Metrics keeps the existing generic `METRICS_SPREADSHEET_ID` name for backward compatibility, while its tab GIDs are explicit Webflow environment values instead of code constants.

### Playlist write bridge

- `PLAYLIST_APPS_SCRIPT_URL`
- `PLAYLIST_APPS_SCRIPT_TOKEN`

The Apps Script Script Property `PORTAL_API_TOKEN` must match `PLAYLIST_APPS_SCRIPT_TOKEN`.

The Playlist write bridge supports both Action Item mutations and Workspace Setup cell updates. If the Apps Script project is maintained separately from this GitHub repository, changes to `portal/playlist/StrategyPlaylist/WebAppBridge.js` must also be synced to that Apps Script project and the web-app deployment updated before the new Setup write actions are available in production.

## Docs Object Storage

`wrangler.json` declares the `DOCS_MEDIA` R2 binding for bucket `revrebel-client-docs-media`. Webflow Cloud provisions the binding from this root-level file.

After the first successful deployment, an organization admin can use `/apps/docs/manage` to migrate the PDFs and photos already stored in `portal/docs/public` into Object Storage.

## Monorepo tooling

This repository uses **npm workspaces + Turborepo** for local orchestration and shared-package development.

Webflow Cloud currently supports only the `npm` package manager, so do not replace the root npm workspace with pnpm or Yarn while the Portal is deployed from this repository root.

The root Portal remains the Webflow Cloud application and keeps its standard production commands:

- `npm run dev` — Portal only
- `npm run build` — Portal production build

Turborepo adds multi-app and filtered commands without changing Webflow's production entry point:

- `npm run dev:all` — Portal and workspace development tasks
- `npm run build:all` — build all workspace packages
- `npm run typecheck:all` — typecheck all workspace packages
- `npm run design:dev` — Fumadocs design system on port 3001
- `npm run design:build` — build only the Fumadocs design system
- `npm run design:typecheck` — typecheck only the Fumadocs design system

The workspace declaration reserves `packages/*` for shared packages such as `@revrebel/ui`, design tokens, configuration, and future SurveyJS adapters.

## Local verification

```bash
npm install
NEXT_PUBLIC_BASE_PATH=/portal PORTAL_PUBLIC_ORIGIN=http://localhost:3000 npm run build
```
