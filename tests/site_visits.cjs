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

test('beacon sends one unique anonymous event without credentials', () => {
  const script = fs.readFileSync(path.join(root, 'site-visits.js'), 'utf8');
  const calls = [];
  const context = { location: { hostname: 'vectuslab.com', pathname: '/en/stock/' },
    crypto: { randomUUID: () => 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' },
    fetch: (...args) => { calls.push(args); return Promise.resolve(); } };
  context.globalThis = context;
  vm.runInNewContext(script, context);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://test.vectuslab.ai/api/public/site-visit');
  assert.deepEqual(JSON.parse(calls[0][1].body), {
    event_id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', path: '/en/stock/',
  });
  assert.equal(calls[0][1].credentials, 'omit');
  assert.equal(calls[0][1].mode, 'no-cors');
  calls.length = 0;
  context.location.pathname = '/fund-etf/';
  vm.runInNewContext(script, context);
  assert.equal(JSON.parse(calls[0][1].body).path, '/fund-etf/');
  calls.length = 0;
  context.location.hostname = 'unrelated.example';
  vm.runInNewContext(script, context);
  assert.equal(calls.length, 0);
});
