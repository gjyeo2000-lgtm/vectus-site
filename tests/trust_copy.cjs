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
  const contact = html.match(/<section id="contact">([\s\S]*?)<\/section>/)?.[1] || '';
  assert.equal((contact.match(/class="contact-person">전준용/g) || []).length, 2, `${name}: both contact paths need the named contact`);
  assert.equal((contact.match(/href="mailto:juneyoung\.jeon@vectuslab\.com"/g) || []).length, 2, `${name}: both contact paths need the verified email`);
  assert.doesNotMatch(contact, /tel:|contact@vectuslab\.com/i, `${name}: no phone or generic mailbox in contact section`);
  const vision = html.match(/<section id="vision"[^>]*>([\s\S]*?)<\/section>/)?.[1] || '';
  assert.match(vision, name === 'ko' ? /종합자산관리 웹을 준비합니다/ : /preparing an integrated wealth-management web experience/);
  assert.match(vision, name === 'ko' ? /법률 검토.*계획입니다/ : /specialist legal review.*plan to connect|plan to connect.*specialist legal review/);
  const insurance = html.match(/<div class="insurance-zone">([\s\S]*?)<section id="infra"/)?.[1] || '';
  assert.equal((insurance.match(/<article><small>0[123] \/ (?:SOURCE|HOLDINGS|HOLD)/g) || []).length, 3, `${name}: insurance evidence sequence missing`);
  assert.match(insurance, name === 'ko' ? /확인 불가 시 보류/ : /Defer when unverified/);
  assert.match(insurance, name === 'ko' ? /가능한 전 보험사·전 상품 비교로 확대합니다/ : /broadest possible insurer and product comparison/);
  assert.equal((insurance.match(/class="insurance-roadmap"/g) || []).length, 1, `${name}: insurance roadmap missing`);
  assert.equal((insurance.match(/class="insurance-mission"/g) || []).length, 1, `${name}: customer-first mission missing`);
  assert.match(insurance, name === 'ko' ? /수수료·가입 성사 여부를 판단 입력으로 사용하지 않음/ : /Fees and sales outcomes are not judgment inputs/);
  assert.match(insurance, name === 'ko' ? /실제 지급 여부는 계약과 심사 결과에 따릅니다/ : /Actual payment depends on policy terms and claim assessment/);
  assert.match(insurance, name === 'ko' ? /생애주기 맞춤 서비스를 준비하고 있습니다/ : /preparing life-stage reviews/);
  assert.match(insurance, name === 'ko' ? /뉴스는 변화 탐지와 맥락을 이해하는 참고자료/ : /news helps detect and explain changes/);
  assert.match(insurance, name === 'ko' ? /투자도 보험도, 벡투스 하나면 됩니다/ : /Investing and insurance, together with Vectus/);
  assert.equal((insurance.match(/class="insurance-cost"/g) || []).length, 1, `${name}: insurance cost guidance missing`);
  assert.match(insurance, name === 'ko' ? /개인별 보험료 견적이나 절감액이 아닙니다/ : /does not provide a personal premium quote or savings figure/);
  assert.match(insurance, name === 'ko' ? /완료한 보험 진단 이력을 다시 확인/ : /revisit in-progress and completed diagnoses/);
  assert.doesNotMatch(insurance, name === 'ko' ? /약관 전체 조항을 분석해/ : /analyze the full text of your policy terms/i);
  assert.equal((insurance.match(/class="card-frame"/g) || []).length, 1, `${name}: insurance sample card must remain`);
  assert.match(insurance, /class="decision-cinema violet"/, `${name}: animated insurance flow must remain`);
}

const motion = fs.readFileSync(path.join(root, 'trust-motion.js'), 'utf8');
assert.match(motion, /prefers-reduced-motion: reduce/);
assert.match(motion, /IntersectionObserver/);
console.log('Homepage trust-copy contract: OK');
