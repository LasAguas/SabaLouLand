# content/lyrics

The data behind `/k/<code>` (see [components/LyricsPlayer.js](../../components/LyricsPlayer.js)
and [pages/k/\[code\].js](../../pages/k/[code].js)).

```
album.json          track list: { title, songs: [{ slug, title, audio }] }
<slug>.json         one song's lines + notes
```

`<slug>.json` shape:

```json
{
  "lines": [
    { "id": "l1", "t": 12.4, "text": "the first line" },
    { "id": "l2", "t": 16.9, "text": "the second line", "note": "n1" }
  ],
  "notes": {
    "n1": { "body": "the annotation for l2" }
  }
}
```

- `t` is the second that line starts, against the **exact audio file** named
  in `album.json` — re-encoding that file shifts every timestamp, so time the
  file you're actually going to serve, not a WAV master.
- `note` is optional and points at a key in `notes`, not the other way round —
  a line can carry at most one note this way. `notes` being keyed by id rather
  than by array position means re-timing or reordering lines never detaches a
  note from the line it belongs to.
- Don't hand-time these. Use `/dev/sync-editor` (dev-only, see that file) —
  play the real audio, tap along, export this exact JSON.

`example-song.json` is a placeholder to show the shape and to give the player
something to render — replace it (and its entry in `album.json`) with the real
tracks once they're timed.
