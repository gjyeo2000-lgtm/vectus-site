const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
for (const [name, file] of [['ko', 'index.html'], ['en', 'en/index.html']]) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const id of ['judgment-process', 'tech', 'evidence']) {
    assert.match(html, new RegExp(`id="${id}"`), `${name}: ${id} section missing`);
  }
  assert.equal((html.match(/class="trust-graph"/g) || []).length, 2, `${name}: both graphs required`);
  assert.equal((html.match(/class="trust-model-row"/g) || []).length, 4, `${name}: four model roles required`);
  assert.equal((html.match(/class="trust-source-row"/g) || []).length, 4, `${name}: four source categories required`);
  assert.equal((html.match(/<article><small>[ABC] \/ (?:SOURCE|TIME|HOLD)/g) || []).length, 3, `${name}: three evidence rules required`);
  assert.match(html, /class="trust-chain"/);
  assert.match(html, /class="trust-diagram"/);
  assert.match(html, /trust-motion\.js/);
  assert.match(html, /trust-visuals\.css/);
  assert.doesNotMatch(html, /78%|34\.23%|24\/7|31\.29%/);
  assert.doesNotMatch(html, /<meta[^>]+noindex/i);
  assert.match(html, name === 'ko' ? /영업일 기준/ : /business days/i);
  assert.match(html, name === 'ko' ? /설명용 예시/ : /Conceptual illustration/);
}

const motion = fs.readFileSync(path.join(root, 'trust-motion.js'), 'utf8');
assert.match(motion, /prefers-reduced-motion: reduce/);
assert.match(motion, /IntersectionObserver/);
console.log('Homepage trust-copy contract: OK');
