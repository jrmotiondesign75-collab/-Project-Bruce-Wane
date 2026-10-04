import { CATEGORIES, DRILLS, SOURCES } from "./drills.js";
import { QUIZ, QUOTES, CHALLENGES, XP, BADGES, METRICS, TIERS } from "./data.js";
import { dateKey, parseKey, addDays, prettyDate, weekdayOf, weekKey, hashString, DAY_NAMES, formatTime, SESSION_TYPES, programName, recommendSchedule, weeklyFocus, sleepTarget, drill, isProDrill, buildWorkout, isShootingDrill, nutritionTargets, buildMealPlan, planMeal, sleepHours, levelInfo, rankFor, isTrainingDay, streak, bestStreak, ratings } from "./engine.js";
import { cloud, initCloud, hasSocial, loadPrivate, savePrivate, publishCard, watchCollection, saveMyFeed, saveMyCheers, saveMyComments, removeOthersPost, uploadMedia, saveFile, hasAI, askCoach } from "./cloud.js";

// ---------- State ----------

const KEY = "courtside:v2";

const fresh = () => ({
  v: 2,
  profile: null,
  schedule: null,
  planStart: null,
  xp: 0,
  xpWeek: {},
  workouts: [], // { date, type, minutes, drills, shots, makes, onTime, xp, ts }
  stats: [], // { date, metric, value }
  sleep: [], // { date, bed, wake, hours, quality }
  session: null,
  mealPlans: {},
  mealsEaten: {},
  mealBonus: [],
  badges: [],
  challengesDone: [],
  keptDates: [],
  missedDates: [],
  lastCommitCheck: null,
  postsMade: 0,
  postXpDays: {},
  myPosts: [],
  myCheers: [],
  myComments: [],
  settings: { aiCoach: true },
  notified: {},
  coachChat: [],
  updatedAt: 0,
});

function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {}
  return fresh();
}

let state = loadLocal();

function prune() {
  const cut = (arr, n) => (arr.length > n ? arr.slice(-n) : arr);
  state.workouts = cut(state.workouts, 300);
  state.sleep = cut(state.sleep, 120);
  state.stats = cut(state.stats, 300);
  state.coachChat = cut(state.coachChat, 20);
  state.keptDates = cut(state.keptDates, 400);
  state.missedDates = cut(state.missedDates, 400);
  const keepKeys = (obj, days) => {
    const min = addDays(dateKey(), -days);
    for (const k of Object.keys(obj)) if (k < min) delete obj[k];
  };
  keepKeys(state.mealPlans, 3);
  keepKeys(state.mealsEaten, 30);
  keepKeys(state.notified, 7);
  keepKeys(state.postXpDays, 7);
}

function save() {
  state.updatedAt = Date.now();
  prune();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  savePrivate(() => state);
  syncCard();
}

const live = { players: [], feeds: [], cheers: [], comments: [] };

// ---------- Helpers ----------

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c || "") ? c : "#8d97a8");
const isPlayer = () => state.profile && state.profile.role === "player";
const today = () => dateKey();
const POS = { PG: "Point Guard", SG: "Shooting Guard", SF: "Small Forward", PF: "Power Forward", C: "Center" };
const LEVELS = { 1: "Rec / middle school", 2: "High school / AAU", 3: "Varsity / college / pro" };

function toast(msg, cls = "") {
  const el = document.createElement("div");
  el.className = `toast ${cls}`;
  el.textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => el.classList.add("out"), 2600);
  setTimeout(() => el.remove(), 3000);
}

function timeAgo(ts) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function avatar(handle, color, size = "") {
  const initial = esc(String(handle || "?").trim().charAt(0).toUpperCase() || "?");
  return `<span class="av ${size}" style="--c:${safeColor(color)}">${initial}</span>`;
}

const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  train: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M6 5.5c3 3 3 10 0 13M18 5.5c-3 3-3 10 0 13"/>',
  fuel: '<path d="M7 3v8a3 3 0 0 0 3 3v7M10 3v6M4 3v6a3 3 0 0 0 3 3M17 21V3c2.5 1 4 3.5 4 7s-1.5 4-4 4"/>',
  feed: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M10 9l5 3-5 3z"/>',
  ranks: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  coach: '<path d="M4 5h16v10H9l-5 4z"/><path d="M9 9h6M9 12h4"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

// ---------- XP & progress ----------

let celebrateQueue = [];

function award(amount, reason) {
  if (!amount) return;
  const before = levelInfo(state.xp);
  state.xp = Math.max(0, state.xp + amount);
  const wk = weekKey();
  state.xpWeek[wk] = Math.max(0, (state.xpWeek[wk] || 0) + amount);
  for (const k of Object.keys(state.xpWeek)) if (k < weekKey(new Date(Date.now() - 60 * 86400000))) delete state.xpWeek[k];
  if (amount > 0) floatXP(amount, reason);
  const after = levelInfo(state.xp);
  if (after.level > before.level) {
    const r0 = rankFor(before.level), r1 = rankFor(after.level);
    celebrateQueue.push({ level: after.level, rank: r1, rankUp: r1.label !== r0.label });
    setTimeout(runCelebrations, 350);
  }
}

function floatXP(n, reason) {
  const el = document.createElement("div");
  el.className = "xp-float";
  el.innerHTML = `<strong>+${n} XP</strong>${reason ? `<span>${esc(reason)}</span>` : ""}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

function runCelebrations() {
  if ($(".celebrate") || !celebrateQueue.length) return;
  const c = celebrateQueue.shift();
  const el = document.createElement("div");
  el.className = "celebrate";
  el.style.setProperty("--c", c.rank.color);
  el.innerHTML = `
    <div class="burst"></div>
    <p class="eyebrow">${c.rankUp ? "Rank up" : "Level up"}</p>
    <div class="big-level">${c.level}</div>
    <p class="rank-name">${esc(c.rank.label)}</p>
    <p class="muted small">Tap to keep going</p>`;
  el.addEventListener("click", () => {
    el.remove();
    runCelebrations();
  });
  document.body.appendChild(el);
  if (navigator.vibrate) navigator.vibrate(80);
  setTimeout(() => el.isConnected && el.click(), 2800);
}

function derived() {
  const doneDates = state.workouts.map((w) => w.date);
  return {
    streak: isPlayer() ? streak(state.schedule, doneDates) : 0,
    bestStreak: bestStreak(doneDates),
    makes: state.workouts.reduce((n, w) => n + (w.makes || 0), 0),
    shots: state.workouts.reduce((n, w) => n + (w.shots || 0), 0),
    kept: state.keptDates.length,
    sleepHits: isPlayer() ? state.sleep.filter((s) => s.hours >= sleepTarget(state.profile.age) - 0.25).length : 0,
    proDrills: state.workouts.reduce((n, w) => n + w.drills.filter((id) => drill(id) && isProDrill(drill(id))).length, 0),
  };
}

function checkBadges() {
  const x = derived();
  for (const b of BADGES) {
    if (!state.badges.includes(b.id) && b.test(state, x)) {
      state.badges.push(b.id);
      toast(`Badge unlocked: ${b.name}`, "gold");
    }
  }
}

// Mark scheduled days that passed without a workout as missed
function checkCommitments() {
  if (!isPlayer()) return;
  const t = today();
  let k = state.lastCommitCheck ? addDays(state.lastCommitCheck, 1) : addDays(t, -1);
  const done = new Set(state.workouts.map((w) => w.date));
  let changed = false;
  for (let i = 0; k < t && i < 60; i++, k = addDays(k, 1)) {
    if (isTrainingDay(state.schedule, k) && !done.has(k) && !state.missedDates.includes(k)) {
      state.missedDates.push(k);
      changed = true;
    }
  }
  if (state.lastCommitCheck !== addDays(t, -1)) {
    state.lastCommitCheck = addDays(t, -1);
    changed = true;
  }
  if (changed) save();
}

function syncCard() {
  if (!state.profile) return;
  const L = levelInfo(state.xp);
  const r = rankFor(L.level);
  const wk = weekKey();
  const inWeek = (key) => weekKey(parseKey(key)) === wk;
  const weekW = state.workouts.filter((w) => inWeek(w.date));
  const x = isPlayer() ? derived() : { streak: 0, makes: 0, kept: 0 };
  publishCard({
    handle: state.profile.handle,
    role: state.profile.role,
    position: state.profile.position || "",
    level: L.level,
    xp: state.xp,
    rank: r.label,
    color: r.color,
    ovr: isPlayer() ? ratings(state).ovr : 0,
    streak: x.streak,
    week: wk,
    weekXp: state.xpWeek[wk] || 0,
    weekMakes: weekW.reduce((n, w) => n + (w.makes || 0), 0),
    weekShots: weekW.reduce((n, w) => n + (w.shots || 0), 0),
    weekKept: state.keptDates.filter(inWeek).length,
    kept: x.kept,
    makes: x.makes,
    workouts: state.workouts.length,
  });
}

// ---------- Plan, session, meals ----------

function todayEntry() {
  return state.schedule[new Date().getDay()];
}

function ensureSession() {
  const t = today();
  if (!state.session || state.session.date !== t) {
    let type = todayEntry().type;
    if (type === "rest") type = "recovery";
    const seed = hashString(t + type);
    state.session = { date: t, type, seed, drills: buildWorkout(state.profile, type, seed), done: [], shots: {}, finished: false };
    save();
  }
  return state.session;
}

function regenerateSession(type) {
  const s = ensureSession();
  const seed = (s.seed + 7919) >>> 0;
  state.session = { date: s.date, type, seed, drills: buildWorkout(state.profile, type, seed), done: [], shots: {}, finished: false };
  save();
}

function doneToday() {
  return state.workouts.some((w) => w.date === today());
}

function finishSession() {
  const s = state.session;
  const done = s.drills.filter((id) => s.done.includes(id));
  if (!done.length) return toast("Check off at least one drill first.");
  const minutes = done.reduce((n, id) => n + drill(id).minutes, 0);
  const shots = Object.values(s.shots).reduce((n, x) => n + x.a, 0);
  const makes = Object.values(s.shots).reduce((n, x) => n + x.m, 0);
  const entry = todayEntry();
  const scheduled = entry.type !== "rest";
  let onTime = false;
  if (scheduled && entry.time) {
    const [h, m] = entry.time.split(":").map(Number);
    const due = new Date();
    due.setHours(h, m, 0, 0);
    onTime = Date.now() <= due.getTime() + 2 * 3600 * 1000;
  }
  const kind = SESSION_TYPES[s.type].kind;
  let earned = kind === "recovery" ? XP.recovery : XP.workout;
  if (scheduled && onTime && !doneToday()) earned += XP.onTime;
  earned += Math.floor(makes / 5) * XP.makes;
  if (scheduled && !state.keptDates.includes(s.date)) state.keptDates.push(s.date);
  state.missedDates = state.missedDates.filter((d) => d !== s.date);
  state.workouts.push({ date: s.date, type: s.type, minutes, drills: done, shots, makes, onTime, xp: earned, ts: Date.now() });
  s.finished = true;
  award(earned, kind === "recovery" ? "Recovery done" : onTime ? "Workout + on time" : "Workout done");
  checkBadges();
  save();
  render();
}

function ensureMealPlan() {
  const k = today();
  if (!state.mealPlans[k]) {
    const seed = hashString("meals" + k);
    state.mealPlans[k] = { seed, meals: buildMealPlan(state.profile, seed) };
    save();
  }
  return state.mealPlans[k];
}

// ---------- Motivation ----------

const quoteOfTheDay = () => QUOTES[hashString(today()) % QUOTES.length];
const challengeOfTheDay = () => CHALLENGES[hashString("c" + today()) % CHALLENGES.length];

function coachLine() {
  const p = state.profile;
  const x = derived();
  const e = todayEntry();
  if (doneToday()) return `Work's in for today, ${p.handle}. Refuel, hit your sleep target, and we go again tomorrow.`;
  if (e.type === "rest") return "Rest day. Growth happens when you recover. Stretch, eat well and get to bed on time.";
  if (x.streak >= 3) return `${x.streak}-day streak. Don't break the chain today.`;
  const lastSleep = state.sleep[state.sleep.length - 1];
  if (lastSleep && lastSleep.date === today() && lastSleep.hours < sleepTarget(p.age) - 1)
    return `Only ${lastSleep.hours} hours of sleep last night. Train smart today and aim for an earlier bedtime.`;
  const tips = {
    motivation: "You said motivation is the hard part. Just start the warm-up. Momentum handles the rest.",
    time: `Short on time? Even the first 3 drills of today's ${SESSION_TYPES[e.type].label} count toward your streak.`,
    plan: `No guessing today. Your ${SESSION_TYPES[e.type].label} is built and ready.`,
    injury: "Warm up fully and stop any drill that causes sharp pain. Soreness is normal, pain is not.",
  };
  return tips[p.obstacle] || `Your ${SESSION_TYPES[e.type].label} is ready.`;
}

