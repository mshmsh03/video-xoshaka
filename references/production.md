# Production

## Contents
- Project setup
- Files and what they do
- Components cheat sheet
- Formats and preview
- Screenshots and app images
- Verifying (stills and audio)
- Pitfalls we already hit

## Project setup

Follow the `remotion-create` skill to scaffold (blank, no Tailwind) into a
new subfolder of the person's projects folder. Then:

```bash
npx remotion add @remotion/transitions @remotion/google-fonts @remotion/media @remotion/captions
npm i -D kokoro-js@1.2.1
mkdir -p public/photos public/shots public/sfx public/bgm scripts
```

Copy from this skill:
- `assets/template/src/*` → `src/`. You get `theme.ts`, `ChapterLabel.tsx`, and
  `story/` with the components, `StoryVideo.tsx`, `voice.ts` and a sample
  `story.json`.
- `scripts/*.mjs` → the project's `scripts/`. They have to live inside the
  project: Node resolves `kokoro-js` from the script's own folder, so running
  them from the skill folder fails with `ERR_MODULE_NOT_FOUND`.

Add `"resolveJsonModule": true` to tsconfig `compilerOptions`. Register the
composition in `src/Root.tsx`:

```tsx
<Composition id="StoryVideo" component={StoryVideo}
  durationInFrames={STORY_VOICE.totalFrames} fps={30} width={1080} height={1920} />
```

Download the sound effects you'll use into `public/sfx/` (`curl -sfo
public/sfx/<name>.wav https://remotion.media/<name>.wav`). Good ones are
`whoosh`, `mouse-click`, `record-scratch`, `vine-boom`, `windows-xp-error` and
`ding`. The full list is in the remotion-markup skill's `sfx.md`.

Voice: run `node scripts/voice-samples.mjs "<a line from their story>"`, open
`out/voice-samples/`, and let the person choose. Don't pick a voice from their
name. Put the choice in `story.json`, then `node scripts/make-voice.mjs`. The
first run downloads the model (about 330 MB).

## Files and what they do

| File | Role |
| --- | --- |
| `src/story/story.json` | the script: scenes, text/say, lead/hold, voice, speed |
| `scripts/make-voice.mjs` | TTS per scene → `public/voice/<id>.wav` + `src/story/voice.json` (durations, word timings) |
| `src/story/voice.ts` | `sceneVoice`, `wordAt`, `voiceEnd` |
| `src/story/StoryVideo.tsx` | the timeline: scenes in a `TransitionSeries`, music with ducking/silences, whooshes |
| `src/story/Narration.tsx` | plays a scene's voice and shows the captions (phrase pages, current word in accent) |
| `src/story/scenes/*` | `FreezeScene` (cold open), `BeatScene` (chapter + visuals + narration) |
| `assets/examples/` (skill) | the full "My life with Claude" scenes and timeline to copy gags from |

## Components cheat sheet

- `<Narration id hideWords={[[5, 8]]} showCaptions />`: hide the words the scene
  shows itself (a quote); turn captions off where on-screen text says the same.
- `<PhotoCard base="friend1" name initial size mediaAspect={640/360} focusY={0.78} />`:
  a polaroid that finds `public/photos/<base>.(jpg|png|webp|gif|mp4|mov|webm)`
  through `getStaticFiles()`, which works in Studio and in renders. It falls
  back to a big initial. Video is muted and looped. `mediaAspect` (height/width)
  plus `focusY` (0 top, 1 bottom) crop a portrait clip to the square.
- `<Laptop width>`, `<Phone width>`, `<Shot src="shots/x.png" />`: device mockups.
  Animate a 3D tilt on the wrapper with
  `transform: perspective(2200px) rotateY(...)`. Slide in a new `Shot` with
  `translate: "100% 0%" → "0% 0%"` on a narration word.
- `<Terminal title lines={[{ at, kind: "typed"|"output"|"error"|"success", text, sound }]} />`:
  types at 26 chars/s, plays `sound` when a typed line finishes or an error
  appears.
- `<Counter at value suffix label finalText="∞" />`: counts up over 0.9 s, then
  can swap to a joke value.
- `fadeUp(frame, start, fps, distance)`, `popIn(frame, start, fps)` (sticker slap
  with overshoot), `appear(...)`.
- Layout for 1080×1920: chapter label at y 180, visuals between 300 and 1400,
  captions from 1470. Keep 100 px side margins. Headlines are at least 84 px;
  supporting text at least 44 px.
