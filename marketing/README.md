# Courtside ads

Five vertical 1080×1920 videos (Reels, TikTok, Shorts, Stories) in the premium app style, each with an original soundtrack.

| Video | Features | Length |
| --- | --- | --- |
| `courtside-ad1-your-program.mp4` | Onboarding quiz, personal plan, drills, shot tracking | 18 s |
| `courtside-ad2-rise-and-grind.mp4` | Alarms, wake-up challenge, sleep tracking | 18 s |
| `courtside-ad3-study-the-game.mp4` | Lesson library, lesson quizzes, drill library | 18 s |
| `courtside-ad4-climb-the-ranks.mp4` | XP, level-ups, Bronze-to-Legend tiers, leaderboard | 18 s |
| `courtside-ad5-all-in-one.mp4` | AI Coach, nutrition and meal plans, every feature | 18 s |

## Rights

- **No real people, teams or schools.** App screens are captured with drill credits replaced by "Top-program drill", only drills without a person's name are shown, and every capture is scanned for a list of names before it's saved (see `capture-screens.mjs`). Player names and stats are invented demo data.
- **Music is original.** Every track is synthesized from scratch by `music.py`. There are no samples or loops and nothing to license.
- **Typeface:** Inter (SIL Open Font License), the closest freely licensed match to Apple's San Francisco.

## How they're made

| File | What it does |
| --- | --- |
| `src/capture-screens.mjs` | Captures real app screens (premium build) with sample data |
| `src/engine.js`, `src/style.css` | Shared motion engine: spring physics, iPhone screen pushes, glass tags, tap ripples, tier and feature graphics |
| `src/ad*.html` | One timeline per ad (scenes, captions, tags, taps) |
| `src/render.mjs` | Renders an ad to JPEG frames at any fps and writes its cue sheet |
| `src/music.py`, `src/music.json` | Composes each soundtrack from the cue sheet: beat-matched track, whooshes on cuts, UI ticks on taps, XP chimes, alarm beeps, end-card impact |

```sh
node src/render.mjs "$PWD/src/ad2-rise-and-grind.html" /tmp/ad2 full 30
python3 src/music.py ad2-rise-and-grind /tmp/ad2/cues.json /tmp/ad2.wav     # needs numpy + scipy
ffmpeg -framerate 30 -i /tmp/ad2/f_%05d.jpg -i /tmp/ad2.wav \
  -filter_complex "[1:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]" -map 0:v -map "[a]" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart courtside-ad2.mp4
```

Audio is normalized to -14 LUFS, the level most social platforms use.