// ---------- Quiz ----------

let quiz = null; // { i, a }

function startQuiz() {
  const p = state.profile || {};
  quiz = {
    i: 0,
    a: state.profile
      ? { ...p, body: { heightIn: p.heightIn, weightLb: p.weightLb }, sleep: p.sleepNow }
      : {},
  };
  location.hash = "#quiz";
  render();
}

function quizList() {
  return QUIZ.filter((q) => !(q.playerOnly && quiz.a.role === "coach"));
}

function viewQuiz() {
  if (!quiz) quiz = { i: 0, a: {} };
  const list = quizList();
  const q = list[quiz.i];
  const val = quiz.a[q.id];
  const pct = Math.round(((quiz.i + 1) / list.length) * 100);
  let body = "";
  if (q.type === "single") {
    body = `<div class="options">${q.options.map((o) => `
      <button class="option ${String(val) === String(o.v) ? "selected" : ""}" data-action="quiz-pick" data-v="${esc(o.v)}" data-num="${typeof o.v === "number" ? 1 : ""}">
        <strong>${esc(o.label)}</strong>${o.sub ? `<span>${esc(o.sub)}</span>` : ""}
      </button>`).join("")}</div>`;
  } else if (q.type === "multi") {
    const sel = Array.isArray(val) ? val : [];
    body = `<div class="options">${q.options.map((o) => `
      <button class="option ${sel.includes(o.v) ? "selected" : ""}" data-action="quiz-toggle" data-v="${esc(o.v)}">
        <strong>${esc(o.label)}</strong><span class="tick">${sel.includes(o.v) ? "✓" : ""}</span>
      </button>`).join("")}</div>
      <button class="btn primary big" data-action="quiz-next">${sel.length || q.id === "equipment" ? "Continue" : "Skip"}</button>`;
  } else if (q.type === "number") {
    body = `<div class="field-row"><input id="quiz-input" type="number" inputmode="numeric" min="${q.min}" max="${q.max}" value="${esc(val ?? "")}" placeholder="${q.unit}"></div>
      <button class="btn primary big" data-action="quiz-next">Continue</button>`;
  } else if (q.type === "text") {
    body = `<div class="field-row"><input id="quiz-input" type="text" maxlength="${q.max}" value="${esc(val ?? "")}" placeholder="${esc(q.placeholder)}" autocomplete="off"></div>
      <button class="btn primary big" data-action="quiz-next">Continue</button>`;
  } else if (q.type === "body") {
    const b = val || {};
    const ft = b.heightIn ? Math.floor(b.heightIn / 12) : "";
    const inch = b.heightIn ? b.heightIn % 12 : "";
    body = `<div class="field-grid">
        <label for="quiz-ft">Feet<input id="quiz-ft" type="number" inputmode="numeric" min="4" max="7" value="${ft}"></label>
        <label for="quiz-in">Inches<input id="quiz-in" type="number" inputmode="numeric" min="0" max="11" value="${inch}"></label>
        <label for="quiz-lb">Weight (lb)<input id="quiz-lb" type="number" inputmode="numeric" min="70" max="400" value="${b.weightLb || ""}"></label>
      </div>
      <button class="btn primary big" data-action="quiz-next">Continue</button>`;
  }
  return `
  <section class="quiz">
    <div class="quiz-top">
      ${quiz.i > 0 ? `<button class="link" data-action="quiz-back">← Back</button>` : state.profile ? `<a class="link" href="#me">Cancel</a>` : `<span class="wordmark">COURTSIDE</span>`}
      <span class="muted small num">${quiz.i + 1} / ${list.length}</span>
    </div>
    <div class="bar quiz-bar"><div style="width:${pct}%"></div></div>
    <h1 class="quiz-q">${esc(q.q)}</h1>
    ${q.sub ? `<p class="muted">${esc(q.sub)}</p>` : ""}
    <p class="quiz-error" id="quiz-error" hidden></p>
    ${body}
  </section>`;
}

function quizError(msg) {
  const el = $("#quiz-error");
  el.textContent = msg;
  el.hidden = false;
}

function quizNext(value) {
  const list = quizList();
  const q = list[quiz.i];
  if (q.type === "number") {
    value = Number($("#quiz-input").value);
    if (!value || value < q.min || value > q.max) return quizError(`Enter a number from ${q.min} to ${q.max}.`);
  } else if (q.type === "text") {
    value = $("#quiz-input").value.trim().replace(/\s+/g, "");
    if (value.length < 2) return quizError("Use at least 2 characters.");
  } else if (q.type === "body") {
    const ft = Number($("#quiz-ft").value), inch = Number($("#quiz-in").value || 0), lb = Number($("#quiz-lb").value);
    if (!ft || ft < 4 || ft > 7 || inch < 0 || inch > 11) return quizError("Enter your height in feet and inches.");
    if (!lb || lb < 70 || lb > 400) return quizError("Enter your weight in pounds.");
    value = { heightIn: ft * 12 + inch, weightLb: lb };
  } else if (q.type === "multi") {
    value = Array.isArray(quiz.a[q.id]) ? quiz.a[q.id] : [];
  }
  quiz.a[q.id] = value;
  if (quiz.i >= quizList().length - 1) return finishQuiz();
  quiz.i++;
  render();
  window.scrollTo(0, 0);
}

function finishQuiz() {
  const a = quiz.a;
  const app = $("#app");
  const steps = ["Reading your goals", "Matching pro and college drills to your game", "Building your weekly schedule", "Setting nutrition and sleep targets"];
  $("#nav").hidden = true;
  $("#topbar").hidden = true;
  app.innerHTML = `<section class="building"><div class="spinner"></div><h1 class="display">Building your program</h1><ul class="build-steps">${steps.map((s, i) => `<li style="animation-delay:${i * 0.55}s">${s}</li>`).join("")}</ul></section>`;
  const firstTime = !state.profile;
  setTimeout(() => {
    if (a.role === "coach") {
      state.profile = { role: "coach", handle: a.handle };
      state.schedule = null;
    } else {
      state.profile = {
        role: "player", handle: a.handle, age: a.age, heightIn: a.body.heightIn, weightLb: a.body.weightLb, sex: a.sex,
        position: a.position, level: Number(a.level), skillGoals: a.skillGoals && a.skillGoals.length ? a.skillGoals : ["shooting"],
        physicalGoal: a.physicalGoal, strengthGoal: a.strengthGoal, goal: a.goal, diet: a.diet, equipment: a.equipment || [],
        daysPerWeek: Number(a.daysPerWeek), sessionMinutes: Number(a.sessionMinutes), time: a.time, sleepNow: a.sleep, obstacle: a.obstacle,
      };
      state.schedule = recommendSchedule(state.profile);
      state.planStart = today();
      state.lastCommitCheck = addDays(today(), -1);
      state.session = null;
      delete state.mealPlans[today()];
      if (firstTime) state.stats.push({ date: today(), metric: "weight", value: state.profile.weightLb });
    }
    quiz = null;
    if (firstTime) award(20, "Profile complete");
    save();
    location.hash = isPlayer() ? "#plan" : "#home";
    render();
  }, steps.length * 550 + 500);
}

// ---------- Views ----------

