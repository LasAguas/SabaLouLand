# Saba Lou Land

The main website for Saba Lou. Next.js (pages router, plain `.js`), deployed on
Vercel.

```bash
npm install
npm run dev
```

Then copy `.env.local.example` to `.env.local`. See [TODO.md](TODO.md) for what
still needs filling in.

## Where things are

```
pages/index.js          the whole home page — content, layout and styles, in the
                        order they appear on screen. Most edits happen here.
lib/content.js          EVERY word on the site, in en / de / es. Edit copy here.
lib/tracker.js          visitor tracking -> Supabase (see below)
lib/signupTracking.js   shared session token for the newsletter's two API calls
lib/useLanguage.js      language state (localStorage + browser preference)
lib/useTheme.js         light/dark state (+ the no-flash boot script)
styles/globals.css      colour tokens, fonts, chip panels, shared helpers
components/             only the pieces that carry behaviour (see below)
fonts/                  Springfield (title) + Saba Lou Handwritten 2 (all else)
assets/                 full-res source images, not served
```

**Where to edit what.** The title, greeting, gratitudes and footer are written
straight into `pages/index.js` — markup and styles together, top to bottom in
page order — so changing the page means opening one file. Only the pieces with
real behaviour stay as components: the three chip panels (`LanguageSelector`,
`ThemeToggle`, `NavRail`), the `Newsletter` form and its two API calls, `Moon`'s
phase geometry, `SocialIcons`' paths, and `ConsentBanner`.

Words are the exception: they live in `lib/content.js` because each one exists
three times over, in English, German and Spanish.

## The sketch, mapped to components

| # | sketch | where |
|---|---|---|
| 0 | hero painting | `pages/index.js` — `.plate` / `.fade` / `.crown` |
| 1 | language selector | `components/LanguageSelector.js` |
| 2 | title + logo | `pages/index.js` — `.crest` |
| 3 | light/dark switch | `components/ThemeToggle.js` |
| 4 | greeting | `pages/index.js` — `.bio` |
| 5 | nav rail | `components/NavRail.js` |
| 6 | newsletter signup | `components/Newsletter.js` |
| 7 | socials, +contact+, impressum | `pages/index.js` — `.foot` |
| 9 | gratitudes | `pages/index.js` — `.thanks` |
| 10 | moon (bottom-left) | `components/Moon.js` |
| — | cookie banner | `components/ConsentBanner.js` |

## Notes on how it's built

**Nothing is on a grid.** Elements carry a `--tilt` custom property and lean a
degree or two; list items are indented by hand-set, uneven amounts; boxes use
irregular `border-radius` values. If something looks too neat, give it a tilt.

**The three chip panels** — language, light/dark, nav — share `.panel` and
`.chip` in `styles/globals.css` rather than each styling itself, so they can't
drift apart. Off-white at 50%, blue chips, brown rules. `.chip.selected` is the
ringed light/dark option; `.chip .mark` is the green rule under the current
language.

**Two fonts, and one stand-in.** Springfield sets the title; Saba Lou
Handwritten 2 sets everything else. That face is missing a number of glyphs
(including a lowercase `d`), so Patrick Hand is loaded behind it to catch them —
see TODO item 1.

**Type on the painting doesn't follow the theme.** The hero image looks the same
in light and dark mode, so anything sitting on it uses the `--on-hero*` tokens,
or the fixed browns and off-whites of the chip panels, rather than `--ink`. The
hero also always fades down to `--hero-foot` in both themes; the handoff to the
page colour happens in the dusk band at the top of the `.deep` section.

**The hero image fades itself.** `public/images/hero-new.jpg` is 9:16 with the
fade to black painted in, aligned to the roofline, so in portrait there is
nothing to draw on top of it. On viewports wider than square, `object-fit:
cover` crops the tail of that fade away, so `.fade` seats the bottom **10%** on
`--hero-foot` — `#170200`, sampled from the image's own black, so the CSS fade
and the painted one meet invisibly.

**The newsletter posts straight to the Las Aguas dashboard**, per the
`las-aguas-signup-form` skill in `skills/`. Two calls: `forms-public/track` on
mount records the visit (referrer, UTM, language; device and geo are derived
server-side), and `forms-public/submit` on send carries the same
`session_token`, which is what attributes the sign-up back to that visit. Both
endpoints are deliberately CORS-open and credential-free, so there's no API
route here and no secret — only the form's public slug.

⚠️ The API **silently drops any field the dashboard form hasn't enabled**. This
site collects name and city; both must be ticked on the form or they vanish.

## Visitor tracking

`lib/tracker.js`, installed per `/setup-artist-tracking`, beaconing to the
shared `track-event` Edge Function (Supabase `gtccctajvobfvhlonaot`, artist
`4`). Two things differ from that command's static-site recipe, both forced by
this being a Next app:

- There's no per-file `<script>` tag to add. The tracker starts once from
  `pages/_app.js`, covering every route.
- Next navigates client-side, so a pageview fires on every `routeChangeComplete`
  and the per-page scroll/engagement watchers are torn down and restarted with
  it. Without that, a whole visit would record as one pageview of the entry page.

Anything with `data-track-type` is click-tracked by a delegated listener — see
the nav chips, socials, contact link and impressum. Keep `data-track-platform`
to the exact strings the command lists, so numbers line up across artist sites.

**Consent.** Pageviews, clicks, referrer, UTM, device and country run on
legitimate interest and are always recorded. The returning-visitor cookie,
scroll depth and time-on-page need consent and are gated behind
`components/ConsentBanner.js` (cookies `sl_consent` / `sl_ret`, same semantics
as the command's stock banner — only the presentation is the site's own). No IP,
User-Agent, email or name is ever stored.
