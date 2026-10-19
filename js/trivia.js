// Basketball trivia for the wake-up challenge. Each question: q, options (correct answer first;
// the alarm shuffles them), and an optional league note where rules differ between leagues.
// Easy = basic rules and terms; medium = timing, distances and game IQ; hard = history and fine print.

export const TRIVIA_LEVELS = { easy: "Easy", medium: "Medium", hard: "Hard", mixed: "Mixed" };
export const TRIVIA_COUNTS = [1, 2, 3, 5];

export const TRIVIA = {
  easy: [
    { q: "How many points is a made shot from behind the three-point line?", options: ["3", "2", "4", "1"] },
    { q: "How many players does each team have on the court at once?", options: ["5", "6", "4", "7"] },
    { q: "How many points is one made free throw worth?", options: ["1", "2", "3", "0.5"] },
    { q: "Taking too many steps without dribbling is called…", options: ["Traveling", "Carrying", "Goaltending", "A charge"] },
    { q: "Dribbling with both hands at once, or stopping and starting your dribble again, is a…", options: ["Double dribble", "Travel", "Backcourt violation", "Jump ball"] },
    { q: "How high is the rim off the floor?", options: ["10 feet", "9 feet", "11 feet", "12 feet"] },
    { q: "A shot that drops through without touching the rim or backboard is called a…", options: ["Swish", "Bank shot", "Putback", "Floater"] },
    { q: "Which position usually brings the ball up the court and runs the offense?", options: ["Point guard", "Center", "Power forward", "Small forward"] },
    { q: "Grabbing the ball after a missed shot is called a…", options: ["Rebound", "Steal", "Assist", "Block"] },
    { q: "A pass that leads directly to a made basket counts as an…", options: ["Assist", "Rebound", "Turnover", "Outlet"] },
    { q: "In the NBA, how many personal fouls does it take to foul out?", options: ["6", "5", "4", "7"] },
    { q: "\"And-one\" means a player…", options: ["Was fouled on a made shot and gets a free throw", "Made two shots in a row", "Got one extra possession", "Has one foul left"] },
    { q: "How long is an NBA quarter?", options: ["12 minutes", "10 minutes", "15 minutes", "20 minutes"] },
    { q: "How does an NBA game start?", options: ["A jump ball at center court", "A coin flip", "A free throw", "The home team inbounds"] },
    { q: "Taking the ball away from the other team is called a…", options: ["Steal", "Block", "Screen", "Charge"] },
    { q: "Hitting a shot off the backboard and into the hoop is a…", options: ["Bank shot", "Swish", "Alley-oop", "Hook shot"] },
    { q: "A pass thrown near the rim that a teammate catches in the air and scores is an…", options: ["Alley-oop", "Outlet pass", "Bounce pass", "Skip pass"] },
    { q: "Losing the ball to the other team without a shot is a…", options: ["Turnover", "Rebound", "Timeout", "Free throw"] },
    { q: "Where do players stand to shoot free throws?", options: ["The free-throw line", "The three-point line", "Half court", "The baseline"] },
    { q: "Standing still to block a player's path for a teammate is called setting a…", options: ["Screen", "Charge", "Zone", "Press"] },
  ],
  medium: [
    { q: "How long is the NBA shot clock?", options: ["24 seconds", "30 seconds", "35 seconds", "20 seconds"] },
    { q: "How long is the shot clock in NCAA men's basketball?", options: ["30 seconds", "24 seconds", "35 seconds", "45 seconds"] },
    { q: "How far is the free-throw line from the backboard?", options: ["15 feet", "12 feet", "18 feet", "20 feet"] },
    { q: "In the NBA, how long can an offensive player stay in the lane?", options: ["3 seconds", "5 seconds", "8 seconds", "10 seconds"] },
    { q: "In the NBA, how long does a team have to get the ball past half court?", options: ["8 seconds", "10 seconds", "5 seconds", "12 seconds"] },
    { q: "How far is the NBA three-point line at the top of the arc?", options: ["23 feet 9 inches", "22 feet", "20 feet 9 inches", "25 feet"] },
    { q: "How far is the NBA three-point line in the corners?", options: ["22 feet", "23 feet 9 inches", "20 feet", "21 feet 6 inches"] },
    { q: "A triple-double means double digits in how many stat categories?", options: ["Three", "Two", "Four", "Five"] },
    { q: "How long is an NBA overtime period?", options: ["5 minutes", "3 minutes", "10 minutes", "12 minutes"] },
    { q: "A defense where each player guards an area instead of a person is called…", options: ["Zone defense", "Man-to-man", "Box and one", "Switching"] },
    { q: "In a pick-and-roll, what does the screener do after setting the screen?", options: ["Rolls to the basket", "Runs to the corner", "Stays at half court", "Calls a timeout"] },
    { q: "Bringing the ball back over half court after crossing it is called a…", options: ["Backcourt violation", "Travel", "Three-second violation", "Carry"] },
    { q: "Blocking a shot after it has started coming down toward the rim is…", options: ["Goaltending", "A clean block", "A charge", "A jump ball"] },
    { q: "How long does a player have to inbound the ball?", options: ["5 seconds", "3 seconds", "8 seconds", "10 seconds"] },
    { q: "How long is an NBA court?", options: ["94 feet", "84 feet", "100 feet", "90 feet"] },
    { q: "How wide is an NBA court?", options: ["50 feet", "45 feet", "60 feet", "55 feet"] },
    { q: "How long is each half in NCAA men's basketball?", options: ["20 minutes", "16 minutes", "24 minutes", "12 minutes"] },
    { q: "How long is a quarter in FIBA (international) basketball?", options: ["10 minutes", "12 minutes", "8 minutes", "15 minutes"] },
    { q: "When a defender is set and an offensive player runs into them, it's called a…", options: ["Charge", "Block", "Reach-in", "Hand check"] },
    { q: "A pass from one side of the floor all the way to the other wing is a…", options: ["Skip pass", "Entry pass", "Handoff", "Outlet pass"] },
  ],
  hard: [
    { q: "In what year was basketball invented?", options: ["1891", "1901", "1876", "1915"] },
    { q: "What did the very first games use as hoops?", options: ["Peach baskets", "Metal buckets", "Barrel hoops", "Fishing nets"] },
    { q: "What is the radius of the NBA's restricted-area arc?", options: ["4 feet", "3 feet", "6 feet", "5 feet"] },
    { q: "How wide is the NBA lane (the paint)?", options: ["16 feet", "12 feet", "14 feet", "18 feet"] },
    { q: "In which season did the NBA add the three-point line?", options: ["1979–80", "1967–68", "1984–85", "1991–92"] },
    { q: "In which season did NCAA basketball adopt the three-point line nationwide?", options: ["1986–87", "1979–80", "1990–91", "1975–76"] },
    { q: "In which season did the NBA introduce the 24-second shot clock?", options: ["1954–55", "1946–47", "1962–63", "1970–71"] },
    { q: "How far is the FIBA three-point line at the top of the arc?", options: ["6.75 meters", "6.25 meters", "7.24 meters", "7.00 meters"] },
    { q: "In the NBA, after an offensive rebound off the rim, the shot clock resets to…", options: ["14 seconds", "24 seconds", "10 seconds", "20 seconds"] },
    { q: "Since 2015, NCAA women's games are played in…", options: ["Four 10-minute quarters", "Two 20-minute halves", "Four 12-minute quarters", "Two 16-minute halves"] },
    { q: "What is the circumference of a men's (size 7) basketball?", options: ["29.5 inches", "28.5 inches", "30.5 inches", "27 inches"] },
    { q: "How wide is a regulation backboard?", options: ["6 feet", "5 feet", "7 feet", "4 feet"] },
    { q: "In an NBA quarter, the opponent shoots free throws on every foul starting with the…", options: ["5th team foul", "4th team foul", "6th team foul", "7th team foul"] },
    { q: "\"BLOB\" in a playbook stands for…", options: ["Baseline out of bounds", "Back line offense break", "Ball low on block", "Big lineup on ball"] },
    { q: "The \"Horns\" set starts with two players at the…", options: ["Elbows", "Corners", "Blocks", "Wings"] },
    { q: "Which league calls defensive three seconds?", options: ["NBA", "NCAA men's", "FIBA", "High school (NFHS)"] },
    { q: "A Euro step is…", options: ["Two steps in different directions after picking up the dribble", "A step-back three", "A spin move into a fadeaway", "A hop step straight up"] },
    { q: "How long is a high school (NFHS) quarter?", options: ["8 minutes", "10 minutes", "12 minutes", "6 minutes"] },
    { q: "From the 2019–20 season, the NCAA men's three-point line moved to…", options: ["22 feet 1¾ inches", "20 feet 9 inches", "23 feet 9 inches", "21 feet"] },
    { q: "In the NBA, a coach's challenge can be used how many times per game if the first one is successful?", options: ["Twice", "Once", "Three times", "Unlimited"] },
  ],
};

// Draw one question for a level ("mixed" picks a random difficulty each time), avoiding any in `seen`.
export function drawTrivia(level, seen = new Set(), rand = Math.random) {
  const tier = level === "mixed" ? ["easy", "medium", "hard"][Math.floor(rand() * 3)] : level in TRIVIA ? level : "medium";
  let pool = TRIVIA[tier].filter((t) => !seen.has(t.q));
  if (!pool.length) pool = TRIVIA[tier];
  const t = pool[Math.floor(rand() * pool.length)];
  seen.add(t.q);
  // shuffle the options and remember where the right one landed
  const order = t.options.map((_, i) => i).sort(() => rand() - 0.5);
  return { q: t.q, options: order.map((i) => t.options[i]), answer: order.indexOf(0), level: tier };
}
