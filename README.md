# Courtside 🏀

Ranked basketball training. Players take a short quiz, get a personal program built from drills used by pro and college coaches, and level up by completing workouts, keeping their commitments, eating well and sleeping. A team feed lets players and coaches share drills, advice, wins and stories.

## Features

- **Onboarding quiz**: one question per screen. It asks about role (player or coach), skill goals, physical, strength and nutrition goals, diet, available equipment, schedule, sleep and what usually gets in the way. The answers produce a named program, for example *Sharpshooter + Bounce*, with a weekly plan.
- **Pro and college drills**: about 70 drills credited to the programs and players known for them, including Villanova (Jay Wright), Michigan State (Tom Izzo), Duke (Mike Krzyzewski), Kentucky (John Calipari), Pete Newell's Big Man Camp, George Mikan and Ray Meyer, Kobe Bryant, Stephen Curry and Brandon Payne, Ray Allen, Kevin Durant, Kyrie Irving, Hakeem Olajuwon, Dirk Nowitzki, Drew Hanlen, Chris Brickley and the NBA Draft Combine. Sources are listed in `js/drills.js` and in the app.
- **Workouts**: sessions fit the player's level, position, equipment and session length. Each drill has a timer, and shooting drills have a make/miss tracker.
- **Active recovery**: recovery days with mobility, foam rolling, yoga, easy cardio and breathing work.
- **Editable schedule**: change any day's session and time. Each day can have an alarm.
- **Alarm clock**: unlimited wake-up, bedtime, game-day and custom alarms with repeat days, four sounds (buzzer, ref whistle, arena horn, chime), snooze, and an optional wake-up challenge (answer a hoops question to stop it). Getting up within 10 minutes earns XP, and wake and bed times carry into the sleep log. Bedtime is suggested from your sleep goal and earliest wake-up.
- **Reminders and alarms**: an in-app reminder at workout time, plus an optional alarm sound with snooze. You can also export the schedule as a calendar file with alerts, which work even when the app is closed.
- **Nutrition**: calorie and macro targets, plus a daily meal plan that respects your diet.
- **Sleep tracking**: log bed and wake times. The target depends on age, and a 14-night chart shows how often you hit it.
- **Video-game progression**: XP for every task, with early levels coming fast. Rank tiers go from Bronze III to Legend, like ranked game modes. You get level-up and rank-up animations, an OVR player card, badges, daily quests and streaks.
- **Leaderboards**: weekly XP, shots made, commitments kept, streak and level.
- **Social feed**: drill, advice and win posts with photos or videos, 🔥 cheers and comments. Coaches get a badge. Stories last 24 hours.
- **Learn library**: 25 short lessons in three tracks (Skill, Physical, Mental). Each one has key points, linked practice drills and a one-question check for XP. There's also a searchable library of every drill with category and pro/college filters and one-tap "Add to today's session".
- **Stories on Home**: a stories bar at the top of Home and Feed. Post text, photo, video or your workout on a choice of backgrounds. Stories you've already watched are marked.
- **Story sharing**: post a workout to your in-app story, or save a 1080×1920 image to share on Instagram or TikTok.
- **AI Coach** (optional): analyzes a workout or your week and answers training questions, using your own data.

## How it runs

Courtside is a static web app with no build step. Serve the folder and open it:

```sh
python3 -m http.server 8000
```

Opened this way, it works fully for one person, with data saved in the browser. The shared features (leaderboards, feed, stories, cloud sync, photo and video uploads, and AI Coach) use Claude artifact capabilities. They turn on when the app is published as a Claude artifact:

```sh
python3 build.py                    # game style (default) → dist/courtside.html
python3 build.py --theme premium    # Apple-inspired premium style → dist/courtside-premium.html
```

Shared data layout:

| Path | Who can read | Who can write |
| --- | --- | --- |
| `data/users/<id>/state` | only that player | only that player |
| `players/<id>` (leaderboard card) | everyone | that player |
| `feed/<id>` (posts and stories) | everyone | that player (the owner can remove posts) |
| `cheers/<id>`, `comments/<id>` | everyone | that player |

### Limits of the prototype

- The in-app alarm only rings while the app is open. The calendar export gives real phone alerts. True background alarms and push notifications need a native app.
- Players need access to the artifact link to sync and compete. Anyone who opens it with view-only access keeps their progress on their own device.

## Structure

```
index.html     App shell
styles.css     Game-style theme, dark and light (the default)
theme-premium.css  Premium theme layered over styles.css
js/drills.js   Drill library with sources
js/lessons.js  Lesson library (Skill, Physical, Mental)
js/data.js     Quiz, meals, quotes, badges, rank tiers, XP values
js/engine.js   Plan building, workouts, nutrition, sleep, XP and ranks
js/cloud.js    Claude capabilities (db, user, sample, assets, downloads) with fallbacks
js/app.js      Views and interactions
build.py       Bundles everything into dist/courtside.html
```

> Nutrition targets are estimates, not medical advice. Young athletes should check with a coach, trainer or doctor before big diet changes. Drills are described in our own words and credited to the people known for them. Courtside isn't affiliated with or endorsed by them.
