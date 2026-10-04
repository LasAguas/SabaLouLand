// ---------------------------------------------------------------------------
// Design 3 — "Cassette". You're holding the tape.
//
//   deck     a cassette that plays: its reels turn while the song does, and
//            the tape winds from the left reel onto the right as it goes. Next
//            to it (a phone) or under it (a wide screen): which side and track
//            it is, the song's name as it'd be written on the label, and a tape
//            counter. The keys are deck keys — PLAY latches down while it's on.
//   tracks   behind the burger: a J-card that drops down from the top, the two
//            sides listed the way they're printed on the insert.
//   lyrics   on a sheet of ruled paper with a margin line. The playing line is
//            marked in highlighter.
//   scroll   no scrollbar — a bookmark ribbon rides the right edge of the sheet
//            instead, and slides down it as you read.
//   notes    the current line's liner note is a slip of paper taped over the
//            top of the sheet, in pen. It overlays the sheet (never resizes
//            it), and lifts away when the line has none.
//
// A wide screen puts the deck on the left and the sheet on the right; a phone
// stacks them, with the deck squeezed into one short strip.
// ---------------------------------------------------------------------------
import { useRef } from "react";
import { formatTime, useMenu } from "../../lib/useLinerPlayer";
import { Bars, BurgerIcon, ChevronIcon, CloseIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon } from "./icons";

const CREAM = "#efe4cc";
const SHELL = "#8c3a4a"; // the jacket's burgundy
const TAPE = "#3a261b";

/** The cassette itself. Drawn at 320x200 and scaled to whatever box it's in. */
function CassetteArt({ title, side, progress, playing }) {
  const lx = 100;
  const rx = 220;
  const cy = 138;
  // the tape winds off the left reel and onto the right as the song goes
  const rL = 11 + 14 * (1 - progress);
  const rR = 11 + 14 * progress;
  const fs = Math.min(25, 480 / Math.max(title.length, 1));

  return (
    <svg
      className={`art${playing ? " on" : ""}`}
      viewBox="0 0 320 200"
      role="img"
      aria-label={`cassette, side ${side || "A"}: ${title}`}
    >
      <defs>
        <linearGradient id="cs-shine" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      {/* shell */}
      <rect x="2" y="2" width="316" height="196" rx="14" fill={SHELL} />
      <rect x="2" y="2" width="316" height="196" rx="14" fill="url(#cs-shine)" />
      {[
        [15, 15],
        [305, 15],
        [15, 185],
        [305, 185],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="4.5" fill="#2a1410" opacity="0.7" />
          <path d={`M${x - 2.6} ${y}h5.2M${x} ${y - 2.6}v5.2`} stroke={CREAM} strokeWidth="0.9" opacity="0.7" />
        </g>
      ))}

      {/* label */}
      <rect x="26" y="20" width="268" height="84" rx="5" fill={CREAM} />
      <rect x="26" y="20" width="268" height="15" rx="5" fill="#4a8fd4" />
      <rect x="26" y="29" width="268" height="6" fill="#4a8fd4" />
      <rect x="26" y="35" width="268" height="2" fill="#d9a066" />
      <text x="160" y="31" textAnchor="middle" fontSize="8.5" letterSpacing="2.4" fill="#f6f7f8">
        NOTHING BUT LOVE
      </text>
      <path d="M40 78H280M40 92H280" stroke="#2a1c12" strokeOpacity="0.14" strokeWidth="1" />
      <text
        x="160"
        y="72"
        textAnchor="middle"
        fontSize={fs}
        fill="#2a1c12"
        style={{ fontFamily: "var(--font-hand)" }}
      >
        {title}
      </text>
      <rect x="258" y="42" width="24" height="24" rx="3" fill="none" stroke="#2a1c12" strokeWidth="1.5" />
      <text
        x="270"
        y="60"
        textAnchor="middle"
        fontSize="17"
        fill="#2a1c12"
        style={{ fontFamily: "var(--font-hand)" }}
      >
        {side || "A"}
      </text>

      {/* window, the two reels and the tape between them */}
      <rect x="58" y="112" width="204" height="54" rx="27" fill="#150b08" />
      <circle cx={lx} cy={cy} r={rL} fill={TAPE} />
      <circle cx={rx} cy={cy} r={rR} fill={TAPE} />
      <path d={`M${lx} ${cy + rL}L${rx} ${cy + rR}`} stroke={TAPE} strokeWidth="2" />
      {[lx, rx].map((cx) => (
        <g key={cx} className="reel" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle cx={cx} cy={cy} r="11" fill={CREAM} />
          <circle cx={cx} cy={cy} r="6.4" fill="#150b08" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect
              key={a}
              x={cx - 1.1}
              y={cy - 6.6}
              width="2.2"
              height="3"
              fill={CREAM}
              transform={`rotate(${a} ${cx} ${cy})`}
            />
          ))}
        </g>
      ))}

      {/* the foot, with the head and capstan holes */}
      <path d="M78 198L96 170H224L242 198Z" fill="#1f110d" />
      <circle cx="108" cy="187" r="4" fill="#0b0504" />
      <circle cx="212" cy="187" r="4" fill="#0b0504" />
      <rect x="148" y="176" width="24" height="9" rx="2" fill="#0b0504" />

      <style jsx>{`
        .art {
          display: block;
          width: 100%;
          height: auto;
          filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.4));
        }
        .reel {
          animation: spin 2.2s linear infinite reverse;
          animation-play-state: paused;
        }
        .on .reel {
          animation-play-state: running;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .reel {
            animation: none;
          }
        }
      `}</style>
    </svg>
  );
}

