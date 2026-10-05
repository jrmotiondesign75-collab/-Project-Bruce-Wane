import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const out = process.argv[2]; const url = process.argv[3];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: 'light' });
const p = await ctx.newPage(); const errs = []; const leaks = [];
p.on('pageerror', e => errs.push(e.message));
await p.clock.install({ time: new Date('2026-10-05T17:40:00') });
await p.addInitScript(() => {
  const store = (window.__store = {
    'players/u_rival': { handle: 'CoachCarter', role: 'coach', level: 3, xp: 150, rank: 'Bronze II', color: '#c27a45', week: '2026-W41', weekXp: 0 },
    'players/u_p2': { handle: 'BucketGetter', role: 'player', level: 11, xp: 1610, rank: 'Silver I', color: '#9aa6b2', week: '2026-W41', weekXp: 940, weekMakes: 212, kept: 21, streak: 8 },
    'players/u_p3': { handle: 'Lockdown_J', role: 'player', level: 8, xp: 1010, rank: 'Silver III', color: '#9aa6b2', week: '2026-W41', weekXp: 610, weekMakes: 140, kept: 14, streak: 3 },
    'players/u_p4': { handle: 'SkyWalker', role: 'player', level: 6, xp: 640, rank: 'Bronze I', color: '#c27a45', week: '2026-W41', weekXp: 420, weekMakes: 96, kept: 9, streak: 2 },
    'players/u_p5': { handle: 'MidRangeMo', role: 'player', level: 4, xp: 330, rank: 'Bronze II', color: '#c27a45', week: '2026-W41', weekXp: 250, weekMakes: 61, kept: 5, streak: 1 },
    'feed/u_rival': { handle: 'CoachCarter', role: 'coach', posts: [
      { id: 'a1', kind: 'drill', text: 'Try the Mikan drill for 60 seconds, both hands, no dribble.', ts: Date.now() - 3600e3, rank: 'Bronze II', color: '#c27a45' },
      { id: 's1', kind: 'story', text: 'Practice at 4. Be early.', ts: Date.now() - 600e3, rank: 'Bronze II', color: '#c27a45' },
      { id: 'x1', kind: 'win', text: '<img src=x onerror=alert(1)>', ts: Date.now() - 7200e3, rank: 'Bronze II', color: 'red;background:url(x)', media: { id: '../evil', type: 'image' } },
    ] },
    'cheers/u_p2': { ids: ['u_rival:a1'] },
    'comments/u_p2': { items: [{ key: 'u_rival:a1', text: 'Doing this tonight', ts: Date.now() - 1000 }] },
  });
  const listeners = new Set();
  const notify = () => setTimeout(() => listeners.forEach((f) => f()), 0);
  const snap = (path) => ({ id: path.split('/').pop(), exists: path in store, data: () => store[path], metadata: { fromCache: false, hasPendingWrites: false } });
  const coll = (path) => ({
    path,
    doc: (id) => doc(`${path}/${id || Math.random().toString(36).slice(2)}`),
    get: async () => { const docs = Object.keys(store).filter((k) => k.startsWith(path + '/') && k.split('/').length === path.split('/').length + 1).map(snap); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [] }; },
    onSnapshot(next) { const f = async () => next(await this.get()); listeners.add(f); setTimeout(f, 0); return () => listeners.delete(f); },
  });
  const doc = (path) => ({
    id: path.split('/').pop(), path,
    get: async () => snap(path),
    set: async (d) => { window.__writes = (window.__writes || 0) + 1; store[path] = JSON.parse(JSON.stringify(d)); notify(); },
    update: async (d) => { store[path] = { ...store[path], ...d }; notify(); },
    delete: async () => { delete store[path]; notify(); },
    onSnapshot(next) { const f = () => next(snap(path)); listeners.add(f); setTimeout(f, 0); return () => listeners.delete(f); },
    collection: (c) => coll(`${path}/${c}`),
  });
  const sample = async (input, opts = {}) => {
    window.__lastPrompt = input;
    const text = 'Strong session. You went 9 of 12 (75%), up from 64% across your last six sessions. Your catch-and-shoot rhythm is clicking.\n\n- Fix: most misses came late in the circuit. Add 10 free throws right after sprints to practice shooting tired.\n- Next: Tuesday is Bounce Day. Get 9 hours tonight so your legs are fresh.\n\nOne more workout and you hit a 5-day streak.';
    await new Promise((r) => setTimeout(r, 50));
    opts.onText && opts.onText({ text, delta: text });
    return { text, truncated: false };
  };
  const caps = {
    db: { doc, collection: coll },
    user: { id: async () => 'u_me', isOwner: async () => true, canEdit: async () => true, can: async () => true, me: async () => ({ id: 'u_me' }), profiles: async () => ({}) },
    sample,
    assets: { upload: async (f) => ({ id: 'asset123', url: '/_blob/asset123', sizeBytes: f.size, contentType: f.type }) },
    downloads: { save: async (r) => { window.__saved = r.filename; return { status: 'saved' }; } },
  };
  window.claude = { use: (n) => Promise.resolve(caps[n] || null) };
});


