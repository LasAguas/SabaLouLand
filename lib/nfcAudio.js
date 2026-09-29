// ---------------------------------------------------------------------------
// Resolves a playable URL for one song's audio file. Called once per request
// from getServerSideProps in pages/k/[code].js — never from the client, since
// the whole point is that the URL it returns is short-lived.
//
// Real path, once SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + NFC_AUDIO_BUCKET
// are set (a private Supabase Storage bucket, separate from anything public
// on this site): a signed URL, good for a few hours — long enough for one
// sitting with the album, not for someone to pass the link around.
//
// Until those are set: falls back to /nfc-audio/<file> under public/, which
// is gitignored (see .gitignore) so it only ever exists on a machine that put
// files there by hand. That's deliberate — there's no path by which
// pre-release masters end up permanently public by accident. It's for local
// testing of the player and the sync editor only; it is NOT how this should
// serve real listeners once deployed. See TODO.md.
// ---------------------------------------------------------------------------

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 4; // one album's worth of listening

let cachedClient = null;

function supabaseConfigured() {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NFC_AUDIO_BUCKET
  );
}

async function getClient() {
  if (cachedClient) return cachedClient;
  const { createClient } = await import("@supabase/supabase-js");
  cachedClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  return cachedClient;
}

export async function resolveAudioUrl(filename) {
  if (supabaseConfigured()) {
    const supabase = await getClient();
    const { data, error } = await supabase.storage
      .from(process.env.NFC_AUDIO_BUCKET)
      .createSignedUrl(filename, SIGNED_URL_TTL_SECONDS);
    if (error) {
      throw new Error(`nfcAudio: signing "${filename}" failed — ${error.message}`);
    }
    return data.signedUrl;
  }
  return `/nfc-audio/${filename}`; // dev-only fallback — see file header
}
