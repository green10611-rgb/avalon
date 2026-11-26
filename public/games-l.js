(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;
const isDOM = typeof document !== 'undefined';

/* =================== 알까기 =================== */
/* 바둑판 위에서 내 돌을 손가락으로 튕겨 상대 돌을 판 밖으로 떨어뜨려요. 상대 돌을 먼저 다 떨어뜨리면 승리!
   물리는 서버(방장)와 모든 화면이 같은 계산을 해요(같은 입력 → 같은 결과). 화면은 그 계산을 다시 돌려 움직임을 보여 줘요. */
const BR = 100, RAD = 3.4, MAXV = 4.4, NST = 6;
function sim(st, k, vx, vy, rec) {
  const s = st.map(o => ({x: o.x, y: o.y, a: o.a, vx: 0, vy: 0}));
  s[k].vx = vx; s[k].vy = vy;
  const frames = rec ? [] : null, hits = [], falls = [];
  for (let step = 0; step < 2400; step++) {
    let moving = false;
    for (const o of s) {
      if (!o.a) continue;
      const sp = Math.sqrt(o.vx * o.vx + o.vy * o.vy);
      if (sp < .004) { o.vx = 0; o.vy = 0; continue; }
      moving = true;
      const ns = Math.max(0, sp * .988 - .006), f = ns / sp;
      o.vx *= f; o.vy *= f; o.x += o.vx; o.y += o.vy;
    }
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
      const A = s[i], B = s[j]; if (!A.a || !B.a) continue;
      const dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy, m = RAD * 2;
      if (d2 >= m * m || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = (m - d) / 2;
      A.x -= nx * ov; A.y -= ny * ov; B.x += nx * ov; B.y += ny * ov;
      const rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
      if (rv < 0) { const jj = -(1 + .9) * rv / 2; A.vx -= jj * nx; A.vy -= jj * ny; B.vx += jj * nx; B.vy += jj * ny; if (rec) hits.push(frames.length); }
    }
    for (let i = 0; i < s.length; i++) { const o = s[i]; if (o.a && (o.x < 0 || o.x > BR || o.y < 0 || o.y > BR)) { o.a = 0; falls.push([i, rec ? frames.length : 0, o.vx, o.vy]); } }
    if (rec && step % 2 === 0) frames.push(s.map(o => [o.x, o.y, o.a]));
    if (!moving) break;
  }
  if (rec) frames.push(s.map(o => [o.x, o.y, o.a]));
  return {end: s.map(o => ({x: Math.round(o.x * 100) / 100, y: Math.round(o.y * 100) / 100, a: o.a, p: 0})), frames, hits, falls};
}
const alive = (S, p) => S.st.filter(o => o.a && o.p === p).length;
G.alkkagi = {
  name: '알까기', tag: '튕겨서 상대 돌을 판 밖으로!', min: 2, max: 2, mark: '🎯', hue: '#B5783A',
  rules: ['바둑판 양쪽에 각자 돌 6개를 놓고 시작해요. 흑·백은 무작위, 흑이 먼저예요.', '내 차례에 내 돌 하나를 꾹 눌러 뒤로 당겼다 놓으면 반대쪽으로 튕겨 나가요. 많이 당길수록 세게!', '돌이 판 밖으로 나가면 떨어져서 사라져요. 내 돌이 떨어질 수도 있어요!', '상대 돌을 먼저 모두 떨어뜨리면 승리. 둘 다 동시에 없어지면 무승부예요.', 'AI와 둘이서도 할 수 있어요.'],
  setup(P) {
    const black = Math.random() < .5 ? 0 : 1, st = [];
    for (const p of [0, 1]) for (let k = 0; k < NST; k++) st.push({x: 15 + k * 14, y: p === 0 ? 80 : 20, a: 1, p});
    return {_g: Math.random().toString(36).slice(2, 9), st, col: black === 0 ? [0, 1] : [1, 0], turn: black, n: 0, shots: 0, log: [`${P[black].name}님이 흑, 먼저 튕겨요!`]};
  },
  turns: S => S.winner ? [] : [S.turn],
  act(S, me, t, a, P) {
    if (S.winner) return;
    if (t !== 'flick') throw U.err('알 수 없는 행동이에요.');
    if (me !== S.turn) throw U.err('내 차례가 아니에요.');
    const k = +a.k, o = S.st[k];
    if (!o || !o.a || o.p !== me) throw U.err('내 돌을 골라 튕겨요.');
    let vx = +a.vx, vy = +a.vy; if (!isFinite(vx) || !isFinite(vy)) throw U.err('다시 튕겨 주세요.');
    const sp = Math.sqrt(vx * vx + vy * vy); if (sp < .25) throw U.err('조금 더 세게 당겨 주세요.');
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
  const my = me === S.turn && !S.winner, fl = flip(me);
  const card = i => `<div class="ak-p${i === S.turn && !S.winner ? ' on' : ''}${S.winner && S.wp === i ? ' win' : ''}"><span class="ak-ps"><i class="om-st c${S.col[i]}"></i></span><div><b>${U.nm(P, i)}${i === me ? ' <small>(나)</small>' : ''}</b><span class="ak-left">${Array.from({length: NST}, (_, k) => `<i class="${k < alive(S, i) ? 'on' : ''} c${S.col[i]}"></i>`).join('')}</span></div>${i === S.turn && !S.winner ? '<span class="om-turn">차례</span>' : ''}${S.winner && S.wp === i ? '<span class="om-turn gold">🏆 승리</span>' : ''}</div>`;
  const top = me === 1 ? 0 : 1, bot = 1 - top;
  let h = `<header class="ak-top">${card(top)}</header>`;
  const msg = S.winner ? (S.wp >= 0 ? `🏆 ${U.esc(S.winner)}` : '🤝 무승부!') : my ? '👉 내 돌을 꾹 눌러 뒤로 당겼다 놓으세요!' : me >= 0 ? `${U.nm(P, S.turn)}님이 겨누는 중…` : `${U.nm(P, S.turn)}님 차례`;
  const stones = S.st.map((o, i) => { const x = fl ? BR - o.x : o.x, y = fl ? BR - o.y : o.y; return `<span class="ak-s${o.a ? '' : ' gone'}${my && o.a && o.p === me ? ' mine' : ''}" data-k="${i}" style="left:${x}%;top:${y}%"><i class="om-st c${S.col[o.p]}"></i></span>`; }).join('');
  let lines = ''; for (let k = 0; k <= 12; k++) { const v = (k / 12 * 100).toFixed(2); lines += `<line x1="${v}" y1="0" x2="${v}" y2="100"/><line x1="0" y1="${v}" x2="100" y2="${v}"/>`; }
  h += `<div class="ak-msg${my ? ' me' : ''}${S.winner ? ' end' : ''}">${msg}</div>`;
  h += `<div class="ak-boardwrap"><div class="ak-board${my ? ' my' : ''}" data-fl="${fl ? 1 : 0}"><svg class="ak-grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg><svg class="ak-aim" viewBox="0 0 100 100" aria-hidden="true"><line class="pull"/><line class="shot"/><circle class="pw" r="0"/></svg>${stones}<span class="ak-pow" hidden><i></i></span></div></div>`;
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
    let vx = Math.cos(d.ang) * d.f * MAXV, vy = Math.sin(d.ang) * d.f * MAXV; if (fl) { vx = -vx; vy = -vy; }
    const b = document.querySelector('.ak-fire'); if (!b) return;
    b.dataset.arg = JSON.stringify({k: d.k, vx: Math.round(vx * 1000) / 1000, vy: Math.round(vy * 1000) / 1000}); b.click();
  };
  board.addEventListener('pointerup', up); board.addEventListener('pointercancel', () => { drag = null; aim.classList.remove('on'); bar.hidden = true; });
}

/* ---------- 움직임: 같은 물리를 다시 돌려 보여 줘요 ---------- */
function lFx(S, me, P) {
  const W = window; W.__lfx = W.__lfx || {};
  const cur = {n: S.n, end: !!S.winner}, rec = W.__lfx[S._g]; W.__lfx[S._g] = cur;
  const go = () => bindAim(S, me);
  if (!rec || !S.shot || S.shot.n !== S.n || rec.n === S.n || (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches)) { go(); return; }
  const r = sim(S.shot.pre, S.shot.k, S.shot.vx, S.shot.vy, true), fl = flip(me);
  const els = [...document.querySelectorAll('.ak-s')], board = document.querySelector('.ak-board'); if (!board) return;
  board.classList.add('anim');
  const fallAt = {}; r.falls.forEach(([i, f, vx, vy]) => fallAt[i] = [f, vx, vy]);
  const hitSet = new Set(r.hits.map(h => Math.floor(h)));
  let fi = 0, last = 0;
  const place = fr => fr.forEach((p, i) => { const el = els[i]; if (!el) return; const x = fl ? BR - p[0] : p[0], y = fl ? BR - p[1] : p[1]; el.style.left = x + '%'; el.style.top = y + '%'; if (fallAt[i] && fi >= fallAt[i][0] && !el.__fell) { el.__fell = 1; el.classList.remove('gone'); el.classList.add('falling'); if (W.SFX) W.SFX.play('swish'); } else if (!p[2] && !fallAt[i]) el.classList.add('gone'); else if (p[2]) el.classList.remove('gone'); });
  place(r.frames[0]);
  if (W.SFX) W.SFX.play('flip');
  const tick = t => {
    if (!document.body.contains(board)) return;
    if (t - last >= 16) { last = t; fi++;
      if (hitSet.has(fi) || hitSet.has(fi - 1)) { if (W.SFX) W.SFX.play('stamp'); const sp = document.createElement('i'); sp.className = 'akfx-hit'; board.appendChild(sp); const fr = r.frames[Math.min(fi, r.frames.length - 1)]; sp.style.left = (fl ? BR - fr[S.shot.k][0] : fr[S.shot.k][0]) + '%'; sp.style.top = (fl ? BR - fr[S.shot.k][1] : fr[S.shot.k][1]) + '%'; setTimeout(() => sp.remove(), 500); }
    }
    if (fi < r.frames.length) { place(r.frames[fi]); requestAnimationFrame(tick); }
    else { board.classList.remove('anim'); els.forEach((el, i) => { if (!S.st[i].a) el.classList.add('gone'); }); if (S.winner) win(); go(); }
  };
  requestAnimationFrame(tick);
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
G.alkkagi.botDelay = () => 1600;
G.alkkagi.BOTNAMES = ['튕김왕', '손가락', '알부자', '돌멩이'];
})();
