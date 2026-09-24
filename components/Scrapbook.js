// (about) the scrapbook on /about: pictures pasted down among a few lines of
// text, in the order they read — hello, a clipping, cloth, paint, a sign-off.
// (sketch) scrapbook, but every picture at right angles: unlike the store's
// polaroid cards these have square corners, are never tilted and carry no
// frame or mat of their own. Where a scan came with an edge of its own — a dark
// film border, black bars, the table under the paper — <Cropped> trims it off
// rather than leave it to read as a frame. The hand-made look is in the
// arrangement instead (staggered, overlapping, mirrored from one spread to the
// next) and in the paper scrap, the lettering and the captions around them.
//
// Structure and styles here, WORDS in lib/content.js (a = t.about). The
// pictures are the artist's own files already in public/images: the gallery's
// photos and artwork, and the store's fabric close-ups.
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../lib/useLanguage";

// The fabric close-ups the store paints behind its shelves, laid out here as
// swatches. Where each one sits is in the .s1-.s4 rules below.
const SWATCHES = [
  { cls: "s1", src: "/images/store/music-bg.jpg" },
  { cls: "s2", src: "/images/store/merch-bg.jpg" },
  { cls: "s3", src: "/images/store/everything-bg.jpg" },
  { cls: "s4", src: "/images/store/prints-bg.jpg" },
];

