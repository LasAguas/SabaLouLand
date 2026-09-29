// ---------------------------------------------------------------------------
// /dev/sync-editor — the tool that turns a lyric sheet and an audio file into
// the timed content/lyrics/<slug>.json the player reads.
//
// Dev-only: getServerSideProps 404s it in production, so it never ships as a
// real route. Everything here runs against a local file picked from disk
// (URL.createObjectURL) — nothing is uploaded anywhere, so there's no reason
// this needs real audio hosting decided before you start timing songs.
//
// Workflow:
//   1. Pick the audio file, paste the lyrics (one line per row), "load lines".
//   2. Hit play, then tap TAP (or press Space) in rhythm with each line — it
//      stamps the current playback time onto the next untimed line and moves
//      on, the way a karaoke-file editor does.
//   3. Nudge any line's timing by ±0.1s/±0.5s afterwards; click a timed line
//      to jump playback there and check it.
//   4. Add notes to specific lines if you want them.
//   5. Once every line has a time, hit "watch it back" to play the song
//      through the real synced player — same component /k/<code> uses — so
//      you can feel whether the highlight timing is actually right before
//      exporting. Go back to editing and nudge anything that's off, then
//      watch it back again.
//   6. Fill in the song slug + the exact audio filename it'll be served as,
//      then "export JSON" and drop the file into content/lyrics/.
//
// "Import JSON" reloads a file you exported earlier so a pass can be resumed
// or fixed without starting over.
// ---------------------------------------------------------------------------
import { useEffect, useMemo, useRef, useState } from "react";
import LyricsPlayer from "../../components/LyricsPlayer";

