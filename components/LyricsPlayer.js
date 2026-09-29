// ---------------------------------------------------------------------------
// The synced lyrics reader behind /k/<code>. Given one song's audio URL plus
// its lines/notes (see content/lyrics/README.md), it plays the file and keeps
// one line highlighted as the "current" one, the way a karaoke screen does.
//
// How the sync actually works: nothing is pushed to it. Every animation frame
// while playing, it asks the <audio> element what second it's on and binary-
// searches lines[] for the last one whose `t` has passed. LEAD_SECONDS nudges
// that lookup very slightly into the future, because a highlight that lands
// exactly on the beat reads as late — ears expect to see a line arrive just
// before they hear it.
//
// Plain and functional on purpose — this is a private reading tool handed to
// someone via a physical tag, not another page of the public site, so it
// skips the site's hand-drawn chrome (tilts, wobble borders) rather than
// carrying it in unasked.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from "react";

const LEAD_SECONDS = 0.15;
const RESUME_AUTO_FOLLOW_AFTER_MS = 3000;

function activeLineIndex(lines, t) {
  let lo = 0;
  let hi = lines.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].t <= t) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function LyricsPlayer({ song, audioSrc, lines, notes, onEnded }) {
  const audioRef = useRef(null);
  const lineRefs = useRef({});
  const suppressScrollRef = useRef(false);
  const lastManualScrollAt = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [autoFollow, setAutoFollow] = useState(true);

  // The precise, per-frame loop — only runs while something is actually
  // playing, so an idle open tab costs nothing.
  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    const tick = () => {
      const audio = audioRef.current;
      if (audio) {
        setCurrentTime(audio.currentTime);
        const idx = activeLineIndex(lines, audio.currentTime + LEAD_SECONDS);
        setActiveIndex((prev) => (prev === idx ? prev : idx));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, lines]);

  // While paused (or right after a scrub/seek), the coarser native events are
  // enough to keep the displayed time and the highlighted line correct.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const sync = () => {
      if (playing) return;
      setCurrentTime(audio.currentTime);
      setActiveIndex(activeLineIndex(lines, audio.currentTime + LEAD_SECONDS));
    };
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("seeked", sync);
    return () => {
      audio.removeEventListener("timeupdate", sync);
      audio.removeEventListener("seeked", sync);
    };
  }, [playing, lines]);

  // Auto-scroll the active line into view, unless the listener scrolled the
  // list themselves in the last few seconds — same "pause, then resume"
  // manners most karaoke and podcast-transcript UIs use.
  useEffect(() => {
    const line = lines[activeIndex];
    if (!line) return;
    const shouldFollow = Date.now() - lastManualScrollAt.current > RESUME_AUTO_FOLLOW_AFTER_MS;
    setAutoFollow(shouldFollow);
    if (!shouldFollow) return;
    const el = lineRefs.current[line.id];
    if (!el) return;
    suppressScrollRef.current = true;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(() => {
      suppressScrollRef.current = false;
    }, 600);
    return () => clearTimeout(t);
  }, [activeIndex, lines]);

  // Lock-screen / notification controls, wherever the browser supports them.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: song.title,
      artist: "Saba Lou",
      album: "Nothing But Love",
    });
    navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play().catch(() => {}));
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (audioRef.current && details.seekTime != null) {
        audioRef.current.currentTime = details.seekTime;
      }
    });
  }, [song]);

  // Keep the screen on while a song is actually playing — someone reading
  // along shouldn't have it dim mid-verse. Best-effort; plenty of browsers
  // don't support this at all, and that's fine.
  useEffect(() => {
    if (!playing || typeof navigator === "undefined" || !("wakeLock" in navigator)) return undefined;
    let lock;
    let cancelled = false;
    navigator.wakeLock
      .request("screen")
      .then((l) => {
        if (cancelled) l.release().catch(() => {});
        else lock = l;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      lock?.release().catch(() => {});
    };
  }, [playing]);

  function handleListScroll() {
    if (suppressScrollRef.current) return;
    lastManualScrollAt.current = Date.now();
  }

  function jumpToNow() {
    lastManualScrollAt.current = 0;
    const line = lines[activeIndex];
    const el = line && lineRefs.current[line.id];
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function seekTo(t) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = t;
    if (audio.paused) audio.play().catch(() => {});
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function handleScrub(e) {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  }

  const activeLine = lines[activeIndex];
  const activeNote = activeLine?.note ? notes?.[activeLine.note] : null;

  return (
    <section className="player">
      <header className="head">
        <h1 className="title">{song.title}</h1>
        <p className="hint">tap a line to jump there</p>
      </header>

      {activeNote && (
        <aside className="note" aria-live="polite">
          {activeNote.body}
        </aside>
      )}

      <div className="lines" onScroll={handleListScroll}>
        {lines.map((line, i) => (
          <p
            key={line.id}
            ref={(el) => {
              lineRefs.current[line.id] = el;
            }}
            className={i === activeIndex ? "line active" : "line"}
            onClick={() => seekTo(line.t)}
          >
            {line.text}
            {line.note && <span className="dot" aria-hidden="true" />}
          </p>
        ))}
      </div>

      {!autoFollow && (
        <button type="button" className="jump" onClick={jumpToNow}>
          now playing ↓
        </button>
      )}

      <div className="transport">
        <button type="button" className="play" onClick={togglePlay} aria-label={playing ? "pause" : "play"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <input
          type="range"
          className="scrub"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleScrub}
          aria-label="seek"
        />
        <span className="time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
      />

      <style jsx>{`
        .player {
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .head {
          margin-bottom: 1rem;
        }
        .title {
          font-family: var(--font-title);
          font-weight: 400;
          font-size: clamp(1.4rem, 3vw, 2rem);
          margin: 0;
          color: var(--ink);
        }
        .hint {
          margin: 0.25rem 0 0;
          color: var(--ink-dim);
          font-size: 0.9em;
        }
        .note {
          background: var(--field);
          border: var(--rule) solid var(--field-line);
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          margin-bottom: 1rem;
          color: var(--ink);
          font-size: 0.95em;
          line-height: 1.45;
          /* Some notes carry more than one thought, joined with \n by the
             transcription — respect those breaks instead of collapsing them. */
          white-space: pre-line;
        }
        .lines {
          flex: 1;
          overflow-y: auto;
          max-height: min(60vh, 640px);
          padding: 0.5rem 0.2rem;
          scroll-behavior: smooth;
        }
        .line {
          margin: 0;
          padding: 0.55rem 0.6rem;
          border-radius: 8px;
          color: var(--ink-dim);
          cursor: pointer;
          line-height: 1.5;
          transition: color 160ms ease, background 160ms ease;
          position: relative;
        }
        .line:hover {
          background: var(--field);
        }
        .line.active {
          color: var(--ink);
          background: var(--field);
          font-weight: 600;
        }
        .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-2);
          margin-left: 0.5rem;
          vertical-align: middle;
        }
        .jump {
          align-self: center;
          margin: 0.5rem 0;
          background: var(--accent);
          color: var(--deep);
          border: none;
          border-radius: 999px;
          padding: 0.35rem 0.9rem;
          font-size: 0.85em;
          cursor: pointer;
        }
        .transport {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-top: 0.75rem;
          margin-top: 0.5rem;
          border-top: var(--rule) solid var(--field-line);
        }
        .play {
          flex: none;
          width: 2.4rem;
          height: 2.4rem;
          border-radius: 50%;
          border: var(--rule) solid var(--field-line);
          background: var(--field);
          color: var(--ink);
          cursor: pointer;
          font-size: 0.9em;
        }
        .scrub {
          flex: 1;
          min-width: 0;
        }
        .time {
          flex: none;
          color: var(--ink-dim);
          font-size: 0.85em;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </section>
  );
}
