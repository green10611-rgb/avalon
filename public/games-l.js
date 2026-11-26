(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;
const isDOM = typeof document !== 'undefined';

/* =================== 알까기 =================== */
/* 바둑판 위에서 내 돌을 손가락으로 튕겨 상대 돌을 판 밖으로 떨어뜨려요. 상대 돌을 먼저 다 떨어뜨리면 승리!
   물리는 서버(방장)와 모든 화면이 같은 계산을 해요(같은 입력 → 같은 결과). 화면은 그 계산을 다시 돌려 움직임을 보여 줘요. */
const BR = 100, RAD = 3.2, MAXV = 3.7, NST = 12;
// 시작 대형 (아래쪽 사람 기준 좌표, 위쪽 사람은 판을 돌려서 같은 모양)
const FORM = {
  line: ['두 줄', () => [0, 1].flatMap(r => Array.from({length: 6}, (_, k) => [20 + k * 12, 74 + r * 12]))],
  wall: ['엇갈린 성벽', () => [0, 1].flatMap(r => Array.from({length: 6}, (_, k) => [16 + k * 13.6 + r * 6.8, 86 - r * 11]))],
  tri: ['피라미드', () => [[5, 88], [4, 79], [3, 70]].flatMap(([n, y]) => Array.from({length: n}, (_, k) => [50 + (k - (n - 1) / 2) * 10, y]))],
  v: ['V자', () => Array.from({length: 6}, (_, k) => [[12 + k * 6.8, 66 + k * 4.6], [88 - k * 6.8, 66 + k * 4.6]]).flat()],
  box: ['네모 진지', () => { const a = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) a.push([32 + c * 12, 66 + r * 11]); return a; }],
  rand: ['무작위', null]
};
function formation(key) {
  if (FORM[key] && FORM[key][1]) return FORM[key][1]();
  const a = []; let guard = 0;
  while (a.length < NST && guard++ < 4000) { const x = 8 + Math.random() * 84, y = 58 + Math.random() * 34; if (a.every(([x2, y2]) => (x - x2) ** 2 + (y - y2) ** 2 > 81)) a.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]); }
  return a;
}
function placeSide(S, p, key) {
  const pts = formation(key); S.form[p] = key;
  S.st.filter(o => o.p === p).forEach((o, k) => { const [x, y] = pts[k]; o.x = p === 0 ? x : BR - x; o.y = p === 0 ? y : BR - y; o.a = 1; });
}
function sim(st, k, vx, vy, rec) {
  const s = st.map(o => ({x: o.x, y: o.y, a: o.a, vx: 0, vy: 0}));
  s[k].vx = vx; s[k].vy = vy;
  const frames = rec ? [] : null, hits = [], falls = []; let steps = 0;
  // 묵직한 바둑알: 바닥 마찰이 일정하게 속도를 깎아(쿨롱 마찰) 쭉 미끄러지다 '딱' 멈춰요. 돌끼리는 거의 탄성 충돌.
  const SUB = 4, DEC = .062 / SUB, E = .86;
  for (let step = 0; step < 1500; step++) {
    let moving = false; steps = step;
    for (let sub = 0; sub < SUB; sub++) {
      for (const o of s) {
        if (!o.a) continue;
        const sp = Math.sqrt(o.vx * o.vx + o.vy * o.vy);
        if (sp < 1e-4) { o.vx = 0; o.vy = 0; continue; }
        moving = true;
        const ns = Math.max(0, sp * (1 - .0035 / SUB) - DEC * (sp < .5 ? 1.6 : 1)), f = ns / sp;
        o.vx *= f; o.vy *= f; o.x += o.vx / SUB; o.y += o.vy / SUB;
      }
      for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
        const A = s[i], B = s[j]; if (!A.a || !B.a) continue;
        const dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy, m = RAD * 2;
        if (d2 >= m * m || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = (m - d) / 2;
        A.x -= nx * ov; A.y -= ny * ov; B.x += nx * ov; B.y += ny * ov;
        const rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (rv < 0) { const jj = -(1 + E) * rv / 2; A.vx -= jj * nx; A.vy -= jj * ny; B.vx += jj * nx; B.vy += jj * ny; if (rec) hits.push([frames.length, (A.x + B.x) / 2, (A.y + B.y) / 2, -rv]); }
      }
      for (let i = 0; i < s.length; i++) { const o = s[i]; if (o.a && (o.x < 0 || o.x > BR || o.y < 0 || o.y > BR)) { o.a = 0; o.vx = 0; o.vy = 0; falls.push([i, rec ? frames.length : 0]); } }
    }
    if (rec) frames.push(s.map(o => [o.x, o.y, o.a]));
    if (!moving) break;
  }
  if (rec) frames.push(s.map(o => [o.x, o.y, o.a]));
  return {end: s.map(o => ({x: Math.round(o.x * 100) / 100, y: Math.round(o.y * 100) / 100, a: o.a, p: 0})), frames, hits, falls, steps};
}
const setupDone = S => !S.ready || (S.ready[0] && S.ready[1]);
const alive = (S, p) => S.st.filter(o => o.a && o.p === p).length;
G.alkkagi = {
  name: '알까기', tag: '튕겨서 상대 돌을 판 밖으로!', min: 2, max: 2, mark: '⚪', hue: '#B5783A',
  rules: ['바둑판 양쪽에 각자 돌 12개를 놓고 시작해요. 첫 튕기기 전에 각자 시작 대형(두 줄·엇갈린 성벽·피라미드·V자·네모 진지·무작위)을 고를 수 있어요. 흑·백은 무작위, 흑이 먼저예요.', '내 차례에 내 돌 하나를 꾹 눌러 뒤로 당겼다 놓으면 반대쪽으로 튕겨 나가요. 많이 당길수록 세게!', '돌이 판 밖으로 나가면 떨어져서 사라져요. 내 돌이 떨어질 수도 있어요!', '상대 돌을 먼저 모두 떨어뜨리면 승리. 둘 다 동시에 없어지면 무승부예요.', 'AI와 둘이서도 할 수 있어요.'],
  setup(P) {
    const black = Math.random() < .5 ? 0 : 1, st = [];
    for (const p of [0, 1]) for (let k = 0; k < NST; k++) st.push({x: 0, y: 0, a: 1, p});
    const S = {_g: Math.random().toString(36).slice(2, 9), st, form: ['wall', 'wall'], ready: [false, false], col: black === 0 ? [0, 1] : [1, 0], turn: black, n: 0, shots: 0, log: [`${P[black].name}님이 흑, 먼저 튕겨요! 먼저 각자 시작 대형을 고르고 "결정!"을 눌러요.`]};
    placeSide(S, 0, 'wall'); placeSide(S, 1, 'wall'); return S;
  },
  turns: S => S.winner ? [] : !setupDone(S) ? [0, 1].filter(i => !S.ready[i]) : [S.turn],
  allTurn(S) { return !S.winner && !setupDone(S) ? '🧱 각자 시작 대형 고르기' : ''; },
  act(S, me, t, a, P) {
    if (S.winner) return;
    if (t === 'ready') { if (setupDone(S)) return; S.ready[me] = true; S.n++; U.log(S, `${P[me].name}님 대형 결정! (${FORM[S.form[me]][0]})`); if (setupDone(S)) U.log(S, `양쪽 다 결정했어요. ${P[S.turn].name}님부터 튕겨요!`); return; }
    if (t === 'form') { if (S.shots || setupDone(S)) throw U.err('대형은 시작 전에만 바꿀 수 있어요.'); if (S.ready[me]) throw U.err('이미 결정했어요.'); if (!FORM[a.f]) throw U.err('대형을 골라 주세요.'); placeSide(S, me, a.f); S.n++; U.log(S, `${P[me].name}님이 '${FORM[a.f][0]}' 대형을 골랐어요.`); return; }
    if (t !== 'flick') throw U.err('알 수 없는 행동이에요.');
    if (!setupDone(S)) throw U.err('두 사람 모두 대형을 결정해야 시작돼요.');
    if (me !== S.turn) throw U.err('내 차례가 아니에요.');
    const k = +a.k, o = S.st[k];
    if (!o || !o.a || o.p !== me) throw U.err('내 돌을 골라 튕겨요.');
    let vx = +a.vx, vy = +a.vy; if (!isFinite(vx) || !isFinite(vy)) throw U.err('다시 튕겨 주세요.');
    const sp = Math.sqrt(vx * vx + vy * vy); if (sp < .15) throw U.err('조금 더 세게 당겨 주세요.');
    if (sp > MAXV) { vx *= MAXV / sp; vy *= MAXV / sp; }
    vx = Math.round(vx * 1000) / 1000; vy = Math.round(vy * 1000) / 1000;
    const pre = S.st.map(o2 => ({x: o2.x, y: o2.y, a: o2.a}));
    const r = sim(pre, k, vx, vy, false);
    const bef = [alive(S, 0), alive(S, 1)];
    S.st = r.end.map((o2, i) => ({x: o2.x, y: o2.y, a: o2.a, p: S.st[i].p}));
    S.shot = {pre, k, vx, vy, n: S.n + 1, by: me}; S.n++; S.shots++;
    const aft = [alive(S, 0), alive(S, 1)], lostMe = bef[me] - aft[me], lostOp = bef[1 - me] - aft[1 - me];
    U.log(S, `${P[me].name}님 튕김! ${lostOp ? `상대 돌 ${lostOp}개 떨어뜨림` : '상대 돌은 그대로'}${lostMe ? ` · 내 돌 ${lostMe}개 떨어짐` : ''}`);
    S.lastHit = {op: lostOp, me: lostMe};
    if (!aft[0] && !aft[1]) { S.winner = '둘 다 돌이 없어요. 무승부!'; S.wp = -1; return; }
    if (!aft[1 - me]) { S.winner = `${P[me].name}님 승리!`; S.wp = me; return; }
    if (!aft[me]) { S.winner = `${P[1 - me].name}님 승리!`; S.wp = 1 - me; return; }
    S.turn = 1 - me;
  },
  view(S, me, ui, P) {
    if (isDOM) setTimeout(() => lFx(S, me, P), 0);
    return `<div class="akbox"><div class="akw">${lBody(S, me, P)}</div></div>`;
  },
  splash: true
};
const flip = me => me === 1;   // 백(두 번째 자리)은 판을 뒤집어 내 돌이 아래에 오게
function lBody(S, me, P) {
  const my = me === S.turn && !S.winner && setupDone(S), fl = flip(me);
  const card = i => `<div class="ak-p${i === S.turn && !S.winner ? ' on' : ''}${S.winner && S.wp === i ? ' win' : ''}"><span class="ak-ps"><i class="om-st c${S.col[i]}"></i></span><div><b>${U.nm(P, i)}${i === me ? ' <small>(나)</small>' : ''}</b><span class="ak-left"><em>${alive(S, i)}</em>${Array.from({length: NST}, (_, k) => `<i class="${k < alive(S, i) ? 'on' : ''} c${S.col[i]}"></i>`).join('')}</span></div>${i === S.turn && !S.winner ? '<span class="om-turn">차례</span>' : ''}${S.winner && S.wp === i ? '<span class="om-turn gold">🏆 승리</span>' : ''}</div>`;
  const top = me === 1 ? 0 : 1, bot = 1 - top;
  let h = `<header class="ak-top">${card(top)}</header>`;
  const msg = S.winner ? (S.wp >= 0 ? `🏆 ${U.esc(S.winner)}` : '🤝 무승부!') : !setupDone(S) ? (me >= 0 && !S.ready[me] ? '🧱 시작 대형을 고르고 "결정!"을 눌러요' : '상대가 대형을 정하는 중…') : my ? '👉 내 돌을 꾹 눌러 뒤로 당겼다 놓으세요!' : me >= 0 ? `${U.nm(P, S.turn)}님이 겨누는 중…` : `${U.nm(P, S.turn)}님 차례`;
  const stones = S.st.map((o, i) => { const x = fl ? BR - o.x : o.x, y = fl ? BR - o.y : o.y; return `<span class="ak-s${o.a ? '' : ' gone'}${my && o.a && o.p === me ? ' mine' : ''}" data-k="${i}" style="left:${x}%;top:${y}%"><i class="om-st c${S.col[o.p]}"></i></span>`; }).join('');
  let lines = ''; for (let k = 0; k < 19; k++) { const v = (3 + k * 94 / 18).toFixed(2); lines += `<line x1="${v}" y1="3" x2="${v}" y2="97"/><line x1="3" y1="${v}" x2="97" y2="${v}"/>`; }
  [3, 9, 15].forEach(a => [3, 9, 15].forEach(b => { lines += `<circle cx="${(3 + a * 94 / 18).toFixed(2)}" cy="${(3 + b * 94 / 18).toFixed(2)}" r=".75"/>`; }));
  h += `<div class="ak-msg${my ? ' me' : ''}${S.winner ? ' end' : ''}">${msg}</div>`;
  if (!setupDone(S) && !S.winner && me >= 0) h += `<div class="ak-forms${S.ready[me] ? ' done' : ''}"><b>🧱 내 시작 대형</b>${Object.keys(FORM).map(k => U.btn(`${FORM[k][0]}`, 'form', {f: k}, 'sm' + (S.form[me] === k ? ' primary' : ''), S.ready[me])).join('')}${S.ready[me] ? '<span class="ak-rd ok">✅ 결정 완료</span>' : U.btn('✅ 이 대형으로 결정!', 'ready', {}, 'primary ak-go')}<small>${S.ready[me] ? (S.ready[1 - me] ? '' : `${U.nm(P, 1 - me)}님이 대형을 고르는 중…`) : '두 사람 모두 결정하면 시작해요'} · 상대 대형: ${FORM[S.form[1 - me]][0]}${S.ready[1 - me] ? ' (결정함)' : ''}</small></div>`;
  h += `<div class="ak-boardwrap"><div class="ak-table"><div class="ak-board${my ? ' my' : ''}" data-fl="${fl ? 1 : 0}"><svg class="ak-grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg><svg class="ak-aim" viewBox="0 0 100 100" aria-hidden="true"><defs><marker id="akArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#FFE07A"/></marker></defs><line class="pull"/><line class="shot" marker-end="url(#akArrow)"/><circle class="pw" r="0"/></svg>${stones}<span class="ak-pow" hidden><i></i></span></div></div></div>`;
  h += `<footer class="ak-bot">${card(bot)}</footer>`;
  if (my) h += `<button type="button" class="ak-fire" hidden data-act="flick" data-arg="{}"></button>`;
  return h;
}

