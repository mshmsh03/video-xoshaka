# Toolbox

Everything this workflow uses, and when to reach for it. Check what is installed before relying on a tool: `~/.claude/skills` and `~/.agents/skills` hold the skills, and `wsl -l -v` shows whether WSL exists on Windows.

## Contents
- The Remotion skills
- media-use (HyperFrames Agent Media OS)
- Voice: Kokoro, HeyGen, ElevenLabs, their own recording
- Music and sound effects
- Screenshots, images and brand assets
- Verification tools
- This skill's own scripts and template
- Claude Code helpers

## The Remotion skills

Installed as `remotion-*` skills (the router is `remotion-best-practices`; they are version-matched to the installed Remotion, 4.0.535 at the time of writing). This skill sits on top of them: it decides what to make; they cover Remotion itself.

| Skill | Use it for |
| --- | --- |
| `remotion-best-practices` | The router. Preserve the person's own edits. Open the Studio preview early; render only when asked. |
| `remotion-create` | Scaffolding a project (`npx create-video@latest --yes --blank --no-tailwind`, into a new subfolder if the folder isn't empty) and a first composition. |
| `remotion-markup` | Writing the React markup: drive animation with `useCurrentFrame()` and `interpolate()`, get `fps` from `useVideoConfig()` for every seconds-to-frames calculation, use `Easing.bezier()` and `Easing.spring()`. CSS `transition`, CSS `animation` and Tailwind animation classes do not render correctly. |
| `remotion-render` | `npx remotion render` for video, `npx remotion still` for one frame. |
| `remotion-captions` | Caption JSON (`@remotion/captions`, the `Caption` type with `text`, `startMs`, `endMs`), transcribing audio or video to captions, and displaying and animating them. |
| `remotion-multimedia` | Mediabunny in the browser: audio duration, video duration and dimensions, trimming, cropping. |
| `remotion-maps` | Static maps, animated routes and markers, geographic explainers (Mapbox, MapLibre, MapTiler, GeoJSON, 3D flyovers). |
| `remotion-studio` | Studio CLI flags, opening a composition's exact local URL. |
| `remotion-interactivity` | Structuring markup so the person can change values in Studio and write them back to code. |
| `remotion-saas` | Remotion inside an app: `<Player>`, rendering on Lambda, Vercel, Cloudflare or Express, client-side rendering. |
| `remotion-docs` | Looking up current Remotion API documentation. |
| `remotion-upgrade` | Upgrading Remotion, its packages and these skills. |

Remotion packages this skill's template uses: `@remotion/transitions` (fades and slides in a `TransitionSeries`), `@remotion/google-fonts`, `@remotion/media` (the `Audio` component), `@remotion/captions`. Sound effects come from remotion.media as `.wav` files (`whoosh`, `mouse-click`, `record-scratch`, `vine-boom`, `windows-xp-error`, `ding`); the full list is in the `remotion-markup` skill's `sfx.md`.

Preview first: run `npx remotion studio` (add `--no-open` if the agent client has an in-app browser, then open the printed URL and confirm the composition loads). Visit one composition at `/<composition-id>`.

## media-use (HyperFrames Agent Media OS)

A skill (`~/.agents/skills/media-use`) with one main verb, `resolve`, that finds or generates a media file and records it in a ledger so it can be reused:

```bash
npx hyperframes media-use resolve --type <type> --intent "<description>" --project <dir>
```

| Type | What it gives |
| --- | --- |
| `bgm` | Background music from the HeyGen catalog (10k+ tracks), through the `heygen` CLI |
| `sfx` | Sound effects: a bundled library of 19 files, plus the catalog through the `heygen` CLI |
| `image` | Photos and backgrounds (HeyGen asset search) |
| `icon` | Icons and symbols, transparent |
| `logo` | Official brand marks (theSVG, then the GitHub avatar, then a favicon). Never redraw a brand's logo. |
| `voice` | TTS voiceover (HeyGen free-usage path; optional local Kokoro) |
| `grade` | A measured colour-correction candidate for footage |
| `lut` | A user-provided or explicitly chosen `.cube` file |

Also in it: `--candidates` to list reusable assets before resolving fresh, `--doctor` to check setup, an audio engine (voiceover, transcription, captions, background removal), operations on media (cut, reframe, transform), media treatments for footage that looks dark, flat or boring or should look retro, camcorder or print-like, and a rule for being proactive: scan once for signals (on-screen text with no voiceover, emoji used as icons, placeholder images, hard cuts with no sound, a piece over 10 s with no music, footage that is under- or over-exposed), then ask once and propose specific fixes instead of silently adding things. Read only the reference file the task needs (`references/resolve.md`, `grading.md`, `audio.md`, `operations.md`, `media-treatments.md`, `setup-providers.md`, `memory.md`).

Rules that matter here:
- If the environment variable `HEYGEN_API_BASE` is set, a host app pays for HeyGen. Don't ask the person to install or sign in to the `heygen` CLI; HeyGen calls go through the host. If a call is refused, tell the person the host's message as written and stop.
- Otherwise, to use HeyGen media (catalog search, TTS, avatar video), install and sign in to the `heygen` CLI, then check with `npx hyperframes media-use resolve --doctor`.
- Before generating a voiceover or an avatar video, tell the person that signing in with `heygen auth login --oauth` gives a free allowance for TTS and avatar videos, while an API key bills API credits.
- If the host app has its own music or sound-effect tools, use those first. `resolve --type bgm|sfx` needs the `heygen` CLI.
- Colour grading: don't generate a `.cube` LUT just to encode exposure or warmth, and don't fake supported effects with CSS or SVG overlays.

Install: `npx skills add heygen-com/hyperframes@media-use -g -y`. Avoid skills like `*/superpowers@ai-video-generation` and `prime-skills/*`: they show huge install counts from repos with a handful of stars.

## Voice

| Source | Cost | Notes |
| --- | --- | --- |
| Kokoro (`kokoro-js` 1.2.1) | Free, offline after the first ~330 MB model download | `scripts/voice-samples.mjs` writes samples of `am_michael`, `am_fenrir`, `bm_george`, `af_heart` and `bf_emma`; `scripts/make-voice.mjs` narrates a `story.json` and writes one WAV per scene plus `voice.json` (scene lengths in frames, word timings). Every scene is normalized to -20 dBFS RMS with silence trimmed. |
| The person's own recording | Free | Best for tributes. Needs the same per-word timings, so transcribe it (`remotion-captions`, or the `media-use` audio engine) to get them. |
| HeyGen TTS | Free allowance with OAuth sign-in | Through `media-use resolve --type voice`. |
| ElevenLabs | Paid API key | Offer it, don't assume it. |

The person picks the voice by ear from samples, never from their name or a guess about gender.

## Music and sound effects

Full setup is in music.md. The short version: use real royalty-free music from the HeyGen catalog (`media-use` or `scripts/heygen-music.mjs`), or ElevenLabs Music (`elevenlabs/skills@music`, paid), or a track the person supplies (fine for WhatsApp; copyrighted songs get muted or blocked on Instagram, TikTok and YouTube). Don't write music in code and call it done: it sounds cheap. Sound effects: remotion.media files, or `media-use resolve --type sfx`.

The HeyGen CLI is Linux and macOS only. On Windows, install it inside WSL and run it through `wsl`; the OAuth sign-in trick (run the login in the background with `BROWSER=echo`, read the printed URL, open it on Windows) is in music.md.

## Screenshots, images and brand assets

- **Live sites:** headless Chrome with its own profile (`--user-data-dir`), `--window-size=1440,900` for desktop and `390,844` for phone, `--virtual-time-budget=8000` so the page has loaded. Take a phone shot of every site shown on a laptop.
- **Apps:** look for `docs/screenshots/` or golden test images (`test/**/goldens/*.png`) in the repos first.
- **Read every image before using it:** check for private data, empty areas and that it is the right page.
- **Logos, icons, stock images:** `media-use resolve --type logo|icon|image`.
- **Photos and clips:** the person's own, found by base name in `public/photos/`. Check several frames of each clip.

## Verification tools

- **Stills:** `scripts/stills.mjs` bundles once and renders frames by number, by scene end (`end:<scene>`) or by word (`<word>@<scene>+<seconds>`) to `out/stills/`. Don't use `remotion render --frames` for this: it fails with `EINVAL` once the composition has scene audio.
- **Audio:** `scripts/check-audio.mjs` measures speech against the music bed, clipping, and spot windows (`--at 1.2-1.9`). Aim for speech near -20 dBFS and the bed 8 to 12 dB under it.
- **ffmpeg:** `npx remotion ffmpeg` is bundled. It lacks some filters (`fps`, `tile`), so extract frames one `-ss` at a time:
  `npx remotion ffmpeg -ss <sec> -i out/x.mp4 -frames:v 1 -vf scale=540:-1 out/check.png`.
- **Mediabunny** (`remotion-multimedia`): durations and dimensions of audio and video files.
- You can't hear the result. Say so in the delivery message and ask the person to judge the music and pronunciation.

## This skill's own scripts and template

| Path | What it is |
| --- | --- |
| `scripts/voice-samples.mjs` | Narrator samples to `out/voice-samples/` |
| `scripts/make-voice.mjs` | Narration for every scene, normalized, with word timings |
| `scripts/heygen-music.mjs` | Search the HeyGen music catalog and download picks (calls the CLI through `wsl` on Windows) |
| `scripts/stills.mjs` | Single-frame checks |
| `scripts/check-audio.mjs` | Loudness and balance measurement |
| `assets/template/src/` | `theme.ts`, `ChapterLabel.tsx`, and `story/` with `StoryVideo.tsx` (timeline, music ducking, transitions), `Narration.tsx` (captions), `PhotoCard.tsx`, `Devices.tsx` (laptop, phone, screenshot), `Terminal.tsx`, `Counter.tsx`, `motion.ts`, `voice.ts`, `scenes/BeatScene.tsx`, `scenes/FreezeScene.tsx`, a sample `story.json` |
| `assets/examples/` | The finished "My Life with Claude" scenes and timeline, to copy staging from |
| `evals/evals.json` | Test prompts and assertions for this skill |

The scripts must be copied into the Remotion project's own `scripts/` folder: Node resolves `kokoro-js` from the script's folder, so running them from the skill folder fails with `ERR_MODULE_NOT_FOUND`.

The template and example scenes were built for the funny story style (freeze-frame opener, reaction zoom, terminal gags). For other styles reuse the timeline, narration, captions, photo card, device mockups and counter, and write scenes for the style's shape (styles.md) instead of copying the gags.

## Related skills reviewed (2026-10-15)

Searched skills.sh for video skills. The strong matches are all from `heygen-com/hyperframes` (HeyGen's own repo, about 62.7k stars, Apache-2.0, security audits pass or warn): `product-launch-video`, `faceless-explainer`, `general-video`, `motion-graphics`, `embedded-captions`, `talking-head-recut`, `slideshow`, `music-to-video`, `pr-to-video`, `hyperframes-audio`, `hyperframes-creative`, and `media-use` (already used here). They build **HTML compositions with the `hyperframes` CLI, not Remotion**, so they are not installed here: they would run a second pipeline next to this one. Their workflow ideas were adopted instead (storyboard-and-gates.md): a brief file as the contract, a design file, a storyboard before building, user approval gates, one worker per scene, freshness checks, and embedded captions kept for one or two peaks.

If the person ever wants the HyperFrames engine instead, install a single skill with `npx skills add https://github.com/heygen-com/hyperframes --skill <name>` (for example `product-launch-video` for a website-based promo, or `faceless-explainer` for a text-to-video explainer), and tell them it replaces the Remotion steps for that video. Not recommended without checking: `*/superpowers@ai-video-generation` and `prime-skills/*` (huge install counts, repos with a handful of stars), and `remotion-to-hyperframes` (only for porting).

The `npx skills find` search returned nothing from the cloud sandbox for any query, even "remotion", so use skills.sh directly or run the command on the PC.

## Claude Code helpers

- **AskUserQuestion** for the brief and for each approval gate.
- **A research subagent** (Explore or similar) to read the person's notes or repo history and return a dated timeline, the arc and a list of private things. Ask for real dates only.
- **find-skills** to discover another skill when one is needed.
- **The in-app browser or Claude in Chrome** to open the Studio preview.
- **Opening the finished file:** `Invoke-Item` on Windows, `open` on macOS.
