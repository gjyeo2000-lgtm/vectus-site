const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const routes = ['stock', 'fund-etf', 'insurance'];
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.xml': 'application/xml' };

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const target = path.resolve(root, `.${pathname}`, pathname.endsWith('/') ? 'index.html' : '');
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream' });
  fs.createReadStream(target).pipe(response);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'vectus-discovery-pages-'));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [lang, prefix] of [['ko', ''], ['en', '/en']]) {
      await page.goto(`${origin}${prefix}/`, { waitUntil: 'domcontentloaded' });
      const cards = page.locator('.service-status-grid article');
      assert.equal(await cards.count(), 3);
      assert.equal(await cards.nth(0).locator('.service-status-links a').count(), 2);
      assert.equal(await cards.nth(1).locator('.service-status-links a').count(), 1);
      assert.equal(await cards.nth(2).locator('a').count(), 0);
      assert.equal(await page.locator('.trust-graph').count(), 2, `${lang}: original home graphs changed`);
      for (const route of routes) {
        const routeUrl = `${origin}${prefix}/${route}/`;
        const source = fs.readFileSync(path.join(root, 'docs/plans/assets', `2026-10-14-discovery-v2-${route}.html`), 'utf8');
        for (const width of [1440, 768, 390, 320]) {
          await page.setViewportSize({ width, height: 900 });
          const response = await page.goto(routeUrl, { waitUntil: 'domcontentloaded' });
          await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)');
          assert.equal(response.status(), 200, `${lang}/${route}: response`);
          assert.equal(await page.locator('html').getAttribute('lang'), lang);
          assert.equal(await page.locator('main h1').count(), 1);
          const testWebLink = page.locator('.site-header .test-web-link');
          assert.equal(await testWebLink.count(), 1, `${lang}/${route}: missing test web return button`);
          assert.equal(await testWebLink.getAttribute('href'), 'https://test.vectuslab.ai');
          assert.equal(await testWebLink.innerText(), lang === 'ko' ? '초대 테스트로 돌아가기' : 'Return to test web');
          assert.equal(await testWebLink.isVisible(), true, `${lang}/${route}/${width}: return button hidden`);
          assert.equal(await page.locator('meta[name="robots"]').count(), 0);
          assert.equal(await page.locator('.mock-banner').count(), 0);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${lang}/${route}/${width}: overflow`);
          assert.equal(await page.locator('.diagram svg').count(), (source.match(/<svg viewBox=/g) || []).length, `${lang}/${route}: mock graph mismatch`);
          assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://vectuslab.com${prefix}/${route}/`);
          assert.equal(await page.locator('link[rel="alternate"][hreflang="ko"]').getAttribute('href'), `https://vectuslab.com/${route}/`);
          assert.equal(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href'), `https://vectuslab.com/en/${route}/`);
          assert.equal(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(10, 11, 13)', `${lang}/${route}: stylesheet missing`);
          const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
          assert.equal(schema['@type'], 'WebPage');
          assert.equal(schema.inLanguage, lang);
          assert.equal(schema.url, `https://vectuslab.com${prefix}/${route}/`);
          if (width === 1440) {
            for (const href of await page.locator('main a[href]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))) {
              if (href.startsWith('#')) {
                assert.equal(await page.locator(`[id="${href.slice(1)}"]`).count(), 1, `${lang}/${route}: broken anchor ${href}`);
              } else if (href.startsWith('/')) {
                const target = await page.request.get(`${origin}${href}`);
                assert.equal(target.status(), 200, `${lang}/${route}: broken link ${href}`);
              }
            }
          }
          if (lang === 'en') assert.doesNotMatch(await page.locator('main').innerText(), /[가-힣]/, `${route}: untranslated copy`);
          if (width === 1440 || width === 390) await page.screenshot({ path: path.join(output, `${lang}-${route}-${width}.png`), fullPage: true });
        }
      }
    }
    await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('.service-status-links a[href="/stock/"]').click();
    assert.match(page.url(), /\/stock\/$/);
    await page.locator('.lang-link').click();
    assert.match(page.url(), /\/en\/stock\/$/);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.diagram path').first().evaluate(node => getComputedStyle(node).animationName), 'none');
    assert.deepEqual(errors, []);
    const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    for (const route of routes) for (const prefix of ['', 'en/']) assert.ok(sitemap.includes(`https://vectuslab.com/${prefix}${route}/`));
    assert.doesNotMatch(sitemap, /docs\/plans\/assets/);
    console.log(JSON.stringify({ passed: true, screenshots: output }));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
