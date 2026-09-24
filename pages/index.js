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
//   SiteFooter                                the footer, shared with /store
//   Moon                                      phase geometry
//   SocialIcon                                the icon paths (used by SiteFooter)
// ---------------------------------------------------------------------------
import Head from "next/head";
import Image from "next/image";
import LanguageSelector from "../components/LanguageSelector";
import NavRail from "../components/NavRail";
import Newsletter from "../components/Newsletter";
import SiteFooter from "../components/SiteFooter";
import ThemeToggle from "../components/ThemeToggle";
import { useLanguage } from "../lib/useLanguage";
import { useTheme } from "../lib/useTheme";

// (10) fixed for now. Feed this from a real lunar-phase calculation later —
// Moon.js already draws whatever phase it's handed.
const MOON_PHASE = 0.62;

// (0) the same painting, two edits of its own fade — each baked to hand off
// invisibly to that theme's --hero-foot. See the note by .hero below.
const HERO = {
  dark: "/images/hero-dark.jpg",
  light: "/images/hero-light.jpg",
};

// The big decorative corner moon (bottom-right). Any phase but new/full, per
// the brief — waxing gibbous picked as a clear, recognisably-lit texture. This
// is the photographic one from public/images/moons/realistic/, keyed onto a
// transparent background (the source was rendered on flat #180500).
const CORNER_MOON = "/images/moons/waxing-gibbous-realistic.png";

// (2) the title, set letter by letter so it sits like it was drawn by hand.
const TITLE = "SABALOULAND";
// per-letter lean — hand-drawn tilt, added on top of the arc's own tangent
// rotation below. Vertical position is left entirely to that arc (no
// separate per-letter rise jitter) — a fixed offset there fought the curve's
// own math letter to letter, especially near the centre where the arc's own
// contribution is smallest, and the result read as stepped rather than
// curved. Rotation doesn't have that problem: each span rotates around its
// own bottom-centre, so a lean jitter doesn't displace the curve it sits on.
const LEAN = [-4, 2, -1.5, 3.5, -2.5, 4, -3, 0, 2.5, -1.5, 3];
// a prominent arch across the whole word: the centre letters ride highest,
// the outer letters dip and tilt outward, as if the word were set on the rim
// of a circle 60vh across. Rotation and drop both come from the same angle
// theta, so each letter's own tilt matches the circle's tangent at that
// point instead of just approximating it.
// per-letter tightening (em, applied as negative margin-left) — the font's
// own side bearings leave A-L, L-O, O-U and U-L visibly looser than the rest.
const KERN = [0, 0, 0, -0.02, -0.02, -0.11, -0.04, -0.04, 0, 0, 0];
const ARC_RADIUS_VH = 30; // 60vh diameter
const ARC_THETA_MAX_DEG = 32; // how far around the rim the outer letters sit
const ARC_CENTER = (TITLE.length - 1) / 2;

// (9) each gratitude is indented a little differently, so the block never
// squares up. The lines themselves stay upright — only the indent varies.
const THANKS_DRIFT = [0, 1.4, 0.4, 2.1, 0.9, 2.6, 1.1, 2.2, 3.4, 1.6];

