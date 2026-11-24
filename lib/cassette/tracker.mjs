// ---------------------------------------------------------------------------
// Turns the matcher's once-a-second answers into one steady idea of "this song,
// this far in" — and knows when it doesn't know.
//
// A matcher answer on its own is a poor thing to show people. Measured on real
// cassette recordings, a *right* answer scores anywhere from 20 to 180 votes
// depending on the passage (a loud, dense bit of a song, or a quiet intro, or
// the deck wandering a few percent off speed for a few seconds), while the best
// *wrong* answer anywhere on the album reaches 40+ every so often. No single
// threshold separates them. What does is knowing what to expect:
//
//   - Once a song is locked, ask only "is it still where it should be?" — one
//     place out of ~40,000 — and a score of 24 is already convincing (a wrong
//     place reaches that about 0.4% of the time; the right one clears it ~93%
//     of the time, including the weak stretches a global threshold throws away).
//   - When a song reaches its end, the next one on that side of the tape is
//     coming. Ask "is it starting about now?" and a score of 26, twice, is
//     enough — a quiet intro that took 28 s to find from scratch took 9.
//   - The deck's speed barely changes between songs, so once it's known,
//     a candidate at +6% is noise, not a song.
//
// Only a match that nothing expected has to clear the full global bar
// (scoreNeeded() in fingerprint.mjs), and even then it must repeat, or be
// strong (1.6x), before the page believes it.
//
// States:
//   listening   nothing is known. Waiting for a match nobody asked for.
//   locked      a song and a place in it; position(t) runs on a clock that each
//               supporting answer nudges back to the truth.
//   paused      locked, but the room went quiet — the deck was stopped or
//               paused. The place is frozen until the sound comes back.
// ---------------------------------------------------------------------------
import { makeSpeeds, scoreNeeded } from "./fingerprint.mjs";

export const TRACKER = {
  contScore: 24, // "still where it should be": votes needed at the expected place
  nextScore: 26, // "the next song is starting": votes needed, twice
  nextHits: 2,
  strong: 1.6, // x the global threshold: believed at once, no repeat needed
  lostAfter: 12, // seconds with no support before letting go (mid-song in clean playback it never passes ~2; noise stretches it)
  endSlack: 2, // seconds past a song's end before it counts as over
  endGuard: 25, // the last this-many seconds of a song may fade to nothing; that's not a pause
  pauseDb: 14, // quieter than the music by this much...
  pauseAfter: 3, // ...for this many analyses in a row means the deck stopped
  resumeDb: 9, // louder than (music - this) means it's playing again
  pausedMax: 90, // a deck stopped this long (s) is forgotten
  nextSpanBefore: 1.5, // the next song may start this far before the end I expect...
  nextSpanAfter: 8, // ...or this long after
  nextForget: 45, // stop expecting a next song this long after the end
  hop: 1, // seconds between analyses
  rateMin: 0.94,
  rateMax: 1.06,
};

const GRID = makeSpeeds(0.94, 1.06, 0.01);

export class Tracker {
  /**
   * tracks: db.tracks. order: [[slug, ...], ...] — the songs of each side of
   * the tape in playing order, so the song after this one is known.
   */
  constructor({ tracks, order = [], config = {} }) {
    this.cfg = { ...TRACKER, ...config };
    this.tracks = tracks;
    this.nextOf = new Map();
    for (const side of order) {
      const ids = side.map((slug) => tracks.findIndex((t) => t.slug === slug));
      for (let i = 0; i + 1 < ids.length; i++) if (ids[i] >= 0 && ids[i + 1] >= 0) this.nextOf.set(ids[i], ids[i + 1]);
    }
    this.reset();
  }

  reset() {
    this.state = "listening";
    this.lock = null;
    this.hist = [];
    this.cand = null;
    this.challenger = null;
    this.lastEnd = null;
    this.deckRate = null;
    this.musicDb = null;
    this.quiet = 0;
    this.nextHits = [];
    this.analyses = 0;
    this.frozen = null;
    this.mask = null;
    this.lvl = -120;
  }

  /** Audio older than this (in the clock the analyses use) shouldn't be listened to. */
  maskBefore() {
    return this.mask;
  }

  // ---------------------------------------------------------------- queries --
  posAt(t) {
    const L = this.lock;
    if (!L) return null;
    if (this.state === "paused") return this.frozen.pos;
    return L.pA + (t - L.tA) * L.rate;
  }

