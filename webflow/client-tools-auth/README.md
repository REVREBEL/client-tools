# Webflow Client Tools authentication

The Client Hub and sign-in surfaces remain normal Webflow pages. The deployable
applications live in `apps/*` and use Clerk server-side.

## Webflow pages

- `/client-hub`: launcher page. A ClerkJS guard verifies an active session before revealing the page.
- `/sign-in`: ClerkJS sign-in surface. It mounts Clerk into `#clerk-sign-in`.
- `/sign-in?signout=1`: signs the active Clerk session out and returns to `/sign-in`.

The current Webflow site already contains both embeds. The checked-in files here
are the source of truth for future edits.

## Required manual key replacement

The Webflow API does not expose the value of the existing
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` because that variable is marked secret.
Before publishing the Hub/sign-in changes:

1. Copy the production Clerk publishable key (`pk_...`) from Clerk or the existing Cloud app environment.
2. On the Webflow `/client-hub` page, edit the Clerk guard Embed and replace `REPLACE_WITH_CLERK_PUBLISHABLE_KEY`.
3. On the Webflow `/sign-in` page, make the same replacement in the Clerk sign-in Embed.
4. Publish the Webflow site.
5. Verify signed-out `/client-hub` redirects to `/sign-in`, signed-in users return to `/client-hub`, and `/sign-in?signout=1` clears the session.

The placeholder intentionally leaves the current Hub visible rather than hiding
the page forever if it is accidentally published before the key is configured.
Once the real key is present, initialization errors fail closed.
