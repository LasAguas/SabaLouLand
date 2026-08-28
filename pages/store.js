// ---------------------------------------------------------------------------
// /store — laid out from the sketch, three bands with a hairline between each:
//
//   header   language chips top-left, colour mode top-right, the head+titles
//            centered as their own group, the welcome line under all of it —
//            all via named grid areas, so mobile can reorder them (theme
//            toggle stays top-right, welcome moves above the nav row) without
//            the JSX needing two copies of anything
//   ─────────
//   store    the shelves down the left fifth, the goods in a grid on the right
//   ─────────
//   footer   the mailing-list signup and the home page's own footer
//
// Same arrangement as pages/index.js: structure and styles here, WORDS in
// lib/content.js (three languages), behaviour in components/. The store's
// dashboard wiring is all in components/Storefront.js.
// ---------------------------------------------------------------------------
import Head from "next/head";
import Image from "next/image";
import LanguageSelector from "../components/LanguageSelector";
import Moon from "../components/Moon";
import NavRail from "../components/NavRail";
import Newsletter from "../components/Newsletter";
import SiteFooter from "../components/SiteFooter";
import Storefront from "../components/Storefront";
import ThemeToggle from "../components/ThemeToggle";
import { useLanguage } from "../lib/useLanguage";
import { useTheme } from "../lib/useTheme";

// same fixed phase the home page uses — see TODO.md item 12
const MOON_PHASE = 0.62;

// (banner) hand-lettered "welcome to my store!", one edit per theme — same
// pattern as the home page's own HERO. English only for now; there's no
// German/Spanish artwork yet, so every language falls back to this image and
// carries the translation in its alt text instead (see the store.welcome
// strings in lib/content.js).
const WELCOME_BANNER = {
  dark: "/images/store/welcome-banner-dark.png",
  light: "/images/store/welcome-banner-light.png",
};

// The title, set letter by letter like the home page's. The home page arcs it
// around a 60vh circle on top of this; here it stays on the line — a page
// heading rather than a crest — so only the hand-drawn jitter is kept.
const TITLE = "SABA LOU LAND";
const LEAN = [-4, 2, -1.5, 3.5, 0, -2.5, 4, -3, 1, 0, 2.5, -1.5, 3];
const RISE = [2, -3, 1, 4, 0, -1, 3, -2, 2, 0, -3, 1.5, -2];

export default function Store() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const s = t.store;
  const bannerSrc = WELCOME_BANNER[theme] ?? WELCOME_BANNER.dark;

  return (
    <>
      <Head>
        <title>{`${s.title} — Saba Lou Land`}</title>
        <meta
          name="description"
          content="The Saba Lou Land store — music, prints, merch and quilts, made and sent by Saba Lou."
        />
        <meta property="og:title" content={`${s.title} — Saba Lou Land`} />
        <meta property="og:type" content="website" />
      </Head>

      <main className="page grain">
        <div className="sheet">
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

              {/* head + titles, centered as their own group on the page */}
              <header className="crest">
                <span className="face tilt" style={{ "--tilt": "-3deg" }}>
                  <Image
                    src="/images/store/saba-lou-head.png"
                    alt=""
                    width={200}
                    height={200}
                    priority
                  />
                </span>

                <div className="titles">
                  <h1 className="title" aria-label="Saba Lou Land">
                    {TITLE.split("").map((ch, i) => (
                      <span
                        key={i}
                        aria-hidden="true"
                        className={ch === " " ? "gap" : "ch"}
                        style={{
                          "--lean": `${LEAN[i] || 0}deg`,
                          "--rise": `${RISE[i] || 0}px`,
                        }}
                      >
                        {ch === " " ? " " : ch}
                      </span>
                    ))}
                  </h1>
                  {/* set from the same --title-size as the line above, so the
                      two can never drift apart */}
                  <p className="sub">{s.title}</p>
                </div>
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
            <Storefront />
          </section>

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

        {/* the moon keeps watch from the bottom-left corner, as on the home page */}
        <div className="moon-slot">
          <Moon phase={MOON_PHASE} size={64} />
        </div>
      </main>

      <style jsx>{`
        .page {
          position: relative; /* .grain::after hangs off this */
          min-height: 100svh;
          background: var(--deep);
          padding: clamp(1.1rem, 2.6vw, 2.4rem) clamp(1.1rem, 4vw, 3.2rem)
            clamp(7.5rem, 10vw, 9.5rem);
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
           and the nav rail are all independent grid children. Two equal
           flanking columns keep the auto-sized middle one — the crest —
           truly centered on the page, the same shape the home page's own
           .top uses. */
        .top {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          grid-template-areas:
            "lang    crest mode"
            ".       crest rail"
            "welcome welcome welcome";
          align-items: start;
          row-gap: clamp(1.1rem, 3vw, 2.2rem);
          column-gap: 1rem;
        }
        .top-l { grid-area: lang; justify-self: start; }
        .mode { grid-area: mode; justify-self: end; }
        .rail { grid-area: rail; justify-self: end; }

        /* ---- head + titles, centered as one group ---- */
        .crest {
          grid-area: crest;
          justify-self: center;
          display: flex;
          /* was center — the head's own illustration sits in the upper part
             of its circular frame (plain fabric fills the lower part), so
             centering the two boxes put the title noticeably lower than the
             face. Top-aligning instead. Un-verified against a live render —
             my own preview tool is stuck; flag if this reads wrong. */
          align-items: flex-start;
          gap: clamp(0.9rem, 2.4vw, 1.9rem);
          min-width: 0;
        }

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

        /* One size for both title lines, so "store" can't drift away from
           "SABA LOU LAND" — the media queries below move this, not the two
           rules that read it. */
        .titles {
          min-width: 0;
          --title-size: clamp(1.5rem, 4.6vw, 3.6rem);
        }

        .title {
          font-family: var(--font-title);
          font-weight: 400;
          margin: 0;
          font-size: var(--title-size);
          line-height: 1;
          letter-spacing: 0.015em;
          color: var(--ink);
          display: flex;
          flex-wrap: nowrap;
        }
        .ch {
          display: inline-block;
          transform: rotate(var(--lean)) translateY(var(--rise));
          transform-origin: center bottom;
        }
        .gap { display: inline-block; width: 0.32em; }

        /* Same size, same colour and same tracking as the line above — at a
           matched size, different tracking reads as a mistake. The slight lean
           is the only thing it keeps of its own. */
        .sub {
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

        /* ============ narrow ====================================== */
        /* The head is wide now, so below this the two title lines drop under
           it rather than being squeezed into a sliver beside it. The head keeps
           its full doubled size — only its neighbour moves. */
        @media (max-width: 780px) {
          /* face above titles rather than side by side; justify-content
             centers whichever of the two wrapped lines is narrower under the
             wider one, so the pair still reads as one centered group */
          .crest { flex-wrap: wrap; justify-content: center; row-gap: 0.7rem; }
        }

        @media (max-width: 860px) {
          /* Redraw the map: language + mode share a top row (mode pinned top
             right, same corner it sits in on desktop), then the crest, then
             the welcome line — above the nav row, per the brief — then the
             rail last, since NavRail turns itself into a wrapped row of chips
             at this width and needs the full line to do it in. */
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

        @media (max-width: 520px) {
          .crest { gap: 0.8rem; }
          .titles { --title-size: clamp(1.3rem, 7.4vw, 2rem); }
        }
      `}</style>
    </>
  );
}