export default function Cassette({ player, albumTitle }) {
  const menu = useMenu();
  const sheetRef = useRef(null);
  const { songs, song, songIndex, groups, activeIndex, activeGroup, playing, currentTime, duration, progress } = player;
  const note = activeGroup?.note ?? null;
  const browsing = !player.autoFollow;
  const side = song.side || "";

  // J-card: the tracks grouped by side, in the order they play
  const sides = [];
  songs.forEach((s, i) => {
    let g = sides.find((x) => x.label === (s.side || ""));
    if (!g) sides.push((g = { label: s.side || "", items: [] }));
    g.items.push({ s, i });
  });

  // The bookmark ribbon: its position is set straight on the sheet from the
  // scroll handler (a CSS variable), so scrolling never re-renders the list.
  function onScroll(e) {
    const el = e.currentTarget;
    const room = el.scrollHeight - el.clientHeight;
    sheetRef.current?.style.setProperty("--sp", room > 0 ? (el.scrollTop / room).toFixed(4) : "0");
  }

  function pickTrack(i) {
    if (i !== songIndex) player.goTo(i);
    menu.close();
  }

  const counter = (t) => {
    const s = Math.max(0, Math.floor(t));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div className="cassette grain">
      <div className="deck">
        <div className="strip">
          <button
            ref={menu.triggerRef}
            type="button"
            className="burger"
            aria-label="tracks"
            aria-expanded={menu.open}
            onClick={menu.toggle}
          >
            <BurgerIcon width={24} height={24} />
          </button>

          <div className="art-wrap">
            <CassetteArt title={song.title} side={side} progress={progress} playing={playing} />
          </div>

          <div className="info">
            <span className="where">
              {side ? `side ${side} · ` : ""}
              track {songIndex + 1} of {songs.length}
            </span>
            <h1 className="name">{song.title}</h1>
            <span className="readout" aria-label="tape counter">
              <span className="digits">{counter(currentTime)}</span>
              <span className="of">/ {counter(duration)}</span>
            </span>
          </div>
        </div>

        <div className="keys">
          <div className="scrubrow">
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
          </div>
          <div className="row">
            <button type="button" className="key" onClick={player.prev} aria-label="previous track">
              <PrevIcon width={22} height={22} />
            </button>
            <button
              type="button"
              className="key play"
              data-on={playing ? "1" : undefined}
              onClick={player.togglePlay}
              aria-label={playing ? "pause" : "play"}
              aria-pressed={playing}
            >
              {playing ? <PauseIcon width={24} height={24} /> : <PlayIcon width={24} height={24} />}
            </button>
            <button type="button" className="key" onClick={player.next} disabled={!player.hasNext} aria-label="next track">
              <NextIcon width={22} height={22} />
            </button>
          </div>
          {player.error && <p className="err">couldn&apos;t load the audio</p>}
        </div>
      </div>

      <div className="sheet-wrap">
        <div className="sheet" ref={sheetRef}>
          <div
            {...player.listProps}
            className="lines"
            data-anchor="0.7"
            data-browse={browsing ? "1" : undefined}
            aria-label={`${song.title} lyrics`}
            onScroll={onScroll}
          >
            {/* the top of the sheet is kept clear for the note slip; until
                the song starts, the song's name is written there */}
            <div className="lead" aria-hidden="true">
              <span className="lead-title">{song.title}</span>
              <span className="lead-meta">
                {side ? `side ${side} · ` : ""}track {songIndex + 1}
              </span>
            </div>
            {groups.map((g) =>
              g.lines.map(({ line, index }, k) => (
                <p
                  key={line.id}
                  ref={player.lineRef(index)}
                  className={`line${index === activeIndex ? " now" : ""}${g.gap && k === 0 ? " gap" : ""}`}
                  onClick={() => player.seekToLine(index)}
                >
                  {line.note && (
                    <svg className="ast" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M5 .8v8.4M1.4 2.9l7.2 4.2M1.4 7.1l7.2-4.2" />
                    </svg>
                  )}
                  <span className="txt">{line.text}</span>
                </p>
              ))
            )}
            <div className="tail" aria-hidden="true" />
          </div>

          <span className="ribbon" aria-hidden="true" />

          <aside className="slip" data-has={note ? "1" : undefined} inert={!note} aria-live="polite">
            <i className="tape l" aria-hidden="true" />
            <i className="tape r" aria-hidden="true" />
            {note && (
              <div className="slip-body" key={activeGroup.key}>
                {note}
              </div>
            )}
          </aside>
        </div>

        {browsing && (
          <button type="button" className="flag" onClick={player.jumpToNow}>
            now playing <ChevronIcon dir="down" width={14} height={14} />
          </button>
        )}
      </div>

      <div className="scrim" data-open={menu.open ? "1" : undefined} onClick={menu.close} />
      <nav className="jcard" data-open={menu.open ? "1" : undefined} inert={!menu.open} ref={menu.panelRef} aria-label="tracks">
        <div className="jc-head">
          <div>
            <span className="jc-title">{albumTitle}</span>
            <span className="jc-by">Saba Lou</span>
          </div>
          <button type="button" className="jc-x" onClick={menu.close} aria-label="close">
            <CloseIcon width={20} height={20} />
          </button>
        </div>
        <div className="jc-sides">
          {sides.map((g) => (
            <section key={g.label || "all"}>
              {g.label && <h2 className="jc-side">side {g.label}</h2>}
              <ol>
                {g.items.map(({ s, i }) => (
                  <li key={s.slug}>
                    <button
                      type="button"
                      className="jc-track"
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
            </section>
          ))}
        </div>
      </nav>

      <style jsx>{`
        .cassette {
          --paper: #f4ecd8;
          --pen: #23396b;
          --brown: #2a1c12;
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow: hidden;
          isolation: isolate;
          padding: 0 clamp(0.5rem, 3vw, 1.2rem) calc(0.5rem + env(safe-area-inset-bottom));
          color: var(--ink);
          background: radial-gradient(
            130% 80% at 50% 12%,
            color-mix(in srgb, var(--deep) 84%, var(--ochre)),
            var(--deep) 75%
          );
        }
        button {
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
        }

        /* On a phone the deck's two halves become siblings of the sheet, so the
           deck strip sits above it and the keys below. */
        .deck {
          display: contents;
        }
        .strip {
          order: 0;
          flex: none;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding-top: calc(0.45rem + env(safe-area-inset-top));
        }
        .keys {
          order: 2;
          flex: none;
        }
        .sheet-wrap {
          order: 1;
        }

        .burger {
          flex: none;
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          align-self: flex-start;
          background: none;
          border: var(--rule) solid var(--field-line);
          border-radius: 8px;
          color: var(--ink);
        }
        .art-wrap {
          flex: none;
          width: clamp(96px, 30vw, 128px);
        }
        .info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .where {
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 0.62em;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-dim);
        }
        .name {
          margin: 0;
          font-family: var(--font-hand);
          font-weight: 400;
          font-size: clamp(1.15rem, 4.4vw, 1.5rem);
          line-height: 1.15;
          color: var(--ink);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        /* the tape counter */
        .readout {
          align-self: flex-start;
          display: inline-flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-top: 0.1rem;
          padding: 0.12rem 0.5rem;
          border-radius: 4px;
          background: #150b08;
          box-shadow: inset 0 1px 4px #000, 0 1px 0 rgba(255, 255, 255, 0.12);
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-variant-numeric: tabular-nums;
        }
        .digits {
          color: #f3d9a0;
          font-size: 0.95em;
          letter-spacing: 0.12em;
        }
        .of {
          color: rgba(243, 217, 160, 0.4);
          font-size: 0.66em;
          letter-spacing: 0.08em;
        }

        /* ---- the sheet ---- */
        .sheet-wrap {
          position: relative;
          flex: 1;
          min-height: 0;
        }
        .sheet {
          --sp: 0;
          position: relative;
          height: 100%;
          overflow: hidden;
          background: var(--paper);
          border-radius: 3px 5px 3px 6px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.32), inset 0 0 0 1px rgba(42, 28, 18, 0.1);
        }
        .lines {
          height: 100%;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: none;
          outline: none;
          padding: 0 2.4rem 0 3.4rem;
          color: var(--brown);
          /* ruled paper's red margin line — local, so it scrolls with the text */
          background-image: linear-gradient(
            to right,
            transparent calc(2.6rem - 1px),
            rgba(190, 70, 70, 0.4) calc(2.6rem - 1px),
            rgba(190, 70, 70, 0.4) 2.6rem,
            transparent 2.6rem
          );
          background-attachment: local;
        }
        .lines::-webkit-scrollbar {
          display: none;
        }
        .lead {
          height: 34%;
          min-height: 6rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: flex-start;
          padding-bottom: 0.9rem;
        }
        .lead-title {
          font-family: var(--font-hand);
          font-size: clamp(1.8rem, 1.3rem + 2vw, 2.6rem);
          line-height: 1.1;
          color: var(--brown);
          border-bottom: 2px solid var(--brown);
          padding-bottom: 0.1rem;
        }
        .lead-meta {
          margin-top: 0.35rem;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 0.6em;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.55;
        }
        .tail {
          height: 45%;
        }
        .line {
          position: relative;
          margin: 0;
          padding: 0.28rem 0 0.22rem;
          font-family: var(--font-hand);
          font-size: clamp(1.28rem, 1rem + 1.1vw, 1.6rem);
          line-height: 1.3;
          color: var(--brown);
          border-bottom: 1px solid rgba(74, 143, 212, 0.3);
          opacity: 0.8;
          cursor: pointer;
          transition: opacity 240ms ease;
        }
        .line.gap {
          margin-top: 1.6rem;
        }
        .line.now {
          opacity: 1;
        }
        .lines[data-browse] .line {
          opacity: 0.95;
        }
        .line:hover {
          opacity: 1;
        }
        .txt {
          background-image: linear-gradient(
            transparent 40%,
            rgba(240, 190, 70, 0.55) 40%,
            rgba(240, 190, 70, 0.55) 90%,
            transparent 90%
          );
          background-repeat: no-repeat;
          background-size: 0% 100%;
          -webkit-box-decoration-break: clone;
          box-decoration-break: clone;
          transition: background-size 380ms ease;
          padding: 0 0.15em;
          margin: 0 -0.15em;
        }
        .line.now .txt {
          background-size: 100% 100%;
          color: #6c2230;
        }
        /* a line with a note carries a pen asterisk in the margin */
        .ast {
          position: absolute;
          left: -1.9rem;
          top: 0.78em;
          width: 0.7em;
          height: 0.7em;
          fill: none;
          stroke: var(--pen);
          stroke-width: 1.3;
          stroke-linecap: round;
          opacity: 0.8;
        }

        /* ---- the bookmark ribbon (the scrollbar's replacement) ---- */
        .ribbon {
          position: absolute;
          right: 0.55rem;
          top: calc(var(--sp) * (100% - 46px));
          width: 12px;
          height: 46px;
          background: linear-gradient(to right, #8c3a4a, #a64c5d);
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
          pointer-events: none;
        }

        /* ---- the note: a slip of paper taped over the top of the sheet ---- */
        .slip {
          position: absolute;
          z-index: 3;
          top: 0.7rem;
          left: 0.9rem;
          right: 1.5rem;
          max-height: 40%;
          display: flex;
          padding: 0.7rem 0.9rem 0.6rem;
          background: #fffdf5;
          border-radius: 2px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(42, 28, 18, 0.08);
          transform: rotate(-0.8deg);
          transform-origin: top left;
          opacity: 0;
          translate: 0 -8px;
          pointer-events: none;
          transition: opacity 260ms ease, translate 260ms ease;
        }
        .slip[data-has] {
          opacity: 1;
          translate: 0 0;
          pointer-events: auto;
        }
        .slip-body {
          overflow-y: auto;
          scrollbar-width: none;
          font-family: var(--font-hand);
          font-size: 1.02em;
          line-height: 1.38;
          color: var(--pen);
          white-space: pre-line;
          animation: peel 300ms ease;
        }
        .slip-body::-webkit-scrollbar {
          display: none;
        }
        @keyframes peel {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        /* strips of masking tape across the top corners */
        .tape {
          position: absolute;
          top: -0.55rem;
          width: 3.2rem;
          height: 1.15rem;
          background: rgba(222, 200, 150, 0.82);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
          clip-path: polygon(0 8%, 5% 0, 10% 10%, 15% 0, 100% 0, 100% 100%, 15% 100%, 10% 90%, 5% 100%, 0 92%);
        }
        .tape.l {
          left: -0.9rem;
          transform: rotate(-32deg);
        }
        .tape.r {
          right: -0.9rem;
          transform: rotate(32deg);
        }

        .flag {
          position: absolute;
          left: 50%;
          bottom: 0.7rem;
          transform: translateX(-50%) rotate(1deg);
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.9rem;
          border: 0;
          background: rgba(222, 200, 150, 0.95);
          color: var(--brown);
          font-family: var(--font-hand);
          font-size: 0.95em;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          clip-path: polygon(0 6%, 3% 0, 6% 8%, 9% 0, 91% 0, 94% 8%, 97% 0, 100% 6%, 100% 94%, 97% 100%, 94% 92%, 91% 100%, 9% 100%, 6% 92%, 3% 100%, 0 94%);
        }

        /* ---- the keys ---- */
        .keys {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .scrub {
          display: block;
          width: 100%;
          height: 24px;
          margin: 0;
          background: transparent;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        .scrub::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(to right, var(--accent-2) var(--p), color-mix(in srgb, var(--ink) 20%, transparent) var(--p));
        }
        .scrub::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(to right, var(--accent-2) var(--p), color-mix(in srgb, var(--ink) 20%, transparent) var(--p));
        }
        /* the thumb is a little reel hub */
        .scrub::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          margin-top: -7px;
          border-radius: 50%;
          background: radial-gradient(circle, #150b08 0 3.5px, #efe4cc 4px);
          border: 2px solid #150b08;
        }
        .scrub::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: radial-gradient(circle, #150b08 0 3.5px, #efe4cc 4px);
          border: 2px solid #150b08;
        }
        .row {
          display: flex;
          gap: 0.4rem;
          padding-bottom: 6px;
        }
        .key {
          flex: 1;
          height: 52px;
          display: grid;
          place-items: center;
          color: #f1ead9;
          background: linear-gradient(#4b4b52, #2b2b30);
          border: 1px solid #0d0d0f;
          border-radius: 7px 7px 4px 4px;
          box-shadow: 0 5px 0 #0d0d0f, 0 8px 10px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transition: transform 80ms ease, box-shadow 80ms ease;
        }
        .key:active:not(:disabled),
        .key[data-on] {
          transform: translateY(4px);
          background: linear-gradient(#2d2d32, #3a3a41);
          box-shadow: 0 1px 0 #0d0d0f, inset 0 2px 6px rgba(0, 0, 0, 0.55);
        }
        .key.play {
          flex: 1.6;
        }
        .key:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .err {
          margin: 0;
          text-align: center;
          font-size: 0.8em;
          color: var(--ink-dim);
        }

        /* ---- the J-card ---- */
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
        .jcard {
          position: absolute;
          z-index: 6;
          top: 0;
          left: 50%;
          width: min(720px, 100%);
          max-height: 92%;
          display: flex;
          flex-direction: column;
          background: var(--paper);
          color: var(--brown);
          border-radius: 0 0 6px 6px;
          /* the fold down the middle of an insert */
          background-image: linear-gradient(to right, transparent calc(50% - 1px), rgba(42, 28, 18, 0.1) 50%, transparent calc(50% + 1px));
          transform: translate(-50%, -104%);
          visibility: hidden;
          transition: transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0s linear 300ms;
        }
        .jcard[data-open] {
          transform: translate(-50%, 0);
          visibility: visible;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
          transition-delay: 0s;
        }
        .jc-head {
          flex: none;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: calc(0.9rem + env(safe-area-inset-top)) 1rem 0.5rem 1.4rem;
        }
        .jc-title {
          display: block;
          font-family: var(--font-title);
          font-size: 1.5rem;
          line-height: 1.1;
        }
        .jc-by {
          display: block;
          margin-top: 0.15rem;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 0.62em;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.6;
        }
        .jc-x {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          background: none;
          border: 0;
          color: var(--brown);
        }
        .jc-sides {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.4rem 2.4rem;
          overflow-y: auto;
          scrollbar-width: none;
          padding: 0 1.4rem 1.3rem;
        }
        .jc-sides::-webkit-scrollbar {
          display: none;
        }
        .jc-side {
          margin: 0.6rem 0 0.2rem;
          padding-bottom: 0.25rem;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 0.66em;
          font-weight: 400;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          border-bottom: 2px solid var(--brown);
        }
        .jcard ol {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .jc-track {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.5rem 0.2rem;
          background: none;
          border: 0;
          border-bottom: 1px solid rgba(74, 143, 212, 0.35);
          text-align: left;
          font-family: var(--font-hand);
          font-size: 1.2em;
          color: var(--brown);
        }
        .jc-track:hover {
          background: rgba(240, 190, 70, 0.22);
        }
        .jc-track[aria-current="true"] {
          background: rgba(240, 190, 70, 0.5);
          color: #6c2230;
        }
        .n {
          flex: none;
          width: 1.6em;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 0.6em;
          letter-spacing: 0.08em;
          opacity: 0.6;
        }
        .t {
          flex: 1;
          min-width: 0;
        }

        /* ---- a wide screen, or a phone on its side: the deck on the left, the
           sheet on the right ---- */
        @media (min-width: 1000px), (min-width: 640px) and (max-height: 520px) and (orientation: landscape) {
          .cassette {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: clamp(2.2rem, 5vw, 4.5rem);
            padding: 1.5rem clamp(1.5rem, 4vw, 3rem);
          }
          .deck {
            display: flex;
            flex-direction: column;
            gap: 1.4rem;
            width: clamp(340px, 32vw, 430px);
            flex: none;
          }
          .strip {
            order: 0;
            flex-direction: column;
            align-items: stretch;
            gap: 1.1rem;
            padding-top: 0;
          }
          .burger {
            order: -1;
          }
          .art-wrap {
            width: 100%;
          }
          .info {
            align-items: center;
            text-align: center;
          }
          .name {
            font-size: 1.9rem;
          }
          .readout {
            align-self: center;
          }
          .sheet-wrap {
            flex: 1;
            max-width: 640px;
            height: min(100%, 780px);
          }
          .lines {
            padding-right: 3rem;
          }
          .slip {
            right: 1.8rem;
          }
        }

        /* ...and on its side the deck has to fit in the screen's height */
        @media (min-width: 640px) and (max-height: 520px) and (orientation: landscape) {
          .cassette {
            gap: 1.4rem;
            padding: 0.5rem 1rem;
          }
          .deck {
            width: clamp(250px, 36vw, 320px);
            gap: 0.5rem;
          }
          .strip {
            gap: 0.4rem;
          }
          .art-wrap {
            width: min(100%, 150px);
            margin: 0 auto;
          }
          .name {
            font-size: 1.25rem;
          }
          .key {
            height: 42px;
          }
          .sheet-wrap {
            height: 100%;
            max-width: none;
          }
        }

        /* the J-card's two sides sit side by side when there's room */
        @media (min-width: 640px) {
          .jc-sides {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .jcard,
          .slip,
          .key {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
