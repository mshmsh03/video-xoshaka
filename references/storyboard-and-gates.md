# Storyboard, design file and approval gates

Ideas borrowed from HeyGen's HyperFrames skills (`product-launch-video`, `faceless-explainer`, `general-video`; reviewed 2026-10-15), adapted to this Remotion pipeline. Those skills use a different engine (HTML compositions and their own CLI), so they are not installed here; only the workflow ideas are.

## Contents
- The files and the order they are made in
- design.md template
- STORYBOARD.md template
- Approval gates
- Parallel scene workers
- Captions that earn their place
- Freshness and usage checks

## The files and the order they are made in

| File | Made at | Holds |
| --- | --- | --- |
| `brief.md` | Interview | What the person wants (brief.md in this folder) |
| `design.md` | After the brief, before the script | The look: colours, fonts, logo, motion rules |
| `story.json` | Script | The words, per scene |
| `STORYBOARD.md` | After the script | Per scene: the line, the visuals, the sound, the word each visual lands on |
| the Remotion project | Build | The scenes, from the storyboard |

Each file feeds the next and nothing is built from memory. If something changes, change the earliest file it touches, then everything after it.

## design.md template

Write it from the brief's look-and-feel answers and the person's real brand assets. Keep it to one screen.

```
# Design
- Palette: background #..., text #..., accent #..., plus one alert/pop colour
- Fonts: headline <font> (weight), body <font>; script support: <Latin | Arabic | Kurdish Sorani>
- Logo: <file>, safe area <px>, where it appears (end card, corner)
- Mood: <3 words>, references: <what they showed>
- Motion: easing <spring | bezier>, scene transition <fade | slide>, speed <calm | quick>
- Text: headline >= <px>, supporting >= <px>, caption position y=<px>, safe zones <platform>
- Never: <things to avoid, e.g. letter-by-letter reveals for Arabic/Kurdish, text over busy areas without a backing>
```

Use `@remotion/google-fonts` for fonts, and check by eye that Arabic or Kurdish text renders joined and in the right direction.

## STORYBOARD.md template

One row per scene, written before any scene component:

```
| # | id | Line (text) | On screen | Sound | Lands on word | Seconds (from voice) |
|---|----|-------------|-----------|-------|----------------|----------------------|
| 1 | freeze | "Yep. That's me." | Their clip freezes, white flash, sticker | record scratch | "me" | 3.2 |
```

Fill "Seconds" only after the voice step; never guess it. Mark scenes that need a file the person hasn't sent yet ("needs: logo.svg"). Use the storyboard to spot problems early: a scene with two ideas, a scene with no visual, two gags in a row, a hook that takes more than three seconds.

## Approval gates

Stop and get a clear yes from the person at these points. Do not continue on silence, and do not treat a gate as passed because the person said "go ahead" about something else.

1. **Brief** (end of the interview): "Anything to change?" Then save `brief.md`.
2. **Script and storyboard:** show the lines and the storyboard table. Changing words is cheap now and expensive later.
3. **Voice:** the person picks the narrator by ear from samples.
4. **Preview:** show the Studio preview or the key stills. Ask what to change before rendering.
5. **Final render and delivery:** render only after the preview is approved, or when the person explicitly asks for the file.

In an unattended session (the person is away), do the preparatory work, write down what you assumed, and stop at gates 2, 3 and 4 rather than guessing; those are where wrong guesses cost the most.

## Parallel scene workers

When a video has many independent scenes (a promo with 8 scenes, a recap), build them in parallel: one subagent per scene, each given only `brief.md`, `design.md`, its storyboard row, the shared components (`PhotoCard`, `Devices`, `Counter`, `Narration`, `motion.ts`) and the voice timings for that scene. Each returns one scene component. The main session then assembles `StoryVideo.tsx`, runs the stills for every scene, and fixes seams (transitions, music ducking, repeated visuals). Don't parallelise below about 5 scenes; the coordination costs more than it saves.

## Captions that earn their place

The standard is clear word-by-word or phrase captions in the safe zone. A more cinematic option is to place one caption behind the speaker (needs a background-removed matte of the talking-head footage, which `media-use` can produce) at the single most emotional word. The HyperFrames `embedded-captions` skill calls embedding every word the common mistake: keep that effect for one or two peaks, and offer it only when the style is cinematic and the footage is a single person talking to camera.

## Freshness and usage checks

- Before relying on any helper skill or CLI (`media-use`, `heygen`, the Remotion skills), check it is installed and current; if an update fails, say so and don't continue from memory of how it used to work.
- If the HeyGen tools report usage limits, check them at the start and again before the final render, and tell the person what is left. If usage is unknown, say so rather than guessing.
- Run `npx hyperframes media-use resolve --doctor` before the first catalog search to confirm setup.
