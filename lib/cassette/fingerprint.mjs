// ---------------------------------------------------------------------------
// Hearing which song a cassette is playing, and where in it — with no service,
// no API and nothing sent anywhere. This file is the whole recogniser; it has
// no dependencies and touches no browser or Node API, so the same code runs in
// the page's Web Worker, in scripts/build-fingerprints.mjs (which makes the
// reference file) and in scripts/cassette-probe.mjs (which replays a phone
// recording through it).
//
// The idea is the one Shazam started from, made easier by the fact that this
// is a closed set — eleven songs, and we own the exact audio:
//
//   1. Turn audio into a spectrogram and keep only its "peaks": the handful of
//      time/pitch points that stand out from their surroundings. Those survive
//      a small speaker, a room, hiss and a phone mic far better than the
//      waveform does.
//   2. Pair each peak with a few peaks that follow it within a second. A pair
//      is (pitch 1, pitch 2, gap) — a "landmark" that is rare in the album, so
//      finding one says a lot.
//   3. The reference file stores every landmark of every song with the moment
//      in that song it happened. To listen, do the same to what the mic hears,
//      look each landmark up, and let every hit vote for "the song started N
//      seconds before now". A real match makes one N collect dozens of votes.
//
// What makes it work for a *cassette* (decks run a few percent off speed,
// which shifts every pitch and stretches every gap, and which breaks the plain
// version of this): the query is searched at 13 tape speeds, 0.94x to 1.06x,
// by rescaling the heard peaks' pitches and times before hashing. The speed
// that wins is also the deck's real speed, so the lyric clock doesn't drift.
// ---------------------------------------------------------------------------

export const CFG = {
  // --- how audio becomes landmarks. Stored in the reference file's header and
  // read back from it, so a re-tune can never leave the page and the file
  // disagreeing about geometry.
  sr: 8000, // working sample rate; everything here lives below 4 kHz
  nfft: 1024, // 128 ms window, 7.8 Hz bins
  hop: 256, // 32 ms between frames
  fMin: 150,
  fMax: 3600,
  floorHalf: 40, // bins either side that set a frame's local "floor"
  nbF: 10, // a peak is the loudest thing within +-nbF bins ...
  nbT: 6, //   ... and +-nbT frames
  minProm: 6, // and at least this many dB above the local floor
  bpo: 24, // pitch resolution of a landmark, in bins per octave
  dtMin: 0.08, // a landmark pairs a peak with ones this soon after it ...
  dtMax: 1.2, //   ... up to this long after
  dtRes: 0.032, // gap resolution, seconds
  fanOut: 4, // reference side: pairs kept per peak (the query tries them all)

  // --- how a query is searched (code only; not stored in the file)
  dtTol: 1, // look up gap +-1 step too, peak times wobble a frame
  binW: 0.064, // vote histogram resolution, seconds
  weight: "sqrt", // a vote counts 1/sqrt(how many reference entries share its hash)
  speeds: makeSpeeds(0.94, 1.06, 0.01),
};

export const GEOMETRY_KEYS = [
  "sr", "nfft", "hop", "fMin", "fMax", "floorHalf", "nbF", "nbT", "minProm", "bpo", "dtMin", "dtMax", "dtRes", "fanOut",
];

export function makeSpeeds(lo, hi, step) {
  const out = [];
  for (let r = lo; r <= hi + step / 10; r += step) out.push(Math.round(r * 10000) / 10000);
  return out;
}

// What a vote total has to reach before a match is believed *on its own*, by
// how many seconds of audio it came from. Set from the strongest score that
// audio not on the album (room noise, hiss, speech, the album at a speed
// nowhere near a tape's) reached, plus a margin. The tracker (tracker.mjs)
// uses far lower bars wherever it already knows where to look, so this is only
// the bar for a match nobody expected. scripts/cassette-probe.mjs replays a
// recording against it. Linear between rows.
export const ACCEPT = [
  [3, 40],
  [5, 42],
  [8, 45],
  [12, 50],
];

