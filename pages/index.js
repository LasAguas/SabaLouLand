// ---------------------------------------------------------------------------
// The whole home page: structure, content and styles in one file, in the order
// they appear on screen. Numbers in the comments are the ones on the sketch.
//
// The WORDS all live in lib/content.js (three languages, one block each) —
// change copy there, change layout and arrangement here.
//
// Still separate, because they carry behaviour rather than content:
//   LanguageSelector / ThemeToggle / NavRail  the chip panels
//   Newsletter                                the signup form + its API calls
//   Moon                                      phase geometry
//   SocialIcon                                the icon paths
// ---------------------------------------------------------------------------
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import LanguageSelector from "../components/LanguageSelector";
import Moon from "../components/Moon";
import NavRail from "../components/NavRail";
import Newsletter from "../components/Newsletter";
import SocialIcon from "../components/SocialIcons";
import ThemeToggle from "../components/ThemeToggle";
import { CONTACT_EMAIL, SOCIALS } from "../lib/content";
import { useLanguage } from "../lib/useLanguage";

// (10) fixed for now. Feed this from a real lunar-phase calculation later —
// Moon.js already draws whatever phase it's handed.
const MOON_PHASE = 0.62;

// The big decorative corner moon (bottom-right). Any phase but new/full, per
// the brief — waxing gibbous picked as a clear, recognisably-lit texture.
const CORNER_MOON = "/images/moons/waxing-gibbous.png";

// (2) the title, set letter by letter so it sits like it was drawn by hand.
const TITLE = "SABA LOU LAND";
const LEAN = [-4, 2, -1.5, 3.5, 0, -2.5, 4, -3, 1, 0, 2.5, -1.5, 3];
const RISE = [2, -3, 1, 4, 0, -1, 3, -2, 2, 0, -3, 1.5, -2];

// (9) each gratitude drifts a little, so the block never squares up.
const THANKS_DRIFT = [0, 1.4, 0.4, 2.1, 0.9, 2.6, 1.1, 2.2, 3.4, 1.6];
const THANKS_LEAN = [-1.6, 0.8, -0.5, 1.2, -1.1, 0.6, -0.9, 1.4, -0.4, 1];

// (7) how far each social icon kicks when you hover it.
const SOCIAL_TILT = [-6, 3, -2, 5, -4];

