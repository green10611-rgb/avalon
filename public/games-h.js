(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;
const isDOM = typeof document !== 'undefined';

/* =================== 할리갈리 =================== */
/* 과일 카드 56장(4종 × 14장: 1개 5장·2개 3장·3개 3장·4개 2장·5개 1장)을 똑같이 나눠 엎어 둬요.
   차례대로 맨 위 카드를 뒤집어 내 앞에 펼쳐요. 펼쳐진 맨 위 카드들에 같은 과일이 '정확히 5개'면 먼저 종을 친 사람이 펼쳐진 카드를 모두 가져가요.
   잘못 치면 다른 사람 모두에게 카드를 1장씩 줘요. 카드가 다 떨어지면 탈락, 마지막까지 남은 사람이 승리! */
const FN = ['딸기', '바나나', '라임', '포도'];
const FIMG = ['strawberry', 'banana', 'lime', 'plum'];
const FC = [['#FFE3E6', '#E5484D'], ['#FFF6CC', '#E3A92F'], ['#E6F7D9', '#3E9E3A'], ['#EFE3FB', '#7A3E9D']];
const fOf = c => Math.floor(c / 5), kOf = c => c % 5 + 1;
const POS = {1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[26, 26], [50, 50], [74, 74]], 4: [[30, 28], [70, 28], [30, 72], [70, 72]], 5: [[28, 26], [72, 26], [50, 50], [28, 74], [72, 74]]};
function hcard(c, cls = '', sty = '') {
  const f = fOf(c), k = kOf(c);
  return `<span class="hgc ${cls}" style="--c1:${FC[f][0]};--c2:${FC[f][1]}${sty}" aria-label="${FN[f]} ${k}개">${POS[k].map(([x, y]) => `<span class="hgf" style="left:${x}%;top:${y}%">${U.img(FIMG[f])}</span>`).join('')}<b class="hgc-n">${k}</b></span>`;
}
// 남은 장수는 숫자 대신 더미 두께로만 보여요
const hthick = n => { const k = Math.max(1, Math.min(16, Math.ceil(n / 3))), sh = []; for (let j = 1; j <= k; j++) sh.push(`0 ${j * 1.6}px 0 0 ${j % 2 ? '#FFF6E8' : '#B8262E'}`); sh.push(`0 ${k * 1.6 + 6}px 14px rgba(60,20,0,.32)`); return `box-shadow:${sh.join(',')};transform:translateY(${-k * .8}px)`; };
const hback = (cls = '', n = 0) => `<span class="hgc back ${cls}"${n ? ` style="${hthick(n)}"` : ''}><span class="hgb-in">${U.img('bell')}</span></span>`;
const ids = P => P.map((_, i) => i);
const pn = (P, i) => U.nm(P, i);
function visible(S) { const t = [0, 0, 0, 0]; S.pile.forEach(p => { if (p.length) { const c = p[p.length - 1]; t[fOf(c)] += kOf(c); } }); return t; }
const isFive = S => visible(S).includes(5);
const alive = (S, P) => ids(P).filter(i => !S.out[i]);
function nextTurn(S, P, from) {
  const n = P.length;
  for (let k = 1; k <= n; k++) { const j = (from + k) % n; if (!S.out[j]) return j; }
  return from;
}
function checkEnd(S, P) {
  ids(P).forEach(i => { if (!S.out[i] && !S.deck[i].length) { S.out[i] = true; U.log(S, `${P[i].name}님은 카드가 다 떨어져 탈락!`); } });
  const a = alive(S, P);
  if (a.length <= 1) {
    const w = a.length ? a[0] : ids(P).sort((x, y) => S.deck[y].length - S.deck[x].length)[0];
    S.win = w; S.phase = 'end'; S.winner = `${P[w].name}님 승리! 🔔`; U.log(S, S.winner);
    return true;
  }
  if (S.out[S.turn]) S.turn = nextTurn(S, P, S.turn);
  return false;
}
function hFresh(S, key, dur) {
  if (!isDOM) return -1;
  const W = window; if (!W.__hfx || !W.__hfx[S._g]) return -1;
  W.__hT = W.__hT || {}; const k = S._g + key, now = Date.now();
  if (!W.__hT[k]) W.__hT[k] = now;
  const el = (now - W.__hT[k]) / 1000; return el < dur ? el : -1;
}

