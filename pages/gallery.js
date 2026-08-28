// ---------------------------------------------------------------------------
// /gallery — same three-band shape as /store (see that file's own header
// note), minus the (banner) row: there's no gallery artwork commissioned yet,
// so the welcome line the store prints just above its rule has no equivalent
// here.
//
//   header   language chips top-left, colour mode top-right, the head+titles
//            centered as their own group — same grid areas as /store, one
//            row shorter without the banner
//   ─────────
//   gallery  the fotos/videos/art work tabs, the grid under them
//   ─────────
//   footer   the mailing-list signup and the home page's own footer
//
// Structure and styles here, WORDS in lib/content.js (three languages),
// behaviour in components/Gallery.js. The photo list itself is read off disk
// at build time below — drop a file into public/images/gallery and it shows
// up here, nothing else to wire.
// ---------------------------------------------------------------------------
import fs from "fs";
import path from "path";
import Head from "next/head";
import Image from "next/image";
import Gallery from "../components/Gallery";
import LanguageSelector from "../components/LanguageSelector";
import Moon from "../components/Moon";
import NavRail from "../components/NavRail";
import Newsletter from "../components/Newsletter";
import SiteFooter from "../components/SiteFooter";
import ThemeToggle from "../components/ThemeToggle";
import { GALLERY_VIDEOS } from "../lib/content";
import { useLanguage } from "../lib/useLanguage";

// same fixed phase the home page uses — see TODO.md item 12
const MOON_PHASE = 0.62;

// The title, set letter by letter — identical arrangement to /store. Copied
// rather than shared for the same reason store.js copied it from the home
// page: it stays on the line here rather than arcing round the hero circle,
// so only the hand-drawn jitter carries over.
const TITLE = "SABA LOU LAND";
const LEAN = [-4, 2, -1.5, 3.5, 0, -2.5, 4, -3, 1, 0, 2.5, -1.5, 3];
const RISE = [2, -3, 1, 4, 0, -1, 3, -2, 2, 0, -3, 1.5, -2];

const GALLERY_DIR = path.join(process.cwd(), "public/images/gallery");
const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i;

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
  const photos = fs
    .readdirSync(GALLERY_DIR)
    .filter((name) => IMAGE_RE.test(name))
    .sort()
    .map((name) => ({
      src: `/images/gallery/${name}`,
      alt: name.replace(IMAGE_RE, ""),
    }));

  const videos = await Promise.all(GALLERY_VIDEOS.map(resolveVideo));

  return { props: { photos, videos } };
}

export default function GalleryPage({ photos, videos }) {
  const { t } = useLanguage();
  const g = t.gallery;

  return (
    <>
      <Head>
        <title>{`${g.title} — Saba Lou Land`}</title>
        <meta
          name="description"
          content="The Saba Lou Land gallery — photos, videos and art from Saba Lou."
        />
        <meta property="og:title" content={`${g.title} — Saba Lou Land`} />
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
                  <p className="sub">{g.title}</p>
                </div>
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
            <Gallery photos={photos} videos={videos} />
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

        {/* the moon keeps watch from the bottom-left corner, as on the other
            pages */}
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
        /* Four named areas rather than nested wrapper divs, so the narrow
           breakpoint can just redraw the map. Two equal flanking columns
           keep the auto-sized middle one — the crest — truly centered. */
        .top {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          grid-template-areas:
            "lang  crest mode"
            ".     crest rail";
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
          align-items: flex-start;
          gap: clamp(0.9rem, 2.4vw, 1.9rem);
          min-width: 0;
        }

        .face :global(img) {
          display: block;
          width: clamp(156px, 22vw, 276px);
          height: auto;
        }

        /* One size for both title lines, so "gallery" can't drift away from
           "SABA LOU LAND". */
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
        @media (max-width: 780px) {
          .crest { flex-wrap: wrap; justify-content: center; row-gap: 0.7rem; }
        }

        @media (max-width: 860px) {
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

        @media (max-width: 520px) {
          .crest { gap: 0.8rem; }
          .titles { --title-size: clamp(1.3rem, 7.4vw, 2rem); }
        }
      `}</style>
    </>
  );
}
