(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;
const isDOM = typeof document !== 'undefined';

/* =================== 바퀴벌레 포커 =================== */
/* 8종 벌레 카드 64장을 모두 나눠 가져요. 내 차례에는 카드 한 장을 엎어서 다른 사람에게 주며 "○○!"라고 말해요(거짓말 OK).
   받은 사람은 ① "진실!/거짓!"을 맞히거나 ② 몰래 보고 아직 안 본 사람에게 다시 넘겨요.
   맞히면 건넨 사람이, 틀리면 받은 사람이 그 카드를 앞에 펼쳐 놓아요. 같은 벌레 4장이 앞에 쌓이거나, 내 차례에 손에 카드가 없으면 패배! */
const RK = ['roach', 'bat', 'fly', 'toad', 'rat', 'scorp', 'spider', 'stink'];
const RN = ['바퀴벌레', '박쥐', '파리', '두꺼비', '쥐', '전갈', '거미', '노린재'];
const RIMG = ['rk_roach', 'rk_bat', 'rk_fly', 'rk_toad', 'rk_rat', 'rk_scorp', 'rk_spider', 'rk_stink'];
const RC = [['#B9814A', '#6B3F17'], ['#9C7BE0', '#3E2A7A'], ['#5CC8C0', '#17636B'], ['#7DCB5A', '#2E6B1E'], ['#A9B2C3', '#4B5468'], ['#F3A04A', '#8A4A10'], ['#6B6F86', '#1E2030'], ['#B8C64A', '#5A6418']];
const pic = (t, cls = '') => U.img(RIMG[t], cls, RN[t]);
const rcard = (t, cls = '') => `<span class="rkc rk-${RK[t]} ${cls}" style="--c1:${RC[t][0]};--c2:${RC[t][1]}"><span class="rkc-in">${pic(t, 'rkc-pic')}<b>${RN[t]}</b></span></span>`;
const rback = (cls = '') => `<span class="rkc rk-back ${cls}"><span class="rkc-in">${U.img('rk_roach', 'rkc-bk')}<i>?</i></span></span>`;
const pn = (P, i) => U.nm(P, i);
const ids = P => P.map((_, i) => i);
function rFresh(S, key, dur) {
  if (!isDOM) return -1;
  const W = window; if (!W.__rfx || !W.__rfx[S._g]) return -1;
  W.__rT = W.__rT || {}; const k = S._g + key, now = Date.now();
  if (!W.__rT[k]) W.__rT[k] = now;
  const el = (now - W.__rT[k]) / 1000; return el < dur ? el : -1;
}
const anim = el => el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s"`;

function lose(S, P, i, why) {
  S.loser = i; S.phase = 'end';
  S.winner = `${P[i].name}님이 ${why} 패배! 나머지 모두 승리 🎉`;
  U.log(S, S.winner);
}

G.cockroach = {
  name: '바퀴벌레 포커', tag: '벌레 카드를 떠넘기는 뻔뻔한 거짓말 게임', min: 2, max: 6, mark: '🪳', hue: '#8B5A2B',
  rules: ['벌레 8종 × 8장, 모두 64장을 똑같이 나눠 가져요. 손에 든 카드는 나만 봐요.',
    '내 차례: 카드 한 장을 골라 엎은 채로 다른 사람에게 주면서 "○○!"라고 말해요. 거짓말해도 돼요!',
    '받은 사람은 둘 중 하나: ① 받아들이고 "진실!" 또는 "거짓!"이라고 대답해요. ② 몰래 보고, 아직 이 카드를 안 본 사람에게 다시 넘기며 새로 말해요.',
    '①에서 맞히면 카드를 건넨 사람이, 틀리면 받은 사람이 그 카드를 자기 앞에 펼쳐 놓아요. 카드를 떠안은 사람이 다음 차례예요.',
    '모두가 이미 본 카드라 넘길 사람이 없으면 무조건 ①로 맞혀야 해요.',
    '내 앞에 같은 벌레가 4장 모이거나, 내 차례인데 손에 카드가 없으면 패배! 나머지 모두가 이겨요.'],
  rulesExtra() { return `<section class="rk-legend">${RK.map((_, t) => rcard(t, 'sm')).join('')}</section>`; },
  setup(P) {
    const n = P.length; if (n < 2 || n > 6) throw U.err('2~6명이 필요해요.');
    const deck = U.shuffle([].concat(...RK.map((_, t) => Array(8).fill(t))));
    // 2명은 손에 너무 많아서 한 사람당 최대 21장만 (나머지는 상자에)
    const per = n === 2 ? 21 : Math.floor(64 / n);
    const hand = P.map((_, i) => deck.slice(i * per, (i + 1) * per).sort((a, b) => a - b));
    return {_g: Math.random().toString(36).slice(2, 9), hand, pile: P.map(() => Array(8).fill(0)), turn: U.rint(n), phase: 'give', cur: null, last: null, n: 0, log: ['바퀴벌레 포커 시작! 카드를 골라 떠넘기세요.']};
  },
  turns(S) { if (S.winner) return []; return S.phase === 'give' ? [S.turn] : S.phase === 'resp' ? [S.cur.to] : []; },
  act(S, me, t, a, P) {
    if (S.winner) return;
    const n = P.length; a = a || {};
    const okClaim = c => Number.isInteger(c) && c >= 0 && c < 8;
    if (t === 'give') {
      if (S.phase !== 'give' || me !== S.turn) throw U.err('내 차례가 아니에요.');
      const c = +a.c, to = +a.to, claim = +a.claim;
      if (!S.hand[me].includes(c)) throw U.err('그 카드가 없어요.');
      if (!(to >= 0 && to < n) || to === me) throw U.err('받을 사람을 골라 주세요.');
      if (!okClaim(claim)) throw U.err('무슨 벌레라고 할지 골라 주세요.');
      S.hand[me].splice(S.hand[me].indexOf(c), 1);
      S.cur = {c, from: me, to, claim, seen: [me], hops: [{from: me, to, claim}]};
      S.phase = 'resp'; S.n++;
      U.log(S, `${P[me].name} → ${P[to].name}: "${RN[claim]}!"`);
      return;
    }
    if (S.phase !== 'resp' || !S.cur || me !== S.cur.to) throw U.err('지금은 내가 받을 차례가 아니에요.');
    const cur = S.cur;
    if (t === 'pass') {
      const to = +a.to, claim = +a.claim;
      if (!(to >= 0 && to < n) || to === me || cur.seen.includes(to)) throw U.err('아직 이 카드를 안 본 사람에게만 넘길 수 있어요.');
      if (!okClaim(claim)) throw U.err('무슨 벌레라고 할지 골라 주세요.');
      cur.seen.push(me); cur.from = me; cur.to = to; cur.claim = claim; cur.hops.push({from: me, to, claim});
      S.n++;
      U.log(S, `${P[me].name}님이 몰래 보고 → ${P[to].name}: "${RN[claim]}!"`);
      return;
    }
    if (t === 'call') {
      const guess = !!a.truth, truth = cur.c === cur.claim, right = guess === truth;
      const loser = right ? cur.from : me;
      S.pile[loser][cur.c]++;
      S.last = {c: cur.c, claim: cur.claim, from: cur.from, by: me, guess, truth, right, loser, n: S.n + 1, hops: cur.hops.length};
      S.n++;
      U.log(S, `${P[me].name}님이 "${guess ? '진실' : '거짓'}"이라고 대답했습니다 → 실제는 ${RN[cur.c]}. ${right ? '정답입니다' : '틀렸습니다'}! ${P[loser].name}님이 가져가요.`);
      S.cur = null; S.phase = 'give'; S.turn = loser;
      if (S.pile[loser][S.last.c] >= 4) return lose(S, P, loser, `${RN[S.last.c]} 4장이 모여서`);
      if (!S.hand[loser].length) return lose(S, P, loser, '손에 카드가 없어서');
      return;
    }
    throw U.err('알 수 없는 행동이에요.');
  },
  view(S, me, ui, P) {
    if (isDOM) setTimeout(() => rFx(S, me, P), 0);
    return `<div class="rkbox"><div class="rkw">${rBody(S, me, ui || {}, P)}</div></div>`;
  },
  uiAct(ui, S, me, name, val) {
    if (name === 'rc') { ui.rc = ui.rc === val ? null : val; return; }
    if (name === 'rto') { ui.rto = val; return; }
    if (name === 'rcl') { ui.rcl = ui.rcl === val ? null : val; return; }
    if (name === 'rpeek') { ui.rpeek = true; ui.rto = null; ui.rcl = null; return; }
  },
  splash: true
};

function rBody(S, me, ui, P) {
  const n = P.length, end = !!S.winner, cur = S.cur;
  let h = '';
  // 위: 진행 띠
  const act = end ? -1 : S.phase === 'give' ? S.turn : cur.to;
  const mine = act === me;
  if (end) h += rEnd(S, me, P);
  else h += `<header class="rk-strip${mine ? ' me' : ''}" style="--pc:${U.pc(act)}"><span class="rk-av">${pic(0, 'big')}</span><div><b>${pn(P, act)}${mine ? ' (나)' : ''} ${S.phase === 'give' ? '차례' : '— 받을지 넘길지 고르는 중'}</b><small>${S.phase === 'give' ? (mine ? '떠넘길 카드와 받을 사람, 그리고 할 말을 고르세요' : '누구에게 무슨 카드를 떠넘길까…') : (mine ? '"진실"인지 "거짓"인지 대답하거나, 몰래 보고 넘겨요' : `${pn(P, cur.from)}님이 "${RN[cur.claim]}"라고 했어요`)}</small></div><span class="rk-goal">☠ 같은 벌레 4장이면 패배</span></header>`;
  // 가운데: 사람들 자리 (앞에 깔린 벌레)
  const L = S.last, popL = L ? rFresh(S, 'pl' + L.n, 1.6) : -1;
  h += `<section class="rk-seats n${n}">${ids(P).map(i => {
    const pile = S.pile[i], danger = pile.some(v => v >= 3), isAct = i === act;
    const inChain = cur && (cur.seen.includes(i) || cur.to === i);
    return `<div class="rk-seat${isAct ? ' act' : ''}${i === me ? ' me' : ''}${danger ? ' danger' : ''}${end && S.loser === i ? ' lost' : ''}" data-rs="${i}" style="--pc:${U.pc(i)}">
<div class="rk-sh"><span class="pdot"></span><b>${pn(P, i)}${i === me ? ' (나)' : ''}</b><span class="rk-hand" title="손에 든 카드">🂠 ${S.hand[i].length}</span>${cur && cur.to === i ? '<span class="rk-tag recv">받는 중</span>' : cur && cur.from === i ? '<span class="rk-tag give">건넨 사람</span>' : inChain ? '<span class="rk-tag seen">봤음</span>' : ''}</div>
<div class="rk-pile">${pile.map((v, t) => v ? `<span class="rk-pc${v >= 3 ? ' hot' : ''}${L && L.loser === i && L.c === t && popL >= 0 ? ' new' : ''}" style="--c1:${RC[t][0]};--c2:${RC[t][1]}" title="${RN[t]} ${v}장">${pic(t)}<em>${v}</em></span>` : '').join('') || '<span class="rk-none">아직 깔린 벌레가 없어요</span>'}</div></div>`;
  }).join('')}</section>`;
  // 무대: 오가는 카드
  const give = me >= 0 && !end && S.phase === 'give' && S.turn === me;
  h += `<div class="rk-lcol">${rStage(S, me, ui, P)}${give ? rGive(S, me, ui, P) : ''}</div>`;
  // 내 손
  if (me >= 0 && !end) h += rHand(S, me, ui, P);
  return h;
}

const jo = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c < 11172 && c % 28 ? '이었어요' : '였어요'; };
function rStage(S, me, ui, P) {
  const cur = S.cur, L = S.last;
  if (S.winner) return '';
  if (S.phase === 'resp' && cur) {
    const el = rFresh(S, 'hop' + S.n, 1.2), iAmTo = cur.to === me, iSaw = cur.seen.includes(me);
    const chain = cur.hops.map((hp, k) => `<span class="rk-hop"><b style="--pc:${U.pc(hp.from)}">${pn(P, hp.from)}</b><i>→</i><b style="--pc:${U.pc(hp.to)}">${pn(P, hp.to)}</b><em>"${RN[hp.claim]}"</em></span>`).join('');
    let ctrl = '';
    if (iAmTo) {
      const others = ids(P).filter(i => i !== me && !cur.seen.includes(i));
      if (!ui.rpeek) {
        ctrl = `<div class="rk-call">${U.btn(`<b>진실!</b><small>정말 ${RN[cur.claim]}일 거야</small>`, 'call', {truth: true}, 'rk-t')}${U.btn(`<b>거짓!</b><small>${RN[cur.claim]} 아닐걸?</small>`, 'call', {truth: false}, 'rk-f')}</div>
${others.length ? U.gb(`👀 몰래 보고 다른 사람에게 넘기기 <small>(${others.length}명에게 넘길 수 있어요)</small>`, 'rpeek', 1, 'rk-peek') : '<p class="rk-note">모두 이미 본 카드라 넘길 수 없어요. 맞혀야 해요!</p>'}`;
      } else {
        if (others.length === 1 && ui.rto == null) ui.rto = others[0];   // 넘길 사람이 한 명뿐이면 자동으로
        ctrl = `<div class="rk-peeked"><div class="rk-real">${rcard(cur.c, 'big flipin')}<small>몰래 본 진짜 카드</small></div><div class="rk-pass">${rPick(P, others, ui, 'rto', '누구에게 넘길까요?')}${rClaim(ui)}${U.btn(ui.rto != null && ui.rcl != null ? `${pn(P, ui.rto)}님에게 "${RN[ui.rcl]}"라고 넘기기` : '받을 사람과 할 말을 고르세요', 'pass', {to: ui.rto, claim: ui.rcl}, 'primary big rk-go', ui.rto == null || ui.rcl == null)}</div></div>`;
      }
    }
    return `<section class="rk-stage resp"${anim(el)}><div class="rk-fly">${iSaw && !iAmTo ? rcard(cur.c, 'big') : rback('big wob')}<span class="rk-bubble" style="--pc:${U.pc(cur.from)}"><small>${pn(P, cur.from)}</small><b class="rk-cw">${RN[cur.claim]}</b>${pic(cur.claim, 'big')}</span></div>
<div class="rk-chain">${chain}</div>${ctrl}${!iAmTo ? `<p class="rk-note">${pn(P, cur.to)}님이 고르는 중… 표정을 살펴보세요 👀</p>` : ''}</section>`;
  }
  // 직전 결과
  if (L) {
    const el = rFresh(S, 'res' + L.n, 3);
    return `<section class="rk-stage res ${L.right ? 'ok' : 'no'}"${anim(el)}><div class="rk-flip"><i class="b">${rback('big')}</i><i class="f">${rcard(L.c, 'big')}</i></div><div class="rk-rtxt"><p class="rk-ans"><b>${pn(P, L.by)}</b>님이 <span class="rk-nw"><em class="${L.guess ? 't' : 'f'}">${L.guess ? '진실' : '거짓'}</em>이라고</span> 대답했습니다.</p><b class="rk-stamp">${L.right ? '정답입니다.' : '틀렸습니다.'}</b><span class="rk-real">사실은 <b>${RN[L.c]}</b>${jo(RN[L.c])}</span></div></section>`;
  }
  return `<section class="rk-stage idle"><div class="rk-fly">${rback('big wob')}</div><p class="rk-note">첫 카드를 기다리는 중… 누가 처음으로 벌레를 떠넘길까요?</p></section>`;
}
function rPick(P, list, ui, key, title) {
  return `<div class="rk-lbl">${title}</div><div class="rk-people">${list.map(i => U.gb(`<span class="pdot" style="--pc:${U.pc(i)}"></span>${pn(P, i)}`, key, i, 'rk-pp' + (ui[key] === i ? ' on' : ''))).join('')}</div>`;
}
function rClaim(ui) {
  return `<div class="rk-lbl">"○○!" 무엇이라고 말할까요? <small>거짓말해도 돼요</small></div><div class="rk-claims">${RK.map((_, t) => U.gb(`${pic(t)}<b>${RN[t]}</b>`, 'rcl', t, 'rk-cl' + (ui.rcl === t ? ' on' : ''))).join('')}</div>`;
}
function rGive(S, me, ui, P) {
    const others = ids(P).filter(i => i !== me);
    if (others.length === 1 && ui.rto == null) ui.rto = others[0];   // 둘이서 할 땐 상대가 자동으로 정해져요
    return `<section class="rk-give-w"><div class="rk-give">${rPick(P, others, ui, 'rto', '누구에게 떠넘길까요?')}${rClaim(ui)}${U.btn(ui.rc != null && ui.rto != null && ui.rcl != null ? `${RN[ui.rc]} 카드를 ${pn(P, ui.rto)}님에게 "${RN[ui.rcl]}"라고 주기${ui.rc === ui.rcl ? ' (진실)' : ' (거짓말)'}` : '카드 · 받을 사람 · 할 말을 고르세요', 'give', {c: ui.rc, to: ui.rto, claim: ui.rcl}, 'primary big rk-go', ui.rc == null || ui.rto == null || ui.rcl == null)}</div></section>`;
}
function rHand(S, me, ui, P) {
  const hand = S.hand[me], cnt = Array(8).fill(0); hand.forEach(c => cnt[c]++);
  const give = S.phase === 'give' && S.turn === me;
  let h = `<section class="rk-hand-w${give ? ' go' : ''}"><div class="rk-lbl">🂠 내 손 (${hand.length}장) <small>${give ? '떠넘길 카드를 고르세요' : '내 차례가 되면 골라요'}</small></div><div class="rk-fan">${cnt.map((v, t) => v ? U.gb(`${rcard(t)}<em>${v}</em>`, 'rc', t, 'rk-hc' + (ui.rc === t ? ' on' : ''), !give) : '').join('')}</div>`;

  return h + `</section>`;
}
function rEnd(S, me, P) {
  const el = rFresh(S, 'end', 4), lo = S.loser;
  return `<section class="rk-end"${anim(el)}><div class="rk-end-pics">${RK.map((_, t) => pic(t, 'big')).join('')}</div><small>게임 끝</small><b>${pn(P, lo)}님 패배!</b><p>${U.esc(S.winner)}</p><div class="rk-wins">${ids(P).filter(i => i !== lo).map(i => `<span><span class="pdot" style="--pc:${U.pc(i)}"></span>${pn(P, i)} 🎉</span>`).join('')}</div></section>`;
}

