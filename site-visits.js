(() => {
  if (!['vectuslab.com', 'www.vectuslab.com'].includes(location.hostname)) return;
  if (!globalThis.crypto?.randomUUID) return;
  // 상용(AWS) 서비스와 기존 test 서버 대시보드 양쪽에 같은 신호를 보낸다. 두 서버는 DB 가 따로라
  // 한쪽에만 보내면 다른 쪽 대시보드의 홈페이지 수치가 비어 보인다.
  const endpoints = ['https://vectuslab.ai/api/public/site-visit', 'https://test.vectuslab.ai/api/public/site-visit'];
  const send = (extra) => {
    const body = JSON.stringify({ event_id: crypto.randomUUID(), path: location.pathname, ...extra });
    endpoints.forEach((url) => {
      fetch(url, {
        method: 'POST', mode: 'no-cors', credentials: 'omit',
        headers: { 'Content-Type': 'text/plain' },
        body, keepalive: true,
      }).catch(() => {});
    });
  };
  send({});

  // 서비스 링크(주소 끝 ?entry=website)를 누르면 클릭 1건을 따로 보낸다. 링크가 noreferrer 라 서비스 쪽에서는
  // 이 표시로만 홈페이지 경유를 알 수 있다. 가운데 버튼(auxclick)도 센다. 클릭마다 새 event_id 라 중복 제거는 되지 않는다.
  const onClick = (event) => {
    const link = event.target?.closest?.('a[href]');
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.href); } catch (error) { return; }
    if (url.origin !== 'https://vectuslab.ai' || url.searchParams.get('entry') !== 'website') return;
    if (event.type === 'auxclick' && event.button !== 1) return;
    send({ kind: 'cta' });
  };
  if (typeof globalThis.document?.addEventListener === 'function') {
    ['click', 'auxclick'].forEach((name) => globalThis.document.addEventListener(name, onClick, true));
  }
})();
