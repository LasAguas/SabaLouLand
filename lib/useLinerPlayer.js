// ---------------------------------------------------------------------------
// The playback + lyric-sync engine behind the liner-notes designs in
// components/liner/. It owns everything that isn't looks: which song is on,
// the <audio> element's state, which line is "current", and keeping that line
// scrolled into view. The designs only decide how it's drawn.
//
// Same sync idea as components/LyricsPlayer.js: every animation frame while
// playing, ask the <audio> element what second it's on and binary-search the
// lines for the last one whose `t` has passed, nudged LEAD_SECONDS into the
// future so a highlight lands just before the ear expects it.
//
// What's new compared with LyricsPlayer:
//   - one <audio> element for the whole album, so the next song can start on
//     its own when one ends (a fresh element per song can't, on iPhones)
//   - prev / next, and a track list the designs hide behind a menu
//   - the list scrolls itself (never the page), and only a real wheel / touch /
//     key press counts as "the listener scrolled" — a long smooth auto-scroll
//     can't be mistaken for one
//   - the clock the UI shows ticks 4x a second instead of 60x, so a big list of
//     annotated lines isn't re-rendered every frame
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LEAD_SECONDS = 0.15;
const RESUME_AUTO_FOLLOW_AFTER_MS = 3500;
// A silence this long between two lines is an instrumental break; the designs
// open a little extra space there.
const INTERLUDE_GAP_SECONDS = 12;
// Back-to-start threshold for the "previous" button, same as every music app.
const RESTART_INSTEAD_OF_PREV_AFTER = 3;

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

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

/**
 * Lines → groups. The commentary repeats one note across every line of the
 * block it's about (see content/lyrics/drafts/README.md), so a design that drew
 * a note per line would print the same paragraph two or three times in a row.
 * Consecutive lines carrying identical note text become one group; everything
 * else is a group of one.
 *
 *   { key, note: string | null, gap: boolean, lines: [{ line, index }] }
 *
 * `index` is the line's position in the song, which is what activeIndex and
 * seekToLine speak in.
 */
export function groupLines(lines, notes) {
  const groups = [];
  lines.forEach((line, index) => {
    const note = line.note ? notes?.[line.note]?.body ?? null : null;
    const gap = index > 0 && line.t - lines[index - 1].t >= INTERLUDE_GAP_SECONDS;
    const prev = groups[groups.length - 1];
    if (note && prev && prev.note === note && !gap) {
      prev.lines.push({ line, index });
    } else {
      groups.push({ key: line.id, note, gap, lines: [{ line, index }] });
    }
  });
  return groups;
}

/**
 * Open / close state for a track menu, plus the two manners every menu owes:
 * Escape closes it, and focus goes in when it opens and back to the button
 * that opened it when it closes.
 */
export function useMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus?.();
  }, []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const panel = panelRef.current;
    panel?.querySelector('[aria-current="true"], button')?.focus?.();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return { open, close, toggle, triggerRef, panelRef };
}

