# Styles, formats and safe zones

## Contents
- Picking a style
- The styles
- Formats and safe zones
- Choosing music by style

## Picking a style

Choose from the purpose, not from the tools. If the person doesn't say, recommend one and check it with them. A video can borrow from two styles (a promo with one funny beat, a tribute with a funny first half), but give it one dominant tone. Everything else in the workflow is the same for every style: brief, material, script, voice, build, music, verify.

| Style | Purpose | Tone | Typical length |
| --- | --- | --- | --- |
| Funny story (xoshaka) | A person's journey, a friend, a team, a milestone, told with jokes | Self-aware, meme-style, one sincere beat | 60 to 85 s |
| Sincere tribute | Birthday, farewell, thank-you, wedding, memorial-light | Warm, personal, quiet | 45 to 90 s |
| Product or service promo | Show what it does and make people contact or buy | Confident, clear, specific | 20 to 45 s feed, 45 to 90 s website |
| Explainer | Explain an idea, a process, or why something matters | Calm, curious | 60 to 150 s |
| Tutorial | Teach steps someone will follow | Clear, patient, exact | 90 to 180 s |
| Recap or portfolio | Year in review, project showcase, event highlights | Upbeat, proud, quick | 45 to 90 s |
| Announcement or teaser | Launch, date, reveal, event | High energy, short | 10 to 25 s |
| Captions or edit only | Their existing footage needs captions, trimming or reframing | Neutral | As the footage |

## The styles

### Funny story

The original style. Shape, comedy playbook and the gag toolbox are in story-and-comedy.md. In short: freeze-frame cold open, chapters (beginner, building, today), a gag on most scenes timed to words, a sincere beat near the end, a self-aware ending. Narrator at speed 1.05 to 1.1. Music playful and quirky, with silence on the one or two biggest gags. Meme sound effects at most three or four times.

### Sincere tribute

- **Shape:** an opening photo or clip of the person, then three to five memories each with one real photo and one specific line, then the one personal line in the giver's own words, then the wish. For a gift (birthday, farewell), ask whether the ending should credit Claude or carry the giver's own wish.
- **Tone:** warm and specific. A true detail ("always the first to arrive, last to leave") beats a general compliment. Light humour is fine when it is affectionate; roast nobody.
- **Visuals:** photos with slow zooms (Ken Burns), polaroid cards, handwritten-style text, minimal stickers. No meme zooms or record scratches.
- **Voice and sound:** a calm voice at speed 1.0, or the giver's own recording, which beats any synthetic voice for a tribute. Gentle piano or acoustic guitar, no meme effects, a long fade at the end.
- **Care:** don't mention health, money, family trouble or anything the person wouldn't want shared. Ask who is who. Don't invent shared memories.

### Product or service promo

- **Shape:** hook with the problem or the result in the first two seconds; the product in action using real screens in laptop and phone mockups; proof (a real number, a real client, a real before and after); a call to action with the exact handle, link, phone or address; the logo.
- **Tone:** confident and concrete. Show what it does in the shortest honest sentence. One idea per scene, one benefit per idea.
- **Visuals:** real screenshots and screen recordings, brand colours and fonts, the real logo (resolve official marks with `media-use`, never redraw), large readable text, number counters for results. Keep text on screen long enough to read twice.
- **Voice and sound:** a clear, confident voice, or captions only for silent autoplay feeds (many people watch muted, so captions are essential). Upbeat but not busy music; light whoosh and click effects on transitions.
- **Care:** every claim, price and number is true and comes from the person. Ask before showing prices, client names or unreleased screens. Don't promise what the product doesn't do. Say where the call to action goes (the link in bio, the phone number) and put it on screen for at least three seconds.

### Explainer

- **Shape:** a question or surprising fact as the hook; the simple answer in one sentence; the explanation in three to five steps, each one idea; a one-line takeaway.
- **Tone:** calm and curious. Use an analogy before a definition.
- **Visuals:** simple diagrams built from shapes, numbered chapter labels, highlighted words, maps for geographic ideas (`remotion-maps`), real examples. Reveal one element at a time, on the word that names it.
- **Voice and sound:** a calm voice at speed 1.0, captions on, soft music low under the voice or none.
- **Care:** check every fact against a source and name the source in the delivery message. Mark anything you are unsure of and ask.