export function scoreNeeded(seconds, table = ACCEPT) {
  if (seconds <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (seconds <= table[i][0]) {
      const [x0, y0] = table[i - 1];
      const [x1, y1] = table[i];
      return y0 + ((y1 - y0) * (seconds - x0)) / (x1 - x0);
    }
  }
  return table[table.length - 1][1];
}

// ----------------------------------------------------------------- FFT ----
const fftCache = new Map();
function getFFT(n) {
  if (fftCache.has(n)) return fftCache.get(n);
  const levels = Math.round(Math.log2(n));
  const cos = new Float64Array(n / 2);
  const sin = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    cos[i] = Math.cos((2 * Math.PI * i) / n);
    sin[i] = Math.sin((2 * Math.PI * i) / n);
  }
  const rev = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    let x = i;
    let y = 0;
    for (let b = 0; b < levels; b++) {
      y = (y << 1) | (x & 1);
      x >>= 1;
    }
    rev[i] = y;
  }
  const fft = (re, im) => {
    for (let i = 0; i < n; i++) {
      const j = rev[i];
      if (j > i) {
        let t = re[i];
        re[i] = re[j];
        re[j] = t;
        t = im[i];
        im[i] = im[j];
        im[j] = t;
      }
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + half; j++, k += step) {
          const l = j + half;
          const tre = re[l] * cos[k] + im[l] * sin[k];
          const tim = -re[l] * sin[k] + im[l] * cos[k];
          re[l] = re[j] - tre;
          im[l] = im[j] - tim;
          re[j] += tre;
          im[j] += tim;
        }
      }
    }
  };
  fftCache.set(n, fft);
  return fft;
}

// -------------------------------------------------- spectrogram and peaks ----
// Each frame is measured against its own local floor (the mean level of the
// bins around it), so a speaker's tone, the room's boom or a loud passage
// don't decide which points count as peaks — only how much a point stands out.
export function whitenedSpectrogram(x, cfg = CFG) {
  const { nfft, hop, sr, floorHalf } = cfg;
  const half = nfft >> 1;
  const nFrames = x.length >= nfft ? Math.floor((x.length - nfft) / hop) + 1 : 0;
  const kLo = Math.max(1, Math.floor((cfg.fMin * nfft) / sr));
  const kHi = Math.min(half - 2, Math.ceil((cfg.fMax * nfft) / sr));
  const nb = kHi - kLo + 1;
  const fft = getFFT(nfft);
  const win = new Float64Array(nfft);
  for (let i = 0; i < nfft; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (nfft - 1));
  const re = new Float64Array(nfft);
  const im = new Float64Array(nfft);
  const db = new Float64Array(half);
  const pre = new Float64Array(half + 1);
  const w = new Float32Array(nFrames * nb);
  for (let t = 0; t < nFrames; t++) {
    const o = t * hop;
    for (let i = 0; i < nfft; i++) {
      re[i] = x[o + i] * win[i];
      im[i] = 0;
    }
    fft(re, im);
    for (let k = 0; k < half; k++) db[k] = 10 * Math.log10(re[k] * re[k] + im[k] * im[k] + 1e-12);
    pre[0] = 0;
    for (let k = 0; k < half; k++) pre[k + 1] = pre[k] + db[k];
    for (let k = kLo; k <= kHi; k++) {
      const a = Math.max(0, k - floorHalf);
      const b = Math.min(half - 1, k + floorHalf);
      w[t * nb + (k - kLo)] = db[k] - (pre[b + 1] - pre[a]) / (b - a + 1);
    }
  }
  return { w, nFrames, nb, kLo };
}

