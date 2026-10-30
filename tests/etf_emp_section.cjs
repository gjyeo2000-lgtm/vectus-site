const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });
  try {
    for (const [language, file] of [['ko', 'index.html'], ['en', 'en/index.html']]) {
      for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.resolve(__dirname, '..', file)).href, { waitUntil: 'domcontentloaded' });
        const section = page.locator('#etf-emp');
        assert.equal(await section.count(), 1, `${language}: ETF section missing`);
        assert.equal(await section.locator('a').count(), 0, `${language}: no service link belongs in this section`);
        assert.equal(await section.locator('svg animateMotion').count(), 1, `${language}: animated chart missing`);
        const expectedTabs = 4;
        assert.equal(await section.locator('[role="tab"]').count(), expectedTabs, `${language}: tab count`);
        assert.equal(await section.locator('[role="tabpanel"]').count(), expectedTabs, `${language}: panel count`);
        for (let index = 0; index < expectedTabs; index++) {
          const tab = section.locator('[role="tab"]').nth(index);
          await tab.click();
          const controlled = await tab.getAttribute('aria-controls');
          assert.equal(await section.locator(`#${controlled}`).isVisible(), true);
          assert.equal(await section.locator('[role="tabpanel"]:visible').count(), 1);
          assert.equal(await tab.getAttribute('aria-selected'), 'true');
        }
        {
          const us = section.locator('#ee-panel-us');
          await section.locator('#ee-tab-us').click();
          assert.equal(await us.isVisible(), true, `${language}: US ETF panel hidden`);
          assert.equal(await us.locator('svg[viewBox="0 0 300 150"]').count(), 1);
          assert.equal(await us.locator('svg animateMotion').count(), 0, `${language}: US ETF diagram is static`);
          assert.equal(await us.locator('.ee-status').innerText(), language === 'ko' ? '준비중' : 'Coming soon');
          assert.ok((await us.innerText()).includes(language === 'ko' ? '57개' : '57 US ETFs'));
          assert.equal(await us.locator('svg text', { hasText: /\d/ }).count(), 0, `${language}: no digits in the diagram`);
          await section.locator('#ee-tab-overlap').focus();
          await page.keyboard.press('ArrowRight');
          assert.equal(await section.locator('#ee-tab-us').getAttribute('aria-selected'), 'true');
          await page.keyboard.press('ArrowRight');
          assert.equal(await section.locator('#ee-tab-pick').getAttribute('aria-selected'), 'true', `${language}: arrow keys wrap from last tab to first`);
        }
        await section.locator('[role="tab"]').first().focus();
        await page.keyboard.press('ArrowRight');
        assert.equal(await section.locator('[role="tab"]').nth(1).getAttribute('aria-selected'), 'true');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${language}/${width}: horizontal overflow`);
        assert.deepEqual(errors, [], `${language}/${width}: page errors`);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