/* ---------- 조작: 꾹 눌러 당기기 ---------- */
function bindAim(S, me) {
  const board = document.querySelector('.ak-board.my'); if (!board || board.__ak) return; board.__ak = 1;
  const fl = flip(me), aim = board.querySelector('.ak-aim'), pull = aim.querySelector('.pull'), shot = aim.querySelector('.shot'), pw = aim.querySelector('.pw'), bar = board.querySelector('.ak-pow');
  let drag = null;
  const pt = e => { const r = board.getBoundingClientRect(); return {x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100}; };
  board.addEventListener('pointerdown', e => {
    const el = e.target.closest('.ak-s.mine'); if (!el) return;
    const k = +el.dataset.k, o = S.st[k]; const sx = fl ? BR - o.x : o.x, sy = fl ? BR - o.y : o.y;
    drag = {k, sx, sy}; el.classList.add('held'); board.setPointerCapture(e.pointerId); e.preventDefault(); move(e);
  });
  function move(e) {
    if (!drag) return; const p = pt(e); let dx = drag.sx - p.x, dy = drag.sy - p.y; const d = Math.min(26, Math.sqrt(dx * dx + dy * dy)), f = d / 26;
    const ang = Math.atan2(dy, dx); drag.f = f; drag.ang = ang;
    const px = drag.sx - Math.cos(ang) * d, py = drag.sy - Math.sin(ang) * d, tx = drag.sx + Math.cos(ang) * (8 + f * 40), ty = drag.sy + Math.sin(ang) * (8 + f * 40);
    pull.setAttribute('x1', drag.sx); pull.setAttribute('y1', drag.sy); pull.setAttribute('x2', px); pull.setAttribute('y2', py);
    shot.setAttribute('x1', drag.sx); shot.setAttribute('y1', drag.sy); shot.setAttribute('x2', tx); shot.setAttribute('y2', ty);
    pw.setAttribute('cx', px); pw.setAttribute('cy', py); pw.setAttribute('r', 1.4 + f * 1.6);
    aim.classList.add('on'); aim.style.setProperty('--f', f.toFixed(2)); bar.hidden = false; bar.firstChild.style.width = (f * 100) + '%';
    const el = board.querySelector(`.ak-s[data-k="${drag.k}"]`); if (el) el.style.transform = `translate(-50%,-50%) translate(${(px - drag.sx) * .12}cqw,${(py - drag.sy) * .12}cqw)`;
  }
  board.addEventListener('pointermove', move);
  const up = e => {
    if (!drag) return; const d = drag; drag = null; aim.classList.remove('on'); bar.hidden = true;
    const el = board.querySelector(`.ak-s[data-k="${d.k}"]`); if (el) { el.classList.remove('held'); el.style.transform = ''; }
    if (!d.f || d.f < .08) return;
    const pw = Math.pow(d.f, .8) * MAXV; let vx = Math.cos(d.ang) * pw, vy = Math.sin(d.ang) * pw; if (fl) { vx = -vx; vy = -vy; }
    const b = document.querySelector('.ak-fire'); if (!b) return;
    b.dataset.arg = JSON.stringify({k: d.k, vx: Math.round(vx * 1000) / 1000, vy: Math.round(vy * 1000) / 1000}); b.click();
  };
  board.addEventListener('pointerup', up); board.addEventListener('pointercancel', () => { drag = null; aim.classList.remove('on'); bar.hidden = true; });
}

