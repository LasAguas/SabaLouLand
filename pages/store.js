// ---------------------------------------------------------------------------
// /store — laid out from the sketch, three bands with a hairline between each:
//
//   header   desktop: one top-aligned band — language chips on the left, the
//            head+titles centered in the space between them and the nav rail
//            + colour mode on the right — with the welcome line under it.
//            mobile: language chips and colour mode flank the head+titles
//            in one top row, then the welcome line, then the nav row.
//            All via named grid areas, so mobile can reorder them without
//            the JSX needing two copies of anything
//   ─────────
//   store    the shelves down the left fifth, the goods in a grid on the right
//   ─────────
//   footer   the mailing-list signup and the home page's own footer
//
// The header and the store band are wrapped in one .stage. From 861px up it
// paints the open shelf's photo behind both — header and shelf menu tinted
// darker with --veil, goods under --scrim — and the footer sits outside it.
// Which shelf is open therefore lives here and is handed to Storefront.
//
// Same arrangement as pages/index.js: structure and styles here, WORDS in
// lib/content.js (three languages), behaviour in components/. The store's
// dashboard wiring is all in components/Storefront.js.
// ---------------------------------------------------------------------------
import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import LanguageSelector from "../components/LanguageSelector";
import NavRail from "../components/NavRail";
import Newsletter from "../components/Newsletter";
import SiteFooter from "../components/SiteFooter";
import Storefront from "../components/Storefront";
import ThemeToggle from "../components/ThemeToggle";
import { useLanguage } from "../lib/useLanguage";
import { useTheme } from "../lib/useTheme";

// same fixed phase the home page uses — see TODO.md item 12

// (banner) hand-lettered "welcome to my store!", one edit per theme — same
// pattern as the home page's own HERO. English only for now; there's no
// German/Spanish artwork yet, so every language falls back to this image and
// carries the translation in its alt text instead (see the store.welcome
// strings in lib/content.js).
const WELCOME_BANNER = {
  dark: "/images/store/welcome-banner-dark.png",
  light: "/images/store/welcome-banner-light.png",
};

// The backdrop photo for whichever shelf is open — the artist's own
// sweater/fabric close-ups, one per category. It lives here rather than in
// Storefront.js because at desktop widths it paints behind the header and the
// shelf menu too, so the page has to know which shelf is open (Storefront is
// now controlled from here: see the `shelf` state below).
const SHELF_BG = {
  all: "/images/store/everything-bg.jpg",
  music: "/images/store/music-bg.jpg",
  prints: "/images/store/prints-bg.jpg",
  merch: "/images/store/merch-bg.jpg",
  quilts: "/images/store/quilts-bg.jpg",
};

// The title, set letter by letter on a straight line: each letter keeps only
// its own small hand-set lean (LEAN, one entry per letter), the same at every
// width. It used to sit on an arc — a frown on desktop, a smile on mobile — and
// no longer does. Kept identical across /store, /about, /gallery and /book.
const TITLE = "SABALOULAND";
const LEAN = [-4, 2, -1.5, 3.5, -2.5, 4, -3, 0, 2.5, -1.5, 3];

