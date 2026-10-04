// ---------------------------------------------------------------------------
// Design 2 — "Paper". Built from the home page's own pieces: the painting, the
// translucent off-white panels, and the blue paper chips (.panel / .chip in
// styles/globals.css — the same classes the language switch and nav rail use).
//
//   top      a hamburger chip on the left (the track list drops down from it
//            as a panel of chips, like the nav rail), the song's name in the
//            hand-set wordmark lettering in the middle, "3 / 10" on the right.
//   lyrics   written straight onto a sheet of paper over the painting. The
//            current line gets a marker stroke drawn under it.
//   notes    every line that has a liner note has it as a blue paper chip,
//            joined to the lines it's about by a bracket — beside them on a
//            wide screen, under them on a phone. The chip for the line that's
//            playing is ringed, like the selected chip in the theme switch;
//            the others sit back at the same 62% the unselected ones do.
//   scroll   no scrollbar; the top and bottom of the sheet just fade out.
//   deck     a panel of chips: prev / play / next, and a hand-drawn scrubber.
// ---------------------------------------------------------------------------
import Image from "next/image";
import { formatTime, useMenu } from "../../lib/useLinerPlayer";
import { useTheme } from "../../lib/useTheme";
import { BurgerIcon, ChevronIcon, CloseIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon } from "./icons";

const HERO = {
  dark: "/images/hero-dark.jpg",
  light: "/images/hero-light.jpg",
};

function Wordmark({ text }) {
  return (
    <h1 className="mark" data-size={text.length <= 10 ? "lg" : text.length <= 20 ? "md" : "sm"}>
      {text.toUpperCase()}
      <style jsx>{`
        .mark {
          margin: 0;
          font-family: var(--font-title);
          font-weight: 400;
          font-size: clamp(1.05rem, 4.6vw, 2rem);
          line-height: 1.05;
          letter-spacing: 0.015em;
          text-align: center;
          text-wrap: balance;
          color: var(--on-hero);
          text-shadow: 0 2px 18px rgba(7, 9, 12, 0.5);
        }
        /* short names get the big lettering, long ones the small */
        .mark[data-size="lg"] {
          font-size: clamp(1.8rem, 8.4vw, 3.1rem);
        }
        .mark[data-size="md"] {
          font-size: clamp(1.3rem, 6vw, 2.4rem);
        }
        @media (max-height: 520px) and (orientation: landscape) {
          .mark[data-size] {
            font-size: clamp(1.1rem, 3.2vw, 1.6rem);
          }
        }
      `}</style>
    </h1>
  );
}

