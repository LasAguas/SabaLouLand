# Saba Lou Land — next steps

Ordered by what's blocking the most.

---

## 🔴 Blockers — nothing works until these are done

### 1. Add Saba Lou to the tracking whitelist

The whole tracking system is installed and verified end to end **except one
line**. Saba Lou is `artist_id = 4`, and 4 isn't in the Edge Function's
whitelist, so every beacon currently comes back:

```
{"ok":false,"error":"unknown artist"}
```

In the `track-event` function (Supabase project `gtccctajvobfvhlonaot`):

```ts
const ALLOWED_ARTIST_IDS = new Set([5, 11, 18]);      // now
const ALLOWED_ARTIST_IDS = new Set([4, 5, 11, 18]);   // needed
```

Redeploy with `verify_jwt: false`. I prepared this exact deploy and it was
**blocked by a permission rule**, so it needs you to run it or re-approve me.

> ⚠️ **Do not deploy the template from `setup-artist-tracking.md` verbatim.** The
> live function has drifted from it — it gained an IP→geo fallback
> (`lookupGeo` via ipwho.is) after Supabase stopped forwarding Cloudflare's
> `cf-ipcountry` header on 2026-06-02. Deploying the template as written would
> silently blank out country/city for **all four** artists. Fetch the current
> source, change the one line, redeploy. Full notes in
> `supabase/functions/track-event/README.md`.

Once that's live, re-run the smoke test — it should return `{"ok":true,...}`:

```bash
curl -s -X POST "https://gtccctajvobfvhlonaot.supabase.co/functions/v1/track-event" -H "Content-Type: application/json" -d '{"artist_id":4,"session_token":"test-smoke-sabalou","event_type":"pageview","page_slug":"index","consent_given":false,"is_returning":false}'
```

### 2. ~~Create the newsletter signup form~~ — DONE, one thing left

The form is live and wired:

```
slug  newsletter-sign-up-jjsx
id    54d7e961-8ed9-44d5-b538-27e06fc7a4ce
```

Config checked against the live API — `name` ✓ and `city` ✓ both enabled,
single opt-in ✓, owner Saba Lou ✓, published ✓. Both values are in `.env.local`
(gitignored) and in `.env.local.example`.

**Still to do: set the four `NEXT_PUBLIC_*` vars in the Vercel project**, or the
form will render disabled in production even though it works locally.

Verified end to end without writing any data: a cross-origin submit with a bad
email returns a readable `400 {"error":"Please enter a valid email address."}`,
and `forms-public/track` returns `200 {"ok":true}` for the attribution call. I
deliberately did **not** submit a real address — that would put a live
subscriber on Saba Lou's list. Do one real sign-up yourself and check it lands
in Mailing → Customers with `source = signup_form` and
`consent_source = form:newsletter-sign-up-jjsx:/`.

**Consent statements are still missing.** The form has no `fields.consent_id`,
so the dashboard isn't recording *which wording* people agreed to. Sign-ups work
regardless, but the proof-of-consent record is what GDPR Art. 7(1) actually
asks for. Register three ids in the dashboard's `lib/consentStatements.js` —
`sabalou-newsletter-en@1`, `-de@1`, `-es@1`, wording from
`lib/content.js` → `newsletter.consent` — and set `fields.consent_id` on the
form.

### 3. Publish the store, and get this domain allowlisted

`/store` is coded and verified, but the dashboard says the store isn't there:

```bash
curl "https://lasaguasproductions.com/api/store-public/resolve?slug=saba-lou-store"
# -> 404 {"error":"not_found"}
```

Per the skill, a `404` is what an **unpublished** store returns, so the slug is
probably right and the store just needs finishing in **Admin -> Webstore**:
add the products (name, price, shipping per unit, photos, sizes with
per-variant stock), set the store **title** (it goes on the receipt email), and
hit **publish**. The moment that returns `200`, `/store` fills itself in — no
code change. Until then the page shows "the store isn't open yet".

If the slug turns out to be something other than `saba-lou-store`, it's one
line: `NEXT_PUBLIC_STORE_SLUG` in `.env.local` (and in Vercel).

⚠️ **Second, and the skill calls this the #1 silent failure:** this site's
hostname has to be in `STORE_RETURN_URL_ALLOWLIST` on the **dashboard's** Vercel
project (it falls back to `EVENT_RETURN_URL_ALLOWLIST`, so a domain already
cleared for ticketing works as-is). Without it buyers still get charged, but
Stripe returns them to lasaguasproductions.com instead of here, so they never
see the receipt. Ask the Las Aguas team before this goes live.

Once both are done, run the skill's end-to-end check: buy the cheapest item with
a real card (the platform runs live Stripe keys), confirm the receipt panel,
the receipt email and the order in Admin -> Webstore -> Orders, then refund it.

### 4. `/impressum` and a privacy page

Now linked from **three** places: the footer, the newsletter's data notice, and
the cookie banner. All three 404 today, and the newsletter notice is deliberately
short *because* it hands off to that page — so the short version isn't legally
sufficient on its own until the page exists.