/* ---------- 움직임: 같은 물리를 다시 돌려, 시간에 맞춰 부드럽게 보여 줘요 ---------- */
const STEPMS = 13;   // 물리 한 걸음 = 13ms
function lFx(S, me, P) {
  const W = window; W.__lfx = W.__lfx || {};
  const rec = W.__lfx[S._g]; W.__lfx[S._g] = {n: S.n};
  const go = () => bindAim(S, me);
  const reduce = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let A = W.__lanim;
  if (rec && S.shot && S.shot.n === S.n && rec.n !== S.n && !reduce) {
    const r = sim(S.shot.pre, S.shot.k, S.shot.vx, S.shot.vy, true);
    A = W.__lanim = {g: S._g, n: S.n, t0: performance.now(), r, hitDone: new Set(), fallDone: new Set()};
    if (W.SFX) W.SFX.play('alhit', .55);
  }
  if (!A || A.g !== S._g || A.n !== S.n || A.done) { go(); return; }
  // 화면이 다시 그려져도 이어서 재생해요
  const board = document.querySelector('.ak-board'); if (!board) return;
  const els = [...board.querySelectorAll('.ak-s')], fl = flip(me), r = A.r, last = r.frames.length - 1;
  board.classList.add('anim');
  const fallAt = {}; r.falls.forEach(([i, f]) => fallAt[i] = f);
  els.forEach(el => { el.style.left = '0'; el.style.top = '0'; el.style.willChange = 'transform'; });
  const draw = () => {
    if (!board.isConnected || W.__lanim !== A) return;
    const bw = board.clientWidth, t = (performance.now() - A.t0) / STEPMS, i0 = Math.min(last, Math.floor(t)), i1 = Math.min(last, i0 + 1), f = Math.min(1, t - i0);
    const F0 = r.frames[i0], F1 = r.frames[i1];
    for (let i = 0; i < els.length; i++) {
      const el = els[i], a = F0[i], b = F1[i]; let x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f; if (fl) { x = BR - x; y = BR - y; }
      el.style.transform = `translate3d(${(x * bw / 100).toFixed(1)}px,${(y * bw / 100).toFixed(1)}px,0) translate(-50%,-50%)`;
      if (fallAt[i] != null && i0 >= fallAt[i]) { if (!A.fallDone.has(i)) { A.fallDone.add(i); if (W.SFX) W.SFX.play('swish'); } el.classList.remove('gone'); el.classList.add('falling'); }
      else if (!a[2]) el.classList.add('gone'); else el.classList.remove('gone', 'falling');
    }
    for (const h of r.hits) if (h[0] <= i0 && !A.hitDone.has(h[0])) {
      A.hitDone.add(h[0]); if (h[3] < .06) continue;
      if (W.SFX) W.SFX.play('alhit', Math.min(1.3, .45 + h[3] / 2.2));
      const sp = document.createElement('i'); sp.className = 'akfx-hit'; const hx = fl ? BR - h[1] : h[1], hy = fl ? BR - h[2] : h[2];
      sp.style.left = hx + '%'; sp.style.top = hy + '%'; sp.style.setProperty('--hs', Math.min(1.6, .5 + h[3] / 3).toFixed(2)); board.appendChild(sp); setTimeout(() => sp.remove(), 450);
    }
    if (i0 < last) requestAnimationFrame(draw);
    else {
      A.done = true; board.classList.remove('anim');
      els.forEach((el, i) => { const o = S.st[i]; el.style.transform = ''; el.style.willChange = ''; el.style.left = (fl ? BR - o.x : o.x) + '%'; el.style.top = (fl ? BR - o.y : o.y) + '%'; el.classList.toggle('gone', !o.a); el.classList.remove('falling'); });
      if (S.winner) win(); go();
    }
  };
  requestAnimationFrame(draw);
  function win() {
    const el = document.createElement('div'); el.className = 'omfx-banner' + (S.wp === me ? ' me' : '');
    el.innerHTML = `<b>${S.wp >= 0 ? (S.wp === me ? '🏆 승리!' : `🏆 ${U.esc(P[S.wp].name)}님 승리!`) : '🤝 무승부'}</b><small>${S.shots}번 튕겨서 끝났어요</small>`;
    const w = document.querySelector('.akw'), wr = w && w.getBoundingClientRect(); if (wr) el.style.left = (wr.left + wr.width / 2) + 'px';
    document.body.appendChild(el);
    el.animate([{transform: 'translate(-50%,-50%) scale(.4)', opacity: 0}, {transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1, offset: .2}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .8}, {transform: 'translate(-50%,-60%) scale(.95)', opacity: 0}], {duration: 2600, fill: 'both'}).onfinish = () => el.remove();
    if (S.wp >= 0) for (let i = 0; i < 60; i++) { const p = document.createElement('i'); p.className = 'omfx-c'; p.style.cssText = `left:${Math.random() * 100}vw;background:${['#FFD54F', '#fff', '#222', '#F5A623'][i % 4]};border-radius:50%`; document.body.appendChild(p); p.animate([{transform: 'translateY(-10vh)'}, {transform: `translateY(110vh) rotate(${Math.random() * 720}deg)`}], {duration: 2200 + Math.random() * 1600, delay: Math.random() * 400}).onfinish = () => p.remove(); }
  }
}

