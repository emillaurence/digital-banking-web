// node inspect.js <url> "<selector>" [prop,prop,...] [--dialog] [--fill]
const { chromium } = require('playwright-core');
(async () => {
  const [url, sel, propsArg, ...flags] = process.argv.slice(2);
  const props = (propsArg || 'font,color,backgroundColor,padding,margin,lineHeight,letterSpacing,height,borderRadius,boxShadow').split(',');
  const browser = await chromium.connectOverCDP('http://localhost:29229');
  const page = await browser.contexts()[0].newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  if (flags.includes('--dialog')) {
    if ((url.includes('4200') || url.includes('4400'))) {
      await page.locator('bofa-text-input input').nth(0).fill('Acme');
      await page.locator('bofa-text-input input').nth(1).fill('1');
      await page.locator('bofa-datepicker input').fill('9/15/2026');
      await page.locator('form button[type=submit]').click();
    } else await page.locator('.holdings-actions bofa-button button').click();
    await page.waitForTimeout(800);
  }
  const out = await page.evaluate(([sel, props]) => [...document.querySelectorAll(sel)].map((el) => {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const o = { tag: el.tagName.toLowerCase(), cls: el.className, box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] };
    for (const p of props) o[p] = cs[p];
    return o;
  }), [sel, props]);
  console.log(JSON.stringify(out, null, 1));
  await page.close(); await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
