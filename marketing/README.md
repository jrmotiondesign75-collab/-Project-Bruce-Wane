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

## Hype edits (beat-synced, licensed-music versions)

`src/hype/` holds a second, faster style: rapid cuts locked to a song's beat grid, with whip, spin, zoom-through, pull-back, slam and flash transitions, directional motion blur, speed-ramped camera moves, kinetic type, counters, a coverflow carousel and a pulse on every beat. It renders at 60 fps. For legibility, blur only appears during transitions, never while a shot is on screen. Close-ups always show the full width of the app screen, long lines of type shrink to fit, and secondary text is set large and bright.

| Edit | Song | Clip | Tempo |
| --- | --- | --- | --- |
| `hype1-flashing` | Flashing Lights (Kanye West feat. Dwele) | 21.8 s to 43.0 s. The drum drop at 27.1 s lands on the first hard cut | 90.5 BPM |
| `hype2-mist` | Mist (Instrumental) (Dev1lHawk, xaviorthemachine) | 2.4 s to 24.6 s | 97.5 BPM |
| `hype3-needit` | Need It (Migos feat. YoungBoy Never Broke Again) | 8.9 s to 30.0 s. The vocals hit on the first hard cut | 74 BPM, cut on 148 BPM half-beats |
| `hype4-hot` | Hot (Young Thug feat. Gunna) | 1.5 s to 22.4 s. The 808 drop at 6.4 s lands on the first hard cut | 149 BPM |
| `hype5-weongo` | WE ON GO (BIA) | 26.5 s to 48.5 s. The bass drops out, then slams back at 30.2 s on the first hard cut | 65.5 BPM, cut on 131 BPM half-beats |

**The songs are not licensed.** They are commercial recordings, so these MP4s are not in the repo, and they must not be used in paid ads. They are fine as a reference cut, or for an organic post where you add the same sound from TikTok's or Instagram's own music library (which covers the license there). Business accounts on those platforms are generally limited to the commercial music library. Need It and Hot are explicit tracks, and WE ON GO may be too. Their lyrics have not been checked for these windows.

```
python3 src/hype/beats.py song.mp3 src/hype/beats/<song>.beats.json   # constant-tempo beat grid (numpy + scipy)
python3 src/hype/edits.py src/hype/beats src/hype                      # writes <edit>.html + <edit>.clip.json
node src/hype/render.mjs $PWD/src/hype/hype1-flashing.html /tmp/f frames 60
python3 src/hype/mix.py song.mp3 src/hype/hype1-flashing.clip.json /tmp/f/cues.json /tmp/a.wav
ffmpeg -framerate 60 -i /tmp/f/f_%05d.jpg -i /tmp/a.wav -c:v libx264 -crf 17 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest out.mp4
```

The timelines in `edits.py` are written in beats, so any of them can be re-cut to another song: run `beats.py` on it and change `song` and `anchor` (the edit beat that should land on the drop).
