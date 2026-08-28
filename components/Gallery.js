// (gallery) the tab row and grid on /gallery. "fotos" is populated from
// public/images/gallery (read at build time in pages/gallery.js); "videos"
// comes from lib/content.js's GALLERY_VIDEOS, resolved to a real title and
// thumbnail via YouTube oEmbed, also at build time. "art work" has no
// content yet, so it shows the same empty state the other two fall back to
// when they're empty. (sketch) sharp corners on the frames — unlike the
// store's rounded polaroid cards, deliberately.
import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "../lib/useLanguage";

const TABS = ["fotos", "videos", "artwork"];

export default function Gallery({ photos, videos }) {
  const { t } = useLanguage();
  const g = t.gallery;
  const [tab, setTab] = useState("fotos");

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

      {tab === "fotos" && (
        photos.length > 0 ? (
          <ul className="grid">
            {photos.map((photo) => (
              <li key={photo.src} className="frame">
                <span className="window">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 420px) 100vw, (max-width: 680px) 50vw, (max-width: 960px) 33vw, 25vw"
                    style={{ objectFit: "cover" }}
                  />
                </span>
                <p className="caption">{photo.alt}</p>
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

      {tab === "artwork" && <p className="state">{g.empty}</p>}

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

        .window {
          position: relative;
          display: block;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--chip);
          border: var(--rule) solid var(--ink-faint);
          /* (sketch) sharp corners */
          border-radius: 0;
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
