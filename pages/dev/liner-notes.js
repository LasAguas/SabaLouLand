// ---------------------------------------------------------------------------
// /dev/liner-notes — the liner-notes page (components/liner/Paper.js) without
// needing a cassette code, so it can be looked at and worked on in dev. The
// real route is /k/<code>; nothing here is reachable in production.
//
// Same data and audio as /k/<code> (album.json, content/lyrics/*.json, the
// same audio resolver).
//
// PARKED, NOT DELETED: three designs were built side by side — Sleeve, Paper
// and Cassette (all in components/liner/) — and Paper was picked. The other
// two, and the bar that flipped between them, are commented out below. To get
// them back, uncomment every block marked "SWITCHER" in this file (imports,
// DESIGNS, the router/theme lines, the bar, its CSS) and delete the two lines
// marked "PAPER ONLY". Then /dev/liner-notes?d=1|2|3 (or the bar) flips between
// them with the same song still playing at the same second. Sleeve and
// Cassette are untouched and compile fine on their own; to use one on the real
// page, swap it in for <Paper> in pages/k/[code].js.
// ---------------------------------------------------------------------------
import fs from "fs";
import path from "path";
import Head from "next/head";
import Paper from "../../components/liner/Paper";
import { resolveAudioUrl } from "../../lib/nfcAudio";
import { useLinerPlayer } from "../../lib/useLinerPlayer";
// SWITCHER —
// import { useRouter } from "next/router";
// import Cassette from "../../components/liner/Cassette";
// import Sleeve from "../../components/liner/Sleeve";
// import { useTheme } from "../../lib/useTheme";

const LYRICS_DIR = path.join(process.cwd(), "content", "lyrics");

// SWITCHER —
// const DESIGNS = [
//   { id: "1", name: "Sleeve", View: Sleeve },
//   { id: "2", name: "Paper", View: Paper },
//   { id: "3", name: "Cassette", View: Cassette },
// ];

export async function getServerSideProps() {
  if (process.env.NODE_ENV === "production") {
    return { notFound: true };
  }

  const album = JSON.parse(fs.readFileSync(path.join(LYRICS_DIR, "album.json"), "utf8"));
  const songs = await Promise.all(
    album.songs.map(async (s) => {
      const lyrics = JSON.parse(fs.readFileSync(path.join(LYRICS_DIR, `${s.slug}.json`), "utf8"));
      let audioUrl;
      try {
        audioUrl = await resolveAudioUrl(s.audio);
      } catch {
        // Bucket not filled yet (or offline): the local copy is fine for a preview.
        audioUrl = `/nfc-audio/${s.audio}`;
      }
      return {
        slug: s.slug,
        title: s.title,
        side: s.side ?? null,
        audioUrl,
        lines: lyrics.lines,
        notes: lyrics.notes || {},
      };
    })
  );

  return { props: { albumTitle: album.title, songs } };
}

export default function LinerNotesPreview({ albumTitle, songs }) {
  // SWITCHER —
  // const router = useRouter();
  // const { theme, toggle } = useTheme();
  const player = useLinerPlayer(songs);

  // SWITCHER —
  // const chosen = DESIGNS.find((d) => d.id === router.query.d) ?? DESIGNS[1];
  // const { View } = chosen;
  //
  // function pick(id) {
  //   router.replace({ pathname: router.pathname, query: { d: id } }, undefined, { shallow: true });
  // }

  // PAPER ONLY — delete this line when the switcher comes back
  const View = Paper;

  return (
    <>
      <Head>
        <title>{`${albumTitle} — liner notes preview`}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="shell">
        {/* SWITCHER — the bar across the top: one button per design, and a
            light / dark switch (the theme is also switchable from the home page)
        <div className="switch" role="tablist" aria-label="design">
          <span className="label">design</span>
          {DESIGNS.map((d) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={d.id === chosen.id}
              className={d.id === chosen.id ? "on" : undefined}
              onClick={() => pick(d.id)}
            >
              {d.id} · {d.name}
            </button>
          ))}
          <button type="button" className="mode" onClick={toggle} aria-label="switch light / dark">
            {theme === "light" ? "light" : "dark"}
          </button>
        </div>
        */}

        <div className="stage">
          {/* PAPER ONLY — with the switcher back this is
              <View key={chosen.id} player={player} albumTitle={albumTitle} /> */}
          <View player={player} albumTitle={albumTitle} />
        </div>

        <audio {...player.audioProps} />
      </div>

      <style jsx>{`
        .shell {
          height: 100svh;
          display: flex;
          flex-direction: column;
          background: var(--deep);
        }
        /* SWITCHER — styles for the bar
        .switch {
          flex: none;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #101012;
          color: #b9b9c0;
          font: 12px/1 ui-sans-serif, system-ui, -apple-system, sans-serif;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .switch::-webkit-scrollbar {
          display: none;
        }
        .label {
          margin-right: 4px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-size: 10px;
          color: #70707a;
        }
        .switch button {
          flex: none;
          padding: 6px 10px;
          border: 1px solid #2c2c33;
          border-radius: 6px;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
        }
        .switch button.on {
          background: #e9e9ee;
          border-color: #e9e9ee;
          color: #101012;
        }
        .switch .mode {
          margin-left: auto;
        }
        */
        .stage {
          flex: 1;
          min-height: 0;
          position: relative;
        }
      `}</style>
    </>
  );
}