export default function Home() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [thanksOpener, ...thanks] = t.gratitudes;
  const heroSrc = HERO[theme] ?? HERO.dark;

  return (
    <>
      <Head>
        <title>Sabalouland</title>
        <meta
          name="description"
          content="Sabalouland — portraits, musick, dreamscapes and comics from Saba Lou, an independent multimedia artist in Berlin."
        />
        <meta property="og:title" content="Sabalouland" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={HERO.dark} />
      </Head>

      <main>
        {/* ============ (0) hero ==================================== */}
        <section className="hero grain">
          <div className="plate">
            <Image src={heroSrc} alt="" fill priority sizes="100vw" quality={82} />
          </div>

          {/* Each of the two images carries its own fade, baked in, aligned to
              the roofline, so in portrait there is nothing to draw on top of
              it — dark fades to #170200, light to #efe8d8, matching that
              theme's --hero-foot exactly so the two meet invisibly. On wider
              viewports `cover` crops the tail of that fade away, so .fade
              seats the last 10% on --hero-foot instead. */}
          <div className="fade" aria-hidden="true" />
          <div className="crown" aria-hidden="true" />

          <div className="chrome">
            <div className="top">
              <div className="top-l">
                <LanguageSelector />{/* (1) */}
              </div>

              {/* ---- (2) title + logo ---- */}
              <header className="top-c crest">
                <h1 className="title" aria-label="Sabalouland">
                  {TITLE.split("").map((ch, i) => {
                    const t = (i - ARC_CENTER) / ARC_CENTER; // -1 (left edge) .. 1 (right edge)
                    const thetaDeg = t * ARC_THETA_MAX_DEG;
                    const thetaRad = (thetaDeg * Math.PI) / 180;
                    const lean = (LEAN[i] || 0) + thetaDeg;
                    const arcRiseVh = ARC_RADIUS_VH * (1 - Math.cos(thetaRad));
                    return (
                      <span
                        key={i}
                        aria-hidden="true"
                        className="ch"
                        style={{ "--lean": `${lean}deg`, "--rise": `${arcRiseVh.toFixed(3)}vh`, marginLeft: `${KERN[i] || 0}em` }}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </h1>
                {/* The real mark, cream so it reads on the painting in both
                    themes — same reasoning as the title's on-hero ink, just
                    a fixed image instead of a theme-swapping CSS var. */}
                <span className="logo tilt" style={{ "--tilt": "-2.5deg" }}>
                  <Image
                    src="/images/icons/logo-on-hero.png"
                    alt=""
                    width={270}
                    height={263}
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
                  <p key={i}>{para}</p>
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
              <p className="opener">{thanksOpener}</p>
              <ul>
                {thanks.map((line, i) => (
                  <li
                    key={line + i}
                    style={{ "--drift": `${THANKS_DRIFT[i % THANKS_DRIFT.length]}rem` }}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* ---- (7) footer: socials, contact, impressum ---- */}
          <SiteFooter />


          {/* A second, decorative moon — hanging off the opposite corner.
              CORNER_MOON is one of the textures in public/images/moons/, fixed
              for now (anything but new/full, per the brief). Once the real
              lunar-phase calculation feeds MOON_PHASE above, this can pick its
              file from the same value instead of being hardcoded. */}
          <div className="corner-moon" aria-hidden="true">
            <Image src={CORNER_MOON} alt="" fill sizes="52vw" quality={82} />
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
        .logo :global(img) {
          display: block;
          width: clamp(58px, 7vw, 92px);
          height: auto;
          filter: drop-shadow(var(--on-hero-shadow));
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

        /* The second paragraph's right edge tapers inward as it descends: an
           invisible right-floated triangle the text wraps around, so each line
           ends a little shorter than the one above while the left edge stays
           put. shape-outside needs a real float to hang off, hence ::before
           rather than a clip — a clip would cut the glyphs instead of moving
           them. Only above 1259px: narrower than that the block leaves the sky
           entirely and sits under the blue, where a taper has nothing to dodge. */
        @media (min-width: 1260px) {
          .bio p:nth-of-type(2)::before {
            content: "";
            float: right;
            /* the deepest the taper eats into a line, reached at the float's
               own foot */
            width: 38%;
            /* Tall enough to outlast the longest translation (German runs 8
               lines / ~257px here; English 7, Spanish 6) — a float that ends
               early stops steering, and the leftover lines snap back out to
               full width. Any excess is empty space inside .bio, which is a
               grid item and so contains its own floats; it sits in open hero
               sky with nothing beneath it to push. */
            height: 13.2em;
            shape-outside: polygon(100% 0, 100% 100%, 0 100%);
            shape-margin: 0.45em;
          }
        }

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
          /* how far the gratitudes hang below the top of .deep-in. Shared with
             .corner-moon so the moon stays level with them — see below. */
          --thanks-lead: clamp(1rem, 3vw, 2.5rem);
        }
        /* Dusk band: carries --hero-foot down into the page colour. Invisible
           in both themes now that each hero image already fades to its own
           theme's near-paper/near-black — kept as the seam in case the two
           ever drift apart again. */
        .deep::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: var(--dusk);
          pointer-events: none;
          background: linear-gradient(to bottom, var(--hero-foot), var(--deep));
        }
        .deep-in {
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
        .deep-r { margin-top: var(--thanks-lead); }

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
           own transparent PNG margins keep it clear of the nearby text
           (checked below).

           Sits flush with .deep's own top edge rather than level with the
           gratitudes — high enough that its curve reads as starting up near
           the newsletter heading, well above the list, rather than as a bump
           parked beside it. A fixed top (not tied to --dusk / --thanks-lead)
           because the disc's radius, not the gratitudes' start line, is what
           decides how far down it reaches; anchoring to the same line as
           before pulled the disc's centre down toward the gratitudes and left
           no room to grow it without crossing text.

           52vw and even a full-height version (top: 0; bottom: 0, letting
           aspect-ratio derive the width) were tried first: both put the
           disc's centre close enough to the footer's height that no overhang
           could pull "+contact+" clear without shrinking the visible sliver
           to almost nothing. 44vw keeps the whole disc above the footer
           entirely — it never reaches that low — while still clearing every
           gratitude line by 85px+. Checked against each line's actual text
           bounds (not this box's own edges) at 870/1425/1920px viewports. */
        .corner-moon {
          position: absolute;
          right: -14vw;
          top: 10vh;
          width: 34vw;
          aspect-ratio: 1;
          pointer-events: none;
        }
        .corner-moon :global(img) {
          object-fit: contain;
          /* The box hangs off the right edge, so only its left ~45% is on
             screen — and a waxing gibbous, as photographed from the north, is
             lit on the right, which is exactly the half that would be off
             screen. Turned 180° it is the same real phase seen from the south
             (lit on the left), so the lit face is the part that shows. */
          transform: rotate(180deg);
        }

        /* ============ below the blue ==============================
           The greeting only sits ON the painting while the viewport is wide
           enough for the crop to leave a clear patch of sky beside the figure.
           Below 1260px it drops out of the sky and onto the dark the image
           fades into at the foot of the hero — the same place it lands on a
           phone — so it takes the cream the rest of the lower page uses.
           ========================================================== */
        @media (max-width: 1259px) {
          .bio { max-width: none; }
          .bio p {
            color: var(--on-hero);
            text-shadow: none;
            font-size: 0.94em;
          }
          .bio p:nth-of-type(2) { margin-left: 0; }
        }

        /* Tablet band only. Below 861px .mid becomes a flex column and the
           greeting is already last, so it reaches the foot on its own — and
           align-self there would push it sideways instead of down, since the
           cross axis has turned horizontal. */
        @media (min-width: 861px) and (max-width: 1259px) {
          .mid-l { align-self: end; margin-top: 0; }
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
          .top-c { grid-area: c; justify-self: center; margin-top: 20vh; }

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

          .deep-in { grid-template-columns: 1fr; gap: 3rem; }
          .deep-l { padding-left: 0; }
          .deep-r { margin-top: 0; }
          .thanks li { margin-left: calc(var(--drift) * 0.55); }

          /* .deep-in is one column here, so the gratitudes sit far below its
             top edge and levelling the moon with that edge would only line it
             up with the signup form. Bigger too (88vw vs. 44vw) and cropped
             harder to match (45vw of 88, vs. 24 of 44) — twice the disc, held
             to a similar visible slice.

             Bottom-anchored, but not flush: a flush disc this size would
             climb straight through the footer, since there's far less vertical
             room on a single mobile column than beside the gratitudes on
             desktop. 300px cleared the footer's own height (~160px here) with
             margin to spare when checked; if the footer ever grows past that,
             this needs bumping to match. Checked against the gratitudes'
             actual text bounds at 375px: the widest line ("the heavens and the
             earth") clears by ~30px, every other line by more. */
          .corner-moon { top: auto; bottom: 300px; width: 88vw; right: -45vw; }
        }

        @media (max-width: 520px) {
          .title { font-size: clamp(1.7rem, 8.6vw, 2.6rem); }
        }
      `}</style>
    </>
  );
}
