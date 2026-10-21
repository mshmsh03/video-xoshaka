# Speaks one line with a Microsoft Edge neural voice (free, online, no key) and
# reports when each word is said. make-voice.mjs and voice-samples.mjs call it
# for Edge voices such as ar-IQ-RanaNeural. Needs: python -m pip install edge-tts
#
# Reads JSON from stdin: {"text": "...", "voice": "ar-IQ-RanaNeural",
# "rate": "+0%", "out": "out/voice-edge/open.mp3"}, writes the MP3 to "out" and
# prints the words as JSON: [{"text": "...", "start": 0.103, "end": 0.787}]
# (seconds from the start of the MP3). Edge leaves punctuation out of the words.

import asyncio
import json
import sys

try:
    import edge_tts
except ImportError:
    sys.exit("edge-tts is not installed for this Python. Run: python -m pip install edge-tts")


async def speak(text, voice, rate, out):
    words = []
    communicate = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    with open(out, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 1e7  # 100 ns units
                words.append({
                    "text": chunk["text"],
                    "start": round(start, 3),
                    "end": round(start + chunk["duration"] / 1e7, 3),
                })
    return words


# Bytes in and out, so Arabic text survives a Windows console code page.
job = json.loads(sys.stdin.buffer.read().decode("utf-8"))
words = asyncio.run(speak(job["text"], job["voice"], job.get("rate", "+0%"), job["out"]))
sys.stdout.write(json.dumps(words))
