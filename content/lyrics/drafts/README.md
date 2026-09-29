# content/lyrics/drafts

Transcribed from Saba Lou's commentary email (2026-09-09, to Sebastian) —
every lyric line and the commentary paragraph(s) directly above it, per her
own instruction that "each commentary line/paragraph refers to the lyric
line/lines above it." **Not timed yet** (every `t` is `null`) and **not**
read by the live player — these are inputs to `/dev/sync-editor`, not outputs.

## Real track order (from the actual masters, not the email)

The email presents the songs in a different order than the album itself.
The masters in Supabase (`post-variations/audio-library/4/`, Las Aguas
project `gtccctajvobfvhlonaot`) are named with their real side/track number:

| # | side | song | master file | draft |
|---|------|------|---|---|
| 1 | A | She | `1790006175324-She_Side_A_1.wav` | [she.json](she.json) |
| 2 | A | UV Catastrophe | `1790006220499-UV_Catastrophe_Side_A_2.wav` | **missing** — her email says the commentary isn't written yet |
| 3 | A | My Umami | `1790006307095-My_Umami_Side_A_3.wav` | [my-umami.json](my-umami.json) |
| 4 | A | Until the Cherries Bloom Again | `1790006328105-Until_the_Cherries_Bloom_Again_Side_A_4.wav` | [until-the-cherries-bloom-again.json](until-the-cherries-bloom-again.json) |
| 5 | A | Blissfully Still | `1790006369187-Bilssfully_Still_Side_A_5.wav` (typo in the filename itself) | [blissfully-still.json](blissfully-still.json) |
| 6 | B | Nothing But Love | `1790006513085-Nothing_But_Love_Side_B_6.wav` | [nothing-but-love.json](nothing-but-love.json) |
| 7 | B | Part of Me | `1790006496634-Part_of_Me_Side_B_7.wav` | [part-of-me.json](part-of-me.json) |
| 8 | B | Where All Unbinds | `1790006532215-Where_All_Unbinds_Side_B_8.wav` | [where-all-unbinds.json](where-all-unbinds.json) |
| 9 | B | Am I Willing | `1790006551765-Am_I_Willing_Side_B_9.wav` | [am-i-willing.json](am-i-willing.json) |
| 10 | B | Infinitely Less | `1790006583967-Infinitely_Less_Side_B_10.wav` | [infinitely-less.json](infinitely-less.json) |
| 11 | B | Devoted | `1790006596831-Devoted_Side_B_11.wav` | [devoted.json](devoted.json) |

So UV Catastrophe sits in the *middle* of side A, not tacked on the end —
worth knowing once its commentary exists and it needs slotting in.

These are WAV masters, uploaded 2026-09-21 into `post-variations`, a
**public** bucket used for the dashboard's social-post assets — not a place
these should be served from for the album kit (see TODO.md's NFC section).

**Done (2026-09-29):** all 11 downloaded, verified byte-for-byte against
Supabase's own recorded size, encoded to AAC (`ffmpeg -c:a aac -b:a 192k`),
and duration-checked against the source WAV (0.000s drift on every one). The
encoded files are staged in `public/nfc-audio/<slug>.m4a` (gitignored — local
only), named to match these drafts, ready to open directly in
`/dev/sync-editor`. Raw WAVs deleted after the check — they're just copies of
what's already safe in Supabase. These `public/nfc-audio/` files are also the
exact ones to upload into the real private bucket once it exists (see
TODO.md) — don't re-encode from the WAVs again, time and ship these.

## A few calls I made transcribing this

- Where a comment referred to *several* lines above it, every one of those
  lines carries the same note (so it stays visible for the whole passage it's
  about, not just the last line sung) rather than only the final line.
- Where a song opens with a general remark before any lyric at all (e.g. "SHE
  stands for the standard hydrogen electrode...", "this song was born
  from..."), I folded it into the first line-group's note rather than
  dropping it, since there's nowhere else for it to attach to.
- A handful of repeated chorus lines got no note at all where her commentary
  visibly skipped past them to comment on what came right after instead (e.g.
  in "she" — several "she seems to be what everybody wants" repeats carry no
  note, exactly where the email's commentary jumps past that repeat to the
  next couplet).
- Typos in her own text are kept exactly as written (e.g. "yous skin",
  "haver you ever", "enjowment") — not mine to silently correct.
- Time every line against the album's real title order above, not the order
  these files happen to sit in on disk.
