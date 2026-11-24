#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Replays a phone recording of a cassette through the same engine the page
// runs (resample -> last 8 s -> landmarks -> match -> tracker) and prints what
// it makes of it, second by second. This is how to find out, before anyone
// holds a phone up to a deck, whether a given deck / room / phone is
// recognised, how long a song takes to lock, and whether anything gets
// confused — and how to re-check the thresholds in lib/cassette/ after a change.
//
//   node scripts/cassette-probe.mjs "~/Downloads/Side A.m4a"
//   node scripts/cassette-probe.mjs rec.m4a --quiet        # just the timeline
//   node scripts/cassette-probe.mjs rec.m4a --raw          # the matcher alone, no tracker
//   node scripts/cassette-probe.mjs rec.m4a --rate 44100   # what a 44.1 kHz phone would hand the page
//   node scripts/cassette-probe.mjs rec.m4a --db other.fp.gz
//
// Needs ffmpeg (to read the recording) and content/fingerprints/nbl.fp.gz
// (node scripts/build-fingerprints.mjs makes it).
//
// How to read it:
//   level     how loud the last half second was, dB below full scale
//   best      the matcher's strongest answer for the last 8 s, anywhere, and the
//             score it needed to be believed on its own (a * marks one that got there)
//   tracker   what the page would be showing: listening / locked / paused, the
//             song, and how far into it
// When a recording shows "listening" over music you know is playing, look at the
// "best" column: if the right song is there with a middling score, the tracker's
// thresholds are the thing to look at; if it isn't, the recording (distance to
// the deck, room noise, a different mix on the tape) is.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { Listener, deserializeDB, scoreNeeded } from "../lib/cassette/fingerprint.mjs";
import { Engine } from "../lib/cassette/engine.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const valueFlags = new Set(["--rate", "--db", "--window"]);
const file = args.find((a, i) => !a.startsWith("--") && !(i > 0 && valueFlags.has(args[i - 1])));
if (!file) {
  console.error("usage: node scripts/cassette-probe.mjs <recording> [--quiet] [--raw] [--rate 48000] [--window 8] [--db file]");
  process.exit(1);
}
const rec = file.replace(/^~/, os.homedir());
const rate = Number(flag("rate", 48000));
const windowSec = Number(flag("window", 8));
const quiet = args.includes("--quiet");
const raw = args.includes("--raw");
const dbFile = path.resolve(flag("db", path.join(root, "content", "fingerprints", "nbl.fp.gz")));

const db = deserializeDB(zlib.gunzipSync(fs.readFileSync(dbFile)));
const album = JSON.parse(fs.readFileSync(path.join(root, "content", "lyrics", "album.json"), "utf8"));
const order = [...new Set(album.songs.map((s) => s.side))].map((side) => album.songs.filter((s) => s.side === side).map((s) => s.slug));

const pcmBytes = execFileSync("ffmpeg", ["-v", "error", "-i", rec, "-ac", "1", "-ar", String(rate), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
const pcm = new Float32Array(pcmBytes.buffer.slice(pcmBytes.byteOffset, pcmBytes.byteOffset + pcmBytes.byteLength));
const total = pcm.length / rate;

const mmss = (s) => `${Math.floor(Math.abs(s) / 60)}:${String(Math.floor(Math.abs(s) % 60)).padStart(2, "0")}`;
const slug = (i) => (i >= 0 && db.tracks[i] ? db.tracks[i].slug : "-");

const engine = raw ? null : new Engine(db, { inRate: rate, order, windowSec });
const listener = raw ? new Listener(db, { inRate: rate, windowSec }) : null;
const CHUNK = 2048;
const started = Date.now();
const rows = [];
for (let i = 0; i < pcm.length; i += CHUNK) {
  const chunk = pcm.subarray(i, Math.min(pcm.length, i + CHUNK));
  const t = (i + chunk.length) / rate;
  if (raw) for (const analysis of listener.push(chunk, t)) rows.push({ analysis, snapshot: null });
  else rows.push(...engine.push(chunk, t));
}
const took = (Date.now() - started) / 1000;

if (!quiet) {
  console.log(`\n${rec}  ${total.toFixed(1)} s, read at ${rate} Hz, ${rows.length} analyses of the last ${windowSec} s${raw ? " (matcher only)" : ""}\n`);
  console.log("  heard   level   best (score / needed)               tracker");
}
const changes = [];
let prev = "";
for (const { analysis: a, snapshot: s } of rows) {
  const r = a.res;
  const need = scoreNeeded(a.seconds);
  const db10 = a.level > 0 ? Math.round(20 * Math.log10(a.level)) : -99;
  const best = r && r.track >= 0 ? `${r.score >= need ? "*" : " "} ${String(Math.round(r.score)).padStart(4)} / ${String(Math.round(need)).padStart(2)}  ${slug(r.track).slice(0, 22).padEnd(22)} ${mmss(r.posEnd).padStart(5)}` : "".padEnd(40);
  let state = "";
  if (s) {
    const pos = s.state === "listening" ? null : s.anchorPos + (a.t - s.anchorT) * s.rate;
    state = s.state === "listening" ? "listening" : `${s.state === "paused" ? "PAUSED " : "LOCKED "} ${s.slug.padEnd(30)} ${mmss(pos).padStart(5)}  ${s.state === "paused" ? "" : `${s.rate >= 1 ? "+" : ""}${((s.rate - 1) * 100).toFixed(1)}%`}`;
    const key = `${s.state}:${s.slug}`;
    if (key !== prev) {
      changes.push(`${mmss(a.t).padStart(5)}  ${s.state === "listening" ? "listening" : `${s.state}  ${s.slug} at ${mmss(pos)}`}`);
      prev = key;
    }
  }
  if (!quiet) console.log(`${mmss(a.t).padStart(6)}  ${String(db10).padStart(5)}   ${best}   ${state}`);
}

console.log(`\n--- processed ${total.toFixed(0)} s of audio in ${took.toFixed(1)} s (${(rows.reduce((x, r) => x + r.analysis.ms, 0) / Math.max(1, rows.length)).toFixed(0)} ms per analysis on average, ${Math.max(...rows.map((r) => r.analysis.ms)).toFixed(0)} ms at worst)`);
if (!raw) {
  console.log("tracker timeline:");
  for (const c of changes) console.log("  " + c);
}
