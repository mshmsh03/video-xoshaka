---
name: video-xoshaka
description: Plan, script, build and deliver any video in Remotion with an AI narrator, word-synced captions, the person's own footage, photos and screenshots, real royalty-free music, and a frame-by-frame check before delivery. Covers personal stories (funny or sincere), product promos, explainers, tutorials, recaps, greetings and announcements, vertical (Reels, TikTok, Shorts, WhatsApp Status) or landscape. Use whenever someone wants a video made, improved or re-cut, or says video-xoshaka, even if they don't mention Remotion, narration, captions or music.
---

# video-xoshaka

End-to-end video production: interview, brief, material, design file, script, storyboard, voice, build, music, verify, deliver, with approval gates along the way. It started as the skill for one kind of video, a *xoshaka* (Kurdish: "the fun one") story that narrates like a mini-documentary and jokes like a meme page. That is still here as one style among several. The same pipeline now makes sincere tributes, product promos, explainers, tutorials, recaps and announcements.

What makes any of them look custom is real material: the person's own clip, their friend's photo, their actual websites and apps, their own words from their notes, their real logo. A stock-looking video is the failure mode.

## What to read when

- `references/brief.md`: the interview. The question rounds, the free-text questions, language and right-to-left notes, the recap format and how to save `brief.md`. Read it at the start of every new video.
- `references/storyboard-and-gates.md`: the `design.md` and `STORYBOARD.md` templates, the approval gates, parallel scene workers, and freshness checks. Read it before writing the script.
- `references/styles.md`: the styles (funny story, sincere tribute, promo, explainer, tutorial, recap, announcement, captions-only), the shape, tone, length and music mood of each, and the formats and platform safe zones. Read it right after the brief.
- `references/story-and-comedy.md`: finding material and what to keep private, writing `story.json`, timing visuals to words, and the comedy playbook (for the funny style).
- `references/production.md`: project setup, components, formats, screenshots, verification and the pitfalls already hit. Read it before building.
- `references/music.md`: HeyGen music setup (including the Windows/WSL sign-in), picking a track, ducking and silence.
- `references/toolbox.md`: every tool, skill and CLI this workflow uses and when to reach for it: the Remotion skills, `media-use`, `ui-demo`, HeyGen, Kokoro, Edge TTS, ElevenLabs, ffmpeg, headless Chrome and the bundled scripts.

## Workflow

### 1. Interview the person, then save the brief

The person's answers decide what you build, so ask before doing anything else. Follow `references/brief.md`:

1. **Round 1, the basics** (AskUserQuestion, up to 4 questions): style, where it will be posted (which sets the format), length, voice.
2. **Round 2, look and feel:** tone, what is on screen (photos and clips, screenshots in mockups, bold text and graphics, maps or diagrams), colours and brand, music.
3. **Round 3, material and safety:** real names or not, screenshots with names or not, captions, the ending.
4. **Free-text round, in chat:** the point in one sentence, the real moments and facts to include, the sincere line or the exact call to action, what to avoid or never show, who is who, references they like, and where the files are.
5. **Language:** if the video isn't only English, ask which language and check the voice and the text rendering support it (brief.md, "Language and right-to-left text").
6. **Recap and confirm:** restate the brief as a short list in their words, ask "Anything to change?", then save it as `brief.md` in the project root.

Skip anything the person already said, recommend a default for each question, adapt the options to the style, and ask only what you need. If they say "just make it", ask round 1 only, list your assumptions in the recap, and still leave the voice, who may be named or shown, and what is private for them to decide. Create `public/photos/` and tell them the file names: `me` plus one per person in the story. Video clips and GIFs work too.

`brief.md` is the contract. Every later step follows it. When the person changes their mind, update `brief.md` first, then the work. In the delivery message, say how the result matches the brief and name anything that doesn't.

If they gave a story ("X told me to buy it, I did it with my friend Y") or a message ("launch our new menu"), that is the spine. Everything else comes from their material.

### 2. Gather material

- **Their notes** (vault, journal, project folders, git history): send a research subagent for a dated timeline, the people and turning points, and a list of private things to keep out (story-and-comedy.md). Don't put anything private in the video.
- **Their media:** look at each clip and photo yourself. Check several frames per clip for licence plates, badges and screens, and decide the crop (`focusY`). Ask who is who if a clip shows more than one person. Convert phone clips to H.264 first (production.md, "Pitfalls").
- **Their work:** screenshots of live sites (headless Chrome, desktop and phone) and existing app screenshots in their repos, or a screen recording of a real click-through with the `ui-demo` skill (toolbox.md).
- **Brand assets:** their real logo, never redrawn (`media-use resolve --type logo` finds official marks), their colours and fonts.
- **Facts for a promo or tutorial:** every number, price, feature and step comes from the person or from something you checked. Don't invent claims.

