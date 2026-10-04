// Static content: quiz, meals, quotes, badges, ranks, challenges.

// One question per screen. `type`: single | multi | number | text | body
export const QUIZ = [
  { id: "role", type: "single", q: "Are you a player or a coach?", options: [
    { v: "player", label: "Player", sub: "Get a personal plan" },
    { v: "coach", label: "Coach", sub: "Share drills and advice, track your players" },
  ] },
  { id: "handle", type: "text", q: "Pick your player tag", sub: "This is how you show up on leaderboards and the feed.", placeholder: "e.g. SplashKing23", max: 20 },
  { id: "age", type: "number", q: "How old are you?", min: 10, max: 60, unit: "years", playerOnly: true },
  { id: "body", type: "body", q: "Height and weight", sub: "Used for your nutrition targets. Only you see this.", playerOnly: true },
  { id: "sex", type: "single", q: "Sex", sub: "Used only for the calorie formula.", playerOnly: true, options: [
    { v: "male", label: "Male" }, { v: "female", label: "Female" },
  ] },
  { id: "position", type: "single", q: "What position do you play?", playerOnly: true, options: [
    { v: "PG", label: "Point Guard" }, { v: "SG", label: "Shooting Guard" }, { v: "SF", label: "Small Forward" },
    { v: "PF", label: "Power Forward" }, { v: "C", label: "Center" },
  ] },
  { id: "level", type: "single", q: "What level do you play at?", playerOnly: true, options: [
    { v: 1, label: "Rec or middle school", sub: "Building the basics" },
    { v: 2, label: "High school or AAU", sub: "Competing for minutes" },
    { v: 3, label: "Varsity star, college or pro", sub: "Sharpening an advanced game" },
  ] },
  { id: "skillGoals", type: "multi", max: 2, q: "Skill goal: what do you want to improve most?", sub: "Pick up to 2.", playerOnly: true, options: [
    { v: "shooting", label: "Shooting" }, { v: "handles", label: "Ball handling" }, { v: "finishing", label: "Finishing at the rim" },
    { v: "defense", label: "Defense & rebounding" }, { v: "post", label: "Post game & footwork" },
  ] },
  { id: "physicalGoal", type: "single", q: "Physical goal", playerOnly: true, options: [
    { v: "vertical", label: "Jump higher" }, { v: "speed", label: "Get faster and quicker" },
    { v: "endurance", label: "Last all game" }, { v: "durable", label: "Stay healthy and injury-proof" },
  ] },
  { id: "strengthGoal", type: "single", q: "Strength goal", playerOnly: true, options: [
    { v: "size", label: "Build muscle and size" }, { v: "strong", label: "Get stronger without bulking" },
    { v: "core", label: "Core, balance and stability" }, { v: "light", label: "Not a priority right now" },
  ] },
  { id: "goal", type: "single", q: "Nutrition goal", playerOnly: true, options: [
    { v: "gain", label: "Gain weight" }, { v: "lean", label: "Get leaner" },
    { v: "maintain", label: "Maintain and fuel performance" }, { v: "learn", label: "Learn to eat better" },
  ] },
  { id: "diet", type: "single", q: "Any diet preference?", playerOnly: true, options: [
    { v: "none", label: "No restrictions" }, { v: "vegetarian", label: "Vegetarian" }, { v: "vegan", label: "Vegan" }, { v: "dairy-free", label: "Dairy-free" },
  ] },
  { id: "equipment", type: "multi", q: "What do you have access to?", sub: "Pick all that apply.", playerOnly: true, options: [
    { v: "hoop", label: "A hoop" }, { v: "weights", label: "Weights or a gym" }, { v: "partner", label: "A partner or team" },
  ] },
  { id: "daysPerWeek", type: "single", q: "How many days a week can you train?", playerOnly: true, options: [
    { v: 3, label: "3 days" }, { v: 4, label: "4 days" }, { v: 5, label: "5 days" }, { v: 6, label: "6 days" },
  ] },
  { id: "sessionMinutes", type: "single", q: "How long is a session?", playerOnly: true, options: [
    { v: 30, label: "30 minutes" }, { v: 45, label: "45 minutes" }, { v: 60, label: "60 minutes" }, { v: 90, label: "90 minutes" },
  ] },
  { id: "time", type: "single", q: "When do you like to train?", sub: "You can set exact times later.", playerOnly: true, options: [
    { v: "06:00", label: "Early morning", sub: "6:00 AM" }, { v: "15:30", label: "After school", sub: "3:30 PM" },
    { v: "18:00", label: "Evening", sub: "6:00 PM" }, { v: "20:00", label: "Night", sub: "8:00 PM" },
  ] },
  { id: "sleep", type: "single", q: "How much do you usually sleep?", playerOnly: true, options: [
    { v: 5, label: "5 hours or less" }, { v: 6, label: "About 6 hours" }, { v: 7, label: "About 7 hours" }, { v: 8, label: "8 hours or more" },
  ] },
  { id: "obstacle", type: "single", q: "What usually gets in your way?", playerOnly: true, options: [
    { v: "motivation", label: "Staying motivated" }, { v: "time", label: "Finding time" },
    { v: "plan", label: "Not knowing what to work on" }, { v: "injury", label: "Soreness or injuries" },
  ] },
];