// A picture shown through a window into its file, for the scans that carry an
// edge of their own. `crop` is the part to keep — { x, y, w, h } in the file's
// own pixels; the window takes that rectangle's proportions and the whole file
// is scaled and shifted behind it, so nothing is resampled or re-saved.
// The window's own styles are inline: this is a separate component from the
// one that owns the <style jsx> block, so a scoped class wouldn't reach it.
function Cropped({ src, width, height, crop, alt, sizes }) {
  return (
    <span
      style={{
        position: "relative",
        display: "block",
        overflow: "hidden",
        aspectRatio: `${crop.w} / ${crop.h}`,
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        style={{
          position: "absolute",
          width: `${(width / crop.w) * 100}%`,
          height: "auto",
          left: `${(-crop.x / crop.w) * 100}%`,
          top: `${(-crop.y / crop.h) * 100}%`,
        }}
      />
    </span>
  );
}

export default function Scrapbook() {
  const { t } = useLanguage();
  const a = t.about;

  return (
    <div className="book">
      {/* ============ hello ============================================ */}
      <section className="spread hello" aria-labelledby="about-hello">
        {/* display: contents below 861px, so the pictures can be placed on
            the spread's own grid there. Above it they're a grid of their own,
            so however tall the words beside them run, the portrait stays
            hung on the photo's corner. */}
        <div className="pics">
          <div className="shop">
            <Image
              src="/images/gallery/Saba Lou Website Profile.JPG"
              alt={a.alt.shop}
              width={6192}
              height={4128}
              sizes="(max-width: 860px) 92vw, 620px"
              priority
            />
          </div>

          {/* The portrait overlaps the photo's lower corner. The scan's dark
              film border is cropped away. */}
          <div className="booth">
            <Cropped
              src="/images/gallery/Saba Lou Profile Picture.jpg"
              width={881}
              height={1024}
              crop={{ x: 48, y: 52, w: 785, h: 930 }}
              alt={a.alt.portrait}
              sizes="(max-width: 860px) 46vw, 340px"
            />
          </div>
        </div>

        {/* display: contents below 861px too, so the heading, the paragraphs
            and the scrap can each be placed on the grid there */}
        <div className="words">
          <h2 id="about-hello" className="hd">{a.hello.heading}</h2>
          <div className="txt">
            {a.hello.bio.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* pasted down under the words, its edge over the portrait's */}
          <aside className="clip">
            <p className="kicker">{a.clipping.kicker}</p>
            <p className="song">{a.clipping.song}</p>
            <p className="what">{a.clipping.body}</p>
          </aside>
        </div>
      </section>

      {/* ============ cloth ============================================ */}
      <section className="spread cloth" aria-labelledby="about-cloth">
        <div className="words">
          <h2 id="about-cloth" className="hd">{a.cloth.heading}</h2>
          <p>{a.cloth.body}</p>
          <Link
            href="/store"
            className="more"
            data-track-type="merch"
            data-track-label="about-store"
            data-track-category="merch"
          >
            {a.cloth.link}
          </Link>
        </div>

        <div className="swatches" aria-hidden="true">
          {SWATCHES.map((s) => (
            <span key={s.cls} className={`sw ${s.cls}`}>
              <Image
                src={s.src}
                alt=""
                fill
                sizes="(max-width: 860px) 45vw, 260px"
                style={{ objectFit: "cover" }}
              />
            </span>
          ))}
        </div>
      </section>

      {/* ============ paint ============================================ */}
      <section className="spread paint" aria-labelledby="about-paint">
        <div className="works">
          <div className="col">
            <figure className="work w-shocked">
              <Cropped
                src="/images/gallery/paintings/Saba Lou Painting 3 - Shocked.PNG"
                width={1536}
                height={2048}
                crop={{ x: 190, y: 26, w: 1156, h: 2022 }}
                alt={a.alt.shocked}
                sizes="(max-width: 860px) 40vw, 300px"
              />
              <figcaption>{a.works.shocked}</figcaption>
            </figure>
            <figure className="work w-room">
              <Image
                src="/images/gallery/other/Saba Lou Room Mixed Media.JPG"
                alt={a.alt.room}
                width={2381}
                height={2379}
                sizes="(max-width: 860px) 32vw, 240px"
              />
              <figcaption>{a.works.room}</figcaption>
            </figure>
          </div>

          <div className="col">
            <figure className="work w-sunset">
              <Image
                src="/images/gallery/other/Saba Lou Sunset Oils.jpeg"
                alt={a.alt.sunset}
                width={1695}
                height={1536}
                sizes="(max-width: 860px) 46vw, 340px"
              />
              <figcaption>{a.works.sunset}</figcaption>
            </figure>
            <figure className="work w-guitar">
              <Cropped
                src="/images/gallery/other/Saba Lou Guitarists Dream Ink on Paper.JPG"
                width={3264}
                height={2448}
                crop={{ x: 310, y: 30, w: 2644, h: 2370 }}
                alt={a.alt.guitar}
                sizes="(max-width: 860px) 38vw, 300px"
              />
              <figcaption>{a.works.guitar}</figcaption>
            </figure>
          </div>
        </div>

        <div className="words">
          <h2 id="about-paint" className="hd">{a.paint.heading}</h2>
          <p>{a.paint.body}</p>
          <Link
            href="/gallery"
            className="more"
            data-track-type="other"
            data-track-label="about-gallery"
            data-track-category="nav"
          >
            {a.paint.link}
          </Link>
        </div>
      </section>

      <p className="sign">{a.signoff}</p>

      <style jsx>{`
        .book {
          /* the page's own band padding, same as Gallery.js, so the header,
             this and the footer stay evenly spaced */
          --pad: var(--band-pad, clamp(1.6rem, 3.6vw, 2.8rem));
          --gap: clamp(1rem, 2.4vw, 1.8rem);
          /* the empty stretch between one spread and the next */
          --spread: clamp(3.5rem, 8vw, 6.5rem);
          display: flex;
          flex-direction: column;
          gap: var(--spread);
          padding-block: var(--pad);
        }

        .spread {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          column-gap: var(--gap);
        }

        /* ---- the pictures: right angles, no frame ----
           Nothing here rounds a corner, tilts a picture or draws a border
           around one. Next/Image renders its own <img>, outside styled-jsx's
           scoping, hence :global. */
        .shop :global(img),
        .work :global(img) {
          display: block;
          width: 100%;
          height: auto;
        }
        .sw {
          position: relative;
          display: block;
        }

        .work { margin: 0; }
        .work figcaption {
          margin-top: 0.45rem;
          font-size: 0.82em;
          line-height: 1.3;
          color: var(--ink-faint);
        }

        /* ---- the words ---- */
        .words { min-width: 0; }
        /* the headings: the title face, level, no underline */
        .hd {
          position: relative;
          width: fit-content;
          margin: 0 0 1.05rem;
          font-family: var(--font-title);
          font-weight: 400;
          font-size: clamp(1.9rem, 3.4vw, 2.9rem);
          line-height: 1.05;
          letter-spacing: 0.015em;
          color: var(--ink);
        }
        /* only the words' own paragraphs — the scrap sits inside .words too,
           and keeps the chips' brown ink on its pale blue in both themes */
        .words > p,
        .txt p {
          margin: 0 0 0.75rem;
          font-size: 1.02em;
          line-height: 1.5;
          color: var(--ink);
        }
        .txt { max-width: 34rem; }
        .txt p:last-child { margin-bottom: 0; }
        /* :global — Link renders its own <a>, outside styled-jsx's scoping
           (same reason Storefront.js reaches its .cta-link the same way) */
        .words :global(.more) {
          display: inline-block;
          margin-top: 0.25rem;
          color: var(--ink);
          font-size: 0.94em;
          border-bottom: var(--rule) solid var(--ink-faint);
          padding-bottom: 1px;
          transition: filter 180ms ease, border-color 180ms ease;
        }
        .words :global(.more:hover) {
          filter: brightness(1.2);
          border-bottom-color: var(--accent-2);
        }

        /* ---- (clipping) a scrap of paper, in the colours of the chip panels:
           the same pale blue and brown line as the language and nav chips ---- */
        .clip {
          position: relative;
          padding: 1rem 1.25rem 1.1rem;
          background: var(--chip);
          border: var(--rule) solid var(--chip-line);
          color: var(--chip-ink);
        }
        .clip p { margin: 0; }
        .clip .kicker {
          font-size: 0.8em;
          letter-spacing: 0.12em;
          opacity: 0.75;
        }
        .clip .song {
          margin: 0.3rem 0 0.35rem;
          font-family: var(--font-title);
          font-size: clamp(1.3rem, 2.2vw, 1.8rem);
          line-height: 1.1;
        }
        .clip .what {
          font-size: 0.94em;
          line-height: 1.4;
        }

        /* ---- paint: two columns of works, the second hung lower, each work
           offset against the one above it ---- */
        .works {
          display: flex;
          gap: var(--gap);
          align-items: flex-start;
        }
        .col {
          flex: 1 1 0;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: var(--gap);
        }
        .col + .col { margin-top: clamp(2.4rem, 7vw, 6rem); }
        .w-shocked { width: 88%; }
        .w-room { width: 64%; align-self: flex-end; }
        .w-sunset { width: 100%; }
        .w-guitar { width: 78%; align-self: flex-end; }

        .sign {
          align-self: flex-end;
          margin: 0 clamp(0rem, 6vw, 5rem) 0 0;
          font-family: var(--font-title);
          font-size: clamp(1.6rem, 3.2vw, 2.5rem);
          line-height: 1;
          color: var(--ink);
        }

        /* ============ wide ========================================
           Desktop, 861px and up: twelve columns. The pictures take the first
           seven, as a grid of their own with the same column widths: the shop
           photo the first six, the portrait hung over its lower right corner,
           half on the photo and half in the gap, pulled up out of its own row
           by --overlap. The words sit in the last five, with the paper scrap
           pasted under them, its edge over the portrait's. Cloth and paint
           then mirror each other, words left then words right. */
        @media (min-width: 861px) {
          .hello { --overlap: clamp(5rem, 14vw, 11rem); }
          .pics {
            grid-column: 1 / span 7;
            grid-row: 1;
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            column-gap: var(--gap);
            align-items: start;
          }
          .shop { grid-column: 1 / span 6; grid-row: 1; }
          .booth {
            position: relative;
            grid-column: 5 / span 3;
            grid-row: 2;
            margin-top: calc(var(--overlap) * -1);
          }
          .hello .words {
            grid-column: 8 / span 5;
            grid-row: 1;
            align-self: start;
            padding-top: clamp(0.5rem, 2vw, 1.6rem);
          }
          .clip {
            max-width: 27rem;
            margin: 1.9rem 0 0 -2.2rem;
          }

          .cloth .words { grid-column: 1 / span 4; align-self: center; }
          /* The swatches are a poster: a box of fixed proportions with each
             one placed as a share of it, so the whole cluster scales as one.
             left and width are shares of its width, top of its height. They
             are texture only, so nothing in it has to keep a size of its own. */
          .swatches {
            position: relative;
            grid-column: 6 / span 7;
            aspect-ratio: 100 / 46;
          }
          .swatches .sw { position: absolute; }
          .s1 { left: 0; top: 24%; width: 24%; aspect-ratio: 3 / 4; }
          .s2 { left: 21%; top: 0; width: 31%; aspect-ratio: 4 / 3; }
          .s3 { left: 48%; top: 34%; width: 26%; aspect-ratio: 1; }
          .s4 { left: 66%; top: 0; width: 34%; aspect-ratio: 3 / 2; }

          .paint .works { grid-column: 1 / span 7; grid-row: 1; }
          /* hung from the same line the second column of works is, so the
             heading sits level with the sunset instead of floating */
          .paint .words {
            grid-column: 9 / span 4;
            grid-row: 1;
            align-self: start;
            margin-top: clamp(2.4rem, 7vw, 6rem);
          }
        }

        /* ============ narrow ======================================
           860px and below: one column of six, held to a readable width on a
           tablet. The portrait still hangs over the photo; the heading sits
           below it, right over the paragraphs, and the scrap follows. */
        @media (max-width: 860px) {
          .book {
            width: min(100%, 40rem);
            margin-inline: auto;
          }
          .spread { grid-template-columns: repeat(6, minmax(0, 1fr)); }

          .hello { --overlap: clamp(4rem, 16vw, 7rem); }
          .pics { display: contents; }
          .shop { grid-column: 1 / -1; grid-row: 1; }
          .booth {
            position: relative;
            grid-column: 4 / -1;
            grid-row: 2;
            margin-top: calc(var(--overlap) * -1);
          }
          .hello .words { display: contents; }
          .hello .hd {
            grid-column: 1 / -1;
            grid-row: 3;
            margin-top: 1.6rem;
          }
          .hello .txt {
            grid-column: 1 / -1;
            grid-row: 4;
          }
          .clip {
            grid-column: 1 / -1;
            grid-row: 5;
            margin-top: 2.2rem;
          }

          .cloth .words,
          .paint .words {
            grid-column: 1 / -1;
            grid-row: 1;
          }
          .swatches {
            position: relative;
            grid-column: 1 / -1;
            grid-row: 2;
            margin-top: 1.8rem;
            aspect-ratio: 100 / 66;
          }
          .swatches .sw { position: absolute; }
          .s1 { left: 0; top: 14%; width: 38%; aspect-ratio: 3 / 4; }
          .s2 { left: 32%; top: 0; width: 44%; aspect-ratio: 4 / 3; }
          .s3 { left: 52%; top: 42%; width: 32%; aspect-ratio: 1; }
          .s4 { left: 64%; top: 14%; width: 36%; aspect-ratio: 3 / 2; }
          .paint .works { grid-column: 1 / -1; grid-row: 2; margin-top: 1.8rem; }
        }
      `}</style>
    </div>
  );
}
