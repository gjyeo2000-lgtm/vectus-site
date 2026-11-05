const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const pages = ['', 'en', 'stock', 'fund-etf', 'insurance', 'en/stock', 'en/fund-etf', 'en/insurance'];

// 서비스(vectuslab.ai) 링크를 누르기 전에 연결(DNS·TCP·TLS)을 미리 맺어 두면, 모바일 회선에서 클릭 뒤
// 첫 화면까지 왕복 3번 정도가 줄어든다. 서비스 링크가 있는 모든 공개 페이지가 같은 힌트를 가져야 한다.
test('every page that links to the service warms up the connection to it', () => {
  for (const route of pages) {
    const html = fs.readFileSync(path.join(root, route, 'index.html'), 'utf8');
    assert.match(html, /<link rel="preconnect" href="https:\/\/vectuslab\.ai">/, `${route || '/'}: preconnect`);
    assert.match(html, /<link rel="dns-prefetch" href="https:\/\/vectuslab\.ai">/, `${route || '/'}: dns-prefetch`);
    const hint = html.indexOf('rel="preconnect" href="https://vectuslab.ai"');
    const firstLink = html.search(/<a\b[^>]*\bhref="https:\/\/vectuslab\.ai/);
    assert.ok(firstLink === -1 || hint < firstLink, `${route || '/'}: 힌트가 첫 서비스 링크보다 앞에 있어야 한다`);
  }
});

// logo.png 는 파비콘과 헤더 로고(표시 높이 48px)로만 쓰인다. 2844px 원본(1.2MB)이 들어가 있으면 모바일에서
// 페이지 load 완료와 서비스 링크 클릭 뒤 연결이 그 다운로드와 대역폭을 다투므로 작게 유지한다.
test('logo.png stays small and large enough for a 3x 48px header logo', () => {
  const file = path.join(root, 'logo.png');
  assert.ok(fs.statSync(file).size <= 100 * 1024, `logo.png ${fs.statSync(file).size}바이트`);
  const png = fs.readFileSync(file);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.ok(width >= 144 && height >= 144, `logo.png ${width}x${height}`);
  assert.ok(width <= 1024 && height <= 1024, `logo.png ${width}x${height}`);
});