// Meals: kcal / protein / carbs / fat per serving; tags for dietary filters
export const MEALS = {
  breakfast: [
    { name: "Egg & Veggie Scramble with Toast", kcal: 520, p: 32, c: 45, f: 22, tags: ["vegetarian"], items: ["4 eggs scrambled with spinach & peppers", "2 slices whole-grain toast", "1 orange"] },
    { name: "Overnight Oats Power Bowl", kcal: 610, p: 30, c: 85, f: 16, tags: ["vegetarian"], items: ["1 cup oats soaked in milk", "1 scoop protein or Greek yogurt", "Banana + berries", "1 tbsp peanut butter"] },
    { name: "Turkey Breakfast Burrito", kcal: 640, p: 42, c: 58, f: 24, tags: [], items: ["Large tortilla", "3 eggs + 3 oz turkey sausage", "Salsa & cheese", "Side of fruit"] },
    { name: "Greek Yogurt Parfait", kcal: 480, p: 34, c: 62, f: 10, tags: ["vegetarian"], items: ["1.5 cups Greek yogurt", "1/2 cup granola", "Mixed berries", "Drizzle of honey"] },
    { name: "Tofu Scramble & Potatoes", kcal: 560, p: 30, c: 60, f: 20, tags: ["vegetarian", "vegan", "dairy-free"], items: ["Firm tofu scrambled with turmeric & veggies", "Roasted breakfast potatoes", "Avocado slices"] },
    { name: "Peanut Butter Banana Protein Shake", kcal: 650, p: 40, c: 75, f: 20, tags: ["vegetarian"], items: ["2 scoops protein", "Banana", "2 tbsp peanut butter", "1 cup oats", "Milk or water"] },
  ],
  lunch: [
    { name: "Grilled Chicken Rice Bowl", kcal: 720, p: 50, c: 85, f: 18, tags: ["dairy-free"], items: ["6 oz grilled chicken", "1.5 cups rice", "Black beans, corn, salsa", "Avocado"] },
    { name: "Turkey & Avocado Wrap", kcal: 610, p: 40, c: 55, f: 24, tags: [], items: ["Whole-wheat wrap", "5 oz sliced turkey", "Avocado, lettuce, tomato", "Apple on the side"] },
    { name: "Salmon Quinoa Salad", kcal: 680, p: 42, c: 55, f: 30, tags: ["dairy-free"], items: ["5 oz salmon", "1 cup quinoa", "Greens, cucumber, cherry tomatoes", "Olive oil & lemon"] },
    { name: "Lentil & Veggie Power Bowl", kcal: 640, p: 30, c: 95, f: 16, tags: ["vegetarian", "vegan", "dairy-free"], items: ["1.5 cups lentils", "Roasted sweet potato", "Kale & tahini dressing"] },
    { name: "Lean Beef Pasta", kcal: 780, p: 48, c: 95, f: 20, tags: [], items: ["2 cups whole-wheat pasta", "5 oz lean ground beef", "Marinara sauce", "Side salad"] },
    { name: "Chickpea Pita Plate", kcal: 620, p: 26, c: 85, f: 20, tags: ["vegetarian"], items: ["2 pitas", "Hummus + falafel", "Cucumber-tomato salad", "Tzatziki"] },
  ],
  dinner: [
    { name: "Chicken Stir-Fry", kcal: 700, p: 52, c: 80, f: 16, tags: ["dairy-free"], items: ["6 oz chicken breast", "Broccoli, peppers, snap peas", "1.5 cups jasmine rice", "Low-sodium soy & ginger"] },
    { name: "Steak, Potatoes & Greens", kcal: 760, p: 50, c: 60, f: 32, tags: ["dairy-free"], items: ["6 oz sirloin", "Roasted potatoes", "Green beans"] },
    { name: "Baked Salmon & Sweet Potato", kcal: 690, p: 44, c: 60, f: 28, tags: ["dairy-free"], items: ["6 oz salmon", "Large sweet potato", "Asparagus"] },
    { name: "Turkey Chili", kcal: 650, p: 48, c: 65, f: 18, tags: ["dairy-free"], items: ["Lean ground turkey", "Kidney & black beans", "Tomatoes, onion, spices", "Cornbread or rice"] },
    { name: "Black Bean Tacos", kcal: 640, p: 26, c: 90, f: 18, tags: ["vegetarian", "vegan", "dairy-free"], items: ["3 corn tortillas", "Seasoned black beans", "Rice, pico, guacamole"] },
    { name: "Shrimp Pasta Primavera", kcal: 720, p: 42, c: 90, f: 18, tags: [], items: ["5 oz shrimp", "2 cups pasta", "Zucchini, tomatoes, garlic", "Parmesan"] },
    { name: "Tofu Teriyaki Bowl", kcal: 660, p: 32, c: 88, f: 20, tags: ["vegetarian", "vegan", "dairy-free"], items: ["Crispy baked tofu", "Brown rice", "Edamame & broccoli", "Teriyaki glaze"] },
  ],
  snack: [
    { name: "PB&J", kcal: 380, p: 14, c: 48, f: 16, tags: ["vegetarian", "vegan", "dairy-free"], items: ["Whole-grain bread", "Peanut butter + jam"] },
    { name: "Chocolate Milk Recovery", kcal: 320, p: 16, c: 50, f: 6, tags: ["vegetarian"], items: ["16 oz low-fat chocolate milk (great post-workout)"] },
    { name: "Trail Mix & Fruit", kcal: 350, p: 10, c: 40, f: 18, tags: ["vegetarian", "vegan", "dairy-free"], items: ["1/3 cup nuts & raisins", "1 banana"] },
    { name: "Cottage Cheese & Pineapple", kcal: 260, p: 26, c: 28, f: 4, tags: ["vegetarian"], items: ["1 cup cottage cheese", "1/2 cup pineapple"] },
    { name: "Rice Cakes & Almond Butter", kcal: 300, p: 9, c: 34, f: 15, tags: ["vegetarian", "vegan", "dairy-free"], items: ["3 rice cakes", "2 tbsp almond butter", "Sliced banana"] },
    { name: "Jerky & Apple", kcal: 250, p: 20, c: 28, f: 4, tags: ["dairy-free"], items: ["2 oz beef or turkey jerky", "1 apple"] },
    { name: "Protein Smoothie", kcal: 340, p: 30, c: 42, f: 5, tags: ["vegetarian"], items: ["1 scoop protein", "Frozen berries", "Milk or water"] },
  ],
};

