# Toolbox

Everything this workflow uses, and when to reach for it. Check what is installed before relying on a tool: `~/.claude/skills` and `~/.agents/skills` hold the skills, and `wsl -l -v` shows whether WSL exists on Windows.

## Contents
- The Remotion skills
- media-use (HyperFrames Agent Media OS)
- Voice: Kokoro, Edge TTS, Sorani Kurdish (F5), HeyGen, ElevenLabs, their own recording
- Music and sound effects
- Screenshots, screen recordings, images and brand assets
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
| Edge TTS (`edge-tts` 7.3.1, Python) | Free, online, no key | Microsoft's neural voices in many languages, including Iraqi Arabic (`ar-IQ-RanaNeural`, `ar-IQ-BasselNeural`), Saudi, Egyptian and Persian. No Kurdish voice. The same two scripts handle it, with measured word timings (below). It is the Edge browser's read-aloud service, not a licensed API: fine for personal videos; for client or paid work use the same voices through Azure AI Speech, or ElevenLabs. |
| F5-TTS Central Kurdish (`aranemini/central-kurdish-tts`) | Free, offline; **CC BY-NC-ND 4.0, non-commercial only** | Sorani Kurdish: three single-speaker voices (studio male, audiobook male, audiobook female), 24 kHz, the best free Sorani voice found (2026-10-25). Slow on a CPU, about 40 times real time. Steps under "Sorani voices" below. |
| MMS Sorani (`razhan/mms-tts-ckb`) | Free, offline; Meta's MMS base is non-commercial | Flat and robotic, but it speaks a scene in seconds: a stand-in voice for building and timing while F5 runs. |
| kurdishtts.com | Paid (about $12/month for public use; the free plan is evaluation only) | Many Sorani and Kurmanji voices with word timings. Needs the person's own account and API key. Not tested here. |
| The person's own recording | Free | Best for tributes. Needs the same per-word timings, so transcribe it (`remotion-captions`, or the `media-use` audio engine) to get them. |
| HeyGen TTS | Free allowance with OAuth sign-in | Through `media-use resolve --type voice`. |
| ElevenLabs | Paid API key | Offer it, don't assume it. |

Edge voices (end-to-end tested 2026-10-21 with Iraqi Arabic, including a render):
1. Install once: `python -m pip install edge-tts` (set `PYTHON` if the command isn't `python` on Windows or `python3` elsewhere). `kokoro-js` isn't needed for Edge.
2. Samples to pick by ear: `node scripts/voice-samples.mjs "<a line in the video's language>" --voices ar-IQ-RanaNeural,ar-IQ-BasselNeural,ar-SA-ZariyahNeural,ar-SA-HamedNeural,ar-EG-SalmaNeural,ar-EG-ShakirNeural`. They land in `out/voice-samples/` as MP3s. `python -m edge_tts --list-voices` lists the rest.
3. Put the chosen name in `story.json`'s `voice` and run `node scripts/make-voice.mjs` as usual. It sees an Edge name (`xx-XX-…Neural`) and calls `scripts/edge-voice.py`; `speed` 1.1 becomes Edge's rate `+10%`. It writes the same WAVs and `voice.json` as the Kokoro path, keeps Edge's own MP3s in `out/voice-edge/`, and decodes them with `ffmpeg` (or `npx remotion ffmpeg`).

Each scene's line reads "x/y words timed by Edge". Edge leaves punctuation out of its words, so they are matched back to the script's own words, and a word after a pause starts where the sound comes back: Edge puts it 120 to 160 ms early, inside the silence. If the line reads "breaks" instead, `say` and `text` differ in word count and the times were estimated the Kokoro way; keep `say` to the same word count (`"say": "… كلود …"` for a shown "Claude" works) to keep measured times.

### Sorani voices

End-to-end tested on 2026-10-25 with a 90 s Sorani explainer, including a render, on Windows with an Intel laptop CPU (no GPU) and 16 GB of RAM. Offer these alongside the person's own recording. For Kurmanji, no free voice has been tested; check HeyGen's and ElevenLabs' current language lists before offering either.

1. **Samples to pick by ear, without the big download.** The model repo has a demo per voice: `curl -sSLo out/voice-samples/f5-<voice>.wav https://huggingface.co/aranemini/central-kurdish-tts/resolve/main/output-<voice>.wav` for `studio-male`, `audiobook-male` and `audiobook-female`. Its demo Spaces on Hugging Face were paused when tested, so don't count on them.
2. **Install once**, in the project's `tts/` folder (on macOS and Linux the venv's Python is `tts/.venv/bin/python`):
   ```bash
   python -m venv tts/.venv
   tts/.venv/Scripts/python -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
   tts/.venv/Scripts/python -m pip install f5-tts asosoft soundfile transformers
   ```
   Install the CPU build of torch first, or `f5-tts` pulls a CUDA build of several GB.
