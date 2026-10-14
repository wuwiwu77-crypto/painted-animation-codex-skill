# Long-form and music videos (lessons from the P(doom) video)
The original P(doom) music video (156.6 s, 9 chapters, ~7,800 lines) was built from only two high-level instructions: "use the Clawd character" and "give each lyric interesting visuals and transitions". This file captures how it was organised, so Codex can build a video longer than ~20 s the same way.
Its storyboard is at [PDoomVideo/STORYBOARD.md](https://github.com/JohnHeibel/PDoomVideo/blob/main/STORYBOARD.md); a finished lyric video made with this skill is in [examples/xiaozhen](../examples/xiaozhen/).
## 1. Lock the song grid first
- For sung storytelling and lyric overlays, read [lyric-direction.md](lyric-direction.md) before timing or visual design. It covers alignment without an LRC, acting, transitions, typography, and revision checks.
- **Use the supplied song and matching LRC/timestamps**; ask only for missing material. If no timed lyrics are available, follow the audio-alignment fallback in that reference rather than guessing equal-length shots. Tempo analysis does not locate sung words.
- Measure the tempo and beat phase: `python3 scripts/beat_grid.py song.mp3 --from=100 --to=200 --lrc=song.lrc` (needs numpy). It prints the BPM, a beat time, and each lyric line's beat index. Lines usually start a fraction of a beat before a bar line (pickups).
  - P(doom): 88 BPM, beat 0.682 s. 小镇姑娘: 154 BPM (half-time 77), one line = 8 beats ≈ 3.1 s.
  - For a ballad, set `PROJECT.bpm` to the half-time pulse so idles and bounces don't look frantic.
- **Preserve a user-specified clip range.** Only when the range is flexible, consider starting on a bar line with room around the lyrics and a fade:
  `ffmpeg -ss <start> -t <len> -i song.mp3 -af "afade=t=in:d=.25,afade=t=out:st=<len-2>:d=2" -c:a aac assets/clip.m4a`.
  Clip time = song time − start. Measure beat phase relative to that start; set `offset: 0` only if a beat actually lands at clip time 0.
- Lyric table `LY` in `src/karaoke.js`: `[start, end, "text", opts]` in clip time, lines running into each other. `opts.sing` = seconds to sing the line (drives the fill); `opts.hold` keeps a line up (lifted, two-row KTV style) after the next starts; `opts.pun = { from, to, at }` strikes `from` and pops `to` above it.
- **Fast lines, one clear visual idea per line.** Budget using actual phrase durations, not a fixed eight beats. Place semantic action on its audio-verified keyword. A supporting motion may continue across a boundary, but the new lyric must get its matching visual focus. Do not slow the song or carry over stale captions to make the animation fit.
- Put the audio in `assets/` and set `PROJECT = { duration, bpm, offset, audio: 'assets/clip.m4a' }`.
- Write the beat times of each chapter at the top of its file as a comment: `const B = n => OFF + n * BEAT; // B(4) 2.94 · B(12) 8.39 …` so hits land exactly.
## 2. Storyboard shape for a song
- **One idea for the whole video**, stated in a paragraph (P(doom): "a stage show that goes off the rails… the whole apocalypse was a play").
- **Cast table**: each recurring character, their look and their arc (Clawd grows tiny → planet-sized → back to cute).
- **What ties it together**: a recurring set (all choruses return to the *same stage*, escalating each time), an escalating motif (the P(doom) thermometer climbs 8→34→61→86→99.9), a palette arc, a rule for transitions.
- **Chapters** = song sections (intro, verse, chorus, bridge…). Each gets one setting and a small palette, e.g. `The Lab · night indigo, lamp ochre, monitor teal`.
- **Shot table per chapter**: `| Clip time | Lyric / keyword anchor | Event / reaction | Text placement | Transition in / out |`. Use measured phrase lengths; a continuous shot can cover several related lines. Track distinctive emotional poses and any contact between characters, not only props and effects.
- **Act the lyric, don't write it.** Every line is a visual gag that shows the meaning. The karaoke already carries the words, so no signs or captions that repeat them.
- A handful of big SFX across the whole video (FOOM, BOOM, CHOMP, SLAM) is fine; not more.
- End by rhyming with the opening (curtain opens at 0 s → curtain falls at the end).
## 3. Code layout for many chapters
- One file per chapter in `src/scenes/` (`c01_intro.js`, `c02_chorus1.js`, …), each an IIFE whose helpers stay private, ending with `shots([...])` for its shots. Add each `<script>` to `studio.html` in order.
- Shared, stable things (characters, recurring props like the stage/thermometer, palette, lyrics) live in shared files that chapter authors don't edit. Guest characters a later chapter reuses get exported on a shared object (`CAST.basilisk = (x, y, s, t, o) => {...}`).
- Chapter breaks get a transition (P(doom) used a brush wipe at each chapter boundary, with a different colour pair per chapter). Inside a chapter, the action carries across the cut.
- `src/karaoke.js` is a starting point for bottom-band karaoke, not the required lyric layout. It can load a brush font through `window.EXTRA_FONTS`; verify the actual font and glyphs in the render browser. For art-directed lyrics, adapt placement per scene or use a dedicated overlay, reading the same cue table as the animation. Reserve the bottom band only when that layout is selected; otherwise check text against moving faces, props and scene safe areas.
## 4. Parallel subagents (optional, for long videos)

P(doom)'s second generation was painted by parallel subagents, one per chapter, all briefed by the same guide. In this skill, do this only if the user explicitly asks for subagents and the environment supports them; otherwise build chapters yourself in order.
1. Write the storyboard, the shared files and at least one finished chapter yourself first, so there is a working reference for style and API.
2. Write a short `CHAPTER_BRIEF.md` in the project (the orchestrator's brief to subagents). It should contain:
   - "Read ANIMATION_GUIDE.md and STORYBOARD.md first."
   - Only edit your own chapter file. If a shared helper is missing, write it privately inside your IIFE. If you find a bug in a shared file, report it; don't edit it.
   - Frames are pure functions of `t` (they render in parallel, out of order): no state across frames, no `Math.random()`.
   - The canvas conventions (1920×1080, karaoke band), the beat grid, the chapter's palette, and the size rule (the lead character ≈ 40% of frame height in dance shots).
   - Performance budget: ≤ ~2.5 s/frame; hundreds of fills/strokes, not thousands.
   - The review loop: render sheets and strips of every shot, first/last frames, and the seams into and out of the chapter; open them and iterate until each shot is charming, readable and lively.
3. Spawn one subagent per chapter with that brief plus its chapter's storyboard rows and time range. Several can render at once.
4. When they finish, render sheets across every chapter seam yourself and fix continuity (palette, character scale, screen direction, the escalating motif).
## 5. Rendering a long video

```bash
node render.mjs --frames --workers=4          # parallel, resumable JPEG frames into out/frames
node render.mjs --encode --audio=assets/song.mp3 --out=out/video.mp4
```

`--frames` skips frames already on disk, so a crash or a fix to one chapter only needs `rm out/frames/f0XXXX.jpg` for that range and a re-run (or `--range=a:b`).
