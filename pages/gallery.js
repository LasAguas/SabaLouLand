// ---------------------------------------------------------------------------
// /gallery — same three-band shape as /store (see that file's own header
// note), minus the (banner) row: there's no gallery artwork commissioned yet,
// so the welcome line the store prints just above its rule has no equivalent
// here.
//
//   header   desktop: one top-aligned band — language chips on the left, the
//            head+titles centered in the space between them and the nav rail
//            + colour mode on the right. Same grid areas as /store, one row
//            shorter without the banner. mobile: language chips and colour
//            mode flank the head+titles in one top row, then the nav row
//   ─────────
//   gallery  the artwork/videos/fotos tabs, the grid under them
//   ─────────
//   footer   the mailing-list signup and the home page's own footer
//
// Structure and styles here, WORDS in lib/content.js (three languages),
// behaviour in components/Gallery.js. The fotos and artwork lists themselves
// are read off disk at build time below — drop a file into
// public/images/gallery (fotos) or its paintings/ or other/ subfolder
// (artwork) and it shows up here, nothing else to wire.
// ---------------------------------------------------------------------------
import fs from "fs";
import path from "path";
import sharp from "sharp";
import Head from "next/head";
import Image from "next/image";
import Gallery from "../components/Gallery";
import LanguageSelector from "../components/LanguageSelector";
import NavRail from "../components/NavRail";
import Newsletter from "../components/Newsletter";
import SiteFooter from "../components/SiteFooter";
import ThemeToggle from "../components/ThemeToggle";
import { GALLERY_VIDEOS } from "../lib/content";
import { useLanguage } from "../lib/useLanguage";

// same fixed phase the home page uses — see TODO.md item 12

// The title, set letter by letter on a straight line: each letter keeps only
// its own small hand-set lean (LEAN, one entry per letter), the same at every
// width. It used to sit on an arc — a frown on desktop, a smile on mobile — and
// no longer does. Kept identical across /store, /about, /gallery and /book.
const TITLE = "SABALOULAND";
const LEAN = [-4, 2, -1.5, 3.5, -2.5, 4, -3, 0, 2.5, -1.5, 3];

const GALLERY_DIR = path.join(process.cwd(), "public/images/gallery");
const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i;

// The artwork tab is these subfolders of GALLERY_DIR, in this order: the
// paintings first, then the drawings, watercolours and the rest under "other".
const ARTWORK_DIRS = ["paintings", "other"];

// A picture's width / height as it is meant to be SEEN, so Gallery.js can frame
// it in its own shape instead of cropping it to a square. sharp (already here:
// it's what next/image runs on) reports the pixels as stored, and a photo saved
// sideways with an EXIF "rotate me" flag (orientation 5-8) is stood upright by
// both the browser and Next's image optimizer, so its two sides swap. A file
// sharp can't read comes back as a square — the grid's own shape — rather than
// failing the whole build.
async function readRatio(file) {
  try {
    const { width, height, orientation = 1 } = await sharp(file).metadata();
    return orientation >= 5 ? height / width : width / height;
  } catch {
    return 1;
  }
}

// The images directly inside GALLERY_DIR (or one of its subfolders) as
// { src, alt, ratio } — alt doubles as the caption, so it's the file name minus
// its extension. Sorted on that, numerically, so "… Paper" comes before
// "… Paper 2" rather than after "… Paper 4", and "… 9" before "… 10".
async function readImages(subdir = "") {
  const dir = path.join(GALLERY_DIR, subdir);
  const images = await Promise.all(
    fs
      .readdirSync(dir)
      .filter((name) => IMAGE_RE.test(name))
      .map(async (name) => ({
        src: path.posix.join("/images/gallery", subdir, name),
        alt: name.replace(IMAGE_RE, ""),
        ratio: await readRatio(path.join(dir, name)),
      }))
  );
  return images.sort((a, b) =>
    a.alt.localeCompare(b.alt, undefined, { numeric: true })
  );
}

// oEmbed needs no API key and returns a title + thumbnail for any public
// video — a real caption instead of a guessed one. Network calls at build
// time can fail, unlike the local fs read above, so this falls back to the
// video's own id and YouTube's static thumbnail rather than breaking the
// build.
async function resolveVideo(video) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(video.href)}&format=json`
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return { ...video, title: data.title, thumb: data.thumbnail_url };
  } catch {
    return {
      ...video,
      title: video.id,
      thumb: `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
    };
  }
}

export async function getStaticProps() {
  const photos = await readImages();
  const artwork = (
    await Promise.all(ARTWORK_DIRS.map((dir) => readImages(dir)))
  ).flat();

  const videos = await Promise.all(GALLERY_VIDEOS.map(resolveVideo));

  return { props: { photos, videos, artwork } };
}

export default function GalleryPage({ photos, videos, artwork }) {
  const { t } = useLanguage();
  const g = t.gallery;

  return (
    <>
      <Head>
        <title>{`${g.title} — Sabalouland`}</title>
        <meta
          name="description"
          content="The Sabalouland gallery — photos, videos and art from Saba Lou."
        />
        <meta property="og:title" content={`${g.title} — Sabalouland`} />
        <meta property="og:type" content="website" />
      </Head>

      <main className="page grain">
        <div className="sheet">
          {/* ============ header ==================================== */}
          <section className="head">
            {/* Four independent grid items — lang / crest / mode / rail —
                placed via grid-template-areas below, same shape /store uses
                minus the welcome row. See the .top rule for actual layout. */}
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

                <p className="sub">{g.title}</p>
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

          {/* ============ the gallery ================================ */}
          <section className="gallery-wrap" aria-label={g.title}>
            <Gallery photos={photos} videos={videos} artwork={artwork} />
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
          /* read by Gallery.js too, same as Storefront.js does on /store */
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
           Desktop: face on the left, the straight title beside it, "gallery"
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
           this. Same rules as /store's wide query, minus its welcome row. */
        @media (min-width: 861px) {
          /* The crest sits in the 1fr column, so it centres in whatever is
             left between the chips and the nav rather than on the page —
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
           instead: face, then the title, then
           "gallery" centered underneath. The crest also moves up into the top
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
      `}</style>
    </>
  );
}
