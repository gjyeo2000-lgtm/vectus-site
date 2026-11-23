const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const slugs = ['etf-name-vs-holdings', 'recommendation-evidence-check', 'etf-overlap-diversification', 'price-rise-buy-check', 'fund-etf-price-basis', 'choose-recommendation-service', 'ask-ai-about-stocks', 'split-buying-basics', 'insufficient-data-stocks', 'check-my-insurance', 'no-recommendation-in-falling-market', 'market-regime-basics', 'us-etf-holdings-check', 'driver-insurance-overlap-check', 'fund-fee-class-check', 'dividend-investing-basics', 'vectus-service-flow', 'vectus-stock-check-tools', 'vectus-dividend-screen', 'vectus-post-drop-sideways-screen', 'vectus-my-portfolio-screen', 'vectus-market-fragility-check'];

test('guide articles are indexable, have canonical, description and structured data', () => {
  for (const slug of slugs) {
    const html = read(`guide/${slug}/index.html`);
    assert.doesNotMatch(html, /noindex/, slug);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://vectuslab\.com/guide/${slug}/">`), slug);
    assert.match(html, /<meta name="description" content="[^"]{40,}">/, slug);
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    const data = JSON.parse(ld[1]);
    assert.deepEqual(data['@graph'].map((n) => n['@type']), ['Article', 'FAQPage'], slug);
    assert.equal(data['@graph'][0].mainEntityOfPage, `https://vectuslab.com/guide/${slug}/`, slug);
  }
});

test('guide articles keep the approved disclaimer and do not promise returns', () => {
  for (const slug of slugs) {
    const html = read(`guide/${slug}/index.html`);
    assert.match(html, /투자 판단과 책임은 본인에게 있습니다/, slug);
    assert.match(html, /수익을 약속하지 않습니다/, slug);
  }
});

test('guide index and sitemap list every article and asset links resolve', () => {
  const sitemap = read('sitemap.xml');
  const index = read('guide/index.html');
  assert.match(sitemap, /https:\/\/vectuslab\.com\/guide\/<\/loc>/);
  for (const slug of slugs) {
    assert.ok(sitemap.includes(`https://vectuslab.com/guide/${slug}/</loc>`), `sitemap ${slug}`);
    assert.ok(index.includes(`href="/guide/${slug}/"`), `index ${slug}`);
  }
  const files = [['guide/index.html', 'guide'], ...slugs.map((s) => [`guide/${s}/index.html`, `guide/${s}`])];
  for (const [file, dir] of files) {
    for (const m of read(file).matchAll(/href="(\.\.[^"]+\.(?:css|png))"/g)) {
      assert.ok(fs.existsSync(path.join(root, dir, m[1])), `${file} -> ${m[1]}`);
    }
  }
});

test('guide link is in the Korean menus and articles end with a service button and a figure', () => {
  for (const p of ['index.html', 'stock/index.html', 'fund-etf/index.html', 'insurance/index.html', 'privacy/index.html', 'terms/index.html', 'guide/index.html']) {
    assert.match(read(p), /href="\/guide\/"/, p);
  }
  for (const slug of slugs) {
    const html = read(`guide/${slug}/index.html`);
    assert.match(html, /<figure class="guide-figure">[\s\S]*<svg[^>]*role="img"/, slug);
    assert.match(html, /<a class="guide-cta-button" href="https:\/\/vectuslab\.ai\/\?entry=guide"[^>]*rel="noopener noreferrer"/, slug);
    assert.match(html, /수익을 약속하지 않습니다/, slug);
  }
});

test('guide list shows every article as a card with its one-line answer', () => {
  const cards = read('guide/index.html').split('<li class="guide-card">').slice(1).map((c) => c.split('</li>')[0]);
  assert.equal(cards.length, slugs.length);
  for (const slug of slugs) {
    const card = cards.find((c) => c.includes(`href="/guide/${slug}/"`));
    assert.ok(card, slug);
    assert.ok(card.includes('<strong>한 줄 답</strong>'), slug);
    assert.ok(card.includes('글 읽기 →'), slug);
  }
});

test('guide index and every article load the shared anonymous visit beacon', () => {
  for (const route of ['guide'].concat(slugs.map((slug) => 'guide/' + slug))) {
    const html = fs.readFileSync(path.join(root, route, 'index.html'), 'utf8');
    assert.match(html, /<script defer src="\/site-visits\.js"><\/script>/, route);
  }
});

test('every service link in guide pages carries the guide entry marker, never the website marker', () => {
  let found = 0;
  for (const slug of slugs) {
    const html = fs.readFileSync(path.join(root, 'guide', slug, 'index.html'), 'utf8');
    for (const match of html.matchAll(/<a\b[^>]*\bhref="(https:\/\/vectuslab\.ai[^"]*)"/g)) {
      found += 1;
      assert.match(match[1], /[?&]entry=guide$/, slug + ': ' + match[1]);
    }
  }
  assert.ok(found >= slugs.length * 2, 'guide service links ' + found);
});