  /** What the page needs to run its clock between analyses. rate is 0 when paused. */
  snapshot() {
    const L = this.lock;
    if (!L) return { state: "listening", track: -1, slug: null, anchorT: 0, anchorPos: 0, rate: 0, duration: 0, supports: 0, since: 0 };
    const paused = this.state === "paused";
    return {
      state: this.state,
      track: L.track,
      slug: this.tracks[L.track].slug,
      anchorT: paused ? this.frozen.t : L.tA,
      anchorPos: paused ? this.frozen.pos : L.pA,
      rate: paused ? 0 : L.rate,
      duration: this.tracks[L.track].duration,
      supports: L.supports,
      since: L.since,
    };
  }

  // The tape speeds worth trying for a whole match. A settled lock only needs
  // the few around its own speed; every fifth analysis still tries them all,
  // which is how a skip to another song is noticed.
  speedsFor() {
    const L = this.lock;
    if (this.state === "locked" && L.supports >= 4 && this.analyses % 5 !== 0) return this.near(L.rate);
    return null;
  }

  // The grid speeds within `span` of a rate — never fewer than three, even for a
  // rate off the ends of the grid.
  near(rate, span = 0.031) {
    const centre = clamp(rate, GRID[0] + 0.011, GRID[GRID.length - 1] - 0.011);
    return GRID.filter((r) => Math.abs(r - centre) <= span);
  }

  probeSpeeds() {
    const rate = this.lock ? this.lock.rate : this.deckRate;
    return rate ? this.near(rate, 0.041) : null;
  }

  /** The places to ask the matcher about for the window that ends at t. */
  hypotheses(t) {
    const out = [];
    const sp = this.probeSpeeds();
    const L = this.lock;
    if (this.state === "locked") {
      const tol = L.rescueUntil > t ? 6 : Math.min(1.2, 0.45 + 0.2 * Math.max(0, t - L.lastSupport));
      out.push({ id: "cont", track: L.track, posEnd: this.posAt(t), tol, ...(sp ? { speeds: sp } : {}) });
    }
    const nx = this.nextExpected(t);
    if (nx) out.push({ id: "next", ...nx, ...(sp ? { speeds: sp } : {}) });
    return out;
  }

  // Where the end of the window would sit if the next song on the tape began
  // somewhere in the usual gap after this one's end.
  nextExpected(t) {
    const c = this.cfg;
    let track = -1;
    let tEnd = null;
    let rate = this.deckRate || 1;
    if (this.state === "locked") {
      const L = this.lock;
      const dur = this.tracks[L.track].duration;
      if (this.posAt(t) < dur - 30) return null;
      track = this.nextOf.get(L.track) ?? -1;
      tEnd = L.tA + (dur - L.pA) / L.rate;
      rate = L.rate;
    } else if (this.lastEnd) {
      track = this.nextOf.get(this.lastEnd.track) ?? -1;
      tEnd = this.lastEnd.tEnd;
    }
    if (track < 0 || tEnd == null || t - tEnd > c.nextForget) return null;
    const hi = (t - (tEnd - c.nextSpanBefore)) * rate;
    const lo = Math.max(0, (t - (tEnd + c.nextSpanAfter)) * rate);
    if (hi < 1.5) return null; // not started yet
    return { track, posEnd: (lo + hi) / 2, tol: Math.max(1, (hi - lo) / 2) };
  }

  // --------------------------------------------------------------- feeding --
  /** One analysis from the Listener: { t, seconds, level, res }. */
  update(a) {
    this.analyses++;
    const c = this.cfg;
    const t = a.t;
    const lvl = a.level > 1e-6 ? 20 * Math.log10(a.level) : -120;
    this.lvl = lvl;
    const res = a.res;
    const need = scoreNeeded(a.seconds);
    const G = res && res.track >= 0 && res.score >= need ? res : null;
    const Pc = res && res.probes ? res.probes.cont : null;
    const Pn = res && res.probes ? res.probes.next : null;

    if (this.state === "locked") this.whileLocked(t, lvl, G, Pc, Pn, need);
    else if (this.state === "paused") this.whilePaused(t, lvl, G, a.seconds);
    else this.whileListening(t, G, Pn, need);

    if (this.lastEnd && t - this.lastEnd.tEnd > c.nextForget) this.lastEnd = null;
  }