export async function getServerSideProps() {
  if (process.env.NODE_ENV === "production") {
    return { notFound: true };
  }
  return { props: {} };
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function SyncEditor() {
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  const [audioUrl, setAudioUrl] = useState(null);
  const [audioName, setAudioName] = useState("");
  const [rawLyrics, setRawLyrics] = useState("");
  const [lines, setLines] = useState([]); // { id, t: number|null, text, note }
  const [slug, setSlug] = useState("");
  const [audioFilename, setAudioFilename] = useState("");
  const [cursor, setCursor] = useState(0); // index of the next untimed line
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState("edit"); // "edit" | "preview"

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  function handlePickAudio(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setAudioName(file.name);
    if (!audioFilename) setAudioFilename(file.name);
  }

  function loadLines() {
    const parsed = rawLyrics
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ id: uid(), t: null, text, note: "" }));
    setLines(parsed);
    setCursor(0);
  }

  function tap() {
    const audio = audioRef.current;
    if (!audio || cursor >= lines.length) return;
    const t = Math.round(audio.currentTime * 100) / 100;
    setLines((prev) => prev.map((l, i) => (i === cursor ? { ...l, t } : l)));
    setCursor((c) => c + 1);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.code === "Space" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        tap();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, lines.length]);

  function nudge(id, delta) {
    setLines((prev) =>
      prev.map((l) => (l.id === id && l.t != null ? { ...l, t: Math.max(0, Math.round((l.t + delta) * 100) / 100) } : l))
    );
  }

  function retime(id) {
    const idx = lines.findIndex((l) => l.id === id);
    if (idx === -1) return;
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, t: null } : l)));
    setCursor(idx);
  }

  function setNote(id, note) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, note } : l)));
  }

  function seekTo(t) {
    if (audioRef.current && t != null) audioRef.current.currentTime = t;
  }

  function exportJson() {
    const notes = {};
    const exportLines = lines.map((l, i) => {
      const line = { id: l.id, t: l.t ?? 0, text: l.text };
      if (l.note.trim()) {
        const noteId = `n${i + 1}`;
        notes[noteId] = { body: l.note.trim() };
        line.note = noteId;
      }
      return line;
    });
    const json = JSON.stringify({ lines: exportLines, notes }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "song"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const notes = data.notes || {};
        const imported = (data.lines || []).map((l) => ({
          id: l.id || uid(),
          t: typeof l.t === "number" ? l.t : null,
          text: l.text || "",
          note: l.note && notes[l.note] ? notes[l.note].body : "",
        }));
        setLines(imported);
        setCursor(imported.findIndex((l) => l.t == null));
      } catch {
        window.alert("that file isn't valid JSON in the expected shape");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const allTimed = lines.length > 0 && lines.every((l) => l.t != null);

  // Reshapes the editor's own {id, t, text, note: bodyString} lines into
  // exactly what LyricsPlayer takes — the same conversion exportJson does,
  // just kept in memory instead of round-tripped through a downloaded file.
  // Each line's own id doubles as its note's id; nothing dedupes shared notes
  // the way a hand-written content/lyrics file might, but that only affects
  // how the export JSON is organized, not what this preview shows.
  const preview = useMemo(() => {
    const notes = {};
    const previewLines = lines.map((l) => {
      const line = { id: l.id, t: l.t ?? 0, text: l.text };
      if (l.note.trim()) {
        notes[l.id] = { body: l.note.trim() };
        line.note = l.id;
      }
      return line;
    });
    return { lines: previewLines, notes };
  }, [lines]);

  if (mode === "preview") {
    return (
      <main className="editor">
        <button type="button" className="back" onClick={() => setMode("edit")}>
          ← back to editing
        </button>
        <LyricsPlayer
          song={{ title: slug || "watching it back" }}
          audioSrc={audioUrl}
          lines={preview.lines}
          notes={preview.notes}
        />
        <style jsx>{`
          .editor {
            max-width: 640px;
            margin: 0 auto;
            padding: 2rem 1.2rem 4rem;
          }
          .back {
            font: inherit;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            border: 1px solid var(--field-line);
            background: var(--field);
            color: var(--ink);
            cursor: pointer;
            margin-bottom: 1rem;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="editor">
      <h1>sync editor</h1>
      <p className="hint">dev-only — never deployed. See the comment at the top of this file for the workflow.</p>

      <section className="row">
        <label>
          audio file
          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handlePickAudio} />
        </label>
        <label>
          import existing JSON
          <input ref={importInputRef} type="file" accept="application/json" onChange={handleImport} />
        </label>
      </section>

      {audioUrl && (
        <section className="transport">
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <span className="now">{audioName} — {currentTime.toFixed(2)}s {playing ? "(playing)" : ""}</span>
          <button type="button" className="tap" onClick={tap} disabled={cursor >= lines.length}>
            TAP (or press Space)
          </button>
        </section>
      )}

      <section className="row">
        <label className="grow">
          paste lyrics — one line per row
          <textarea rows={6} value={rawLyrics} onChange={(e) => setRawLyrics(e.target.value)} />
        </label>
        <button type="button" onClick={loadLines}>
          load lines
        </button>
      </section>

      {lines.length > 0 && (
        <>
          <p className="hint">
            {lines.filter((l) => l.t != null).length} / {lines.length} timed
            {cursor < lines.length ? ` — next up: line ${cursor + 1}` : " — all timed"}
          </p>
          <ol className="lines">
            {lines.map((l, i) => (
              <li key={l.id} className={i === cursor ? "current" : l.t != null ? "done" : ""}>
                <span className="text" onClick={() => l.t != null && seekTo(l.t)}>
                  {l.text}
                </span>
                <span className="time">{l.t != null ? `${l.t.toFixed(2)}s` : "—"}</span>
                {l.t != null && (
                  <span className="controls">
                    <button type="button" onClick={() => nudge(l.id, -0.5)}>−0.5</button>
                    <button type="button" onClick={() => nudge(l.id, -0.1)}>−0.1</button>
                    <button type="button" onClick={() => nudge(l.id, 0.1)}>+0.1</button>
                    <button type="button" onClick={() => nudge(l.id, 0.5)}>+0.5</button>
                    <button type="button" onClick={() => retime(l.id)}>retime</button>
                  </span>
                )}
                <input
                  className="note"
                  placeholder="+ note"
                  value={l.note}
                  onChange={(e) => setNote(l.id, e.target.value)}
                />
              </li>
            ))}
          </ol>

          <section className="export row">
            <label>
              song slug
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. nothing-but-love" />
            </label>
            <label>
              served audio filename
              <input
                value={audioFilename}
                onChange={(e) => setAudioFilename(e.target.value)}
                placeholder="e.g. nothing-but-love.m4a"
              />
            </label>
            <button type="button" onClick={exportJson} disabled={!allTimed || !slug}>
              export JSON
            </button>
            <button
              type="button"
              className="watch"
              onClick={() => setMode("preview")}
              disabled={!allTimed || !audioUrl}
            >
              ▶ watch it back
            </button>
          </section>
          {!allTimed && <p className="hint">every line needs a time before exporting or watching it back.</p>}
          {slug && (
            <p className="hint">
              remember to add <code>{`{ "slug": "${slug}", "title": "…", "audio": "${audioFilename || "…"}" }`}</code> to
              album.json too.
            </p>
          )}
        </>
      )}

      <style jsx>{`
        .editor {
          max-width: 860px;
          margin: 0 auto;
          padding: 2rem 1.2rem 4rem;
          color: var(--ink);
          font-family: system-ui, sans-serif;
        }
        h1 {
          font-family: var(--font-title);
          font-weight: 400;
        }
        .hint {
          color: var(--ink-dim);
          font-size: 0.9em;
        }
        .row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: flex-end;
          margin: 1.2rem 0;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-size: 0.85em;
          color: var(--ink-dim);
        }
        .grow {
          flex: 1;
          min-width: 260px;
        }
        textarea,
        input {
          font: inherit;
          padding: 0.4rem 0.55rem;
          background: var(--field);
          border: 1px solid var(--field-line);
          color: var(--ink);
          border-radius: 6px;
        }
        button {
          font: inherit;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          border: 1px solid var(--field-line);
          background: var(--field);
          color: var(--ink);
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .transport {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin: 1rem 0;
          padding: 0.8rem;
          background: var(--field);
          border-radius: 10px;
        }
        .now {
          font-size: 0.85em;
          color: var(--ink-dim);
          font-variant-numeric: tabular-nums;
        }
        .tap {
          background: var(--accent);
          color: var(--deep);
          border: none;
          font-weight: 600;
        }
        .watch {
          background: var(--accent-2);
          color: var(--deep);
          border: none;
          font-weight: 600;
        }
        .lines {
          list-style: none;
          margin: 1rem 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .lines li {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 0.6rem;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          background: var(--field);
        }
        .lines li.current {
          outline: 2px solid var(--accent);
        }
        .lines li.done .text {
          color: var(--ink-dim);
        }
        .text {
          cursor: pointer;
        }
        .time {
          font-variant-numeric: tabular-nums;
          color: var(--ink-dim);
          font-size: 0.85em;
        }
        .controls {
          display: flex;
          gap: 0.25rem;
          grid-column: 1 / -1;
        }
        .controls button {
          padding: 0.2rem 0.5rem;
          font-size: 0.8em;
        }
        .note {
          grid-column: 1 / -1;
          font-size: 0.85em;
        }
        code {
          font-size: 0.85em;
        }
      `}</style>
    </main>
  );
}