/* ---------- AI: 막히지 않은 상대 돌을 노려요 ---------- */
function lBot(S, P) {
  if (!S || S.winner) return false;
  if (!setupDone(S)) { const b = [0, 1].find(i => P[i].bot && !S.ready[i]); if (b == null) return false; const ks = Object.keys(FORM); G.alkkagi.act(S, b, 'form', {f: ks[Math.floor(Math.random() * ks.length)]}, P); G.alkkagi.act(S, b, 'ready', {}, P); return true; }
  const me = S.turn; if (!P[me] || !P[me].bot) return false;
  const mine = S.st.map((o, i) => [o, i]).filter(([o]) => o.a && o.p === me), ops = S.st.map((o, i) => [o, i]).filter(([o]) => o.a && o.p !== me);
  let best = null;
  for (const [a, ai] of mine) for (const [b] of ops) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy);
    let blocked = 0; for (const o of S.st) { if (!o.a || o === a || o === b) continue; const t = ((o.x - a.x) * dx + (o.y - a.y) * dy) / (d * d); if (t <= 0 || t >= 1) continue; const px = a.x + dx * t - o.x, py = a.y + dy * t - o.y; if (px * px + py * py < (RAD * 2.1) ** 2) blocked++; }
    const edge = Math.min(b.x, b.y, BR - b.x, BR - b.y);
    const sc = d + blocked * 60 + edge * .4;
    if (!best || sc < best.sc) best = {sc, ai, dx, dy, d};
  }
  if (!best) return false;
  const ang = Math.atan2(best.dy, best.dx) + (Math.random() - .5) * .07, pw = MAXV * (.72 + Math.random() * .28);
  G.alkkagi.act(S, me, 'flick', {k: best.ai, vx: Math.cos(ang) * pw, vy: Math.sin(ang) * pw}, P);
  return true;
}
G.alkkagi.botStep = lBot;
G.alkkagi.botDelay = S => S && S.shot ? sim(S.shot.pre, S.shot.k, S.shot.vx, S.shot.vy, false).steps * STEPMS + 700 : 900;
G.alkkagi.BOTNAMES = ['튕김왕', '손가락', '알부자', '돌멩이'];
})();
