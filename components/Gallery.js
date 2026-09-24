// (gallery) the tab row and grid on /gallery. "artwork" and "fotos" are
// populated from public/images/gallery (read at build time in
// pages/gallery.js) — fotos from the folder itself, artwork from its
// paintings/ and other/ subfolders; "videos" comes from lib/content.js's
// GALLERY_VIDEOS, resolved to a real title and thumbnail via YouTube oEmbed,
// also at build time. A tab with nothing in it shows an empty state.
// Pictures are never cropped. Every one gets the same square cell, so the grid
// stays square whatever is in it, and sits in the middle of that cell inside a
// frame drawn at its own aspect ratio (worked out per file in
// pages/gallery.js) — the rest of the cell is left empty.
// (sketch) sharp corners on the frames — unlike the store's rounded polaroid
// cards, deliberately.
import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "../lib/useLanguage";

// left to right — the first is the tab that's open on load
const TABS = ["artwork", "videos", "fotos"];

export default function Gallery({ photos, videos, artwork }) {
  const { t } = useLanguage();
  const g = t.gallery;
  const [tab, setTab] = useState(TABS[0]);
  // fotos and artwork are the same grid of pictures, just different lists
  const images = { fotos: photos, artwork }[tab];

  return (
    <div className="gallery">
      <nav className="tabs" aria-label={g.tabsLabel}>
        {TABS.map((key) => {
          const on = tab === key;
          return (
            <button
              key={key}
              type="button"
              className={`tab${on ? " on" : ""}`}
              aria-current={on ? "true" : undefined}
              onClick={() => setTab(key)}
            >
              {g.tabs[key]}
            </button>
          );
        })}
      </nav>

      {images && (
        images.length > 0 ? (
          <ul className="grid">
            {images.map((image) => (
              <li key={image.src} className="frame">
                <span className="slot">
                  <span className="window" style={{ "--ratio": image.ratio }}>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 420px) 100vw, (max-width: 680px) 50vw, (max-width: 960px) 33vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                  </span>
                </span>
                <p className="caption">{image.alt}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="state">{g.empty}</p>
        )
      )}

      {tab === "videos" && (
        videos.length > 0 ? (
          <ul className="grid">
            {videos.map((video) => (
              <li key={video.id} className="frame">
                <a
                  className="window video"
                  href={video.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={video.thumb} alt="" loading="lazy" decoding="async" />
                  <span className="play" aria-hidden="true" />
                </a>
                <p className="caption">{video.title}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="state">{g.empty}</p>
        )
      )}

      <style jsx>{`
        .gallery {
          /* same padding-under-a-rule idea Storefront.js uses, reading the
             page's own --band-pad so header/gallery/footer stay evenly spaced */
          --pad: var(--band-pad, clamp(1.6rem, 3.6vw, 2.8rem));
          padding-block: var(--pad);
        }

        /* ---- the tabs ---- */
        .tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border: var(--rule) solid var(--ink-faint);
          margin: 0 0 clamp(1.4rem, 3vw, 2.2rem);
        }
        .tab {
          position: relative;
          background: none;
          border: 0;
          padding: 0.6rem 0.5rem;
          color: var(--ink-dim);
          font-family: var(--font-title);
          font-size: 1.05em;
          text-align: center;
          cursor: pointer;
          transition: color 180ms ease;
        }
        .tab + .tab { border-left: var(--rule) solid var(--ink-faint); }
        .tab:hover { color: var(--ink); }
        .tab.on { color: var(--ink); }
        /* the same underline the language selector marks its choice with */
        .tab.on::after {
          content: "";
          position: absolute;
          left: 0.6rem;
          right: 0.6rem;
          bottom: 0.3rem;
          height: 2px;
          background: var(--accent-2);
        }

        /* ---- the grid ---- */
        .grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: clamp(1rem, 2.4vw, 1.8rem);
        }

        .frame { display: flex; flex-direction: column; }

        /* the square cell every picture sits in, unframed — what is left of
           it around the picture is the negative space that keeps the grid
           square */
        .slot {
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
        }

        .window {
          position: relative;
          display: block;
          overflow: hidden;
          background: var(--chip);
          border: var(--rule) solid var(--ink-faint);
          /* (sketch) sharp corners */
          border-radius: 0;
        }
        /* A picture's frame is its own outline: the full width of the cell if
           it is wider than tall or square, and if it is taller, the full height
           of the cell, which is a narrower width. The ratio is width / height,
           so min(1, ratio) is the share of the cell's width to take, and
           aspect-ratio works out the height from that. */
        .slot .window {
          aspect-ratio: var(--ratio);
          width: calc(min(1, var(--ratio)) * 100%);
        }
        /* i.ytimg.com's own thumbnail files are 480x360 (4:3) — YouTube
           pads a 16:9 frame out to that with black letterboxing baked into
           the file. Cropping the container to 16:9 (object-fit: cover, set
           on .window img below) crops out exactly that padding instead of
           showing it. */
        .window.video { aspect-ratio: 16 / 9; }
        /* the video thumbnail — Next/Image handles this itself for photos,
           via the fill+objectFit style prop, but a video's thumbnail is a
           plain external <img>, same reasoning Storefront.js has for its
           own remote product photos */
        .window img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* the same cream-on-ink stamp language Storefront.js's "sold out"
           badge uses, just round instead of a rectangle */
        .play {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background: rgba(250, 246, 238, 0.88);
          border: var(--rule) solid var(--chip-line);
          transition: transform 180ms ease;
        }
        .play::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-42%, -50%);
          border-style: solid;
          border-width: 0.5rem 0 0.5rem 0.8rem;
          border-color: transparent transparent transparent var(--chip-line);
        }
        .window:hover .play { transform: translate(-50%, -50%) scale(1.08); }

        .caption {
          margin: 0.5rem 0 0;
          font-size: 0.82em;
          color: var(--ink-faint);
          text-align: center;
        }

        .state {
          margin: 0;
          padding: 3rem 0;
          color: var(--ink-faint);
          font-size: 1.02em;
          text-align: center;
        }

        @media (max-width: 960px) {
          .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 680px) {
          .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 420px) {
          .grid { grid-template-columns: 1fr; }
          .tab { font-size: 0.92em; padding: 0.5rem 0.3rem; }
        }
      `}</style>
    </div>
  );
}
