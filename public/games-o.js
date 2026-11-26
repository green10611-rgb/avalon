(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;
const isDOM = typeof document !== 'undefined';

/* =================== 오목 =================== */
/* 15×15 바둑판. 흑이 먼저 두고, 가로·세로·대각선으로 다섯 알을 먼저 이으면 승리(여섯 이상도 인정, 금수 없음). */
const N = 15, STAR = [3 * 15 + 3, 3 * 15 + 11, 7 * 15 + 7, 11 * 15 + 3, 11 * 15 + 11];
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
const COLS = 'ABCDEFGHJKLMNOP';
const sname = c => c ? '백' : '흑';
function lineAt(b, i, who) {
  const r = Math.floor(i / N), c = i % N;
  for (const [dr, dc] of DIRS) {
    const cells = [i];
    for (const s of [1, -1]) { let rr = r + dr * s, cc = c + dc * s; while (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr * N + cc] === who) { cells.push(rr * N + cc); rr += dr * s; cc += dc * s; } }
    if (cells.length >= 5) return cells;
  }
  return null;
}
G.omok = {
  name: '오목', tag: '다섯 알을 먼저 이어라', min: 2, max: 2, mark: '⚫', hue: '#8A5A2B',
  rules: ['15×15 바둑판에 번갈아 돌을 놓아요. 흑이 먼저 둬요(흑·백은 무작위로 정해져요).', '가로·세로·대각선으로 다섯 알을 먼저 이으면 승리! 여섯 알 이상도 인정해요(금수 없음).', '판이 다 차면 무승부예요.', '한 수에 제한시간을 걸 수도 있어요(시작 화면에서 골라요). 시간이 지나면 차례가 넘어가요.', 'AI와 둘이서도 할 수 있어요.'],
  setup(P) {
    const black = Math.random() < .5 ? 0 : 1;   // 흑은 무작위
    return {_g: Math.random().toString(36).slice(2, 9), b: Array(N * N).fill(-1), col: black === 0 ? [0, 1] : [1, 0], turn: black, last: -1, mv: 0, tl: 0, ts: Date.now(), hist: [], log: [`${P[black].name}님이 흑, 먼저 둬요.`]};
  },
  turns: S => S.winner ? [] : [S.turn],
  due(S) { return !S.winner && S.tl ? S.ts + S.tl * 1000 : null; },
  timeout(S, P) {
    if (S.winner || !S.tl || Date.now() < S.ts + S.tl * 1000 - 300) return false;
    U.log(S, `⏰ ${P[S.turn].name}님 시간 초과! 차례가 넘어가요.`);
    S.turn = 1 - S.turn; S.ts = Date.now(); S.skip = (S.skip || 0) + 1; return true;
  },
  act(S, me, t, a, P) {
    if (S.winner) return;
    if (t === 'tl') { if (S.mv > 0) throw U.err('첫 수를 두기 전에만 바꿀 수 있어요.'); S.tl = [0, 30, 60].includes(+a.s) ? +a.s : 0; S.ts = Date.now(); return; }
    if (t !== 'place') throw U.err('알 수 없는 행동이에요.');
    if (me !== S.turn) throw U.err('내 차례가 아니에요.');
    const i = +a.i; if (!(i >= 0 && i < N * N) || S.b[i] !== -1) throw U.err('거기에는 둘 수 없어요.');
    S.b[i] = me; S.last = i; S.mv++; S.hist.push(i); S.ts = Date.now();
    const ln = lineAt(S.b, i, me);
    if (ln) { S.line = ln; S.winner = `${P[me].name}님(${sname(S.col[me])}) 승리!`; S.wp = me; U.log(S, `🏆 ${S.winner} ${S.mv}수 만에 오목 완성!`); return; }
    if (!S.b.includes(-1)) { S.winner = '판이 꽉 찼어요. 무승부!'; S.wp = -1; return; }
    S.turn = 1 - me;
  },
  view(S, me, ui, P) {
    if (isDOM) setTimeout(() => oFx(S, me, P), 0);
    return `<div class="ombox"><div class="omw${S.winner ? ' over' : ''}">${oBody(S, me, ui || {}, P)}</div></div>`;
  },
  splash: true
};

