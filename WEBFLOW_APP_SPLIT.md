# Client Tools Webflow Cloud app split

The repository root is a pnpm/Turborepo workspace. Each deployable Webflow Cloud
application owns an npm package boundary.

| Product | App path | Mount | Package manager |
| --- | --- | --- | --- |
| Docs | `apps/docs` | `/docs` | npm |
| Metrics | `apps/metrics` | `/metrics` | npm |
| Playlist | `apps/the-playlist` | `/playlist`* | npm |
| Onboard | `apps/onboard` | `/onboard` | npm |
| Design system | `apps/design-system` | GitHub Pages | npm |
| Monorepo root | `./` | not deployed | pnpm |

`/client-hub` and `/sign-in` remain Webflow pages rather than Cloud apps.

## Webflow Cloud setup

Create or repoint each site-attached Cloud app to the same
`REVREBEL/client-tools` repository and set its app path to the corresponding
`apps/<product>` directory. Webflow Cloud detects the framework from the
package.json at that app path.

For CLI-driven setup/deploys, the equivalent shape is:

```bash
webflow apps deploy --directory apps/docs     --site-id 6a09244ce43d4439301ce56f --mount /docs     --environment production
webflow apps deploy --directory apps/metrics  --site-id 6a09244ce43d4439301ce56f --mount /metrics  --environment production
webflow apps deploy --directory apps/the-playlist --site-id 6a09244ce43d4439301ce56f --mount /playlist --environment production
webflow apps deploy --directory apps/onboard  --site-id 6a09244ce43d4439301ce56f --mount /onboard   --environment production
```

Webflow currently supports npm inside each Cloud app. The repository root is not
a Cloud app and therefore uses pnpm.

## Shared Clerk settings

Docs, Metrics, and Playlist use the same Clerk application and should receive:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<same production pk_...>
CLERK_SECRET_KEY=<same production secret>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://www.revrebel.io/sign-in
NEXT_PUBLIC_CLIENT_HUB_URL=https://www.revrebel.io/client-hub
```

The Cloud apps enforce authentication server-side with Clerk middleware. The
Webflow Client Hub guard is an additional authenticated landing-page gate, not a
replacement for app authorization.

## App-specific environment/storage migration

### Docs

Move/copy the Docs-specific values from the old combined Client Portal
environment:

- `DOCS_SPREADSHEET_ID`
- `DOCS_SPREADSHEET_GID`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- any Google credentials used by the Docs APIs
- `DOCS_MEDIA` R2 binding

`apps/docs/wrangler.json` declares the `DOCS_MEDIA` binding.

### Metrics

Move/copy:

- `METRICS_SPREADSHEET_ID`
- `METRICS_SEGMENT_GID`
- `METRICS_SOURCE_GID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

`GOOGLE_CLIENT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` are the required
service-account credential pair for Google Sheets access.

### Playlist

Move/copy:

- `PLAYLIST_APPS_SCRIPT_URL`
- `PLAYLIST_APPS_SCRIPT_TOKEN`
- `PLAYLIST_SPREADSHEET_ID`
- `PLAYLIST_DATA_SHEET`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- any setup-sheet variables currently used

`GOOGLE_CLIENT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` are the required
service-account credential pair for Google Sheets access.

### Onboard

The existing Onboard Cloud app currently has:

- `VITE_API_BASE_URL=https://api.revrebel.io`
- `VITE_INDEX_ACCESS_CODE` (secret)

Keep the access-code gate until the separate Onboard API validates Clerk tokens.

## Playlist route collision

The Webflow site currently has a CMS Collection Template at `/playlist`.
Webflow Cloud routes take precedence over Webflow page/CMS routes. Mounting the
Cloud app at `/playlist` therefore makes the Cloud app own that route and hides
the existing CMS route. If the CMS template still matters, choose a different
mount such as `/strategy-playlist` and update the Hub links accordingly.

## Cutover order

1. Configure the Clerk publishable key in the two Webflow embeds, but keep the new sign-in page draft until app mounts are ready.
2. Deploy Docs at its new mount and migrate its variables/storage.
3. Deploy Metrics and migrate its variables.
4. Deploy Playlist and migrate its variables.
5. Repoint/recreate Onboard from `REVREBEL/onboard` to `apps/onboard` and preserve its current API/access-code variables.
6. Publish `/sign-in` and the Client Hub link changes.
7. Verify one Clerk login opens all four products without another login.
8. After all four mounts are verified, retire the old combined `/portal` Cloud environment and later remove the transitional legacy root/portal source directories.

Do not delete the old combined environment before the new apps have been
validated. Its last successful deployment is the rollback path during cutover.
