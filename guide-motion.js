(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var figs = document.querySelectorAll('[data-gm]');
  if (!figs.length) return;
  figs.forEach(function (f) { f.classList.add('gm-ready'); });
  if (reduce || !('IntersectionObserver' in window)) {
    figs.forEach(function (f) { f.classList.add('gm-in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('gm-in'); io.unobserve(e.target); } });
    }, { threshold: 0.2 });
    figs.forEach(function (f) { io.observe(f); });
  }

  /* 글 A: 한 주 일정 띠 — 하루를 고르고 발표 전·후 확인 항목을 바꾼다 */
  document.querySelectorAll('[data-gm="week"]').forEach(function (root) {
    var days = root.querySelectorAll('.gm-day');
    var phases = root.querySelectorAll('[data-phase]');
    var panel = root.querySelector('.gm-panel');
    var day = 1, phase = 'before';
    function text() {
      var d = days[day];
      var kind = d.getAttribute('data-kind');
      var label = d.getAttribute('data-label');
      if (kind === 'none') return '<strong>' + label + '</strong> 공개된 일정이 없는 날입니다. 이 날은 확인할 발표가 없습니다.';
      if (kind === 'hold') return '<strong>' + label + '</strong> 휴장일입니다. 거래가 없는 날이므로 시장 반응은 다음 거래일 흐름에서 확인합니다.';
      return phase === 'before'
        ? '<strong>' + label + ' · 발표 전</strong> 발표 예정 ' + d.getAttribute('data-n') + '건. 가까운 발표의 날짜를 확인하고 변동 가능성을 점검합니다.'
        : '<strong>' + label + ' · 발표 후</strong> 공개된 실제 수치와 시장 흐름을 각각 확인해 비교합니다.';
    }
    function render() {
      days.forEach(function (d, i) { d.setAttribute('aria-pressed', i === day ? 'true' : 'false'); });
      phases.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-phase') === phase ? 'true' : 'false'); });
      panel.innerHTML = text();
    }
    days.forEach(function (d, i) {
      d.addEventListener('click', function () { day = i; render(); });
      d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); day = i; render(); } });
    });
    phases.forEach(function (b) { b.addEventListener('click', function () { phase = b.getAttribute('data-phase'); render(); }); });
    render();
  });

  /* 글 B: 뉴스심리 반원 게이지 — 같은 기사 수라도 원인이 모이면 바늘이 움직인다 */
  document.querySelectorAll('[data-gm="gauge"]').forEach(function (root) {
    var needle = root.querySelector('.gm-needle');
    var num = root.querySelector('.gm-score');
    var state = root.querySelector('.gm-state');
    var btns = root.querySelectorAll('[data-score]');
    var cur = 0, raf = 0;
    function setScore(s) {
      needle.style.transform = 'rotate(' + (s * 1.8 - 90) + 'deg)';
      state.textContent = s >= 70 ? '경보 기준 이상' : '경보 기준 미만';
      if (reduce) { num.textContent = s; cur = s; return; }
      cancelAnimationFrame(raf);
      var from = cur, t0 = null;
      (function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / 1000, 1);
        cur = Math.round(from + (s - from) * (1 - Math.pow(1 - p, 3)));
        num.textContent = cur;
        if (p < 1) raf = requestAnimationFrame(step);
      })(performance.now());
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        setScore(+b.getAttribute('data-score'));
      });
    });
    setScore(+btns[0].getAttribute('data-score'));
  });
})();