export function findPeaks(spec, cfg = CFG) {
  const { w, nFrames, nb, kLo } = spec;
  const { nbF, nbT, minProm, sr, nfft, hop } = cfg;
  const fmax = new Float32Array(nFrames * nb);
  for (let t = 0; t < nFrames; t++) {
    const row = t * nb;
    for (let k = 0; k < nb; k++) {
      let m = -Infinity;
      const a = Math.max(0, k - nbF);
      const b = Math.min(nb - 1, k + nbF);
      for (let j = a; j <= b; j++) {
        const v = w[row + j];
        if (v > m) m = v;
      }
      fmax[row + k] = m;
    }
  }
  const ts = [];
  const fs = [];
  const ss = [];
  for (let t = 0; t < nFrames; t++) {
    const row = t * nb;
    const t0 = Math.max(0, t - nbT);
    const t1 = Math.min(nFrames - 1, t + nbT);
    for (let k = 0; k < nb; k++) {
      const v = w[row + k];
      if (v < minProm) continue;
      let isPeak = true;
      for (let tt = t0; tt <= t1; tt++) {
        if (fmax[tt * nb + k] > v) {
          isPeak = false;
          break;
        }
      }
      if (!isPeak) continue;
      // refine the pitch to well under a bin with a parabola through the top
      const a = k > 0 ? w[row + k - 1] : v;
      const c = k < nb - 1 ? w[row + k + 1] : v;
      const den = a - 2 * v + c;
      let delta = den < -1e-9 ? (0.5 * (a - c)) / den : 0;
      if (delta > 0.5) delta = 0.5;
      if (delta < -0.5) delta = -0.5;
      ts.push((t * hop + nfft / 2) / sr);
      fs.push(((kLo + k + delta) * sr) / nfft);
      ss.push(v);
    }
  }
  return { t: Float64Array.from(ts), f: Float64Array.from(fs), s: Float64Array.from(ss), n: ts.length };
}

export function peaksOf(x, cfg = CFG) {
  return findPeaks(whitenedSpectrogram(x, cfg), cfg);
}

export function rms(x, from = 0, to = x.length) {
  let s = 0;
  for (let i = from; i < to; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, to - from));
}

// -------------------------------------------------------------- resampling ----
// Whatever the microphone gives (44.1k, 48k, ...) down to cfg.sr, with a
// windowed-sinc low-pass so what lives above 4 kHz can't fold back into the
// band the peaks are read from. Streaming: push() chunks in, get chunks out;
// no delay (the filter is centred), and any input rate >= 16 kHz works.
const PHASES = 128;
function besselI0(x) {
  let sum = 1;
  let term = 1;
  for (let k = 1; k < 40; k++) {
    term *= (x / (2 * k)) * (x / (2 * k));
    sum += term;
    if (term < 1e-12 * sum) break;
  }
  return sum;
}

export class Resampler {
  constructor(inRate, outRate = CFG.sr) {
    if (inRate < outRate) throw new Error(`Resampler: ${inRate} Hz is below ${outRate} Hz`);
    this.ratio = inRate / outRate;
    this.passthrough = inRate === outRate;
    // cut at 4 kHz, ~600 Hz of transition, ~60 dB down: a Kaiser window
    const fc = 4000 / inRate;
    const beta = 5.65;
    const deltaOmega = (2 * Math.PI * 600) / inRate;
    this.W = Math.ceil((60 - 7.95) / (2.285 * deltaOmega) / 2);
    const taps = 2 * this.W;
    this.taps = taps;
    this.table = new Float32Array(PHASES * taps);
    const i0b = besselI0(beta);
    for (let p = 0; p < PHASES; p++) {
      let sum = 0;
      for (let k = 0; k < taps; k++) {
        const u = k - this.W + 1 - p / PHASES; // distance from the output instant, input samples
        const sinc = Math.abs(u) < 1e-9 ? 1 : Math.sin(2 * Math.PI * fc * u) / (2 * Math.PI * fc * u);
        const r = u / this.W;
        const kaiser = Math.abs(r) >= 1 ? 0 : besselI0(beta * Math.sqrt(1 - r * r)) / i0b;
        const v = 2 * fc * sinc * kaiser;
        this.table[p * taps + k] = v;
        sum += v;
      }
      for (let k = 0; k < taps; k++) this.table[p * taps + k] /= sum; // unit gain at DC for every phase
    }
    this.buf = new Float32Array(1 << 15);
    this.len = this.W; // W samples of silence before the first real one
    this.pos = this.W;
  }

