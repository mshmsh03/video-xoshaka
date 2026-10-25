# The brief interview

The point of the interview is to turn "make me a video" into a written brief that says exactly how the person wants it. Every later step (script, voice, build, music, checks) follows that brief, so a good interview prevents most rework.

## Contents
- How to run it
- Round 1: the basics
- Round 2: look and feel
- Round 3: material and safety
- Free-text round: what only they can tell you
- Language and right-to-left text
- Recap, confirm, save brief.md
- Quick mode

## How to run it

- Use AskUserQuestion. It takes 1 to 4 questions per call, each with 2 to 4 options, and the person can always type their own answer ("Other"). Put the recommended option first and mark it "(Recommended)". Keep headers under 12 characters and labels short.
- Run up to three rounds of multiple-choice questions, then one free-text round in chat. Don't ask everything at once and don't ask more than needed.
- **Skip what they already said.** If the request says "30 seconds for Reels, classy, no jokes", the style, length, format and tone are answered; confirm them in the recap instead of asking again.
- **Adapt the options to the style.** A tutorial doesn't need a "funny or sincere" question; a birthday video doesn't need "call to action".
- **Recommend, don't interrogate.** For each question, make the first option your best guess from what you know about the purpose and the person.
- **Never guess about people.** Voices, who is who, what may be shown and what is private are always the person's call.
- If the person's answer changes an earlier one (a different platform means a different format), update the earlier answer and say so.

## Round 1: the basics

Ask these four together.

