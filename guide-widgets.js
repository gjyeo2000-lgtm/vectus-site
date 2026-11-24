/* 가이드 글 전용 눌러 보는 그래프(선택형·슬라이더형). 그림의 값은 모두 가상 예시입니다. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function h(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function s(tag, attrs, txt) { var e = document.createElementNS(NS, tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
  function svgRoot(title, desc, w, hgt) { return s('svg', { viewBox: '0 0 ' + w + ' ' + hgt, role: 'img', 'aria-label': title + '. ' + desc }); }
  function slider(label, min, max, val, step, onInput, fmt) {
    var wrap = h('label', { 'class': 'gm-range' });
    var out = h('span', { 'class': 'gm-range-out' });
    var inp = h('input', { type: 'range', min: min, max: max, step: step || 1, value: val, 'aria-label': label });
    function upd() { out.textContent = fmt ? fmt(+inp.value) : inp.value; onInput(+inp.value); }
    inp.addEventListener('input', upd);
    wrap.appendChild(h('span', { 'class': 'gm-range-label' }, label)); wrap.appendChild(inp); wrap.appendChild(out);
    return { el: wrap, update: upd };
  }
  function toggle(labels, onPick, start) {
    var box = h('div', { 'class': 'gm-toggle', role: 'group' }), btns = [];
    labels.forEach(function (l, i) {
      var b = h('button', { type: 'button', 'aria-pressed': i === (start || 0) ? 'true' : 'false' });
      b.textContent = l;
      b.addEventListener('click', function () { btns.forEach(function (x, j) { x.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); onPick(i); });
      btns.push(b); box.appendChild(b);
    });
    return { el: box };
  }
  function T(x, y, txt, cls, anchor) { return s('text', { x: x, y: y, 'class': cls || 'gm-t', 'text-anchor': anchor || 'middle' }, txt); }
  function D(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '); }
  function panelEl() { return h('div', { 'class': 'gm-panel', 'aria-live': 'polite' }); }

  var BUILD = {};

  BUILD.pick = function (root, ui) {
    var items = [];
    root.querySelectorAll('.gm-src li').forEach(function (li) { items.push({ label: li.getAttribute('data-label'), text: li.textContent }); });
    var seen = {}, cur = 0, n = items.length;
    var tg = toggle(items.map(function (i) { return i.label; }), function (i) { cur = i; render(); }, 0);
    var svg = svgRoot('확인 진행 막대', '항목을 누를 때마다 확인한 항목 수가 늘어납니다.', 640, 56);
    var segs = [], w = (640 - 8 * (n - 1)) / n;
    for (var i = 0; i < n; i++) { var r = s('rect', { x: i * (w + 8), y: 8, width: w, height: 14, rx: 7, 'class': 'gm-seg' }); segs.push(r); svg.appendChild(r); }
    var cnt = T(0, 48, '', 'gm-t', 'start'); svg.appendChild(cnt);
    var panel = panelEl();
    function render() {
      seen[cur] = true; var c = 0;
      segs.forEach(function (r, i) { var on = !!seen[i]; if (on) c++; r.setAttribute('class', 'gm-seg' + (on ? ' on' : '') + (i === cur ? ' cur' : '')); });
      cnt.textContent = '확인한 항목 ' + c + ' / ' + n;
      panel.innerHTML = '<strong></strong> '; panel.firstChild.textContent = items[cur].label; panel.appendChild(document.createTextNode(items[cur].text));
    }
    ui.appendChild(tg.el); ui.appendChild(svg); ui.appendChild(panel); render();
  };

  BUILD.overlap = function (root, ui) {
    var svg = svgRoot('두 ETF의 겹침', '겹침 슬라이더를 움직이면 두 원이 겹치는 정도와 분산 효과가 바뀝니다. 가상 예시입니다.', 640, 230);
    var a = s('circle', { cy: 90, r: 62, 'class': 'gm-circ a' }), b = s('circle', { cy: 90, r: 62, 'class': 'gm-circ b' });
    var ov = s('rect', { y: 40, height: 100, 'class': 'gm-ovl' });
    svg.appendChild(a); svg.appendChild(b); svg.appendChild(ov);
    var ta = T(0, 94, 'ETF A'), tb = T(0, 94, 'ETF B');
    svg.appendChild(ta); svg.appendChild(tb); svg.appendChild(T(320, 168, '겹치는 부분', 'gm-t muted'));
    svg.appendChild(T(320, 204, '분산 효과', 'gm-t muted', 'end'));
    svg.appendChild(s('rect', { x: 330, y: 190, width: 280, height: 14, rx: 7, 'class': 'gm-track' }));
    var fill = s('rect', { x: 330, y: 190, height: 14, rx: 7, 'class': 'gm-fill' }); svg.appendChild(fill);
    var panel = panelEl();
    var sl = slider('겹침', 0, 100, 20, 1, function (v) {
      var d = 124 - v * 0.9; a.setAttribute('cx', 320 - d / 2); b.setAttribute('cx', 320 + d / 2);
      ta.setAttribute('x', 320 - d / 2 - (v > 60 ? 12 : 0) - 0); tb.setAttribute('x', 320 + d / 2 + (v > 60 ? 12 : 0));
      ta.setAttribute('y', v > 60 ? 70 : 94); tb.setAttribute('y', v > 60 ? 70 : 94);
      var lo = 320 + d / 2 - 62, hi = 320 - d / 2 + 62; ov.setAttribute('x', lo); ov.setAttribute('width', Math.max(hi - lo, 0));
      fill.setAttribute('width', Math.max(280 * (100 - v) / 100, 2));
      panel.textContent = v + '% 겹칠 때: ' + (v >= 60 ? '겹치는 부분이 클수록 두 개를 사도 분산이 늘지 않습니다.' : v >= 25 ? '일부가 겹쳐 분산 효과가 줄어듭니다.' : '거의 겹치지 않아 두 개를 담으면 분산이 늘어납니다.');
    }, function (v) { return v + '%'; });
    ui.appendChild(sl.el); ui.appendChild(svg); ui.appendChild(panel); sl.update();
  };

  BUILD.holdings = function (root, ui) {
    var prods = [['상품 1', { '종목 가': 12, '종목 나': 8, '종목 다': 5 }], ['상품 2', { '종목 가': 9, '종목 라': 7, '종목 마': 4 }], ['상품 3', { '종목 가': 6, '종목 나': 5, '종목 바': 3 }]];
    var stocks = ['종목 가', '종목 나', '종목 다', '종목 라'], total = 3000, amounts = [1000, 1000, 1000];
    var tg = toggle(stocks, function (i) { show(stocks[i]); }, 0);
    var svg = svgRoot('보유 상품 안의 같은 종목', '종목을 누르면 그 종목이 들어 있는 상품이 강조됩니다. 가상 예시입니다.', 640, 150);
    var boxes = prods.map(function (p, i) {
      var x = 20 + i * 210, g = s('g', {});
      g.appendChild(s('rect', { x: x, y: 10, width: 190, height: 110, rx: 12, 'class': 'gm-box' }));
      g.appendChild(T(x + 95, 36, p[0]));
      var k = 0; for (var nm in p[1]) { g.appendChild(T(x + 20, 62 + k * 20, nm, 'gm-t muted', 'start')); g.appendChild(T(x + 170, 62 + k * 20, p[1][nm] + '%', 'gm-t muted', 'end')); k++; }
      svg.appendChild(g); return g;
    });
    var panel = panelEl();
    function show(st) {
      var n = 0, w = 0;
      prods.forEach(function (p, i) { var has = p[1][st] != null; boxes[i].setAttribute('class', has ? 'gm-hot' : 'gm-dim'); if (has) { n++; w += amounts[i] * p[1][st] / 100; } });
      panel.textContent = st + '은(는) ' + n + '개 상품에 들어 있고, 내 전체 자산에서 차지하는 편입 비중은 약 ' + (w / total * 100).toFixed(1) + '%입니다.';
    }
    ui.appendChild(tg.el); ui.appendChild(svg); ui.appendChild(panel); show(stocks[0]);
  };

  BUILD.pricebasis = function (root, ui) {
    var P = [100, 100.4, 100.1, 100.8, 101.3, 101, 101.6, 101.2, 101.9, 102.2, 101.8, 102.4, 102.1];
    var svg = svgRoot('ETF 거래 가격과 일반 공모펀드 기준가격', '시간 슬라이더를 움직이면 ETF 거래 가격선이 이어지고, 일반 공모펀드의 기준가격은 하루 한 번만 계산됩니다. 가상 예시입니다.', 640, 240);
    svg.appendChild(s('line', { x1: 50, y1: 200, x2: 620, y2: 200, 'class': 'gm-axis' }));
    var path = s('path', { 'class': 'gm-line', fill: 'none' }), dot = s('circle', { r: 5, 'class': 'gm-dotg' }), nav = s('circle', { r: 7, 'class': 'gm-dotv', cx: 600 }), navt = T(600, 60, ''), basis = T(340, 226, '', 'gm-t muted');
    svg.appendChild(path); svg.appendChild(dot); svg.appendChild(nav); svg.appendChild(navt); svg.appendChild(basis);
    svg.appendChild(T(60, 26, '거래 가격(장중 실시간)', 'gm-t', 'start'));
    function X(i) { return 60 + i * 45; } function Y(v) { return 190 - (v - 99.5) * 40; }
    var panel = panelEl();
    var sl = slider('시간', 0, 12, 4, 1, function (v) {
      var pts = P.slice(0, v + 1).map(function (p, i) { return [X(i), Y(p)]; });
      path.setAttribute('d', D(pts)); dot.setAttribute('cx', pts[pts.length - 1][0]); dot.setAttribute('cy', pts[pts.length - 1][1]);
      var closed = v === 12; nav.setAttribute('class', 'gm-dotv' + (closed ? ' on' : '')); navt.textContent = closed ? '기준가격' : ''; nav.setAttribute('cy', Y(P[12])); navt.setAttribute('y', Y(P[12]) - 14);
      basis.textContent = closed ? '하루 한 번 계산' : '기준가격은 하루 한 번 계산됩니다';
      panel.textContent = closed ? 'ETF의 거래 가격은 하루 내내 움직였고, 일반 공모펀드의 기준가격은 이제 한 번 정해졌습니다. 기준 시점이 다릅니다.' : '지금은 장중입니다. ETF는 거래 가격이 계속 바뀌지만 일반 공모펀드는 아직 기준가격이 없습니다.';
    }, function (v) { return (9 + Math.round(v * 65 / 12) / 10).toFixed(1).replace('.0', '') + '시'; });
    ui.appendChild(sl.el); ui.appendChild(svg); ui.appendChild(panel); sl.update();
  };

  BUILD.fee = function (root, ui) {
    var svg = svgRoot('보유 기간과 보수', '보유 기간 슬라이더를 움직이면 보수가 낮은 쪽과 높은 쪽의 누적 차이가 벌어집니다. 가상 예시입니다.', 640, 240);
    svg.appendChild(s('line', { x1: 50, y1: 200, x2: 620, y2: 200, 'class': 'gm-axis' }));
    var lo = s('path', { 'class': 'gm-line', fill: 'none' }), hi = s('path', { 'class': 'gm-line alt', fill: 'none' });
    svg.appendChild(lo); svg.appendChild(hi);
    svg.appendChild(T(60, 24, '연 보수 0.5%', 'gm-t', 'start')); svg.appendChild(T(200, 24, '연 보수 1.5%', 'gm-t alt', 'start'));
    function val(y, fee) { return 100 * Math.pow(1 + 0.05 - fee, y); }
    function X(y) { return 60 + y * 55; } function Y(v) { return 200 - (v - 100) * 3; }
    var panel = panelEl();
    var sl = slider('보유 기간', 1, 10, 3, 1, function (v) {
      var a = [], b = []; for (var y = 0; y <= v; y++) { a.push([X(y), Y(val(y, 0.005))]); b.push([X(y), Y(val(y, 0.015))]); }
      lo.setAttribute('d', D(a)); hi.setAttribute('d', D(b));
      panel.textContent = v + '년 보유하면 같은 수익률이어도 두 비용 구조의 차이가 ' + (val(v, 0.005) - val(v, 0.015)).toFixed(1) + '(원금 100 기준)만큼 벌어집니다. 오래 갈수록 보수의 영향이 커집니다.';
    }, function (v) { return v + '년'; });
    ui.appendChild(sl.el); ui.appendChild(svg); ui.appendChild(panel); sl.update();
  };

  BUILD.dividend = function (root, ui) {
    var drops = [0, -5, -10, -20];
    var svg = svgRoot('배당과 가격 변동을 합친 총수익', '가격 하락 토글을 바꾸면 배당과 가격 변동을 합친 총수익이 바뀝니다. 가상 예시입니다.', 640, 230);
    var zero = 120, k = 5; svg.appendChild(s('line', { x1: 40, y1: zero, x2: 610, y2: zero, 'class': 'gm-axis' }));
    var xs = [130, 300, 470], names = ['배당', '가격 변동', '총수익'], bars = [], vals = [];
    xs.forEach(function (x, i) { var r = s('rect', { x: x, width: 90, rx: 4, 'class': 'gm-bar2' }); bars.push(r); svg.appendChild(r); svg.appendChild(T(x + 45, 214, names[i])); var v = T(x + 45, 0, ''); vals.push(v); svg.appendChild(v); });
    var panel = panelEl();
    function set(i, v) { var hh = Math.abs(v) * k; bars[i].setAttribute('y', v >= 0 ? zero - hh : zero); bars[i].setAttribute('height', Math.max(hh, 1)); bars[i].setAttribute('class', 'gm-bar2' + (i === 2 ? ' tot' : '') + (v < 0 ? ' neg' : '')); vals[i].setAttribute('y', v >= 0 ? zero - hh - 8 : zero + hh + 18); vals[i].textContent = (v > 0 ? '+' : '') + v + '%'; }
    var tg = toggle(['가격 변동 0%', '−5%', '−10%', '−20%'], function (i) { run(drops[i]); }, 0);
    function run(d) { set(0, 4); set(1, d); set(2, 4 + d); panel.textContent = d === 0 ? '배당 4%를 받고 가격이 그대로면 총수익은 +4%입니다.' : '배당 4%를 받아도 가격이 ' + Math.abs(d) + '% 내리면 총수익은 ' + (4 + d) + '%' + (4 + d < 0 ? '로 마이너스입니다.' : '입니다.'); }
    ui.appendChild(tg.el); ui.appendChild(svg); ui.appendChild(panel); run(0);
  };

  BUILD.split = function (root, ui) {
    var paths = { '하락': [100, 94, 88, 80], '횡보': [100, 101, 99, 100], '상승': [100, 106, 112, 118] }, names = ['하락', '횡보', '상승'];
    var svg = svgRoot('분할매수와 평균 단가', '가격 경로를 바꾸면 세 번의 매수 가격과 평균 단가선이 바뀝니다. 가상 예시입니다.', 640, 240);
    svg.appendChild(s('line', { x1: 50, y1: 210, x2: 620, y2: 210, 'class': 'gm-axis' }));
    var pl = s('path', { 'class': 'gm-line', fill: 'none' }), av = s('line', { 'class': 'gm-avg' });
    svg.appendChild(pl); svg.appendChild(av);
    var dots = [], labs = [];
    for (var i = 0; i < 3; i++) { var c = s('circle', { r: 6, 'class': 'gm-dotg' }); dots.push(c); svg.appendChild(c); var l = T(0, 0, (i + 1) + '차 매수'); labs.push(l); svg.appendChild(l); }
    var avt = T(610, 0, '평균 단가', 'gm-t alt', 'end'); svg.appendChild(avt);
    var panel = panelEl();
    function X(i) { return 80 + i * 170; } function Y(v) { return 210 - (v - 70) * 3.2; }
    function run(name) {
      var p = paths[name], pts = p.map(function (v, i) { return [X(i), Y(v)]; });
      pl.setAttribute('d', D(pts));
      var avg = (p[0] + p[1] + p[2]) / 3;
      av.setAttribute('x1', 60); av.setAttribute('x2', 620); av.setAttribute('y1', Y(avg)); av.setAttribute('y2', Y(avg)); avt.setAttribute('y', Y(avg) - 8);
      dots.forEach(function (c, i) { c.setAttribute('cx', pts[i][0]); c.setAttribute('cy', pts[i][1]); labs[i].setAttribute('x', pts[i][0]); labs[i].setAttribute('y', pts[i][1] - 14); });
      var last = p[3], diff = last - avg;
      panel.textContent = (name === '하락' ? '나눠 사도 자산 자체가 하락하면 손실이 생길 수 있습니다. ' : name === '횡보' ? '가격이 제자리면 평균 단가와 현재 가격이 비슷합니다. ' : '가격이 오르면 늦게 산 회차의 단가가 높아집니다. ') + '평균 단가 ' + avg.toFixed(1) + ', 마지막 가격 ' + last + '(' + (diff >= 0 ? '+' : '') + diff.toFixed(1) + ').';
    }
    var tg = toggle(names.map(function (n) { return '가격 경로: ' + n; }), function (i) { run(names[i]); }, 0);
    ui.appendChild(tg.el); ui.appendChild(svg); ui.appendChild(panel); run('하락');
  };

  BUILD.regime = function (root, ui) {
    var svg = svgRoot('시장 국면 게이지', '변동 크기 슬라이더를 움직이면 안정·경계·위기 중 어느 국면에 가까운지 바늘이 움직입니다. 가상 예시입니다.', 640, 250);
    var cx = 320, cy = 200, r = 140;
    function pt(sc, rr) { var a = Math.PI * (1 - sc / 100); return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)]; }
    [[0, 33, 'gm-z1'], [33, 66, 'gm-z2'], [66, 100, 'gm-z3']].forEach(function (z) { var a = pt(z[0], r), b = pt(z[1], r); svg.appendChild(s('path', { d: 'M ' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' A ' + r + ' ' + r + ' 0 0 1 ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1), fill: 'none', 'class': 'gm-zone ' + z[2], 'stroke-width': 16 })); });
    [['안정', 16], ['경계', 50], ['위기', 84]].forEach(function (z) { var p = pt(z[1], r + 28); svg.appendChild(T(p[0], p[1] + 4, z[0], 'gm-t muted')); });
    var nd = s('g', { 'class': 'gm-needle', style: 'transform-origin:' + cx + 'px ' + cy + 'px' });
    nd.appendChild(s('line', { x1: cx, y1: cy, x2: cx, y2: cy - r + 24, stroke: 'var(--text)', 'stroke-width': 3, 'stroke-linecap': 'round' })); nd.appendChild(s('circle', { cx: cx, cy: cy, r: 8, 'class': 'gm-hub' })); svg.appendChild(nd);
    var st = T(cx, cy + 36, '', 'gm-state'); svg.appendChild(st);
    var panel = panelEl();
    var sl = slider('변동 크기', 0, 100, 20, 1, function (v) {
      nd.style.transform = 'rotate(' + (v * 1.8 - 90) + 'deg)';
      var z = v < 33 ? '안정' : v < 66 ? '경계' : '위기'; st.textContent = z;
      panel.textContent = z === '안정' ? '흔들림이 작은 상태입니다.' : z === '경계' ? '흔들림이 커지는 상태입니다.' : '크게 흔들리는 상태입니다. 국면은 현재 상태를 읽는 표시이며 미래를 맞히지 않습니다.';
    }, function (v) { return v; });
    ui.appendChild(sl.el); ui.appendChild(svg); ui.appendChild(panel); sl.update();
  };

  BUILD.dots = function (root, ui) {
    var svg = svgRoot('기준을 통과한 종목', '시장 하락폭 슬라이더를 움직이면 기준을 통과하는 종목 점의 수가 줄어듭니다. 가상 예시입니다.', 640, 200);
    var dots = []; for (var i = 0; i < 20; i++) { var c = s('circle', { cx: 60 + (i % 10) * 58, cy: 40 + Math.floor(i / 10) * 50, r: 14, 'class': 'gm-dot' }); dots.push(c); svg.appendChild(c); }
    var ct = T(320, 180, ''); svg.appendChild(ct);
    var panel = panelEl();
    var order = [3, 11, 7, 16, 1, 14, 9, 5, 18, 12, 0, 8, 15, 4, 19, 10, 2, 13, 6, 17];
    var sl = slider('시장 하락폭', 0, 40, 5, 1, function (v) {
      var pass = Math.max(0, Math.round(20 - v * 0.55 - (v > 30 ? (v - 30) * 0.5 : 0)));
      order.forEach(function (idx, k) { dots[idx].setAttribute('class', 'gm-dot' + (k < pass ? ' on' : '')); });
      ct.textContent = '통과 종목 ' + pass + '개';
      panel.textContent = pass === 0 ? '기준을 통과한 종목이 없어 추천 0개도 가능합니다. 기준을 낮춰 채우지 않았다는 뜻입니다.' : '기준을 통과한 종목이 ' + pass + '개입니다. 시장이 더 내리면 통과 종목이 줄어듭니다.';
    }, function (v) { return '−' + v + '%'; });
    ui.appendChild(sl.el); ui.appendChild(svg); ui.appendChild(panel); sl.update();
  };

  BUILD.comove = function (root, ui) {
    var svg = svgRoot('두 상품의 가격 움직임', '같이 움직임과 따로 움직임을 바꾸면 두 가격선의 모양이 달라집니다. 가상 예시입니다.', 640, 230);
    svg.appendChild(s('line', { x1: 40, y1: 205, x2: 620, y2: 205, 'class': 'gm-axis' }));
    var a = s('path', { 'class': 'gm-line', fill: 'none' }), b = s('path', { 'class': 'gm-line alt', fill: 'none' }); svg.appendChild(a); svg.appendChild(b);
    svg.appendChild(T(50, 24, '상품 A', 'gm-t', 'start')); svg.appendChild(T(130, 24, '상품 B', 'gm-t alt', 'start'));
    var panel = panelEl();
    var base = [0, 14, 6, 22, 12, 30, 18, 34, 22, 40, 28, 46], other = [30, 26, 38, 22, 36, 24, 40, 20, 34, 28, 38, 26];
    function path(arr, off) { return D(arr.map(function (v, i) { return [50 + i * 50, 190 - v * 2.4 - off]; })); }
    function run(i) { a.setAttribute('d', path(base, 0)); b.setAttribute('d', path(i === 0 ? base.map(function (v, k) { return v + (k % 3) - 1; }) : other, i === 0 ? 8 : 0)); panel.textContent = i === 0 ? '담은 종목이 달라도 두 상품의 가격이 거의 같이 움직입니다. 시장이 흔들리면 함께 흔들릴 수 있습니다.' : '두 상품이 따로 움직입니다. 한쪽이 내릴 때 다른 쪽이 버틸 수 있습니다.'; }
    var tg = toggle(['같이 움직임', '따로 움직임'], run, 0);
    ui.appendChild(tg.el); ui.appendChild(svg); ui.appendChild(panel); run(0);
  };

  document.querySelectorAll('[data-gm]').forEach(function (root) {
    var type = root.getAttribute('data-gm'); if (!BUILD[type]) return;
    var fig = root.closest('figure'); var fb = fig && fig.querySelector('svg[role="img"]'); if (fb) fb.classList.add('gm-fallback');
    var ui = h('div', { 'class': 'gm-ui' }); root.appendChild(ui);
    BUILD[type](root, ui);
    if (type !== 'pick') { var bar = ui.querySelector('.gm-toggle') || ui.querySelector('.gm-range'); if (bar) { var bd = h('span', { 'class': 'gm-badge' }, '예시(가상)'); bar.appendChild(bd); } }
  });
})();
