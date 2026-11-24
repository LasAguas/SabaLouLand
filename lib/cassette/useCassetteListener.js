// ---------------------------------------------------------------------------
// "Listen to my cassette": opens the microphone and runs the recogniser
// (lib/cassette/engine.mjs, in a Web Worker) on what it hears, so the page can
// follow a tape playing on a deck. Nothing is recorded, stored or sent — the
// sound goes microphone -> a worklet -> the worker and is gone. The only
// network use is one download of the reference file (pages/api/k/
// fingerprints.js), made while the browser's permission prompt is up.
//
//   const listen = useCassetteListener({ code, songs });
//   listen.supported        false where this can't work (no mic API, insecure page, no code)
//   listen.start()          call it from a tap — iOS only starts audio from a gesture
//   listen.stop()
//   listen.status           off | starting | listening | locked | paused | denied | error
//   listen.heard            { slug } of the song it's following, or null
//   listen.getPosition()    seconds into that song right now (a clock that runs between
//                           the worker's once-a-second corrections), or null
//
// Why it's built the way it is:
//   - The AudioContext is created, and resume()d, before anything is awaited:
//     Safari only lets a context start inside the tap that asked for it, and
//     awaiting the permission prompt first would use that up.
//   - echoCancellation / noiseSuppression / autoGainControl are off. They're
//     for speech; on music they gate and pump the very peaks that get matched.
//   - The worklet's output goes through a gain of 0 to the destination. A node
//     that isn't connected to anything is, in some browsers, never run.
//   - If no audio shows up within a few seconds the start is abandoned with a
//     message, rather than sitting on "starting…" for ever (what a suspended
//     context looks like on some phones).
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const CONSTRAINTS = {
  audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
};
const FIRST_AUDIO_WITHIN_MS = 5000;
// Audio that stops arriving for this long (seconds) is a gap, not a hiccup.
const GAP_SECONDS = 1;

// What to tell someone when it didn't work. The browser's own error text
// ("Not supported", "Could not start audio source") means nothing to a listener,
// so it goes to the console and they get a plain sentence.
function plainWords(err) {
  if (err && err.friendly) return err.friendly;
  switch (err && err.name) {
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      return "the microphone is blocked — allow it for this site in your browser's settings, then try again";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "NotSupportedError":
      return "no microphone found on this device";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "the microphone is busy — close anything else that's using it, then try again";
    default:
      return "couldn't start listening";
  }
}

function canListen() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof Worker !== "undefined" &&
    typeof AudioWorkletNode !== "undefined" &&
    Boolean(window.AudioContext || window.webkitAudioContext) &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  );
}