### Tutorial

- **Shape:** what you will have at the end (the hook), what you need, the steps in order with a numbered chapter label each, a final check ("you should now see..."), common mistakes.
- **Tone:** clear, patient and exact; the viewer is following along.
- **Visuals:** real screen recordings or screenshots with a highlight ring or arrow on the exact control, zoom into small text, the exact words to click or type shown on screen. One step per scene; leave a pause long enough to perform the step.
- **Voice and sound:** a calm voice at speed 0.95 to 1.0, captions on, very quiet music or none.
- **Care:** run every step yourself, or have the person confirm each one, before delivering. A wrong step is worse than a missing one. Hide passwords, API keys, emails and tokens in every screenshot.

### Recap or portfolio

- **Shape:** the title and the period, three to five highlights each with its real clip, photo or screenshot and one line, numbers that count up, a closing line and where to find more.
- **Tone:** proud and quick. Humour is optional.
- **Visuals:** the best real work, device mockups, counters, quick transitions. Don't show unreleased client work or private details.
- **Voice and sound:** upbeat music; narration optional.

### Announcement or teaser

- **Shape:** hook in under a second, the reveal, the date or action, the handle. Ten to twenty-five seconds.
- **Tone:** high energy. Big type, strong contrast, rhythmic cuts timed to the music.
- **Voice and sound:** a short narrated line or captions only; punchy music, one or two effects.

### Captions or edit only

The person already has footage and wants captions, trims, a reframe or a new cut. Transcribe to caption JSON (`remotion-captions`), style the captions, trim and reframe with Mediabunny (`remotion-multimedia`) or `media-use` operations, and render. Show a few frames of the result before delivering, and check that the captions match what is said.

## Formats and safe zones

Set the composition size from where it will be posted, then keep text inside the safe area.

| Where | Format | Size |
| --- | --- | --- |
| Instagram Reels, TikTok, YouTube Shorts, WhatsApp Status | Vertical 9:16 | 1080 x 1920 |
| YouTube, a website, LinkedIn, presentations | Landscape 16:9 | 1920 x 1080 |
| Instagram or Facebook feed | Square 1:1, or portrait 4:5 | 1080 x 1080, or 1080 x 1350 |

- **Vertical safe zones.** Reels, TikTok and Shorts lay their own username, caption and buttons over roughly the bottom 400 px and the right 140 px. For those, place captions at about y 1300, move titles up, and keep stickers off the right edge. WhatsApp Status covers far less, so the default caption position (about y 1470) is fine there. Tell the person to turn off the app's auto-captions and not to add the app's music on top.
- **Landscape.** Keep about 120 px margins, put captions in the lower third (about y 850 to 960), and make headlines proportionally large (at least 72 px). Don't copy vertical layouts onto landscape; reposition.
- **Always:** supporting text large enough to read on a phone, high contrast, no text over busy areas without a backing.

## Choosing music by style

Search the HeyGen catalog by mood (music.md). Starting points:

| Style | Mood to search |
| --- | --- |
| Funny story | "playful quirky comedy, bouncy marimba and pizzicato strings", "cheerful ukulele", "upbeat cartoon" |
| Sincere tribute | "warm gentle piano", "soft acoustic guitar, heartfelt", "nostalgic reflective" |
| Promo | "confident modern upbeat, light percussion", "clean corporate-tech but warm" |
| Explainer or tutorial | "calm minimal ambient, soft pulse", "light curious pizzicato" (low volume) |
| Recap | "upbeat inspiring, driving drums", "energetic feel-good" |
| Announcement | "punchy trailer hit, energetic electronic", "bold beat drop" |

Avoid "kids jingle" (too childish) and generic "corporate uplifting" (bland). Pick a main track and two alternatives so the person can swap by number.
