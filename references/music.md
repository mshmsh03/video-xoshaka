# Music

## Contents
- Where music comes from
- HeyGen setup (incl. Windows/WSL sign-in)
- Searching and picking a track
- Mixing it in: level, ducking, comedic silence
- If HeyGen isn't an option

## Where music comes from

Synthesized music (writing a score in code) sounds cheap next to a real track.
People notice and say "the music is not nice". Use real music:

1. **HeyGen's catalog** through the `media-use` skill
   (`npx skills add heygen-com/hyperframes@media-use -g -y`). It has thousands of
   royalty-free tracks searchable by mood, free with a HeyGen sign-in.
2. ElevenLabs Music (`elevenlabs/skills@music`): composed to a prompt, but needs
   a paid API key.
3. A track the person supplies. This is fine for WhatsApp, but copyrighted songs
   get muted or blocked on Instagram, TikTok and YouTube. Say so.

Avoid `*/superpowers@ai-video-generation`-style skills and `prime-skills/*`: they
show huge install counts from repos with a handful of stars.

## HeyGen setup (incl. Windows/WSL sign-in)

The CLI is Linux/macOS only. On Windows, install it in WSL. Check with
`wsl -l -v` that Ubuntu exists. Read the install script before running it.

```bash
wsl -e bash -lc "curl -fsSL https://static.heygen.ai/cli/install.sh | bash"   # -> ~/.local/bin/heygen
```

Sign-in has to happen in the person's browser, but from WSL no browser opens,
and `--device` refuses to run without a real terminal. What works is to run the
OAuth login in the background with `BROWSER=echo`, read the printed URL, and
open it on Windows:

1. Background task (PowerShell):
   `wsl -e bash -lc "BROWSER=echo ~/.local/bin/heygen auth login --oauth 2>&1"`
2. Read the task output for `https://app.heygen.com/oauth/authorize?...`, save it
   to a file, then `Start-Process (Get-Content -Raw <file>).Trim()`.
3. The person signs in and approves. The callback reaches WSL through localhost
   forwarding, and the background task finishes with "Logged in as ...".
4. Verify: `wsl -e bash -lc "~/.local/bin/heygen auth status"`. The session lasts
   about 10 days and refreshes.

To clean up a stuck login, use `pgrep -f '[h]eygen auth login' | xargs -r kill`.
The bracket keeps the pattern from matching (and killing) its own shell.
`pkill -f 'heygen auth login'` kills itself.

On macOS/Linux, `heygen auth login --oauth` opens the browser directly.

## Searching and picking a track

Copy `scripts/heygen-music.mjs` into the project, then:

```bash
node scripts/heygen-music.mjs search "playful quirky comedy, bouncy marimba and pizzicato strings" --limit 8
node scripts/heygen-music.mjs download 597cfa95 217e8589 19bcbb9a --out public/bgm/options
```

Search several moods: playful comedy, cheerful ukulele, upbeat cartoon. Track
names are generic ("Astral Generated Music: ..."), so judge by the
description and duration. For a comedic story, "playful quirky comedy, marimba
and pizzicato" beats "kids jingle" (too childish) and "corporate uplifting".

Pick a main track and download two alternatives so the person can swap one in
by number. Copy the main one to `public/bgm/track.mp3`.

Before wiring it in, measure it. Decode it with
`npx remotion ffmpeg -i track.mp3 -ac 1 -ar 16000 -c:a pcm_s16le m.wav` and
compute RMS per second:
- **Overall RMS** sets the gain: `MUSIC_GAIN = 10 ** ((-24 - rms) / 20)`,
  about -24 dBFS between lines.
- **Where it ends.** Most tracks end with a natural fade (quiet last 3 s). Plan
  for that rather than `loop`, because loop seams are audible. Let it end under
  the sincere beat and restart it for the ending credits.

## Mixing it in: level, ducking, comedic silence

`StoryVideo.tsx` computes the music volume per frame:
- **Ducking:** `DUCK = 0.6`, so the music sits about 8 dB lower while the
  narrator talks (narration about -20 dBFS, bed about -32 dBFS under it, about
  -24 between lines).
- **Intro:** the track plays under the hero clip, and the record scratch stops it
  (`durationInFrames={scratch}`). The main music starts with chapter 1.
- **Comedic silence:** cut to 0 on a big reaction (the boom carries it) for
  about 1.3 s, then fade back over 0.5 s. Put silences on the one or two biggest
  gags only.
- **Ending:** fade the last 3 s.

Verify with `scripts/check-audio.mjs` (production.md). If the speech level and
the between-lines level are within about 2 dB of each other and the
between-lines measurement covers mostly music, the music is too loud.

## If HeyGen isn't an option

Ask which of the other two sources the person wants. Don't fall back to
synthesized music without telling them it will sound synthetic.
