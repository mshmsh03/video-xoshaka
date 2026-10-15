# Story, scripting and comedy

Finding the material, the privacy rules, writing `story.json` and timing visuals to words apply to every style that has narration. "Shape of the story" and the comedy playbook are for the funny and sincere story styles; other styles use the shapes in styles.md.

## Contents
- Finding the story (and what to keep out)
- Shape of the story
- Writing story.json
- The comedy playbook
- Timing gags to the voice

## Finding the story (and what to keep out)

The best material is the person's own: their notes (an Obsidian vault, a
journal), git history, project folders, live sites, photos and clips. When there
is a notes folder, hand it to an Explore/research subagent with a brief like:
"find the people and the turning points, give a dated timeline of what was built
and learned, the overall arc in a few sentences, and flag anything private". Ask
it for real dates only (notes, file times, `git log --reverse`), marking
anything inferred.

The person's own words beat invented ones. A line from their notes ("you don't
need to know everything before you start, learn as you go") makes the best
sincere beat. Anything the notes don't support, like who said what or who was
there, comes from the person, not from you.

Keep these out of a video meant to be shared, even when the person said "use my
notes":
- passwords, API keys, server addresses, account emails, phone numbers
- money: debts, prices they charge, salaries, "money is tight"
- health, sleep, family trouble
- client internals: staff names, bugs, invoices, work still under client review
  (name the client if allowed, but don't show unreleased screens)
- licence plates, house numbers, school or ID badges in photos and clips (crop
  them out with `focusY`; check several frames, because hand-held clips pan)

Client names and their public websites are fine only when the person said so.

## Shape of the story (funny and sincere story videos)

About 60 to 85 seconds, 9 to 12 scenes, one idea per scene. A shape that works:

1. **Cold open**: a freeze-frame on their own clip. "Yep. That's me. You're
   probably wondering how I got here." Then the title.
2. **Chapter 1 · The beginner**: how clueless they were (self-deprecating), the
   person or moment that started it, the friend who joined, the first tiny
   project and how it broke.
3. **Chapter 2 · Building**: the montage. Real screenshots, things shipped, each
   with one gag.
4. **Chapter 3 · Today**: numbers that count up, ending on a joke number.
5. **The sincere beat**: one lesson in their own words, no gag, music fading.
6. **Ending**: thank-yous with photos, and a self-aware button. "Claude made
   this video too. Even the jokes. Especially the bad ones." fits a video about
   their life with Claude. For a gift (a birthday, a farewell) ask first: the
   person may want the credit to be theirs, so end on their wish instead.

Chapter labels ("Chapter 1 · The beginner") make it read as a story rather than
a CV.

## Writing story.json

```json
{
  "voice": "bm_george",
  "speed": 1.1,
  "fps": 30,
  "transitionFrames": 15,
  "leadIn": 0.35,
  "tail": 0.45,
  "scenes": [
    { "id": "freeze", "text": "Yep. That's me. You're probably wondering how I got here.", "lead": 1.9, "hold": 2 },
    { "id": "advice", "text": "Then Mr. Karim told me: buy the subscription. I asked how much. This was his reaction.",
      "say": "Then Mister Karim told me: buy the subscription. I asked how much. This was his reaction.", "hold": 1.5 }
  ]
}
```

- `text` is what the captions show; `say` is what the voice reads, when they
  differ. Captions always come from `text`. Word timings are estimated over
  `text` (digits count as their spoken length), so `say` may use more or fewer
  words, but keep the rhythm close. Use `say` for:
  - **abbreviations**: write "Mister" for "Mr."
  - **names the voice gets wrong**: "Al Noor" for "Al Nur"
  - **digits**: show "7 clients" and "over 300 commits" on screen, but have the
    voice say "seven" and "three hundred"
  - **times**: show "7 pm" (no periods) and say "seven p m". Periods inside
    "p.m." used to split captions; the scripts now skip common abbreviations,
    but plain text is safest.
- `lead` holds the voice back at the start of a scene (the freeze opener plays
  the clip first). `hold` is breathing room after the line, for the visual
  punchline to land. Give a scene whose gag finishes after the voice (a terminal
  that answers "oh.") 1.5 to 2 s of hold.
- Keep lines short: 10 to 20 words, two or three sentences. Speed 1.05 to 1.1
  with `bm_george` gives snappy comedic delivery.
- Each scene's length is computed from its voice. Never hand-set durations;
  re-run `make-voice.mjs` after every text change.

## The comedy playbook (funny style only)

Funny comes from contrast and timing, not from adding more jokes. Use the
person's real situation and exaggerate it a little. Roast the hero more than
anyone else, and roast friends only gently.

**Start from their world, not from the table below.** In testing, the
strongest jokes were the ones only that person's story could produce:
- a nurse whose answer to every problem is "drink water" ("sara it's a CAR" /
  "and yet.")
- the narrator bleeped mid-word when he says "quiet" in an ER
- a client who "said yes. He could not. Yet."

Plans that reached straight for the stock gags (XP error, ∞ counter) were less
funny. So:
1. Write 8 to 10 candidate jokes from the true stories the person gave you.
2. Keep the best 5 or 6.
3. Only then pick staging from the toolbox below.

Techniques that work well:
- rule of three, with the twist on the third
- a callback to the opening (the frozen clip resumes; the first question comes
  back)
- a deadpan narrator persona (nature documentary, sports commentator)
- fake-serious UI (a status line, receipt, scoreboard or discharge form)
- a bleep

The table is a toolbox for staging, not a checklist. Each entry is something
visual landing on a specific word of the narration.

| Gag | How | Built in |
| --- | --- | --- |
| Freeze-frame opener | clip freezes, record scratch, white flash, desaturate, slight zoom, sticker with an arrow | `scenes/FreezeScene.tsx` |
| The tiny terminal joke | `> what is a terminal?` → "You're looking at one." → `> oh.` | `Terminal` |
| Failed command | `$ git push` → red `error:` with the Windows XP error sound → `> claude, help` → "✓ Pushed. You're welcome." | `Terminal` with `kind: "error"` |
| Reaction zoom | "I asked how much. This was his reaction." Their photo slams full screen, shakes, vine boom, music cuts out for about 1.3 s | `examples/scenes/AdviceScene.tsx` |
| Labels as jokes | "BEGINNER #1 / #2" stickers, "combined coding knowledge: 2%" meter | `examples/scenes/FriendsScene.tsx` |
| Stress stamp | "No pressure." → shaking red "STRESS LEVEL: 99%" sticker | `examples/scenes/WebsitesScene.tsx` |
| Deadpan stamp | "BUILT IN 1 DAY / sleep: not invited" | `examples/scenes/PosScene.tsx` |
| Fake-serious status line | "Iron Man approval: ..." → "probably" | (was in a JARVIS scene) |
| Joke counter | "∞ times I asked how to center a div" after real counters | `Counter` with `finalText` |
| Receipt | "status ...... active / wallet ...... crying" | (first version of AdviceScene) |
| Self-aware ending | "Even the jokes. Especially the bad ones." | `examples/scenes/OutroScene.tsx` |

Use meme sound effects at most three or four times per video: a record
scratch, a vine boom, the Windows XP error. More than that stops being funny.
The music cutting out is a sound effect too, and often the best one.

Keep one beat sincere, usually the lesson near the end. With no gag on it, it
lands harder than any joke.

When the person asks for "more funny", sharpen what is there: tighter setups,
punchier last words, a visual for every punchline, a silence before the big
one. Adding a wall of new jokes usually works less well.

## Timing gags to the voice

Every visual cue uses `wordAt(sceneId, "word")` (seconds into the scene) times
`fps`, so the gags stay in sync when the narration is regenerated. Put the
punchline visual on the punchline word, not at the start of the sentence. For a
reaction, add about 0.25 s after the word. Check the timing table that
`make-voice.mjs` prints: a word stretched over a second means a pause was
matched to the wrong punctuation (see production.md).