I need your real details: full name, postal address, contact address, and VAT id
if you have one. The tracking notes also call for a privacy policy page covering
what's collected; I'd put both on `/impressum` unless you'd rather split them.

---

## 🟡 Content I'm waiting on

### 5. The handwritten font's missing glyphs

`SabaLouHandwritten2.otf` has 98 glyphs. Missing:

```
d  D  4  -  '  (  )  "  "  &  á  í  ó  ú  ñ  Ñ  ¡  ¿
```

Lowercase **d** is in almost every sentence. All missing characters currently
fall through to **Patrick Hand**, chosen to sit as close to your face as
possible — hard to spot, but it is two fonts pretending to be one. Send an
extended OTF and the fallback in `pages/_app.js` can go.

Still worth confirming: the face has **é ä ö ü ß ò ù** but no other accents —
deliberate? And lowercase **g** is drawn like a capital G, so "english" renders
"enGlish" and "gallery" "Gallery". Intentional?

### 6. ~~Logo and favicon~~ — DONE

Wired up in `public/images/icons/`: `logo.png` (favicon + brand mark), and
`mode-light.png` / `mode-dark.png` in the theme switch's two chips. The hero
crest's placeholder moon is now `logo.png` too, recoloured cream
(`logo-on-hero.png`) so it reads on the painting — same reasoning the old
placeholder SVG used.

**Heads up:** the three files you dropped in (`Logo.png`, `Light Mode.png`,
`Dark Mode.png`) had flat white backgrounds baked in, not real transparency —
confirmed by checking the PNG header (color type 2, no alpha channel), despite
how they may have looked in a preview. Since all three are clean black ink on
white, I matted them into real alpha (white → transparent, ink → opaque) and
replaced the originals with the processed files. Recoloring for the hero was a
judgement call, not just the transparency fix — worth a look in both themes to
confirm it reads the way you want. If you'd rather supply true alpha-channel
exports later (e.g. straight out of Procreate/Photoshop with the background
deleted, not flattened), drop them in over the same filenames.

### 7. Contact address

`+contact+` is a `mailto:` to **hello@sabalouland.com**, which I invented.
`CONTACT_EMAIL` in `lib/content.js`.

### 8. Social links

Confirm or correct in `lib/content.js` (`SOCIALS`). **Spotify still has no artist
id** — the link goes nowhere useful, and it's now tagged as a `streaming` click
in the analytics, so it'll show up in reports as soon as tracking is live.

| | current |
|---|---|
| Instagram | `instagram.com/sabalouland` |
| Spotify | `open.spotify.com/artist/` ← **needs the real id** |
| YouTube | `youtube.com/@sabalouland` |
| Bandcamp | `sabalou.bandcamp.com` |
| TikTok | `tiktok.com/@sabalouland` |

### 9. Read the German and Spanish

I wrote both. Particularly:
- **The "hello traveller" greeting** — you gave me English only. I kept the
  lowercase voice and "musick". German has no neat neutral for "traveller" so I
  used "reisende:r"; Spanish opens "¡hola viajera, hola viajero!".
- **The gratitudes** — "the loveling" left untranslated in all three; "the
  aunties" read literally as "die Tanten" / "las tías"; German uses
  "die Freund:innen" / "die Mentor:innen".
- **The cookie banner copy** — new, in all three.

All in `lib/content.js`.

---

## 🟢 Decisions for you

### 10. The greeting's legibility on desktop

You asked me to remove the box behind "hello traveller", and I did. The text is
dark brown (`#412b17`), and where the lower lines cross the tree trunk and the
figure's jacket there's now very little contrast — the last two lines are
marginal. I gave the type a soft cream glow, which is not a box and recovers
most of it, but it can't fully fix dark-on-dark.

Options, if it bothers you: shorten the greeting on the home page; make the type
cream instead of brown on desktop (as it already is on mobile); or accept it.
Say which and I'll do it.

### 11. The remaining pages

`/about` exists but is **unstyled** — it's just parking the earlier
third-person bio so it isn't lost. `/book` still 404s. We said we'd design
these together.

**`/store` is built** — header, the shelf menu and 3x2 grid, basket, Stripe
handoff and receipt, footer, all three languages. It is wired to the real
dashboard API per `skills/las-aguas-webstore`. Two things stand between it and
working, both on the dashboard side, not in this repo — see blocker 3 above.

**`/gallery` is built**, from your sketch — the store's header minus the
welcome banner, the fotos/videos/art work tabs, and a sharp-cornered grid
(your "sharp corners" note, as opposed to the store's rounded polaroid
cards). "fotos" is read straight off `public/images/gallery` at build time —
drop a file in and it appears, nothing to wire. "videos" and "art work" have
no content yet, so both show an empty state; say the word once there's
something to put in them.

### 12. The moon

Bottom-left of the page, and still a placeholder — but it already draws *any*
phase handed to it, the terminator geometry is real. Wiring it to the actual
lunar cycle means replacing `MOON_PHASE = 0.62` in `pages/index.js` with a
calculation. Say the word.

### 13. Deployment

Vercel autodetects this as a Next.js project. Set the four `NEXT_PUBLIC_*` vars
from `.env.local.example` in the Vercel project. **What domain should it be on?**
