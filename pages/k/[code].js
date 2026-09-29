// ---------------------------------------------------------------------------
// /k/<code> — the album kit an NFC tag on a Nothing But Love cassette opens.
//
// The code is checked server-side, once, in getServerSideProps — never in the
// browser, and never logged past this request. See lib/nfcCodes.js for how
// codes are issued/revoked, lib/nfcAudio.js for where the audio actually
// comes from, and lib/nfc.js + pages/_app.js for how this route keeps its
// code out of the site's own analytics.
//
// Not linked from anywhere on the site (not in lib/content.js's NAV, not in
// the footer) — the only way in is a code, which is the point.
// ---------------------------------------------------------------------------
import fs from "fs";
import path from "path";
import Head from "next/head";
import { useState } from "react";
import LyricsPlayer from "../../components/LyricsPlayer";
import { isValidCode } from "../../lib/nfcCodes";
import { resolveAudioUrl } from "../../lib/nfcAudio";

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
        audioUrl,
        lines: lyrics.lines,
        notes: lyrics.notes || {},
      };
    })
  );

  return { props: { valid: true, albumTitle: album.title, songs } };
}

export default function AlbumKit({ valid, albumTitle, songs }) {
  const [activeSlug, setActiveSlug] = useState(songs?.[0]?.slug);

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

  const song = songs.find((s) => s.slug === activeSlug) || songs[0];
  const activeIdx = songs.findIndex((s) => s.slug === song.slug);

  function playNext() {
    if (activeIdx >= 0 && activeIdx < songs.length - 1) {
      setActiveSlug(songs[activeIdx + 1].slug);
    }
  }

  return (
    <>
      <Head>
        <title>{`${albumTitle} — liner notes`}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="kit">
        {songs.length > 1 && (
          <nav className="tracks">
            {songs.map((s) => (
              <button
                key={s.slug}
                type="button"
                className={s.slug === song.slug ? "track active" : "track"}
                onClick={() => setActiveSlug(s.slug)}
              >
                {s.title}
              </button>
            ))}
          </nav>
        )}
        <LyricsPlayer
          key={song.slug}
          song={song}
          audioSrc={song.audioUrl}
          lines={song.lines}
          notes={song.notes}
          onEnded={playNext}
        />
      </main>
      <style jsx>{`
        .kit {
          min-height: 100svh;
          background: var(--deep);
          color: var(--ink);
          padding: clamp(1rem, 3vw, 2rem);
          display: flex;
          flex-direction: column;
          max-width: 640px;
          margin: 0 auto;
        }
        .tracks {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.2rem;
        }
        .track {
          background: var(--field);
          border: var(--rule) solid var(--field-line);
          color: var(--ink-dim);
          padding: 0.4rem 0.8rem;
          border-radius: 999px;
          font-size: 0.85em;
          cursor: pointer;
        }
        .track.active {
          background: var(--accent);
          color: var(--deep);
          border-color: var(--accent);
        }
      `}</style>
    </>
  );
}