- **Platform safe zones.** Instagram Reels, TikTok and Shorts lay their own
  username, caption and buttons over roughly the bottom 400 px and the right
  140 px. For those, pass `top={1300}` to `Narration` (or `captionTop` to
  `BeatScene`), move titles up, and keep stickers off the right edge. WhatsApp
  Status covers far less, so the default 1470 is fine there. Tell the person to
  turn off the app's auto-captions and not to add the app's music on top.

## Formats and preview

The composition size sets the format (styles.md, "Formats and safe zones"). The `Root.tsx` example in "Project setup" is vertical; for landscape use `width={1920} height={1080}`, for square `1080 x 1080`, for portrait feed `1080 x 1350`, and reposition captions, titles and visuals for that size instead of reusing the 1080 x 1920 layout numbers.

Start `npx remotion studio` as soon as the project runs and keep the preview open while building. Render the MP4 when the person asks for the file or when delivering a video to post.

## Screenshots and app images

- **Live sites:** headless Chrome, with a separate profile so it doesn't touch
  the person's own.

  ```bash
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
    --user-data-dir="<scratch>/chrome-profile" --virtual-time-budget=8000 \
    --window-size=1440,900 --screenshot="<abs>/public/shots/site.png" "https://example.com/en/"
  ```

  Use `--window-size=390,844` for phone shots. Take a phone shot of every site
  that appears on the laptop, so the phone matches.
- **Apps:** look in the projects for `docs/screenshots/` or golden test images
  (`test/**/goldens/*.png`) before taking new screenshots.
- Read each image before using it: check for private data, empty areas, and
  whether it's the right page.

## Verifying (stills and audio)

You can't hear the video, so measure it and look at frames:

1. **Stills.** Run
   `node scripts/stills.mjs StoryVideo end:open "reaction@advice+0.6" "pressure@websites+0.4"`.
   It bundles once and renders each spec (`end:<scene>`, `word@scene+sec`, or a
   frame number) to `out/stills/`. Read every PNG. Check that:
   - each punchline visual is visible on its word
   - nothing overlaps or wraps awkwardly ("Mr." alone at a line end: use
     `&nbsp;`)
   - nothing peeks out from behind a zoom
   - each scene's last gag lands before its fade starts (`end:<scene>`)
2. **Render to a new filename** each time (`out/<name>-v2.mp4`, `-v3`). On
   Windows, a video open in the player locks the file, and Remotion's final
   rename fails with `EPERM`. The finished render is then still in
   `*.remotion-in-progress`, and you can just rename it.
3. **Audio.** Run `node scripts/check-audio.mjs out/<file>.mp4 --at 1.25-1.9`.
   Speech should be around -20 dBFS, with the music bed 8 to 12 dB under it, no
   clipped samples, and quiet spots where you planned silences.
4. **Frames from the final file** for anything time-sensitive:
   `npx remotion ffmpeg -ss <sec> -i out/x.mp4 -frames:v 1 -vf scale=540:-1 out/check.png`.
5. **Open it** for the person (`Invoke-Item` on Windows, `open` on macOS).
   Tell them plainly that you checked frames and measured the audio, but
   couldn't listen. Ask them to judge the music mood and pronunciation.

## Pitfalls we already hit

- **Captions stretched over a second.** The voice script matches pauses to
  punctuation with a small alignment. Abbreviations like "Mr." are excluded, and
  you should write "Mister" in `say` anyway. If a word still takes over a second,
  check `make-voice.mjs`'s "x/y breaks" line and rephrase.
- **`remotion render --frames` fails** with `EINVAL ... write` from
  `inline-audio-mixing` once there is scene audio. `--muted` doesn't help.
  Use `stills.mjs`, which bundles and then runs `remotion still`.
- **`EPERM` on rename after a render:** see "Render to a new filename" above.
- **The bundled ffmpeg** (`npx remotion ffmpeg`) lacks some filters (`fps`,
  `tile`). Extract frames one `-ss` at a time.
- **Gag lands during the fade:** the transition overlaps the last 15 frames.
  Raise the scene's `hold` instead of squeezing the gag.
- **Hand-held clips pan.** Something hidden in one frame shows up in the
  next. Check at least four frames across the clip before choosing `focusY`.
- **The length creeps up** as jokes are added. Tell the person the length and
  offer the easiest scene to cut.