### 3. Design file, script and storyboard

First write `design.md` (palette, fonts, logo, motion and text rules, from the brief and the person's real brand assets; template in storyboard-and-gates.md). Then write `story.json` following story-and-comedy.md and the shape for the chosen style in styles.md. Then write `STORYBOARD.md`: one row per scene with the line, what is on screen, the sound, and the word each visual lands on. Open with a hook in the first two or three seconds. **Gate:** show the person the lines and the storyboard table and wait for a yes before building. Changing words is cheap now and expensive later. Ask the person for the true stories behind any jokes and for the sincere line in their own words, rather than inventing them. Note where it will be posted: Reels, TikTok and Shorts need captions placed higher (styles.md, "Safe zones").

### 4. Voice

Skip this step for a no-narration video (then captions carry the words). Otherwise generate samples with `scripts/voice-samples.mjs` (for Arabic, Edge voices with `--voices`; for Sorani Kurdish, the F5 voices' demo files; toolbox.md, "Voice" and "Sorani voices"), open the folder, and let the person pick by ear (`bm_george` worked well for comedy at speed 1.1; calmer voices suit tributes and tutorials). Then run `scripts/make-voice.mjs`. It prints each scene's length and a "breaks" alignment line (or "words timed by Edge" for an Edge voice). Print the word timings and check that no word spans over a second (production.md, "Pitfalls"). Other voice sources are in toolbox.md.

### 5. Open the preview early

As soon as the project runs, start Remotion Studio (`npx remotion studio`) and open the preview, so the person can watch and steer while you build. Render an MP4 when they ask for the file or when delivering a video to post; while they are still iterating, the preview is the deliverable.

### 6. Build

Scaffold and copy the template and scripts (production.md). For each scene, write a component, usually a `BeatScene` with visuals, adapted from `assets/template/src/story/scenes/` (and from `assets/examples/scenes/` when that folder exists). Time every visual to a word with `wordAt(...)`. Keep the timeline in `StoryVideo.tsx`: fade transitions, a slide plus whoosh at chapter changes. Set the composition size from the chosen format. Build from `STORYBOARD.md` and `design.md`, not from memory. With about five or more independent scenes, build them in parallel with one subagent per scene (storyboard-and-gates.md), then assemble and check the seams yourself. Use the Remotion skills for Remotion itself (toolbox.md). If the person edited code outside the chat, don't overwrite it; assume it was intentional or ask.

### 7. Music and sound

Use real music (music.md), at the mood the style calls for (styles.md). Install `media-use` and the HeyGen CLI if needed, get the person signed in, search a few moods, download a main track plus two alternatives, measure it, set `MUSIC_GAIN`, and plan around the track's natural ending. Sound effects only where the style wants them.

### 8. Verify, then get approval to render

- **Look at stills** of every key visual and every scene end (`scripts/stills.mjs`).
- **Check facts** on promos and tutorials: every number, name and step against its source.
- **Preview gate:** show the Studio preview or the key stills and ask what to change. Render the final MP4 only after the person approves the preview, or when they explicitly ask for the file.
- **Render** to a new versioned filename.
- **Measure the audio** (`scripts/check-audio.mjs`).
- **Check frames** from the final MP4 for anything time-sensitive.
- **Open the video** for them.

### 9. Deliver

Report back:
- the file path, length and size
- what changed, if this is an update
- what you checked, and that you couldn't hear the audio
- the open questions: who's who, music mood, whether to cut length

## Principles

- **Real over generic.** Their clip, their friend, their actual screens and logo.
- **Tone fits the purpose.** Funny is one option. A farewell, a product launch and a tutorial each need their own tone; don't force jokes where they don't belong.
- **Hook early, one idea per scene.** The point is visible in the first two or three seconds, and every scene earns its place.
- **Visuals land on words.** A visual arriving on its word beats any number of extra effects. When asked for "better" or "funnier", sharpen timing and wording before adding volume.
- **One key beat.** The sincere line, the call to action or the takeaway, stated plainly and left room to land.
- **Privacy is a feature.** Their notes contain things other people shouldn't see. The person trusts you to leave those out without being asked.
- **Don't guess about people.** Let them pick the narrator voice by ear, never from their name. Confirm who is who in group clips. Don't invent quotes, feelings or claims the material doesn't support.
- **Honest delivery.** Say what you verified and what you couldn't (audio by ear). If the length grew past what they asked for, say so and name the easiest cut.