const NAMES = ['Villanova','Jay Wright','Kobe','Bryant','Curry','Stephen','Payne','Ray Allen','Durant','KD ','Kyrie','Irving','Hakeem','Olajuwon','Dirk','Nowitzki','Geschwindner','Hanlen','Brickley','Calipari','Kentucky','Duke','Krzyzewski','Coach K','Izzo','Michigan','Newell','Mikan','Meyer','DePaul','Phil Jackson','Bulls','Lakers','Stanford','NBA','Walton','Worthy','Pure Sweat','Accelerate'];
const sanitize = () => p.evaluate(() => {
  document.querySelectorAll('.credit').forEach((e) => (e.textContent = 'Top-program drill'));
  document.querySelectorAll('.xp-float,.toast').forEach((e) => e.remove());
});
const font = `:root:root:root{--display:"Inter Display","Inter",sans-serif;--body:"Inter",sans-serif;--round:"Inter",sans-serif} *,*::before,*::after{animation:none!important;transition:none!important}`;
const shot = async (name, opts = {}) => {
  await sanitize();
  const text = await p.evaluate(() => document.body.innerText);
  for (const n of NAMES) if (text.includes(n)) leaks.push(`${name}: ${n}`);
  await p.screenshot({ path: `${out}/${name}.png`, ...opts });
};
const style = () => p.addStyleTag({ content: font });
const pick = (l) => p.click(`.option:has-text("${l}")`);

// ---------- 1. Fresh player: quiz + plan ----------
await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload(); await style(); await p.clock.runFor(300);
await pick('Light'); await pick('Player');
await p.fill('#quiz-input', 'Jaylen'); await p.click('[data-action=quiz-next]');
await p.fill('#quiz-input', '16'); await p.click('[data-action=quiz-next]');
await p.fill('#quiz-ft', '6'); await p.fill('#quiz-in', '2'); await p.fill('#quiz-lb', '168'); await p.click('[data-action=quiz-next]');
await pick('Male'); await pick('Shooting Guard'); await pick('High school or AAU');
await p.click('.option:has-text("Shooting")'); await p.click('.option:has-text("Ball handling")');
await shot('quiz');
await p.click('[data-action=quiz-next]');
await pick('Jump higher'); await pick('Get stronger without'); await pick('Gain weight'); await pick('No restrictions');
await p.click('.option:has-text("A hoop")'); await p.click('.option:has-text("Weights")'); await p.click('[data-action=quiz-next]');
await pick('6 days'); await pick('45 minutes'); await pick('Evening');
await pick('About 7'); await shot('quiz-sleep');
await pick('Staying motivated');
await p.clock.runFor(1200); await shot('building');
await p.clock.runFor(3000); await p.clock.runFor(3000);
await p.evaluate(() => window.scrollTo(0, 0)); await p.clock.runFor(200);
await p.evaluate(() => document.querySelector('.celebrate')?.remove());
await shot('plan');