export const QUOTES = [
  { text: "Hard work beats talent when talent fails to work hard.", by: "Kevin Durant" },
  { text: "The most important thing is to try and inspire people so that they can be great in whatever they want to do.", by: "Kobe Bryant" },
  { text: "I've failed over and over and over again in my life. And that is why I succeed.", by: "Michael Jordan" },
  { text: "You can't be afraid to fail. It's the only way you succeed.", by: "LeBron James" },
  { text: "Excellence is not a singular act but a habit. You are what you repeatedly do.", by: "Shaquille O'Neal" },
  { text: "Success is not an accident. Success is actually a choice.", by: "Stephen Curry" },
  { text: "Everything negative — pressure, challenges — is all an opportunity for me to rise.", by: "Kobe Bryant" },
  { text: "Talent wins games, but teamwork and intelligence win championships.", by: "Michael Jordan" },
  { text: "I don't count my sit-ups. I only start counting when it starts hurting.", by: "Muhammad Ali" },
  { text: "Some people want it to happen, some wish it would happen, others make it happen.", by: "Michael Jordan" },
  { text: "Be humble. Be hungry. And always be the hardest worker in the room.", by: "Dwayne Johnson" },
  { text: "Good, better, best. Never let it rest, until your good is better and your better is best.", by: "Tim Duncan" },
  { text: "The strength of the team is each individual member. The strength of each member is the team.", by: "Phil Jackson" },
  { text: "Nobody is going to hand you anything. Go get it.", by: "Unknown" },
];


