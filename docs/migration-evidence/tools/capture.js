// Usage: node capture.js <outDir>
// Requires retail-banking on :4200 and wealth-portal on :4300. Connects to the
// session Chrome over CDP so rendering matches what a reviewer sees.
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const outDir = process.argv[2];
if (!outDir) throw new Error('outDir required');
fs.mkdirSync(outDir, { recursive: true });

const VIEWPORT = { width: 1280, height: 900 };

async function shot(page, name, locator) {
  const file = path.join(outDir, `${name}.png`);
  if (locator) await locator.screenshot({ path: file, animations: 'disabled' });
  else await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  return file;
}

async function metrics(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const rows = [...document.querySelectorAll('bofa-table tbody tr')].map((r) => Math.round(r.getBoundingClientRect().height));
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      horizontalOverflow: doc.scrollWidth > doc.clientWidth,
      tableWidth: box('bofa-table table')?.w ?? null,
      tableRowHeights: rows,
      firstCard: box('bofa-card'),
      firstButton: box('bofa-button button'),
      firstFormField: box('bofa-text-input') || null,
      dialog: box('.mat-dialog-container, .mat-mdc-dialog-container, .mat-mdc-dialog-surface'),
      h1Font: getComputedStyle(document.querySelector('h1')).font,
      buttonFont: document.querySelector('bofa-button button') ? getComputedStyle(document.querySelector('bofa-button button')).font : null,
      buttonRadius: document.querySelector('bofa-button button') ? getComputedStyle(document.querySelector('bofa-button button')).borderRadius : null,
      buttonBg: document.querySelector('bofa-button button') ? getComputedStyle(document.querySelector('bofa-button button')).backgroundColor : null,
      buttonColor: document.querySelector('bofa-button button') ? getComputedStyle(document.querySelector('bofa-button button')).color : null,
      cardRadius: document.querySelector('bofa-card > *') ? getComputedStyle(document.querySelector('bofa-card > *')).borderRadius : null,
      cardShadow: document.querySelector('bofa-card > *') ? getComputedStyle(document.querySelector('bofa-card > *')).boxShadow : null,
      headerCell: document.querySelector('bofa-table th') ? (({ color, fontWeight, fontSize, textTransform, letterSpacing, borderBottom }) => ({ color, fontWeight, fontSize, textTransform, letterSpacing, borderBottom }))(getComputedStyle(document.querySelector('bofa-table th'))) : null,
    };
  });
}

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

async function run() {
  const browser = await chromium.connectOverCDP('http://localhost:29229');
  const context = browser.contexts()[0];
  const report = {};

  // ---------------- retail-banking ----------------
  {
    const page = await context.newPage();
    await page.setViewportSize(VIEWPORT);
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
    await settle(page);
    const m = { initial: await metrics(page) };
    await shot(page, 'retail-01-full');
    await shot(page, 'retail-02-cards', page.locator('.summary-grid'));
    await shot(page, 'retail-03-table', page.locator('bofa-table'));
    await shot(page, 'retail-04-form', page.locator('form'));
    await shot(page, 'retail-05-primary-button', page.locator('form bofa-button'));

    await page.locator('bofa-text-input input').first().focus();
    await page.waitForTimeout(300);
    await shot(page, 'retail-06-form-focused', page.locator('form'));

    await page.locator('bofa-text-input input').nth(0).fill('Acme Utilities');
    await page.locator('bofa-text-input input').nth(1).fill('125.5');
    await page.locator('bofa-datepicker input').fill('9/15/2026');
    await page.locator('bofa-datepicker input').blur();
    await page.waitForTimeout(300);
    await shot(page, 'retail-07-form-filled', page.locator('form'));

    await page.locator('bofa-datepicker button').click();
    await page.waitForTimeout(600);
    await shot(page, 'retail-08-datepicker-open');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    await page.locator('form button[type=submit]').click();
    await page.waitForSelector('mat-dialog-container, .mat-mdc-dialog-container', { state: 'visible' });
    await page.waitForTimeout(600);
    m.dialogOpen = await metrics(page);
    await shot(page, 'retail-09-dialog-open');
    await shot(page, 'retail-10-dialog', page.locator('mat-dialog-container, .mat-mdc-dialog-container').first());

    await page.locator('mat-dialog-actions bofa-button').nth(1).locator('button').click();
    await page.waitForSelector('mat-dialog-container, .mat-mdc-dialog-container', { state: 'detached' });
    await page.waitForTimeout(600);
    m.afterConfirm = await metrics(page);
    await shot(page, 'retail-11-after-confirm-table', page.locator('bofa-table'));
    await shot(page, 'retail-12-after-confirm-full');
    report.retail = m;
    await page.close();
  }

  // ---------------- wealth-portal ----------------
  {
    const page = await context.newPage();
    await page.setViewportSize(VIEWPORT);
    await page.goto('http://localhost:4300/', { waitUntil: 'networkidle' });
    await settle(page);
    const m = { initial: await metrics(page) };
    await shot(page, 'wealth-01-full');
    await shot(page, 'wealth-02-cards', page.locator('.summary-grid'));
    await shot(page, 'wealth-03-table', page.locator('bofa-table'));
    await shot(page, 'wealth-04-secondary-button', page.locator('.holdings-actions bofa-button'));

    await page.locator('.holdings-actions bofa-button button').click();
    await page.waitForSelector('mat-dialog-container, .mat-mdc-dialog-container', { state: 'visible' });
    await page.waitForTimeout(600);
    m.dialogOpen = await metrics(page);
    await shot(page, 'wealth-05-dialog-open');
    await shot(page, 'wealth-06-dialog', page.locator('mat-dialog-container, .mat-mdc-dialog-container').first());

    await page.locator('mat-dialog-actions bofa-button').nth(1).locator('button').click();
    await page.waitForSelector('mat-dialog-container, .mat-mdc-dialog-container', { state: 'detached' });
    await page.waitForTimeout(600);
    m.afterConfirm = await metrics(page);
    await shot(page, 'wealth-07-after-confirm', page.locator('.holdings-actions'));
    await shot(page, 'wealth-08-after-confirm-full');
    report.wealth = m;
    await page.close();
  }

  fs.writeFileSync(path.join(outDir, 'metrics.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(`captured to ${outDir}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