  push(x) {
    if (this.passthrough) return Float32Array.from(x);
    if (this.len + x.length > this.buf.length) {
      const grown = new Float32Array(Math.max(this.buf.length * 2, this.len + x.length));
      grown.set(this.buf.subarray(0, this.len));
      this.buf = grown;
    }
    this.buf.set(x, this.len);
    this.len += x.length;
    const { W, taps, table, buf, ratio } = this;
    const out = new Float32Array(Math.max(0, Math.ceil((this.len - this.pos) / ratio) + 2));
    let n = 0;
    let pos = this.pos;
    for (;;) {
      let base = Math.floor(pos);
      let p = Math.round((pos - base) * PHASES);
      if (p === PHASES) {
        p = 0;
        base += 1;
      }
      if (base + W >= this.len) break; // not enough input yet for this output sample
      const row = p * taps;
      const start = base - W + 1;
      let acc = 0;
      for (let k = 0; k < taps; k++) acc += buf[start + k] * table[row + k];
      out[n++] = acc;
      pos += ratio;
    }
    const drop = Math.floor(pos) - W;
    if (drop > 0) {
      buf.copyWithin(0, drop, this.len);
      this.len -= drop;
      pos -= drop;
    }
    this.pos = pos;
    return out.subarray(0, n);
  }
}

// ------------------------------------------------------ the reference file ----
const DQ = 64; // room for the gap step inside a hash
export const T_UNIT = 0.008; // reference positions are stored in 8 ms units
const PAD_S = 24; // a query's start can sit this far before a song's own start

const nLogBins = (cfg) => Math.ceil(cfg.bpo * Math.log2(cfg.fMax / cfg.fMin)) + 2;

/** tracks: [{ id, slug, duration, peaks }] — ids must be 0..n-1. */
export function buildDB(tracks, cfg = CFG) {
  const geometry = {};
  for (const k of GEOMETRY_KEYS) geometry[k] = cfg[k];
  const B = nLogBins(cfg);
  const H = [];
  const V = [];
  for (const tr of tracks) {
    const P = tr.peaks;
    const lb = new Int32Array(P.n);
    for (let i = 0; i < P.n; i++) lb[i] = Math.round(cfg.bpo * Math.log2(P.f[i] / cfg.fMin));
    // a pitch refined to just under fMin (or over fMax) has no landmark to give
    const usable = (i) => lb[i] >= 0 && lb[i] < B;
    for (let i = 0; i < P.n; i++) {
      if (!usable(i)) continue;
      const cands = [];
      for (let j = i + 1; j < P.n && P.t[j] - P.t[i] <= cfg.dtMax; j++) {
        if (P.t[j] - P.t[i] >= cfg.dtMin && usable(j)) cands.push(j);
      }
      cands.sort((a, b) => P.s[b] - P.s[a]); // the strongest few survive noise best
      const top = cands.length > cfg.fanOut ? cands.slice(0, cfg.fanOut) : cands;
      for (const j of top) {
        const dq = Math.round((P.t[j] - P.t[i]) / cfg.dtRes);
        H.push((lb[i] * B + lb[j]) * DQ + dq);
        V.push((tr.id << 20) | Math.round(P.t[i] / T_UNIT));
      }
    }
  }
  const n = H.length;
  const order = new Uint32Array(n);
  for (let i = 0; i < n; i++) order[i] = i;
  order.sort((a, b) => H[a] - H[b] || V[a] - V[b]);
  const keys = [];
  const starts = [];
  const vals = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const h = H[order[i]];
    if (i === 0 || h !== H[order[i - 1]]) {
      keys.push(h);
      starts.push(i);
    }
    vals[i] = V[order[i]];
  }
  starts.push(n);
  return finishDB({
    cfg: geometry,
    tracks: tracks.map(({ id, slug, duration }) => ({ id, slug, duration })),
    keys: Uint32Array.from(keys),
    starts: Int32Array.from(starts),
    vals,
  });
}