  whileLocked(t, lvl, G, Pc, Pn, need) {
    const c = this.cfg;
    const L = this.lock;
    const pred = this.posAt(t);
    const dur = this.tracks[L.track].duration;

    // The tail of the window is far quieter than the music: the deck has stopped
    // (or the song is fading out, which isn't a stop, so the last stretch of a
    // song is exempt). While it's quiet, a match proves nothing about *now* —
    // it's the last few seconds of music still sitting in the window, and a
    // match extrapolates them forward as if the tape had kept playing.
    const quietNow = pred < dur - c.endGuard && this.musicDb != null && lvl < this.musicDb - c.pauseDb;
    if (quietNow) {
      this.quiet++;
      if (this.quiet >= c.pauseAfter) {
        // the music stopped somewhere in the second before the first quiet analysis
        const tStop = t - (this.quiet - 1) * c.hop - 0.75;
        this.frozen = { t, pos: Math.max(0, this.posAt(tStop)), since: t, tStop };
        this.state = "paused";
        return;
      }
    } else {
      this.quiet = 0;
    }

    // a global match that just agrees with the clock
    const agrees = G && G.track === L.track && Math.abs(G.posEnd - pred) <= 1.6;
    let supported = false;
    if (!quietNow) {
      const needCont = L.rescueUntil > t ? c.contScore + 2 : c.contScore;
      if (Pc && Pc.score >= needCont) {
        this.support(t, Pc.posEnd, Pc.speed);
        supported = true;
      } else if (agrees) {
        this.support(t, G.posEnd, G.speed);
        supported = true;
      }
    }

    if (supported) {
      this.challenger = null;
      if (lvl > -100) this.musicDb = this.musicDb == null ? lvl : this.musicDb + 0.25 * (lvl - this.musicDb);
    } else if (G && !agrees) {
      // not gated on the level: a convincing match somewhere *else* is its own
      // evidence. (The quiet gate only distrusts matches that agree with the clock,
      // because those are what a stopped tape's leftover audio produces.)
      this.challenge(G, t, need);
      if (this.state !== "locked") return;
    }

    // the next song, coming in early
    const want = this.nextTrackExpected(L.track);
    if (Pn && Pn.score >= c.nextScore && want >= 0 && !quietNow) {
      if (this.takeNextHit(t, Pn, want)) return;
    }

    // the song ran out
    if (this.posAt(t) > dur + c.endSlack) {
      this.endLock(t, L.track, L.tA + (dur - L.pA) / L.rate);
      return;
    }

    if (t - L.lastSupport > c.lostAfter) this.loseLock(t);
  }

  whilePaused(t, lvl, G, seconds) {
    const c = this.cfg;
    // Matches are ignored while the window still holds music from before the stop:
    // it gets extrapolated to a position the tape never reached. Once the whole
    // window is newer than the stop, though, a convincing match is real — it's what
    // happens when the phone was just moved away from the deck (quieter, but
    // still plainly the music) rather than the deck stopping.
    if (G && t - seconds > this.frozen.tStop) {
      this.startLock(G.track, G.posEnd, G.speed, t);
      return;
    }
    if (t - this.frozen.since > c.pausedMax) {
      this.loseLock(t);
      return;
    }
    if (this.musicDb != null && lvl >= this.musicDb - c.resumeDb) {
      const L = this.lock;
      // The tape carries on from where it stopped — or, if that was just a silent
      // bar, from further on — so look wide for a while. The sound came back
      // within the last half second.
      L.tA = t - 0.25;
      L.pA = this.frozen.pos;
      L.lastSupport = t;
      L.rescueUntil = t + 12;
      this.hist = []; // positions before the stop say nothing about the speed after it
      this.mask = t - 0.5; // what the window holds from before the stop isn't where the tape is now
      this.state = "locked";
      this.quiet = 0;
      this.frozen = null;
    }
  }

  whileListening(t, G, Pn, need) {
    const c = this.cfg;
    if (G && this.plausible(G, need)) {
      const agrees =
        this.cand &&
        this.cand.track === G.track &&
        t - this.cand.t <= 4 &&
        Math.abs(G.posEnd - this.cand.posEnd - (t - this.cand.t) * G.speed) < 1.0;
      if (G.score >= c.strong * need || agrees) {
        this.startLock(G.track, G.posEnd, G.speed, t);
        return;
      }
      this.cand = { track: G.track, posEnd: G.posEnd, t };
    } else if (this.cand && t - this.cand.t > 4) {
      this.cand = null;
    }
    if (this.lastEnd && Pn && Pn.score >= c.nextScore) {
      const want = this.nextOf.get(this.lastEnd.track) ?? -1;
      if (want >= 0) this.takeNextHit(t, Pn, want);
    }
  }

  // ----------------------------------------------------------------- moves --
  plausible(G, need) {
    if (this.deckRate == null) return true;
    return Math.abs(G.speed - this.deckRate) <= 0.045 || G.score >= this.cfg.strong * need;
  }

