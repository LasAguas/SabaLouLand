// ---------------------------------------------------------------------------
// The recogniser's home: a Web Worker, so working out what's playing never
// competes with the page for the main thread. The page sends it the reference
// file once ("init"), then every chunk the microphone hears ("audio"); it
// answers with a snapshot after each analysis (about once a second).
//
//   page -> worker   { type: "init", db: ArrayBuffer, rate, order }
//                    { type: "audio", samples: Float32Array, t, gap? }
//                          t: seconds on the page's clock, when the chunk's last sample was heard;
//                          gap: true when audio went missing just before this chunk
//                    { type: "reset" }
//   worker -> page   { type: "ready", tracks: [{ slug, duration }] }
//                    { type: "snapshot", snapshot, level, t, ms }   ms: how long the analysis took
//                    { type: "error", message }
//
// All of the actual work is in engine.mjs, which scripts/cassette-probe.mjs
// runs too — so a recording behaves the same in the probe as on a phone.
// ---------------------------------------------------------------------------
import { deserializeDB } from "./fingerprint.mjs";
import { Engine } from "./engine.mjs";

let engine = null;

self.onmessage = (e) => {
  const m = e.data;
  try {
    if (m.type === "init") {
      const db = deserializeDB(m.db);
      engine = new Engine(db, { inRate: m.rate, order: m.order });
      self.postMessage({ type: "ready", tracks: db.tracks.map(({ slug, duration }) => ({ slug, duration })) });
    } else if (m.type === "audio" && engine) {
      if (m.gap) engine.listener.reset();
      for (const { analysis, snapshot } of engine.push(m.samples, m.t)) {
        self.postMessage({ type: "snapshot", snapshot, level: analysis.level, t: analysis.t, ms: analysis.ms });
      }
    } else if (m.type === "reset" && engine) {
      engine.tracker.reset();
    }
  } catch (err) {
    self.postMessage({ type: "error", message: String((err && err.message) || err) });
  }
};