function viewPlan() {
  const p = state.profile;
  const focus = weeklyFocus(state.schedule);
  const total = Object.values(focus).reduce((a, b) => a + b, 0) || 1;
  const t = nutritionTargets(p);
  const target = sleepTarget(p.age);
  const skillLabels = { shooting: "Shooting", handles: "Ball handling", finishing: "Finishing", defense: "Defense & rebounding", post: "Post game" };
  const phys = { vertical: "Jump higher", speed: "Speed & quickness", endurance: "Conditioning", durable: "Injury-proofing" };
  const str = { size: "Build muscle", strong: "Strength without bulk", core: "Core & stability", light: "Light (athletic work instead)" };
  const nut = { gain: "Gain weight", lean: "Get leaner", maintain: "Fuel performance", learn: "Learn to eat better" };
  return `
  <section class="plan-hero">
    <p class="eyebrow">Your program</p>
    <h1 class="display">${esc(programName(p))}</h1>
    <p class="muted">${POS[p.position]} · ${LEVELS[p.level]} · ${p.daysPerWeek} days a week · ${p.sessionMinutes} min sessions</p>
  </section>

  <section class="eval-grid">
    <div class="panel"><p class="eyebrow">Skill</p><strong>${p.skillGoals.map((g) => skillLabels[g]).join(" + ")}</strong><p class="muted small">Gets the most sessions each week, built from pro and college drills.</p></div>
    <div class="panel"><p class="eyebrow">Physical</p><strong>${phys[p.physicalGoal]}</strong><p class="muted small">${SESSION_TYPES[p.physicalGoal].label} every week.</p></div>
    <div class="panel"><p class="eyebrow">Strength</p><strong>${str[p.strengthGoal]}</strong><p class="muted small">${p.equipment.includes("weights") ? "Uses your weights." : "Bodyweight versions, no gym needed."}</p></div>
    <div class="panel"><p class="eyebrow">Nutrition</p><strong>${nut[p.goal]}</strong><p class="muted small">${t.kcal} kcal · ${t.protein} g protein a day</p></div>
    <div class="panel ${p.sleepNow < target - 0.5 ? "warn" : ""}"><p class="eyebrow">Sleep</p><strong>${target} hours a night</strong><p class="muted small">${p.sleepNow < target - 0.5 ? `You're at about ${p.sleepNow}. Closing that gap is your easiest win.` : "You're close. Keep it consistent."}</p></div>
  </section>

  <section class="panel">
    <p class="eyebrow">Weekly focus</p>
    <div class="focus-bars">
      ${Object.entries(focus).sort((a, b) => b[1] - a[1]).map(([cat, n]) => `<div class="focus-row"><span>${CATEGORIES[cat].label}</span><div class="bar"><div style="width:${Math.round((n / total) * 100)}%"></div></div><span class="num">${Math.round((n / total) * 100)}%</span></div>`).join("")}
    </div>
  </section>

  <section class="panel">
    <div class="row-between"><p class="eyebrow">Your week</p><a class="link" href="#schedule">Edit</a></div>
    <ul class="week-list">${state.schedule.map((e, i) => `<li><span class="day">${DAY_NAMES[i]}</span><span class="type type-${SESSION_TYPES[e.type].kind}">${SESSION_TYPES[e.type].label}</span><span class="muted small">${e.type === "rest" ? "" : formatTime(e.time)}</span></li>`).join("")}</ul>
  </section>

  <button class="btn primary big" data-action="go" data-to="#home">Start training</button>`;
}

function hud() {
  const L = levelInfo(state.xp);
  const r = rankFor(L.level);
  const x = derived();
  return `
  <section class="hud" style="--c:${r.color}">
    <a class="hud-id" href="#me">
      ${avatar(state.profile.handle, r.color, "lg")}
      <div>
        <strong class="handle">${esc(state.profile.handle)}</strong>
        <span class="rank-pill">${esc(r.label)}</span>
      </div>
    </a>
    ${isPlayer() ? `<div class="streak ${x.streak ? "on" : ""}" title="Best: ${x.bestStreak}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 2 1.3 3 2.5 3.5C11 9 11.5 5 12 2z"/></svg><span class="num">${x.streak}</span></div>` : ""}
    <div class="hud-xp">
      <div class="row-between small"><span><b class="lvl">LVL ${L.level}</b></span><span class="muted num">${L.into} / ${L.span} XP</span></div>
      <div class="bar xp"><div style="width:${L.pct}%"></div></div>
    </div>
  </section>`;
}

function reminderDue() {
  if (!isPlayer() || doneToday()) return false;
  const e = todayEntry();
  if (e.type === "rest" || !e.time) return false;
  const [h, m] = e.time.split(":").map(Number);
  const due = new Date();
  due.setHours(h, m, 0, 0);
  return Date.now() >= due.getTime();
}

function viewHome() {
  if (!isPlayer()) return viewCoachHome();
  const e = todayEntry();
  const s = ensureSession();
  const type = SESSION_TYPES[s.type];
  const mins = s.drills.reduce((n, id) => n + drill(id).minutes, 0);
  const sleptToday = state.sleep.some((n) => n.date === today());
  const plan = ensureMealPlan();
  const eaten = state.mealsEaten[today()] || [];
  const challengeDone = state.challengesDone.includes(today());
  const postedToday = (state.postXpDays[today()] || 0) > 0;
  const q = quoteOfTheDay();
  const R = ratings(state);
  const quests = [
    { done: doneToday(), label: e.type === "rest" ? "Optional: active recovery" : `Finish ${type.label}`, xp: e.type === "rest" ? XP.recovery : XP.workout + XP.onTime, href: "#train" },
    { done: sleptToday, label: "Log last night's sleep", xp: XP.sleepLog + XP.sleepTarget, href: "#sleep" },
    { done: eaten.length >= plan.meals.length, label: `Eat your meal plan (${eaten.length}/${plan.meals.length})`, xp: XP.allMeals, href: "#fuel" },
    { done: challengeDone, label: challengeOfTheDay(), xp: XP.challenge, action: "challenge" },
    { done: postedToday, label: "Share a post or story", xp: XP.post, href: "#feed" },
  ];
  return `
  ${hud()}

  ${reminderDue() ? `<a class="banner" href="#train"><strong>It's past ${formatTime(e.time)}. Time to train.</strong><span>Your ${type.label} is waiting →</span></a>` : ""}

  <section class="mission ${doneToday() ? "complete" : ""}">
    <div class="mission-head">
      <p class="eyebrow">${doneToday() ? "Mission complete" : e.type === "rest" ? "Rest day" : `Today${e.time ? ` · ${formatTime(e.time)}` : ""}`}</p>
      <h2 class="display">${e.type === "rest" && !doneToday() ? "Recover & reset" : type.label}</h2>
      <p class="muted small">${e.type === "rest" && !doneToday() ? "Rest is scheduled. An active recovery session is optional." : `${s.drills.length} drills · ${mins} min · ${s.drills.filter((id) => isProDrill(drill(id))).length} from pro & college programs`}</p>
    </div>
    <a class="btn ${doneToday() ? "ghost" : "primary"}" href="#train">${doneToday() ? "View session" : s.done.length ? "Continue" : "Start"}</a>
  </section>

  <section class="panel">
    <div class="row-between"><p class="eyebrow">Daily quests</p><span class="muted small num">${quests.filter((q) => q.done).length}/${quests.length}</span></div>
    <ul class="quests">
      ${quests.map((qq) => `<li class="${qq.done ? "done" : ""}">
        ${qq.action ? `<button class="quest-check" data-action="${qq.action}" aria-label="Mark done">${qq.done ? "✓" : ""}</button>` : `<span class="quest-check">${qq.done ? "✓" : ""}</span>`}
        ${qq.href ? `<a href="${qq.href}">${esc(qq.label)}</a>` : `<span>${esc(qq.label)}</span>`}
        <span class="xp-tag num">+${qq.xp}</span>
      </li>`).join("")}
    </ul>
  </section>

  <a class="panel ovr-mini" href="#ranks">
    <div class="ovr-num"><span class="num">${R.ovr}</span><small>OVR</small></div>
    <div class="ovr-parts">${Object.entries(R.parts).map(([k, v]) => `<div><span class="num">${v}</span><small>${k}</small></div>`).join("")}</div>
  </a>

  <section class="coach-line"><p>${esc(coachLine())}</p>${hasAI() && state.settings.aiCoach ? `<a class="link" href="#coach">Ask AI Coach →</a>` : ""}</section>

  <section class="quote"><p>“${esc(q.text)}”</p><p class="muted small">${esc(q.by)}</p></section>`;
}

function viewCoachHome() {
  const players = live.players.filter((p) => p.role === "player" && p.week === weekKey()).sort((a, b) => (b.weekXp || 0) - (a.weekXp || 0)).slice(0, 5);
  return `
  ${hud()}
  <section class="mission">
    <div class="mission-head">
      <p class="eyebrow">Coach HQ</p>
      <h2 class="display">Share a drill</h2>
      <p class="muted small">Post drills, advice and short clips for your players.</p>
    </div>
    <a class="btn primary" href="#feed">Post</a>
  </section>
  <section class="panel">
    <p class="eyebrow">Top players this week</p>
    ${players.length ? `<ol class="board">${players.map((p, i) => `<li><span class="pos num">${i + 1}</span>${avatar(p.handle, p.color)}<span class="who"><strong>${esc(String(p.handle).slice(0, 20))}</strong><small>${esc(String(p.rank || "").slice(0, 20))}</small></span><span class="val num">${Number(p.weekXp) || 0} XP</span></li>`).join("")}</ol>`
      : `<p class="muted small">${hasSocial() ? "No player activity yet this week. Share the Courtside link with your team." : "Leaderboards appear when Courtside is opened from its Claude link."}</p>`}
  </section>
  <section class="quote"><p>“${esc(quoteOfTheDay().text)}”</p><p class="muted small">${esc(quoteOfTheDay().by)}</p></section>`;
}

function weekStrip() {
  const t = today();
  const start = addDays(t, -new Date().getDay());
  const done = new Set(state.workouts.map((w) => w.date));
  return `<div class="week-strip">${state.schedule.map((e, i) => {
    const k = addDays(start, i);
    const kind = SESSION_TYPES[e.type].kind;
    const status = done.has(k) ? "done" : k < t && kind !== "rest" && k >= (state.planStart || t) ? "missed" : k === t ? "today" : "";
    return `<div class="wday ${status} kind-${kind}"><span class="wd">${DAY_NAMES[i].charAt(0)}</span><span class="wn num">${parseKey(k).getDate()}</span><span class="wt">${SESSION_TYPES[e.type].short}</span></div>`;
  }).join("")}</div>`;
}

function viewTrain() {
  if (!isPlayer()) return viewCoachHome();
  const s = ensureSession();
  const t = SESSION_TYPES[s.type];
  const total = s.drills.reduce((n, id) => n + drill(id).minutes, 0);
  const doneMin = s.drills.filter((id) => s.done.includes(id)).reduce((n, id) => n + drill(id).minutes, 0);
  const pct = total ? Math.round((doneMin / total) * 100) : 0;
  const shots = Object.values(s.shots).reduce((n, x) => n + x.a, 0);
  const makes = Object.values(s.shots).reduce((n, x) => n + x.m, 0);
  const last = state.workouts[state.workouts.length - 1];
  const swapTypes = Object.keys(SESSION_TYPES).filter((k) => k !== "rest");

  return `
  <section class="page-head row-between">
    <div><p class="eyebrow">This week</p><h1 class="display">Train</h1></div>
    <a class="btn small ghost" href="#schedule">Edit schedule</a>
  </section>
  ${weekStrip()}

  ${s.finished && last && last.date === s.date ? `
  <section class="result">
    <p class="eyebrow">Session complete</p>
    <h2 class="display">${esc(t.label)}</h2>
    <div class="result-stats">
      <div><span class="num">${last.minutes}</span><small>min</small></div>
      <div><span class="num">${last.drills.length}</span><small>drills</small></div>
      <div><span class="num">${last.shots ? `${last.makes}/${last.shots}` : "—"}</span><small>shots</small></div>
      <div><span class="num">+${last.xp}</span><small>XP</small></div>
    </div>
    <div class="actions">
      <button class="btn primary" data-action="story-workout">Post to my story</button>
      <button class="btn ghost" data-action="save-story">Save image for Instagram / TikTok</button>
      ${hasAI() && state.settings.aiCoach ? `<button class="btn ghost" data-action="analyze" data-ts="${last.ts}">Analyze with AI Coach</button>` : ""}
    </div>
  </section>` : ""}

  <section class="panel session-head">
    <div class="row-between">
      <div><p class="eyebrow">Today's session</p><h2>${esc(t.label)}</h2></div>
      <span class="muted small num">${doneMin}/${total} min</span>
    </div>
    <div class="bar"><div style="width:${pct}%"></div></div>
    ${shots ? `<p class="small muted">Shots this session: <b class="num">${makes}/${shots}</b> (${Math.round((makes / shots) * 100)}%)</p>` : ""}
    ${!s.finished ? `<label class="swap" for="swap-type">Swap session
      <select id="swap-type" data-action-change="swap">${swapTypes.map((k) => `<option value="${k}" ${k === s.type ? "selected" : ""}>${SESSION_TYPES[k].label}</option>`).join("")}</select></label>` : ""}
  </section>

  <ol class="drills">
    ${s.drills.map((id, i) => {
      const d = drill(id);
      const done = s.done.includes(id);
      const sh = s.shots[id] || { m: 0, a: 0 };
      return `
      <li class="drill ${done ? "done" : ""} ${isProDrill(d) ? "pro" : ""}">
        <button class="check" data-action="toggle-drill" data-id="${id}" aria-label="Mark ${esc(d.name)} done">${done ? "✓" : i + 1}</button>
        <div class="drill-body">
          <div class="drill-head"><strong>${esc(d.name)}</strong><span class="tag">${CATEGORIES[d.cat].label} · ${d.minutes} min</span></div>
          ${isProDrill(d) ? `<p class="credit">${esc(d.src)}</p>` : ""}
          <p class="muted small">${esc(d.how)}</p>
          <div class="drill-tools">
            <button class="btn small ghost" data-action="timer" data-id="${id}">Timer</button>
            ${isShootingDrill(d) && !s.finished ? `
              <div class="shot-tracker">
                <button class="btn small" data-action="shot" data-id="${id}" data-made="1">+ Make</button>
                <button class="btn small ghost" data-action="shot" data-id="${id}" data-made="0">+ Miss</button>
                <span class="num small">${sh.m}/${sh.a}</span>
                ${sh.a ? `<button class="link small" data-action="shot-undo" data-id="${id}" aria-label="Undo last shot">Undo</button>` : ""}
              </div>` : ""}
          </div>
        </div>
      </li>`;
    }).join("")}
  </ol>

  ${!s.finished ? `<div class="actions"><button class="btn ghost" data-action="shuffle">Shuffle drills</button><button class="btn primary" data-action="finish">Finish & claim XP</button></div>` : ""}

  <section>
    <h2 class="section-title">History</h2>
    ${state.workouts.length ? `<ul class="list">${state.workouts.slice(-8).reverse().map((w) => `
      <li><span class="muted">${prettyDate(w.date)}</span><span>${esc(SESSION_TYPES[w.type]?.label || w.type)}${w.shots ? ` · ${w.makes}/${w.shots}` : ""}</span><strong class="num">+${w.xp}</strong>
      ${hasAI() && state.settings.aiCoach ? `<button class="link small" data-action="analyze" data-ts="${w.ts}">Analyze</button>` : ""}</li>`).join("")}</ul>`
      : `<p class="muted small">Finish your first session to start your history.</p>`}
  </section>`;
}

function nextWorkout() {
  const now = new Date();
  for (let d = 0; d < 8; d++) {
    const when = new Date(now);
    when.setDate(now.getDate() + d);
    const e = state.schedule[when.getDay()];
    if (e.type === "rest" || !e.time) continue;
    const [h, m] = e.time.split(":").map(Number);
    when.setHours(h, m, 0, 0);
    if (when <= now || (d === 0 && doneToday())) continue;
    return { e, when };
  }
  return null;
}

function countdown(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h ? `${h}h ${mins % 60}m` : `${mins}m`;
}

function splitTime(hhmm) {
  const [t, ampm] = formatTime(hhmm).split(" ");
  return `${t}<small>${ampm}</small>`;
}

function viewSchedule() {
  if (!isPlayer()) return viewCoachHome();
  const types = Object.keys(SESSION_TYPES);
  const r = rankFor(levelInfo(state.xp).level);
  const next = nextWorkout();
  const wk = weekKey();
  const trainDays = state.schedule.filter((e) => e.type !== "rest").length;
  const alarms = state.schedule.filter((e) => e.type !== "rest" && e.alarm).length;
  return `
  <section class="page-head"><p class="eyebrow">Your week</p><h1 class="display">Schedule</h1></section>

  <section class="game-card next-card" style="--c:${r.color}">
    <div class="pc-top">
      <div class="pc-ovr next-time"><span class="num">${next ? splitTime(next.e.time) : "—"}</span><small>${next ? DAY_NAMES[next.when.getDay()] : "No workouts"}</small></div>
      <div class="pc-id"><strong class="display">${next ? esc(SESSION_TYPES[next.e.type].label) : "Rest week"}</strong><span>${next ? `Next ${next.e.alarm ? "alarm" : "reminder"} in <b class="num" id="next-countdown">${countdown(next.when - Date.now())}</b>` : "Add a session below"}</span></div>
      <div class="pc-tier">${next && next.e.alarm ? "Alarm on" : "Reminder"}</div>
    </div>
    <div class="pc-parts" style="grid-template-columns:repeat(4,1fr)">
      <div><span class="num">${trainDays}</span><small>Days</small></div>
      <div><span class="num">${alarms}</span><small>Alarms</small></div>
      <div><span class="num">${state.keptDates.filter((k) => weekKey(parseKey(k)) === wk).length}</span><small>Kept</small></div>
      <div><span class="num">${derived().streak}</span><small>Streak</small></div>
    </div>
  </section>

  <ul class="sched">
    ${state.schedule.map((e, i) => `
    <li class="${i === new Date().getDay() ? "is-today" : ""} kind-${SESSION_TYPES[e.type].kind}">
      <span class="day">${DAY_NAMES[i]}</span>
      <select id="sched-type-${i}" data-sched="type" data-day="${i}" aria-label="${DAY_NAMES[i]} session">${types.map((k) => `<option value="${k}" ${k === e.type ? "selected" : ""}>${SESSION_TYPES[k].label}</option>`).join("")}</select>
      ${e.type === "rest" ? `<span class="muted small">No workout</span>` : `<input id="sched-time-${i}" type="time" data-sched="time" data-day="${i}" value="${e.time || ""}" aria-label="${DAY_NAMES[i]} time">`}
      ${e.type === "rest" ? "" : `<label class="switch" for="sched-alarm-${i}"><input id="sched-alarm-${i}" type="checkbox" data-sched="alarm" data-day="${i}" ${e.alarm ? "checked" : ""}><span>Alarm</span></label>`}
    </li>`).join("")}
  </ul>

  <section class="panel">
    <p class="eyebrow">Reminders & alarms</p>
    <p class="small">At each workout time, Courtside shows a reminder. Days with <b>Alarm</b> on also ring a sound until you get up.</p>
    <p class="small muted">The in-app alarm only rings while Courtside is open. For a 6 AM workout, leave it open on your charger with “Keep screen awake” on, or add your schedule to your phone's calendar to get alerts even when the app is closed.</p>
    <div class="actions">
      <button class="btn primary" data-action="ics">Add schedule to my phone calendar</button>
      <button class="btn ghost" data-action="test-alarm">Test alarm</button>
      <button class="btn ghost" data-action="wake">${wakeLock ? "Screen stays awake ✓" : "Keep screen awake"}</button>
    </div>
  </section>

  <button class="btn ghost" data-action="reset-schedule">Reset to my recommended week</button>`;
}

function viewFuel() {
  if (!isPlayer()) return viewCoachHome();
  const k = today();
  const t = nutritionTargets(state.profile);
  const plan = ensureMealPlan();
  const eaten = state.mealsEaten[k] || [];
  const meals = plan.meals.map(planMeal);
  const eatenSum = (f) => meals.reduce((n, m, i) => n + (eaten.includes(i) ? m[f] : 0), 0);
  const macro = (label, have, want, unit, cls) => `<div class="macro ${cls}"><div class="row-between small"><span>${label}</span><span class="num">${have}/${want}${unit}</span></div><div class="bar"><div style="width:${Math.min(100, Math.round((have / want) * 100))}%"></div></div></div>`;
  const slot = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
  return `
  <section class="page-head"><p class="eyebrow">Nutrition</p><h1 class="display">Fuel</h1></section>
  <section class="panel targets">
    <div><span class="num">${t.kcal}</span><small>kcal</small></div>
    <div><span class="num">${t.protein}g</span><small>protein</small></div>
    <div><span class="num">${t.carbs}g</span><small>carbs</small></div>
    <div><span class="num">${t.fat}g</span><small>fat</small></div>
    <div><span class="num">${t.waterOz}oz</span><small>water</small></div>
  </section>
  <section class="panel">
    ${macro("Calories", eatenSum("kcal"), t.kcal, "", "kcal")}
    ${macro("Protein", eatenSum("p"), t.protein, "g", "protein")}
    ${macro("Carbs", eatenSum("c"), t.carbs, "g", "carbs")}
    ${macro("Fat", eatenSum("f"), t.fat, "g", "fat")}
  </section>
  <ul class="meals">
    ${meals.map((m, i) => `
    <li class="meal ${eaten.includes(i) ? "done" : ""}">
      <button class="check" data-action="toggle-meal" data-i="${i}" aria-label="Mark eaten">${eaten.includes(i) ? "✓" : ""}</button>
      <div class="drill-body">
        <p class="eyebrow">${slot[plan.meals[i].slot]}</p>
        <strong>${esc(m.name)}${m.servings !== 1 ? ` <span class="tag">${m.servings}× portion</span>` : ""}</strong>
        <ul class="items">${m.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
        <p class="muted small num">${m.kcal} kcal · ${m.p}P / ${m.c}C / ${m.f}F</p>
      </div>
    </li>`).join("")}
  </ul>
  <div class="actions"><button class="btn ghost" data-action="new-meals">New meal plan</button></div>
  <section class="panel tips"><p class="eyebrow">Fuel tips</p><ul>
    <li>Eat a carb-heavy meal 2–3 hours before you train or play.</li>
    <li>Within an hour after training, get protein and carbs. Chocolate milk works.</li>
    <li>Sip water all day. Even mild dehydration hurts your shooting and decision-making.</li>
  </ul><p class="muted small">Targets are estimates, not medical advice. Check with a coach, trainer or doctor before big diet changes.</p></section>`;
}

function viewSleep() {
  if (!isPlayer()) return viewCoachHome();
  const target = sleepTarget(state.profile.age);
  const nights = state.sleep.slice(-14);
  const avg = nights.length ? Math.round((nights.reduce((n, s) => n + s.hours, 0) / nights.length) * 10) / 10 : 0;
  const hits = nights.filter((n) => n.hours >= target - 0.25).length;
  const max = Math.max(target + 2, ...nights.map((n) => n.hours));
  const last = state.sleep[state.sleep.length - 1];
  return `
  <section class="page-head"><p class="eyebrow">Recovery</p><h1 class="display">Sleep</h1>
  <p class="muted">Your target: <b>${target} hours</b> a night.</p></section>

  <form id="sleep-form" class="panel sleep-form">
    <p class="eyebrow">Log last night</p>
    <div class="field-grid">
      <label for="sleep-bed">Went to bed<input id="sleep-bed" name="bed" type="time" value="${last ? last.bed : "22:30"}" required></label>
      <label for="sleep-wake">Woke up<input id="sleep-wake" name="wake" type="time" value="${last ? last.wake : "07:00"}" required></label>
      <label for="sleep-quality">How did you feel?<select id="sleep-quality" name="quality">
        <option value="5">Great</option><option value="4" selected>Good</option><option value="3">OK</option><option value="2">Tired</option><option value="1">Exhausted</option>
      </select></label>
    </div>
    <button class="btn primary" type="submit">Log sleep</button>
  </form>

  <section class="panel">
    <div class="row-between"><p class="eyebrow">Last 14 nights</p><span class="muted small">avg <b class="num">${avg || "—"}</b> h · target hit ${hits}/${nights.length}</span></div>
    ${nights.length ? `<div class="sleep-chart" style="--target:${(target / max) * 100}%">
      ${nights.map((n) => `<div class="sbar ${n.hours >= target - 0.25 ? "hit" : ""}" title="${prettyDate(n.date)}: ${n.hours} h"><div style="height:${(n.hours / max) * 100}%"></div><small class="num">${parseKey(n.date).getDate()}</small></div>`).join("")}
      <span class="target-line"></span>
    </div>` : `<p class="muted small">Log your first night to see your chart.</p>`}
  </section>

  <section class="panel tips"><p class="eyebrow">Why it matters</p>
    <p class="small">When Stanford's men's basketball players extended their sleep to about 10 hours a night for 5–7 weeks, their sprint times dropped from 16.2 to 15.5 seconds and their free throw and three-point shooting each improved by about 9%.</p>
    <p class="muted small">Source: Mah et al., SLEEP (2011).</p>
  </section>`;
}

// ---------- Feed ----------

let feedFilter = "all";
let composerKind = "drill";
const openComments = new Set();

function allPosts() {
  const me = cloud.uid || "me";
  const docs = hasSocial() ? live.feeds.filter((d) => d.id !== me) : [];
  const out = [];
  for (const d of docs) {
    for (const p of Array.isArray(d.posts) ? d.posts : []) {
      if (!p || typeof p.id !== "string") continue;
      out.push({ ...p, uid: d.id, handle: String(d.handle || "Player").slice(0, 20), role: d.role === "coach" ? "coach" : "player" });
    }
  }
  for (const p of state.myPosts) out.push({ ...p, uid: me, handle: state.profile.handle, role: state.profile.role, mine: true });
  return out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

const postKey = (p) => `${p.uid}:${p.id}`;

function cheerCount(key) {
  let n = state.myCheers.includes(key) ? 1 : 0;
  for (const d of live.cheers) if (d.id !== cloud.uid && Array.isArray(d.ids) && d.ids.includes(key)) n++;
  return n;
}

function commentsFor(key) {
  const handles = {};
  for (const f of live.feeds) handles[f.id] = f.handle;
  for (const p of live.players) handles[p.id] = handles[p.id] || p.handle;
  const out = state.myComments.filter((c) => c.key === key).map((c) => ({ ...c, handle: state.profile.handle }));
  for (const d of live.comments) {
    if (d.id === cloud.uid || !Array.isArray(d.items)) continue;
    for (const c of d.items) if (c && c.key === key) out.push({ text: String(c.text || "").slice(0, 300), ts: c.ts, handle: String(handles[d.id] || "Player").slice(0, 20) });
  }
  return out.sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

function mediaHtml(m) {
  if (!m || !/^[\w-]+$/.test(m.id || "")) return "";
  const src = `/_blob/${m.id}`;
  return m.type === "video" ? `<video class="media" src="${src}" controls playsinline preload="metadata"></video>` : `<img class="media" src="${src}" alt="Post media" loading="lazy">`;
}

function workoutCardHtml(c) {
  if (!c) return "";
  return `<div class="wcard"><p class="eyebrow">Workout complete</p><strong>${esc(String(c.label || "").slice(0, 40))}</strong>
    <div class="result-stats small-stats"><div><span class="num">${Number(c.minutes) || 0}</span><small>min</small></div><div><span class="num">${Number(c.drills) || 0}</span><small>drills</small></div><div><span class="num">${c.shots ? `${Number(c.makes) || 0}/${Number(c.shots)}` : "—"}</span><small>shots</small></div><div><span class="num">${Number(c.streak) || 0}</span><small>streak</small></div></div></div>`;
}

function viewFeed() {
  const posts = allPosts();
  const dayAgo = Date.now() - 86400000;
  const stories = posts.filter((p) => p.kind === "story" && p.ts > dayAgo);
  const storyAuthors = [];
  for (const p of stories) if (!storyAuthors.find((a) => a.uid === p.uid)) storyAuthors.push({ uid: p.uid, handle: p.handle, color: p.color, mine: p.mine });
  storyAuthors.sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0));
  const filters = { all: "All", drill: "Drills", advice: "Advice", win: "Wins", coach: "Coaches" };
  const list = posts.filter((p) => p.kind !== "story").filter((p) => feedFilter === "all" || (feedFilter === "coach" ? p.role === "coach" : p.kind === feedFilter));
  const kinds = { drill: "Drill", advice: "Advice", win: "Win", story: "Story (24h)" };

  return `
  <section class="page-head"><p class="eyebrow">Community</p><h1 class="display">Feed</h1></section>

  <div class="stories">
    ${!storyAuthors.some((a) => a.mine) ? `<button class="story-av add" data-action="compose-story">${avatar(state.profile.handle, rankFor(levelInfo(state.xp).level).color, "lg")}<span>Your story</span></button>` : ""}
    ${storyAuthors.map((a) => `<button class="story-av ring" data-action="open-story" data-uid="${esc(a.uid)}">${avatar(a.handle, a.color, "lg")}<span>${a.mine ? "Your story" : esc(a.handle)}</span></button>`).join("")}
  </div>

  ${!hasSocial() ? `<p class="notice small">You're seeing only your own posts. Open Courtside from its Claude link to see posts from other players and coaches.</p>` : ""}

  <form id="post-form" class="panel composer">
    <div class="chips">${Object.entries(kinds).map(([k, l]) => `<button type="button" class="chip ${composerKind === k ? "active" : ""}" data-action="kind" data-kind="${k}">${l}</button>`).join("")}</div>
    <label class="sr" for="post-text">Post text</label>
    <textarea id="post-text" name="text" maxlength="500" rows="3" placeholder="${state.profile.role === "coach" ? "Share a drill, a teaching point, or advice for your players" : "Share a drill, a tip, or a win"}"></textarea>
    <div class="composer-row">
      ${cloud.assets ? `<label class="btn small ghost file-btn" for="post-media">Add photo or video<input id="post-media" type="file" accept="image/*,video/*" hidden></label><span id="media-name" class="muted small"></span>` : ""}
      ${isPlayer() && state.workouts.length ? `<label class="toggle small" for="post-attach"><input id="post-attach" type="checkbox"><span>Attach my last workout</span></label>` : ""}
      <button class="btn primary" type="submit">Post</button>
    </div>
  </form>

  <div class="chips">${Object.entries(filters).map(([k, l]) => `<button class="chip ${feedFilter === k ? "active" : ""}" data-action="filter" data-f="${k}">${l}</button>`).join("")}</div>

  <ul class="posts">
    ${list.length ? list.map((p) => {
      const key = postKey(p);
      const cheered = state.myCheers.includes(key);
      const comments = commentsFor(key);
      return `
      <li class="post">
        <div class="post-head">${avatar(p.handle, p.color)}
          <div class="who"><span class="name-line"><strong>${esc(p.handle)}</strong>${p.role === "coach" ? `<span class="coach-badge">Coach</span>` : ""}</span><small>${esc(String(p.rank || "").slice(0, 20))} · ${timeAgo(p.ts)}</small></div>
          <span class="tag kind-${esc(p.kind)}">${esc(kinds[p.kind] || "")}</span>
        </div>
        ${p.text ? `<p class="post-text">${esc(String(p.text).slice(0, 500))}</p>` : ""}
        ${mediaHtml(p.media)}
        ${workoutCardHtml(p.card)}
        <div class="post-actions">
          <button class="react ${cheered ? "on" : ""}" data-action="cheer" data-key="${esc(key)}">🔥 <span class="num">${cheerCount(key)}</span></button>
          <button class="react" data-action="toggle-comments" data-key="${esc(key)}">Comments <span class="num">${comments.length}</span></button>
          ${p.mine ? `<button class="link small" data-action="delete-post" data-id="${esc(p.id)}">Delete</button>` : cloud.isOwner ? `<button class="link small" data-action="remove-post" data-uid="${esc(p.uid)}" data-id="${esc(p.id)}">Remove</button>` : ""}
        </div>
        ${openComments.has(key) ? `
        <div class="comments">
          ${comments.map((c) => `<p><strong>${esc(c.handle)}</strong> ${esc(c.text)}</p>`).join("")}
          <form class="comment-form" data-key="${esc(key)}"><input id="c-${esc(key.replace(/[^\w-]/g, "_"))}" name="text" maxlength="300" placeholder="Add a comment" aria-label="Comment"><button class="btn small" type="submit">Send</button></form>
        </div>` : ""}
      </li>`;
    }).join("") : `<li class="empty muted">No posts here yet. Be the first to share a drill or a win.</li>`}
  </ul>`;
}

async function submitPost(form) {
  const text = form.querySelector("#post-text").value.trim();
  const file = form.querySelector("#post-media")?.files?.[0];
  const attach = form.querySelector("#post-attach")?.checked;
  if (!text && !file && !attach) return toast("Write something, add media, or attach a workout.");
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  let media = null;
  if (file) {
    btn.textContent = "Uploading…";
    try {
      const res = await uploadMedia(file);
      media = { id: res.id, type: file.type.startsWith("video") ? "video" : "image" };
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "Post";
      return toast(e && e.code === "too_large" ? "That file is too big. Try a shorter clip." : "Upload failed. Check the file type and try again.");
    }
  }
  const last = state.workouts[state.workouts.length - 1];
  addPost({ kind: composerKind, text: text.slice(0, 500), media, card: attach && last ? cardFromWorkout(last) : null });
}

function cardFromWorkout(w) {
  return { label: SESSION_TYPES[w.type]?.label || "Workout", minutes: w.minutes, drills: w.drills.length, shots: w.shots, makes: w.makes, streak: derived().streak, xp: w.xp };
}

function addPost(p) {
  const r = rankFor(levelInfo(state.xp).level);
  const post = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: Date.now(), rank: r.label, color: r.color, ...p };
  state.myPosts.push(post);
  state.myPosts = state.myPosts.slice(-30);
  state.postsMade = (state.postsMade || 0) + 1;
  const n = state.postXpDays[today()] || 0;
  if (n < 3) award(XP.post, post.kind === "story" ? "Story posted" : "Posted");
  state.postXpDays[today()] = n + 1;
  checkBadges();
  save();
  saveMyFeed(state.profile.handle, state.profile.role, state.myPosts);
  toast(post.kind === "story" ? "Added to your story" : "Posted");
  render();
}

// ---------- Stories ----------

let storyView = null;

function openStory(uid) {
  const dayAgo = Date.now() - 86400000;
  const items = allPosts().filter((p) => p.kind === "story" && p.uid === uid && p.ts > dayAgo).reverse();
  if (!items.length) return;
  closeStory();
  storyView = { items, i: 0, timer: null };
  const el = document.createElement("div");
  el.className = "story-viewer";
  document.body.appendChild(el);
  storyView.el = el;
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) return closeStory();
    if (e.target.closest("video")) return;
    const x = e.clientX / window.innerWidth;
    storyStep(x < 0.3 ? -1 : 1);
  });
  drawStory();
}

function drawStory() {
  const { items, i, el } = storyView;
  const p = items[i];
  el.innerHTML = `
    <div class="story-bars">${items.map((_, j) => `<span class="${j < i ? "full" : j === i ? "run" : ""}"></span>`).join("")}</div>
    <div class="story-top">${avatar(p.handle, p.color)}<strong>${esc(p.handle)}</strong><small>${timeAgo(p.ts)}</small><button class="link" data-close aria-label="Close">✕</button></div>
    <div class="story-body" style="--c:${safeColor(p.color)}">
      ${p.card ? `<p class="eyebrow">Workout complete</p><h2 class="display">${esc(String(p.card.label || "").slice(0, 40))}</h2>
        <div class="story-stats"><div><span class="num">${Number(p.card.minutes) || 0}</span><small>minutes</small></div><div><span class="num">${p.card.shots ? `${Number(p.card.makes) || 0}/${Number(p.card.shots)}` : Number(p.card.drills) || 0}</span><small>${p.card.shots ? "shots made" : "drills"}</small></div><div><span class="num">${Number(p.card.streak) || 0}</span><small>day streak</small></div></div>` : ""}
      ${mediaHtml(p.media)}
      ${p.text ? `<p class="story-text">${esc(String(p.text).slice(0, 500))}</p>` : ""}
      <p class="story-rank">${esc(String(p.rank || "").slice(0, 20))}</p>
    </div>`;
  clearTimeout(storyView.timer);
  storyView.timer = setTimeout(() => storyStep(1), 5000);
}

function storyStep(d) {
  if (!storyView) return;
  const n = storyView.i + d;
  if (n < 0) return;
  if (n >= storyView.items.length) return closeStory();
  storyView.i = n;
  drawStory();
}

function closeStory() {
  if (!storyView) return;
  clearTimeout(storyView.timer);
  storyView.el.remove();
  storyView = null;
}

// Story image sized for Instagram and TikTok stories (1080 × 1920)
async function storyImage(w) {
  try {
    await document.fonts.ready;
  } catch {}
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1920;
  const g = c.getContext("2d");
  const r = rankFor(levelInfo(state.xp).level);
  const grad = g.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, "#ff6a13");
  grad.addColorStop(0.55, "#2a1206");
  grad.addColorStop(1, "#0d0f14");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1080, 1920);
  g.strokeStyle = "rgba(255,255,255,0.12)";
  g.lineWidth = 14;
  g.beginPath();
  g.arc(540, 700, 380, 0, Math.PI * 2);
  g.moveTo(160, 700);
  g.lineTo(920, 700);
  g.moveTo(540, 320);
  g.lineTo(540, 1080);
  g.stroke();
  const display = '"Big Shoulders Display", "Arial Narrow", Impact, sans-serif';
  const body = 'Barlow, "Helvetica Neue", Arial, sans-serif';
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.font = `800 64px ${display}`;
  g.fillText("COURTSIDE", 540, 160);
  g.font = `600 44px ${body}`;
  g.fillText("WORKOUT COMPLETE", 540, 560);
  g.font = `900 150px ${display}`;
  g.fillText((SESSION_TYPES[w.type]?.label || "Workout").toUpperCase(), 540, 740, 980);
  const stats = [
    [String(w.minutes), "MINUTES"],
    [w.shots ? `${w.makes}/${w.shots}` : String(w.drills.length), w.shots ? "SHOTS MADE" : "DRILLS"],
    [String(derived().streak), "DAY STREAK"],
  ];
  stats.forEach(([v, l], i) => {
    const x = 200 + i * 340;
    g.font = `900 130px ${display}`;
    g.fillText(v, x, 1240, 320);
    g.font = `600 34px ${body}`;
    g.fillStyle = "rgba(255,255,255,0.75)";
    g.fillText(l, x, 1300);
    g.fillStyle = "#fff";
  });
  g.fillStyle = r.color;
  g.font = `800 72px ${display}`;
  g.fillText(r.label.toUpperCase(), 540, 1520);
  g.fillStyle = "#fff";
  g.font = `600 48px ${body}`;
  g.fillText(`@${state.profile.handle}`, 540, 1610);
  g.font = `600 40px ${body}`;
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.fillText(`+${w.xp} XP`, 540, 1690);
  return new Promise((res) => c.toBlob(res, "image/png"));
}

// ---------- Ranks ----------

let board = "weekXp";

function viewRanks() {
  const L = levelInfo(state.xp);
  const r = rankFor(L.level);
  const wk = weekKey();
  const boards = {
    weekXp: { label: "Weekly XP", val: (p) => (p.week === wk ? Number(p.weekXp) || 0 : 0), unit: "XP" },
    weekMakes: { label: "Shots made", val: (p) => (p.week === wk ? Number(p.weekMakes) || 0 : 0), unit: "made" },
    kept: { label: "Commitments", val: (p) => Number(p.kept) || 0, unit: "kept" },
    streak: { label: "Streak", val: (p) => Number(p.streak) || 0, unit: "days" },
    xp: { label: "Level", val: (p) => Number(p.xp) || 0, unit: "XP", show: (p) => `LVL ${Number(p.level) || 1}` },
  };
  const b = boards[board];
  let rows = hasSocial() ? live.players.filter((p) => p.role === "player" && typeof p.handle === "string") : [];
  const myId = cloud.uid || "me";
  if (isPlayer() && !rows.some((p) => p.id === myId)) {
    // Show your own row right away, before the shared copy syncs
    const wkW = state.workouts.filter((w) => weekKey(parseKey(w.date)) === wk);
    rows.push({ id: myId, handle: state.profile.handle, rank: r.label, color: r.color, level: L.level, xp: state.xp, week: wk, weekXp: state.xpWeek[wk] || 0, weekMakes: wkW.reduce((n, w) => n + (w.makes || 0), 0), kept: state.keptDates.length, streak: derived().streak });
  }
  rows = rows.map((p) => ({ ...p, v: b.val(p) })).sort((a, c) => c.v - a.v).slice(0, 50);
  const R = isPlayer() ? ratings(state) : null;
  const tierNow = Math.min(Math.floor(r.idx / 3), TIERS.length - 1);

  return `
  <section class="page-head"><p class="eyebrow">Compete</p><h1 class="display">Ranks</h1></section>

  ${isPlayer() ? `
  <section class="player-card" style="--c:${r.color}">
    <div class="pc-top">
      <div class="pc-ovr"><span class="num">${R.ovr}</span><small>OVR</small></div>
      <div class="pc-id"><strong class="display">${esc(state.profile.handle)}</strong><span>${POS[state.profile.position]} · LVL ${L.level}</span></div>
      <div class="pc-tier">${esc(r.label)}</div>
    </div>
    <div class="pc-parts">${Object.entries(R.parts).map(([k, v]) => `<div><span class="num">${v}</span><small>${k}</small></div>`).join("")}</div>
    <p class="muted small">Ratings come from what you log: shooting %, training, commitments kept and sleep.</p>
  </section>` : ""}

  <section class="tier-ladder" aria-label="Rank tiers">
    ${TIERS.map((t, i) => `<div class="tier ${tierNow === i ? "current" : ""} ${i < tierNow ? "passed" : ""}" style="--c:${t.color}"><span></span><small>${t.name}</small></div>`).join("")}
  </section>

  <div class="chips">${Object.entries(boards).map(([k, x]) => `<button class="chip ${board === k ? "active" : ""}" data-action="board" data-b="${k}">${x.label}</button>`).join("")}</div>

  <ol class="board">
    ${rows.map((p, i) => `<li class="${p.id === myId ? "me" : ""}">
      <span class="pos num">${i + 1}</span>${avatar(p.handle, p.color)}
      <span class="who"><strong>${esc(String(p.handle).slice(0, 20))}</strong><small>${esc(String(p.rank || "").slice(0, 20))}</small></span>
      <span class="val num">${b.show ? b.show(p) : `${p.v} ${b.unit}`}</span>
    </li>`).join("")}
  </ol>
  ${!hasSocial() ? `<p class="notice small">Leaderboards fill in when Courtside is opened from its Claude link and your teammates join.</p>` : rows.length <= 1 ? `<p class="notice small">You're the only one here so far. Share the link with your team to compete.</p>` : ""}`;
}

// ---------- Me ----------

let selectedMetric = "vertical";

function lineChart(points, unit) {
  if (points.length < 2) return `<p class="muted small">Log at least two entries to see your trend.</p>`;
  const W = 320, H = 140, P = 26;
  const vals = points.map((p) => p.value);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const x = (i) => P + (i * (W - P * 2)) / (points.length - 1);
  const y = (v) => H - P - ((v - min) / (max - min)) * (H - P * 2);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress chart">
    <path d="${path} L${x(points.length - 1)},${H - P} L${x(0)},${H - P} Z" class="chart-area"/>
    <path d="${path}" class="chart-line"/>
    ${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="3.5" class="chart-dot"><title>${prettyDate(p.date)}: ${p.value} ${unit}</title></circle>`).join("")}
    <text x="${P}" y="${H - 6}" class="chart-label">${prettyDate(points[0].date)}</text>
    <text x="${W - P}" y="${H - 6}" class="chart-label" text-anchor="end">${prettyDate(points[points.length - 1].date)}</text>
    <text x="2" y="${y(max) + 4}" class="chart-label">${max}</text><text x="2" y="${y(min) + 4}" class="chart-label">${min}</text>
  </svg>`;
}

function viewMe() {
  const p = state.profile;
  const L = levelInfo(state.xp);
  const r = rankFor(L.level);
  const metric = METRICS[selectedMetric];
  const points = state.stats.filter((s) => s.metric === selectedMetric).sort((a, b) => (a.date < b.date ? -1 : 1));
  const x = isPlayer() ? derived() : null;
  return `
  <section class="page-head">
    <div class="me-id">${avatar(p.handle, r.color, "lg")}<div><h1 class="display">${esc(p.handle)}</h1><p class="muted small">${p.role === "coach" ? "Coach" : `${POS[p.position]} · ${esc(programName(p))}`} · ${esc(r.label)}</p></div></div>
  </section>

  <div class="actions">
    ${isPlayer() ? `<a class="btn ghost" href="#plan">View my plan</a><a class="btn ghost" href="#sleep">Sleep log</a>` : ""}
    <button class="btn ghost" data-action="retake">Retake quiz</button>
  </div>

  ${isPlayer() ? `
  <div class="stat-row">
    <div class="panel stat"><span class="num">${state.workouts.length}</span><small>workouts</small></div>
    <div class="panel stat"><span class="num">${x.kept}</span><small>kept</small></div>
    <div class="panel stat"><span class="num">${x.makes}</span><small>shots made</small></div>
    <div class="panel stat"><span class="num">${x.bestStreak}</span><small>best streak</small></div>
  </div>

  <section class="panel">
    <p class="eyebrow">Progress</p>
    <div class="chips">${Object.entries(METRICS).map(([k, m]) => `<button class="chip ${k === selectedMetric ? "active" : ""}" data-action="metric" data-metric="${k}">${m.label}</button>`).join("")}</div>
    ${lineChart(points, metric.unit)}
    <form id="stat-form" class="inline-form">
      <input id="stat-value" name="value" type="number" step="0.1" required placeholder="${metric.label} (${metric.unit})" aria-label="${metric.label}">
      <input id="stat-date" name="date" type="date" value="${today()}" max="${today()}" required aria-label="Date">
      <button class="btn primary" type="submit">Log</button>
    </form>
  </section>` : ""}

  <section>
    <h2 class="section-title">Badges <span class="muted small">${state.badges.length}/${BADGES.length}</span></h2>
    <div class="badges">${BADGES.map((b) => `<div class="badge ${state.badges.includes(b.id) ? "got" : ""}"><strong>${b.name}</strong><small>${b.desc}</small></div>`).join("")}</div>
  </section>

  <section class="panel settings">
    <p class="eyebrow">Settings</p>
    <label class="toggle" for="set-ai"><input id="set-ai" type="checkbox" data-setting="aiCoach" ${state.settings.aiCoach ? "checked" : ""}><span>AI Coach ${hasAI() ? "" : "(works when opened from the Claude link)"}</span></label>
  </section>

  <details class="panel sources"><summary>Where the drills come from</summary><ul>${SOURCES.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    <p class="muted small">Drills are described in our own words and credited to the coaches and players known for them. Courtside isn't affiliated with or endorsed by them.</p></details>

  <button class="btn ghost danger-text" data-action="reset">Reset all data</button>`;
}

// ---------- AI Coach ----------

let coachBusy = null;

function coachContext() {
  const p = state.profile;
  if (!isPlayer()) return `The user is a basketball coach with the tag ${p.handle}.`;
  const recent = state.workouts.slice(-5).map((w) => `${w.date}: ${SESSION_TYPES[w.type]?.label}, ${w.minutes} min, drills: ${w.drills.map((id) => drill(id)?.name).join(", ")}${w.shots ? `, shooting ${w.makes}/${w.shots}` : ""}`).join("\n");
  const nights = state.sleep.slice(-7).map((s) => `${s.date}: ${s.hours} h (feel ${s.quality}/5)`).join("; ");
  const x = derived();
  return `Player: ${p.age}-year-old ${POS[p.position]}, level ${LEVELS[p.level]}, ${Math.floor(p.heightIn / 12)}'${p.heightIn % 12}", ${p.weightLb} lb.
Program: ${programName(p)}. Skill goals: ${p.skillGoals.join(", ")}. Physical goal: ${p.physicalGoal}. Strength goal: ${p.strengthGoal}. Nutrition goal: ${p.goal}. Biggest obstacle: ${p.obstacle}.
Schedule: ${state.schedule.map((e, i) => `${DAY_NAMES[i]} ${SESSION_TYPES[e.type].label}${e.time && e.type !== "rest" ? ` ${formatTime(e.time)}` : ""}`).join("; ")}.
Commitments kept: ${x.kept}, missed: ${state.missedDates.length}. Current streak: ${x.streak}. Sleep target ${sleepTarget(p.age)} h. Recent sleep: ${nights || "none logged"}.
Recent workouts:\n${recent || "none yet"}`;
}

const COACH_RULES = `You are Courtside Coach, a knowledgeable, encouraging basketball coach inside a training app. Use the player's data below. Be specific and concise (under 170 words). Use short paragraphs or "- " bullets, plain text, no headings. Never diagnose injuries; for pain, tell them to see an athletic trainer or doctor. For a young athlete, keep nutrition advice general and safe.`;

function coachCard(locked) {
  const r = rankFor(levelInfo(state.xp).level);
  let parts;
  if (isPlayer()) {
    const x = derived();
    const nights = state.sleep.slice(-7);
    const avg = nights.length ? Math.round((nights.reduce((n, s) => n + s.hours, 0) / nights.length) * 10) / 10 : "—";
    parts = [[ratings(state).ovr, "OVR"], [x.streak, "Streak"], [avg, "Sleep"], [x.kept, "Kept"], [x.shots ? `${Math.round((x.makes / x.shots) * 100)}%` : "—", "Shot %"]];
  } else {
    parts = [[state.myPosts.length, "Posts"], [live.players.filter((p) => p.role === "player").length, "Players"], [levelInfo(state.xp).level, "Level"]];
  }
  return `
  <section class="game-card coach-card" style="--c:${r.color}">
    <div class="pc-top">
      <div class="coach-mark">${icon("coach")}</div>
      <div class="pc-id"><strong class="display">AI Coach</strong><span>${locked ? esc(locked) : "Reads your workouts, sleep and schedule"}</span></div>
      <div class="pc-tier">${locked ? "Locked" : coachBusy ? "Thinking" : "Online"}</div>
    </div>
    <div class="pc-parts" style="grid-template-columns:repeat(${parts.length},1fr)">${parts.map(([v, k]) => `<div><span class="num">${v}</span><small>${k}</small></div>`).join("")}</div>
  </section>`;
}

function viewCoach() {
  if (!hasAI() || !state.settings.aiCoach) {
    return `<section class="page-head"><p class="eyebrow">Personal</p><h1 class="display">AI Coach</h1></section>
    ${coachCard(hasAI() ? "Turn on AI Coach in Settings to use it." : "Works when Courtside is opened from its Claude link.")}
    ${hasAI() ? `<a class="btn primary big" href="#me">Open settings</a>` : ""}`;
  }
  const quick = isPlayer()
    ? [["Analyze", "Analyze my last workout"], ["Review", "Review my week and tell me what to fix"], ["Shooting", "How can I shoot better free throws?"], ["Fuel", "What should I eat before a game?"]]
    : [["Drill", "Give me a 15-minute shooting drill for my team"], ["Defense", "How do I teach closeouts?"], ["Culture", "Ideas to keep players motivated"]];
  return `
  <section class="page-head"><p class="eyebrow">Personal</p><h1 class="display">AI Coach</h1></section>
  ${coachCard()}
  ${state.coachChat.length || coachBusy ? `<div class="chat" id="chat">
    ${state.coachChat.map((m) => `<div class="msg ${m.role}">${m.role === "assistant" ? `<span class="msg-tag">Coach</span>` : ""}${esc(m.content)}</div>`).join("")}
    ${coachBusy ? `<div class="msg assistant"><span class="msg-tag">Coach</span><span id="coach-live">${esc(coachBusy.text || "Thinking…")}</span></div>` : ""}
  </div>` : ""}
  <div class="ability-grid">${quick.map(([tag, q]) => `<button class="ability" data-action="coach-quick" data-q="${esc(q)}" ${coachBusy ? "disabled" : ""}><small>${tag}</small><span>${esc(q)}</span></button>`).join("")}</div>
  <form id="coach-form" class="coach-form">
    <label class="sr" for="coach-input">Message</label>
    <textarea id="coach-input" rows="2" maxlength="800" placeholder="Ask your coach"></textarea>
    ${coachBusy ? `<button class="btn ghost" type="button" data-action="coach-stop">Stop</button>` : `<button class="btn primary" type="submit">Send</button>`}
  </form>
  <div class="row-between"><p class="muted small">Each question uses your Claude usage.</p>${state.coachChat.length ? `<button class="link small" data-action="coach-clear">Clear conversation</button>` : ""}</div>`;
}

async function sendCoach(text) {
  if (coachBusy || !text.trim()) return;
  state.coachChat.push({ role: "user", content: text.trim().slice(0, 800) });
  const ctl = new AbortController();
  coachBusy = { ctl, text: "" };
  if (location.hash !== "#coach") location.hash = "#coach";
  render();
  const turns = [{ role: "user", content: `${COACH_RULES}\n\n${coachContext()}` }, { role: "assistant", content: "Got it. What do you want to work on?" }, ...state.coachChat.slice(-10)];
  try {
    const { text: answer } = await askCoach(turns, {
      cache: false,
      signal: ctl.signal,
      onText: ({ text: t }) => {
        coachBusy.text = t;
        const el = $("#coach-live");
        if (el) el.textContent = t;
      },
    });
    state.coachChat.push({ role: "assistant", content: answer });
  } catch (e) {
    const msg = {
      cancelled: "Stopped.",
      not_granted: "AI Coach needs your permission to use Claude. Ask again and choose Allow.",
      rate_limited: "Too many questions at once. Wait a moment and try again.",
    }[e && e.code] || "The coach couldn't answer right now. Try again in a moment.";
    state.coachChat.push({ role: "assistant", content: (e && e.text ? e.text + "\n\n" : "") + msg });
  }
  coachBusy = null;
  save();
  render();
  $("#chat")?.lastElementChild?.scrollIntoView({ block: "end" });
}

function analyzeWorkout(ts) {
  const w = state.workouts.find((x) => String(x.ts) === String(ts));
  if (!w) return;
  const detail = w.drills.map((id) => drill(id)?.name).join(", ");
  sendCoach(`Analyze my ${SESSION_TYPES[w.type]?.label} from ${prettyDate(w.date)}: ${w.minutes} min, drills: ${detail}${w.shots ? `, shooting ${w.makes}/${w.shots} (${Math.round((w.makes / w.shots) * 100)}%)` : ""}${w.onTime ? ", done on time" : ""}. What went well, what should I fix, and what should my next session focus on?`);
}

// ---------- Timer ----------

let timer = null;

function openTimer(id) {
  const d = drill(id);
  closeTimer();
  let remaining = d.minutes * 60;
  let running = true;
  const el = document.createElement("div");
  el.className = "overlay";
  el.innerHTML = `<div class="sheet timer"><p class="eyebrow">${CATEGORIES[d.cat].label}</p><h2>${esc(d.name)}</h2><div class="timer-face num" id="timer-face"></div>
    <div class="actions"><button class="btn ghost" data-t="pause">Pause</button><button class="btn ghost" data-t="add">+30s</button><button class="btn primary" data-t="close">Done</button></div></div>`;
  document.body.appendChild(el);
  const face = el.querySelector("#timer-face");
  const draw = () => (face.textContent = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`);
  draw();
  const tick = setInterval(() => {
    if (!running) return;
    remaining = Math.max(0, remaining - 1);
    draw();
    if (remaining === 0) {
      running = false;
      face.classList.add("finished");
      beep(3);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if (!state.session.done.includes(id)) toggleDrill(id);
    }
  }, 1000);
  el.addEventListener("click", (e) => {
    const t = e.target.dataset.t;
    if (t === "pause") {
      running = !running;
      e.target.textContent = running ? "Pause" : "Resume";
    } else if (t === "add") {
      remaining += 30;
      running = true;
      face.classList.remove("finished");
      draw();
    } else if (t === "close" || e.target === el) closeTimer();
  });
  timer = { el, tick };
}

function closeTimer() {
  if (!timer) return;
  clearInterval(timer.tick);
  timer.el.remove();
  timer = null;
}

function toggleDrill(id) {
  const s = state.session;
  if (s.finished) return;
  if (s.done.includes(id)) {
    s.done = s.done.filter((x) => x !== id);
    award(-XP.drill);
  } else {
    s.done.push(id);
    award(XP.drill, "Drill");
  }
  save();
  render();
}

// ---------- Sound, reminders, alarms ----------

let audioCtx = null;
let wakeLock = null;

function primeAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch {}
}

function beep(times = 1, freq = 880) {
  if (!audioCtx) return;
  for (let i = 0; i < times; i++) {
    const t = audioCtx.currentTime + i * 0.32;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(audioCtx.destination);
    o.start(t);
    o.stop(t + 0.25);
  }
}

let alarmLoop = null;

function ringAlarm(type, test = false) {
  if ($(".alarm")) return;
  const t = SESSION_TYPES[type] || SESSION_TYPES.shooting;
  const r = rankFor(levelInfo(state.xp).level);
  const sess = state.session && state.session.date === today() && state.session.type === type ? state.session : null;
  const drills = sess ? sess.drills : buildWorkout(state.profile, type, hashString(today() + type));
  const mins = drills.reduce((n, id) => n + drill(id).minutes, 0);
  const reward = t.kind === "recovery" ? XP.recovery : XP.workout + XP.onTime;
  const [clock, ampm] = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).split(" ");
  const el = document.createElement("div");
  el.className = "overlay alarm";
  el.style.setProperty("--c", r.color);
  el.innerHTML = `<div class="game-card alarm-card" role="alertdialog" aria-label="Workout alarm">
    <div class="alarm-rings" aria-hidden="true"><span></span><span></span></div>
    <p class="eyebrow">${test ? "Alarm test" : "Workout alarm"}</p>
    <div class="alarm-time num">${clock}<small>${ampm || ""}</small></div>
    <h2 class="display">${esc(t.label)}</h2>
    <div class="pc-parts" style="grid-template-columns:repeat(4,1fr)">
      <div><span class="num">${drills.length}</span><small>Drills</small></div>
      <div><span class="num">${mins}</span><small>Min</small></div>
      <div><span class="num">+${reward}</span><small>XP</small></div>
      <div><span class="num">${derived().streak}</span><small>Streak</small></div>
    </div>
    <p class="small muted">Start within 2 hours to earn the on-time bonus and keep your streak alive.</p>
    ${audioCtx && audioCtx.state === "running" ? "" : `<p class="small alarm-sound">Tap anywhere to turn the sound on.</p>`}
    <div class="actions"><button class="btn ghost" data-a="snooze">Snooze 9 min</button><button class="btn primary" data-a="go">${test ? "Stop" : "I'm up. Let's go"}</button></div>
  </div>`;
  document.body.appendChild(el);
  const ring = () => {
    beep(4, 988);
    if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
  };
  ring();
  alarmLoop = setInterval(ring, 1800);
  el.addEventListener("click", (e) => {
    primeAudio();
    el.querySelector(".alarm-sound")?.remove();
    const a = e.target.dataset.a;
    if (!a) return;
    clearInterval(alarmLoop);
    el.remove();
    if (a === "snooze") {
      toast("Snoozed for 9 minutes");
      setTimeout(() => ringAlarm(type, test), 9 * 60 * 1000);
    } else if (!test) {
      location.hash = "#train";
    }
  });
}

function notifySystem(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body });
  } catch {}
}

function checkReminders() {
  const cd = $("#next-countdown");
  if (cd && isPlayer()) {
    const n = nextWorkout();
    if (n) cd.textContent = countdown(n.when - Date.now());
  }
  if (!isPlayer() || doneToday()) return;
  const e = todayEntry();
  if (e.type === "rest" || !e.time) return;
  const [h, m] = e.time.split(":").map(Number);
  const due = new Date();
  due.setHours(h, m, 0, 0);
  const late = Date.now() - due.getTime();
  if (late < 0 || late > 3 * 3600 * 1000) return;
  const k = today();
  if (state.notified[k] === e.time) return;
  state.notified[k] = e.time;
  save();
  const label = SESSION_TYPES[e.type].label;
  notifySystem("Time to train", `Your ${label} starts now.`);
  if (e.alarm) ringAlarm(e.type);
  else toast(`It's ${formatTime(e.time)}. Time for your ${label}.`, "gold");
  if (["home", "train"].includes(route())) softRender();
}

async function toggleWake() {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    } else {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    }
  } catch {
    toast("This device won't keep the screen awake from here.");
  }
  render();
}