  nextTrackExpected(track) {
    return this.nextOf.get(track) ?? -1;
  }

  // Two answers in a row that agree about where the next song is.
  takeNextHit(t, Pn, track) {
    const prev = this.nextHits[this.nextHits.length - 1];
    if (prev && t - prev.t <= 4 && Math.abs(Pn.posEnd - prev.posEnd - (t - prev.t) * (this.deckRate || 1)) < 1.5) {
      this.nextHits.push({ t, posEnd: Pn.posEnd, speed: Pn.speed });
    } else {
      this.nextHits = [{ t, posEnd: Pn.posEnd, speed: Pn.speed }];
    }
    if (this.nextHits.length >= this.cfg.nextHits) {
      this.startLock(track, Pn.posEnd, Pn.speed, t);
      return true;
    }
    return false;
  }

  startLock(track, pos, speed, t) {
    this.lock = {
      track,
      tA: t,
      pA: pos,
      rate: clamp(speed, this.cfg.rateMin, this.cfg.rateMax),
      lastSupport: t,
      supports: 1,
      since: t,
      rescueUntil: 0,
    };
    this.hist = [[t, pos]];
    this.state = "locked";
    this.cand = null;
    this.challenger = null;
    this.nextHits = [];
    this.quiet = 0;
    this.lastEnd = null;
    this.frozen = null;
    // what this song sounds like at the microphone is now the yardstick for "quiet"
    if (this.lvl > -100) this.musicDb = this.lvl;
    this.deckRate = this.deckRate == null ? this.lock.rate : this.deckRate + 0.5 * (this.lock.rate - this.deckRate);
  }

  // The expected place got a convincing answer: nudge the clock to it, and
  // re-measure the deck's speed from how the answers have moved.
  support(t, pos, speed) {
    const L = this.lock;
    const pred = this.posAt(t);
    const e = pos - pred;
    if (Math.abs(e) > 0.8) this.hist = []; // the tape jumped; what came before can't be fitted to what comes after
    L.pA = Math.abs(e) < 0.3 ? pred + 0.6 * e : pos;
    L.tA = t;
    L.lastSupport = t;
    L.supports++;
    this.hist.push([t, pos]);
    while (this.hist.length && t - this.hist[0][0] > 25) this.hist.shift();
    const slope = regressSlope(this.hist);
    // a fitted speed far from what the matcher itself measured is a bad fit, not a fast deck
    const fitted = slope != null && Math.abs(slope - speed) < 0.04 ? slope : speed;
    L.rate = clamp(fitted, this.cfg.rateMin, this.cfg.rateMax);
    this.deckRate = this.deckRate == null ? L.rate : this.deckRate + 0.1 * (L.rate - this.deckRate);
  }

  // Someone else got a convincing global answer while the expected place didn't:
  // believe it if it's strong, or if it's the second time.
  challenge(G, t, need) {
    const ch = this.challenger;
    const agrees = ch && ch.track === G.track && t - ch.t <= 6 && Math.abs(G.posEnd - ch.posEnd - (t - ch.t) * G.speed) < 1.0;
    if (G.score >= this.cfg.strong * need || agrees) {
      this.startLock(G.track, G.posEnd, G.speed, t);
      return;
    }
    this.challenger = { track: G.track, posEnd: G.posEnd, t };
  }

  endLock(t, track, tEnd) {
    this.lastEnd = { track, tEnd };
    this.lock = null;
    this.state = "listening";
    this.hist = [];
    this.nextHits = [];
    this.challenger = null;
    this.quiet = 0;
  }

  loseLock(t) {
    const L = this.lock;
    const dur = L ? this.tracks[L.track].duration : 0;
    // lost near the end of a song: the next one is probably what's coming
    if (L && this.posAt(t) > dur - 40 && this.state !== "paused") this.lastEnd = { track: L.track, tEnd: L.tA + (dur - L.pA) / L.rate };
    this.lock = null;
    this.state = "listening";
    this.hist = [];
    this.nextHits = [];
    this.challenger = null;
    this.quiet = 0;
  }
}

function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

// Slope of position against time, if there's enough spread to trust it.
function regressSlope(pts) {
  if (pts.length < 6 || pts[pts.length - 1][0] - pts[0][0] < 15) return null;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const [x, y] of pts) {
    sx += x;
    sy += y;
    sxx += x * x;
    sxy += x * y;
  }
  const n = pts.length;
  const den = n * sxx - sx * sx;
  return den > 1e-6 ? (n * sxy - sx * sy) / den : null;
}