3. **Model files.** Copy `scripts/sorani/fetch_ema.py` and `scripts/sorani/speak_story.py` into the project's `tts/`. From `https://huggingface.co/aranemini/central-kurdish-tts/resolve/main/`, download `F5TTS_v1_Base.yaml`, `vocab.txt`, `prompt-<voice>.wav` and `prompt-<voice>.txt` into `tts/f5-repo/`. Each voice's checkpoint (`model-<voice>.pt`) is 5.4 GB, mostly training state. `fetch_ema.py` downloads only the 1.35 GB of EMA weights that speaking needs, using HTTP range requests, six streams at once, resuming after dropped connections:
   ```bash
   tts/.venv/Scripts/python -I tts/fetch_ema.py https://huggingface.co/aranemini/central-kurdish-tts/resolve/main/model-studio-male.pt tts/f5-repo/studio-male-ema.pt
   ```
   It reads the checkpoint's layout with an allow-list unpickler (tensors and `OrderedDict` only), so a tampered file can't run code. `--list` prints the layout without downloading.
4. **Narrate.** Set `story.json`'s `voice` to `"f5:<voice>"` (for example `"f5:studio-male"`). Speak the first scene alone with `tts/.venv/Scripts/python -I tts/speak_story.py --only <first scene id>` and let the person hear it. Then run the rest in the background. It writes `out/voice-raw/<id>.flac`; `--out` writes somewhere else, so a long run doesn't overwrite the stand-in voice the preview is using. Text goes through AsoSoft's normalizer and Kurdish G2P first, as in the model's own `infer.py`.
5. **Time and normalize** with `node scripts/make-voice.mjs` as usual. For an `f5:` voice it reads `out/voice-raw/<id>.flac` instead of speaking, then trims, normalizes and estimates word times from the pauses, the way it does for Kokoro.

**Writing `say` for F5.** The G2P reads only Kurdish letters. Write Latin names the way they sound, in Sorani letters (`PHP` becomes «پی ئێچ پی», `PHP2Shell` becomes «پی ئێچ پی تو شێڵ»), and write numbers as words (٢٢ becomes «بیست و دوو», 8.1 becomes «هەشت خاڵ یەک»). Keep `text` as written, for the captions. The word timer counts each caption word as what `say` speaks in its place, so these swaps don't make the visuals land early.

**Time and stand-in.** At 32 sampling steps (`--nfe`), a 10 s scene took 6 to 7 minutes on the laptop CPU, so a 90 s video takes about an hour. While it runs, build and time the scenes with the MMS stand-in (`speak_story.py --engine mms`, seconds per scene; leave `voice` as `"f5:…"`, since make-voice only checks the prefix), then swap in the F5 files and run make-voice again. F5 sets a line's length from the reference prompt's pace, and `speed` in `story.json` scales it.

**Licence.** The F5 Central Kurdish models are CC BY-NC-ND 4.0. That is fine for a personal post, but not for client work, paid work or a monetised channel. Note it in `brief.md` and the delivery message.

The person picks the voice by ear from samples, never from their name or a guess about gender.

## Music and sound effects

Full setup is in music.md. The short version: use real royalty-free music from the HeyGen catalog (`media-use` or `scripts/heygen-music.mjs`), or ElevenLabs Music (`elevenlabs/skills@music`, paid), or a track the person supplies (fine for WhatsApp; copyrighted songs get muted or blocked on Instagram, TikTok and YouTube). Don't write music in code and call it done: it sounds cheap. Sound effects: remotion.media files, or `media-use resolve --type sfx`.

The HeyGen CLI is Linux and macOS only. On Windows, install it inside WSL and run it through `wsl`; the OAuth sign-in trick (run the login in the background with `BROWSER=echo`, read the printed URL, open it on Windows) is in music.md.

## Screenshots, screen recordings, images and brand assets