// ---------- 2. Seeded player ----------
const days = ['2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04'];
const nights = Array.from({ length: 14 }, (_, i) => { const d = new Date(2026, 8, 21 + i); return d.toISOString().slice(0, 10); });
const DR = ['warmup','bradleys','hanlen-prohop','spot-up','game-circuit','cone-attack','cooldown'];
const seed = {
  v: 2,
  profile: { role: 'player', handle: 'Jaylen', age: 16, heightIn: 74, weightLb: 168, sex: 'male', position: 'SG', level: 2, skillGoals: ['shooting', 'handles'], physicalGoal: 'vertical', strengthGoal: 'strong', goal: 'gain', diet: 'none', equipment: ['hoop', 'weights'], daysPerWeek: 6, sessionMinutes: 45, time: '18:00', sleepNow: 7, obstacle: 'motivation' },
  schedule: [0,1,2,3,4,5,6].map(i => ({ type: ['recovery','shooting','vertical','handles','shooting','strength','finishing'][i], time: i === 1 ? '18:00' : '17:30', alarm: i === 1 })),
  planStart: '2026-09-20', xp: 1572, xpWeek: { '2026-W41': 780 },
  workouts: days.map((d, i) => ({ date: d, type: ['shooting','handles','vertical','shooting','strength','recovery'][i], minutes: 45, drills: ['warmup','bradleys','spot-up','game-circuit','cooldown'], shots: 60, makes: 37 + i * 2, onTime: true, xp: 95, ts: Date.parse(d + 'T18:30:00') })),
  stats: [{ date: '2026-09-01', metric: 'vertical', value: 26 }, { date: '2026-09-20', metric: 'vertical', value: 27.5 }, { date: '2026-10-04', metric: 'vertical', value: 28.5 }],
  sleep: nights.map((d, i) => ({ date: d, bed: '22:15', wake: '07:00', hours: [7.2, 7.8, 8.4, 8.9, 9.1, 8.6, 9.3, 9.0, 8.2, 9.4, 9.1, 9.2, 8.8, 9.5][i], quality: 4 })),
  keptDates: days, missedDates: [], lastCommitCheck: '2026-10-04', badges: ['first', 'five', 'streak3'],
  lessonsDone: { beef: { quiz: true }, 'triple-threat': { quiz: true }, 'next-play': { quiz: true }, 'ft-routine': { quiz: false }, 'warmup-science': { quiz: true }, landing: { quiz: true }, visualization: { quiz: true } },
  alarms: [
    { id: 'a1', time: '06:15', label: 'Rise & grind', kind: 'wake', days: [1,2,3,4,5], sound: 'buzzer', snooze: 9, challenge: true, on: true },
    { id: 'a2', time: '21:45', label: 'Lights out', kind: 'bedtime', days: [0,1,2,3,4,5,6], sound: 'chime', snooze: 9, challenge: false, on: true },
    { id: 'a3', time: '07:00', label: 'Game day', kind: 'workout', days: [6], sound: 'horn', snooze: 9, challenge: false, on: true },
  ],
  upOnTime: 6,
  session: { date: '2026-10-05', type: 'shooting', seed: 1, drills: DR, done: [], shots: {}, finished: false },
  settings: { aiCoach: true, appearance: 'light' }, updatedAt: Date.now(),
};
await p.goto(url); await p.evaluate((s) => localStorage.setItem('courtside:v2', JSON.stringify(s)), seed);
const go = async (hash) => { await p.goto(url + hash); await p.reload(); await style(); await p.clock.runFor(700); };

