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

### 4. ~~`/impressum` and a privacy page~~ — DONE, a few things to confirm

Both exist (2026-11-20). `/impressum`: Saba Lou Khan, represented by Las Aguas
Productions; Las Aguas UG (haftungsbeschränkt), Sebastian Sheath,
Conrad-Blenkle-Str. 29, 10407 Berlin; Amtsgericht Charlottenburg, HRB 280834 B;
Steuernummer; contact@lasaguasproductions.com. Names and numbers are `IMPRESSUM`
in `lib/content.js`. `/privacy`: adapted from silveromen.com/privacy and checked
against this site's own code; the text is `PRIVACY_EN` in `lib/content.js`. The
footer links both; the cookie banner and the newsletter notice now go to
`/privacy`.

**To confirm:**
- § 5 DDG asks for the **USt-IdNr** (VAT id), not the Steuernummer. Add the
  USt-IdNr if the UG has one; the Steuernummer isn't required and could go.
- The privacy page is **English only** for now (German and Spanish show it
  under their own titles). A German-language version matters most.
- It names "a location-lookup service" (the track-event function's ipwho.is
  fallback, see blocker 1). Check that is still how the function resolves country
  and city.
- It was drafted from a sibling site's policy, not by a lawyer.

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
- **The `/book` page** — new in all three: the heading ("nimm kontakt auf" /
  "ponte en contacto"), the labels ("für booking / presse / medien", "para
  contratarme / prensa / medios") and the line above the EPK button. Spanish
  says "contratarme" to match the nav's "contrátame".

All in `lib/content.js`.

---

## 🟡 The NFC album kit (Nothing But Love)

**Built:** `/k/<code>` — a private, code-gated page with synced, annotated
lyrics, for an NFC tag on the cassette. `lib/nfcCodes.js` checks the code
server-side; `lib/nfcAudio.js` resolves the audio file; `components/
LyricsPlayer.js` does the line-by-line sync (plays the real file, highlights
the current line via `requestAnimationFrame`, tap a line to jump there,
lock-screen controls, keeps the screen awake while playing). `/dev/
sync-editor` (dev-only, 404s in production) is the tool for turning a lyric
sheet plus a local audio file into the timed JSON the player reads — play,
tap along to each line, export. `content/lyrics/README.md` has the data
format; `content/lyrics/example-song.json` is a placeholder showing the
shape, not real lyrics.

The tracker fix you asked for is in: any visit to `/k/<code>` (or the sync
editor) reports as the fixed label `nfc-lyrics-nbl` in analytics, never the
real code — see `lib/nfc.js`. It also skips the cookie banner and the
consent-gated scroll/engagement timers, same as clicks elsewhere on the site
don't need consent.

**Also done (2026-09-29):** your written commentary email transcribed into
`content/lyrics/drafts/*.json` for all 10 songs you'd written (UV Catastrophe
excluded — your own email marks its commentary missing), matching every note
to the line(s) you said it refers to — see `content/lyrics/drafts/README.md`
for the calls I had to make transcribing it, and for the **real track order**,
which the masters' filenames give as different from the order in your email
(UV Catastrophe is second on side A, not last overall).

