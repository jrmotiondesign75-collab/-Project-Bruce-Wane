# Courtside ads

Vertical 1080×1920 videos (Reels, TikTok, Shorts, Stories) in the premium app style.

| File | What it is |
| --- | --- |
| `courtside-ad-1-draft.mp4` | Draft ad 1, "Train like the pros" overview (19 s, silent) |
| `src/ad1.html` | The animation. Every frame is a pure function of time (`render(t)`), using critically damped springs |
| `src/shots/` | Real app screens captured from the premium build |
| `src/capture-screens.mjs` | Script that captured those screens with sample data |
| `src/render.mjs` | Renders an ad HTML to JPEG frames with Playwright |

Render and encode:

```sh
node src/render.mjs "$PWD/src/ad1.html" /tmp/frames full 30
ffmpeg -framerate 30 -i /tmp/frames/f_%05d.jpg -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart courtside-ad-1.mp4
```

Typeface: Inter (SIL Open Font License), the closest freely licensed match to Apple's San Francisco.