// A flat open-addressing table from hash -> bucket, so a lookup costs a few
// array reads and no allocation (a Map would be both slower and heavier here).
function finishDB(db) {
  const nKeys = db.keys.length;
  let bits = 1;
  while (1 << bits < nKeys * 2) bits++;
  const shift = 32 - bits;
  const mask = (1 << bits) - 1;
  const table = new Int32Array(1 << bits);
  for (let i = 0; i < nKeys; i++) {
    let s = Math.imul(db.keys[i], 0x9e3779b1) >>> shift;
    while (table[s] !== 0) s = (s + 1) & mask;
    table[s] = i + 1;
  }
  const keys = db.keys;
  db.find = (h) => {
    let s = Math.imul(h, 0x9e3779b1) >>> shift;
    for (;;) {
      const e = table[s];
      if (e === 0) return -1;
      if (keys[e - 1] === h) return e - 1;
      s = (s + 1) & mask;
    }
  };
  db.n = db.vals.length;
  db.nKeys = nKeys;
  const maxDur = Math.max(1, ...db.tracks.map((t) => t.duration || 0));
  const rowLen = Math.ceil((maxDur + PAD_S + 8) / CFG.binW) + 4;
  db.vote = { nTracks: db.tracks.length, rowLen, buf: new Float32Array(db.tracks.length * rowLen) };
  return db;
}

const MAGIC = [0x43, 0x46, 0x50, 0x31]; // "CFP1"

class ByteWriter {
  constructor() {
    this.b = new Uint8Array(1 << 20);
    this.n = 0;
  }
  need(k) {
    if (this.n + k <= this.b.length) return;
    const g = new Uint8Array(Math.max(this.b.length * 2, this.n + k));
    g.set(this.b.subarray(0, this.n));
    this.b = g;
  }
  u8(v) {
    this.need(1);
    this.b[this.n++] = v;
  }
  u32(v) {
    this.need(4);
    this.b[this.n++] = v & 255;
    this.b[this.n++] = (v >>> 8) & 255;
    this.b[this.n++] = (v >>> 16) & 255;
    this.b[this.n++] = (v >>> 24) & 255;
  }
  varint(v) {
    while (v >= 128) {
      this.u8((v % 128) | 128);
      v = Math.floor(v / 128);
    }
    this.u8(v);
  }
  bytes(a) {
    this.need(a.length);
    this.b.set(a, this.n);
    this.n += a.length;
  }
  done() {
    return this.b.slice(0, this.n);
  }
}

/** The bytes that get gzipped and committed (content/fingerprints/*.fp.gz). */
export function serializeDB(db, extra = {}) {
  const header = new TextEncoder().encode(JSON.stringify({ format: 1, cfg: db.cfg, tracks: db.tracks, ...extra }));
  const w = new ByteWriter();
  w.bytes(MAGIC);
  w.u32(header.length);
  w.bytes(header);
  w.u32(db.nKeys);
  w.u32(db.n);
  let prev = 0;
  for (let i = 0; i < db.nKeys; i++) {
    w.varint(db.keys[i] - prev);
    prev = db.keys[i];
    w.varint(db.starts[i + 1] - db.starts[i]);
  }
  for (let i = 0; i < db.n; i++) w.u32(db.vals[i] >>> 0);
  return w.done();
}

export function deserializeDB(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < 4; i++) if (u8[i] !== MAGIC[i]) throw new Error("not a cassette fingerprint file");
  let p = 4;
  const u32 = () => {
    const v = (u8[p] | (u8[p + 1] << 8) | (u8[p + 2] << 16) | (u8[p + 3] << 24)) >>> 0;
    p += 4;
    return v;
  };
  const varint = () => {
    let v = 0;
    let m = 1;
    for (;;) {
      const b = u8[p++];
      v += (b & 127) * m;
      if (b < 128) return v;
      m *= 128;
    }
  };
  const hlen = u32();
  const header = JSON.parse(new TextDecoder().decode(u8.subarray(p, p + hlen)));
  p += hlen;
  if (header.format !== 1) throw new Error(`unknown fingerprint format ${header.format}`);
  const nKeys = u32();
  const n = u32();
  const keys = new Uint32Array(nKeys);
  const starts = new Int32Array(nKeys + 1);
  let prev = 0;
  let acc = 0;
  for (let i = 0; i < nKeys; i++) {
    prev += varint();
    keys[i] = prev;
    starts[i] = acc;
    acc += varint();
  }
  starts[nKeys] = acc;
  const vals = new Int32Array(n);
  for (let i = 0; i < n; i++) vals[i] = u32() | 0;
  const db = finishDB({ cfg: header.cfg, tracks: header.tracks, keys, starts, vals });
  db.meta = header;
  return db;
}

