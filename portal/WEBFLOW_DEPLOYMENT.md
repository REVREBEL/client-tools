# Webflow Cloud Client Portal

The `portal` directory is the deployable Next.js application and should be selected as the Webflow Cloud app root. Docs, Metrics, and Playlist live inside that application boundary as modular source folders so their UI, styles, and business logic can continue to evolve independently.

## App root and mount path

Select this repository directory as the Webflow Cloud **app path**:

```text
/portal
```

`package.json`, `next.config.ts`, `webflow.json`, and `wrangler.json` are all colocated in this directory so Webflow can detect and deploy the Next.js app without relying on repository-root framework detection.

Set the Webflow Cloud environment **mount path** to:

```text
/portal
```

These are two different settings: the app path tells Webflow where the deployable project lives in GitHub, while the mount path controls where the application is served on the Webflow domain.

Because this app is mounted below the site root, add this public environment variable:

```text
NEXT_PUBLIC_BASE_PATH=/portal
```

Webflow Cloud supplies Next.js with its production base path automatically. The public variable above is only used by browser-side requests and third-party auth URLs that Next.js cannot prefix for us.

## Routes

With the `/portal` mount path, the public route surface is:

- `/portal` — authenticated Client Tools launcher
- `/portal/docs` — Docs Hub
- `/portal/docs/campaigns` — campaign concepts
- `/portal/docs/blogs` — blog concepts
- `/portal/docs/photos` — current photo gallery
- `/portal/docs/manage` — admin PDF/photo storage and one-time migration
- `/portal/metrics` — Client Metrics
- `/portal/playlist` — Strategy Playlist
- `/portal/sign-in` — Clerk sign in
- `/portal/request-access` — Clerk access request

Internally, the Next.js route definitions remain `/`, `/docs`, `/metrics`, and so on. Webflow applies the environment mount path at build time.

## Source modules

Within the Webflow app root:

- `portal/docs` — Docs Hub source
- `portal/metrics` — Client Metrics source
- `portal/playlist` — Strategy Playlist source and Apps Script project
- `portal/app` — shared Next.js App Router shell and route adapters

## Required Webflow Cloud environment variables

### Webflow mount path

- `NEXT_PUBLIC_BASE_PATH=/portal`

### Clerk

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/portal/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/portal/request-access`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=https://revrebel.io/portal`

### Google Sheets

- `GOOGLE_SERVICE_ACCOUNT` — service-account JSON or base64 encoded JSON
- `GOOGLE_CLIENT_EMAIL` — optional if the service-account JSON already contains `client_email`
- `SPREADSHEET_ID` — optional Metrics override; the current Now Now Metrics sheet remains the code default
- `DOCS_SPREADSHEET_ID` — optional Docs Hub override
- `DOCS_SPREADSHEET_GID` — optional Docs Hub resource-tab override
- `PLAYLIST_SPREADSHEET_ID` — required to activate the Playlist UI
- `PLAYLIST_DATA_SHEET` — optional; defaults to `Action Items`

Share private Google Sheets with the service-account email as a Viewer.

### Playlist write bridge

- `PLAYLIST_APPS_SCRIPT_URL` — deployed Apps Script Web App URL
- `PLAYLIST_APPS_SCRIPT_TOKEN` — shared secret for portal-to-Apps-Script mutations

Set the Apps Script Script Property `PORTAL_API_TOKEN` to the same value as `PLAYLIST_APPS_SCRIPT_TOKEN`, then deploy the `StrategyPlaylist` Apps Script project as a Web App. `WebAppBridge.js` handles portal mutations and explicitly invokes the existing edit workflow so audit logging and dependency healing are not bypassed.

## Clerk permissions

Organization admins are allowed to manage protected tool data. Optional custom permissions are also supported:

- `admin:docs_manage` / `org:admin:docs_manage`
- `admin:playlist_edit` / `org:admin:playlist_edit`

Existing Metrics permissions remain unchanged.

## Docs Hub Object Storage

`wrangler.json` declares one private Object Storage binding:

- binding: `DOCS_MEDIA`
- bucket: `revrebel-client-docs-media`

Logical prefixes:

- `resources/` — PDFs
- `photos/` — images

External Google Docs/Sheets URLs remain external links. Uploaded files use an `r2://` reference in the Docs Hub resource Sheet, for example:

```text
r2://resources/rate-linking-review.pdf
```

The Docs API converts that reference to an authenticated `/api/docs/files/...` route, and the client prefixes `/portal` when the app is deployed at the configured mount path.

### First deployment migration

After the first Webflow deployment, visit `/portal/docs/manage` as an organization admin. Use:

- **Import Existing PDFs** to copy the PDFs currently committed under `portal/docs/public/resources` into Object Storage.
- **Import Existing Photos** to copy the current gallery images into the `photos/` prefix.

The migration runs in small batches and is safe to rerun. The existing gallery remains served from static repo assets during the first deployment so the visual pages do not break while storage is being initialized.

## Development

From the repository root:

```bash
cd portal
npm install
npm run dev
npm run build
```

Local Next.js development serves the app at `/` unless you deliberately set up mount-path parity. The standalone source implementations remain under `portal/docs`, `portal/metrics`, and `portal/playlist`, while `portal/app` provides the shared authenticated shell and route surface for Webflow Cloud.
