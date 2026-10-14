const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'differentiation.css'), 'utf8');

for (const [language, file, phrases] of [
  ['ko', 'index.html', ['기존 금융투자 앱', '신규 진입 보류', '하락 위험 점검', '범용 대화형 AI', 'HMM 국면 분석', 'GNN 연결 위험']],
  ['en', 'en/index.html', ['Conventional investment apps', 'deferring a new entry', 'Downside-risk check', 'General-purpose conversational AI', 'HMM regime analysis', 'GNN connected risk']],
]) {
  test(`${language} homepage preserves the approved comparison mock`, () => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /href="(?:\.\.\/)?differentiation\.css"/);
    const start = html.indexOf('class="dc-intro"');
    const end = html.indexOf('class="dc-scope"', start);
    assert.ok(start >= 0 && end > start, `${language}: comparison region missing`);
    const region = html.slice(start, end);
    assert.equal((region.match(/class="dc-compare"/g) || []).length, 2);
    assert.equal((region.match(/class="dc-network(?: mobile)?"/g) || []).length, 2);
    assert.equal((region.match(/<animateMotion\b/g) || []).length, 12);
    assert.equal((region.match(/class="dc-step(?: risk| final)?"/g) || []).length, 10);
    assert.equal((region.match(/class="dc-example"/g) || []).length, 3);
    assert.equal((region.match(/class="dc-tech"/g) || []).length, 1);
    assert.equal((region.match(/class="dc-guard"/g) || []).length, 1);
    for (const phrase of phrases) assert.ok(region.includes(phrase), `${language}: missing ${phrase}`);
  });
}

test('comparison motion supports narrow and reduced-motion displays', () => {
  assert.match(css, /@media\(max-width:800px\)/);
  assert.match(css, /\.dc-network:not\(\.mobile\)\{display:none\}/);
  assert.match(css, /\.dc-network\.mobile\{display:block\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /\.dc-network \.particle\{display:none\}/);
});
