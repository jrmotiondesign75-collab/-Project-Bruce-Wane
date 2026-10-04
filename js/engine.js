// Pure logic: dates, plan building, workouts, nutrition, sleep, XP and ranks.
import { DRILLS } from "./drills.js";
import { MEALS, TIERS } from "./data.js";

// ---------- Dates & randomness ----------

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function prettyDate(key) {
  return parseKey(key).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function weekdayOf(key) {
  return parseKey(key).getDay();
}

// ISO week id like "2026-W40", used for weekly leaderboards
export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)];

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatTime(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ---------- Session types & plan ----------

export const SESSION_TYPES = {
  shooting: { label: "Shooting Lab", short: "Shoot", kind: "skill", blocks: ["shooting", "shooting", "finishing", "shooting"] },
  handles: { label: "Handle Lab", short: "Handles", kind: "skill", blocks: ["handles", "handles", "finishing", "shooting"] },
  finishing: { label: "Rim Pressure", short: "Finish", kind: "skill", blocks: ["finishing", "handles", "finishing", "shooting"] },
  defense: { label: "Lockdown Day", short: "Defense", kind: "skill", blocks: ["defense", "speed", "defense", "conditioning"] },
  post: { label: "Post Lab", short: "Post", kind: "skill", blocks: ["post", "finishing", "post", "shooting"] },
  vertical: { label: "Bounce Day", short: "Bounce", kind: "athletic", blocks: ["vertical", "strength", "vertical", "strength"] },
  speed: { label: "Speed Day", short: "Speed", kind: "athletic", blocks: ["speed", "conditioning", "speed", "handles"] },
  endurance: { label: "Game Shape", short: "Engine", kind: "athletic", blocks: ["conditioning", "shooting", "conditioning", "handles"] },
  durable: { label: "Bulletproof Day", short: "Armor", kind: "athletic", blocks: ["strength", "mobility", "strength", "speed"] },
  strength: { label: "Strength Day", short: "Strength", kind: "athletic", blocks: ["strength", "strength", "vertical", "strength"] },
  recovery: { label: "Active Recovery", short: "Recover", kind: "recovery", blocks: ["recovery", "recovery", "recovery"] },
  rest: { label: "Rest Day", short: "Rest", kind: "rest", blocks: [] },
};

const PROGRAMS = {
  shooting: "Sharpshooter",
  handles: "Handle Lab",
  finishing: "Rim Pressure",
  defense: "Lockdown",
  post: "Low Post",
};
const PHYS_TAG = { vertical: "Bounce", speed: "Speed", endurance: "Engine", durable: "Bulletproof" };

export function programName(p) {
  const skill = (p.skillGoals && p.skillGoals[0]) || "shooting";
  return `${PROGRAMS[skill]} + ${PHYS_TAG[p.physicalGoal] || "Bounce"}`;
}

const TRAIN_DAYS = {
  3: { train: [1, 3, 5], recovery: [6] },
  4: { train: [1, 2, 4, 5], recovery: [3] },
  5: { train: [1, 2, 4, 5, 6], recovery: [3] },
  6: { train: [1, 2, 3, 4, 5, 6], recovery: [0] },
};

export function recommendSchedule(p) {
  const s1 = (p.skillGoals && p.skillGoals[0]) || "shooting";
  const s2 = (p.skillGoals && p.skillGoals[1]) || (s1 === "shooting" ? "finishing" : "shooting");
  const phys = p.physicalGoal || "vertical";
  const str = p.strengthGoal === "light" ? (phys === "vertical" ? "speed" : "vertical") : "strength";
  const order = [s1, phys, s2, str, s1, phys === "endurance" ? "speed" : "endurance"];
  const pattern = TRAIN_DAYS[p.daysPerWeek] || TRAIN_DAYS[5];
  const week = Array.from({ length: 7 }, () => ({ type: "rest", time: null, alarm: false }));
  pattern.train.forEach((day, i) => (week[day] = { type: order[i], time: p.time || "18:00", alarm: false }));
  pattern.recovery.forEach((day) => (week[day] = { type: "recovery", time: p.time || "18:00", alarm: false }));
  return week;
}

// Minutes per category across the week, for the plan summary
export function weeklyFocus(schedule) {
  const totals = {};
  for (const day of schedule) {
    for (const cat of SESSION_TYPES[day.type].blocks) totals[cat] = (totals[cat] || 0) + 1;
  }
  return totals;
}

export function sleepTarget(age) {
  if (age <= 12) return 10;
  if (age <= 18) return 9;
  return 8;
}

// ---------- Workouts ----------

export function drill(id) {
  return DRILLS.find((d) => d.id === id);
}

export const isProDrill = (d) => !/Fundamental|staple|Classic|Active recovery|Solo version/i.test(d.src);

function hasGear(d, gear) {
  return d.needs.every((n) => gear.includes(n));
}

// Fallbacks when a player lacks the gear for a category
const CAT_FALLBACK = { shooting: "handles", finishing: "handles", post: "handles", defense: "speed" };

export function buildWorkout(p, type, seed) {
  const t = SESSION_TYPES[type];
  if (!t || t.kind === "rest") return [];
  const rand = rng(seed);
  const gear = p.equipment || [];
  const chosen = [];
  const usable = (d) => d.level <= p.level && hasGear(d, gear) && !chosen.includes(d.id);
  const take = (cat) => {
    let pool = DRILLS.filter((d) => d.cat === cat && usable(d));
    if (!pool.length && CAT_FALLBACK[cat]) pool = DRILLS.filter((d) => d.cat === CAT_FALLBACK[cat] && usable(d));
    if (!pool.length && cat === "shooting") pool = DRILLS.filter((d) => d.id === "bed-shots" && usable(d));
    if (gear.includes("hoop")) pool = pool.filter((d) => d.id !== "bed-shots" || pool.length === 1);
    if (!pool.length) return;
    const forPos = pool.filter((d) => d.positions.length === 0 || d.positions.includes(p.position));
    if (forPos.length && rand() < 0.8) pool = forPos;
    // Feature pro and college drills most of the time
    const pro = pool.filter(isProDrill);
    if (pro.length && rand() < 0.65) pool = pro;
    chosen.push(pick(pool, rand).id);
  };

  if (t.kind !== "recovery") chosen.push("warmup");
  let blocks = [...t.blocks];
  if (type === "strength" && p.strengthGoal === "core") blocks = ["strength", "mobility", "strength", "vertical"];
  if (type === "strength" && p.strengthGoal === "size") blocks.push("strength");
  for (const cat of blocks) take(cat);

  const minutes = () => chosen.reduce((n, id) => n + drill(id).minutes, 0);
  const target = t.kind === "recovery" ? 30 : p.sessionMinutes;
  let guard = 0;
  // Fill remaining time mostly with the session's main focus
  const fill = [blocks[0], blocks[0], ...blocks];
  while (minutes() < target - 6 && guard++ < 25) take(pick(fill, rand));
  if (type === "strength" && p.strengthGoal === "core" && !chosen.includes("core")) chosen.push("core");
  if (t.kind === "skill" && gear.includes("hoop") && !chosen.includes("free-throws")) chosen.push("free-throws");
  if (t.kind !== "recovery") chosen.push("cooldown");
  return chosen;
}

export const isShootingDrill = (d) => ["shooting", "finishing", "post"].includes(d.cat) && d.needs.includes("hoop");

// ---------- Nutrition ----------

export function nutritionTargets(p) {
  const kg = p.weightLb * 0.4536;
  const cm = p.heightIn * 2.54;
  const bmr = 10 * kg + 6.25 * cm - 5 * p.age + (p.sex === "female" ? -161 : 5);
  const activity = 1.45 + Math.min(p.daysPerWeek, 7) * 0.05;
  const goalAdj = { gain: 400, maintain: 0, learn: 0, lean: -350 }[p.goal] ?? 0;
  const kcal = Math.round((bmr * activity + goalAdj) / 10) * 10;
  const protein = Math.round(p.weightLb * (p.goal === "gain" || p.goal === "lean" ? 0.9 : 0.8));
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const waterOz = Math.round(p.weightLb / 2 + 24);
  return { kcal, protein, carbs, fat, waterOz };
}

function mealPool(p, slot) {
  const pool = MEALS[slot].filter((m) => p.diet === "none" || m.tags.includes(p.diet));
  return pool.length ? pool : MEALS[slot];
}

export function buildMealPlan(p, seed) {
  const t = nutritionTargets(p);
  const rand = rng(seed);
  let best = null;
  for (let i = 0; i < 300; i++) {
    const plan = ["breakfast", "lunch", "dinner"].map((slot) => ({ slot, meal: pick(mealPool(p, slot), rand) }));
    const used = new Set();
    const n = 1 + Math.floor(rand() * 3);
    for (let j = 0; j < n; j++) {
      const s = pick(mealPool(p, "snack"), rand);
      if (used.has(s.name)) continue;
      used.add(s.name);
      plan.push({ slot: "snack", meal: s });
    }
    const kcal = plan.reduce((a, x) => a + x.meal.kcal, 0);
    const prot = plan.reduce((a, x) => a + x.meal.p, 0);
    const score = Math.abs(kcal - t.kcal) + Math.max(0, t.protein - prot) * 6;
    if (!best || score < best.score) best = { score, plan };
  }
  // Scale main-meal portions so big targets are reachable
  const kcal = best.plan.reduce((a, x) => a + x.meal.kcal, 0);
  const mainKcal = best.plan.filter((x) => x.slot !== "snack").reduce((a, x) => a + x.meal.kcal, 0);
  const servings = Math.min(1.75, Math.max(0.75, Math.round((1 + (t.kcal - kcal) / mainKcal) * 4) / 4));
  return best.plan.map((x) => ({ slot: x.slot, name: x.meal.name, servings: x.slot === "snack" ? 1 : servings }));
}

export function planMeal(entry) {
  const m = MEALS[entry.slot].find((x) => x.name === entry.name);
  const k = entry.servings || 1;
  return { ...m, servings: k, kcal: Math.round(m.kcal * k), p: Math.round(m.p * k), c: Math.round(m.c * k), f: Math.round(m.f * k) };
}

// ---------- Sleep ----------

export function sleepHours(bed, wake) {
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

// ---------- XP, levels, ranks ----------

// Total XP needed to reach a level. Early levels come fast so every task feels like progress.
export function xpForLevel(level) {
  const n = level - 1;
  return 40 * n + 12 * n * n;
}

export function levelInfo(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, xp, into: xp - floor, span: next - floor, pct: Math.round(((xp - floor) / (next - floor)) * 100), toNext: next - xp };
}

export function rankFor(level) {
  const step = Math.floor((level - 1) / 2);
  const tierIdx = Math.min(Math.floor(step / 3), TIERS.length - 1);
  const tier = TIERS[tierIdx];
  if (tierIdx === TIERS.length - 1) return { tier: tier.name, div: "", color: tier.color, label: tier.name, idx: step };
  const div = ["III", "II", "I"][step % 3];
  return { tier: tier.name, div, color: tier.color, label: `${tier.name} ${div}`, idx: step };
}

// ---------- Commitments & streaks ----------

export function isTrainingDay(schedule, key) {
  return schedule[weekdayOf(key)].type !== "rest";
}

// Walk back from today: scheduled days must be completed, rest days don't break the streak
export function streak(schedule, doneDates, today = dateKey()) {
  const done = new Set(doneDates);
  let n = 0;
  for (let i = 0, k = today; i < 400; i++, k = addDays(k, -1)) {
    if (!isTrainingDay(schedule, k)) {
      if (done.has(k)) n++;
      continue;
    }
    if (done.has(k)) n++;
    else if (k === today) continue;
    else break;
  }
  return n;
}

export function bestStreak(doneDates) {
  let best = 0, run = 0, prev = null;
  for (const d of [...new Set(doneDates)].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

// ---------- Ratings (player card) ----------

const clamp = (v, lo = 35, hi = 99) => Math.max(lo, Math.min(hi, Math.round(v)));

export function ratings(state) {
  const recent = state.workouts.slice(-40);
  const shots = recent.reduce((n, w) => n + (w.shots || 0), 0);
  const makes = recent.reduce((n, w) => n + (w.makes || 0), 0);
  const pct = shots ? makes / shots : 0;
  const shooting = shots >= 20 ? clamp(35 + pct * 70 + Math.min(10, shots / 60)) : 50;

  const kept = state.keptDates.length;
  const missed = state.missedDates.length;
  const work = kept + missed ? clamp(40 + (kept / (kept + missed)) * 50 + Math.min(9, kept / 3)) : 50;

  const vert = [...state.stats].reverse().find((s) => s.metric === "vertical");
  const athletic = vert ? clamp(30 + vert.value * 1.6) : clamp(50 + state.workouts.filter((w) => SESSION_TYPES[w.type]?.kind === "athletic").length * 1.5);

  const nights = state.sleep.slice(-14);
  const target = sleepTarget(state.profile.age);
  const recovery = nights.length ? clamp(40 + (nights.filter((n) => n.hours >= target - 0.25).length / nights.length) * 59) : 50;

  const drills = state.workouts.reduce((n, w) => n + w.drills.length, 0);
  const skill = clamp(45 + Math.sqrt(drills) * 4);

  const parts = { SHT: shooting, ATH: athletic, SKL: skill, WRK: work, REC: recovery };
  const ovr = Math.round(Object.values(parts).reduce((a, b) => a + b, 0) / 5);
  return { ovr, parts };
}