The 11 masters found in the Las Aguas Supabase (`post-variations` bucket,
`audio-library/4/` — same project this site's tracker already points at),
downloaded, verified byte-for-byte, encoded to AAC, and duration-checked
against the source WAVs (zero drift). They're staged in
`public/nfc-audio/<slug>.m4a` (gitignored, local only) — these exact files
are also what should go into the real private bucket once it exists, not a
fresh re-encode.

**Also done (2026-10-04):** the liner-notes page got a new look. Three designs
were built side by side — track list behind a burger, no default scrollbar,
mobile + desktop — and **Paper** was picked: the home page's painting, panels
and blue paper chips, with each liner note a chip bracketed to the lyrics it's
about. `/k/<code>` now serves it (`components/liner/Paper.js`, on the shared
player in `lib/useLinerPlayer.js`, which also gives prev/next and starts the
next song on its own when one ends). `/dev/liner-notes` shows the same page
without needing a code (dev-only, 404s in production). The other two designs,
Sleeve and Cassette, are still in `components/liner/` and the design switcher
is commented out in `pages/dev/liner-notes.js` — the note at the top of that
file says how to bring them back. `album.json` gained a `side` ("A"/"B") per
song, which only Cassette reads. `components/LyricsPlayer.js` is the old plain
player; only the sync editor's "watch it back" still uses it now.

**Also done (2026-11-24):** **"listen to my cassette."** A microphone key sits
next to prev / play / next on `/k/<code>`. Tap it (the first time it says what
the microphone is for), put the phone near the tape player, and the page works
out which song is playing and where in it, then runs the lyrics and liner notes
alongside — the song on screen follows the tape from song to song, and says
"tape paused" when the deck stops. Nothing is recorded or sent; the sound is
analysed on the phone and thrown away, and there's no service or API involved
(everything is in `lib/cassette/`). Pressing play while it's listening carries
on from the phone at the tape's place. It's built on top of the existing player,
so playing from the phone, the track list, tap-a-line and the design are
untouched, and the `/k/<code>` link, its code check and its headers are exactly
as they were.

How it works, briefly: `node scripts/build-fingerprints.mjs` boils the 11
masters in `public/nfc-audio/` down to `content/fingerprints/nbl.fp.gz` (~0.8
MB, **commit it** — it's what Vercel serves, through `pages/api/k/
fingerprints.js` under the same code check as the page). On the phone, a worker
turns what the microphone hears into pitch/timing landmarks and looks them up
in that file at 13 tape speeds (decks run a few percent off, which breaks the
plain method); `lib/cassette/tracker.mjs` turns the answers into a steady
"this song, this far in". Tested on your two real recordings (Side A, Side B,
both on this deck): it locks onto a song about 7 s into it, stays right ~95% of
the time a song is playing, finds the next song on the tape as it starts, and
rides out a deck 3–5% off speed, room noise as loud as the music, pauses,
rewinds and fast-forwards (spliced from your recordings).

Things worth knowing:
- **Re-run `node scripts/build-fingerprints.mjs` whenever the masters change**
  (a remix, a trim, a re-master that shifts things in time), and commit the
  new file. If a cassette was dubbed from a *different* mix than these masters,
  that tape won't be recognised.
- **`node scripts/cassette-probe.mjs "<recording>"`** replays any phone
  recording of a tape through the same code the page runs and prints, second by
  second, what it hears and what the page would show. Use it to find out why a
  particular deck or room isn't working — record a minute with the phone where
  a listener would hold it.
- It needs the page on **https** (Vercel is) and a tap to start; the phone has
  to be awake and the page in front (it keeps the screen on while listening).
  Browsers without microphone support just don't show the key.
- It follows the tape's order within a side (A: She → UV Catastrophe → ...), so
  adding or reordering songs means `content/lyrics/album.json` and the masters
  have to agree.
- Not yet tried on a real phone — only in Chromium with your recordings played
  into it as the microphone. See the last item below.

**Still needed, in the order that blocks the least:**

1. **A private Supabase bucket.** Storage → New bucket in the dashboard's
   project, uncheck "Public." I have no tool that can upload storage objects,
   so this — and uploading the 11 files in `public/nfc-audio/` into it — is
   yours regardless of anything else here.
2. **Three env vars**, in `.env.local` and Vercel: `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API — a secret, don't hand
   it to an AI assistant in chat), `NFC_AUDIO_BUCKET` (whatever you named the
   bucket above). Until these are set, `/k/<code>` keeps using the local
   `public/nfc-audio/` fallback — fine for testing, not for real listeners.
3. **Time each song.** `/dev/sync-editor`, import the matching
   `content/lyrics/drafts/<slug>.json`, tap along to the real audio, export
   into `content/lyrics/<slug>.json`, add its entry to
   `content/lyrics/album.json` in the real track order from the drafts README.
4. **UV Catastrophe's commentary** — still unwritten, per your own email.
5. **The domain** (this is also item 13 below) — tag URLs are permanent once
   cassettes ship, so settle this before writing any tags.
6. **Generate and write the codes.** `node scripts/generate-nfc-codes.js 15`
   once the domain is set (`NFC_SITE_URL=...` env var), paste the codes into
   `NFC_VALID_CODES` (here and in Vercel), write them to NTAG213 stickers
   (case or J-card, not the tape shell — it goes into a deck), lock the tags
   after writing. The script also has `--csv` for tag-writing services that
   want a spreadsheet.
7. **Commit and deploy "listen to my cassette".** The new files are
   `lib/cassette/`, `content/fingerprints/nbl.fp.gz`,
   `pages/api/k/fingerprints.js`, `public/cassette-worklet.js`,
   `scripts/build-fingerprints.mjs` and `scripts/cassette-probe.mjs`, plus edits
   to `components/liner/Paper.js`, `components/liner/icons.js`,
   `lib/useLinerPlayer.js` and `pages/k/[code].js`.
8. **Try "listen to my cassette" on your own phone**, once it's deployed:
   open your cassette's link, tap the microphone key, play the tape on the deck,
   and watch it find the song (about 7 s in). iPhone Safari and an Android phone
   if you can. Things to note if it misbehaves: how far the phone was from the
   deck, whether the screen stayed on, and what the line under the lyrics said
   ("listening for the tape…" for a long time means it can't hear the song —
   try nearer, or louder). Then send a recording of that spot through
   `scripts/cassette-probe.mjs` and we'll see what it's making of it.

Not done, and deliberately left for you to decide: translating the copy on
the invalid-code screen (currently English only), and whether lines should
ever carry more than plain text (an image scan of a handwritten note, say).

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

**`/book` is built** — the gallery's header, a "get in touch" list of who to
write to for booking, press and media (each address a `mailto:` link), a button
to the EPK, then the footer. The addresses and the EPK's path are
`BOOK_CONTACTS` and `EPK_HREF` in `lib/content.js`; the EPK is
`public/Saba Lou EPK.pdf`, opened in its own tab. **The press address,
`iforgotthefakemanagers@email.com`, reads like a stand-in** — swap it in
`BOOK_CONTACTS` when the real one exists.

**`/about` is built** as a scrapbook: the gallery's header, then pictures
pasted down among a few lines of text — every picture square-cornered, level
and unframed — then the footer. Arrangement in `components/Scrapbook.js`, words
in `ABOUT_EN` in `lib/content.js`. The copy is a **first-person English draft**;
German and Spanish show it untranslated (under their own page titles) until you
have edited it and I translate.

**`/store` is built** — header, the shelf menu and 3x2 grid, basket, Stripe
handoff and receipt, footer, all three languages. It is wired to the real
dashboard API per `skills/las-aguas-webstore`. Two things stand between it and
working, both on the dashboard side, not in this repo — see blocker 3 above.

**`/gallery` is built**, from your sketch — the store's header minus the
welcome banner, the artwork/videos/fotos tabs (artwork open on load), and a
sharp-cornered grid (your "sharp corners" note, as opposed to the store's
rounded polaroid cards). "fotos" is read straight off `public/images/gallery`
at build time — drop a file in and it appears, nothing to wire. "artwork" works
the same way from the `paintings/` and `other/` folders inside it, paintings
first. "videos" are the YouTube links in `GALLERY_VIDEOS` in `lib/content.js`.

### 12. The moon

Bottom-left of the page, and still a placeholder — but it already draws *any*
phase handed to it, the terminator geometry is real. Wiring it to the actual
lunar cycle means replacing `MOON_PHASE = 0.62` in `pages/index.js` with a
calculation. Say the word.

### 13. Deployment

Vercel autodetects this as a Next.js project. Set the four `NEXT_PUBLIC_*` vars
from `.env.local.example` in the Vercel project. **What domain should it be on?**
