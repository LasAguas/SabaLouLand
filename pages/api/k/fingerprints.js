// ---------------------------------------------------------------------------
// Serves the reference file the "listen to my cassette" mode matches against
// (content/fingerprints/nbl.fp.gz — built by scripts/build-fingerprints.mjs).
//
// Same door as the page: the cassette's code is checked with isValidCode, so
// the file goes to someone holding a real cassette and nobody else. (It's a
// map of pitch pairs and timings, not audio, and can't be played back — but
// the album isn't out, and "not public until it is" is the rule this whole
// kit runs on.)
//
// The code travels in a header, not the URL, so it never lands in a request
// log; a wrong or missing one gets a bare 404, indistinguishable from there
// being nothing here.
//
// The file is already gzipped on disk, so it goes out as it is with
// Content-Encoding: gzip and the browser unpacks it. It's the same bytes until
// the masters change, so it's cacheable by the one browser that fetched it
// (private — a shared cache must never hold something behind a code) and
// re-checked cheaply with its ETag.
// ---------------------------------------------------------------------------
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { isValidCode } from "../../../lib/nfcCodes";

const FILE = path.join(process.cwd(), "content", "fingerprints", "nbl.fp.gz");

let cached = null;
function load() {
  if (cached) return cached;
  const bytes = fs.readFileSync(FILE);
  cached = { bytes, etag: `"${createHash("sha1").update(bytes).digest("hex").slice(0, 16)}"` };
  return cached;
}

export default function handler(req, res) {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Referrer-Policy", "no-referrer");

  const header = req.headers["x-kit-code"];
  const code = Array.isArray(header) ? header[0] : header;
  if (req.method !== "GET" || !isValidCode(code)) {
    res.setHeader("Cache-Control", "no-store");
    res.status(404).end();
    return;
  }

  let file;
  try {
    file = load();
  } catch {
    // not built yet (or not deployed): the page just won't offer listening
    res.setHeader("Cache-Control", "no-store");
    res.status(404).end();
    return;
  }

  res.setHeader("ETag", file.etag);
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.setHeader("Vary", "x-kit-code");
  if (req.headers["if-none-match"] === file.etag) {
    res.status(304).end();
    return;
  }
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Encoding", "gzip");
  res.setHeader("Content-Length", file.bytes.length);
  res.status(200).end(file.bytes);
}