function buildICS() {
  const p = state.profile;
  const byday = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Courtside//Training Schedule//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Courtside Training"];
  state.schedule.forEach((e, i) => {
    if (e.type === "rest" || !e.time) return;
    let k = today();
    while (weekdayOf(k) !== i) k = addDays(k, 1);
    const [h, m] = e.time.split(":");
    const label = SESSION_TYPES[e.type].label;
    const mins = e.type === "recovery" ? 30 : p.sessionMinutes;
    lines.push(
      "BEGIN:VEVENT",
      `UID:courtside-${i}-${hashString(p.handle + e.type + e.time)}@courtside`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${k.replace(/-/g, "")}T${h}${m}00`,
      `DURATION:PT${mins}M`,
      `RRULE:FREQ=WEEKLY;BYDAY=${byday[i]}`,
      `SUMMARY:Courtside: ${label}`,
      `DESCRIPTION:Open Courtside and start your ${label}.`,
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Workout in 10 minutes", "TRIGGER:-PT10M", "END:VALARM",
      ...(e.alarm ? ["BEGIN:VALARM", "ACTION:AUDIO", "TRIGGER:PT0M", "END:VALARM"] : ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Time to train", "TRIGGER:PT0M", "END:VALARM"]),
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

async function offerFile(filename, data, okMsg) {
  try {
    const res = await saveFile(filename, data);
    if (res && res.status === "saved") toast(okMsg);
  } catch (e) {
    if (e && e.code === "declined") return;
    toast("Saving files isn't available here.");
  }
}

// ---------- Router ----------

const ROUTES = { home: viewHome, train: viewTrain, schedule: viewSchedule, fuel: viewFuel, sleep: viewSleep, feed: viewFeed, ranks: viewRanks, me: viewMe, plan: viewPlan, coach: viewCoach, quiz: viewQuiz };
const PLAYER_ONLY = ["train", "schedule", "fuel", "sleep", "plan"];

function route() {
  const r = location.hash.replace("#", "") || "home";
  if (!ROUTES[r]) return "home";
  if (!isPlayer() && PLAYER_ONLY.includes(r)) return "home";
  return r;
}

function renderNav(r) {
  const tabs = isPlayer() ? ["home", "train", "fuel", "feed", "ranks"] : ["home", "feed", "ranks", "me"];
  const labels = { home: "Home", train: "Train", fuel: "Fuel", feed: "Feed", ranks: "Ranks", me: "Me" };
  $("#nav").innerHTML = tabs.map((t) => `<a href="#${t}" class="${t === r ? "active" : ""}">${icon(t)}<span>${labels[t]}</span></a>`).join("");
  $("#topbar").innerHTML = `<span class="wordmark">COURTSIDE</span><div class="top-actions">
    ${hasAI() && state.settings.aiCoach ? `<a href="#coach" class="icon-btn ${r === "coach" ? "active" : ""}" aria-label="AI Coach">${icon("coach")}</a>` : ""}
    <a href="#me" class="icon-btn ${r === "me" ? "active" : ""}" aria-label="My profile">${icon("me")}</a></div>`;
}

function render() {
  const app = $("#app");
  if (!state.profile || route() === "quiz") {
    $("#nav").hidden = true;
    $("#topbar").hidden = true;
    app.innerHTML = viewQuiz();
    app.dataset.route = "quiz";
    return;
  }
  const r = route();
  $("#nav").hidden = false;
  $("#topbar").hidden = false;
  renderNav(r);
  app.innerHTML = ROUTES[r]();
  app.dataset.route = r;
}

// Re-render on live data without clobbering typing
function softRender() {
  const a = document.activeElement;
  if (a && $("#app").contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
  if ([...document.querySelectorAll("#app video")].some((v) => !v.paused)) return;
  if (state.profile && ["home", "feed", "ranks", "train"].includes(route()) && !$(".building")) render();
}

// ---------- Events ----------

function onSubmit(e) {
  const f = e.target;
  if (f.id === "sleep-form") {
    e.preventDefault();
    const bed = f.bed.value, wake = f.wake.value;
    const hours = sleepHours(bed, wake);
    const k = today();
    const existing = state.sleep.findIndex((s) => s.date === k);
    const target = sleepTarget(state.profile.age);
    const entry = { date: k, bed, wake, hours, quality: Number(f.quality.value) };
    if (existing >= 0) state.sleep[existing] = entry;
    else {
      state.sleep.push(entry);
      const hit = hours >= target - 0.25;
      award(XP.sleepLog + (hit ? XP.sleepTarget : 0), hit ? "Sleep target hit" : "Sleep logged");
    }
    checkBadges();
    save();
    toast(`${hours} hours logged`);
    render();
  } else if (f.id === "stat-form") {
    e.preventDefault();
    const value = Number(f.value.value);
    if (!Number.isFinite(value)) return;
    state.stats.push({ date: f.date.value, metric: selectedMetric, value });
    award(XP.stat, "Stat logged");
    save();
    render();
  } else if (f.id === "post-form") {
    e.preventDefault();
    submitPost(f);
  } else if (f.classList.contains("comment-form")) {
    e.preventDefault();
    const text = f.text.value.trim();
    if (!text) return;
    state.myComments.push({ key: f.dataset.key, text: text.slice(0, 300), ts: Date.now() });
    state.myComments = state.myComments.slice(-150);
    save();
    saveMyComments(state.myComments);
    render();
  } else if (f.id === "coach-form") {
    e.preventDefault();
    sendCoach($("#coach-input").value);
  }
}

function onChange(e) {
  const t = e.target;
  if (t.dataset.sched) {
    const day = Number(t.dataset.day);
    const entry = state.schedule[day];
    if (t.dataset.sched === "type") {
      entry.type = t.value;
      if (t.value !== "rest" && !entry.time) entry.time = state.profile.time || "18:00";
    } else if (t.dataset.sched === "time") entry.time = t.value;
    else if (t.dataset.sched === "alarm") {
      entry.alarm = t.checked;
      if (t.checked) {
        primeAudio();
        try {
          if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
        } catch {}
        toast(`Alarm set for ${DAY_NAMES[day]} at ${formatTime(entry.time)}`);
      }
    }
    if (day === new Date().getDay() && t.dataset.sched === "type" && state.session && !state.session.finished) state.session = null;
    delete state.notified[today()];
    save();
    render();
  } else if (t.dataset.setting) {
    state.settings[t.dataset.setting] = t.checked;
    save();
    render();
  } else if (t.dataset.actionChange === "swap") {
    regenerateSession(t.value);
    render();
  } else if (t.id === "post-media") {
    const n = $("#media-name");
    if (n) n.textContent = t.files[0] ? t.files[0].name : "";
  }
}

function onClick(e) {
  primeAudio();
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const a = btn.dataset.action;
  const s = state.session;
  switch (a) {
    case "quiz-pick":
      quizNext(btn.dataset.num ? Number(btn.dataset.v) : btn.dataset.v);
      break;
    case "quiz-toggle": {
      const q = quizList()[quiz.i];
      const cur = Array.isArray(quiz.a[q.id]) ? quiz.a[q.id] : [];
      const v = btn.dataset.v;
      let next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      if (q.max && next.length > q.max) next = next.slice(-q.max);
      quiz.a[q.id] = next;
      render();
      break;
    }
    case "quiz-next":
      quizNext();
      break;
    case "quiz-back":
      quiz.i = Math.max(0, quiz.i - 1);
      render();
      break;
    case "go":
      location.hash = btn.dataset.to;
      break;
    case "toggle-drill":
      toggleDrill(btn.dataset.id);
      break;
    case "shot": {
      const id = btn.dataset.id;
      const sh = s.shots[id] || { m: 0, a: 0 };
      sh.a++;
      if (btn.dataset.made === "1") sh.m++;
      s.shots[id] = sh;
      save();
      render();
      break;
    }
    case "shot-undo": {
      const sh = s.shots[btn.dataset.id];
      if (sh && sh.a) {
        sh.a--;
        if (sh.m > sh.a) sh.m = sh.a;
      }
      save();
      render();
      break;
    }
    case "shuffle":
      regenerateSession(s.type);
      render();
      break;
    case "finish":
      finishSession();
      break;
    case "timer":
      openTimer(btn.dataset.id);
      break;
    case "story-workout": {
      const w = state.workouts[state.workouts.length - 1];
      if (w) addPost({ kind: "story", text: "", media: null, card: cardFromWorkout(w) });
      break;
    }
    case "save-story": {
      const w = state.workouts[state.workouts.length - 1];
      if (w) storyImage(w).then((blob) => offerFile(`courtside-${w.date}.png`, blob, "Image saved. Post it to your Instagram or TikTok story."));
      break;
    }
    case "analyze":
      analyzeWorkout(btn.dataset.ts);
      break;
    case "toggle-meal": {
      const k = today();
      const i = Number(btn.dataset.i);
      const list = state.mealsEaten[k] || [];
      const on = !list.includes(i);
      state.mealsEaten[k] = on ? [...list, i] : list.filter((x) => x !== i);
      award(on ? XP.meal : -XP.meal, "Meal");
      const plan = ensureMealPlan();
      if (on && state.mealsEaten[k].length >= plan.meals.length && !state.mealBonus.includes(k)) {
        state.mealBonus.push(k);
        state.mealBonus = state.mealBonus.slice(-30);
        award(XP.allMeals, "All meals");
      }
      checkBadges();
      save();
      render();
      break;
    }
    case "new-meals": {
      const k = today();
      const seed = ((state.mealPlans[k]?.seed || 0) + 104729) >>> 0;
      state.mealPlans[k] = { seed, meals: buildMealPlan(state.profile, seed) };
      state.mealsEaten[k] = [];
      save();
      render();
      break;
    }
    case "challenge": {
      const k = today();
      if (state.challengesDone.includes(k)) {
        state.challengesDone = state.challengesDone.filter((d) => d !== k);
        award(-XP.challenge);
      } else {
        state.challengesDone.push(k);
        award(XP.challenge, "Challenge");
      }
      state.challengesDone = state.challengesDone.slice(-60);
      save();
      render();
      break;
    }
    case "ics":
      offerFile("courtside-schedule.ics", new Blob([buildICS()], { type: "text/calendar" }), "Calendar file saved. Open it to add your workouts and alerts.");
      break;
    case "test-alarm":
      primeAudio();
      ringAlarm((nextWorkout() || { e: { type: todayEntry().type === "rest" ? "recovery" : todayEntry().type } }).e.type, true);
      break;
    case "wake":
      toggleWake();
      break;
    case "reset-schedule":
      state.schedule = recommendSchedule(state.profile);
      state.session = null;
      save();
      toast("Schedule reset to your recommended week");
      render();
      break;
    case "kind":
      composerKind = btn.dataset.kind;
      document.querySelectorAll("[data-action=kind]").forEach((b) => b.classList.toggle("active", b === btn));
      break;
    case "filter":
      feedFilter = btn.dataset.f;
      render();
      break;
    case "compose-story":
      composerKind = "story";
      render();
      $("#post-text")?.focus();
      break;
    case "open-story":
      openStory(btn.dataset.uid);
      break;
    case "cheer": {
      const key = btn.dataset.key;
      state.myCheers = state.myCheers.includes(key) ? state.myCheers.filter((k) => k !== key) : [...state.myCheers, key];
      save();
      saveMyCheers(state.myCheers);
      render();
      break;
    }
    case "toggle-comments": {
      const key = btn.dataset.key;
      if (openComments.has(key)) openComments.delete(key);
      else openComments.add(key);
      render();
      break;
    }
    case "delete-post":
      state.myPosts = state.myPosts.filter((p) => p.id !== btn.dataset.id);
      save();
      saveMyFeed(state.profile.handle, state.profile.role, state.myPosts);
      render();
      break;
    case "remove-post":
      removeOthersPost(btn.dataset.uid, btn.dataset.id).then(() => toast("Post removed"));
      break;
    case "board":
      board = btn.dataset.b;
      render();
      break;
    case "metric":
      selectedMetric = btn.dataset.metric;
      render();
      break;
    case "retake":
      startQuiz();
      break;
    case "coach-quick":
      if (btn.dataset.q === "Analyze my last workout" && state.workouts.length) analyzeWorkout(state.workouts[state.workouts.length - 1].ts);
      else sendCoach(btn.dataset.q);
      break;
    case "coach-stop":
      coachBusy?.ctl.abort();
      break;
    case "coach-clear":
      state.coachChat = [];
      save();
      render();
      break;
    case "reset":
      if (btn.dataset.armed) {
        state = fresh();
        save();
        quiz = null;
        location.hash = "";
        render();
      } else {
        btn.dataset.armed = "1";
        btn.textContent = "Tap again to delete everything";
        setTimeout(() => {
          if (!btn.isConnected) return;
          delete btn.dataset.armed;
          btn.textContent = "Reset all data";
        }, 4000);
      }
      break;
  }
}

document.addEventListener("submit", onSubmit);
document.addEventListener("change", onChange);
document.addEventListener("click", onClick);
window.addEventListener("hashchange", () => {
  closeStory();
  if (location.hash === "#quiz" && !quiz) quiz = { i: 0, a: {} };
  render();
  window.scrollTo(0, 0);
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    checkCommitments();
    checkReminders();
  }
});
let warnedSave = false;
window.addEventListener("cloud-error", (e) => {
  if (warnedSave || e.detail !== "invalid_argument") return;
  warnedSave = true;
  toast("Your progress is saved on this device only. Ask the owner for Contributor access to sync and compete.");
});

// ---------- Boot ----------

checkCommitments();
render();
setInterval(checkReminders, 15000);
checkReminders();

initCloud().then(async () => {
  if (hasSocial()) {
    const remote = await loadPrivate();
    if (remote && (remote.updatedAt || 0) > (state.updatedAt || 0)) {
      state = { ...fresh(), ...remote };
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {}
      checkCommitments();
    } else if (state.profile) {
      savePrivate(() => state);
    }
    if (state.profile) {
      syncCard();
      if (state.myPosts.length) saveMyFeed(state.profile.handle, state.profile.role, state.myPosts);
    }
    watchCollection("players", (rows) => ((live.players = rows), softRender()));
    watchCollection("feed", (rows) => ((live.feeds = rows), softRender()));
    watchCollection("cheers", (rows) => ((live.cheers = rows), softRender()));
    watchCollection("comments", (rows) => ((live.comments = rows), softRender()));
  }
  // Light up cloud-only controls (AI Coach, uploads) once they resolve
  if (state.profile && !$(".building")) softRender();
});
