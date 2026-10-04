// Lesson library: short reads on the important parts of the game.
// Each lesson links to drills for practice and ends with a one-question check.

export const TRACKS = {
  skill: { label: "Skill", blurb: "Shooting, handling, finishing, defense and reading the game." },
  physical: { label: "Physical", blurb: "Strength, speed, landing, conditioning and recovery." },
  mental: { label: "Mental", blurb: "Confidence, focus, pressure and how to bounce back." },
};

export const LESSONS = [
  // ---------- Skill ----------
  {
    id: "beef", track: "skill", title: "Shooting Form: BEEF", minutes: 3, level: 1,
    summary: "The classic four-part checklist coaches use to build a repeatable jump shot.",
    points: [
      "Balance: feet about shoulder-width, shooting foot slightly ahead, knees bent. Your power comes from your legs.",
      "Eyes: pick your target early (the front of the rim or just over it) and hold your eyes there through the shot.",
      "Elbow: keep your shooting elbow under the ball, lined up with the rim. The guide hand only steadies the ball.",
      "Follow-through: snap your wrist and hold it with your fingers pointing at the rim until the ball lands.",
      "Build it close first. Make it perfect at 3 feet before you move back.",
    ],
    practice: ["form", "set-lifts", "bed-shots"],
    quiz: { q: "What should your shooting elbow do?", options: ["Flare out for power", "Stay under the ball, lined up with the rim", "Point at the floor"], answer: 1 },
  },
  {
    id: "triple-threat", track: "skill", title: "Triple Threat & Pivoting", minutes: 3, level: 1,
    summary: "Catch in a position where you can shoot, pass or drive, so the defense has to guess.",
    points: [
      "Catch with knees bent, ball on your hip (shooting-side), eyes on the rim.",
      "From here you can shoot, pass or drive. The defender can't play all three.",
      "Once you pick a pivot foot, it stays down until you pass, shoot or start a dribble. Lifting it first is a travel.",
      "Use jab steps to move the defender: if they back off, shoot; if they bite, drive past them.",
    ],
    practice: ["jab-series"],
    quiz: { q: "After you choose a pivot foot, when can you lift it?", options: ["Whenever you want", "Only after you release a pass, shot or dribble", "After two steps"], answer: 1 },
  },
  {
    id: "handles-basics", track: "skill", title: "Ball Handling That Holds Up", minutes: 4, level: 1,
    summary: "Good handles aren't tricks. They're control, protection and change of pace.",
    points: [
      "Dribble with your fingertips, not your palm, and pound the ball hard. A hard dribble spends less time in the air for defenders to poke.",
      "Keep your eyes up so you can see teammates and help defenders.",
      "Protect the ball with your body and an off-arm bar when a defender is close.",
      "Change of pace beats change of direction: slow, then explode.",
      "Learn one move, then its counter. That's how Kyrie Irving builds his combos.",
    ],
    practice: ["pound", "crossover-series", "kyrie-counters"],
    quiz: { q: "Why pound the dribble hard?", options: ["It's louder", "The ball spends less time where a defender can reach it", "It tires your arm out"], answer: 1 },
  },
  {
    id: "finishing", track: "skill", title: "Finishing at the Rim", minutes: 4, level: 1,
    summary: "Most points come from close range. Finish with either hand and through contact.",
    points: [
      "Use the backboard on angle layups. Aim for the top corner of the square.",
      "Learn to finish with both hands. The Mikan drill trains exactly that.",
      "Finish with your outside hand, away from the defender, when they're beside you.",
      "Jump stops and pro hops let you change direction and keep your balance in traffic.",
      "Expect contact: protect the ball high and finish strong instead of avoiding the bump.",
    ],
    practice: ["mikan", "hanlen-prohop", "euro"],
    quiz: { q: "A defender is on your right side as you drive. Which hand should finish?", options: ["Right hand, toward the defender", "Left hand, away from the defender", "Doesn't matter"], answer: 1 },
  },
  {
    id: "passing", track: "skill", title: "Passing & Vision", minutes: 3, level: 1,
    summary: "Good passing turns a good shot into a great one.",
    points: [
      "Chest pass for quick, open passes. Bounce pass to get under a defender's hands. Overhead pass to skip over the defense.",
      "Pass away from the defender, to your teammate's target hand.",
      "Step into your pass and snap your thumbs down for power and accuracy.",
      "Fake a pass to move the defense before you make the real one.",
    ],
    practice: ["calipari-attack"],
    quiz: { q: "When is a bounce pass usually best?", options: ["To get under a defender's hands", "For a full-court outlet", "To skip across the zone"], answer: 0 },
  },
  {
    id: "defense-stance", track: "skill", title: "On-Ball Defense & Closeouts", minutes: 4, level: 1,
    summary: "Stay in front, stay balanced, and contest without fouling.",
    points: [
      "Stance: feet wider than your shoulders, knees bent, back flat, hands active.",
      "Slide, don't cross your feet. Push off the back foot and lead with the front.",
      "Closeouts: sprint the first two-thirds of the way, then chop your feet so you arrive balanced with a hand high.",
      "Help side: see both the ball and your player. Point to each so you never lose either one.",
      "Talk on every possession. Duke's shell drill is built around closeouts and communication.",
    ],
    practice: ["closeout-slide", "zig-zag", "duke-shell"],
    quiz: { q: "On a closeout, when do you chop your feet?", options: ["Right away", "In the last part, so you arrive balanced", "Never, sprint all the way"], answer: 1 },
  },
  {
    id: "rebounding", track: "skill", title: "Rebounding: Hit, Turn, Chin", minutes: 3, level: 1,
    summary: "Rebounding is mostly effort and position. Michigan State built its identity on it.",
    points: [
      "When the shot goes up, find a body and make contact first (hit).",
      "Turn and seal them with your backside, arms wide (turn).",
      "Go get the ball at its highest point and bring it to your chin, elbows out (chin).",
      "Most misses bounce to the opposite side of the rim, so position yourself there.",
    ],
    practice: ["izzo-war", "tip-drill"],
    quiz: { q: "Where do most missed shots bounce?", options: ["Straight back to the shooter", "To the opposite side of the rim", "Out of bounds"], answer: 1 },
  },
  {
    id: "spacing", track: "skill", title: "Game IQ: Spacing & Reads", minutes: 4, level: 2,
    summary: "Where you stand without the ball decides how good your team's shots are.",
    points: [
      "Spread out about 15–18 feet apart. Two offensive players close together let one defender guard both.",
      "When a teammate drives, move into their line of sight (drift to the corner or lift to the wing) for the kick-out.",
      "If your defender turns their head to watch the ball, cut to the basket behind them.",
      "Read the help: if a defender leaves a shooter to stop a drive, the shooter is open.",
    ],
    practice: ["calipari-attack", "spot-up"],
    quiz: { q: "Your defender turns to watch the ball. What's a good read?", options: ["Stand still", "Cut behind them to the basket", "Ask for the ball at half court"], answer: 1 },
  },
  {
    id: "pick-and-roll", track: "skill", title: "Game IQ: Pick-and-Roll Reads", minutes: 4, level: 2,
    summary: "The most common play in basketball. Learn the three basic reads.",
    points: [
      "Wait for the screen. Set your defender up with a step the other way, then come off shoulder-to-shoulder with the screener.",
      "If your defender goes under the screen, shoot it or attack downhill.",
      "If two defenders trap you, the screener is open. Hit them on the roll.",
      "If the big man drops back, the mid-range pull-up is open.",
      "Screeners: set a wide, legal screen and stay still, then roll hard or pop to open space.",
    ],
    practice: ["hanlen-slice", "kd-freeze"],
    quiz: { q: "Two defenders trap the ball handler. Who is usually open?", options: ["The screener rolling to the rim", "Nobody", "The ball handler"], answer: 0 },
  },

  // ---------- Physical ----------
  {
    id: "warmup-science", track: "physical", title: "Warm Up the Right Way", minutes: 3, level: 1,
    summary: "Moving warm-ups prepare your body better than long static stretches before play.",
    points: [
      "Start with 5–10 minutes of movement: jogging, skips, lunges, leg swings.",
      "Save long static stretches (holding for 30+ seconds) for after practice. Before explosive work they can make you feel slower.",
      "Finish your warm-up with a few quick bursts like sprints and jumps so you're ready at game speed.",
    ],
    practice: ["warmup", "ankle-mobility"],
    quiz: { q: "When are long static stretches best?", options: ["Right before you sprint", "After practice", "During a timeout"], answer: 1 },
  },
  {
    id: "landing", track: "physical", title: "Land Like a Pro (Protect Your Knees)", minutes: 4, level: 1,
    summary: "How you land matters as much as how high you jump. Good landing mechanics lower injury risk.",
    points: [
      "Land softly on the balls of your feet and let your ankles, knees and hips bend together to absorb force.",
      "Keep your knees tracking over your toes. Don't let them cave inward.",
      "Land on two feet when you can, with your chest up and hips back.",
      "Hamstring and hip strength help keep your knees safe. Nordic curls and split squats count.",
      "Injury-prevention warm-up programs that train landing and balance have been shown to reduce knee injuries in young athletes.",
    ],
    practice: ["box-jumps", "broad-jumps", "nordics"],
    quiz: { q: "When you land from a jump, your knees should…", options: ["Cave inward", "Stay straight and locked", "Track over your toes and bend"], answer: 2 },
  },
  {
    id: "strength-basics", track: "physical", title: "Strength Training for Hoopers", minutes: 4, level: 1,
    summary: "Getting stronger makes you jump higher, move faster and get hurt less.",
    points: [
      "Supervised strength training with good technique is considered safe and beneficial for young athletes.",
      "Master bodyweight first: squats, lunges, push-ups, planks. Add weight only when your form is solid.",
      "Train single-leg strength. Basketball is played on one leg at a time.",
      "Quality reps beat heavy, sloppy ones. Stop a set when your form breaks.",
      "Two or three strength sessions a week is plenty during the season.",
    ],
    practice: ["goblet-squat", "split-squat", "core"],
    quiz: { q: "When should you add weight to an exercise?", options: ["Right away", "When your form is solid", "Only after you turn 18"], answer: 1 },
  },
  {
    id: "vertical", track: "physical", title: "How to Jump Higher", minutes: 3, level: 1,
    summary: "A higher vertical comes from strength plus fast, high-quality jumps.",
    points: [
      "Strength builds the engine: squats, split squats, calf raises.",
      "Plyometrics teach you to use it fast: box jumps, pogo hops, approach jumps.",
      "Keep jump sets short and fully rested. Tired jumping trains you to jump slow.",
      "Track your vertical every few weeks in Courtside to see what's working.",
    ],
    practice: ["approach-jumps", "pogo", "calf-raises"],
    quiz: { q: "Why rest fully between jump sets?", options: ["So every jump is fast and high quality", "It doesn't matter", "To get bored"], answer: 0 },
  },
  {
    id: "conditioning", track: "physical", title: "Basketball Conditioning", minutes: 3, level: 1,
    summary: "Basketball is stop-and-go, so train in bursts, not just long jogs.",
    points: [
      "Games are made of short sprints, slides and jumps with quick recoveries.",
      "Interval work like 20 seconds hard, 40 seconds easy matches that rhythm.",
      "Add skills when you're tired. Shooting at the end of conditioning prepares you for the fourth quarter.",
    ],
    practice: ["intervals", "17s", "full-court-layups"],
    quiz: { q: "Which matches basketball best?", options: ["A slow 5-mile jog", "Short hard bursts with quick recoveries", "Only weightlifting"], answer: 1 },
  },
  {
    id: "ankles", track: "physical", title: "Ankle Care", minutes: 3, level: 1,
    summary: "Ankle sprains are the most common basketball injury. Balance training helps prevent them.",
    points: [
      "Practice single-leg balance: stand on one foot for 30 seconds, then try it with your eyes closed.",
      "Strengthen your calves and the muscles around your ankle with calf raises and hops.",
      "After a sprain, finish rehab before going all-out again. Re-injury is common when players rush back.",
      "Supportive shoes, or bracing or taping if a trainer recommends it, can help players with past sprains.",
    ],
    practice: ["ankle-mobility", "calf-raises", "pogo"],
    quiz: { q: "What helps prevent ankle sprains?", options: ["Balance and calf strength training", "Never jumping", "Skipping warm-ups"], answer: 0 },
  },
  {
    id: "recovery-sleep", track: "physical", title: "Recovery & Sleep", minutes: 3, level: 1,
    summary: "You get better while you recover, not only while you train.",
    points: [
      "Teens need about 8–10 hours of sleep a night. Courtside sets your target from your age.",
      "When Stanford's basketball team slept about 10 hours a night for several weeks, their sprint times and shooting both improved.",
      "Active recovery (easy movement, mobility, foam rolling) helps sore legs more than sitting still.",
      "Soreness is normal. Sharp or lasting pain is not. Tell a coach or trainer.",
    ],
    practice: ["flush", "foam-roll", "hooper-yoga"],
    quiz: { q: "Sharp pain that doesn't go away is…", options: ["Normal soreness, push through", "A sign to tell a coach or trainer", "Good for you"], answer: 1 },
  },
  {
    id: "fueling", track: "physical", title: "Fuel & Hydration", minutes: 3, level: 1,
    summary: "Food is fuel. Timing matters on game and training days.",
    points: [
      "Eat a meal with carbs and some protein 2–3 hours before you play.",
      "Within an hour after training, get protein and carbs to rebuild. Chocolate milk works.",
      "Drink water through the day, not just at practice. Pale yellow urine is a good sign.",
      "Skip heavy, greasy food right before games. It sits in your stomach.",
    ],
    practice: [],
    quiz: { q: "When should you eat your pregame meal?", options: ["Right as warm-ups start", "2–3 hours before", "Never, play hungry"], answer: 1 },
  },

  // ---------- Mental ----------
  {
    id: "ft-routine", track: "mental", title: "The Free Throw Routine", minutes: 3, level: 1,
    summary: "A consistent routine takes the pressure out of the moment.",
    points: [
      "Build a short routine and use it every single time: same spot, same dribbles, same breath.",
      "Take one slow breath before you shoot to calm your heart rate.",
      "Pick one cue word like \"smooth\" or \"finish\" instead of thinking about everything at once.",
      "Practice your routine tired, at the end of workouts, so it holds up late in games.",
    ],
    practice: ["free-throws", "breathing"],
    quiz: { q: "What makes a free throw routine work?", options: ["Changing it every time", "Doing the same thing every time", "Shooting as fast as possible"], answer: 1 },
  },
  {
    id: "next-play", track: "mental", title: "Next-Play Mentality", minutes: 3, level: 1,
    summary: "The best players have short memories for mistakes.",
    points: [
      "You will miss shots and turn the ball over. Every great player does.",
      "Use a reset cue after a mistake: clap, touch your shorts, take a breath, and say \"next play.\"",
      "Focus on what you can control right now: effort, defense, communication.",
      "Learn from mistakes after the game, not during it.",
    ],
    practice: [],
    quiz: { q: "After a turnover, the best move is to…", options: ["Replay it in your head", "Use a reset cue and focus on the next play", "Argue with the ref"], answer: 1 },
  },
  {
    id: "self-talk", track: "mental", title: "Confidence & Self-Talk", minutes: 3, level: 1,
    summary: "What you say to yourself changes how you play.",
    points: [
      "Notice negative talk (\"I can't hit anything today\") and swap it for an instruction (\"Legs, follow through\").",
      "Instructional self-talk helps skills. Motivational self-talk (\"I've got this\") helps effort and confidence.",
      "Confidence comes from preparation. Your logged workouts are proof you've put in the work.",
    ],
    practice: [],
    quiz: { q: "Which is instructional self-talk?", options: ["\"I always miss\"", "\"Legs, follow through\"", "\"Whatever\""], answer: 1 },
  },
  {
    id: "visualization", track: "mental", title: "Visualization", minutes: 3, level: 1,
    summary: "Seeing it in your mind trains your brain for the real thing.",
    points: [
      "Spend 3–5 minutes picturing yourself playing well: the gym, the crowd noise, the feel of the ball.",
      "See it from your own eyes, at real speed, including a mistake you bounce back from.",
      "Visualize before bed or before games, after you've practiced the skill for real.",
    ],
    practice: ["breathing"],
    quiz: { q: "Good visualization is…", options: ["Vague and fast", "Detailed and from your own eyes", "Only about winning trophies"], answer: 1 },
  },
  {
    id: "pressure", track: "mental", title: "Handling Pressure & Nerves", minutes: 3, level: 1,
    summary: "Nerves mean you care. Learn to use them.",
    points: [
      "A racing heart and butterflies are your body getting ready. Call it \"excited,\" not \"scared.\"",
      "Box breathing (in 4, hold 4, out 4, hold 4) calms you down in under a minute.",
      "Phil Jackson had his Bulls and Lakers teams practice mindfulness to stay calm and present in big moments.",
      "Focus on the process (a good shot, your defensive stance), not the scoreboard.",
    ],
    practice: ["breathing"],
    quiz: { q: "What does box breathing do?", options: ["Speeds up your heart rate", "Helps calm you down quickly", "Nothing"], answer: 1 },
  },
  {
    id: "goals", track: "mental", title: "Setting Goals That Work", minutes: 3, level: 1,
    summary: "Big dreams plus small daily goals is how players actually improve.",
    points: [
      "Outcome goal: the dream, like making varsity.",
      "Performance goal: a number you control, like shooting 75% from the line.",
      "Process goal: what you do today, like 100 free throws and in bed by 10.",
      "Your Courtside schedule is a list of process goals. Keep your commitments and the outcomes follow.",
    ],
    practice: [],
    quiz: { q: "\"Make 100 free throws today\" is a…", options: ["Process goal", "Outcome goal", "Not a goal"], answer: 0 },
  },
  {
    id: "slump", track: "mental", title: "Breaking a Slump", minutes: 3, level: 2,
    summary: "Every shooter goes through it. Here's how to climb out.",
    points: [
      "Go back to basics: close-range form shooting builds back feel and confidence.",
      "Stop overthinking mechanics in games. Trust your training and use one cue.",
      "Track your makes in practice. You'll see you're better than the slump feels.",
      "Check your sleep and fatigue. Tired legs are behind a lot of short shots.",
    ],
    practice: ["form", "get-50"],
    quiz: { q: "A good first step to break a shooting slump is…", options: ["Shooting deeper threes", "Close-range form shooting", "Not shooting at all"], answer: 1 },
  },
  {
    id: "teammate", track: "mental", title: "Being a Great Teammate", minutes: 3, level: 1,
    summary: "Coaches play the players who make everyone better.",
    points: [
      "Talk on defense, pick teammates up after mistakes, celebrate their success.",
      "Be on time and ready. Reliability is a skill.",
      "Take coaching without excuses: listen, nod, apply it next rep.",
      "Do the little things: dive for loose balls, set good screens, sprint back on defense.",
    ],
    practice: ["duke-shell"],
    quiz: { q: "Taking coaching well means…", options: ["Explaining why you were right", "Listening and applying it on the next rep", "Ignoring it"], answer: 1 },
  },
];