G.halli = {
  name: '할리갈리', tag: '같은 과일이 딱 5개면 종을 땡!', min: 2, max: 6, mark: '🔔', hue: '#E3A92F',
  rules: ['과일 카드 56장을 똑같이 나눠, 보지 않고 엎어 둬요.',
    '차례대로 맨 위 카드를 뒤집어 내 앞에 펼쳐요(이전 카드 위에 덮어요).',
    '모두의 펼쳐진 맨 위 카드에 같은 과일이 정확히 5개면 → 먼저 종을 친 사람이 펼쳐진 카드를 모두 가져가요.',
    '5개가 아닌데 종을 치면 → 다른 사람 모두에게 카드를 1장씩 줘요.',
    '카드가 다 떨어지면 탈락. 마지막까지 남은 사람이 승리! (스페이스바로도 종을 칠 수 있어요)'],
  rulesExtra() { return `<section class="hg-legend">${[0, 1, 2, 3].map(f => hcard(f * 5 + 4, 'sm')).join('')}</section>`; },
  setup(P) {
    const n = P.length; if (n < 2 || n > 6) throw U.err('2~6명이 필요해요.');
    const all = [];
    for (let f = 0; f < 4; f++) [[1, 5], [2, 3], [3, 3], [4, 2], [5, 1]].forEach(([k, m]) => { for (let j = 0; j < m; j++) all.push(f * 5 + k - 1); });
    const d = U.shuffle(all), deck = P.map(() => []);
    d.forEach((c, k) => deck[k % n].push(c));
    return {_g: Math.random().toString(36).slice(2, 9), deck, pile: P.map(() => []), out: P.map(() => false), turn: 0, phase: 'play', n: 0, last: null, log: ['할리갈리 시작! 차례대로 카드를 뒤집어요.']};
  },
  turns(S, P) { return S.winner ? [] : [S.turn]; },
  allTurn(S) { return S.winner ? '' : '🔔 과일 5개면 누구든 종!'; },
  act(S, me, t, a, P) {
    if (S.winner) return;
    a = a || {};
    if (t === 'flip') {
      if (me !== S.turn) throw U.err('내 차례가 아니에요.');
      if (!S.deck[me].length) throw U.err('뒤집을 카드가 없어요.');
      const c = S.deck[me].shift(); S.pile[me].push(c); S.n++;
      S.last = {k: 'flip', p: me, c, n: S.n};
      S.turn = nextTurn(S, P, me);
      checkEnd(S, P);
      return;
    }
    if (t === 'ring') {
      // 한 폰으로 할 때는 이름표로 누가 쳤는지 골라요 (로컬 참가자만)
      let who = me;
      if (a.as != null && P[+a.as] && String(P[+a.as].id || '').startsWith('L')) who = +a.as;
      if (S.out[who]) throw U.err('탈락해서 종을 칠 수 없어요.');
      if (a.n != null && +a.n !== S.n) throw U.err('아쉽게 한발 늦었어요!');
      // 올바르게 친 직후 1초는 종이 잠겨요 (실수로 한 번 더 치는 것 방지)
      if (S.lock && Date.now() < S.lock) throw U.err('🔔 방금 종이 울렸어요! 잠깐만요');
      S.n++;
      if (isFive(S)) {
        const won = [].concat(...S.pile); S.pile = P.map(() => []);
        S.deck[who] = S.deck[who].concat(U.shuffle(won));
        S.last = {k: 'win', p: who, got: won.length, n: S.n};
        S.turn = who; S.lock = Date.now() + 1000;
        U.log(S, `🔔 ${P[who].name}님이 먼저 쳤어요! 카드 ${won.length}장 획득`);
      } else {
        const to = alive(S, P).filter(i => i !== who), gave = [];
        for (const i of to) { if (!S.deck[who].length) break; S.deck[i].push(S.deck[who].shift()); gave.push(i); }
        S.last = {k: 'miss', p: who, gave, n: S.n};
        U.log(S, `❌ ${P[who].name}님이 잘못 쳤어요! ${gave.length}명에게 1장씩`);
      }
      checkEnd(S, P);
      return;
    }
    throw U.err('알 수 없는 행동이에요.');
  },
  view(S, me, ui, P) {
    if (isDOM) setTimeout(() => hFx(S, me, P), 0);
    return `<div class="hgbox"><div class="hgw">${hBody(S, me, ui || {}, P)}</div></div>`;
  },
  splash: true
};

