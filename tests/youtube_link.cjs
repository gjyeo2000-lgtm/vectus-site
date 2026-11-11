const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const channel = 'https://www.youtube.com/@vectuslab';
const schemaPages = ['', 'en', 'stock', 'fund-etf', 'insurance', 'en/stock', 'en/fund-etf', 'en/insurance'];
const footerPages = [...schemaPages, 'privacy', 'terms'];
const read = (route) => fs.readFileSync(path.join(root, route, 'index.html'), 'utf8');
const youtubeLinks = (html) => [...html.matchAll(/<a\b[^>]*\bhref="https:\/\/(?:www\.)?youtube\.com[^"]*"[^>]*>/g)].map((m) => m[0]);

test('every page footer links to the YouTube channel in a new tab', () => {
  for (const route of footerPages) {
    const footer = read(route).match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    const links = youtubeLinks(footer);
    assert.equal(links.length, 1, `${route || '/'} footer`);
    assert.match(links[0], new RegExp(`href="${channel}"`), route || '/');
    assert.match(links[0], /target="_blank"/, route || '/');
    assert.match(links[0], /rel="noopener noreferrer"/, route || '/');
    assert.match(links[0], /aria-label="[^"]+"/, route || '/');
  }
});

test('English pages say the channel is in Korean', () => {
  for (const route of schemaPages.filter((r) => r.startsWith('en'))) {
    const footer = read(route).match(/<footer[\s\S]*?<\/footer>/)[0];
    assert.match(footer, /YouTube \(Korean\)<\/a>/, route);
  }
});

test('both homepages show the channel under the contact paths', () => {
  for (const route of ['', 'en']) {
    const contact = read(route).match(/<section id="contact">[\s\S]*?<\/section>/)[0];
    assert.equal(youtubeLinks(contact).length, 1, route || '/');
  }
});

test('organization structured data lists the channel in sameAs', () => {
  for (const route of schemaPages) {
    const schema = JSON.parse(read(route).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(schema.publisher?.sameAs, [channel], route || '/');
  }
});

test('no page embeds YouTube video', () => {
  for (const route of footerPages) {
    assert.doesNotMatch(read(route), /youtube(?:-nocookie)?\.com\/embed|<iframe[^>]*youtube/i, route || '/');
  }
});

test('discovery page generator keeps the same footer link and sameAs', () => {
  const generator = fs.readFileSync(path.join(root, 'scripts', 'build-discovery-pages.cjs'), 'utf8');
  assert.match(generator, new RegExp(`const youtubeUrl = '${channel}';`));
  assert.match(generator, /sameAs: \[youtubeUrl\]/);
  assert.match(generator, /<span>\$\{stageText\} · \$\{youtubeLink\}<\/span><\/div><\/footer>/);
});
