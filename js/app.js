import { CATEGORIES, DRILLS, FOCUSES, WEEK_PLAN, MEALS, QUOTES, BADGES, METRICS } from "./data.js";

// ---------- State ----------

const STORAGE_KEY = "courtside:v1";

const defaultState = () => ({
  profile: null,
  workouts: [], // { date, focus, minutes, drills: [ids], ts }
  stats: [], // { date, metric, value }
  session: null, // { date, focus, seed, drills: [ids], done: [ids] }
  mealPlans: {}, // date -> { seed, meals: [{ slot, name }] }
  mealsEaten: {}, // date -> [index]
  badges: [], // earned badge ids
  challengesDone: [], // dates
});

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {}
  return defaultState();
}

let state = load();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ---------- Helpers ----------

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + n));
}

function prettyDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Small seeded PRNG so a day's plan is stable until the user reshuffles it
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => el.classList.add("out"), 2600);
  setTimeout(() => el.remove(), 3000);
}

// ---------- Derived stats ----------

function workoutDays() {
  return new Set(state.workouts.map((w) => w.date));
}

function streaks() {
  const days = workoutDays();
  const today = dateKey();
  // Current streak counts today or, if not trained yet today, from yesterday
  let cur = 0;
  let k = days.has(today) ? today : addDays(today, -1);
  while (days.has(k)) {
    cur++;
    k = addDays(k, -1);
  }
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of [...days].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current: cur, best };
}

function extras() {
  const { current, best } = streaks();
  return {
    streak: current,
    bestStreak: best,
    totalMinutes: state.workouts.reduce((n, w) => n + w.minutes, 0),
  };
}

function xp() {
  const mins = state.workouts.reduce((n, w) => n + w.minutes, 0);
  const meals = Object.values(state.mealsEaten).reduce((n, d) => n + d.length, 0);
  return mins * 2 + state.stats.length * 15 + meals * 5 + state.badges.length * 50 + state.challengesDone.length * 25;
}

const RANKS = ["Rookie", "Practice Squad", "Bench Spark", "Rotation Player", "Sixth Man", "Starter", "All-Star", "All-NBA", "MVP", "Legend"];

function rankInfo() {
  const total = xp();
  const level = Math.floor(Math.sqrt(total / 60)) + 1;
  const floor = (level - 1) ** 2 * 60;
  const next = level ** 2 * 60;
  return {
    xp: total,
    level,
    title: RANKS[Math.min(level - 1, RANKS.length - 1)],
    pct: Math.round(((total - floor) / (next - floor)) * 100),
    toNext: next - total,
  };
}

function checkBadges() {
  const x = extras();
  for (const b of BADGES) {
    if (!state.badges.includes(b.id) && b.test(state, x)) {
      state.badges.push(b.id);
      toast(`${b.icon} Badge unlocked: ${b.name}!`);
    }
  }
  save();
}

// ---------- Workouts ----------

function todaysFocus() {
  return WEEK_PLAN[new Date().getDay()];
}

function buildWorkout(focus, seed) {
  const p = state.profile;
  const rand = rng(seed);
  const level = p.level;
  const fits = (d) => d.level <= level;
  const byPos = (d) => d.positions.length === 0 || d.positions.includes(p.position);
  const chosen = [];
  const take = (cat) => {
    let pool = DRILLS.filter((d) => d.cat === cat && fits(d) && !chosen.includes(d.id));
    const preferred = pool.filter(byPos);
    if (preferred.length && rand() < 0.75) pool = preferred;
    if (pool.length) chosen.push(pick(pool, rand).id);
  };

  chosen.push(focus === "recovery" ? "hip-mobility" : "warmup");
  for (const cat of FOCUSES[focus].blocks) take(cat);

  // Pad to roughly the player's preferred session length
  const target = p.sessionMinutes;
  const minutes = () => chosen.reduce((n, id) => n + drill(id).minutes, 0);
  const extraCats = FOCUSES[focus].blocks;
  let guard = 0;
  while (minutes() < target - 6 && guard++ < 20) take(pick(extraCats, rand));
  if (!chosen.includes("free-throws") && focus !== "athletic") chosen.push("free-throws");
  chosen.push("cooldown");
  return chosen;
}