// ------------------------------------------------------------------ search ----
// Votes for one tape speed. r > 1 means the deck ran fast: what the mic heard
// is r times higher and r times shorter than the master, so its peaks are put
// back (pitch / r, time * r) before they're hashed.
function voteForSpeed(P, db, r, cfg, votes) {
  const { bpo, fMin, dtMin, dtMax, dtRes, dtTol, binW } = cfg;
  const B = nLogBins(cfg);
  const { rowLen } = db.vote;
  const n = P.n;
  const tt = new Float64Array(n);
  const lb = new Int32Array(n);
  const ok = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    tt[i] = P.t[i] * r;
    const b = Math.round(bpo * Math.log2(P.f[i] / r / fMin));
    lb[i] = b;
    ok[i] = b >= 0 && b < B ? 1 : 0;
  }
  const { starts, vals, find } = db;
  const inv = 1 / binW;
  const wmode = cfg.weight;
  for (let i = 0; i < n; i++) {
    if (!ok[i]) continue;
    for (let j = i + 1; j < n; j++) {
      const dt = tt[j] - tt[i];
      if (dt > dtMax) break;
      if (dt < dtMin || !ok[j]) continue;
      const base = (lb[i] * B + lb[j]) * DQ;
      const dq = Math.round(dt / dtRes);
      for (let d = -dtTol; d <= dtTol; d++) {
        const idx = find(base + dq + d);
        if (idx < 0) continue;
        const e0 = starts[idx];
        const e1 = starts[idx + 1];
        const cnt = e1 - e0;
        const wt = wmode === "sqrt" ? 1 / Math.sqrt(cnt) : wmode === "inv" ? 1 / cnt : 1;
        for (let e = e0; e < e1; e++) {
          const pk = vals[e];
          const bin = (((pk & 0xfffff) * T_UNIT - tt[i] + PAD_S) * inv) | 0;
          if (bin < 1 || bin >= rowLen - 1) continue;
          votes[(pk >> 20) * rowLen + bin] += wt;
        }
      }
    }
  }
}

// Strongest (track, offset) in a vote table — adjacent bins merged, since a
// real match straddles two — and the strongest somewhere else, for contrast.
function scan(votes, nTracks, rowLen, rivalBins) {
  let best = 0;
  let bt = -1;
  let bb = -1;
  for (let t = 0; t < nTracks; t++) {
    const row = t * rowLen;
    for (let b = 1; b < rowLen - 1; b++) {
      const v = votes[row + b];
      if (v === 0) continue;
      const s = v + Math.max(votes[row + b - 1], votes[row + b + 1]);
      if (s > best) {
        best = s;
        bt = t;
        bb = b;
      }
    }
  }
  if (bt < 0) return null;
  let rival = 0;
  for (let t = 0; t < nTracks; t++) {
    const row = t * rowLen;
    for (let b = 1; b < rowLen - 1; b++) {
      if (t === bt && Math.abs(b - bb) <= rivalBins) continue;
      const v = votes[row + b];
      if (v === 0) continue;
      const s = v + Math.max(votes[row + b - 1], votes[row + b + 1]);
      if (s > rival) rival = s;
    }
  }
  const row = bt * rowLen;
  const left = votes[row + bb - 1];
  const right = votes[row + bb + 1];
  const mid = votes[row + bb];
  const nb = right >= left ? bb + 1 : bb - 1;
  const vn = right >= left ? right : left;
  const centre = ((bb + 0.5) * mid + (nb + 0.5) * vn) / (mid + vn);
  return { score: best, track: bt, centre, rival };
}