export function useLinerPlayer(songs) {
  const [songIndex, setSongIndex] = useState(0);
  const song = songs[songIndex];
  const lines = song.lines;
  const groups = useMemo(() => groupLines(lines, song.notes), [lines, song.notes]);

  const audioRef = useRef(null);
  const listElRef = useRef(null);
  const lineEls = useRef(new Map());
  const lineRefCache = useRef(new Map());
  const activeIndexRef = useRef(-1);
  const manualUntilRef = useRef(0);
  const playOnLoadRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [autoFollow, setAutoFollow] = useState(true);
  const [error, setError] = useState(false);

  const activeLine = lines[activeIndex] ?? null;
  const activeGroupIndex = useMemo(
    () => (activeIndex < 0 ? -1 : groups.findIndex((g) => g.lines.some((l) => l.index === activeIndex))),
    [groups, activeIndex]
  );
  const activeGroup = groups[activeGroupIndex] ?? null;

  // ---- scrolling the list ---------------------------------------------------
  // Scrolls the list itself rather than calling scrollIntoView, which would
  // also drag the page (or a parent) along with it. The list's data-anchor is
  // where in its height the current line should rest: 0.5 centres it, a lower
  // number leaves room beneath for something that overlays the bottom, a
  // higher one room above.
  const scrollToLine = useCallback((index, behavior) => {
    const list = listElRef.current;
    if (!list) return;
    const el = lineEls.current.get(index);
    if (!el) {
      if (index < 0) list.scrollTo({ top: 0, behavior });
      return;
    }
    // A design can mark its groups with data-scroll-group, so the whole group
    // (lines and their note) is what comes to rest at the anchor rather than
    // just the one line — unless the group is too tall for that to leave the
    // line itself comfortably in view.
    const group = el.closest("[data-scroll-group]");
    const target = group && group.offsetHeight <= list.clientHeight * 0.7 ? group : el;
    const anchor = Number.parseFloat(list.dataset.anchor ?? "0.5");
    const listTop = list.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    const want = list.clientHeight * anchor - target.offsetHeight / 2;
    list.scrollTo({ top: list.scrollTop + (targetTop - listTop) - want, behavior });
  }, []);

  // Attaching the list (first render, or after a design switch) puts it on the
  // current line straight away instead of at the top.
  const listRef = useCallback(
    (node) => {
      listElRef.current = node;
      if (node) requestAnimationFrame(() => scrollToLine(activeIndexRef.current, "auto"));
    },
    [scrollToLine]
  );

  const lineRef = useCallback((index) => {
    let fn = lineRefCache.current.get(index);
    if (!fn) {
      fn = (el) => {
        if (el) lineEls.current.set(index, el);
        else lineEls.current.delete(index);
      };
      lineRefCache.current.set(index, fn);
    }
    return fn;
  }, []);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    if (activeIndex < 0 || Date.now() < manualUntilRef.current) return;
    setAutoFollow(true);
    scrollToLine(activeIndex, "smooth");
  }, [activeIndex, scrollToLine]);

  // The listener took over the scroll. A real wheel / touch-drag / key press
  // says so; the programmatic smooth scroll above never fires any of them.
  const noteUserScroll = useCallback(() => {
    manualUntilRef.current = Date.now() + RESUME_AUTO_FOLLOW_AFTER_MS;
    setAutoFollow(false);
  }, []);

  const onListKeyDown = useCallback(
    (e) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
        noteUserScroll();
      }
    },
    [noteUserScroll]
  );

  const jumpToNow = useCallback(() => {
    manualUntilRef.current = 0;
    setAutoFollow(true);
    scrollToLine(activeIndexRef.current, "smooth");
  }, [scrollToLine]);

  // ---- the clock --------------------------------------------------------------
  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    let lastQuarter = -1;
    const tick = () => {
      const audio = audioRef.current;
      if (audio) {
        const t = audio.currentTime;
        const quarter = Math.floor(t * 4);
        if (quarter !== lastQuarter) {
          lastQuarter = quarter;
          setCurrentTime(t);
        }
        const idx = activeLineIndex(lines, t + LEAD_SECONDS);
        setActiveIndex((prev) => (prev === idx ? prev : idx));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, lines]);

  // Paused, or just after a scrub: the coarser native events are enough.
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

  // ---- songs --------------------------------------------------------------------
  const goTo = useCallback(
    (index, { play = true } = {}) => {
      if (index < 0 || index >= songs.length) return;
      playOnLoadRef.current = play;
      manualUntilRef.current = 0;
      setSongIndex(index);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setActiveIndex(-1);
      setAutoFollow(true);
      setError(false);
    },
    [songs.length]
  );

  // The <audio> is in the server-rendered HTML, so the browser can finish
  // loading its metadata (or fail to) before React has attached onLoadedMetadata
  // / onError — and those events don't replay. Read where it got to on mount.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.readyState >= 1 && Number.isFinite(audio.duration)) setDuration(audio.duration);
    if (audio.error) setError(true);
  }, []);

  // The new <audio src> has been committed by now; start it if asked to.
  useEffect(() => {
    listElRef.current?.scrollTo({ top: 0, behavior: "auto" });
    if (!playOnLoadRef.current) return;
    playOnLoadRef.current = false;
    audioRef.current?.play().catch(() => {});
  }, [songIndex]);

  const next = useCallback(() => goTo(songIndex + 1), [goTo, songIndex]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (songIndex === 0 || (audio && audio.currentTime > RESTART_INSTEAD_OF_PREV_AFTER)) {
      if (audio) audio.currentTime = 0;
      return;
    }
    goTo(songIndex - 1);
  }, [goTo, songIndex]);

  // ---- transport ----------------------------------------------------------------
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, []);

  const scrubTo = useCallback((t) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(t)) return;
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  const seekToLine = useCallback(
    (index) => {
      const audio = audioRef.current;
      const line = lines[index];
      if (!audio || !line) return;
      audio.currentTime = line.t;
      manualUntilRef.current = 0;
      setAutoFollow(true);
      setCurrentTime(line.t);
      setActiveIndex(index);
      if (audio.paused) audio.play().catch(() => {});
    },
    [lines]
  );

  const audioProps = {
    ref: audioRef,
    src: song.audioUrl,
    preload: "metadata",
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onLoadedMetadata: (e) => setDuration(e.currentTarget.duration),
    onError: () => setError(true),
    onEnded: () => {
      setPlaying(false);
      if (songIndex < songs.length - 1) goTo(songIndex + 1);
    },
  };

  // ---- the lock screen, and the screen staying on ------------------------------
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: song.title,
      artist: "Saba Lou",
      album: "Nothing But Love",
    });
  }, [song]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => audioRef.current?.play().catch(() => {}));
    ms.setActionHandler("pause", () => audioRef.current?.pause());
    ms.setActionHandler("seekto", (d) => {
      if (audioRef.current && d.seekTime != null) audioRef.current.currentTime = d.seekTime;
    });
    ms.setActionHandler("previoustrack", prev);
    ms.setActionHandler("nexttrack", songIndex < songs.length - 1 ? next : null);
  }, [prev, next, songIndex, songs.length]);

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

  return {
    // what's on
    songs,
    song,
    songIndex,
    lines,
    groups,
    activeIndex,
    activeLine,
    activeGroupIndex,
    activeGroup,
    // clock
    playing,
    duration,
    currentTime,
    progress: duration > 0 ? Math.min(1, currentTime / duration) : 0,
    error,
    // actions
    goTo,
    next,
    prev,
    hasNext: songIndex < songs.length - 1,
    togglePlay,
    scrubTo,
    seekToLine,
    // the scrolling list — spread listProps on the scroll container and
    // pass lineRef(i) as the ref of each line
    autoFollow,
    jumpToNow,
    lineRef,
    listProps: {
      ref: listRef,
      onWheel: noteUserScroll,
      onTouchMove: noteUserScroll,
      onKeyDown: onListKeyDown,
      tabIndex: 0,
    },
    noteUserScroll,
    // spread onto the one <audio> element the page renders
    audioProps,
  };
}
