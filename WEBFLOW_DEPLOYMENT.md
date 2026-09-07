# Webflow Cloud Client Portal

This repository is a single Next.js application built by Webflow Cloud from the repository root and mounted at `/portal`.

## Webflow Cloud setup

- Application path / framework directory: repository root (`./`)
- Environment mount path: `/portal`
- Tracked branch: `main`
- Framework: Next.js

`package.json`, `next.config.ts`, `webflow.json`, `wrangler.json`, `app/`, `public/`, and the shared build configuration all live at the repository root.

Do not hard-code `basePath` or `assetPrefix` in `next.config.ts`. Webflow Cloud injects both values from the environment mount path during its production build. Set `NEXT_PUBLIC_BASE_PATH=/portal` for browser-side `fetch()` calls and other raw URLs that Next.js cannot prefix automatically.

## Repository layout

```text
app/                      # Next.js App Router and shared portal shell
  (portal)/
    docs/                  # /docs inside the mounted application
    metrics/               # /metrics inside the mounted application
    playlist/              # /playlist, /playlist/tracking, /playlist/setup
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
- `/portal/docs`
- `/portal/metrics`
- `/portal/playlist`
- `/portal/playlist/tracking`
- `/portal/playlist/setup`
- `/portal/docs/manage`

The physical `app/` directory is a Next.js framework convention. It does not create an `/app` URL and does not conflict with another Webflow Cloud application mounted at `/app`.

## Required environment variables

### Routing

- `NEXT_PUBLIC_BASE_PATH=/portal`

### Clerk

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/portal/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/portal/request-access`

### Google Sheets

- `GOOGLE_SERVICE_ACCOUNT`
- `SPREADSHEET_ID` — Metrics source spreadsheet
- `DOCS_SPREADSHEET_ID` — Docs Hub source spreadsheet
- `DOCS_SPREADSHEET_GID`
- `PLAYLIST_SPREADSHEET_ID` — Playlist source spreadsheet
- `PLAYLIST_DATA_SHEET` — Action Item tab, normally `Action Items`
- `PLAYLIST_SETUP_SHEET` — optional; defaults to `Setup`

The Metrics, Docs Hub, and Playlist spreadsheet IDs remain intentionally separate so each tool can move to its own workbook without application-code changes.

### Playlist write bridge

- `PLAYLIST_APPS_SCRIPT_URL`
- `PLAYLIST_APPS_SCRIPT_TOKEN`

The Apps Script Script Property `PORTAL_API_TOKEN` must match `PLAYLIST_APPS_SCRIPT_TOKEN`.

The Playlist write bridge supports both Action Item mutations and Workspace Setup cell updates. If the Apps Script project is maintained separately from this GitHub repository, changes to `portal/playlist/StrategyPlaylist/WebAppBridge.js` must also be synced to that Apps Script project and the web-app deployment updated before the new Setup write actions are available in production.

## Docs Object Storage

`wrangler.json` declares the `DOCS_MEDIA` R2 binding for bucket `revrebel-client-docs-media`. Webflow Cloud provisions the binding from this root-level file.

After the first successful deployment, an organization admin can use `/portal/docs/manage` to migrate the PDFs and photos already stored in `portal/docs/public` into Object Storage.

## Local verification

```bash
npm install
NEXT_PUBLIC_BASE_PATH=/portal npm run build
```
