const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const assetDir = path.resolve(__dirname, '../docs/plans/assets');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'vectus-discovery-v2-'));
  const pages = ['home', 'stock', 'fund-etf', 'insurance'];
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of pages) {
        const file = path.join(assetDir, `2026-10-14-discovery-v2-${name}.html`);
        await page.goto(pathToFileURL(file).href);
        assert.equal(await page.locator('html').getAttribute('lang'), 'ko');
        assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,nofollow');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} ${width}: horizontal overflow`);
        assert.equal(await page.locator('main h1').count(), 1);
        if (name !== 'home') assert.ok(await page.locator('.diagram svg').count() >= 2, `${name}: missing visual explanation`);
        await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true });
      }
    }
    await page.goto(pathToFileURL(path.join(assetDir, '2026-10-14-discovery-pages-mock.html')).href);
    await page.waitForURL(/discovery-v2-home\.html/);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(pathToFileURL(path.join(assetDir, '2026-10-14-discovery-v2-stock.html')).href);
    assert.equal(await page.locator('.diagram path').first().evaluate(node => getComputedStyle(node).animationName), 'none');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, screenshots: output }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