function clock(S) {
  if (!S.tl || S.winner) return '';
  let left = S.tl;
  if (isDOM) { const W = window; W.__omT = W.__omT || {}; const k = S._g + ':' + S.ts; const seen = W.__omT[k] = W.__omT[k] || Date.now(); left = Math.max(0, S.tl - (Date.now() - seen) / 1000); omTick(); return `<b class="om-clock${left < 10 ? ' hurry' : ''}" data-seen="${seen}" data-len="${S.tl}">⏳ <span>${Math.ceil(left)}</span>초</b>`; }
  return `<b class="om-clock">⏳ ${left}초</b>`;
}
function omTick() {
  const W = window; if (W.__omTick) return;
  W.__omTick = setInterval(() => document.querySelectorAll('.om-clock[data-seen]').forEach(e => { const l = Math.max(0, +e.dataset.len - (Date.now() - +e.dataset.seen) / 1000); const sp = e.querySelector('span'); if (sp) sp.textContent = Math.ceil(l); e.classList.toggle('hurry', l < 10); }), 250);
}
function oBody(S, me, ui, P) {
  const my = me === S.turn && !S.winner, myc = me >= 0 ? S.col[me] : -1;
  const card = i => `<div class="om-p c${S.col[i]}${i === S.turn && !S.winner ? ' on' : ''}${S.winner && S.wp === i ? ' win' : ''}" style="--pc:${U.pc(i)}"><span class="om-ps"><i class="om-st c${S.col[i]}"></i></span><div><b>${U.nm(P, i)}${i === me ? ' <small>(나)</small>' : ''}</b><small>${sname(S.col[i])}${S.col[i] === 0 ? ' · 먼저' : ''} · ${S.b.filter(v => v === i).length}수</small></div>${i === S.turn && !S.winner ? '<span class="om-turn">차례</span>' : ''}${S.winner && S.wp === i ? '<span class="om-turn gold">🏆 승리</span>' : ''}</div>`;
  let h = `<header class="om-top">${card(0)}<span class="om-vs">VS</span>${card(1)}</header>`;
  const msg = S.winner ? (S.wp >= 0 ? `🏆 ${U.esc(S.winner)}` : '🤝 무승부!') : my ? `👉 내 차례예요! ${sname(myc)}돌을 놓을 곳을 눌러요` : me >= 0 ? `${U.nm(P, S.turn)}님이 생각하는 중…` : `${U.nm(P, S.turn)}님(${sname(S.col[S.turn])}) 차례`;
  h += `<div class="om-msg${my ? ' me' : ''}${S.winner ? ' end' : ''}"><span>${msg}</span>${clock(S)}</div>`;
  const win = new Set(S.line || []);
  let pts = '';
  for (let i = 0; i < N * N; i++) {
    const v = S.b[i];
    if (v >= 0) pts += `<span class="om-pt has" data-i="${i}"><i class="om-st c${S.col[v]}${i === S.last ? ' last' : ''}${win.has(i) ? ' win' : ''}"${S.winner ? ` style="--wk:${[...win].indexOf(i)}"` : ''}></i>${ui.omnum ? `<em class="om-no">${S.hist.indexOf(i) + 1}</em>` : ''}</span>`;
    else pts += my ? `<button type="button" class="om-pt" data-act="place" data-arg="${U.attr({i})}" aria-label="${COLS[i % N]}${N - Math.floor(i / N)}"></button>` : `<span class="om-pt"></span>`;
  }
  let lines = '';
  for (let k = 0; k < N; k++) lines += `<line x1=".5" y1="${k + .5}" x2="${N - .5}" y2="${k + .5}"/><line x1="${k + .5}" y1=".5" x2="${k + .5}" y2="${N - .5}"/>`;
  const stars = STAR.map(i => `<circle cx="${i % N + .5}" cy="${Math.floor(i / N) + .5}" r=".12"/>`).join('');
  const coords = Array.from({length: N}, (_, k) => `<text x="${k + .5}" y="-.15">${COLS[k]}</text><text x="-.35" y="${k + .62}">${N - k}</text>`).join('');
  h += `<div class="om-boardwrap"><div class="om-board${my ? ' my c' + myc : ''}"><svg class="om-grid" viewBox="-.6 -.6 ${N + 1.2} ${N + 1.2}" aria-hidden="true"><rect x="-.6" y="-.6" width="${N + 1.2}" height="${N + 1.2}" fill="none"/><g class="ln">${lines}<rect x=".5" y=".5" width="${N - 1}" height="${N - 1}" fill="none" class="edge"/></g><g class="star">${stars}</g><g class="crd">${coords}</g>${S.line ? (() => { const a = S.line.map(i => [i % N + .5, Math.floor(i / N) + .5]).sort((p, q) => p[0] - q[0] || p[1] - q[1]); const f = a[0], l = a[a.length - 1]; return `<line class="winline" x1="${f[0]}" y1="${f[1]}" x2="${l[0]}" y2="${l[1]}" pathLength="1"/>`; })() : ''}</svg><div class="om-pts">${pts}</div></div></div>`;
  h += `<div class="om-tools">${S.mv === 0 && !S.winner && me >= 0 ? `<span class="om-tl"><b>⏱ 한 수 제한시간</b>${[0, 30, 60].map(s => U.btn(s ? `${s}초` : '없음', 'tl', {s}, 'sm' + (S.tl === s ? ' primary' : ''))).join('')}</span>` : ''}${S.mv ? U.ub(ui.omnum ? '🔢 수순 숨기기' : '🔢 수순 보기', 'omnum', true, 'sm ghost') : ''}</div>`;
  return h;
}

