(() => {
  if (!['vectuslab.com', 'www.vectuslab.com'].includes(location.hostname)) return;
  if (!globalThis.crypto?.randomUUID) return;
  const eventId = crypto.randomUUID();
  fetch('https://test.vectuslab.ai/api/public/site-visit', {
    method: 'POST', mode: 'no-cors', credentials: 'omit',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ event_id: eventId, path: location.pathname }), keepalive: true,
  }).catch(() => {});
})();
