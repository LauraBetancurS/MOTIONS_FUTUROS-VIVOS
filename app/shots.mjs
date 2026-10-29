import { chromium } from 'playwright-core';
const times = process.argv[2].split(',').map(Number);
const out = process.argv[3];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const logs=[]; p.on('console', m => { if (m.type()==='error') logs.push(m.text()); }); p.on('pageerror', e => logs.push(e.message));
await p.goto('http://localhost:5199/?export=1');
await p.waitForFunction(() => window.__pdoom?.ready || window.__pdoom?.error, null, { timeout: 120000 });
const err = await p.evaluate(() => window.__pdoom.error || window.__pdoom.errors.join('\n'));
if (err) console.log('ERR', err);
console.log(JSON.stringify(await p.evaluate(() => window.__pdoom.timeline)));
for (const t of times) {
  await p.evaluate((t) => window.__pdoom.still(t), t);
  const png = await p.evaluate(() => window.__pdoom.png());
  (await import('fs')).writeFileSync(`${out}/t${t.toFixed(2)}.png`, Buffer.from(png, 'base64'));
}
console.log(logs.slice(0,10).join('\n'));
await b.close();
