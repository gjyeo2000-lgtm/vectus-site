const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'vectus-site-status-'));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [lang, file] of [['ko', 'index.html'], ['en', 'en/index.html']]) {
      for (const width of [1440, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`file:///${root.replaceAll('\\', '/')}/${file}`);
        const section = page.locator('.service-status');
        await section.scrollIntoViewIfNeeded();
        assert.equal(await section.locator('article').count(), 3);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${lang} ${width}: horizontal overflow`);
        assert.equal(await section.evaluate(node => node.scrollWidth <= node.clientWidth), true, `${lang} ${width}: status overflow`);
        await section.screenshot({ path: path.join(output, `${lang}-${width}.png`) });
      }
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, screenshots: output }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