function drill(id) {
  return DRILLS.find((d) => d.id === id);
}

function ensureSession() {
  const today = dateKey();
  if (!state.session || state.session.date !== today) {
    const focus = todaysFocus();
    const seed = hashString(today + focus);
    state.session = { date: today, focus, seed, drills: buildWorkout(focus, seed), done: [] };
    save();
  }
  return state.session;
}

function regenerateSession(focus) {
  const s = ensureSession();
  const seed = (s.seed + 7919) >>> 0;
  state.session = { date: s.date, focus, seed, drills: buildWorkout(focus, seed), done: [] };
  save();
}

function finishSession() {
  const s = state.session;
  const done = s.drills.filter((id) => s.done.includes(id));
  if (!done.length) {
    toast("Check off at least one drill first.");
    return;
  }
  const minutes = done.reduce((n, id) => n + drill(id).minutes, 0);
  state.workouts.push({ date: s.date, focus: s.focus, minutes, drills: done, ts: Date.now() });
  s.finished = true;
  save();
  const { current } = streaks();
  toast(`💥 Workout logged: ${minutes} min. Streak: ${current} day${current === 1 ? "" : "s"}!`);
  checkBadges();
  render();
}

// ---------- Nutrition ----------

function nutritionTargets() {
  const p = state.profile;
  const kg = p.weightLb * 0.4536;
  const cm = p.heightIn * 2.54;
  const bmr = 10 * kg + 6.25 * cm - 5 * p.age + (p.sex === "female" ? -161 : 5);
  // Athletes training most days sit around "very active"
  const activity = 1.45 + Math.min(p.daysPerWeek, 7) * 0.05;
  const goalAdj = { gain: 400, maintain: 0, lean: -350 }[p.goal];
  const kcal = Math.round((bmr * activity + goalAdj) / 10) * 10;
  const protein = Math.round(p.weightLb * (p.goal === "maintain" ? 0.8 : 0.9));
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const waterOz = Math.round(p.weightLb / 2 + 24);
  return { kcal, protein, carbs, fat, waterOz };
}

function mealPool(slot) {
  const diet = state.profile.diet;
  const pool = MEALS[slot].filter((m) => diet === "none" || m.tags.includes(diet));
  return pool.length ? pool : MEALS[slot];
}

function buildMealPlan(seed) {
  const t = nutritionTargets();
  const rand = rng(seed);
  let best = null;
  for (let i = 0; i < 300; i++) {
    const plan = [
      { slot: "breakfast", meal: pick(mealPool("breakfast"), rand) },
      { slot: "lunch", meal: pick(mealPool("lunch"), rand) },
      { slot: "dinner", meal: pick(mealPool("dinner"), rand) },
    ];
    const snacks = mealPool("snack");
    const nSnacks = 1 + Math.floor(rand() * 3);
    const used = new Set();
    for (let j = 0; j < nSnacks; j++) {
      const s = pick(snacks, rand);
      if (used.has(s.name)) continue;
      used.add(s.name);
      plan.push({ slot: "snack", meal: s });
    }
    const kcal = plan.reduce((n, x) => n + x.meal.kcal, 0);
    const p = plan.reduce((n, x) => n + x.meal.p, 0);
    const score = Math.abs(kcal - t.kcal) + Math.max(0, t.protein - p) * 6;
    if (!best || score < best.score) best = { score, plan };
  }
  // Big targets can outrun the meal library, so scale main-meal portions to close the gap
  const kcal = best.plan.reduce((n, x) => n + x.meal.kcal, 0);
  const mainKcal = best.plan.filter((x) => x.slot !== "snack").reduce((n, x) => n + x.meal.kcal, 0);
  const raw = 1 + (t.kcal - kcal) / mainKcal;
  const servings = Math.min(1.75, Math.max(0.75, Math.round(raw * 4) / 4));
  return best.plan.map((x) => ({ slot: x.slot, name: x.meal.name, servings: x.slot === "snack" ? 1 : servings }));
}

