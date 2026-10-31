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
        assert.equal(await section.locator('.ee-chart svg animateMotion').count(), 1, `${language}: animated chart missing`);
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
          // 미국 ETF 패널: 목업 1(앱)과 같은 구조·문구, 사이트 스킨, 움직이는 도표(목업 3, PO 승인 2026-10-30).
          const us = section.locator('#ee-panel-us');
          const copy = language === 'ko'
            ? { tabs: ['수익률 순위', '이평선·거래량', '수익률·위험', '구성종목'], count: '57개' }
            : { tabs: ['Return ranking', 'Moving average · volume', 'Return · risk', 'Holdings'], count: '57 ETFs' };
          await section.locator('#ee-tab-us').click();
          assert.equal(await us.isVisible(), true, `${language}: US ETF panel hidden`);
          assert.equal(await us.locator('.ee-us-chip').count(), 1, `${language}: only the product-kind chip, no status chip`);
          assert.equal(await section.locator('.ee-tab-new').count(), 0, `${language}: no new badge on the US ETF tab`);
          assert.ok(!/준비중|Coming soon/.test(await us.innerText()), `${language}: no coming-soon wording`);
          assert.ok((await us.innerText()).includes(copy.count), `${language}: 57 ETFs copy`);
          assert.deepEqual(await us.locator('.ee-us-tab').allInnerTexts(), copy.tabs, `${language}: card tab names`);
          assert.equal(await us.locator('.ee-us-card--feat').count(), 1, `${language}: one featured card`);
          assert.equal(await us.locator('svg[role="img"][viewBox="0 0 120 56"]').count(), 4, `${language}: four diagrams`);
          assert.deepEqual(await us.locator('svg text').allTextContents(), ['ETF A', 'ETF B'], `${language}: only the ETF A/B labels are text in the diagrams`);
          assert.equal(await us.locator('svg animateMotion').count(), 0, `${language}: diagrams move by CSS only`);
          assert.equal(await us.locator('svg text', { hasText: /\d/ }).count(), 0, `${language}: no digits in the diagrams`);
          assert.equal(await us.locator('a').count(), 0, `${language}: no service link in the US ETF panel`);
          const companyLine = language === 'ko'
            ? '담은 종목은 「기업분석 ›」으로 이어져 그 기업의 재무까지 볼 수 있습니다. 벡투스가 지원하는 미국 상장 종목만 연결됩니다.'
            : 'Holdings link to company analysis ›, showing that company’s financials. Only US-listed stocks that Vectus supports are linked.';
          assert.equal(await us.locator('.ee-us-link').innerText(), companyLine, `${language}: company analysis line`);
          assert.equal(await us.locator('.ee-us-cards .ee-us-card').count(), 4, `${language}: stays at four cards`);
          const moving = await us.locator('.ee-us-card').first().evaluate(node => getComputedStyle(node).animationName);
          assert.notEqual(moving, 'none', `${language}: diagrams move by default`);
          await page.emulateMedia({ reducedMotion: 'reduce' });
          const still = await us.locator('.ee-us-card').first().evaluate(node => getComputedStyle(node).animationName);
          assert.equal(still, 'none', `${language}: reduced motion stops the diagrams`);
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await section.locator('#ee-tab-overlap').focus();
          await page.keyboard.press('ArrowRight');
          assert.equal(await section.locator('#ee-tab-us').getAttribute('aria-selected'), 'true');
          await page.keyboard.press('ArrowRight');
          assert.equal(await section.locator('#ee-tab-pick').getAttribute('aria-selected'), 'true', `${language}: arrow keys wrap from the last tab to the first`);
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
