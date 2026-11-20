// ---------------------------------------------------------------------------
// /impressum — the legal notice (§ 5 DDG), in the same three-band shape as
// /book (see that file's own header note): header, a short run of text, footer.
//
// The header markup and its styles are copied, not shared, exactly as /book
// copied /gallery's: change one, change all of them.
//
// Structure and styles here, WORDS in lib/content.js (three languages) — and
// so are the names and the address, as IMPRESSUM.
// ---------------------------------------------------------------------------
import Head from "next/head";
import Image from "next/image";
import LanguageSelector from "../components/LanguageSelector";
import NavRail from "../components/NavRail";
import Newsletter from "../components/Newsletter";
import SiteFooter from "../components/SiteFooter";
import ThemeToggle from "../components/ThemeToggle";
import { IMPRESSUM } from "../lib/content";
import { useLanguage } from "../lib/useLanguage";

// same fixed phase the home page uses — see TODO.md item 12

// The title, set letter by letter on a straight line: each letter keeps only
// its own small hand-set lean (LEAN, one entry per letter), the same at every
// width. It used to sit on an arc — a frown on desktop, a smile on mobile — and
// no longer does. Kept identical across /store, /about, /gallery and /book.
const TITLE = "SABALOULAND";
const LEAN = [-4, 2, -1.5, 3.5, -2.5, 4, -3, 0, 2.5, -1.5, 3];