// A plan entry's meal with macros scaled to its servings
function planMeal(entry) {
  const m = MEALS[entry.slot].find((x) => x.name === entry.name);
  const k = entry.servings || 1;
  return { ...m, servings: k, kcal: Math.round(m.kcal * k), p: Math.round(m.p * k), c: Math.round(m.c * k), f: Math.round(m.f * k) };
}

function ensureMealPlan(key = dateKey()) {
  if (!state.mealPlans[key]) {
    const seed = hashString("meals" + key);
    state.mealPlans[key] = { seed, meals: buildMealPlan(seed) };
    save();
  }
  return state.mealPlans[key];
}

// ---------- Motivation ----------

function quoteOfTheDay() {
  return QUOTES[hashString(dateKey()) % QUOTES.length];
}

const CHALLENGES = [
  "Make 50 free throws before you leave the gym.",
  "100 weak-hand-only layups today.",
  "Hold a wall sit for 3 total minutes.",
  "Make 10 threes from each corner.",
  "5 minutes of nonstop two-ball dribbling.",
  "100 jump-rope skips without stopping.",
  "Watch 10 minutes of film of your favorite player at your position.",
  "Make 25 mid-range pull-ups going to your weak side.",
  "Drink your full water target today.",
  "Get 8+ hours of sleep tonight. Recovery is training.",
  "Do 50 push-ups spread across the day.",
  "Make 7 free throws in a row — 3 times.",
];

function challengeOfTheDay() {
  return CHALLENGES[hashString("c" + dateKey()) % CHALLENGES.length];
}

function coachMessage() {
  const days = workoutDays();
  const today = dateKey();
  const name = state.profile.name.split(" ")[0];
  if (days.has(today)) return `Work's in for today, ${name}. Fuel up and recover — tomorrow we go again.`;
  const last = [...days].sort().pop();
  if (!last) return `Welcome, ${name}. Every great player started with day one. Let's make it today.`;
  let gap = 0;
  for (let k = today; k !== last && gap < 60; k = addDays(k, -1)) gap++;
  if (gap >= 4) return `${gap} days off, ${name}. No guilt — just lace up. Even a 20-minute session counts.`;
  const { current } = streaks();
  if (current >= 3) return `${current}-day streak! Don't break the chain, ${name}.`;
  return `Your ${FOCUSES[todaysFocus()].label.toLowerCase()} is ready, ${name}. Someone else is working right now.`;
}

// ---------- Views ----------

function viewOnboarding() {
  const p = state.profile || {};
  const opt = (val, label, cur) => `<option value="${val}" ${String(cur) === String(val) ? "selected" : ""}>${label}</option>`;
  return `
  <section class="onboard card">
    <div class="hero-ball">🏀</div>
    <h1>${state.profile ? "Edit profile" : "Welcome to Courtside"}</h1>
    <p class="muted">${state.profile ? "Update your info and your plans will adjust." : "Tell us about your game and we'll build your workouts and meal plans."}</p>
    <form id="profile-form" class="form">
      <label>Name<input name="name" required maxlength="40" value="${esc(p.name || "")}" placeholder="Your name"></label>
      <div class="row">
        <label>Age<input name="age" type="number" min="10" max="60" required value="${p.age || ""}"></label>
        <label>Sex<select name="sex">${opt("male", "Male", p.sex)}${opt("female", "Female", p.sex)}</select></label>
      </div>
      <div class="row">
        <label>Height (in)<input name="heightIn" type="number" min="48" max="96" required value="${p.heightIn || ""}" placeholder="e.g. 72"></label>
        <label>Weight (lb)<input name="weightLb" type="number" min="70" max="400" required value="${p.weightLb || ""}"></label>
      </div>
      <div class="row">
        <label>Position<select name="position">
          ${opt("PG", "Point Guard", p.position)}${opt("SG", "Shooting Guard", p.position)}${opt("SF", "Small Forward", p.position)}${opt("PF", "Power Forward", p.position)}${opt("C", "Center", p.position)}
        </select></label>
        <label>Level<select name="level">
          ${opt(1, "Beginner", p.level)}${opt(2, "Intermediate", p.level)}${opt(3, "Advanced", p.level)}
        </select></label>
      </div>
      <div class="row">
        <label>Goal<select name="goal">
          ${opt("gain", "Build muscle", p.goal)}${opt("maintain", "Maintain", p.goal)}${opt("lean", "Get leaner", p.goal)}
        </select></label>
        <label>Diet<select name="diet">
          ${opt("none", "No restrictions", p.diet)}${opt("vegetarian", "Vegetarian", p.diet)}${opt("vegan", "Vegan", p.diet)}${opt("dairy-free", "Dairy-free", p.diet)}
        </select></label>
      </div>
      <div class="row">
        <label>Training days / week<input name="daysPerWeek" type="number" min="1" max="7" required value="${p.daysPerWeek || 5}"></label>
        <label>Session length (min)<select name="sessionMinutes">
          ${opt(30, "30", p.sessionMinutes)}${opt(45, "45", p.sessionMinutes || 45)}${opt(60, "60", p.sessionMinutes)}${opt(90, "90", p.sessionMinutes)}
        </select></label>
      </div>
      <button class="btn primary big" type="submit">${state.profile ? "Save" : "Let's hoop"}</button>
      ${state.profile ? `<button class="btn ghost" type="button" data-action="reset">Reset all data</button>` : ""}
    </form>
  </section>`;
}

