# Courtside ads

Five vertical 1080×1920 videos (Reels, TikTok, Shorts, Stories) in the premium app style, each with a narrator and an original soundtrack.

| Video | Features | Length |
| --- | --- | --- |
| `courtside-ad1-your-program.mp4` | Onboarding quiz, personal plan, drills, shot tracking | 18 s |
| `courtside-ad2-rise-and-grind.mp4` | Alarms, wake-up challenge, sleep tracking | 18 s |
| `courtside-ad3-study-the-game.mp4` | Lesson library, lesson quizzes, drill library | 18 s |
| `courtside-ad4-climb-the-ranks.mp4` | XP, level-ups, Bronze-to-Legend tiers, leaderboard | 18 s |
| `courtside-ad5-all-in-one.mp4` | AI Coach, nutrition and meal plans, every feature | 18 s |

## Rights

- **No real people, teams or schools.** App screens are captured with drill credits replaced by "Top-program drill", only drills without a person's name are shown, and every capture is scanned for a list of names before it's saved (see `capture-screens.mjs`). Player names and stats are invented demo data.
- **Music is original.** Every track is synthesized from scratch by `music2.py` (warm electric piano, bells, snaps, shaker, sub bass and strings). There are no samples or loops and nothing to license. `music.py` holds the shared synth helpers and the first-round electronic score.
- **Narrator:** the ElevenLabs voice "Marco J" (voice ID `CXAc4DNZL6wonQQNlNgZ`, model `eleven_v4`). Each ad's script was read in one take, so the delivery flows naturally. That take was then cut into lines and placed on the cue sheet. The takes are in `src/vo-elevenlabs/`, and the scripts are in `src/narration.json`. Commercial use is covered by a paid ElevenLabs plan, so check that your plan includes it before running paid ads. The earlier Kokoro (Apache 2.0) narrator can still be rebuilt with `src/tts.py`.
- **Typeface:** Inter (SIL Open Font License), the closest freely licensed match to Apple's San Francisco.

## How they're made

| File | What it does |
| --- | --- |
| `src/capture-screens.mjs` | Captures real app screens (premium build) with sample data |
| `src/engine.js`, `src/style.css` | Shared motion engine: spring physics, iPhone screen pushes, glass tags, tap ripples, tier and feature graphics |
| `src/ad*.html` | One timeline per ad (scenes, captions, tags, taps) |
| `src/render.mjs` | Renders an ad to JPEG frames at any fps and writes its cue sheet |
| `src/narration.json` | Narrator lines and the second each one starts |
| `src/narration_eleven.json` | The same lines, with start times nudged so no ElevenLabs line runs into the next |
| `src/vo-elevenlabs/` | The ElevenLabs take used for each ad (one MP3 per ad) |
| `src/split_eleven.py` | Cuts a take into one WAV per line, choosing the pauses that best fit each line's expected length |
| `src/tts.py` | Speaks the lines with Kokoro and flags any line that would run into the next |
| `src/music2.py`, `src/music.py`, `src/music.json` | Composes each soundtrack from the cue sheet (swells into cuts, UI ticks on taps, XP chimes, alarm beeps, end-card hit) and mixes in the narrator, ducking the music under the voice |

```sh
node src/render.mjs "$PWD/src/ad2-rise-and-grind.html" /tmp/ad2 full 30
# narration: download kokoro-v1.0.onnx and voices-v1.0.bin from the kokoro-onnx releases into src/ first
python3 src/tts.py af_heart 1.05 /tmp/vo                                       # pip install kokoro-onnx soundfile
python3 src/music2.py ad2-rise-and-grind /tmp/ad2/cues.json /tmp/vo /tmp/ad2.wav  # needs numpy + scipy
# ElevenLabs narrator (what the current videos use)
python3 src/split_eleven.py src/vo-elevenlabs/ad2-rise-and-grind.mp3 ad2-rise-and-grind /tmp/vo11
python3 src/music2.py ad2-rise-and-grind /tmp/ad2/cues.json /tmp/vo11 /tmp/ad2.wav src/narration_eleven.json
ffmpeg -framerate 30 -i /tmp/ad2/f_%05d.jpg -i /tmp/ad2.wav \
  -filter_complex "[1:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]" -map 0:v -map "[a]" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart courtside-ad2.mp4
```

Audio is normalized to -14 LUFS, the level most social platforms use.
