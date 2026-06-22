import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('http://localhost:5173/');
await page.click('text=[DEV] Entrar como Bruno');
await page.waitForURL('**/home');
await page.goto('http://localhost:5173/gba');
await page.waitForSelector('text=Em Destaque', { timeout: 15000 });
const card = await page.$('img[src*="/covers/gba/"]');
await card.click({ force: true });
await page.waitForTimeout(1500);
const iframeSrc = await page.$eval('iframe', el => el.src).catch(() => null);
console.log('trailer iframe src:', iframeSrc);
const dlHref = await page.$$eval('a', as => as.map(a => a.href).filter(h => h.includes('archive.org')));
console.log('archive.org links:', dlHref);
if (dlHref.length) {
  const resp = await page.request.head(dlHref[0]).catch(e => ({status: 'ERR ' + e.message}));
  console.log('download link status (head):', resp.status ? resp.status() : resp.status);
}
await page.screenshot({ path: '/tmp/gba_shots/08_modal_detail.png' });
await browser.close();
