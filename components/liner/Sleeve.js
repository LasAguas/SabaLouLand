// ---------------------------------------------------------------------------
// Design 1 — "Sleeve". The quiet one: the page is the lyrics and nothing else.
//
//   top      a slim bar — burger on the left, the song's name in the middle.
//            That's the whole header; the track list lives behind the burger,
//            in a drawer that slides in from the left.
//   lyrics   one column that follows the song, the current line full-strength
//            and the ones around it fading with distance. Top and bottom melt
//            into the page instead of ending on a hard edge.
//   scroll   no scrollbar. A hairline thumb fades in only while you're
//            scrolling by hand, then goes away again.
//   notes    a card docked at the bottom of the lyrics shows the current line's
//            liner note and slides away when the line has none. It overlays the
//            list (never resizes it), so nothing jumps when it comes and goes.
//   deck     a hairline scrubber, the clock, prev / play / next.
//
// Colours are the site's own tokens, so it follows the light/dark switch.
// ---------------------------------------------------------------------------
import { useRef, useState } from "react";
import { formatTime, useMenu } from "../../lib/useLinerPlayer";
import { Bars, BurgerIcon, ChevronIcon, CloseIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon } from "./icons";

export default function Sleeve({ player, albumTitle }) {
  const menu = useMenu();
  const { songs, song, songIndex, groups, activeIndex, activeGroup, playing, currentTime, duration, progress } = player;
  const [dockOpen, setDockOpen] = useState(true);
  const thumbRef = useRef(null);
  const thumbTimer = useRef(null);

  const note = activeGroup?.note ?? null;
  const browsing = !player.autoFollow;

  // The hairline scroll thumb. Sized and placed straight on the DOM node from
  // the scroll handler — no state, so scrolling never re-renders the list.
  function syncThumb(list) {
    const thumb = thumbRef.current;
    if (!thumb) return;
    const { scrollTop, scrollHeight, clientHeight } = list;
    const room = scrollHeight - clientHeight;
    if (room <= 0) return;
    const h = Math.max(40, (clientHeight * clientHeight) / scrollHeight);
    thumb.style.height = `${h}px`;
    thumb.style.transform = `translateY(${(scrollTop / room) * (clientHeight - h)}px)`;
  }
  function pokeThumb() {
    const thumb = thumbRef.current;
    if (!thumb) return;
    thumb.dataset.show = "1";
    clearTimeout(thumbTimer.current);
    thumbTimer.current = setTimeout(() => {
      delete thumb.dataset.show;
    }, 1100);
  }

  const lp = player.listProps;

  function pickTrack(i) {
    if (i !== songIndex) player.goTo(i);
    menu.close();
  }

  return (
    <div className="sleeve grain">
      <header className="bar">
        <button
          ref={menu.triggerRef}
          type="button"
          className="icon-btn"
          aria-label="tracks"
          aria-expanded={menu.open}
          onClick={menu.toggle}
        >
          <BurgerIcon width={26} height={26} />
        </button>
        <div className="now">
          <span className="kicker">
            {albumTitle} · {songIndex + 1} of {songs.length}
          </span>
          <h1 className="title">{song.title}</h1>
        </div>
        <span className="bar-end" aria-hidden="true" />
      </header>

      <div className="stage">
        <div
          {...lp}
          className="lines"
          data-anchor="0.4"
          data-browse={browsing ? "1" : undefined}
          aria-label={`${song.title} lyrics`}
          onWheel={(e) => {
            lp.onWheel(e);
            pokeThumb();
          }}
          onTouchMove={(e) => {
            lp.onTouchMove(e);
            pokeThumb();
          }}
          onKeyDown={(e) => {
            lp.onKeyDown(e);
            pokeThumb();
          }}
          onScroll={(e) => {
            syncThumb(e.currentTarget);
            if (browsing) pokeThumb();
          }}
        >
          <div className="pad top" aria-hidden="true" />
          {groups.map((g) =>
            g.lines.map(({ line, index }, k) => {
              const d = activeIndex < 0 ? "pre" : Math.min(3, Math.abs(index - activeIndex));
              return (
                <p
                  key={line.id}
                  ref={player.lineRef(index)}
                  className={`line${g.gap && k === 0 ? " gap" : ""}`}
                  data-d={d}
                  onClick={() => player.seekToLine(index)}
                >
                  {line.text}
                  {line.note && <span className="star" aria-hidden="true" />}
                </p>
              );
            })
          )}
          <div className="pad" aria-hidden="true" />
        </div>

        <span className="thumb" ref={thumbRef} aria-hidden="true" />

        {browsing && (
          <button type="button" className="jump" onClick={player.jumpToNow}>
            now playing <ChevronIcon dir="down" width={14} height={14} />
          </button>
        )}

        <aside
          className="dock"
          data-has={note ? "1" : undefined}
          data-open={dockOpen ? "1" : undefined}
          inert={!note}
          aria-live="polite"
        >
          <button type="button" className="dock-head" onClick={() => setDockOpen((o) => !o)} aria-expanded={dockOpen}>
            <span className="dock-label">liner note</span>
            <ChevronIcon dir={dockOpen ? "down" : "up"} width={16} height={16} />
          </button>
          {dockOpen && note && (
            <div className="dock-body" key={activeGroup.key}>
              {note}
            </div>
          )}
        </aside>
      </div>

      <footer className="deck">
        <input
          type="range"
          className="scrub"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => player.scrubTo(Number(e.target.value))}
          style={{ "--p": `${progress * 100}%` }}
          aria-label="seek"
        />
        <div className="times">
          <span>{formatTime(currentTime)}</span>
          <span>{player.error ? "couldn't load the audio" : `−${formatTime(Math.max(0, duration - currentTime))}`}</span>
        </div>
        <div className="controls">
          <button type="button" className="icon-btn" onClick={player.prev} aria-label="previous">
            <PrevIcon width={26} height={26} />
          </button>
          <button type="button" className="play" onClick={player.togglePlay} aria-label={playing ? "pause" : "play"}>
            {playing ? <PauseIcon width={28} height={28} /> : <PlayIcon width={28} height={28} />}
          </button>
          <button type="button" className="icon-btn" onClick={player.next} disabled={!player.hasNext} aria-label="next">
            <NextIcon width={26} height={26} />
          </button>
        </div>
      </footer>

      <div className="scrim" data-open={menu.open ? "1" : undefined} onClick={menu.close} />
      <nav className="drawer" data-open={menu.open ? "1" : undefined} inert={!menu.open} ref={menu.panelRef} aria-label="tracks">
        <div className="drawer-head">
          <span className="drawer-title">{albumTitle}</span>
          <button type="button" className="icon-btn" onClick={menu.close} aria-label="close">
            <CloseIcon width={22} height={22} />
          </button>
        </div>
        <ol className="tracklist">
          {songs.map((s, i) => (
            <li key={s.slug}>
              <button
                type="button"
                className="track"
                aria-current={i === songIndex ? "true" : undefined}
                onClick={() => pickTrack(i)}
              >
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span className="t">{s.title}</span>
                {i === songIndex && <Bars playing={playing} />}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <style jsx>{`
        .sleeve {
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--deep);
          color: var(--ink);
          isolation: isolate;
        }
        /* the sky from the hero painting, bleeding in from the top */
        .sleeve::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: radial-gradient(
            110% 55% at 50% -8%,
            color-mix(in srgb, var(--sky) 26%, transparent),
            transparent 72%
          );
        }

        button {
          background: none;
          border: 0;
          padding: 0;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        button:disabled {
          opacity: 0.3;
          cursor: default;
        }
        .icon-btn {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          flex: none;
          border-radius: 50%;
          color: var(--ink);
          transition: background 160ms ease;
        }
        .icon-btn:hover:not(:disabled) {
          background: var(--field);
        }

        /* ---- top bar ---- */
        .bar {
          flex: none;
          display: grid;
          grid-template-columns: 44px 1fr 44px;
          align-items: center;
          gap: 0.4rem;
          width: min(760px, 100%);
          margin: 0 auto;
          padding: calc(0.4rem + env(safe-area-inset-top)) clamp(0.5rem, 3vw, 1.2rem) 0.2rem;
        }
        .now {
          text-align: center;
          min-width: 0;
        }
        .kicker {
          display: block;
          font-size: 0.62em;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-faint);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .title {
          margin: 0.05rem 0 0;
          font-family: var(--font-title);
          font-weight: 400;
          font-size: clamp(1.15rem, 3.4vw, 1.5rem);
          line-height: 1.15;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ---- lyrics ---- */
        .stage {
          position: relative;
          flex: 1;
          min-height: 0;
          width: min(760px, 100%);
          margin: 0 auto;
        }
        .lines {
          height: 100%;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 0 clamp(1.3rem, 6vw, 3rem);
          scrollbar-width: none;
          -ms-overflow-style: none;
          outline: none;
          -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 11%, #000 78%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0, #000 11%, #000 78%, transparent 100%);
        }
        .lines::-webkit-scrollbar {
          display: none;
        }
        /* The bottom spacer lets the last lines rise to the anchor. The top one
           stays small on purpose: before the song starts the lyrics should open
           at the top, not sit in the middle of a blank screen. */
        .pad {
          height: 42vh;
        }
        .pad.top {
          height: 3.2rem;
        }
        .line {
          margin: 0;
          padding: 0.42rem 0;
          font-size: clamp(1.3rem, 1rem + 1.7vw, 1.95rem);
          line-height: 1.28;
          color: var(--ink);
          cursor: pointer;
          opacity: 0.8;
          transform: scale(0.94);
          transform-origin: left center;
          transition: opacity 320ms ease, transform 320ms ease;
          -webkit-tap-highlight-color: transparent;
        }
        .line.gap {
          margin-top: 2.4rem;
        }
        .line[data-d="0"] {
          opacity: 1;
          transform: scale(1);
        }
        .line[data-d="1"] {
          opacity: 0.55;
        }
        .line[data-d="2"] {
          opacity: 0.36;
        }
        .line[data-d="3"] {
          opacity: 0.24;
        }
        /* reading ahead by hand: nothing should be hard to read */
        .lines[data-browse] .line:not([data-d="0"]) {
          opacity: 0.78;
          transform: scale(0.97);
        }
        .line:hover:not([data-d="0"]) {
          opacity: 0.8;
        }
        /* a line that has a note to read — hangs in the left margin so it can
           never wrap onto a line of its own */
        .line {
          position: relative;
        }
        .star {
          position: absolute;
          left: -0.62em;
          top: 0.86em;
          width: 0.3em;
          height: 0.3em;
          border-radius: 50%;
          background: var(--accent-2);
        }

        /* ---- the hairline thumb ---- */
        .thumb {
          position: absolute;
          top: 0;
          right: 7px;
          width: 3px;
          height: 0;
          border-radius: 2px;
          background: var(--ink-faint);
          opacity: 0;
          transition: opacity 260ms ease;
          pointer-events: none;
        }
        .thumb[data-show] {
          opacity: 1;
        }

        .jump {
          position: absolute;
          top: 0.6rem;
          left: 50%;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          background: var(--accent);
          color: var(--deep);
          font-size: 0.8em;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
        }

        /* ---- the note card ---- */
        .dock {
          position: absolute;
          left: clamp(0.7rem, 3vw, 1.4rem);
          right: clamp(0.7rem, 3vw, 1.4rem);
          bottom: 0.7rem;
          max-height: 46%;
          display: flex;
          flex-direction: column;
          border: var(--rule) solid var(--field-line);
          border-radius: 14px;
          background: color-mix(in srgb, var(--deep) 86%, transparent);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
          opacity: 0;
          transform: translateY(14px);
          pointer-events: none;
          transition: opacity 260ms ease, transform 260ms ease;
        }
        .dock[data-has] {
          opacity: 1;
          transform: none;
          pointer-events: auto;
        }
        .dock-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.45rem 0.85rem;
          color: var(--ink-dim);
          font-size: 0.72em;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .dock[data-open] .dock-head {
          padding-bottom: 0.1rem;
        }
        .dock-body {
          overflow-y: auto;
          scrollbar-width: none;
          padding: 0.15rem 0.95rem 0.8rem;
          font-size: 0.92em;
          line-height: 1.5;
          color: var(--ink);
          /* a note can carry more than one thought, joined with \n */
          white-space: pre-line;
          animation: swap 320ms ease;
        }
        .dock-body::-webkit-scrollbar {
          display: none;
        }
        @keyframes swap {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        /* ---- deck ---- */
        .deck {
          flex: none;
          width: min(760px, 100%);
          margin: 0 auto;
          padding: 0.5rem clamp(1.1rem, 5vw, 2.4rem) calc(0.7rem + env(safe-area-inset-bottom));
        }
        .scrub {
          display: block;
          width: 100%;
          height: 26px;
          margin: 0;
          background: transparent;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        .scrub::-webkit-slider-runnable-track {
          height: 3px;
          border-radius: 2px;
          background: linear-gradient(to right, var(--ink) var(--p), var(--field-line) var(--p));
        }
        .scrub::-moz-range-track {
          height: 3px;
          border-radius: 2px;
          background: linear-gradient(to right, var(--ink) var(--p), var(--field-line) var(--p));
        }
        .scrub::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 13px;
          height: 13px;
          margin-top: -5px;
          border-radius: 50%;
          background: var(--ink);
          border: 0;
        }
        .scrub::-moz-range-thumb {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: var(--ink);
          border: 0;
        }
        .times {
          display: flex;
          justify-content: space-between;
          margin-top: -0.2rem;
          color: var(--ink-dim);
          font-size: 0.72em;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.04em;
        }
        .controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(1.2rem, 6vw, 2.4rem);
          margin-top: 0.2rem;
        }
        .play {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--ink);
          color: var(--deep);
          transition: transform 140ms ease;
        }
        .play:active {
          transform: scale(0.94);
        }

        /* ---- the drawer ---- */
        .scrim {
          position: absolute;
          inset: 0;
          z-index: 5;
          background: rgba(0, 0, 0, 0.5);
          opacity: 0;
          visibility: hidden;
          transition: opacity 240ms ease, visibility 0s linear 240ms;
        }
        .scrim[data-open] {
          opacity: 1;
          visibility: visible;
          transition-delay: 0s;
        }
        .drawer {
          position: absolute;
          z-index: 6;
          top: 0;
          bottom: 0;
          left: 0;
          width: min(86vw, 380px);
          display: flex;
          flex-direction: column;
          background: var(--deep-soft);
          border-right: var(--rule) solid var(--field-line);
          transform: translateX(-102%);
          visibility: hidden;
          transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0s linear 280ms;
        }
        .drawer[data-open] {
          transform: none;
          visibility: visible;
          box-shadow: 8px 0 40px rgba(0, 0, 0, 0.35);
          transition-delay: 0s;
        }
        .drawer-head {
          flex: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: calc(0.6rem + env(safe-area-inset-top)) 0.6rem 0.4rem 1.3rem;
        }
        .drawer-title {
          font-family: var(--font-title);
          font-size: 1.3rem;
          color: var(--ink);
        }
        .tracklist {
          list-style: none;
          margin: 0;
          padding: 0.4rem 0 1.4rem;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .tracklist::-webkit-scrollbar {
          display: none;
        }
        .track {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 0.8rem 1.3rem;
          text-align: left;
          color: var(--ink-dim);
          font-size: 1.12em;
          transition: background 160ms ease, color 160ms ease;
        }
        .track:hover {
          background: var(--field);
          color: var(--ink);
        }
        .track[aria-current="true"] {
          color: var(--accent);
        }
        .n {
          flex: none;
          width: 1.7em;
          font-size: 0.78em;
          letter-spacing: 0.08em;
          color: var(--ink-faint);
          font-variant-numeric: tabular-nums;
        }
        .track[aria-current="true"] .n {
          color: var(--accent);
        }
        .t {
          flex: 1;
          min-width: 0;
        }

        /* a phone on its side: the deck folds into one row beside the lyrics */
        @media (max-height: 520px) and (orientation: landscape) {
          .kicker {
            display: none;
          }
          .bar {
            padding-top: 0.2rem;
          }
          .title {
            font-size: 1.1rem;
          }
          .pad {
            height: 26vh;
          }
          .pad.top {
            height: 1.6rem;
          }
          .deck {
            display: grid;
            grid-template-columns: auto 1fr;
            align-items: center;
            column-gap: 1.6rem;
            padding-block: 0.2rem 0.5rem;
          }
          .controls {
            grid-column: 1;
            grid-row: 1 / span 2;
            margin: 0;
            gap: 0.8rem;
          }
          .scrub {
            grid-column: 2;
            grid-row: 1;
            align-self: end;
          }
          .times {
            grid-column: 2;
            grid-row: 2;
          }
          .play {
            width: 48px;
            height: 48px;
          }
          .dock {
            max-height: 70%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .drawer,
          .dock {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