// The strongest cell of one song's row between two bins (inclusive), merged
// with its better neighbour as in scan(). Used to ask "is it at the place I
// expect?" rather than "where is it?".
function scanRange(votes, row, lo, hi) {
  let best = 0;
  let bb = -1;
  for (let b = lo; b <= hi; b++) {
    const v = votes[row + b];
    if (v === 0) continue;
    const s = v + Math.max(votes[row + b - 1], votes[row + b + 1]);
    if (s > best) {
      best = s;
      bb = b;
    }
  }
  if (bb < 0) return null;
  const left = votes[row + bb - 1];
  const right = votes[row + bb + 1];
  const mid = votes[row + bb];
  const nb = right >= left ? bb + 1 : bb - 1;
  const vn = right >= left ? right : left;
  return { score: best, centre: ((bb + 0.5) * mid + (nb + 0.5) * vn) / (mid + vn) };
}

/**
 * peaks: from peaksOf() on what was heard. seconds: how long that was.
 * Returns the best explanation of it, or null.
 *   track     index into db.tracks
 *   speed     the deck's speed relative to the master (1.02 = 2% fast)
 *   score     the votes behind it  — compare with scoreNeeded(seconds)
 *   rival     the best the *next* explanation managed (a different song or place)
 *   posEnd    where in that song the END of what was heard sits, in master seconds
 *   posStart  and the start of it
 *
 * opts.speeds   tape speeds to try (default: the whole grid)
 * opts.probes   [{ id, track, posEnd, tol, speeds? }] — asks how well one
 *               specific place is supported: song `track`, END of what was
 *               heard at `posEnd` +- `tol` seconds, at the given speeds. Their
 *               answers come back in `probes[id]` as { score, speed, posEnd }
 *               (or null). Asking about one place is a far narrower question
 *               than "where is it?", so a much lower score is already
 *               convincing — which is what lets a tracker keep hold of a song
 *               through a weak passage, or recognise the next one early.
 */
export function match(peaks, seconds, db, opts = {}) {
  const cfg = { ...CFG, ...db.cfg, ...opts };
  const speeds = opts.speeds || cfg.speeds;
  const probes = opts.probes || [];
  const { nTracks, rowLen, buf } = db.vote;
  const rivalBins = Math.round(1 / cfg.binW);
  const globalSet = new Set(speeds);
  const toTry = new Set(speeds);
  for (const p of probes) for (const r of p.speeds || speeds) toTry.add(r);
  const found = [];
  const probed = {};
  for (const r of [...toTry].sort((a, b) => a - b)) {
    buf.fill(0);
    voteForSpeed(peaks, db, r, cfg, buf);
    if (globalSet.has(r)) {
      const top = scan(buf, nTracks, rowLen, rivalBins);
      if (top) found.push({ ...top, r, off: top.centre * cfg.binW - PAD_S });
    }
    for (const p of probes) {
      if (p.speeds && !p.speeds.includes(r)) continue;
      if (p.track < 0 || p.track >= nTracks) continue;
      const exp = p.posEnd - r * seconds; // where the song's start would sit, at this speed
      const lo = Math.max(1, Math.floor((exp - p.tol + PAD_S) / cfg.binW));
      const hi = Math.min(rowLen - 2, Math.ceil((exp + p.tol + PAD_S) / cfg.binW));
      if (hi < lo) continue;
      const hit = scanRange(buf, p.track * rowLen, lo, hi);
      if (hit && (!probed[p.id] || hit.score > probed[p.id].score)) {
        probed[p.id] = { score: hit.score, speed: r, posEnd: hit.centre * cfg.binW - PAD_S + r * seconds };
      }
    }
  }
  let out = null;
  if (found.length) {
    found.sort((a, b) => b.score - a.score);
    const win = found[0];
    let rival = win.rival;
    for (let i = 1; i < found.length; i++) {
      const c = found[i];
      if (c.track !== win.track || Math.abs(c.off - win.off) > 1) {
        rival = Math.max(rival, c.score);
        break;
      }
    }
    out = {
      track: win.track,
      speed: win.r,
      score: win.score,
      rival,
      posStart: win.off,
      posEnd: win.off + win.r * seconds,
    };
  }
  if (probes.length) {
    if (!out) out = { track: -1, speed: 1, score: 0, rival: 0, posStart: 0, posEnd: 0 };
    out.probes = probed;
  }
  return out;
}

