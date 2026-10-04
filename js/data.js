// Static content: drills, meals, quotes, badges.

export const CATEGORIES = {
  handles: { label: "Ball Handling", icon: "🏀" },
  shooting: { label: "Shooting", icon: "🎯" },
  footwork: { label: "Footwork", icon: "👟" },
  strength: { label: "Strength", icon: "💪" },
  vertical: { label: "Vertical", icon: "🚀" },
  conditioning: { label: "Conditioning", icon: "🫀" },
  mobility: { label: "Mobility", icon: "🧘" },
};

// minutes = time block; level = min level (1 beginner, 2 intermediate, 3 advanced)
// positions: which positions benefit most (empty = everyone)
export const DRILLS = [
  // Ball handling
  { id: "pound", cat: "handles", name: "Stationary Pound Dribbles", minutes: 4, level: 1, positions: [], how: "30s each hand: hard low pounds, then waist-high, then shoulder-high. Eyes up the whole time." },
  { id: "figure8", cat: "handles", name: "Figure-8 Dribble", minutes: 3, level: 1, positions: [], how: "Dribble through and around your legs in a figure-8. Stay low, 3 x 45s with 15s rest." },
  { id: "crossover-series", cat: "handles", name: "Crossover Series", minutes: 5, level: 1, positions: ["PG", "SG", "SF"], how: "Crossover, between-the-legs, behind-the-back: 10 reps each move, both directions, at game speed." },
  { id: "two-ball", cat: "handles", name: "Two-Ball Dribbling", minutes: 6, level: 2, positions: ["PG", "SG"], how: "Two balls: together, alternating, then high-low. 45s each pattern. Fight to keep both alive." },
  { id: "cone-attack", cat: "handles", name: "Cone Attack Combos", minutes: 6, level: 2, positions: ["PG", "SG", "SF"], how: "Set 5 cones 6 ft apart. Hit a different combo move at each cone and finish with a layup. 8 trips." },
  { id: "tennis-ball", cat: "handles", name: "Tennis Ball Toss Dribble", minutes: 5, level: 3, positions: ["PG", "SG"], how: "Dribble with one hand while tossing and catching a tennis ball with the other. Switch hands every 30s." },

  // Shooting
  { id: "form", cat: "shooting", name: "Form Shooting", minutes: 5, level: 1, positions: [], how: "Start 3 ft from the rim. One hand, 10 makes per spot at 5 spots, stepping back a foot each round. Perfect follow-through." },
  { id: "free-throws", cat: "shooting", name: "Free Throw Ladder", minutes: 5, level: 1, positions: [], how: "Shoot 2 free throws between every other drill or set. Log makes out of 20 total." },
  { id: "spot-up", cat: "shooting", name: "5-Spot Spot-Up", minutes: 8, level: 1, positions: ["SG", "SF", "PF"], how: "Corners, wings, top. 10 shots per spot from mid-range or three. Track makes." },
  { id: "off-dribble", cat: "shooting", name: "Off-the-Dribble Pull-Ups", minutes: 8, level: 2, positions: ["PG", "SG", "SF"], how: "One-dribble and two-dribble pull-ups going left and right from the elbows and wings. 40 shots." },
  { id: "catch-shoot-sprint", cat: "shooting", name: "Sprint & Catch-and-Shoot", minutes: 8, level: 2, positions: ["SG", "SF"], how: "Sprint baseline to wing, catch (or self-pass) and shoot. Alternate sides. 30 shots at game speed." },
  { id: "post-hooks", cat: "shooting", name: "Mikan Drill + Hooks", minutes: 6, level: 1, positions: ["PF", "C"], how: "Mikan drill 60s, then jump hooks from both blocks: 10 makes each side." },
  { id: "game-shots", cat: "shooting", name: "Game-Speed Shot Circuit", minutes: 10, level: 3, positions: [], how: "Ten spots, one shot each, sprint between spots. 5 rounds. Shoot under fatigue like late in a game." },

  // Footwork
  { id: "jab-series", cat: "footwork", name: "Triple Threat Jab Series", minutes: 5, level: 1, positions: ["SG", "SF", "PF"], how: "From triple threat: jab and shoot, jab and drive, jab-crossover. 10 reps each, both pivot feet." },
  { id: "drop-step", cat: "footwork", name: "Drop Steps & Up-and-Unders", minutes: 6, level: 1, positions: ["PF", "C"], how: "Catch on the block, drop step baseline and middle, then up-and-under. 8 each side." },
  { id: "euro", cat: "footwork", name: "Euro Step & Pro Hop Finishes", minutes: 6, level: 2, positions: ["PG", "SG", "SF"], how: "From the wing: euro step, pro hop, and reverse layups. 6 makes each, both hands." },
  { id: "ladder", cat: "footwork", name: "Agility Ladder", minutes: 5, level: 1, positions: [], how: "In-in-out-out, lateral shuffles, icky shuffle. 3 trips each, quick light feet." },
  { id: "defensive-slides", cat: "footwork", name: "Defensive Slide Drill", minutes: 5, level: 1, positions: [], how: "Slide lane line to lane line for 30s, rest 30s, 5 rounds. Stay low, don't click your heels." },

  // Strength
  { id: "goblet-squat", cat: "strength", name: "Goblet Squats", minutes: 6, level: 1, positions: [], how: "4 x 10. Hold a dumbbell at your chest, sit between your heels, drive up through the whole foot." },
  { id: "split-squat", cat: "strength", name: "Bulgarian Split Squats", minutes: 7, level: 2, positions: [], how: "3 x 8 each leg, rear foot on a bench. Builds single-leg strength for jumping and cutting." },
  { id: "rdl", cat: "strength", name: "Romanian Deadlifts", minutes: 6, level: 2, positions: [], how: "4 x 8. Soft knees, push hips back, flat back. Hamstrings protect your knees on landings." },
  { id: "pushups", cat: "strength", name: "Push-Up Variations", minutes: 5, level: 1, positions: [], how: "3 rounds: 10 regular, 8 wide, 6 close-grip. Rest 45s between rounds." },
  { id: "core", cat: "strength", name: "Core Circuit", minutes: 6, level: 1, positions: [], how: "Plank 45s, side plank 30s each side, dead bugs x 12, hollow hold 30s. 2 rounds." },
  { id: "pullups", cat: "strength", name: "Pull-Ups / Inverted Rows", minutes: 5, level: 1, positions: ["PF", "C"], how: "4 sets to 1-2 reps short of failure. Upper-back strength for rebounding and boxing out." },
  { id: "calf-raises", cat: "strength", name: "Single-Leg Calf Raises", minutes: 4, level: 1, positions: [], how: "3 x 15 each leg off a step, 2s pause at the top. Strong calves help your ankles and your bounce." },

  // Vertical
  { id: "box-jumps", cat: "vertical", name: "Box Jumps", minutes: 5, level: 1, positions: [], how: "5 x 4. Max effort jump, land softly, step down. Full rest between sets: quality over quantity." },
  { id: "approach-jumps", cat: "vertical", name: "Approach Jumps", minutes: 5, level: 1, positions: [], how: "3-step approach, jump to touch as high as you can. 3 x 5 off two feet, 3 x 5 off one foot." },
  { id: "depth-jumps", cat: "vertical", name: "Depth Jumps", minutes: 5, level: 3, positions: [], how: "Step off a 12-18 in box, land and jump instantly. 4 x 4. Minimal ground contact." },
  { id: "pogo", cat: "vertical", name: "Pogo Hops", minutes: 3, level: 1, positions: [], how: "Stiff ankles, quick bounces off the balls of your feet. 3 x 20s." },
  { id: "broad-jumps", cat: "vertical", name: "Broad Jumps", minutes: 4, level: 1, positions: [], how: "4 x 3. Swing the arms, explode forward, stick the landing for 2 seconds." },
  { id: "tip-drill", cat: "vertical", name: "Rim Tip Drill", minutes: 4, level: 2, positions: ["PF", "C"], how: "Tip the ball off the backboard continuously for 30s, 4 rounds. Second-jump quickness." },

  // Conditioning
  { id: "suicides", cat: "conditioning", name: "Suicide Sprints", minutes: 6, level: 1, positions: [], how: "Free throw line, half court, far free throw line, baseline. 6 reps, rest 45s each." },
  { id: "17s", cat: "conditioning", name: "Sideline 17s", minutes: 6, level: 2, positions: [], how: "Sideline to sideline 17 times in under 60s. Rest 90s. 3-4 reps." },
  { id: "full-court-layups", cat: "conditioning", name: "Full-Court Layups", minutes: 5, level: 1, positions: [], how: "Speed-dribble the length of the court, layup, sprint back the other way. 2 minutes on, 1 off, x 3." },
  { id: "intervals", cat: "conditioning", name: "Court Intervals", minutes: 8, level: 2, positions: [], how: "20s all-out sprint, 40s jog. 8 rounds. Matches the stop-and-go of a real game." },
  { id: "jump-rope", cat: "conditioning", name: "Jump Rope", minutes: 5, level: 1, positions: [], how: "5 x 60s with 20s rest. Mix two-foot, alternating, and double-unders." },

  // Mobility
  { id: "warmup", cat: "mobility", name: "Dynamic Warm-Up", minutes: 6, level: 1, positions: [], how: "High knees, butt kicks, carioca, walking lunges, leg swings, arm circles. Down and back for each." },
  { id: "hip-mobility", cat: "mobility", name: "Hip Mobility Flow", minutes: 5, level: 1, positions: [], how: "90/90 switches, world's greatest stretch, deep squat hold. Hips loose = better first step." },
  { id: "ankle-mobility", cat: "mobility", name: "Ankle Mobility", minutes: 4, level: 1, positions: [], how: "Knee-to-wall ankle stretches 2 x 10 each, banded ankle distractions, toe raises." },
  { id: "cooldown", cat: "mobility", name: "Cool-Down Stretch", minutes: 5, level: 1, positions: [], how: "Hamstrings, quads, hip flexors, calves, shoulders. Hold each 30s and breathe slow." },
];