/* ---------- 움직임 ---------- */
function rFx(S, me, P) {
  const W = window; W.__rfx = W.__rfx || {};
  const cur = {n: S.n, end: !!S.winner};
  const rec = W.__rfx[S._g]; W.__rfx[S._g] = cur;
  if (!rec || !document.querySelector('.rkw')) return;
  if (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = q => document.querySelector(q), seat = i => $(`.rkw [data-rs="${i}"]`);
  if (cur.n !== rec.n) {
    if (S.phase === 'resp' && S.cur) {
      const hp = S.cur.hops[S.cur.hops.length - 1];
      fly(rback(), seat(hp.from), $('.rk-fly .rkc') || seat(hp.to), {w: 70, h: 98, dur: 750, lift: -80, rot: 18});
      setTimeout(() => pop($('.rk-bubble')), 650);
      if (S.cur.to === me && P[me] && !P[me].bot) banner('🪳 카드가 왔어요!', `${U.nm(P, hp.from)}님: "${RN[hp.claim]}!"`, 'b');
    } else if (S.last) {
      const L = S.last;
      setTimeout(() => {
        burst($('.rk-stamp'), L.right ? ['#3DDC84', '#FFE38A', '#FFFFFF'] : ['#E5484D', '#FFB0B8', '#7A0F1C'], 26);
        fly(rcard(L.c), $('.rk-flip') || $('.rk-stage'), seat(L.loser), {w: 64, h: 90, dur: 800, delay: 500, lift: -60, rot: -12, done: () => { shake(seat(L.loser)); }});
      }, 1100);
      if (!S.winner && S.pile[L.loser].some(v => v === 3)) setTimeout(() => banner('⚠ 위험!', `${U.nm(P, L.loser)}님 앞에 같은 벌레가 3장!`, 'r'), 2200);
    }
  }
  if (cur.end && !rec.end) setTimeout(() => confetti(), 2400);
  function pop(e) { if (e && e.animate) e.animate([{transform: 'scale(.4)', opacity: 0}, {transform: 'scale(1.15)', opacity: 1}, {transform: 'scale(1)'}], {duration: 450, easing: 'cubic-bezier(.3,1.6,.5,1)'}); }
  function shake(e) { if (e && e.animate) e.animate([{transform: 'none'}, {transform: 'translateX(-7px) rotate(-1.5deg)'}, {transform: 'translateX(7px) rotate(1.5deg)'}, {transform: 'none'}], {duration: 300, iterations: 2}); }
  function fly(html, src, dst, o) {
    if (!src || !dst) { if (o.done) o.done(); return; }
    const a = src.getBoundingClientRect(), b = dst.getBoundingClientRect(); if (!a.width || !b.width) return;
    const el = document.createElement('div'); el.className = 'rkfx-fly'; el.innerHTML = html;
    el.style.cssText = `left:${a.left + a.width / 2 - o.w / 2}px;top:${a.top + a.height / 2 - o.h / 2}px;width:${o.w}px;height:${o.h}px`;
    document.body.appendChild(el);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    el.animate([{transform: 'translate(0,0) scale(.6)', opacity: 0}, {transform: 'translate(0,-10px) scale(1.1)', opacity: 1, offset: .15},
      {transform: `translate(${dx / 2}px,${dy / 2 + (o.lift || -60)}px) scale(1.25) rotate(${(o.rot || 0)}deg)`, opacity: 1, offset: .55},
      {transform: `translate(${dx}px,${dy}px) scale(.9) rotate(0deg)`, opacity: .3}],
    {duration: o.dur || 800, delay: o.delay || 0, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both'}).onfinish = () => { el.remove(); if (o.done) o.done(); };
  }
  function banner(big, small, kind) {
    document.querySelectorAll('.rkfx-banner').forEach(e => e.remove());
    const el = document.createElement('div'); el.className = 'rkfx-banner ' + kind;
    el.innerHTML = `<b>${U.esc(big)}</b><small>${U.esc(small)}</small>`;
    const wr = $('.rkw') && $('.rkw').getBoundingClientRect(); if (wr && wr.width) el.style.left = (wr.left + wr.width / 2) + 'px';
    document.body.appendChild(el);
    el.animate([{transform: 'translate(-50%,-50%) scale(.5)', opacity: 0}, {transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1, offset: .15}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .7}, {transform: 'translate(-50%,-58%) scale(.95)', opacity: 0}], {duration: 1700, easing: 'ease-out', fill: 'both'}).onfinish = () => el.remove();
  }
  function burst(src, cols, n) {
    if (!src) return; const r = src.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let k = 0; k < n; k++) {
      const el = document.createElement('div'); el.className = 'rkfx-spark';
      const sz = 6 + Math.random() * 9; el.style.cssText = `left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;background:${cols[k % cols.length]}`;
      document.body.appendChild(el);
      const ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 130;
      el.animate([{transform: 'translate(-50%,-50%)', opacity: 1}, {transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px),calc(-50% + ${Math.sin(ang) * dist + 30}px)) scale(.3) rotate(${Math.random() * 600}deg)`, opacity: 0}], {duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'both'}).onfinish = () => el.remove();
    }
  }
  function confetti() {
    for (let k = 0; k < 40; k++) {
      const el = document.createElement('div'); el.className = 'rkfx-rain';
      el.innerHTML = U.img(RIMG[k % 8]); const s = 26 + Math.random() * 30;
      el.style.cssText = `left:${Math.random() * 100}vw;width:${s}px;height:${s}px`;
      document.body.appendChild(el);
      el.animate([{transform: 'translateY(-60px) rotate(0)', opacity: 1}, {transform: `translateY(${innerHeight + 80}px) rotate(${(Math.random() - .5) * 720}deg)`, opacity: .9}], {duration: 2400 + Math.random() * 1800, delay: Math.random() * 1400, easing: 'cubic-bezier(.3,.1,.7,1)', fill: 'both'}).onfinish = () => el.remove();
    }
  }
}

/* ---------- AI ---------- */
function rBot(S, P) {
  if (!S || S.winner) return false;
  const run = (i, t, a) => { try { G.cockroach.act(S, i, t, a, P); return true; } catch (e) { return false; } };
  const n = P.length;
  if (S.phase === 'give') {
    const me = S.turn; if (!P[me] || !P[me].bot) return false;
    const hand = S.hand[me]; if (!hand.length) return false;
    // 상대가 이미 많이 가진 벌레를 그 사람에게 떠넘기기
    let best = null, bs = -1;
    for (const to of ids(P).filter(i => i !== me)) for (const c of new Set(hand)) {
      const s = S.pile[to][c] * 2 + Math.random() * 1.5 - S.pile[me][c] * 0.3;
      if (s > bs) { bs = s; best = {to, c}; }
    }
    const lie = Math.random() < 0.55;
    let claim = best.c;
    if (lie) { const opts = RK.map((_, t) => t).filter(t => t !== best.c); claim = opts[U.rint(opts.length)]; }
    return run(me, 'give', {c: best.c, to: best.to, claim});
  }
  if (S.phase === 'resp' && S.cur) {
    const me = S.cur.to; if (!P[me] || !P[me].bot) return false;
    const cur = S.cur, cl = cur.claim;
    // 내가 아는 그 벌레 수(손 + 바닥)로 진짜일 확률 어림
    const known = S.hand[me].filter(c => c === cl).length + S.pile.reduce((s, p) => s + p[cl], 0);
    let pTrue = Math.max(0.05, (8 - known) / 8) * 0.55 + (Math.random() - .5) * 0.3;
    const risk = S.pile[me][cl] >= 2 || S.pile[me][cur.c] >= 2;
    const others = ids(P).filter(i => i !== me && !cur.seen.includes(i));
    if (others.length && (risk || Math.abs(pTrue - 0.5) < 0.15) && Math.random() < 0.6) {
      // 몰래 보고 넘기기: 받는 사람에게 위험한 벌레면 그 사람에게
      let to = others[0], bs = -1;
      for (const o of others) { const s = S.pile[o][cur.c] + Math.random(); if (s > bs) { bs = s; to = o; } }
      const claim = Math.random() < 0.5 ? cur.c : U.rint(8);
      return run(me, 'pass', {to, claim});
    }
    return run(me, 'call', {truth: pTrue >= 0.5});
  }
  return false;
}
G.cockroach.botStep = rBot;
// 정답 화면은 AI가 바로 넘기지 않고 2초쯤 더 보여 줘요
G.cockroach.botDelay = S => S && S.phase === 'give' && S.last && S.last.right && S.last.n === S.n ? 2000 : 0;
G.cockroach.BOTNAMES = ['꼬마벌레', '박쥐대장', '파리왕', '두꺼비', '생쥐', '전갈'];
G.cockroach.art = (k, x) => k === 'card' ? rcard(x, 'big') : k === 'back' ? rback('big') : '';
})();