export default function Paper({ player, albumTitle }) {
  const menu = useMenu();
  const { theme } = useTheme();
  const { songs, song, songIndex, groups, activeIndex, activeGroupIndex, playing, currentTime, duration, progress } = player;
  const browsing = !player.autoFollow;

  function pickTrack(i) {
    if (i !== songIndex) player.goTo(i);
    menu.close();
  }

  return (
    <div className="paper" data-menu={menu.open ? "1" : undefined}>
      <div className="plate" aria-hidden="true">
        <Image src={HERO[theme] ?? HERO.dark} alt="" fill priority sizes="100vw" quality={82} />
      </div>
      <div className="fade" aria-hidden="true" />

      <header className="top">
        <div className="top-l">
          <div className="panel burger-panel">
            <button
              ref={menu.triggerRef}
              type="button"
              className="chip burger"
              aria-label="tracks"
              aria-expanded={menu.open}
              onClick={menu.toggle}
            >
              <BurgerIcon width={20} height={20} />
            </button>
          </div>

          {menu.open && <button type="button" className="away" aria-label="close the track list" onClick={menu.close} />}
          <nav className="panel drop" data-open={menu.open ? "1" : undefined} inert={!menu.open} ref={menu.panelRef} aria-label="tracks">
            <div className="drop-head">
              <span>{albumTitle}</span>
              <button type="button" className="x" onClick={menu.close} aria-label="close">
                <CloseIcon width={16} height={16} />
              </button>
            </div>
            <ol>
              {songs.map((s, i) => (
                <li key={s.slug}>
                  <button
                    type="button"
                    className={`chip${i === songIndex ? " selected" : ""}`}
                    aria-current={i === songIndex ? "true" : undefined}
                    onClick={() => pickTrack(i)}
                  >
                    <span className="n">{i + 1}</span>
                    <span className="t">{s.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="top-c">
          <Wordmark key={song.slug} text={song.title} />
          <p className="album">{albumTitle}</p>
        </div>

        <div className="top-r">
          <div className="panel count-panel">
            <span className="chip count" aria-label={`track ${songIndex + 1} of ${songs.length}`}>
              {songIndex + 1} / {songs.length}
            </span>
          </div>
        </div>
      </header>

      <main className="sheet">
        <div
          {...player.listProps}
          className="lines"
          data-anchor="0.34"
          data-browse={browsing ? "1" : undefined}
          aria-label={`${song.title} lyrics and liner notes`}
        >
          {groups.map((g, gi) => {
            const live = gi === activeGroupIndex;
            return (
              <section
                key={g.key}
                className={`group${g.note ? " has-note" : ""}${g.gap ? " gap" : ""}`}
                data-live={live ? "1" : undefined}
                data-scroll-group
              >
                <div className="lyr">
                  {g.lines.map(({ line, index }) => (
                    <p
                      key={line.id}
                      ref={player.lineRef(index)}
                      className={`line${index === activeIndex ? " now" : ""}`}
                      onClick={() => player.seekToLine(index)}
                    >
                      <span className="txt">{line.text}</span>
                    </p>
                  ))}
                </div>
                {g.note && (
                  <div className={`chip note${live ? " selected" : " muted"}`}>
                    {g.note}
                  </div>
                )}
              </section>
            );
          })}
          {/* room for the last lines to rise to the anchor. A spacer rather than
              padding on the list: padding sets a floor under the list's own
              height, which on a short screen is taller than the sheet. */}
          <div className="tail" aria-hidden="true" />
        </div>

        {browsing && (
          <button type="button" className="chip jump" onClick={player.jumpToNow}>
            now playing <ChevronIcon dir="down" width={14} height={14} />
          </button>
        )}
      </main>

      <footer className="deck panel">
        <div className="scrubrow">
          <span className="time">{formatTime(currentTime)}</span>
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
          <span className="time">{player.error ? "no audio" : `−${formatTime(Math.max(0, duration - currentTime))}`}</span>
        </div>
        <div className="keys">
          <button type="button" className="chip key" onClick={player.prev} aria-label="previous">
            <PrevIcon width={18} height={18} />
          </button>
          <button type="button" className="chip key play" onClick={player.togglePlay} aria-label={playing ? "pause" : "play"}>
            {playing ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
            <span>{playing ? "pause" : "play"}</span>
          </button>
          <button type="button" className="chip key" onClick={player.next} disabled={!player.hasNext} aria-label="next">
            <NextIcon width={18} height={18} />
          </button>
        </div>
      </footer>

      <style jsx>{`
        .paper {
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          overflow: hidden;
          background: var(--hero-foot);
          isolation: isolate;
          padding: 0 clamp(0.6rem, 3vw, 1.4rem) calc(clamp(0.6rem, 2vw, 1.2rem) + env(safe-area-inset-bottom));
        }

        /* ---- the painting, same two edits and same crop as the home page ---- */
        .plate {
          position: absolute;
          inset: 0;
          z-index: -2;
        }
        .plate :global(img) {
          object-fit: cover;
          object-position: 50% 0%;
        }
        .fade {
          position: absolute;
          inset: auto 0 0 0;
          height: 0;
          z-index: -1;
          background: linear-gradient(to bottom, transparent, var(--hero-foot) 88%);
        }
        @media (min-aspect-ratio: 1/1) {
          .plate :global(img) {
            object-position: 50% 34%;
          }
          .fade {
            height: 22%;
          }
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }
        button:disabled {
          opacity: 0.35;
          cursor: default;
        }

        /* ---- top ---- */
        .top {
          flex: none;
          display: grid;
          grid-template-columns: 1fr minmax(0, 2.4fr) 1fr;
          align-items: start;
          column-gap: 0.6rem;
          width: min(1100px, 100%);
          margin: 0 auto;
          padding-top: calc(0.6rem + env(safe-area-inset-top));
        }
        .top-l {
          position: relative;
          justify-self: start;
        }
        .top-c {
          text-align: center;
          padding-top: 0.15rem;
        }
        .top-r {
          justify-self: end;
        }
        .album {
          margin: 0.2rem 0 0;
          font-size: 0.72em;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--on-hero-dim);
          text-shadow: var(--on-hero-shadow);
        }
        .paper[data-menu] .album {
          visibility: hidden;
        }
        .burger-panel,
        .count-panel {
          width: auto;
        }
        .burger {
          width: 2.5rem;
          justify-content: center;
          padding-inline: 0;
        }
        .count {
          width: auto;
          min-width: 3.3rem;
          justify-content: center;
          cursor: default;
          font-variant-numeric: tabular-nums;
        }
        .count:hover {
          transform: none;
          filter: none;
        }

        /* the track list: a panel of chips, like the nav rail */
        .away {
          position: fixed;
          inset: 0;
          z-index: 9;
          background: transparent;
          border: 0;
          cursor: default;
        }
        .drop {
          position: absolute;
          z-index: 10;
          top: calc(100% + 0.4rem);
          left: 0;
          width: min(80vw, 19rem);
          max-height: calc(100svh - 9rem);
          overflow-y: auto;
          scrollbar-width: none;
          /* more solid than the other panels: it sits over lyrics */
          background: color-mix(in srgb, rgb(250, 246, 238) 95%, transparent);
          box-shadow: 0 10px 30px rgba(7, 9, 12, 0.35);
          transform-origin: top left;
          transform: scale(0.96);
          opacity: 0;
          visibility: hidden;
          transition: opacity 160ms ease, transform 160ms ease, visibility 0s linear 160ms;
        }
        .drop::-webkit-scrollbar {
          display: none;
        }
        .drop[data-open] {
          opacity: 1;
          transform: rotate(var(--tilt, 0deg));
          visibility: visible;
          transition-delay: 0s;
        }
        .drop-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.05rem 0.25rem 0;
          color: var(--chip-ink);
          font-size: 0.78em;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .x {
          display: grid;
          place-items: center;
          width: 1.5rem;
          height: 1.5rem;
          background: none;
          border: 0;
          color: var(--chip-ink);
          cursor: pointer;
        }
        .drop ol {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .drop .chip {
          align-items: baseline;
          gap: 0.6rem;
        }
        .n {
          flex: none;
          width: 1.1em;
          text-align: right;
          opacity: 0.6;
          font-variant-numeric: tabular-nums;
        }
        .t {
          min-width: 0;
        }

        /* ---- the sheet ---- */
        .sheet {
          position: relative;
          flex: 1;
          min-height: 0;
          width: min(1100px, 100%);
          margin: 0 auto;
          background: color-mix(in srgb, rgb(250, 246, 238) 86%, transparent);
          border-radius: 4px 14px 5px 16px / 14px 5px 16px 4px;
          box-shadow: 0 10px 34px rgba(7, 9, 12, 0.3);
        }
        .lines {
          height: 100%;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: none;
          outline: none;
          padding: 1.5rem clamp(1rem, 4vw, 2.6rem) 0;
          -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 1.5rem, #000 calc(100% - 3rem), transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0, #000 1.5rem, #000 calc(100% - 3rem), transparent 100%);
          color: var(--bio-ink);
        }
        .lines::-webkit-scrollbar {
          display: none;
        }

        .tail {
          height: 60%;
          min-height: 6rem;
        }
        .group {
          position: relative;
          padding-left: 1.1rem;
          margin: 0.2rem 0 0.9rem;
        }
        .group.gap {
          margin-top: 2.2rem;
        }
        .line {
          margin: 0;
          padding: 0.14rem 0;
          font-size: clamp(1.3rem, 1.05rem + 1.2vw, 1.75rem);
          line-height: 1.32;
          color: var(--bio-ink);
          opacity: 0.74;
          cursor: pointer;
          transition: opacity 240ms ease;
        }
        .line.now {
          opacity: 1;
        }
        .lines[data-browse] .line {
          opacity: 0.92;
        }
        .line:hover {
          opacity: 1;
        }
        /* the marker stroke, drawn under the line that's playing */
        .txt {
          background-image: linear-gradient(
            transparent 48%,
            color-mix(in srgb, var(--sky) 55%, transparent) 48%,
            color-mix(in srgb, var(--sky) 55%, transparent) 86%,
            transparent 86%
          );
          background-repeat: no-repeat;
          background-size: 0% 100%;
          -webkit-box-decoration-break: clone;
          box-decoration-break: clone;
          transition: background-size 420ms ease;
          padding: 0 0.15em;
          margin: 0 -0.15em;
        }
        .line.now .txt {
          background-size: 100% 100%;
        }

        /* the bracket that ties a note to its lines: a rule down the left of
           the lines and on past the chip, with a short stub into the chip */
        .group.has-note::before {
          content: "";
          position: absolute;
          left: 0.15rem;
          top: 0.3rem;
          bottom: 0.3rem;
          width: 0;
          border-left: 2px solid color-mix(in srgb, var(--chip-line) 55%, transparent);
          border-radius: 2px;
          transition: border-color 240ms ease;
        }
        .group[data-live].has-note::before {
          border-left: 3px solid var(--sky-deep);
          left: 0.1rem;
        }

        .note {
          position: relative;
          display: block;
          width: auto;
          margin: 0.45rem 0 0 0.2rem;
          padding: 0.5rem 0.8rem 0.55rem;
          font-size: 0.96em;
          line-height: 1.4;
          text-align: left;
          cursor: default;
          white-space: pre-line;
          transition: opacity 260ms ease;
        }
        /* always square to the page — no tilt, and no hover nudge */
        .note:hover {
          filter: none;
          transform: none;
        }
        .note.selected {
          box-shadow: 3px 4px 0 color-mix(in srgb, var(--chip-line) 28%, transparent);
        }
        .note::before {
          content: "";
          position: absolute;
          left: -1.3rem;
          top: 0.95rem;
          width: 1.3rem;
          border-top: 2px solid color-mix(in srgb, var(--chip-line) 55%, transparent);
        }
        .group[data-live] .note::before {
          border-top: 3px solid var(--sky-deep);
        }

        .jump {
          position: absolute;
          top: 0.7rem;
          left: 50%;
          transform: translateX(-50%);
          width: auto;
          gap: 0.3rem;
        }
        .jump:hover {
          transform: translateX(-50%);
        }

        /* ---- the deck ---- */
        .deck {
          flex: none;
          width: min(560px, 100%);
          margin: 0 auto;
          gap: 0.4rem;
        }
        .scrubrow {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.15rem 0.35rem 0;
          color: var(--chip-ink);
        }
        .time {
          flex: none;
          min-width: 2.7em;
          font-size: 0.82em;
          font-variant-numeric: tabular-nums;
        }
        .time:last-child {
          text-align: right;
        }
        .scrub {
          flex: 1;
          min-width: 0;
          height: 24px;
          margin: 0;
          background: transparent;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        .scrub::-webkit-slider-runnable-track {
          height: 3px;
          background: linear-gradient(to right, var(--sky-deep) var(--p), color-mix(in srgb, var(--chip-line) 60%, transparent) var(--p));
        }
        .scrub::-moz-range-track {
          height: 3px;
          background: linear-gradient(to right, var(--sky-deep) var(--p), color-mix(in srgb, var(--chip-line) 60%, transparent) var(--p));
        }
        /* the thumb is a little paper tab, like the chips */
        .scrub::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 18px;
          margin-top: -7.5px;
          background: var(--chip);
          border: var(--rule) solid var(--chip-line);
          border-radius: 0;
        }
        .scrub::-moz-range-thumb {
          width: 10px;
          height: 16px;
          background: var(--chip);
          border: var(--rule) solid var(--chip-line);
          border-radius: 0;
        }
        .keys {
          display: flex;
          gap: 0.35rem;
        }
        .key {
          width: auto;
          flex: 1;
          justify-content: center;
          padding-block: 0.4rem;
        }
        .key.play {
          flex: 2.4;
          gap: 0.5rem;
        }
        .key:disabled:hover {
          transform: none;
          filter: none;
        }

        /* ---- a wide screen: notes go beside their lines, not under ---- */
        @media (min-width: 900px) {
          .lines {
            padding-inline: 2.6rem;
          }
          .group.has-note {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
            column-gap: 3.4rem;
            align-items: start;
            padding-left: 0;
          }
          .group.has-note .lyr {
            padding-left: 1.1rem;
            position: relative;
          }
          /* the bracket moves to the right of the lines, where the chip is */
          .group.has-note::before {
            display: none;
          }
          .group.has-note .lyr::after {
            content: "";
            position: absolute;
            right: -1.7rem;
            top: 0.3rem;
            bottom: 0.3rem;
            border-right: 2px solid color-mix(in srgb, var(--chip-line) 55%, transparent);
            transition: border-color 240ms ease;
          }
          .group[data-live].has-note .lyr::after {
            border-right: 3px solid var(--sky-deep);
            right: -1.75rem;
          }
          .note {
            margin: 0.1rem 0 0;
          }
          .note::before {
            left: -1.7rem;
            width: 1.7rem;
            top: 1rem;
          }
        }

        /* a phone on its side: less chrome, and the deck becomes one row */
        @media (max-height: 520px) and (orientation: landscape) {
          .paper {
            gap: 0.4rem;
          }
          .top {
            padding-top: 0.4rem;
          }
          .album {
            display: none;
          }
          .deck {
            width: min(760px, 100%);
            flex-direction: row;
            align-items: center;
            gap: 0.6rem;
          }
          .scrubrow {
            flex: 1;
          }
          .keys {
            flex: none;
            width: 300px;
          }
          .key {
            padding-block: 0.25rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .txt,
          .note,
          .drop {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