// --------------------------------------------------------- listening live ----
/**
 * What the page's worker runs: feed it the microphone's chunks as they arrive
 * and it hands back an analysis about once a second — the last few seconds
 * heard, matched against the reference file.
 *
 *   push(chunk, t)  chunk: Float32Array at the mic's own rate; t: when its last
 *                   sample arrived, in whatever clock the caller uses (the
 *                   analysis comes back stamped with it)
 *   returns [ { t, seconds, level, peaks, ms, res } ]  (usually 0 or 1)
 *
 * `res` is match()'s answer or null; level is the RMS of the last half second
 * (1.0 = full scale), which is what tells a paused deck from a quiet passage.
 */
export class Listener {
  constructor(db, { inRate, windowSec = 8, minSec = 3, hopSec = 1, speeds = null } = {}) {
    this.db = db;
    this.sr = db.cfg.sr;
    this.inRate = inRate;
    this.rs = new Resampler(inRate, this.sr);
    this.windowSec = windowSec;
    this.minSec = minSec;
    this.hopSec = hopSec;
    this.speeds = speeds;
    this.ring = new Float32Array(Math.ceil(this.sr * (windowSec + 4)));
    this.total = 0; // samples ever written
    this.since = 0; // samples since the last analysis
    this.tLast = 0;
  }

  /** Forget everything heard so far — what comes next isn't a continuation of it
   *  (the audio was interrupted: a locked phone, a call). */
  reset() {
    this.rs = new Resampler(this.inRate, this.sr);
    this.total = 0;
    this.since = 0;
  }

  last(seconds) {
    const n = Math.min(Math.round(seconds * this.sr), this.total, this.ring.length);
    const out = new Float32Array(n);
    const len = this.ring.length;
    let from = (this.total - n) % len;
    for (let i = 0; i < n; i++) {
      out[i] = this.ring[from];
      if (++from === len) from = 0;
    }
    return out;
  }

  push(chunk, t) {
    const y = this.rs.push(chunk);
    const len = this.ring.length;
    let w = this.total % len;
    for (let i = 0; i < y.length; i++) {
      this.ring[w] = y[i];
      if (++w === len) w = 0;
    }
    this.total += y.length;
    this.since += y.length;
    this.tLast = t;
    const out = [];
    if (this.since >= this.hopSec * this.sr && this.total >= this.minSec * this.sr) {
      this.since = 0;
      out.push(this.analyse());
    }
    return out;
  }

  analyse() {
    const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
    const started = now();
    // A caller that knows the audio before some moment doesn't belong with what
    // came after (a deck that stopped and started again) can say so; the window
    // then only reaches back that far, and is skipped while it's too short.
    const mask = this.maskBefore ? this.maskBefore() : null;
    let seconds = Math.min(this.windowSec, this.total / this.sr);
    if (mask != null) seconds = Math.min(seconds, Math.max(0, this.tLast - mask));
    const x = this.last(seconds);
    const tail = Math.min(x.length, Math.round(0.5 * this.sr));
    const level = rms(x, x.length - tail, x.length);
    if (seconds < this.minSec) return { t: this.tLast, seconds, level, peaks: 0, ms: 0, res: null };
    // the caller can ask about specific places too (see match()); it's told
    // when this window ends and how long it is, so it can say where to look
    const peaks = peaksOf(x, this.db.cfg);
    const probes = this.hypotheses ? this.hypotheses(this.tLast, seconds) : [];
    const opts = { probes };
    const speeds = this.speedsFor ? this.speedsFor() : this.speeds;
    if (speeds) opts.speeds = speeds;
    const res = match(peaks, seconds, this.db, opts);
    return { t: this.tLast, seconds, level, peaks: peaks.n, ms: now() - started, res };
  }
}