function viewHome() {
  const r = rankInfo();
  const { current, best } = streaks();
  const q = quoteOfTheDay();
  const s = ensureSession();
  const t = nutritionTargets();
  const plan = ensureMealPlan();
  const eaten = state.mealsEaten[dateKey()] || [];
  const kcalEaten = plan.meals.reduce((n, m, i) => n + (eaten.includes(i) ? planMeal(m).kcal : 0), 0);
  const trainedToday = workoutDays().has(dateKey());
  const challengeDone = state.challengesDone.includes(dateKey());

  return `
  <section class="greeting">
    <div>
      <p class="muted small">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
      <h1>Let's work, ${esc(state.profile.name.split(" ")[0])}.</h1>
    </div>
    <div class="streak ${current ? "on" : ""}" title="Best: ${best}">🔥<span>${current}</span></div>
  </section>

  <section class="card coach">
    <p>${esc(coachMessage())}</p>
  </section>

  <section class="card rank">
    <div class="rank-top">
      <div><span class="lvl">LVL ${r.level}</span> <strong>${r.title}</strong></div>
      <span class="muted small">${r.xp} XP · ${r.toNext} to next</span>
    </div>
    <div class="bar"><div style="width:${r.pct}%"></div></div>
  </section>

  <div class="grid2">
    <a class="card tile" href="#train">
      <span class="tile-icon">${trainedToday ? "✅" : "🏋️"}</span>
      <strong>${FOCUSES[s.focus].label}</strong>
      <span class="muted small">${trainedToday ? "Done today" : `${s.drills.reduce((n, id) => n + drill(id).minutes, 0)} min · ${s.drills.length} drills`}</span>
    </a>
    <a class="card tile" href="#fuel">
      <span class="tile-icon">🍽️</span>
      <strong>${kcalEaten} / ${t.kcal}</strong>
      <span class="muted small">calories today</span>
    </a>
  </div>

  <section class="card challenge ${challengeDone ? "done" : ""}">
    <div>
      <p class="eyebrow">Daily challenge</p>
      <p>${challengeOfTheDay()}</p>
    </div>
    <button class="btn ${challengeDone ? "ghost" : "primary"}" data-action="challenge">${challengeDone ? "Done ✓" : "Complete"}</button>
  </section>

  <section class="card quote">
    <p>“${esc(q.text)}”</p>
    <p class="muted small">— ${esc(q.by)}</p>
  </section>

  <section>
    <h2>Badges <span class="muted small">${state.badges.length}/${BADGES.length}</span></h2>
    <div class="badges">
      ${BADGES.map((b) => {
        const got = state.badges.includes(b.id);
        return `<div class="badge ${got ? "got" : ""}" title="${esc(b.desc)}"><span>${b.icon}</span><strong>${b.name}</strong><small>${b.desc}</small></div>`;
      }).join("")}
    </div>
  </section>`;
}