/* ---------- 움직임 ---------- */
function oFx(S, me, P) {
  const W = window; W.__ofx = W.__ofx || {};
  const cur = {mv: S.mv, end: !!S.winner, turn: S.turn};
  const rec = W.__ofx[S._g]; W.__ofx[S._g] = cur;
  if (!rec || !document.querySelector('.omw')) return;
  if (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = q => document.querySelector(q);
  if (cur.mv !== rec.mv && S.last >= 0) {
    const st = $(`.om-pt[data-i="${S.last}"] .om-st`);
    if (st && st.animate) {
      st.animate([{transform: 'translate(-50%,-50%) scale(1.9) translateY(-30%)', opacity: 0, filter: 'blur(2px)'}, {transform: 'translate(-50%,-50%) scale(.92)', opacity: 1, filter: 'blur(0)', offset: .65}, {transform: 'translate(-50%,-50%) scale(1.04)', offset: .82}, {transform: 'translate(-50%,-50%) scale(1)'}], {duration: 380, easing: 'cubic-bezier(.3,.7,.4,1)'});
      const r = st.getBoundingClientRect(), rp = document.createElement('i'); rp.className = 'omfx-ripple'; rp.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:${r.width}px;height:${r.width}px`;
      document.body.appendChild(rp); rp.animate([{transform: 'translate(-50%,-50%) scale(.6)', opacity: .9}, {transform: 'translate(-50%,-50%) scale(2.6)', opacity: 0}], {duration: 600, delay: 220, easing: 'ease-out', fill: 'both'}).onfinish = () => rp.remove();
    }
    if (W.SFX) setTimeout(() => W.SFX.play('clack', 1.1), 230);
    if (!S.winner && S.turn === me) { const b = $('.om-msg'); if (b && b.animate) b.animate([{transform: 'scale(.94)'}, {transform: 'scale(1.03)'}, {transform: 'none'}], {duration: 420}); }
  }
  if (cur.end && !rec.end) {
    setTimeout(() => {
      const el = document.createElement('div'); el.className = 'omfx-banner' + (S.wp === me ? ' me' : '');
      el.innerHTML = `<b>${S.wp >= 0 ? (S.wp === me ? '🏆 오목 완성! 승리!' : `🏆 ${U.esc(P[S.wp].name)}님 승리!`) : '🤝 무승부'}</b><small>${S.mv}수 만에 끝났어요</small>`;
      const w = $('.omw'), wr = w && w.getBoundingClientRect(); if (wr) el.style.left = (wr.left + wr.width / 2) + 'px';
      document.body.appendChild(el);
      el.animate([{transform: 'translate(-50%,-50%) scale(.4)', opacity: 0}, {transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1, offset: .2}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .8}, {transform: 'translate(-50%,-60%) scale(.95)', opacity: 0}], {duration: 2600, fill: 'both'}).onfinish = () => el.remove();
      if (S.wp >= 0) { const cols = ['#FFD54F', '#FFFFFF', '#222', '#F5A623', '#C59BFF']; for (let i = 0; i < 70; i++) { const p = document.createElement('i'); p.className = 'omfx-c'; p.style.cssText = `left:${Math.random() * 100}vw;background:${cols[i % cols.length]};border-radius:${i % 2 ? '50%' : '2px'}`; document.body.appendChild(p); p.animate([{transform: 'translateY(-10vh) rotate(0)'}, {transform: `translateY(110vh) rotate(${Math.random() * 720}deg)`}], {duration: 2200 + Math.random() * 1800, delay: Math.random() * 400, easing: 'cubic-bezier(.3,.6,.6,1)'}).onfinish = () => p.remove(); } }
    }, 450);
  }
}

/* ---------- AI: 공격·수비 무늬 점수 ---------- */
function evalDir(b, i, who, dr, dc) {
  const r = Math.floor(i / N), c = i % N; let cnt = 1, open = 0, gap = 0;
  for (const s of [1, -1]) {
    let rr = r + dr * s, cc = c + dc * s, used = false;
    while (rr >= 0 && rr < N && cc >= 0 && cc < N) {
      const v = b[rr * N + cc];
      if (v === who) cnt++;
      else if (v === -1 && !used) { const r2 = rr + dr * s, c2 = cc + dc * s; if (r2 >= 0 && r2 < N && c2 >= 0 && c2 < N && b[r2 * N + c2] === who) { used = true; gap++; } else { open++; break; } }
      else { if (v === -1) open++; break; }
      rr += dr * s; cc += dc * s;
    }
  }
  if (cnt >= 5 && !gap) return 1e6;
  if (cnt >= 5) return 6e4;
  if (cnt === 4) return open === 2 && !gap ? 1e5 : open >= 1 ? 9e3 : 200;
  if (cnt === 3) return open === 2 ? (gap ? 3500 : 6e3) : open === 1 ? 500 : 50;
  if (cnt === 2) return open === 2 ? 400 : open === 1 ? 60 : 10;
  return open === 2 ? 30 : 5;
}
function oBot(S, P) {
  if (!S || S.winner) return false;
  const me = S.turn; if (!P[me] || !P[me].bot) return false;
  const b = S.b, op = 1 - me;
  if (S.mv === 0) { G.omok.act(S, me, 'place', {i: 7 * N + 7}, P); return true; }
  let best = -1, bs = -1;
  for (let i = 0; i < N * N; i++) {
    if (b[i] !== -1) continue;
    const r = Math.floor(i / N), c = i % N; let near = false;
    for (let dr = -2; dr <= 2 && !near; dr++) for (let dc = -2; dc <= 2; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr * N + cc] !== -1) { near = true; break; } }
    if (!near) continue;
    let atk = 0, def = 0;
    for (const [dr, dc] of DIRS) { atk += evalDir(b, i, me, dr, dc); def += evalDir(b, i, op, dr, dc); }
    const sc = atk * 1.12 + def + Math.random() * 8 - Math.abs(r - 7) - Math.abs(c - 7);
    if (sc > bs) { bs = sc; best = i; }
  }
  if (best < 0) best = b.indexOf(-1);
  G.omok.act(S, me, 'place', {i: best}, P);
  return true;
}
G.omok.botStep = oBot;
G.omok.BOTNAMES = ['바둑이', '흑기사', '백호', '돌멩이'];
})();
