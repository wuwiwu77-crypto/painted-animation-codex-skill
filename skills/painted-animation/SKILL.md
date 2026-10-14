---
name: painted-animation
description: "Create hand-painted watercolour-and-ink animated videos, shorts, cartoons, music videos, lyric videos, and seamless loops in code with p5.js, p5.brush, headless Chrome, and FFmpeg. Use for requests that need character acting or a handmade 2D animation style. Do not use for photorealistic footage or ordinary video editing."
---

# Painted animation

Create complete MP4 animations procedurally. Every frame must be a pure function of time so rendering stays deterministic, parallel, and resumable.

Explicit user instructions override this style guide. Keep filesystem and external-action permissions within the user's request.

## Start a project

Use Node.js/npm, Chrome and FFmpeg from the user's environment. The scaffolder searches project and skill ancestors for optional portable tools under "video-tools/runtime"; the renderer searches project ancestors. Honour NPM_PATH, CHROME_PATH and FFMPEG_PATH overrides. A local helper such as "video-tools/use-video-tools.ps1" is optional and is not bundled. Do not assume the original author's directory layout or require system-wide installation when project-local tools are present.

Run the bundled cross-platform scaffolder using the absolute path of this skill:

    node "<skill-dir>/scripts/new_project.mjs" "<project-dir>"

Use "--keep-demo" only when the user asks to retain the example scene. The script copies "template/", installs packages, and checks Chrome and FFmpeg. If a required executable is missing, report it precisely; do not silently substitute a different production method.

Before designing, read "<project-dir>/ANIMATION_GUIDE.md" completely. For a music video or anything longer than about 20 seconds, also read [references/music-video.md](references/music-video.md). For sung storytelling, on-screen lyrics, or revisions to an MV, also read [references/lyric-direction.md](references/lyric-direction.md): it governs audio alignment, readable imagery, distinct acting, transitions, and lyric composition. Ask for missing audio/timed lyrics; do not request material already supplied. If no LRC exists, use the alignment fallback in that reference. "scripts/beat_grid.py" measures rhythm, not sung-word timing.

For a substantial lyric-video or multi-scene character project, consult the [Xiaozhen worked example](examples/xiaozhen/STORYBOARD.md) and its adjacent scene files. Do not load the example for ordinary short animations.

Render the built-in model sheets instead of depending on pre-rendered reference images:

    node render.mjs --loop=emotions --sheet=0 --out=out/check/emotions.jpg
    node render.mjs --loop=views --sheet=0 --out=out/check/views.jpg

Inspect generated images with the available local image-viewing capability.

## Workflow

1. Write "STORYBOARD.md" before scene code. Include the logline, world and palette arc, recurring motif, emotional arc, shot timing, transitions, and timed viewer reads.
2. Show a new or materially redesigned storyboard to the user and wait for feedback unless they asked to proceed without review. An approved revision plan is sufficient; do not re-request the same approval. For a concrete correction, update the affected storyboard rows and preserve approved timing and content.
3. Build one IIFE-wrapped scene file at a time in "src/scenes/"; register it in "studio.html" and end it with "shots([[t0, fn], ...])".
4. Block strong key poses first. Add in-between motion only after the poses read clearly as still images.
5. Render and inspect every shot repeatedly:

       node render.mjs --sheet=0.1,0.8,1.6,2.4 --cols=4 --w=480 --out=out/check/a.jpg
       node render.mjs --strip=2.1:2.6 --out=out/check/strip.jpg
       node render.mjs --sheet=2.3 --crop=760,420,500,400 --w=500 --out=out/check/face.jpg

6. Check story readability, timing, character scale, anticipation, follow-through, contacts, transitions, colour, line boil, and visual continuity. For MVs, also apply the lyric-direction acceptance checks: compare audio anchors to both text and action, inspect expression/contact crops and every seam, and verify the intended font in the render browser. Fix defects before full rendering.
7. Render the final video:

       node render.mjs --clip --out=out/video.mp4

   For longer work, use resumable frames:

       node render.mjs --frames --workers=4
       node render.mjs --encode --out=out/video.mp4 --audio=assets/song.mp3

Report the absolute output path, duration, and observed render speed. Do not claim to have heard audio; verify it analytically when direct playback is unavailable.

## Creative invariants

- Use "paint()" and "inkLine()" for the handmade medium. Keep the image flat and use drawn key views rather than 3D projection.
- Avoid explanatory text. Show the idea through action; karaoke and a few large sound effects are the narrow exceptions.
- When lyrics are requested, treat them as part of the art direction, not mandatory bottom-centred subtitles. Honour the requested ending and concrete visual corrections; do not reintroduce rejected motifs through embellishment.
- Every shot needs an event with cause and reaction. Give each viewer read enough time to land.
- Keep the frame alive through acting, camera drift, environmental motion, or line boil.
- Transition every seam in a way that belongs to the story.
- Maintain one world, colour arc, emotional thread, and ending that rhymes with the opening.
- Frames render out of order: do not keep state between frames or use "Math.random()". Use "hash()" for stable variation and "boilSeed()" for separate painted elements.

## Long work and collaboration

Keep shared characters, props, palette, lyric timing, and recurring motifs in stable shared files. Split chapters only when the user explicitly requests subagents and the current environment supports them. Otherwise build chapters sequentially.

The original engine and method are adapted from the MIT-licensed "opus-video-skills" project and ClaudeAnimationBase; preserve attribution and license notices when redistributing.