- **Live sites:** headless Chrome with its own profile (`--user-data-dir`), `--window-size=1440,900` for desktop and `390,844` for phone, `--virtual-time-budget=8000` so the page has loaded. Take a phone shot of every site shown on a laptop.
- **Screen recordings of a real flow** (clicks, typing, a menu opening): the `ui-demo` skill (`affaan-m/ecc@ui-demo`, installed 2026-10-21). It drives Playwright through discover, rehearse and record, with a visible cursor and natural pacing. Use it for the raw footage only and skip its injected subtitle bar, because this skill's captions carry the words. Set both `viewport` and `recordVideo.size` to `1440x900` for the laptop or `390x844` for the phone (without `size`, Playwright scales the video down to fit 800x800). Convert the WebM to a constant-rate MP4 before using it: `ffmpeg -i demo.webm -c:v libx264 -crf 18 -pix_fmt yuv420p -r 30 -movflags +faststart public/rec/demo.mp4`, then play it inside the device frame with `<Video>` from `@remotion/media` (`Devices.tsx`'s `Shot` takes images only, so add a video variant). Look at one frame at full size first: if the text is soft, use screenshots. For a plain scroll down a page, a tall screenshot (`--window-size=1440,4000`) panned in Remotion is sharper than a recording. Needs `npm i -D playwright` and `npx playwright install chromium` in the project.
- **Apps:** look for `docs/screenshots/` or golden test images (`test/**/goldens/*.png`) in the repos first.
- **Read every image before using it:** check for private data, empty areas and that it is the right page.
- **Logos, icons, stock images:** `media-use resolve --type logo|icon|image`.
- **Photos and clips:** the person's own, found by base name in `public/photos/`. Check several frames of each clip.

## Verification tools

- **Stills:** `scripts/stills.mjs` bundles once and renders frames by number, by scene end (`end:<scene>`) or by word (`<word>@<scene>+<seconds>`) to `out/stills/`. Don't use `remotion render --frames` for this: it fails with `EINVAL` once the composition has scene audio.
- **Audio:** `scripts/check-audio.mjs` measures speech against the music bed, clipping, and spot windows (`--at 1.2-1.9`). Aim for speech near -20 dBFS and the bed 8 to 12 dB under it.
- **ffmpeg:** the full build is installed (9.0.2, `winget install Gyan.FFmpeg`, 2026-10-21; open a new shell after installing so `ffmpeg` and `ffprobe` are on PATH). Tested commands:
  - one frame: `ffmpeg -ss <sec> -i out/x.mp4 -frames:v 1 -vf scale=540:-1 out/check.png`
  - a contact sheet, 18 frames in one image: `ffmpeg -i out/x.mp4 -vf "fps=1/2,scale=320:-1,tile=6x3" -frames:v 1 out/sheet.png` (a frame every 2 s covers 36 s; for longer videos use `fps=1/<seconds÷18>`)
  - loudness: `ffmpeg -nostats -i out/x.mp4 -af ebur128=framelog=quiet -f null -` prints the integrated LUFS (around -14 LUFS suits YouTube and social apps)
  - phone clips: production.md, "Pitfalls"

  On a machine without it, `npx remotion ffmpeg` is bundled but lacks `fps` and `tile`, so extract frames one `-ss` at a time.
- **Mediabunny** (`remotion-multimedia`): durations and dimensions of audio and video files.
- You can't hear the result. Say so in the delivery message and ask the person to judge the music and pronunciation.

## This skill's own scripts and template

| Path | What it is |
| --- | --- |
| `scripts/voice-samples.mjs` | Narrator samples to `out/voice-samples/` (Kokoro by default, Edge with `--voices`) |
| `scripts/make-voice.mjs` | Narration for every scene, normalized, with word timings (Kokoro; Edge for an Edge voice name; for an `f5:` voice it reads the Sorani files `speak_story.py` wrote) |
| `scripts/edge-voice.py` | Speaks one line with Edge TTS and returns each word's time; called by the two scripts above |
| `scripts/sorani/speak_story.py` | Speaks every scene in Sorani with F5-TTS Central Kurdish (or the MMS stand-in) to `out/voice-raw/`; copy it into the project's `tts/` |
| `scripts/sorani/fetch_ema.py` | Downloads only the EMA weights from a remote PyTorch checkpoint (1.35 GB of 5.4 GB for an F5 voice) |
| `scripts/heygen-music.mjs` | Search the HeyGen music catalog and download picks (calls the CLI through `wsl` on Windows) |
| `scripts/stills.mjs` | Single-frame checks |
| `scripts/check-audio.mjs` | Loudness and balance measurement |
| `assets/template/src/` | `theme.ts`, `ChapterLabel.tsx`, and `story/` with `StoryVideo.tsx` (timeline, music ducking, transitions), `Narration.tsx` (captions), `PhotoCard.tsx`, `Devices.tsx` (laptop, phone, screenshot), `Terminal.tsx`, `Counter.tsx`, `motion.ts`, `voice.ts`, `scenes/BeatScene.tsx`, `scenes/FreezeScene.tsx`, a sample `story.json` |
| `assets/examples/` | The finished "My Life with Claude" scenes and timeline, to copy staging from |
| `evals/evals.json` | Test prompts and assertions for this skill |

