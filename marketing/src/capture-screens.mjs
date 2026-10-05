import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const out = process.argv[2]; const url = process.argv[3];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: 'light' });
const p = await ctx.newPage(); const errs = [];
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
    const text = 'Nice session. You hit your on-time goal. Next: 50 free throws.';
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

const days = ['2026-10-01','2026-10-02','2026-10-03','2026-10-04'];
const seed = {
  v: 2,
  profile: { role: 'player', handle: 'Jaylen', age: 16, heightIn: 74, weightLb: 168, sex: 'male', position: 'SG', level: 2, skillGoals: ['shooting', 'handles'], physicalGoal: 'vertical', strengthGoal: 'strong', goal: 'gain', diet: 'none', equipment: ['hoop', 'weights'], daysPerWeek: 6, sessionMinutes: 45, time: '18:00', sleepNow: 7, obstacle: 'motivation' },
  schedule: [0,1,2,3,4,5,6].map(i => ({ type: ['recovery','shooting','vertical','handles','shooting','strength','finishing'][i], time: i === 1 ? '18:00' : '17:30', alarm: i === 1 })),
  planStart: '2026-09-20', xp: 1460, xpWeek: { '2026-W41': 780 },
  workouts: days.map((d, i) => ({ date: d, type: ['shooting','handles','vertical','recovery'][i], minutes: 45, drills: ['warmup','get-50','kobe-ladder','free-throws','cooldown'], shots: 60, makes: 41 + i * 3, onTime: true, xp: 95, ts: Date.parse(d + 'T18:30:00') })),
  stats: [{ date: '2026-09-01', metric: 'vertical', value: 26 }, { date: '2026-09-20', metric: 'vertical', value: 27.5 }, { date: '2026-10-04', metric: 'vertical', value: 28.5 }],
  sleep: days.map((d, i) => ({ date: d, bed: '22:15', wake: '07:00', hours: 8.8 + (i % 2) * 0.4, quality: 4 })),
  keptDates: days, missedDates: [], lastCommitCheck: '2026-10-04', badges: ['first', 'streak3'],
  lessonsDone: { beef: { quiz: true }, 'triple-threat': { quiz: true }, 'next-play': { quiz: true }, 'ft-routine': { quiz: false } },
  alarms: [
    { id: 'a1', time: '06:15', label: 'Rise & grind', kind: 'wake', days: [1,2,3,4,5], sound: 'buzzer', snooze: 9, challenge: true, on: true },
    { id: 'a2', time: '21:45', label: 'Lights out', kind: 'bedtime', days: [0,1,2,3,4,5,6], sound: 'chime', snooze: 9, challenge: false, on: true },
  ],
  settings: { aiCoach: true, appearance: 'light' }, updatedAt: Date.now(),
};
const font = `:root:root:root{--display:"Inter Display","Inter",sans-serif;--body:"Inter",sans-serif;--round:"Inter",sans-serif} *,*::before,*::after{animation:none!important;transition:none!important}`;
const go = async (hash) => { await p.goto(url + hash); await p.reload(); await p.addStyleTag({ content: font }); await p.clock.runFor(700); };
await p.goto(url); await p.evaluate((s) => localStorage.setItem('courtside:v2', JSON.stringify(s)), seed);
await go('#home'); await p.screenshot({ path: out + '/home.png' });
await go('#train');
for (let i = 0; i < 3; i++) await p.click(`[data-action=toggle-drill] >> nth=${i}`);
for (let i = 0; i < 9; i++) await p.click('[data-action=shot][data-made="1"] >> nth=0');
for (let i = 0; i < 3; i++) await p.click('[data-action=shot][data-made="0"] >> nth=0');
await p.clock.runFor(3500); await p.click('.celebrate').catch(()=>{}); await p.clock.runFor(400);
await p.evaluate(() => document.querySelectorAll('.xp-float,.toast').forEach(e => e.remove()));
await p.evaluate(() => document.querySelector('.drills').scrollIntoView({ block: 'start' })); await p.evaluate(() => window.scrollBy(0, -150));
await p.screenshot({ path: out + '/train.png' });
await go('#learn'); await p.screenshot({ path: out + '/learn.png' });
await go('#lesson-pressure'); await p.click('[data-action=lesson-answer][data-i="1"]'); await p.clock.runFor(3500); await p.click('.celebrate').catch(()=>{});
await p.evaluate(() => document.querySelectorAll('.xp-float,.toast').forEach(e => e.remove()));
await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: out + '/lesson.png' });
await go('#ranks'); await p.screenshot({ path: out + '/ranks.png' });
await go('#alarms'); await p.screenshot({ path: out + '/alarms.png' });
await p.click('.alarm-row.kind-wake [data-action=alarm-edit]'); await p.clock.runFor(300);
await p.click('[data-action=alarm-test]'); await p.clock.runFor(600);
await p.evaluate(() => { document.querySelector('.alarm-sound')?.remove(); document.querySelector('.alarm-card .eyebrow').textContent = 'Wake up'; document.querySelector('.alarm-card .alarm-time').innerHTML = '6:15<small>AM</small>'; });
await p.screenshot({ path: out + '/alarm-ring.png' });
console.log(JSON.stringify(errs));
await b.close();
