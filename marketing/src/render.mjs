import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const [html, outDir, mode, fps = '30'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + html);
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
await p.waitForTimeout(300);
fs.mkdirSync(outDir, { recursive: true });
const cues = await p.evaluate(() => window.CUES);
fs.writeFileSync(outDir + '/cues.json', JSON.stringify({ ...cues, duration: await p.evaluate(() => DURATION) }));
if (mode === 'keys') {
  const times = [1.2, ...cues.scenes.map(s => s + 1.9), cues.end + 2.2];
  let i = 0;
  for (const t of times) { await p.evaluate((t) => render(t), t); await p.screenshot({ path: `${outDir}/k_${i++}.jpg`, type: 'jpeg', quality: 80 }); }
} else {
  const dur = await p.evaluate(() => DURATION); const n = Math.round(dur * Number(fps));
  for (let i = 0; i < n; i++) { await p.evaluate((t) => render(t), i / Number(fps)); await p.screenshot({ path: `${outDir}/f_${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 }); }
}
console.log(JSON.stringify(errs));
await b.close();