await go('#home'); await shot('home');
// Train: check drills, track shots, level up
await go('#train');
await p.click('[data-action=toggle-drill] >> nth=0'); await p.click('[data-action=toggle-drill] >> nth=1');
for (let i = 0; i < 9; i++) await p.click('[data-action=shot][data-made="1"] >> nth=0');
for (let i = 0; i < 3; i++) await p.click('[data-action=shot][data-made="0"] >> nth=0');
await p.clock.runFor(400); await p.evaluate(() => document.querySelector('.celebrate')?.remove());
await p.evaluate(() => { document.querySelector('.drills').scrollIntoView({ block: 'start' }); window.scrollBy(0, -170); });
await shot('train');
await p.click('[data-action=toggle-drill] >> nth=2');
await p.clock.runFor(450); await shot('levelup');
await p.evaluate(() => document.querySelector('.celebrate')?.remove()); await p.click('[data-action=toggle-drill] >> nth=3');
await p.evaluate(() => document.querySelector('.celebrate')?.remove());
await p.click('[data-action=finish]'); await p.clock.runFor(500);
await p.evaluate(() => document.querySelectorAll('.celebrate').forEach(e => e.remove()));
await p.evaluate(() => window.scrollTo(0, 0)); await shot('result');

await go('#ranks'); await shot('ranks');
await p.evaluate(() => window.scrollTo(0, 330)); await shot('ranks-board');
await go('#home'); await shot('home-after');

// Learn
await go('#learn'); await shot('learn');
await go('#lesson-goals'); await shot('lesson');
await p.click('[data-action=lesson-answer][data-i="0"]'); await p.clock.runFor(450);
await p.evaluate(() => document.querySelectorAll('.celebrate').forEach(e => e.remove()));
await p.evaluate(() => document.querySelector('.quiz-card').scrollIntoView({ block: 'center' })); await shot('lesson-quiz');
await go('#learn'); await p.click('[data-action=learn-tab][data-tab=drills]'); await p.click('[data-action=drill-cat][data-cat=strength]');
await p.click('[data-action=drill-open] >> nth=0'); await p.clock.runFor(200); await shot('drill-library');

// Alarms + challenge + sleep
await go('#alarms'); await shot('alarms');
await p.click('.alarm-row.kind-wake [data-action=alarm-edit]'); await p.clock.runFor(300); await shot('alarm-editor');
await p.click('[data-action=alarm-test]'); await p.clock.runFor(400);
const fixAlarm = () => p.evaluate(() => { document.querySelector('.alarm-sound')?.remove(); const e = document.querySelector('.alarm-card .eyebrow'); if (e) e.textContent = 'Wake up'; const t = document.querySelector('.alarm-card .alarm-time'); if (t) t.innerHTML = '6:15<small>AM</small>'; });
await fixAlarm(); await shot('alarm-ring');
await p.click('.alarm [data-a=go]'); await p.clock.runFor(300);
await p.evaluate(() => { const c = document.querySelector('.alarm-challenge'); if (c) { c.querySelector('.eyebrow').textContent = 'Wake-up challenge · answer to stop the alarm'; c.querySelector('strong').textContent = 'Where do most missed shots bounce?'; const o = c.querySelectorAll('.option'); ['Straight back to the shooter', 'To the opposite side of the rim', 'Out of bounds'].forEach((t, i) => o[i] && (o[i].textContent = t)); } });
await fixAlarm(); await shot('alarm-challenge');
await p.evaluate(() => { const o = document.querySelectorAll('.alarm-challenge .option'); o[1].classList.add('right'); o[1].innerHTML = '<strong>To the opposite side of the rim</strong><span class="tick">✓</span>'; });
await shot('alarm-solved');
await p.goto(url + '#home'); await p.reload(); await style();
await go('#sleep'); await p.evaluate(() => document.querySelector('.tips')?.remove()); await shot('sleep');

// Coach + fuel
await go('#coach'); await p.click('[data-action=coach-quick] >> nth=0'); await p.clock.runFor(800); await go('#coach');
await p.evaluate(() => { document.querySelector('.page-head')?.remove(); window.scrollTo(0, 0); }); await shot('coach');
await go('#fuel'); await p.click('[data-action=toggle-meal] >> nth=0'); await p.click('[data-action=toggle-meal] >> nth=1'); await p.clock.runFor(300);
await p.evaluate(() => window.scrollTo(0, 0)); await shot('fuel');
await p.evaluate(() => document.querySelector('.meals').scrollIntoView({ block: 'start' })); await p.evaluate(() => window.scrollBy(0, -120)); await shot('fuel-meals');

console.log(JSON.stringify({ errs, leaks }));
await b.close();