function viewTrain() {
  const s = ensureSession();
  const total = s.drills.reduce((n, id) => n + drill(id).minutes, 0);
  const doneMin = s.drills.filter((id) => s.done.includes(id)).reduce((n, id) => n + drill(id).minutes, 0);
  const pct = total ? Math.round((doneMin / total) * 100) : 0;

  return `
  <section class="page-head">
    <h1>Today's Workout</h1>
    <p class="muted">${FOCUSES[s.focus].desc} · ${total} min · tailored for a ${state.profile.position}</p>
  </section>

  <div class="chips">
    ${Object.entries(FOCUSES).map(([k, f]) => `<button class="chip ${k === s.focus ? "active" : ""}" data-action="focus" data-focus="${k}">${f.label}</button>`).join("")}
  </div>

  <section class="card progress-card">
    <div class="rank-top"><strong>${pct}% complete</strong><span class="muted small">${doneMin}/${total} min</span></div>
    <div class="bar"><div style="width:${pct}%"></div></div>
  </section>

  <ol class="drills">
    ${s.drills.map((id, i) => {
      const d = drill(id);
      const done = s.done.includes(id);
      return `
      <li class="card drill ${done ? "done" : ""}">
        <button class="check" data-action="toggle-drill" data-id="${id}" aria-label="Mark done">${done ? "✓" : i + 1}</button>
        <div class="drill-body">
          <div class="drill-head">
            <strong>${d.name}</strong>
            <span class="tag">${CATEGORIES[d.cat].icon} ${CATEGORIES[d.cat].label}</span>
          </div>
          <p class="muted small">${d.how}</p>
          <button class="btn small ghost" data-action="timer" data-id="${id}">⏱ ${d.minutes} min timer</button>
        </div>
      </li>`;
    }).join("")}
  </ol>

  <div class="actions">
    <button class="btn ghost" data-action="shuffle">🔀 Shuffle drills</button>
    ${s.finished
      ? `<button class="btn primary" disabled>Logged ✓</button>`
      : `<button class="btn primary" data-action="finish">Finish & log workout</button>`}
  </div>

  <section>
    <h2>Recent sessions</h2>
    ${state.workouts.length
      ? `<ul class="list">${state.workouts.slice(-6).reverse().map((w) => `<li><span>${prettyDate(w.date)}</span><span>${FOCUSES[w.focus].label}</span><strong>${w.minutes} min</strong></li>`).join("")}</ul>`
      : `<p class="muted">No sessions yet. Your first one is right above.</p>`}
  </section>`;
}

