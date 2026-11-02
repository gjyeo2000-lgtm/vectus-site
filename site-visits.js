(() => {
  if (!['vectuslab.com', 'www.vectuslab.com'].includes(location.hostname)) return;
  if (!globalThis.crypto?.randomUUID) return;
  const eventId = crypto.randomUUID();
  // 상용(AWS) 서비스와 기존 test 서버 대시보드 양쪽에 같은 방문을 보낸다. 두 서버는 DB 가 따로라
  // 한쪽에만 보내면 다른 쪽 대시보드의 홈페이지 방문 수치가 비어 보인다.
  const body = JSON.stringify({ event_id: eventId, path: location.pathname });
  ['https://vectuslab.ai/api/public/site-visit', 'https://test.vectuslab.ai/api/public/site-visit'].forEach((url) => {
    fetch(url, {
      method: 'POST', mode: 'no-cors', credentials: 'omit',
      headers: { 'Content-Type': 'text/plain' },
      body, keepalive: true,
    }).catch(() => {});
  });
})();