The scripts must be copied into the Remotion project's own `scripts/` folder: Node resolves `kokoro-js` from the script's folder, so running them from the skill folder fails with `ERR_MODULE_NOT_FOUND`. Copy `edge-voice.py` with them; the voice scripts look for it next to themselves.

The template and example scenes were built for the funny story style (freeze-frame opener, reaction zoom, terminal gags). For other styles reuse the timeline, narration, captions, photo card, device mockups and counter, and write scenes for the style's shape (styles.md) instead of copying the gags.

## Related skills reviewed (2026-10-15)

Searched skills.sh for video skills. The strong matches are all from `heygen-com/hyperframes` (HeyGen's own repo, about 62.7k stars, Apache-2.0, security audits pass or warn): `product-launch-video`, `faceless-explainer`, `general-video`, `motion-graphics`, `embedded-captions`, `talking-head-recut`, `slideshow`, `music-to-video`, `pr-to-video`, `hyperframes-audio`, `hyperframes-creative`, and `media-use` (already used here). They build **HTML compositions with the `hyperframes` CLI, not Remotion**, so they are not installed here: they would run a second pipeline next to this one. Their workflow ideas were adopted instead (storyboard-and-gates.md): a brief file as the contract, a design file, a storyboard before building, user approval gates, one worker per scene, freshness checks, and embedded captions kept for one or two peaks.

If the person ever wants the HyperFrames engine instead, install a single skill with `npx skills add https://github.com/heygen-com/hyperframes --skill <name>` (for example `product-launch-video` for a website-based promo, or `faceless-explainer` for a text-to-video explainer), and tell them it replaces the Remotion steps for that video. Not recommended without checking: `*/superpowers@ai-video-generation` and `prime-skills/*` (huge install counts, repos with a handful of stars), and `remotion-to-hyperframes` (only for porting).

Second pass (2026-10-21, `npx skills find` with 29 queries on the PC; it returns nothing from the cloud sandbox, even for "remotion"):
- **Installed:** `affaan-m/ecc@ui-demo` (repo about 285k stars) for screen recordings. Also added: the full ffmpeg, and Edge TTS under "Voice".
- **Not installed, because they trigger on the same requests as this skill** ("make me a video", Remotion, explainer, product demo) and would compete with it: `coreyhaines31/marketingskills@video`, `iart-ai/motion-design-skills` (ships its own `remotion-video`), `affaan-m/ecc@video-editing`.
- **`browser-use/video-use`** (about 29k stars): strong for cutting long talking-head or vlog footage by its transcript, but it is a separate ffmpeg pipeline that needs an ElevenLabs key for transcription. Offer it only when the person brings long raw footage to cut.
- **Thinner than what is here:** `digitalsamba/claude-code-video-toolkit@ffmpeg` and `@playwright-recording`; `mengto/skills@browser-video-recording` is built for the Codex in-app browser and macOS; `aahl/skills@edge-tts` is a short wrapper that needs `uv`, so Edge TTS is documented directly.
- **Still avoid** `*/superpowers@ai-video-generation` and `@ai-avatar-video`: six copies with 300k to 800k installs each, from repos with 3 to 8 stars.

## Claude Code helpers

- **AskUserQuestion** for the brief and for each approval gate.
- **A research subagent** (Explore or similar) to read the person's notes or repo history and return a dated timeline, the arc and a list of private things. Ask for real dates only.
- **find-skills** to discover another skill when one is needed.
- **The in-app browser or Claude in Chrome** to open the Studio preview.
- **Opening the finished file:** `Invoke-Item` on Windows, `open` on macOS.
