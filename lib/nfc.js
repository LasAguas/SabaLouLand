// ---------------------------------------------------------------------------
// The NFC album-kit gate (/k/<code>) — shared bits used by both the tracker
// and the gated page itself.
//
// The one thing every part of this file exists to prevent: a cassette's own
// secret code ending up anywhere it could be read back later — an analytics
// row, a report export, a search index. The code only has to prove itself
// once, at the door; nothing past that point should still be carrying it.
// ---------------------------------------------------------------------------

// Every route under here carries a per-cassette secret in its own path.
export const GATED_PREFIX = "/k/";

// Also masked: the dev-only sync tool. It never carries a cassette secret,
// but there's no reason its visits should show up in artist analytics either.
const MASKED_PREFIXES = [GATED_PREFIX, "/dev/sync-editor"];

// The fixed label every one of those visits reports as, regardless of which
// code (or song) opened it. Swap the string, not the mechanism, if this ever
// needs to be split out per song.
const MASKED_SLUG = "nfc-lyrics-nbl";

export function isGatedPath(path) {
  return typeof path === "string" && path.startsWith(GATED_PREFIX);
}

/** Replace a real, code-bearing path with a fixed label before it reaches the
 * tracker. Called from lib/tracker.js only — the gated page itself never
 * needs this. */
export function maskTrackedPath(path) {
  const p = path || "/";
  return MASKED_PREFIXES.some((prefix) => p.startsWith(prefix)) ? `/${MASKED_SLUG}` : p;
}