function viewFuel() {
  const key = dateKey();
  const t = nutritionTargets();
  const plan = ensureMealPlan(key);
  const eaten = state.mealsEaten[key] || [];
  const meals = plan.meals.map(planMeal);
  const sum = (f) => meals.reduce((n, m) => n + m[f], 0);
  const eatenSum = (f) => meals.reduce((n, m, i) => n + (eaten.includes(i) ? m[f] : 0), 0);
  const macro = (label, have, want, unit, cls) => {
    const pct = Math.min(100, Math.round((have / want) * 100));
    return `<div class="macro ${cls}"><div class="rank-top"><span>${label}</span><span class="small">${have}/${want}${unit}</span></div><div class="bar"><div style="width:${pct}%"></div></div></div>`;
  };
  const slotLabel = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

  return `
  <section class="page-head">
    <h1>Today's Meal Plan</h1>
    <p class="muted">Built for your goal: <strong>${{ gain: "build muscle", maintain: "maintain", lean: "get leaner" }[state.profile.goal]}</strong>${state.profile.diet !== "none" ? ` · ${state.profile.diet}` : ""}</p>
  </section>

  <section class="card">
    <div class="targets">
      <div><strong>${t.kcal}</strong><span>kcal</span></div>
      <div><strong>${t.protein}g</strong><span>protein</span></div>
      <div><strong>${t.carbs}g</strong><span>carbs</span></div>
      <div><strong>${t.fat}g</strong><span>fat</span></div>
      <div><strong>${t.waterOz}oz</strong><span>water</span></div>
    </div>
    <p class="muted small">Plan totals: ${sum("kcal")} kcal · ${sum("p")}g protein · ${sum("c")}g carbs · ${sum("f")}g fat</p>
  </section>

  <section class="card">
    ${macro("Calories", eatenSum("kcal"), t.kcal, "", "kcal")}
    ${macro("Protein", eatenSum("p"), t.protein, "g", "protein")}
    ${macro("Carbs", eatenSum("c"), t.carbs, "g", "carbs")}
    ${macro("Fat", eatenSum("f"), t.fat, "g", "fat")}
  </section>

  <ul class="meals">
    ${meals.map((m, i) => `
      <li class="card meal ${eaten.includes(i) ? "done" : ""}">
        <button class="check" data-action="toggle-meal" data-i="${i}" aria-label="Mark eaten">${eaten.includes(i) ? "✓" : ""}</button>
        <div class="drill-body">
          <p class="eyebrow">${slotLabel[plan.meals[i].slot]}</p>
          <strong>${m.name}${m.servings !== 1 ? ` <span class="tag">${m.servings}× portion</span>` : ""}</strong>
          <ul class="items">${m.items.map((it) => `<li>${it}</li>`).join("")}</ul>
          <p class="muted small">${m.kcal} kcal · ${m.p}P / ${m.c}C / ${m.f}F</p>
        </div>
      </li>`).join("")}
  </ul>

  <div class="actions">
    <button class="btn ghost" data-action="new-meals">🔀 New meal plan</button>
  </div>

  <section class="card tips">
    <p class="eyebrow">Fuel tips</p>
    <ul>
      <li>Eat a carb-heavy meal 2–3 hours before you train or play.</li>
      <li>Within an hour after training, get protein + carbs (chocolate milk works).</li>
      <li>Sip water all day — being 2% dehydrated can drop your shooting percentage.</li>
    </ul>
  </section>`;
}

function lineChart(points, unit) {
  if (points.length < 2) return `<p class="muted small">Log at least two entries to see your trend.</p>`;
  const W = 320, H = 140, P = 24;
  const vals = points.map((p) => p.value);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const x = (i) => P + (i * (W - P * 2)) / (points.length - 1);
  const y = (v) => H - P - ((v - min) / (max - min)) * (H - P * 2);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1)},${H - P} L${x(0)},${H - P} Z`;
  return `
  <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress chart">
    <path d="${area}" class="chart-area"/>
    <path d="${path}" class="chart-line"/>
    ${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="3.5" class="chart-dot"><title>${prettyDate(p.date)}: ${p.value} ${unit}</title></circle>`).join("")}
    <text x="${P}" y="${H - 6}" class="chart-label">${prettyDate(points[0].date)}</text>
    <text x="${W - P}" y="${H - 6}" class="chart-label" text-anchor="end">${prettyDate(points[points.length - 1].date)}</text>
    <text x="4" y="${y(max) + 4}" class="chart-label">${max}</text>
    <text x="4" y="${y(min) + 4}" class="chart-label">${min}</text>
  </svg>`;
}

let selectedMetric = "vertical";