export default function Store() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const s = t.store;
  const bannerSrc = WELCOME_BANNER[theme] ?? WELCOME_BANNER.dark;
  const [shelf, setShelf] = useState("all");
  const shelfBg = SHELF_BG[shelf];

  return (
    <>
      <Head>
        <title>{`${s.title} — Sabalouland`}</title>
        <meta
          name="description"
          content="The Sabalouland store — music, prints, merch and quilts, made and sent by Saba Lou."
        />
        <meta property="og:title" content={`${s.title} — Sabalouland`} />
        <meta property="og:type" content="website" />
      </Head>

      <main className="page grain">
        <div className="sheet">
          {/* The header and the store band share one backdrop: the shelf photo
              rides on --shelf-bg, which the stage's own CSS paints behind
              everything from 861px up and which Storefront's goods paint for
              themselves below that. The footer sits outside it. */}
          <div
            className="stage"
            style={{ "--shelf-bg": shelfBg ? `url("${shelfBg}")` : "none" }}
          >
          {/* ============ header ==================================== */}
          <section className="head">
            {/* Five independent grid items — lang / crest / mode / welcome /
                rail — placed purely via grid-template-areas below, so the two
                breakpoints (wide vs. narrow) can rearrange them freely. See
                the .top rule for the actual layout; nothing here dictates
                position. */}
            <div className="top">
              <div className="top-l">
                <LanguageSelector />
              </div>

              {/* head + titles, centered as their own group between the
                  language chips and the nav.
                  Desktop: face beside the straight title, caption tucked under
                  that title. Mobile: face on top, the title straight
                  under it, caption under that — all in the top
                  row between the language chips and the colour switch.
                  grid-template-areas below redraws which. */}
              <header className="crest">
                <span className="face tilt" style={{ "--tilt": "-3deg" }}>
                  <Image
                    src="/images/store/saba-lou-head-2.png"
                    alt=""
                    width={200}
                    height={200}
                    priority
                  />
                </span>

                <h1 className="title" aria-label="Sabalouland">
                  {TITLE.split("").map((ch, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className="ch"
                      style={{ "--lean": `${LEAN[i] || 0}deg` }}
                    >
                      {ch}
                    </span>
                  ))}
                </h1>

                <p className="sub">{s.title}</p>
              </header>

              <div className="mode">
                <ThemeToggle />
              </div>

              {/* (banner) sits right above the rule dividing header from
                  body on every width; on mobile that also puts it above the
                  nav row, since the row order below places it before .rail */}
              <div className="welcome">
                <Image src={bannerSrc} alt={s.welcome} width={838} height={61} />
              </div>

              <div className="rail">
                <NavRail />
              </div>
            </div>
          </section>

          <hr className="rule" />

          {/* ============ the store ================================= */}
          <section className="shop" aria-label={s.title}>
            <Storefront shelf={shelf} onShelfChange={setShelf} />
          </section>
          </div>

          <hr className="rule" />

          {/* ============ footer ==================================== */}
          {/* (sketch) signup on the right, the home page's footer on the left.
              SiteFooter draws its own hairline on the home page; here the
              section rule above has already drawn it. */}
          <section className="tail">
            <div className="tail-l">
              <SiteFooter divider={false} />
            </div>
            <div className="tail-r">
              <Newsletter />
            </div>
          </section>
        </div>

      </main>

      <style jsx>{`
        .page {
          position: relative; /* .grain::after hangs off this */
          min-height: 100svh;
          background: var(--deep);
          padding: var(--page-pad-top) var(--page-pad-x)
            clamp(7.5rem, 10vw, 9.5rem);
          /* The page's top and side padding, named so the backdrop panel
             below can reach out into them. */
          --page-pad-top: clamp(1.1rem, 2.6vw, 2.4rem);
          --page-pad-x: clamp(1.1rem, 4vw, 3.2rem);
          /* How far the backdrop panel reaches past the content column on each
             side: all the way to the edge of the viewport. The column is
             min(1240px, the viewport less the side padding) and centred, so
             the gap either side is half the difference. Built from viewport
             units alone, no percentages, because Storefront.js uses it on grid
             items, where a percentage would resolve against the wrong box.
             100vw includes a classic scrollbar, so there it overshoots by a
             few px a side — html and body clip the overflow. */
          --stage-bleed: calc((100vw - min(1240px, 100vw - 2 * var(--page-pad-x))) / 2);
          /* The translucent tint the header and the shelf menu sit under: the
             page's own background colour at ~78%. Near-black in the dark
             theme, so the photo reads darker there than behind the goods; in
             the light theme it's the cream, so the dark ink stays legible. */
          --veil: color-mix(in srgb, var(--deep) 78%, transparent);
          /* The breathing room around the two rules. It lives on the BANDS, not
             on the rules themselves, so that the store's vertical divider —
             which is a border on a full-height grid column — runs the whole way
             from one horizontal rule to the other instead of stopping short at
             the top and bottom of the goods. Storefront.js reads this too. */
          --band-pad: clamp(1.6rem, 3.6vw, 2.8rem);
        }
        .sheet {
          width: min(1240px, 100%);
          margin: 0 auto;
        }

        /* the two rules the sketch draws across the page. No margin of their
           own — see --band-pad above. */
        .rule {
          border: 0;
          border-top: var(--rule) solid var(--ink-faint);
          margin: 0;
        }
        .head { padding-bottom: var(--band-pad); }
        .tail { padding-top: var(--band-pad); }

        /* ============ header ====================================== */
        /* Five named areas rather than nested wrapper divs, so a media query
           can just redraw the map instead of restructuring flex parents:
           the language chips, the crest, the mode switch, the welcome line
           and the nav rail are all independent grid children. The map itself
           is drawn by the two queries at the bottom — "wide" from 861px up,
           "narrow" below it — so this base rule is only what they share plus
           the columns the narrow one inherits: two equal flanking columns
           keeping the auto-sized middle one truly centered, the same shape
           the home page's own .top uses. */
        .top {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: start;
          column-gap: 1rem;
        }
        .top-l { grid-area: lang; justify-self: start; }
        .mode { grid-area: mode; justify-self: end; }
        .rail { grid-area: rail; justify-self: end; }

        /* ---- head + titles, centered as one group ----
           Desktop: face on the left, the straight title beside it, "store"
           tucked under that title — three independent grid items rather
           than nested wrapper divs, so the narrow query below can redraw
           the map instead of restructuring flex parents. */
        .crest {
          grid-area: crest;
          justify-self: center;
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-areas:
            "face title"
            "face sub";
          /* was center — the head's own illustration sat in the upper part
             of its circular frame (plain fabric filled the lower part), so
             centering the two boxes put the title noticeably lower than the
             face. Top-aligning instead; the wide query below centres the
             title and caption again, now that the PNG is trimmed close to
             the head and its box is its middle. */
          align-items: start;
          column-gap: clamp(0.9rem, 2.4vw, 1.9rem);
          min-width: 0;
          --title-size: clamp(1.5rem, 4.6vw, 3.6rem);
        }
        .face { grid-area: face; }

        /* ---- (banner) just above the header/body rule, full width ---- */
        .welcome { grid-area: welcome; }
        .welcome :global(img) {
          display: block;
          width: 100%;
          height: auto;
        }
        /* twice the size it was (was clamp(78px, 11vw, 138px)). HEADS UP:
           the source PNG is only 200x200, so past ~140px it is being upscaled
           — see TODO.md. */
        .face :global(img) {
          display: block;
          width: clamp(156px, 22vw, 276px);
          height: auto;
        }

        .title {
          grid-area: title;
          font-family: var(--font-title);
          font-weight: 400;
          margin: 0;
          font-size: var(--title-size);
          line-height: 1;
          letter-spacing: 0.015em;
          color: var(--ink);
          display: flex;
          flex-wrap: nowrap;
          min-width: 0;
        }
        /* each letter keeps only its own small lean, set inline as --lean */
        .ch {
          display: inline-block;
          transform: rotate(var(--lean));
          transform-origin: center bottom;
        }

        /* Same size, same colour and same tracking as the title above — at
           a matched size, different tracking reads as a mistake. The slight
           lean is the only thing it keeps of its own. */
        .sub {
          grid-area: sub;
          font-family: var(--font-title);
          margin: 0.1rem 0 0 0.15rem;
          font-size: var(--title-size);
          line-height: 1;
          letter-spacing: 0.015em;
          color: var(--ink);
          transform: rotate(-1.4deg);
          transform-origin: left center;
        }

        /* ============ footer ====================================== */
        /* the same 1fr / 0.8fr split the home page's lower band uses */
        .tail {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
          gap: clamp(2.5rem, 7vw, 5rem);
          align-items: start;
        }
        .tail-r { padding-top: 0.15rem; }

        .moon-slot {
          position: absolute;
          left: clamp(1.1rem, 4vw, 3.2rem);
          bottom: clamp(1.4rem, 3vw, 2.4rem);
          pointer-events: none;
        }

        /* ============ wide ========================================
           Desktop, 861px and up: one band, everything top-aligned —
           language chips, crest, nav rail, colour mode — with the welcome
           line right under it, so the header is the height of the head
           rather than of a column of chips hanging beneath the mode switch.
           Nothing at 860px and below reads any of this. */
        @media (min-width: 861px) {
          /* The crest sits in the 1fr column, so it centres in whatever is
             left between the chips and the nav rather than on the page —
             centred on the page it would crowd the nav now that the mode
             switch has moved in beside it. column-gap is also the space
             between the nav rail and the mode switch. */
          .top {
            grid-template-columns: auto 1fr auto auto;
            grid-template-areas:
              "lang    crest   rail    mode"
              "welcome welcome welcome welcome";
            row-gap: 0;
            column-gap: clamp(0.75rem, 3.4vw, 4rem);
          }
          /* Level with the top of the head's circle, not the top of its image
             box: the PNG has ~4% of transparent margin above the circle. */
          .top-l,
          .rail,
          .mode { margin-top: 0.6rem; }

          /* Title and caption stacked tight and centred against the face.
             Both used to be top-aligned into two rows that the tall face
             stretched apart; the two flexible rows above and below soak up
             that height instead, leaving the pair together in the middle.
             (The head PNG is trimmed close to its content, so the middle of
             its box is the middle of the head.) */
          .crest {
            grid-template-rows: 1fr auto auto 1fr;
            grid-template-areas:
              "face ."
              "face title"
              "face sub"
              "face .";
          }
        }

        /* ============ backdrop ====================================
           At every width: the open shelf's photo runs behind the header and
           the shelf menu as well as the goods — one continuous panel (the
           .stage) instead of a box in the goods column alone. The header and
           the menu sit under the translucent --veil, so the photo shows
           through them darker than behind the goods, which only carry
           --scrim (Storefront.js).

           The panel runs the full width of the viewport (--stage-bleed is the
           gap between the content column and each screen edge) and up to the
           very top of the page. Header and rules reach out to the edges with
           negative margins and pull their content back with equal padding, so
           the header keeps exactly the geometry it had — nothing here moves
           it; it matters, because the crest has no spare room at the narrow
           end of desktop, so padding the header inward instead would overlap
           the title and the nav rail there.
           Phones get the same panel: the photo is the full-page backdrop
           there too, and Storefront.js tints the goods and the menu over it. */
        @media all {
          .stage {
            margin: calc(var(--page-pad-top) * -1) calc(var(--stage-bleed) * -1) 0;
            padding: var(--page-pad-top) var(--stage-bleed) 0;
            background-image: var(--shelf-bg, none);
            background-size: cover;
            background-position: center;
          }
          .head {
            margin: calc(var(--page-pad-top) * -1) calc(var(--stage-bleed) * -1) 0;
            padding: var(--page-pad-top) var(--stage-bleed) var(--band-pad);
          }
          /* both rules span the screen */
          .rule { margin-inline: calc(var(--stage-bleed) * -1); }
        }
        /* Wide only: the header sits under the translucent veil, and so does
           the rule beneath it so it doesn't show as a strip of bare photo.
           On phones the header is left bare over the photo. */
        @media (min-width: 861px) {
          .head { background: var(--veil); }
          .stage .rule { background: var(--veil); }
        }
        /* Phones: the panel is a tall column, so a photo sized to cover it
           would be blown up several times over. Pinning it to the screen
           keeps it at a sensible size, and it scrolls under the content.
           (iOS Safari ignores fixed attachment and falls back to scrolling.) */
        @media (max-width: 860px) {
          .stage { background-attachment: fixed; }
          /* the header, and the rule under it, carry the same translucent tint
             the goods do */
          .head,
          .stage .rule { background: var(--scrim); }
        }

        /* ============ narrow ======================================
           Below this the title stops sitting beside the face and sits under it
           instead: face, then the title, then
           "store" centered underneath.

           The crest also moves up into the top row, between the language
           chips and the colour switch (see the map below the 860px block —
           it has to come after it), so it is only as wide as what those two
           leave. Every size in it is therefore a share of that width: the
           crest is a size container, and the face and the type are cqw
           units of it rather than of the viewport. That keeps the three of
           them in the same proportion whatever the phone's width, or its
           text-size setting (which moves the switch's rem width). */
        @media (max-width: 780px) {
          .crest {
            grid-template-columns: 1fr;
            grid-template-areas:
              "face"
              "title"
              "sub";
            justify-items: center;
            justify-self: stretch;
            row-gap: 0;
            container-type: inline-size;
          }
          /* the face keeps the size it has everywhere else, and only gives
             way when the crest is too narrow to hold it */
          .face :global(img) { width: min(75cqw, clamp(156px, 22vw, 276px)); }
          .title,
          .sub { --title-size: clamp(1.1rem, 16.5cqw, 3rem); }
          .title {
            /* the air left between the face and the word */
            margin-top: 0.55em;
            position: relative;
            z-index: 1;
          }
          .sub {
            margin: 0.3em 0 0;
            font-size: calc(var(--title-size) * 0.7);
            transform-origin: center;
          }
        }

        @media (max-width: 860px) {
          /* Redraw the map: language + mode share a top row (mode pinned top
             right, same corner it sits in on desktop), then the crest, then
             the welcome line — above the nav row, per the brief — then the
             rail last, since NavRail turns itself into a wrapped row of chips
             at this width and needs the full line to do it in. Phones
             override this just below (see the 780px query after it). */
          .top {
            grid-template-areas:
              "lang   .      mode"
              "crest  crest  crest"
              "welcome welcome welcome"
              "rail   rail   rail";
            row-gap: 1.2rem;
          }
          /* centered, matching the crest/welcome above it, rather than the
             end-aligned rule it inherits from the desktop layout */
          .rail { justify-self: stretch; display: flex; justify-content: center; }

          .tail { grid-template-columns: 1fr; gap: 2.6rem; }
          /* signup first on a phone — the thing worth doing, above the
             small print */
          .tail-l { order: 2; }
          .tail-r { order: 1; padding-top: 0; }
        }

        /* Phones: the crest joins the chips in the top row, in the middle
           column, and the welcome line and the nav row follow. After the
           860px block on purpose — both set grid-template-areas on .top, so
           the later one wins. 781-860px keeps that block's map. */
        @media (max-width: 780px) {
          .top {
            grid-template-columns: auto minmax(0, 1fr) auto;
            grid-template-areas:
              "lang    crest    mode"
              "welcome welcome  welcome"
              "rail    rail     rail";
            column-gap: 0.5rem;
          }
        }
      `}</style>
    </>
  );
}
