// ---------------------------------------------------------------------------
// Which cassette codes currently open the album kit at /k/<code>.
//
// Server-only — NFC_VALID_CODES must stay a plain (non-NEXT_PUBLIC_) env var,
// or every valid code ships inside the client bundle.
//
// It's a flat comma-separated list on purpose: the whole point of this
// feature is a handful of codes made on demand as cassettes are ordered (see
// scripts/generate-nfc-codes.js), not a subscriber table. Add new ones to
// NFC_VALID_CODES (here and in Vercel) as batches go out; remove one to kill
// a leaked link immediately. If this ever needs to outgrow "a few hundred
// codes in an env var" — usage stats per code, self-serve revocation — swap
// the body of isValidCode for a Supabase table lookup; nothing else in this
// feature needs to change.
// ---------------------------------------------------------------------------

function loadValidCodes() {
  return new Set(
    (process.env.NFC_VALID_CODES || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
  );
}

export function isValidCode(code) {
  if (!code || typeof code !== "string") return false;
  return loadValidCodes().has(code);
}
