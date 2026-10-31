const fs = require('node:fs');
const path = require('node:path');
const translations = require('./discovery-translations.cjs');

const root = path.resolve(__dirname, '..');
const pages = {
  stock: {
    ko: { title: '주식 추천의 근거 | 벡투스', description: '벡투스는 정식 시세와 확인된 공시의 원천·기준일, 적용 조건, 판단 또는 보류 사유를 구분합니다. 추천 당시 판단과 5·20·60영업일의 경과를 따로 확인합니다.' },
    en: { title: 'Evidence Behind Stock Decisions | Vectus', description: 'Vectus distinguishes official market data, verified filings, source dates, decision conditions, and reasons to defer. It separates the original decision from observations after 5, 20, and 60 business days.' },
    homeAnchor: 'judgment-process',
  },
  'fund-etf': {
    ko: { title: '펀드·ETF 중복 노출과 기준일 | 벡투스', description: '벡투스는 확인된 상품 구성과 고객이 등록한 보유상품을 연결해 공통 종목·위험 노출을 살핍니다. ETF 가격·NAV와 공모펀드 기준가격의 서로 다른 시점도 구분합니다.' },
    en: { title: 'Fund and ETF Overlap | Vectus', description: 'Vectus connects verified product composition with holdings you register to examine shared exposure. ETF market prices, NAV, and public-fund reference prices retain their distinct dates and meanings.' },
    homeAnchor: 'tech',
  },
  insurance: {
    ko: { title: '보유보험 진단: 특약·청구 조건·비용 | 벡투스', description: '벡투스는 보유계약과 확인된 공식 약관·상품판을 대조해 중요한 특약·청구 조건과 비용 부담을 살핍니다. 실손의료보험부터 범위를 넓히고 있습니다.' },
    en: { title: 'Insurance Review: Riders, Claims and Cost | Vectus', description: 'Vectus compares registered policies with verified official terms and product editions to review riders, claim conditions, and cost signals. The scope is expanding from actual-loss medical insurance.' },
    homeAnchor: 'insurance',
  },
};

function translate(html, slug) {
  const words = { ...translations.common, ...translations[slug] };
  html = html.replace(/>([^<>]+)</g, (match, raw) => {
    const source = raw.replace(/\s+/g, ' ').trim();
    if (!/[가-힣]/.test(source)) return match;
    const value = words[source];
    if (!value) throw new Error(`${slug}: missing English text: ${source}`);
    return `>${value}<`;
  });
  html = html.replace(/aria-label="([^"]+)"/g, (match, source) => {
    if (!/[가-힣]/.test(source)) return match;
    const value = words[source];
    if (!value) throw new Error(`${slug}: missing English label: ${source}`);
    return `aria-label="${value}"`;
  });
  if (/[가-힣]/.test(html)) throw new Error(`${slug}: untranslated Korean remains`);
  return html;
}

function build(slug, lang) {
  const source = fs.readFileSync(path.join(root, 'docs', 'plans', 'assets', `2026-10-14-discovery-v2-${slug}.html`), 'utf8');
  const match = source.match(/<main>([\s\S]*?)<\/main>/);
  if (!match) throw new Error(`${slug}: missing mock main`);
  const base = lang === 'ko' ? '/' : '/en/';
  let main = match[1];
  main = main.replaceAll('2026-10-14-discovery-v2-home.html', base);
  for (const page of Object.keys(pages)) main = main.replaceAll(`2026-10-14-discovery-v2-${page}.html`, `${base}${page}/`);
  main = main.replaceAll('https://vectuslab.com/#', `${base}#`);
  if (lang === 'en') main = translate(main, slug);
  const canonical = `https://vectuslab.com${base}${slug}/`;
  const koUrl = `https://vectuslab.com/${slug}/`;
  const enUrl = `https://vectuslab.com/en/${slug}/`;
  const meta = pages[slug][lang];
  const depth = lang === 'ko' ? '..' : '../..';
  const nav = lang === 'ko'
    ? [['주식', '/stock/', 'stock'], ['펀드·ETF', '/fund-etf/', 'fund-etf'], ['보험', '/insurance/', 'insurance']]
    : [['Stocks', '/en/stock/', 'stock'], ['Funds &amp; ETFs', '/en/fund-etf/', 'fund-etf'], ['Insurance', '/en/insurance/', 'insurance']];
  const navHtml = nav.map(([label, href, key]) => `<a${key === slug ? ' aria-current="page"' : ''} href="${href}">${label}</a>`).join('');
  const altLang = lang === 'ko' ? 'English' : '한국어';
  const altUrl = lang === 'ko' ? `/en/${slug}/` : `/${slug}/`;
  const homeText = lang === 'ko' ? '홈' : 'Home';
  const testWebText = lang === 'ko' ? '서비스로 돌아가기' : 'Back to the service';
  const navLabel = lang === 'ko' ? '서비스 안내' : 'Service guides';
  const footerText = lang === 'ko'
    ? '벡투스 공식 서비스 안내 · 이 화면은 개념 그래프이며 실제 고객별 결과가 아닙니다.'
    : 'Official Vectus service guide · Diagrams are conceptual, not customer-specific results.';
  const stageText = lang === 'ko'
    ? '현재 이용 가능 범위는 서비스 화면에서 확인합니다.'
    : 'Check the service for the current available scope.';
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: meta.title, description: meta.description, url: canonical, inLanguage: lang, isPartOf: { '@type': 'WebSite', name: 'Vectus | 벡투스', url: 'https://vectuslab.com/' }, publisher: { '@type': 'Organization', name: '벡투스', url: 'https://vectuslab.com/' } });
  const html = `<!doctype html>
<html lang="${lang}"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${meta.title}</title><meta name="description" content="${meta.description}">
  <meta property="og:type" content="website"><meta property="og:site_name" content="Vectus | 벡투스">
  <meta property="og:title" content="${meta.title}"><meta property="og:description" content="${meta.description}"><meta property="og:url" content="${canonical}">
  <link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="ko" href="${koUrl}"><link rel="alternate" hreflang="en" href="${enUrl}"><link rel="alternate" hreflang="x-default" href="${koUrl}">
  <link rel="icon" type="image/png" href="${depth}/logo.png"><link rel="stylesheet" href="${depth}/discovery.css">
  <script type="application/ld+json">${schema}</script>
</head><body>
<a class="skip-link" href="#main">${lang === 'ko' ? '본문으로 건너뛰기' : 'Skip to content'}</a>
<header class="site-header"><div class="wrap"><a class="brand" href="${base}">VectusLab</a><nav class="site-nav" aria-label="${navLabel}"><a href="${base}">${homeText}</a>${navHtml}<a class="lang-link" lang="${lang === 'ko' ? 'en' : 'ko'}" href="${altUrl}">${altLang}</a></nav><a class="test-web-link" href="https://vectuslab.ai/guest-home">${testWebText}</a></div></header>
<main id="main">${main}</main>
<footer class="footer"><div class="wrap"><span>${footerText}</span><span>${stageText}</span></div></footer>
</body></html>
`;
  const directory = path.join(root, ...(lang === 'ko' ? [] : ['en']), slug);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), html);
}

for (const slug of Object.keys(pages)) for (const lang of ['ko', 'en']) build(slug, lang);
console.log('Built six discovery pages from the approved visual content.');
