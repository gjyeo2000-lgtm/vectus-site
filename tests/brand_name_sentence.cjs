const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('home hero states what Vectus is in one plain sentence', () => {
  const sentence = '벡투스(Vectus)는 주식·펀드·ETF의 추천 후보를 근거와 기준일과 함께 살펴보고, 이미 가진 상품끼리 같은 종목이 겹치는지까지 확인하는 한국어 투자 분석 서비스입니다.';
  const body = html.slice(html.indexOf('<body'));
  assert.equal(body.split(sentence).length - 1, 1);
});

test('head description opens with the same sentence and keeps the scope notice', () => {
  const head = html.slice(0, html.indexOf('</head>'));
  const m = head.match(/<meta name="description" content="([^"]*)"/);
  assert.ok(m);
  assert.ok(m[1].startsWith('벡투스(Vectus)는 주식·펀드·ETF의 추천 후보를'));
  assert.ok(m[1].includes('보유보험 진단은 준비하고 있습니다.'));
  assert.ok(head.includes('<title>벡투스(Vectus) — 주식·펀드·ETF 투자 분석 서비스</title>'));
});
