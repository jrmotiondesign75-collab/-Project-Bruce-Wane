// usage: node render.mjs <page.html> <out-dir> frames <fps> [from-frame] [to-frame]
//        node render.mjs <page.html> <out-dir> times t1,t2,...
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const [html, outDir, mode, arg, from, to] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('file://' + html);
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
await p.waitForTimeout(300);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outDir + '/cues.json', JSON.stringify(await p.evaluate(() => window.CUES)));
const shot = async (t, path) => { await p.evaluate((t) => render(t), t); await p.screenshot({ path, type: 'jpeg', quality: 92 }); };
if (mode === 'times') {
  for (const [i, t] of arg.split(',').map(Number).entries()) await shot(t, `${outDir}/k_${String(i).padStart(2, '0')}.jpg`);
} else {
  const fps = Number(arg), n = Math.round((await p.evaluate(() => DURATION)) * fps);
  for (let i = Number(from || 0); i < Math.min(n, Number(to || n)); i++) await shot(i / fps, `${outDir}/f_${String(i).padStart(5, '0')}.jpg`);
}
console.log(JSON.stringify(errs));
await b.close();
