# track-event — one pending change

This Edge Function is **shared across artists** and already lives in the Supabase
project `gtccctajvobfvhlonaot` (currently version 4, `verify_jwt: false`).
Production is the source of truth; there is deliberately no copy of the source
checked in here, because a stale copy is worse than none.

## What still needs doing

Saba Lou is **`artist_id = 4`**, and 4 is **not yet in the whitelist**. Until it
is, every beacon from this site gets `403 {"ok":false,"error":"unknown artist"}`
and nothing is recorded.

The change is one line:

```ts
const ALLOWED_ARTIST_IDS = new Set([5, 11, 18]);      // before
const ALLOWED_ARTIST_IDS = new Set([4, 5, 11, 18]);   // after — adds Saba Lou
```

Redeploy with `verify_jwt: false` (the function authenticates by whitelist, not
JWT). I prepared this deploy but the action was blocked by a permission rule, so
it needs to be run by you or re-approved.

## Do not deploy the template from `setup-artist-tracking.md` verbatim

The live function has **drifted from that template**. It has since gained an IP
→ geo fallback (`getClientIp` / `isPublicIp` / `lookupGeo` via `ipwho.is`),
added because Supabase stopped forwarding Cloudflare's `cf-ipcountry` header to
edge functions on 2026-06-02. Deploying the template as written would silently
delete that and blank out country/city for **all four** artists.

Fetch the current source, change the one line, redeploy.

## Database

`website_sessions` and `website_events` already exist in this project, so Step 2
of the command (the migration) was correctly skipped — the tables are shared
across all artists and need no per-artist changes.