function viewProgress() {
  const x = extras();
  const today = dateKey();
  const days = workoutDays();
  // 12-week heatmap, columns = weeks ending this week
  const start = addDays(today, -(7 * 11 + new Date().getDay()));
  const minutesByDay = {};
  for (const w of state.workouts) minutesByDay[w.date] = (minutesByDay[w.date] || 0) + w.minutes;
  const cells = [];
  for (let i = 0; i < 84; i++) {
    const k = addDays(start, i);
    const m = minutesByDay[k] || 0;
    const lvl = k > today ? "future" : m === 0 ? 0 : m < 30 ? 1 : m < 60 ? 2 : 3;
    cells.push(`<i class="c${lvl}" title="${prettyDate(k)}: ${m} min"></i>`);
  }

  const metric = METRICS[selectedMetric];
  const points = state.stats.filter((s) => s.metric === selectedMetric).sort((a, b) => (a.date < b.date ? -1 : 1));
  let delta = "";
  if (points.length >= 2) {
    const d = +(points[points.length - 1].value - points[0].value).toFixed(1);
    const good = metric.better === "up" ? d > 0 : metric.better === "down" ? d < 0 : false;
    delta = `<span class="delta ${good ? "good" : ""}">${d > 0 ? "+" : ""}${d} ${metric.unit} since ${prettyDate(points[0].date)}</span>`;
  }

  return `
  <section class="page-head">
    <h1>Progress</h1>
    <p class="muted">What gets measured gets better.</p>
  </section>

  <div class="stats-row">
    <div class="card stat"><strong>${state.workouts.length}</strong><span>workouts</span></div>
    <div class="card stat"><strong>${Math.round(x.totalMinutes / 6) / 10}</strong><span>hours</span></div>
    <div class="card stat"><strong>${x.streak}</strong><span>streak</span></div>
    <div class="card stat"><strong>${x.bestStreak}</strong><span>best streak</span></div>
  </div>

  <section class="card">
    <p class="eyebrow">Last 12 weeks · ${[...days].filter((d) => d >= start).length} training days</p>
    <div class="heatmap">${cells.join("")}</div>
  </section>

  <section class="card">
    <div class="chips">
      ${Object.entries(METRICS).map(([k, m]) => `<button class="chip ${k === selectedMetric ? "active" : ""}" data-action="metric" data-metric="${k}">${m.label}</button>`).join("")}
    </div>
    ${delta}
    ${lineChart(points, metric.unit)}
    <form id="stat-form" class="inline-form">
      <input name="value" type="number" step="0.1" required placeholder="${metric.label} (${metric.unit})">
      <input name="date" type="date" value="${today}" max="${today}" required>
      <button class="btn primary" type="submit">Log</button>
    </form>
  </section>

  ${points.length ? `
  <section>
    <h2>${metric.label} log</h2>
    <ul class="list">${points.slice().reverse().map((p) => `<li><span>${prettyDate(p.date)}</span><strong>${p.value} ${metric.unit}</strong><button class="link" data-action="del-stat" data-date="${p.date}" data-value="${p.value}" aria-label="Delete">✕</button></li>`).join("")}</ul>
  </section>` : ""}`;
}

// ---------- Timer ----------

let timer = null;

function openTimer(id) {
  const d = drill(id);
  closeTimer();
  let remaining = d.minutes * 60;
  let running = true;
  const el = document.createElement("div");
  el.className = "timer-overlay";
  el.innerHTML = `
    <div class="timer card">
      <p class="eyebrow">${CATEGORIES[d.cat].label}</p>
      <h2>${d.name}</h2>
      <div class="timer-face" id="timer-face"></div>
      <div class="actions">
        <button class="btn ghost" data-t="pause">Pause</button>
        <button class="btn ghost" data-t="add">+30s</button>
        <button class="btn primary" data-t="close">Done</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  const face = el.querySelector("#timer-face");
  const draw = () => {
    const m = Math.floor(remaining / 60);
    const s = String(remaining % 60).padStart(2, "0");
    face.textContent = `${m}:${s}`;
  };
  draw();
  const tick = setInterval(() => {
    if (!running) return;
    remaining = Math.max(0, remaining - 1);
    draw();
    if (remaining === 0) {
      running = false;
      face.classList.add("finished");
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if (!state.session.done.includes(id)) {
        state.session.done.push(id);
        save();
        render();
      }
    }
  }, 1000);
  el.addEventListener("click", (e) => {
    const t = e.target.dataset.t;
    if (t === "pause") {
      running = !running;
      e.target.textContent = running ? "Pause" : "Resume";
    } else if (t === "add") {
      remaining += 30;
      face.classList.remove("finished");
      running = true;
      draw();
    } else if (t === "close" || e.target === el) {
      closeTimer();
    }
  });
  timer = { el, tick };
}

function closeTimer() {
  if (!timer) return;
  clearInterval(timer.tick);
  timer.el.remove();
  timer = null;
}

// ---------- Router & events ----------

const ROUTES = { home: viewHome, train: viewTrain, fuel: viewFuel, progress: viewProgress, profile: viewOnboarding };

function route() {
  const r = location.hash.replace("#", "") || "home";
  return ROUTES[r] ? r : "home";
}

function render() {
  const app = $("#app");
  const nav = $("#nav");
  if (!state.profile) {
    nav.hidden = true;
    app.innerHTML = viewOnboarding();
    return;
  }
  nav.hidden = false;
  const r = route();
  app.innerHTML = ROUTES[r]();
  nav.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${r}`));
}

