#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Builds the reference file the "listen to my cassette" mode matches against:
//
//   node scripts/build-fingerprints.mjs            # reads public/nfc-audio/*.m4a
//   node scripts/build-fingerprints.mjs <audio dir> [output file]
//
// Writes content/fingerprints/nbl.fp.gz (~1 MB) — commit it. pages/api/k/
// fingerprints.js serves it to anyone holding a valid cassette code; it's a
// map of "which pitches were near each other, how far apart in time, and where
// in which song" and can't be played back as audio.
//
// Needs ffmpeg on the machine running it (it decodes the masters) — nothing
// on the server needs it, since the file is built once, here, and committed.
//
// Re-run it whenever the masters change: a different mix, a trim, a
// re-master that moves things in time. The file name of each master becomes
// that song's slug, so it must match content/lyrics/album.json. The slugs the
// page can't find in album.json are ignored there, not an error.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { CFG, buildDB, deserializeDB, match, peaksOf, serializeDB } from "../lib/cassette/fingerprint.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const audioDir = path.resolve(process.argv[2] || path.join(root, "public", "nfc-audio"));
const outFile = path.resolve(process.argv[3] || path.join(root, "content", "fingerprints", "nbl.fp.gz"));

if (!fs.existsSync(audioDir)) {
  console.error(`No folder at ${audioDir}. The masters live in public/nfc-audio/ (gitignored) — see lib/nfcAudio.js.`);
  process.exit(1);
}
const files = fs
  .readdirSync(audioDir)
  .filter((f) => /\.(m4a|wav|mp3|flac|aac|ogg)$/i.test(f))
  .sort();
if (!files.length) {
  console.error(`No audio files in ${audioDir}.`);
  process.exit(1);
}

function decode(file) {
  try {
    const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(CFG.sr), "-f", "f32le", "-"], {
      maxBuffer: 1 << 30,
    });
    return new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  } catch (e) {
    console.error(e.code === "ENOENT" ? "ffmpeg isn't installed (brew install ffmpeg)." : `ffmpeg failed on ${file}: ${e.message}`);
    process.exit(1);
  }
}

const started = Date.now();
const tracks = files.map((f, id) => {
  const pcm = decode(path.join(audioDir, f));
  const peaks = peaksOf(pcm, CFG);
  const duration = pcm.length / CFG.sr;
  console.log(`  ${String(id).padStart(2)}  ${f.replace(/\.[^.]+$/, "").padEnd(34)} ${duration.toFixed(1).padStart(6)} s  ${(peaks.n / duration).toFixed(0)} peaks/s`);
  return { id, slug: f.replace(/\.[^.]+$/, ""), duration, peaks, pcm };
});

const db = buildDB(tracks, CFG);
const version = createHash("sha1")
  .update(Buffer.from(db.keys.buffer, db.keys.byteOffset, db.keys.byteLength))
  .update(Buffer.from(db.vals.buffer, db.vals.byteOffset, db.vals.byteLength))
  .digest("hex")
  .slice(0, 12);
const raw = serializeDB(db, { version });
const gz = zlib.gzipSync(raw, { level: 9 });
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, gz);
console.log(
  `\n${tracks.length} songs, ${db.n} landmarks -> ${path.relative(root, outFile)}  ${(gz.length / 1024).toFixed(0)} KB gzipped (version ${version}, ${((Date.now() - started) / 1000).toFixed(1)} s)`
);

// Self-check: read the file back and make sure a clean 8 s excerpt from the
// middle of every song is recognised, in the right song and the right place.
const back = deserializeDB(zlib.gunzipSync(fs.readFileSync(outFile)));
let bad = 0;
for (const tr of tracks) {
  const s0 = Math.floor(tr.pcm.length * 0.4);
  const x = tr.pcm.subarray(s0, s0 + 8 * CFG.sr);
  const res = match(peaksOf(x, back.cfg), 8, back, { speeds: [1] });
  const at = (s0 + 8 * CFG.sr) / CFG.sr;
  const ok = res && back.tracks[res.track].slug === tr.slug && Math.abs(res.posEnd - at) < 0.3;
  if (!ok) {
    bad++;
    console.error(`  self-check FAILED for ${tr.slug}`);
  }
}
console.log(bad ? `self-check: ${bad} song(s) failed` : `self-check: all ${tracks.length} songs recognised from a clean excerpt`);
process.exit(bad ? 1 : 0);
