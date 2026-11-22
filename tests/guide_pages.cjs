const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('guide article is indexable, has canonical, description and structured data', () => {
  const html = read('guide/etf-name-vs-holdings/index.html');
  assert.doesNotMatch(html, /noindex/);
  assert.match(html, /<link rel="canonical" href="https:\/\/vectuslab\.com\/guide\/etf-name-vs-holdings\/">/);
  assert.match(html, /<meta name="description" content="[^"]{40,}">/);
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const data = JSON.parse(ld[1]);
  assert.deepEqual(data['@graph'].map((n) => n['@type']), ['Article', 'FAQPage']);
});

test('guide article keeps the approved disclaimer and does not promise returns', () => {
  const html = read('guide/etf-name-vs-holdings/index.html');
  assert.match(html, /투자 판단과 책임은 본인에게 있습니다/);
  assert.match(html, /수익을 약속하지 않습니다/);
});

test('sitemap lists the guide pages and asset links resolve to existing files', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /https:\/\/vectuslab\.com\/guide\/<\/loc>/);
  assert.match(sitemap, /https:\/\/vectuslab\.com\/guide\/etf-name-vs-holdings\/<\/loc>/);
  for (const [file, dir] of [['guide/index.html', 'guide'], ['guide/etf-name-vs-holdings/index.html', 'guide/etf-name-vs-holdings']]) {
    for (const m of read(file).matchAll(/href="(\.\.[^"]+\.(?:css|png))"/g)) {
      assert.ok(fs.existsSync(path.join(root, dir, m[1])), `${file} -> ${m[1]}`);
    }
  }
});
