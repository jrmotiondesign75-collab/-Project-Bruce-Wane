import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const [html, outDir, mode, fps = '30'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + html);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
fs.mkdirSync(outDir, { recursive: true });
if (mode === 'keys') {
  const times = [0.6, 1.8, 3.4, 4.6, 7.0, 8.6, 10.8, 12.0, 14.6, 17.4];
  for (const t of times) { await p.evaluate((t) => render(t), t); await p.screenshot({ path: `${outDir}/k_${String(t).replace('.', '_')}.jpg`, type: 'jpeg', quality: 85 }); }
} else {
  const dur = await p.evaluate(() => DURATION); const n = Math.round(dur * Number(fps));
  for (let i = 0; i < n; i++) { await p.evaluate((t) => render(t), i / Number(fps)); await p.screenshot({ path: `${outDir}/f_${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 }); }
}
console.log(JSON.stringify(errs));
await b.close();