export function useCassetteListener({ code, songs }) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState("off");
  const [heard, setHeard] = useState(null);
  const [durations, setDurations] = useState(null);
  const [problem, setProblem] = useState("");
  const rig = useRef(null); // everything that has to be torn down
  const snap = useRef(null); // the worker's latest snapshot

  // each side of the tape in playing order, so the recogniser knows what follows what
  const order = useMemo(() => {
    const sides = [];
    for (const s of songs || []) {
      const key = s.side ?? "";
      let side = sides.find((x) => x.key === key);
      if (!side) sides.push((side = { key, slugs: [] }));
      side.slugs.push(s.slug);
    }
    return sides.map((x) => x.slugs);
  }, [songs]);

  // decided after mount, so the server's HTML and the first client render agree
  useEffect(() => {
    setSupported(Boolean(code) && canListen());
  }, [code]);

  const teardown = useCallback(() => {
    const r = rig.current;
    rig.current = null;
    snap.current = null;
    if (!r) return;
    clearTimeout(r.watchdog);
    try {
      r.worker?.terminate();
    } catch {}
    try {
      r.tap?.port.close();
      r.tap?.disconnect();
      r.src?.disconnect();
    } catch {}
    try {
      r.stream?.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      r.ctx?.close();
    } catch {}
    if (r.onVisible) document.removeEventListener("visibilitychange", r.onVisible);
  }, []);

  const stop = useCallback(() => {
    teardown();
    setStatus("off");
    setHeard(null);
    setProblem("");
  }, [teardown]);

  const fail = useCallback(
    (kind, message) => {
      teardown();
      setHeard(null);
      setProblem(message);
      setStatus(kind);
    },
    [teardown]
  );

  const start = useCallback(async () => {
    if (rig.current || !code) return;
    const mine = { chunks: 0 };
    rig.current = mine;
    setProblem("");
    setStatus("starting");
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      mine.ctx = ctx;
      ctx.resume().catch(() => {});

      // the reference file downloads while the permission prompt is open
      const reference = fetch("/api/k/fingerprints", { headers: { "x-kit-code": code } }).then((r) => {
        if (!r.ok) throw Object.assign(new Error(`reference file: ${r.status}`), { friendly: "couldn't load what's needed to recognise the songs — check your connection and try again" });
        return r.arrayBuffer();
      });
      reference.catch(() => {});

      const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
      if (rig.current !== mine) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mine.stream = stream;
      stream.getAudioTracks()[0]?.addEventListener("ended", () => {
        if (rig.current === mine) fail("error", "the microphone stopped — tap the microphone to start again");
      });

      await ctx.audioWorklet.addModule("/cassette-worklet.js");
      const db = await reference;
      if (rig.current !== mine) return;

      const worker = new Worker(new URL("./worker.js", import.meta.url));
      mine.worker = worker;
      worker.onmessage = (e) => {
        if (rig.current !== mine) return;
        const m = e.data;
        if (m.type === "snapshot") {
          snap.current = m.snapshot;
          const next = m.snapshot.state === "locked" ? "locked" : m.snapshot.state === "paused" ? "paused" : "listening";
          setStatus((prev) => (prev === next ? prev : next));
          const slug = m.snapshot.slug;
          setHeard((prev) => (prev && prev.slug === slug ? prev : slug ? { slug } : null));
        } else if (m.type === "ready") {
          setDurations(Object.fromEntries(m.tracks.map((t) => [t.slug, t.duration])));
        } else if (m.type === "error") {
          console.error("cassette listener:", m.message);
          fail("error", "something went wrong while listening — try again");
        }
      };
      worker.onerror = (e) => {
        console.error("cassette listener:", e && e.message);
        fail("error", "something went wrong while listening — try again");
      };
      worker.postMessage({ type: "init", db, rate: ctx.sampleRate, order }, [db]);

      const src = ctx.createMediaStreamSource(stream);
      const tap = new AudioWorkletNode(ctx, "cassette-tap");
      const mute = ctx.createGain();
      mute.gain.value = 0;
      src.connect(tap);
      tap.connect(mute);
      mute.connect(ctx.destination);
      mine.src = src;
      mine.tap = tap;
      // When was a chunk's last sample heard? Not "when it reached this thread" —
      // that wobbles whenever the page is busy (smooth scrolling, say) and
      // would wobble the lyrics with it. The audio's own sample count is a
      // perfectly steady clock; all that's needed is where it sits on the
      // page's clock. Chunks can arrive late but never early, so the least
      // lateness seen so far is the best estimate, nudged up a hair each
      // second so it can follow the two clocks drifting apart. If chunks
      // suddenly arrive a lot later than that, audio went missing (the phone
      // slept, a call came in): start the timeline afresh and say so.
      const rate = ctx.sampleRate;
      mine.samples = 0;
      mine.offset = null;
      mine.last = 0;
      tap.port.onmessage = (e) => {
        const now = performance.now() / 1000;
        mine.chunks++;
        mine.samples += e.data.length;
        const heardAt = mine.samples / rate;
        const lateness = now - heardAt;
        let gap = false;
        if (mine.offset == null) {
          mine.offset = lateness;
        } else {
          mine.offset += 1e-4 * (now - mine.last);
          if (lateness < mine.offset) mine.offset = lateness;
          else if (lateness - mine.offset > GAP_SECONDS) {
            gap = true;
            mine.offset = lateness;
          }
        }
        mine.last = now;
        worker.postMessage({ type: "audio", samples: e.data, t: heardAt + mine.offset, gap }, [e.data.buffer]);
      };

      mine.watchdog = setTimeout(() => {
        if (rig.current === mine && mine.chunks === 0) fail("error", "couldn't hear the microphone — try again");
      }, FIRST_AUDIO_WITHIN_MS);

      // coming back to the page after the phone slept: pick the microphone up again if the browser will
      mine.onVisible = () => {
        if (document.visibilityState !== "visible" || rig.current !== mine) return;
        if (mine.ctx.state !== "running") mine.ctx.resume().catch(() => {});
      };
      document.addEventListener("visibilitychange", mine.onVisible);

      setStatus((prev) => (prev === "starting" ? "listening" : prev));
    } catch (err) {
      if (rig.current !== mine) return;
      const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError" || err.name === "PermissionDeniedError");
      if (!denied) console.error("cassette listener:", err);
      fail(denied ? "denied" : "error", plainWords(err));
    }
  }, [code, order, fail]);

  // leaving the page lets go of the microphone
  useEffect(() => () => teardown(), [teardown]);

  const getPosition = useCallback(() => {
    const s = snap.current;
    if (!s || s.state === "listening") return null;
    return s.anchorPos + (performance.now() / 1000 - s.anchorT) * s.rate;
  }, []);

  const on = status === "starting" || status === "listening" || status === "locked" || status === "paused";
  return { supported, status, on, heard, durations, problem, start, stop, getPosition };
}