export const CHALLENGES = [
  "Make 50 free throws before you leave the gym.",
  "100 weak-hand-only layups today.",
  "Hold a wall sit for 3 total minutes.",
  "Make 10 threes from each corner.",
  "5 minutes of nonstop two-ball dribbling.",
  "100 jump-rope skips without stopping.",
  "Watch 10 minutes of film of a pro at your position.",
  "Make 25 mid-range pull-ups going to your weak side.",
  "Drink your full water target today.",
  "Be in bed on time tonight. Recovery is training.",
  "Do 50 push-ups spread across the day.",
  "Make 7 free throws in a row, 3 times.",
];

// Rank tiers, each with three divisions (III → I), like ranked game modes
export const TIERS = [
  { name: "Bronze", color: "#c27a45" },
  { name: "Silver", color: "#9aa6b2" },
  { name: "Gold", color: "#e2b23c" },
  { name: "Platinum", color: "#3fb8af" },
  { name: "Diamond", color: "#5b8cff" },
  { name: "Elite", color: "#b062ff" },
  { name: "Legend", color: "#ff5a36" },
];

// XP for each task
export const XP = {
  drill: 10,
  workout: 50,
  onTime: 25,
  recovery: 30,
  sleepLog: 10,
  sleepTarget: 15,
  meal: 5,
  allMeals: 20,
  challenge: 25,
  post: 10,
  makes: 1, // per 5 made shots
  stat: 10,
  lesson: 20,
  quiz: 10,
};

export const BADGES = [
  { id: "first", name: "Tip-Off", desc: "Complete your first workout", test: (s) => s.workouts.length >= 1 },
  { id: "five", name: "Starting Five", desc: "Complete 5 workouts", test: (s) => s.workouts.length >= 5 },
  { id: "twenty", name: "Gym Rat", desc: "Complete 20 workouts", test: (s) => s.workouts.length >= 20 },
  { id: "streak3", name: "Three-Peat", desc: "3-day streak", test: (s, x) => x.bestStreak >= 3 },
  { id: "streak7", name: "Week Warrior", desc: "7-day streak", test: (s, x) => x.bestStreak >= 7 },
  { id: "shots500", name: "500 Club", desc: "Make 500 tracked shots", test: (s, x) => x.makes >= 500 },
  { id: "sleep7", name: "Sleep Is Training", desc: "Hit your sleep target 7 nights", test: (s, x) => x.sleepHits >= 7 },
  { id: "kept10", name: "Promise Keeper", desc: "Keep 10 scheduled commitments", test: (s, x) => x.kept >= 10 },
  { id: "recover", name: "Recovery Pro", desc: "Complete 3 active recovery days", test: (s) => s.workouts.filter((w) => w.type === "recovery").length >= 3 },
  { id: "fuel", name: "Fuel Up", desc: "Eat every meal on your plan in a day", test: (s) => Object.values(s.mealsEaten || {}).some((d) => d.length >= 4) },
  { id: "creator", name: "Content Creator", desc: "Share 3 posts or stories", test: (s) => (s.postsMade || 0) >= 3 },
  { id: "student", name: "Student of the Game", desc: "Complete 10 lessons", test: (s) => Object.keys(s.lessonsDone || {}).length >= 10 },
  { id: "mind", name: "Mind Right", desc: "Complete every Mental lesson", test: (s) => ["ft-routine", "next-play", "self-talk", "visualization", "pressure", "goals", "slump", "teammate"].every((id) => (s.lessonsDone || {})[id]) },
  { id: "pro-drills", name: "Pro Routine", desc: "Finish 10 drills from pro or college programs", test: (s, x) => x.proDrills >= 10 },
];

export const METRICS = {
  weight: { label: "Body Weight", unit: "lb", better: "neutral" },
  vertical: { label: "Vertical Jump", unit: "in", better: "up" },
  sprint: { label: "3/4-Court Sprint", unit: "sec", better: "down" },
  lane: { label: "Lane Agility", unit: "sec", better: "down" },
  ft: { label: "Free Throws (of 20)", unit: "made", better: "up" },
};
