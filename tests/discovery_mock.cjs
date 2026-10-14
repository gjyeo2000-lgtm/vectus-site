const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const file = path.resolve(__dirname, '../docs/plans/assets/2026-10-14-discovery-pages-mock.html');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'vectus-discovery-mock-'));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`file:///${file.replaceAll('\\', '/')}`);
      for (const screen of ['home', 'stock', 'fund', 'insurance']) {
        await page.locator(`.top-nav button[data-screen="${screen}"]`).click();
        assert.equal(await page.locator('.screen.active').getAttribute('id'), screen);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${screen} ${width}: horizontal overflow`);
        await page.screenshot({ path: path.join(output, `${screen}-${width}.png`), fullPage: true });
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.flow-line').first().evaluate(node => getComputedStyle(node).animationName), 'none');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, screenshots: output }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
