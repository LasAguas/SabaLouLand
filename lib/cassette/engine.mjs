// ---------------------------------------------------------------------------
// The listening engine: what the page's Web Worker runs, and what
// scripts/cassette-probe.mjs replays a recording through, so what a recording
// does in the probe is what a phone will do.
//
//   microphone chunks -> Listener (resample, last 8 s, landmarks, match)
//                     -> Tracker  (which song, where, still there?)
//                     -> a snapshot the page's clock runs on
// ---------------------------------------------------------------------------
import { Listener } from "./fingerprint.mjs";
import { Tracker } from "./tracker.mjs";

export class Engine {
  /**
   * db: from deserializeDB(). inRate: the microphone's sample rate.
   * order: [[slug, ...], ...] — each side of the tape, in playing order.
   */
  constructor(db, { inRate, order = [], windowSec = 8, config } = {}) {
    this.db = db;
    this.listener = new Listener(db, { inRate, windowSec });
    this.tracker = new Tracker({ tracks: db.tracks, order, config });
    this.listener.hypotheses = (t) => this.tracker.hypotheses(t);
    this.listener.speedsFor = () => this.tracker.speedsFor();
    this.listener.maskBefore = () => this.tracker.maskBefore();
  }

  /** Feed a chunk; returns one { analysis, snapshot } per analysis it triggered. */
  push(chunk, t) {
    const out = [];
    for (const analysis of this.listener.push(chunk, t)) {
      this.tracker.update(analysis);
      out.push({ analysis, snapshot: this.tracker.snapshot() });
    }
    return out;
  }

  snapshot() {
    return this.tracker.snapshot();
  }
}
