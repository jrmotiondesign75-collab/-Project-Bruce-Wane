# Courtside 🏀

A training companion for basketball players: daily workouts, meal plans, progress tracking, and motivation.

## Features

- **Workouts**: a new session every day, built for your position, skill level, and session length. A weekly rotation covers skill, athletic, conditioning, shooting, and recovery days. Each drill comes with instructions and a countdown timer, and you can shuffle the drills or switch the day's focus.
- **Meal plans**: calorie, protein, carb, fat, and water targets worked out from your body stats and goal (build muscle, maintain, or get leaner). The daily plan respects vegetarian, vegan, and dairy-free diets and scales portions to hit your target. Check off meals as you eat them.
- **Progress**: workout count, hours, current and best streak, a 12-week training heatmap, and trend charts for weight, vertical jump, sprint time, free throws, and threes.
- **Motivation**: streak flame, XP levels with ranks (Rookie → Legend), unlockable badges, a daily challenge, a quote of the day, and a coach message that reacts to how you've been training.

## Running it

There's no build step and nothing to install. Serve the folder with any static server:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

It works on GitHub Pages, Netlify, Vercel, or any static host. On a phone, use "Add to Home Screen" to install it like an app.

All data stays in the browser (`localStorage`). There are no accounts and no server.

## Structure

```
index.html            App shell and bottom navigation
styles.css            Styles, with light and dark mode
js/app.js             State, workout and meal-plan generation, views, events
js/data.js            Drills, meals, quotes, badges, metrics
manifest.webmanifest  Lets the app be installed on a phone
icon.svg              App icon
```

To add drills or meals, add entries to `js/data.js`. The generators pick them up automatically.

> Nutrition targets are estimates (Mifflin-St Jeor). They're not medical advice. Young athletes should check with a coach, trainer, or doctor before making big diet changes.