function hSeat(S, i, me, P, big) {
  const pile = S.pile[i], top = pile.length ? pile[pile.length - 1] : null, L = S.last;
  const fl = L && L.k === 'flip' && L.p === i ? hFresh(S, 'f' + L.n, .7) : -1;
  const mine = i === me, myTurn = S.turn === i && !S.winner;
  return `<div class="hg-seat${big ? ' me' : ''}${myTurn ? ' on' : ''}${S.out[i] ? ' out' : ''}" data-hs="${i}" style="--pc:${U.pc(i)}">
<div class="hg-sh"><span class="pdot"></span><b>${pn(P, i)}${mine ? ' (나)' : ''}</b>${S.out[i] ? '<span class="hg-tag out">탈락</span>' : myTurn ? '<span class="hg-tag">차례</span>' : ''}</div>
<div class="hg-cards"><div class="hg-deck" data-hd="${i}" aria-label="남은 카드 더미">${S.deck[i].length ? hback('', S.deck[i].length) : '<span class="hgc empty"></span>'}</div>
<div class="hg-pile" data-hp="${i}">${pile.length > 1 ? `<span class="hg-under">${hcard(pile[pile.length - 2])}</span>` : ''}${top != null ? hcard(top, fl >= 0 ? 'flip' : '', fl >= 0 ? `;--el:${fl.toFixed(2)}s` : '') : '<span class="hgc empty"><small>펼친 카드</small></span>'}</div></div></div>`;
}
function hBody(S, me, ui, P) {
  const L = S.last;
  let h = '';
  if (S.winner) h += `<section class="hg-end"${hFresh(S, 'end', 4) < 0 ? ' data-still' : ''}><div class="hg-end-f">${FIMG.map(f => U.img(f, 'big')).join('')}</div><small>게임 끝</small><b>${U.esc(S.winner)}</b><p>카드 ${S.deck[S.win].length}장을 지켜냈어요</p></section>`;
  else h += `<header class="hg-strip${S.turn === me ? ' me' : ''}" style="--pc:${U.pc(S.turn)}"><span class="hg-ic">${U.img('bell')}</span><div><b>${pn(P, S.turn)}${S.turn === me ? ' (나)' : ''} 차례 · 카드 뒤집기</b><small>같은 과일이 <b>정확히 5개</b>면 누구든 종을 쳐요!</small></div></header>`;
  const all = ids(P), at = all.indexOf(me), others = at < 0 ? all : all.slice(at + 1).concat(all.slice(0, at)).filter(i => i !== me);
  // 내 자리(아래)에서 시계 방향: 왼쪽 → 위 → 오른쪽, 종은 한가운데
  const no = others.length, side = no >= 2, L0 = side ? [others[0]] : [], R0 = side ? [others[no - 1]] : [], T0 = side ? others.slice(1, no - 1) : others;
  const seats = (arr, cls) => arr.length ? `<section class="hg-opps ${cls} n${arr.length}">${arr.map(i => hSeat(S, i, me, P, false)).join('')}</section>` : '';
  h += `<div class="hg-table${side ? ' side' : ''}${T0.length ? ' top' : ''}">${seats(T0, 'hg-top')}${seats(L0, 'hg-l')}${seats(R0, 'hg-r')}`;
  // 가운데 종
  const res = L && (L.k === 'win' || L.k === 'miss') ? hFresh(S, 'r' + L.n, 2.2) : -1;
  const lockEl = L && L.k === 'win' ? hFresh(S, 'lk' + L.n, 1) : -1;
  const canRing = !S.winner && (ui._local ? true : me >= 0 && !S.out[me]);
  let msg = '';
  if (res >= 0) msg = L.k === 'win' ? `<div class="hg-msg ok" style="--el:${res.toFixed(2)}s">🔔 딩동! <b>${pn(P, L.p)}</b>님이 ${L.got}장 획득!</div>` : `<div class="hg-msg no" style="--el:${res.toFixed(2)}s">❌ 땡! <b>${pn(P, L.p)}</b>님 잘못 쳤어요 · 1장씩 벌금</div>`;
  h += `<section class="hg-mid"><div class="hg-bellwrap">${canRing && !ui._local ? `<button type="button" class="hg-bell${lockEl >= 0 ? ' locked' : ''}" ${lockEl >= 0 ? `style="--el:${lockEl.toFixed(2)}s" ` : ''}data-act="ring" data-arg="${U.attr({n: S.n})}" aria-label="종 치기">${U.img('bell', 'bell')}<span>땡!</span></button>` : `<div class="hg-bell still">${U.img('bell', 'bell')}</div>`}</div>${msg}
${ui._local && !S.winner ? `<div class="hg-lring"><small>한 폰으로 할 때: 내 이름 종을 눌러요</small><div>${alive(S, P).filter(i => !P[i].bot).map(i => U.btn(`🔔 ${pn(P, i)}`, 'ring', {n: S.n, as: i}, 'hg-lb' + (lockEl >= 0 ? ' locked' : '')).replace('<button ', lockEl >= 0 ? `<button style="--el:${lockEl.toFixed(2)}s" ` : '<button ')).join('')}</div></div>` : ''}</section>`;
  if (me >= 0) h += `<section class="hg-mine">${hSeat(S, me, me, P, true)}${!S.winner && S.turn === me && S.deck[me].length ? U.btn('🂠 카드 뒤집기', 'flip', {}, 'primary big hg-flip') : !S.winner && !S.out[me] ? `<div class="hg-wait">${pn(P, S.turn)}님이 뒤집을 차례 · 눈은 과일에!</div>` : ''}</section>`;
  h += '</div>';
  return h;
}

