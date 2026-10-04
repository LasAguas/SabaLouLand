// ---------------------------------------------------------------------------
// /k/<code> — the album kit an NFC tag on a Nothing But Love cassette opens.
//
// The code is checked server-side, once, in getServerSideProps — never in the
// browser, and never logged past this request. See lib/nfcCodes.js for how
// codes are issued/revoked, lib/nfcAudio.js for where the audio actually
// comes from, and lib/nfc.js + pages/_app.js for how this route keeps its
// code out of the site's own analytics.
//
// What it shows is components/liner/Paper.js, driven by lib/useLinerPlayer.js
// (playback, line sync, the track list). Two other designs were built next to
// it — Sleeve and Cassette, both still in components/liner/ — and parked; see
// the note at the top of pages/dev/liner-notes.js for how to bring them back.
// pages/dev/liner-notes.js shows this same page without needing a code.
//
// Not linked from anywhere on the site (not in lib/content.js's NAV, not in
// the footer) — the only way in is a code, which is the point.
// ---------------------------------------------------------------------------
import fs from "fs";
import path from "path";
import Head from "next/head";
import Paper from "../../components/liner/Paper";
// import Cassette from "../../components/liner/Cassette";
// import Sleeve from "../../components/liner/Sleeve";
import { isValidCode } from "../../lib/nfcCodes";
import { resolveAudioUrl } from "../../lib/nfcAudio";
import { useLinerPlayer } from "../../lib/useLinerPlayer";

const LYRICS_DIR = path.join(process.cwd(), "content", "lyrics");

export async function getServerSideProps({ params, res }) {
  // A cassette's code sits right in this URL — make sure nothing downstream
  // caches, indexes, or forwards it.
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  if (!isValidCode(code)) {
    return { props: { valid: false } };
  }

  const album = JSON.parse(fs.readFileSync(path.join(LYRICS_DIR, "album.json"), "utf8"));

  const songs = await Promise.all(
    album.songs.map(async (s) => {
      const lyrics = JSON.parse(fs.readFileSync(path.join(LYRICS_DIR, `${s.slug}.json`), "utf8"));
      const audioUrl = await resolveAudioUrl(s.audio);
      return {
        slug: s.slug,
        title: s.title,
        // which side of the tape it's on — only the parked Cassette design reads it
        side: s.side ?? null,
        audioUrl,
        lines: lyrics.lines,
        notes: lyrics.notes || {},
      };
    })
  );

  return { props: { valid: true, albumTitle: album.title, songs } };
}

export default function AlbumKit({ valid, albumTitle, songs }) {
  if (!valid) {
    return (
      <>
        <Head>
          <title>Saba Lou</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main className="invalid">
          <p>this link isn&apos;t working. if it came from a Saba Lou cassette, try scanning it again.</p>
        </main>
        <style jsx>{`
          .invalid {
            min-height: 100svh;
            display: grid;
            place-items: center;
            padding: 2rem;
            text-align: center;
            background: var(--deep);
            color: var(--ink-dim);
          }
        `}</style>
      </>
    );
  }

  return <Kit albumTitle={albumTitle} songs={songs} />;
}

// Split out of AlbumKit so the player hook only ever runs for a valid code —
// hooks can't sit below the early return above.
function Kit({ albumTitle, songs }) {
  const player = useLinerPlayer(songs);

  return (
    <>
      <Head>
        <title>{`${albumTitle} — liner notes`}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <main className="kit">
        <Paper player={player} albumTitle={albumTitle} />
        {/* one <audio> for the whole album, so the next song can start on its own */}
        <audio {...player.audioProps} />
      </main>
      <style jsx>{`
        .kit {
          height: 100svh;
          background: var(--deep);
        }
      `}</style>
    </>
  );
}