1. **Style** (header "Style"): Funny story / Sincere tribute / Product or service promo / Explainer or tutorial. "Other" covers recap, announcement and edit-only. Recommend from the purpose (a friend's birthday: tribute or funny story; a launch: promo; "teach people X": tutorial).
2. **Where** (header "Where"): Reels, TikTok or Shorts (vertical 9:16) / YouTube, website or LinkedIn (landscape 16:9) / Instagram feed (4:5 or square) / WhatsApp Status (vertical 9:16, fewer overlays). This sets the format and the safe zones (styles.md).
3. **Length** (header "Length"): about 15 to 30 seconds / about 1 minute / about 2 minutes / longer. Offer the lengths that fit the style (styles.md has typical lengths).
4. **Voice** (header "Voice"): Free local AI narrator (Recommended) / My own recorded voice / HeyGen or ElevenLabs voice / No narration (captions and music only). If they choose an AI voice, they pick the actual voice later from samples, by ear.

## Round 2: look and feel

Ask these four together.

5. **Tone** (header "Tone"): Warm and personal / Funny and meme-style / Clean and professional / High-energy and punchy. Make it consistent with the style chosen in round 1; if they conflict (a "sincere tribute" that should be "meme-style"), ask which wins.
6. **On screen** (header "On screen", multi-select): Their photos and clips / Screenshots or screen recordings in laptop and phone mockups / Bold text and motion graphics / Maps or simple diagrams. Pick several.
7. **Colours** (header "Look"): Use my brand (I'll give the logo, colours, fonts) / You choose to fit the tone / Match something I'll show you (a video, a design, a website). If they pick the first or third, ask for the files or link in the free-text round.
8. **Music** (header "Music"): Real royalty-free track picked for the mood (Recommended) / My own track (WhatsApp is fine; Instagram, TikTok and YouTube may mute or block copyrighted songs) / No music. If they pick a track, the mood comes from the style (styles.md, "Choosing music by style").

For an explainer or tutorial, ask **Audience** (header "Audience") in place of Tone: Beginners (Recommended) / Some background / Experts. These styles are calm anyway, and the audience decides the words: the narration stays plain at every level, and only the on-screen labels get more technical (styles.md, "Explainer").

## Round 3: material and safety

Ask these four together.

9. **Names** (header "Names"): Real names and faces are fine / First names only / No names (keep it anonymous) / Ask me per person.
10. **Screens** (header "Screens"): Real screenshots with client or business names / Screenshots with names blurred or removed / Keep it general (no screenshots). Unreleased or under-review work is never shown without a yes.
11. **Captions** (header "Captions"): Big word-by-word captions (Recommended for social) / Simple subtitles / No captions. Many people watch muted, so recommend captions for anything posted to social.
12. **Ending** (header "Ending"): A sincere line in my own words / A call to action (handle, link, phone, date) / A self-aware joke / Just a clean fade-out. For a gift (birthday, farewell) also ask whether the ending should credit Claude or carry their own wish.

## Free-text round: what only they can tell you

Multiple choice can't capture these. Ask them in chat in one short message, as a numbered list, and let the person answer only the ones that apply:

1. **The point in one sentence:** what should a viewer think, feel or do after watching?
2. **The real moments or facts:** the true stories, memories, numbers, features or steps to include. (For jokes: the true stories behind them. For a promo: the real numbers, prices, dates. For a tutorial: the exact steps.)
3. **The sincere line, in their own words** (story, tribute), or **the exact call to action** (promo): handle, link, phone number, address, date and time.
4. **What to avoid or never show:** people, places, topics, screens, numbers, anything private.
5. **Who is who:** names and roles of everyone who appears, and which file is which person.
6. **References:** a video, a page or a design they like, and what they like about it.
7. **Files:** where the photos, clips, screenshots, logo, fonts and brand guide are.

Don't invent answers. If they skip one that matters (for example the call to action in a promo), ask once more, then proceed with a clearly marked placeholder and say so in the delivery message.

## Language and right-to-left text

Ask this with round 1 whenever the person writes or speaks in more than English, or the audience might:

- **Language** (header "Language"): English / Kurdish (Sorani) / Arabic / Mixed or other.
- **Check the voice first.** The local Kokoro voices are mainly English; confirm a voice actually supports the language before promising it, and otherwise offer the person's own recording or another text-to-speech source. For Arabic, Edge TTS has Iraqi, Saudi and Egyptian voices with word timings (toolbox.md, "Voice"). For Sorani Kurdish, offer the free F5 Central Kurdish voices (non-commercial only, and about an hour of CPU time for 90 s; toolbox.md, "Sorani voices") next to the person's own recording, and write the licence into `brief.md`. No tested free voice speaks Kurmanji.
- **Right-to-left text** (Arabic, Kurdish Sorani): animate whole words or whole lines, never letter by letter, and don't add letter-spacing or text outlines; each of those breaks the joined letter shapes. Reveal intact text with a mask instead. Mirror the layout and flip directional slides (a "forward" slide enters from the left: `slide({ direction: "from-left" })`); timelines run from right to left. Use a font that supports the script (for Kurdish, one with ڕ ڵ ە ۆ ێ: many "Arabic" fonts such as Cairo and Tajawal lack them; production.md has the list) and check the rendered frames by eye. Captions that mix languages need each run in its own direction, and so do Latin or number runs inside right-to-left text (`< 2 h`, `8.4.27`, an ID): wrap them in `<bdi>` or give their element `direction: "ltr"`, or the bidi algorithm reorders them (`< 2 h` shows as `h 2 >`). Ask a native speaker to read the final text, since you can't judge wording by eye.

## Recap, confirm, save brief.md

Before building anything, restate the brief as a short list the person can scan in ten seconds, using their words:

```
Brief
- Style and tone:   <style>, <tone>
- Where and format: <platform>, <9:16 | 16:9 | 1:1 | 4:5>, ~<length>
- Voice and language: <voice choice>, <language>
- Look: <on-screen mix>, <brand or chosen colours>
- Music and captions: <music choice>, <captions>
- Names and screens: <names rule>, <screens rule>
- Ending: <ending>
- Point: <one sentence>
- Must include: <moments, facts, numbers, steps>
- Never show: <private or avoided things>
- Who is who: <names and roles>
- Assumptions I made: <anything defaulted>
- Still needed from you: <files, call to action, etc.>
```

Ask "Anything to change?" and wait. Then **save it as `brief.md`** in the video project's root. That file is the contract:

- The script, the voice, the visuals, the music and the checks all follow `brief.md`. Hand it to subagents too.
- When the person changes their mind later, update `brief.md` first, then the work.
- In the delivery message, say how the result matches the brief and name anything that doesn't (a missing file, a placeholder, a length that grew).

## Quick mode

If the person says "just make it" or is clearly in a hurry, ask only round 1 (and the language question when it applies), take sensible defaults for everything else, and put those defaults in the recap under "Assumptions I made" so they can correct them. Still never default the things that are theirs to decide: who may be named or shown, what is private, and the voice (offer samples).
