const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('home hero states what Vectus is in one plain sentence', () => {
  const sentence = '벡투스(Vectus)는 주식·펀드 판단과 보유보험 진단을 한 곳에서 살펴보는 한국어 금융 판단 보조 서비스입니다.';
  assert.equal(html.split(sentence).length - 1, 1);
});
