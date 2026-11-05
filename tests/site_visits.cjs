const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pages = ['', 'en', 'stock', 'fund-etf', 'insurance', 'en/stock', 'en/fund-etf', 'en/insurance'];

test('every published page loads the shared anonymous visit beacon', () => {
  for (const route of pages) {
    const html = fs.readFileSync(path.join(root, route, 'index.html'), 'utf8');
    assert.match(html, /<script defer src="\/site-visits\.js"><\/script>/, route || '/');
  }
});

test('beacon sends the same unique anonymous event to AWS and test without credentials', () => {
  const script = fs.readFileSync(path.join(root, 'site-visits.js'), 'utf8');
  const calls = [];
  const context = { location: { hostname: 'vectuslab.com', pathname: '/en/stock/' },
    crypto: { randomUUID: () => 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' },
    fetch: (...args) => { calls.push(args); return Promise.resolve(); } };
  context.globalThis = context;
  vm.runInNewContext(script, context);
  assert.deepEqual(calls.map((call) => call[0]), [
    'https://vectuslab.ai/api/public/site-visit',
    'https://test.vectuslab.ai/api/public/site-visit',
  ]);
  for (const call of calls) {
    assert.deepEqual(JSON.parse(call[1].body), {
      event_id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', path: '/en/stock/',
    });
    assert.equal(call[1].credentials, 'omit');
    assert.equal(call[1].mode, 'no-cors');
  }
  calls.length = 0;
  context.location.pathname = '/fund-etf/';
  vm.runInNewContext(script, context);
  assert.equal(JSON.parse(calls[0][1].body).path, '/fund-etf/');
  calls.length = 0;
  context.location.hostname = 'unrelated.example';
  vm.runInNewContext(script, context);
  assert.equal(calls.length, 0);
});

function runWithDocument(script, hostname, pathname) {
  const calls = [];
  const listeners = {};
  let counter = 0;
  const context = { URL, location: { hostname, pathname, href: `https://${hostname}${pathname}` },
    crypto: { randomUUID: () => `bbbbbbbb-bbbb-4bbb-bbbb-${String(++counter).padStart(12, '0')}` },
    document: { addEventListener: (name, fn) => { listeners[name] = fn; } },
    fetch: (...args) => { calls.push(args); return Promise.resolve(); } };
  context.globalThis = context;
  vm.runInNewContext(script, context);
  return { calls, listeners };
}

const linkTo = (href) => ({ target: { closest: () => ({ href }) }, type: 'click', button: 0 });

test('service link click sends one cta signal to both servers with its own event id', () => {
  const script = fs.readFileSync(path.join(root, 'site-visits.js'), 'utf8');
  const { calls, listeners } = runWithDocument(script, 'vectuslab.com', '/stock/');
  calls.length = 0;
  listeners.click(linkTo('https://vectuslab.ai/?entry=website'));
  assert.deepEqual(calls.map((call) => call[0]), [
    'https://vectuslab.ai/api/public/site-visit',
    'https://test.vectuslab.ai/api/public/site-visit',
  ]);
  const bodies = calls.map((call) => JSON.parse(call[1].body));
  assert.equal(bodies[0].kind, 'cta');
  assert.equal(bodies[0].path, '/stock/');
  assert.deepEqual(bodies[0], bodies[1]);
  listeners.click(linkTo('https://vectuslab.ai/guest-home?entry=website'));
  assert.notEqual(JSON.parse(calls[2][1].body).event_id, bodies[0].event_id);
});

test('only marked service links count; middle button counts, right button and other links do not', () => {
  const script = fs.readFileSync(path.join(root, 'site-visits.js'), 'utf8');
  const { calls, listeners } = runWithDocument(script, 'vectuslab.com', '/');
  calls.length = 0;
  listeners.click(linkTo('https://vectuslab.ai/'));
  listeners.click(linkTo('https://test.vectuslab.ai/?entry=website'));
  listeners.click(linkTo('https://example.com/?entry=website'));
  listeners.click(linkTo('/stock/'));
  listeners.click({ target: { closest: () => null }, type: 'click', button: 0 });
  assert.equal(calls.length, 0);
  listeners.auxclick({ ...linkTo('https://vectuslab.ai/?entry=website'), type: 'auxclick', button: 2 });
  assert.equal(calls.length, 0);
  listeners.auxclick({ ...linkTo('https://vectuslab.ai/?entry=website'), type: 'auxclick', button: 1 });
  assert.equal(calls.length, 2);
});

test('every link to the service carries the website entry marker', () => {
  const pagesAndGenerator = [...pages.map((route) => path.join(route, 'index.html')), 'scripts/build-discovery-pages.cjs'];
  let found = 0;
  for (const file of pagesAndGenerator) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of text.matchAll(/<a\b[^>]*\bhref="(https:\/\/vectuslab\.ai[^"]*)"/g)) {
      found += 1;
      assert.match(match[1], /[?&]entry=website$/, `${file}: ${match[1]}`);
    }
  }
  assert.ok(found >= 13, `서비스 링크 ${found}곳`);
});