// Workout templates: the categories to fill, in order, after warm-up.
export const FOCUSES = {
  skills: { label: "Skill Day", desc: "Handles, shooting and footwork", blocks: ["handles", "shooting", "footwork", "shooting"] },
  athletic: { label: "Athletic Day", desc: "Strength and vertical", blocks: ["vertical", "strength", "strength", "vertical", "strength"] },
  conditioning: { label: "Game Shape", desc: "Conditioning with skills under fatigue", blocks: ["conditioning", "shooting", "handles", "conditioning"] },
  shooter: { label: "Shooter's Session", desc: "Volume shooting, all game spots", blocks: ["shooting", "footwork", "shooting", "shooting"] },
  recovery: { label: "Recovery Day", desc: "Light skill work and mobility", blocks: ["mobility", "shooting", "mobility"] },
};

// Weekly rotation by day of week (0 = Sunday)
export const WEEK_PLAN = ["recovery", "skills", "athletic", "conditioning", "skills", "athletic", "shooter"];

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

export const BADGES = [
  { id: "first", icon: "🏁", name: "Tip-Off", desc: "Complete your first workout", test: (s) => s.workouts.length >= 1 },
  { id: "five", icon: "🖐️", name: "Starting Five", desc: "Complete 5 workouts", test: (s) => s.workouts.length >= 5 },
  { id: "twenty", icon: "🔥", name: "Gym Rat", desc: "Complete 20 workouts", test: (s) => s.workouts.length >= 20 },
  { id: "fifty", icon: "🏆", name: "Hall of Grind", desc: "Complete 50 workouts", test: (s) => s.workouts.length >= 50 },
  { id: "streak3", icon: "📆", name: "Three-Peat", desc: "3-day workout streak", test: (s, x) => x.bestStreak >= 3 },
  { id: "streak7", icon: "⚡", name: "Week Warrior", desc: "7-day workout streak", test: (s, x) => x.bestStreak >= 7 },
  { id: "hours5", icon: "⏱️", name: "Five Hours Deep", desc: "Train 300 total minutes", test: (s, x) => x.totalMinutes >= 300 },
  { id: "logger", icon: "📈", name: "Stat Sheet", desc: "Log 5 progress entries", test: (s) => s.stats.length >= 5 },
  { id: "meal", icon: "🥗", name: "Fuel Up", desc: "Check off every meal in a day", test: (s) => Object.values(s.mealsEaten || {}).some((d) => d.length >= 4) },
  { id: "allround", icon: "🌟", name: "All-Around", desc: "Train every workout focus", test: (s) => new Set(s.workouts.map((w) => w.focus)).size >= 5 },
];

// Progress metrics a player can log
export const METRICS = {
  weight: { label: "Body Weight", unit: "lb", better: "neutral" },
  vertical: { label: "Vertical Jump", unit: "in", better: "up" },
  sprint: { label: "3/4 Court Sprint", unit: "sec", better: "down" },
  ft: { label: "Free Throws (of 20)", unit: "made", better: "up" },
  threes: { label: "Threes (of 25)", unit: "made", better: "up" },
};
