import { chromium } from 'playwright';

const shots = '/tmp/gba_shots';
import fs from 'fs';
fs.mkdirSync(shots, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push('pageerror: ' + err.message));

await page.goto('http://localhost:5173/');
await page.click('text=[DEV] Entrar como Bruno');
await page.waitForURL('**/home');
console.log('logged in OK');

// 1. GBA page, rows
await page.goto('http://localhost:5173/gba');
await page.waitForSelector('text=Em Destaque', { timeout: 15000 });
await page.screenshot({ path: `${shots}/01_gba_rows.png` });
console.log('rows rendered OK');

// check a cover image actually resolves
const coverSrcs = await page.$$eval('img', imgs => imgs.map(i => i.src).filter(s => s.includes('/covers/gba/')));
console.log('cover img srcs found:', coverSrcs.length, coverSrcs[0]);
if (coverSrcs.length) {
  const resp = await page.request.get(coverSrcs[0]);
  console.log('cover HTTP status:', resp.status());
}

// 2. open a game modal
const firstCard = await page.$('img[src*="/covers/gba/"]');
if (firstCard) {
  await firstCard.click({ force: true }).catch(() => {});
}
// fallback: click on a card container
await page.waitForTimeout(500);
const modalVisible = await page.$('text=Adicionar à lista').catch(() => null);
await page.screenshot({ path: `${shots}/02_after_click.png` });

// 3. sidebar filters
await page.screenshot({ path: `${shots}/03_sidebar.png` });
const linkCableFilter = await page.$('text=Link Cable');
console.log('Link Cable filter present:', !!linkCableFilter);

// 4. search -> grid
await page.fill('input[type="search"]', 'Pokemon');
await page.waitForTimeout(800);
await page.screenshot({ path: `${shots}/04_search_grid.png` });
await page.fill('input[type="search"]', '');

// 5. dashboard
await page.goto('http://localhost:5173/dashboard');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${shots}/05_dashboard.png` });
const dashText = await page.textContent('body');
console.log('dashboard mentions GBA:', dashText.includes('GBA'));

// 6. regression: ps2 and snes
await page.goto('http://localhost:5173/ps2');
await page.waitForSelector('text=Em Destaque', { timeout: 15000 });
await page.screenshot({ path: `${shots}/06_ps2.png` });

await page.goto('http://localhost:5173/snes');
await page.waitForSelector('text=Em Destaque', { timeout: 15000 });
await page.screenshot({ path: `${shots}/07_snes.png` });

console.log('--- console errors ---');
console.log(errors.slice(0, 30).join('\n'));

await browser.close();

// extra checks: trailer iframe + download link on the modal we already have open is gone now
// (we navigated away). Reopen Advance Wars specifically.