/* ---------- 움직임 ---------- */
function hFx(S, me, P) {
  const W = window; W.__hfx = W.__hfx || {};
  const cur = {n: S.n, end: !!S.winner};
  const rec = W.__hfx[S._g]; W.__hfx[S._g] = cur;
  if (!W.__hgKey) { W.__hgKey = 1; document.addEventListener('keydown', e => { if (e.code === 'Space' && !/INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) { const b = document.querySelector('.hg-bell[data-act]'); if (b) { e.preventDefault(); b.click(); } } }); }
  if (!rec || !document.querySelector('.hgw')) return;
  if (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = q => document.querySelector(q), L = S.last;
  if (cur.n === rec.n || !L) { if (cur.end && !rec.end) rain(); return; }
  if (L.k === 'flip') fly(hback(), $(`[data-hd="${L.p}"]`), $(`[data-hp="${L.p}"]`), {w: 70, h: 98, dur: 380, lift: -30});
  if (L.k === 'win' || L.k === 'miss') {
    const bell = $('.hg-bell'); if (bell && bell.animate) bell.animate([{transform: 'rotate(0)'}, {transform: 'rotate(-14deg) scale(1.1)'}, {transform: 'rotate(12deg) scale(1.1)'}, {transform: 'rotate(-8deg)'}, {transform: 'rotate(0)'}], {duration: 600});
    waves($('.hg-bellwrap'), L.k === 'win' ? '#F5C542' : '#E5484D');
    if (L.k === 'win') {
      const dst = $(`[data-hd="${L.p}"]`);
      document.querySelectorAll('[data-hp]').forEach((p, k) => fly(hback(), p, dst, {w: 62, h: 87, dur: 700, delay: 200 + k * 90, lift: -70, rot: 20}));
      banner('🔔 딩동!', `${U.nm(P, L.p)}님이 카드 ${L.got}장을 가져가요`, 'g');
    } else {
      L.gave.forEach((i, k) => fly(hback(), $(`[data-hd="${L.p}"]`), $(`[data-hd="${i}"]`), {w: 56, h: 78, dur: 650, delay: 150 + k * 110, lift: -50, rot: -15}));
      banner('❌ 땡! 잘못 쳤어요', `${U.nm(P, L.p)}님이 1장씩 나눠줘요`, 'r');
    }
  }
  if (cur.end && !rec.end) setTimeout(rain, 900);
  function fly(html, src, dst, o) {
    if (!src || !dst) return;
    const a = src.getBoundingClientRect(), b = dst.getBoundingClientRect(); if (!a.width || !b.width) return;
    const el = document.createElement('div'); el.className = 'hgfx-fly'; el.innerHTML = html;
    el.style.cssText = `left:${a.left + a.width / 2 - o.w / 2}px;top:${a.top + a.height / 2 - o.h / 2}px;width:${o.w}px;height:${o.h}px`;
    document.body.appendChild(el);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    el.animate([{transform: 'translate(0,0) scale(.9)', opacity: .2}, {transform: `translate(${dx / 2}px,${dy / 2 + (o.lift || -40)}px) scale(1.12) rotate(${o.rot || 0}deg)`, opacity: 1, offset: .5}, {transform: `translate(${dx}px,${dy}px) scale(.95)`, opacity: .3}],
      {duration: o.dur || 600, delay: o.delay || 0, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both'}).onfinish = () => el.remove();
  }
  function waves(src, col) {
    if (!src) return; const r = src.getBoundingClientRect();
    for (let k = 0; k < 3; k++) {
      const el = document.createElement('div'); el.className = 'hgfx-wave';
      el.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;border-color:${col}`;
      document.body.appendChild(el);
      el.animate([{transform: 'translate(-50%,-50%) scale(.4)', opacity: .9}, {transform: 'translate(-50%,-50%) scale(2.6)', opacity: 0}], {duration: 900, delay: k * 180, easing: 'ease-out', fill: 'both'}).onfinish = () => el.remove();
    }
  }
  function banner(big, small, kind) {
    document.querySelectorAll('.hgfx-banner').forEach(e => e.remove());
    const el = document.createElement('div'); el.className = 'hgfx-banner ' + kind;
    el.innerHTML = `<b>${U.esc(big)}</b><small>${U.esc(small)}</small>`;
    const wr = $('.hgw') && $('.hgw').getBoundingClientRect(); if (wr && wr.width) el.style.left = (wr.left + wr.width / 2) + 'px';
    document.body.appendChild(el);
    el.animate([{transform: 'translate(-50%,-50%) scale(.5)', opacity: 0}, {transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1, offset: .15}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .7}, {transform: 'translate(-50%,-58%) scale(.95)', opacity: 0}], {duration: 1400, easing: 'ease-out', fill: 'both'}).onfinish = () => el.remove();
  }
  function rain() {
    for (let k = 0; k < 40; k++) {
      const el = document.createElement('div'); el.className = 'hgfx-rain'; el.innerHTML = U.img(FIMG[k % 4]); const s = 26 + Math.random() * 30;
      el.style.cssText = `left:${Math.random() * 100}vw;width:${s}px;height:${s}px`; document.body.appendChild(el);
      el.animate([{transform: 'translateY(-60px) rotate(0)'}, {transform: `translateY(${innerHeight + 80}px) rotate(${(Math.random() - .5) * 720}deg)`}], {duration: 2400 + Math.random() * 1800, delay: Math.random() * 1400, easing: 'cubic-bezier(.3,.1,.7,1)', fill: 'both'}).onfinish = () => el.remove();
    }
  }
}

/* ---------- AI ---------- */
function hBot(S, P) {
  if (!S || S.winner) return false;
  const run = (i, t, a) => { try { G.halli.act(S, i, t, a, P); return true; } catch (e) { return false; } };
  const bots = ids(P).filter(i => P[i].bot && !S.out[i]);
  // 사람에게도 기회를 주려고 가끔은 한 박자 늦게(놓치기도 해요)
  if (isFive(S) && !(S.lock && Date.now() < S.lock) && bots.length && Math.random() < 0.7) return run(bots[U.rint(bots.length)], 'ring', {n: S.n});
  if (P[S.turn] && P[S.turn].bot) return run(S.turn, 'flip', {});
  return false;
}
G.halli.botStep = hBot;
G.halli.BOTNAMES = ['딸기맨', '바나나', '라임', '포도알', '과일가게', '종지기'];
G.halli.art = (k, x) => k === 'card' ? hcard(x, 'big') : k === 'back' ? hback('big') : '';
})();