export default function Home() {
  const { t } = useLanguage();
  const [thanksOpener, ...thanks] = t.gratitudes;
  const year = new Date().getFullYear();

  return (
    <>
      <Head>
        <title>Saba Lou Land</title>
        <meta
          name="description"
          content="Saba Lou Land — portraits, musick, dreamscapes and comics from Saba Lou, an independent multimedia artist in Berlin."
        />
        <meta property="og:title" content="Saba Lou Land" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/hero-new.jpg" />
      </Head>

      <main>
        {/* ============ (0) hero ==================================== */}
        <section className="hero grain">
          <div className="plate">
            <Image src="/images/hero-new.jpg" alt="" fill priority sizes="100vw" quality={82} />
          </div>

          {/* The image carries its own fade to black, aligned to the roofline,
              so in portrait there is nothing to draw on top of it. On wider
              viewports `cover` crops the tail of that fade away, so .fade seats
              the last 10% on --hero-foot — #170200, the exact black the image
              fades to, so the two meet invisibly. */}
          <div className="fade" aria-hidden="true" />
          <div className="crown" aria-hidden="true" />

          <div className="chrome">
            <div className="top">
              <div className="top-l">
                <LanguageSelector />{/* (1) */}
              </div>

              {/* ---- (2) title + logo ---- */}
              <header className="top-c crest">
                <h1 className="title" aria-label="Saba Lou Land">
                  {TITLE.split("").map((ch, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className={ch === " " ? "gap" : "ch"}
                      style={{ "--lean": `${LEAN[i] || 0}deg`, "--rise": `${RISE[i] || 0}px` }}
                    >
                      {ch === " " ? " " : ch}
                    </span>
                  ))}
                </h1>
                {/* TODO: real logo — see TODO.md */}
                <span className="logo tilt" style={{ "--tilt": "-2.5deg" }}>
                  <Image
                    src="/images/logo-placeholder.svg"
                    alt="Saba Lou Land logo"
                    width={92}
                    height={92}
                    priority
                  />
                </span>
              </header>

              <div className="top-r">
                <ThemeToggle />{/* (3) */}
              </div>
            </div>

            <div className="mid">
              {/* ---- (4) the greeting ---- */}
              <section className="mid-l bio" aria-label="welcome">
                {t.bio.map((para, i) => (
                  <p key={i} className="tilt" style={{ "--tilt": i === 0 ? "-0.7deg" : "0.6deg" }}>
                    {para}
                  </p>
                ))}
              </section>

              <div className="mid-r">
                <NavRail />{/* (5) */}
              </div>
            </div>
          </div>
        </section>

        {/* ============ the dark below ============================== */}
        <section className="deep grain">
          <div className="deep-in">
            <div className="deep-l">
              <Newsletter />{/* (6) */}
            </div>

            {/* ---- (9) gratitudes ---- */}
            <section className="deep-r thanks" aria-label={thanksOpener}>
              <p className="opener tilt" style={{ "--tilt": "-2deg" }}>{thanksOpener}</p>
              <ul>
                {thanks.map((line, i) => (
                  <li
                    key={line + i}
                    className="tilt"
                    style={{
                      "--tilt": `${THANKS_LEAN[i % THANKS_LEAN.length]}deg`,
                      "--drift": `${THANKS_DRIFT[i % THANKS_DRIFT.length]}rem`,
                    }}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* ---- (7) footer: socials, contact, impressum ---- */}
          <footer className="foot-in foot">
            <div className="socials">
              <span className="lead tilt" style={{ "--tilt": "-1.5deg" }}>{t.footer.findMe}</span>
              <ul>
                {SOCIALS.map((s, i) => (
                  <li key={s.key} style={{ "--tilt": `${SOCIAL_TILT[i % SOCIAL_TILT.length]}deg` }}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="me noopener noreferrer"
                      className="tilt"
                      title={s.key}
                      data-track-type={s.track.type}
                      data-track-label={s.key}
                      data-track-platform={s.track.platform}
                      data-track-category={s.track.type}
                    >
                      <SocialIcon name={s.key} />
                      <span className="sr-only">{s.key}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <span className="handle tilt" style={{ "--tilt": "1.8deg" }}>@sabalouland</span>

              {/* the plus signs are part of the mark, not decoration */}
              <a
                className="contact tilt"
                style={{ "--tilt": "-1.6deg" }}
                href={`mailto:${CONTACT_EMAIL}`}
                data-track-type="other"
                data-track-label="contact"
                data-track-category="contact"
              >
                <span aria-hidden="true">+</span>
                {t.contact}
                <span aria-hidden="true">+</span>
              </a>
            </div>

            <div className="fine">
              {/* TODO: /impressum doesn't exist yet — see TODO.md */}
              <Link
                href="/impressum"
                className="impressum"
                data-track-type="other"
                data-track-label="impressum"
                data-track-category="legal"
              >
                {t.footer.impressum}
              </Link>
              <span className="dot" aria-hidden="true">·</span>
              <span>© {year} Saba Lou</span>
              <span className="dot last" aria-hidden="true">·</span>
              <span className="rights">{t.footer.rights}</span>
            </div>
          </footer>

          {/* (10) the moon keeps watch from the bottom-left corner */}
          <div className="moon-slot">
            <Moon phase={MOON_PHASE} size={64} />
          </div>

          {/* A second, decorative moon — hanging off the opposite corner.
              CORNER_MOON is one of the eight textures in public/images/moons/,
              fixed for now (anything but new/full, per the brief). Once the real
              lunar-phase calculation feeds MOON_PHASE above, this can pick its
              file from the same value instead of being hardcoded. */}
          <div className="corner-moon" aria-hidden="true">
            <Image src={CORNER_MOON} alt="" fill sizes="30vw" quality={82} />
          </div>
        </section>
      </main>

      <style jsx>{`
        main { position: relative; }

        /* ============ hero ======================================== */
        .hero {
          position: relative;
          min-height: 100svh;
          display: flex;
          background: var(--hero-foot);
          overflow: clip;
        }
        .plate { position: absolute; inset: 0; z-index: 0; }
        .plate :global(img) {
          object-fit: cover;
          /* portrait: from the top, so the image's own fade lands where it was
             drawn to land */
          object-position: 50% 0%;
        }

        .fade {
          position: absolute;
          inset: auto 0 0 0;
          height: 0; /* off in portrait — the image already fades itself */
          z-index: 1;
          background: linear-gradient(to bottom, transparent, var(--hero-foot) 88%);
        }
        .crown {
          position: absolute;
          inset: 0 0 auto 0;
          height: 34%;
          z-index: 1;
          background: linear-gradient(
            to bottom,
            color-mix(in srgb, var(--roof) 38%, transparent),
            transparent
          );
        }

        @media (min-aspect-ratio: 1/1) {
          /* The crop is pulled far enough down that the image's OWN fade is
             most of the way home by the bottom edge; the 10% below just seats
             it on --hero-foot so the join to .deep is exact. */
          .plate :global(img) { object-position: 50% 34%; }
          .fade { height: 10%; }
        }

        .chrome {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: min(1240px, 100%);
          margin: 0 auto;
          padding: clamp(1.1rem, 2.6vw, 2.4rem) clamp(1.1rem, 4vw, 3.2rem)
            clamp(2rem, 5vw, 3.5rem);
        }

        .top {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: start;
          gap: 1rem;
        }
        .top-l { justify-self: start; }
        .top-c { justify-self: center; margin-top: -0.4rem; }
        .top-r { justify-self: end; }

        /* ---- (2) title ---- */
        .crest {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          text-align: center;
        }
        .title {
          font-family: var(--font-title);
          font-weight: 400;
          margin: 0;
          font-size: clamp(2.1rem, 6.4vw, 5.1rem);
          line-height: 0.98;
          letter-spacing: 0.015em;
          color: var(--on-hero);
          text-shadow: 0 2px 18px rgba(7, 9, 12, 0.45);
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
        }
        .ch {
          display: inline-block;
          transform: rotate(var(--lean)) translateY(var(--rise));
          transform-origin: center bottom;
        }
        .gap { display: inline-block; width: 0.32em; }
        .logo :global(img) {
          display: block;
          width: clamp(58px, 7vw, 92px);
          height: auto;
        }

        /* ---- middle band ---- */
        .mid {
          flex: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 2rem;
          /* the two halves deliberately don't share a baseline */
        }
        /* kept high and left, over the open sky rather than the figure */
        .mid-l {
          margin-top: clamp(0.5rem, 2vh, 1.5rem);
          margin-left: clamp(0rem, 2vw, 2.5rem);
        }
        .mid-r {
          justify-self: end;
          align-self: start;
          margin-top: clamp(0.5rem, 3vh, 2rem);
          margin-right: clamp(0rem, 1.5vw, 1.5rem);
        }

        /* ---- (4) the greeting ---- */
        .bio {
          position: relative;
          /* Sized to the clear patch of sky on the left: wide enough that the
             block is short and finishes above the roofline, narrow enough that
             the line ends stop short of the figure's jacket. Going wider trades
             overlap with the branches for overlap with the figure. */
          max-width: 51ch;
          isolation: isolate;
        }
        .bio p {
          margin: 0 0 0.7rem;
          color: var(--bio-ink);
          font-size: 0.96em;
          line-height: 1.55;
          /* Glow deliberately OFF — the alphas are zeroed rather than the rule
             deleted so it can be dialled back in by raising them. Leave it at
             zero unless asked; legibility is handled by the crop and by how
             wide the block is instead. */
          text-shadow: 0 0 3px rgba(250, 246, 238, 0),
            0 0 7px rgba(250, 246, 238, 0),
            0 0 14px rgba(250, 246, 238, 0),
            0 0 26px rgba(250, 246, 238, 0);
        }
        .bio p:last-of-type { margin-bottom: 0; }
        .bio p:nth-of-type(2) { margin-left: 0.6rem; }

        /* ============ deep ======================================== */
        .deep {
          position: relative;
          /* .deep is the last section on the page, so its own bottom edge IS
             the page's bottom edge — clipping here is what makes the corner
             moon below read as "half off screen" instead of adding blank
             scrollable space past the end of the page. */
          overflow: hidden;
          background: var(--deep);
          /* the bottom padding is the moon's band — see .moon-slot */
          padding: 0 clamp(1.1rem, 4vw, 3.2rem) clamp(7.5rem, 10vw, 9.5rem);
          --dusk: clamp(90px, 10vw, 140px);
        }
        /* Dusk band: carries --hero-foot down into the page colour. Invisible
           in dark mode (both ends are the same near-black); in light mode it
           reads as the painting's night giving way to paper. */
        .deep::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: var(--dusk);
          pointer-events: none;
          background: linear-gradient(to bottom, var(--hero-foot), var(--deep));
        }
        .deep-in,
        .foot-in {
          width: min(1240px, 100%);
          margin: 0 auto;
        }
        .deep-in {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
          gap: clamp(2.5rem, 7vw, 5rem);
          align-items: start;
          /* just clear of the dusk band — any more and the page opens on a
             screenful of nothing */
          padding-top: calc(var(--dusk) + 0.5rem);
          padding-bottom: clamp(2.5rem, 6vw, 4rem);
        }
        .deep-l { padding-left: clamp(0rem, 2vw, 2.2rem); }
        /* the thanks hang lower than the signup, on purpose */
        .deep-r { margin-top: clamp(1rem, 3vw, 2.5rem); }

        /* ---- (9) gratitudes ---- */
        .thanks { color: var(--ink-dim); }
        .thanks .opener {
          margin: 0 0 0.7rem;
          font-size: 0.84em;
          letter-spacing: 0.14em;
          color: var(--ink-faint);
        }
        .thanks ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.12rem;
        }
        .thanks li {
          margin-left: var(--drift);
          font-size: 1.02em;
          line-height: 1.5;
          transform-origin: left center;
        }
        /* "and" — the hinge line — sits smaller and further in */
        .thanks li:nth-last-child(2) {
          font-size: 0.82em;
          color: var(--ink-faint);
          letter-spacing: 0.1em;
        }
        /* "the loveling" used to be singled out in --ink (brighter than the
           rest, which sit at --ink-dim via .thanks) — matched back to the rest
           of the list per feedback. */

        /* ---- (7) footer ---- */
        .foot {
          display: flex;
          flex-direction: column;
          gap: 1.6rem;
          padding: 2.6rem 0 0;
          border-top: var(--rule) solid var(--foot-ink-dim);
        }
        .socials {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          flex-wrap: wrap;
        }
        .lead, .handle {
          font-size: 0.84em;
          letter-spacing: 0.06em;
          color: var(--foot-ink-dim);
        }
        .handle { color: var(--foot-ink); }

        .socials ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .socials li:nth-child(even) { transform: translateY(-4px); }
        .socials li:nth-child(3) { transform: translateY(3px); }

        /* scoped to the icon list — the contact link lives in this row too and
           must not inherit the 2.3rem icon box */
        .socials ul :global(a) {
          display: grid;
          place-items: center;
          width: 2.3rem;
          height: 2.3rem;
          color: var(--foot-ink);
          transform-origin: center;
          transition: filter 200ms ease, transform 260ms cubic-bezier(0.34, 1.4, 0.64, 1);
        }
        .socials ul :global(a:hover) {
          filter: brightness(1.25);
          transform: rotate(var(--tilt)) scale(1.1);
        }

        .contact {
          display: inline-flex;
          align-items: baseline;
          gap: 0;
          flex: none;
          white-space: nowrap;
          margin-left: auto;
          color: var(--foot-ink);
          font-size: 1.02em;
          letter-spacing: 0.02em;
          transition: filter 180ms ease, transform 200ms ease;
        }
        .contact:hover { filter: brightness(1.25); transform: rotate(1.2deg) translateY(-1px); }

        .fine {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          font-size: 0.78em;
          color: var(--foot-ink-dim);
          letter-spacing: 0.03em;
        }
        .fine :global(.impressum) {
          color: var(--foot-ink);
          border-bottom: var(--rule) solid var(--foot-ink-dim);
          padding-bottom: 1px;
          transition: filter 180ms ease, border-color 180ms ease;
        }
        .fine :global(.impressum:hover) {
          filter: brightness(1.25);
          border-bottom-color: var(--foot-ink);
        }
        .dot { opacity: 0.5; }

        .moon-slot {
          position: absolute;
          left: clamp(1.1rem, 4vw, 3.2rem);
          bottom: clamp(1.4rem, 3vw, 2.4rem);
          pointer-events: none;
        }

        /* Decorative only — no interaction, no shadow. Deliberately no
           z-index: a negative one renders it below .grain::after, the paper-
           texture overlay shared by every "grain" section — a global helper,
           not something to special-case here — which made it invisible
           rather than merely textured. Left at the default stacking order, it
           renders above the plain background like the rest of this section's
           decorative layers (.deep::before, the grain itself); the shape's
           own transparent PNG margins keep it clear of the nearby +contact+
           text (checked below).

           Cropped on the right edge only, by half its width — the bottom sits
           flush, uncropped, so the whole height (and roughly half the disc)
           reads as visible, rather than the quarter-disc a corner-anchored
           crop on both edges gives. */
        .corner-moon {
          position: absolute;
          right: -15vw;
          bottom: 0;
          width: 30vw;
          aspect-ratio: 1;
          pointer-events: none;
        }
        .corner-moon :global(img) {
          object-fit: contain;
        }

        /* ============ narrow ====================================== */
        @media (max-width: 860px) {
          /* Give the hero the image's own 9:16 so the whole thing shows: blue
             on top, and below it the black the image fades into — which is
             where the greeting goes. */
          .hero { min-height: calc(100vw * 16 / 9); }
          .chrome { gap: 1.2rem; padding-bottom: clamp(1.5rem, 6vw, 3rem); }
          .top {
            grid-template-columns: auto 1fr auto;
            grid-template-areas: "l c r";
            align-items: start;
            column-gap: 0.6rem;
          }
          .top-l { grid-area: l; }
          .top-r { grid-area: r; }
          .top-c { grid-area: c; justify-self: center; margin-top: 0; }

          .mid {
            grid-template-columns: 1fr;
            display: flex;
            flex-direction: column;
            /* the gap between nav and greeting — the two are the only items */
            gap: 5vh;
            margin-top: 0;
          }
          /* Nav and greeting travel together at the foot of the hero: the auto
             margin on the nav (visually first) soaks up the slack above the
             pair, so the nav lands 10vh above the greeting rather than sitting
             way up under the title with a void between them. */
          .mid-r { order: -1; align-self: center; margin: auto 0 0; }
          .mid-l { margin: 0 0 0.5rem; }

          /* On a phone the greeting sits below the blue, on the black the image
             fades into — so it takes the same cream the rest of the page's
             lower half uses, and drops the halo it no longer needs. */
          .bio { max-width: none; }
          .bio p {
            color: var(--on-hero);
            text-shadow: none;
            font-size: 0.94em;
          }
          .bio p:nth-of-type(2) { margin-left: 0; }

          .deep-in { grid-template-columns: 1fr; gap: 3rem; }
          .deep-l { padding-left: 0; }
          .deep-r { margin-top: 0; }
          .thanks li { margin-left: calc(var(--drift) * 0.55); }

          .contact { margin-left: 0; }
        }

        @media (max-width: 520px) {
          .title { font-size: clamp(1.7rem, 8.6vw, 2.6rem); }
        }
        @media (max-width: 560px) {
          .rights, .dot.last { display: none; }
          .foot { padding: 2rem 0 0; }
        }
      `}</style>
    </>
  );
}