export default function Impressum() {
  const { t } = useLanguage();
  const b = t.impressum;

  return (
    <>
      <Head>
        <title>{`${b.title} — Sabalouland`}</title>
        <meta
          name="description"
          content="Legal notice for Sabalouland, the website of Saba Lou Khan."
        />
        <meta property="og:title" content={`${b.title} — Sabalouland`} />
        <meta property="og:type" content="website" />
      </Head>

      <main className="page grain">
        <div className="sheet">
          {/* ============ header ==================================== */}
          <section className="head">
            {/* Four independent grid items — lang / crest / mode / rail —
                placed via grid-template-areas below, same shape /gallery
                uses. See the .top rule for actual layout. */}
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

                <p className="sub">{b.title}</p>
              </header>

              <div className="mode">
                <ThemeToggle />
              </div>

              <div className="rail">
                <NavRail />
              </div>
            </div>
          </section>

          <hr className="rule" />

          {/* ============ the notice ================================= */}
          <section className="book-wrap" aria-labelledby="impressum-heading">
            <h2 id="impressum-heading" className="lead">
              {b.heading}
            </h2>

            {/* Two description lists: the artist and who represents her, then
                the company behind that, with its address. */}
            <dl className="contacts">
              <div className="row">
                <dt>{b.artist}</dt>
                <dd>{IMPRESSUM.artist}</dd>
              </div>
              <div className="row">
                <dt>{b.representedBy}</dt>
                <dd>{IMPRESSUM.agency}</dd>
              </div>
            </dl>

            <dl className="contacts second">
              <div className="row">
                <dt>{b.company}</dt>
                <dd>{IMPRESSUM.company}</dd>
              </div>
              <div className="row">
                <dt>{b.representedBy}</dt>
                <dd>{IMPRESSUM.representative}</dd>
              </div>
              <div className="row">
                <dt>{b.address}</dt>
                <dd>
                  {IMPRESSUM.street}
                  <br />
                  {IMPRESSUM.city}
                </dd>
              </div>
              <div className="row">
                <dt>{b.contact}</dt>
                <dd>
                  <a
                    href={`mailto:${IMPRESSUM.email}`}
                    data-track-type="other"
                    data-track-label="impressum-email"
                    data-track-category="contact"
                  >
                    {IMPRESSUM.email}
                  </a>
                </dd>
              </div>
            </dl>

            <dl className="contacts second">
              <div className="row">
                <dt>{b.register}</dt>
                <dd>{IMPRESSUM.registerCourt}</dd>
              </div>
              <div className="row">
                <dt>{b.registerNo}</dt>
                <dd>{IMPRESSUM.registerNumber}</dd>
              </div>
              <div className="row">
                <dt>{b.taxNumber}</dt>
                <dd>{IMPRESSUM.taxNumber}</dd>
              </div>
            </dl>
          </section>

          <hr className="rule" />

          {/* ============ footer ==================================== */}
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
          padding: clamp(1.1rem, 2.6vw, 2.4rem) clamp(1.1rem, 4vw, 3.2rem)
            clamp(7.5rem, 10vw, 9.5rem);
          /* the breathing room around the two rules — on the bands, not the
             rules, same as /store and /gallery */
          --band-pad: clamp(1.6rem, 3.6vw, 2.8rem);
        }
        .sheet {
          width: min(1240px, 100%);
          margin: 0 auto;
        }

        .rule {
          border: 0;
          border-top: var(--rule) solid var(--ink-faint);
          margin: 0;
        }
        .head { padding-bottom: var(--band-pad); }
        .tail { padding-top: var(--band-pad); }

        /* ============ header ====================================== */
        /* Four named areas rather than nested wrapper divs, so a media query
           can just redraw the map. The map itself is drawn by the two queries
           at the bottom — "wide" from 861px up, "narrow" below it — so this
           base rule is only what they share plus the columns the narrow one
           inherits: two equal flanking columns keeping the auto-sized middle
           one truly centered. */
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
           Desktop: face on the left, the straight title beside it, the page
           name tucked under that title — three independent grid items rather
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
          align-items: start;
          column-gap: clamp(0.9rem, 2.4vw, 1.9rem);
          min-width: 0;
          --title-size: clamp(1.5rem, 4.6vw, 3.6rem);
        }
        .face { grid-area: face; }

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

        /* ============ contacts ==================================== */
        .book-wrap { padding: var(--band-pad) 0; }

        /* the heading, in the same face and size as the newsletter's below */
        .lead {
          font-family: var(--font-title);
          font-weight: 400;
          font-size: clamp(1.5rem, 2.7vw, 2.15rem);
          line-height: 1.1;
          margin: 0 0 1rem;
          color: var(--ink);
        }

        /* A few lines of text, not a grid to fill, so it keeps a narrow
           measure on the left, on the same edge as the language chips above
           and the footer below. */
        .contacts {
          margin: 0;
          max-width: 38rem;
        }
        .row {
          display: grid;
          grid-template-columns: 11rem minmax(0, 1fr);
          align-items: baseline;
          column-gap: 1.2rem;
          padding: 0.7rem 0;
        }
        .row dt {
          color: var(--ink-dim);
          font-size: 0.94em;
        }
        .row dd {
          margin: 0;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        /* the company's block sits a little apart from the artist's */
        .second { margin-top: 1.4rem; }

        /* the address is a mailto: ink with a hairline under it, the hairline
           turning rose on hover. It may be wider than a phone, so it breaks. */
        .row a {
          color: var(--ink);
          border-bottom: var(--rule) solid var(--ink-faint);
          padding-bottom: 1px;
          overflow-wrap: anywhere;
          transition: filter 180ms ease, border-color 180ms ease;
        }
        .row a:hover {
          filter: brightness(1.2);
          border-bottom-color: var(--accent-2);
        }

        /* ============ footer ====================================== */
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
           language chips, crest, nav rail, colour mode — so the header is
           the height of the head rather than of a column of chips hanging
           beneath the mode switch. Nothing at 860px and below reads any of
           this. Same rules as /gallery's wide query. */
        @media (min-width: 861px) {
          /* The crest sits in the 1fr column, so it centres in whatever is
             left between the chips and the nav rail rather than on the page —
             centred on the page it would crowd the nav now that the mode
             switch has moved in beside it. column-gap is also the space
             between the nav rail and the mode switch. */
          .top {
            grid-template-columns: auto 1fr auto auto;
            grid-template-areas: "lang crest rail mode";
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

        /* ============ narrow ======================================
           Below this the title stops sitting beside the face and sits under it
           instead: face, then the title, then the
           page name centered underneath. The crest also moves up into the top
           row, between the language chips and the colour switch (see the map
           below the 860px block — it has to come after it), so every size in
           it is a share of the width those two leave, via cqw units of the
           crest as a size container. See the matching comment in store.js for
           the full reasoning. */
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
          /* phones override this map just below (see the 780px query after
             it) */
          .top {
            grid-template-areas:
              "lang  .     mode"
              "crest crest crest"
              "rail  rail  rail";
            row-gap: 1.2rem;
          }
          .rail { justify-self: stretch; display: flex; justify-content: center; }

          .tail { grid-template-columns: 1fr; gap: 2.6rem; }
          .tail-l { order: 2; }
          .tail-r { order: 1; padding-top: 0; }
        }

        /* Phones: the crest joins the chips in the top row, in the middle
           column, and the nav row follows. After the 860px block on purpose
           — both set grid-template-areas on .top, so the later one wins.
           781-860px keeps that block's map. */
        @media (max-width: 780px) {
          .top {
            grid-template-columns: auto minmax(0, 1fr) auto;
            grid-template-areas:
              "lang crest mode"
              "rail rail  rail";
            column-gap: 0.5rem;
          }
        }

        /* Phones: the label stacks over its address, which then has the whole
           line to itself. */
        @media (max-width: 560px) {
          .row {
            grid-template-columns: minmax(0, 1fr);
            row-gap: 0.15rem;
          }
        }
      `}</style>
    </>
  );
}