function onSubmit(e) {
  if (e.target.id === "profile-form") {
    e.preventDefault();
    const f = new FormData(e.target);
    const num = (k) => Number(f.get(k));
    const prev = state.profile;
    state.profile = {
      name: String(f.get("name")).trim(),
      age: num("age"),
      sex: f.get("sex"),
      heightIn: num("heightIn"),
      weightLb: num("weightLb"),
      position: f.get("position"),
      level: num("level"),
      goal: f.get("goal"),
      diet: f.get("diet"),
      daysPerWeek: num("daysPerWeek"),
      sessionMinutes: num("sessionMinutes"),
    };
    // Plans depend on the profile, so rebuild today's
    state.session = null;
    delete state.mealPlans[dateKey()];
    delete state.mealsEaten[dateKey()];
    if (!prev) {
      state.stats.push({ date: dateKey(), metric: "weight", value: state.profile.weightLb });
    }
    save();
    toast(prev ? "Profile saved — plans updated." : "You're in. Let's get to work! 🏀");
    location.hash = "#home";
    render();
  } else if (e.target.id === "stat-form") {
    e.preventDefault();
    const f = new FormData(e.target);
    const value = Number(f.get("value"));
    if (!Number.isFinite(value)) return;
    state.stats.push({ date: f.get("date"), metric: selectedMetric, value });
    save();
    toast(`${METRICS[selectedMetric].label} logged 📈`);
    checkBadges();
    render();
  }
}

function onClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const a = btn.dataset.action;
  if (a === "toggle-drill") {
    const s = state.session;
    const id = btn.dataset.id;
    s.done = s.done.includes(id) ? s.done.filter((x) => x !== id) : [...s.done, id];
    save();
    render();
  } else if (a === "focus") {
    if (state.session.finished) return toast("Today's workout is already logged. Nice work!");
    regenerateSession(btn.dataset.focus);
    render();
  } else if (a === "shuffle") {
    if (state.session.finished) return toast("Today's workout is already logged. Nice work!");
    regenerateSession(state.session.focus);
    render();
  } else if (a === "finish") {
    finishSession();
  } else if (a === "timer") {
    openTimer(btn.dataset.id);
  } else if (a === "toggle-meal") {
    const key = dateKey();
    const i = Number(btn.dataset.i);
    const list = state.mealsEaten[key] || [];
    state.mealsEaten[key] = list.includes(i) ? list.filter((x) => x !== i) : [...list, i];
    save();
    checkBadges();
    render();
  } else if (a === "new-meals") {
    const key = dateKey();
    const seed = ((state.mealPlans[key]?.seed || 0) + 104729) >>> 0;
    state.mealPlans[key] = { seed, meals: buildMealPlan(seed) };
    state.mealsEaten[key] = [];
    save();
    render();
  } else if (a === "metric") {
    selectedMetric = btn.dataset.metric;
    render();
  } else if (a === "del-stat") {
    const idx = state.stats.findIndex((s) => s.metric === selectedMetric && s.date === btn.dataset.date && String(s.value) === btn.dataset.value);
    if (idx >= 0) state.stats.splice(idx, 1);
    save();
    render();
  } else if (a === "challenge") {
    const k = dateKey();
    if (state.challengesDone.includes(k)) {
      state.challengesDone = state.challengesDone.filter((d) => d !== k);
    } else {
      state.challengesDone.push(k);
      toast("Challenge crushed! +25 XP 💪");
    }
    save();
    render();
  } else if (a === "reset") {
    if (confirm("Delete your profile, workouts, and progress? This can't be undone.")) {
      state = defaultState();
      save();
      location.hash = "";
      render();
    }
  }
}

document.addEventListener("submit", onSubmit);
document.addEventListener("click", onClick);
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
});

render();
if (state.profile) checkBadges();
