(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;

/* =================== 스플렌더 =================== */
/* 보석 토큰으로 개발 카드를 사서 할인(보너스)과 명예 점수를 모아요. 귀족은 보너스 조건을 채우면 찾아와요.
   누군가 15점에 닿으면 그 바퀴를 끝까지 하고, 점수가 가장 높은 사람이 이겨요. */
const C5 = ['w', 'u', 'g', 'r', 'k'];
const SN = {w: '다이아몬드', u: '사파이어', g: '에메랄드', r: '루비', k: '오닉스', y: '황금'};
const SS = {w: '흰색', u: '파랑', g: '초록', r: '빨강', k: '검정', y: '황금'};
// 카드 90장: [흰 파 초 빨 검 비용][점수][보너스]  (1단계 40 · 2단계 30 · 3단계 20)
const RAW = '030000w 000030u 000300g 300000r 003000k 000210w 100020u 210000g 021000r 002100k 020020w 002020u 020200g 200200r 202000k 011110w 101110u 110110g 111010r 111100k 310010w 013100u 131000g 100130r 001310k 022010w 102200u 010220g 201020r 220100k 012110w 101210u 110120g 211010r 121100k 004001w 000401u 000041g 400001r 040001k 003221w 022301u 230021g 200231r 322001k 230301w 023031u 302301g 030231r 303021k 000502w 050002u 005002g 000052r 500002k 001422w 200142u 420012g 142002r 014202k 000532w 530002u 053002g 300052r 005302k 600003w 060003u 006003g 000603r 000063k 033533w 303353u 530333g 353033r 335303k 000074w 700004u 070004g 007004r 000704k 300364w 630034u 363004g 036304r 003634k 300075w 730005u 073005g 007305r 000735k';
const CARDS = RAW.split(' ').map((s, i) => {
  const c = {}; C5.forEach((x, k) => { if (+s[k]) c[x] = +s[k]; });
  return {id: i, t: i < 40 ? 0 : i < 70 ? 1 : 2, p: +s[5], b: s[6], c};
});
// 귀족 10명 (모두 3점)
const NOBLES = [{w: 4, u: 4}, {u: 4, g: 4}, {g: 4, r: 4}, {r: 4, k: 4}, {k: 4, w: 4},
  {w: 3, u: 3, g: 3}, {u: 3, g: 3, r: 3}, {g: 3, r: 3, k: 3}, {r: 3, k: 3, w: 3}, {k: 3, w: 3, u: 3}];
const NOBN = ['메디치 공', '카를 대공', '이사벨 여왕', '술레이만 황제', '앙리 왕', '엘리자베스 여왕', '프란치스코 공', '마키아벨리 경', '안 왕비', '샤를 공작'];

/* ---------- 직접 그린 그림 (SVG) ---------- */
const GF = {w: ['#F7F9FC', '#8A93A6', '#FFFFFF'], u: ['#2F6FE0', '#163A84', '#9CC2FF'], g: ['#1FA463', '#0B5531', '#9BE8BF'],
  r: ['#E0384B', '#76101E', '#FFB0B8'], k: ['#3B404C', '#0B0D12', '#9AA3B5'], y: ['#F5C542', '#946500', '#FFF1B8']};
const SHAPE = {
  w: (f, s, h) => `<path d="M8 15 14 7h12l6 8-12 19z" fill="${f}" stroke="${s}" stroke-width="2" stroke-linejoin="round"/><path d="M8 15h24M14 7l2 8 4-8 4 8 2-8M16 15l4 19 4-19" fill="none" stroke="${s}" stroke-width="1" opacity=".7"/><path d="M15 9l-3 5" stroke="${h}" stroke-width="2" stroke-linecap="round"/>`,
  u: (f, s, h) => `<ellipse cx="20" cy="20" rx="11" ry="14" fill="${f}" stroke="${s}" stroke-width="2"/><ellipse cx="20" cy="20" rx="6" ry="8" fill="none" stroke="${s}" stroke-width="1" opacity=".6"/><path d="M14 13q2-4 6-5" stroke="${h}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  g: (f, s, h) => `<path d="M12 7h16l5 5v16l-5 5H12l-5-5V12z" fill="${f}" stroke="${s}" stroke-width="2" stroke-linejoin="round"/><path d="M15 12h10l3 3v10l-3 3H15l-3-3V15z" fill="none" stroke="${s}" stroke-width="1" opacity=".6"/><path d="M11 11l3 3M29 11l-3 3M11 29l3-3M29 29l-3-3" stroke="${s}" stroke-width="1" opacity=".5"/><path d="M14 9h8" stroke="${h}" stroke-width="2" stroke-linecap="round"/>`,
  r: (f, s, h) => `<path d="M20 34 7 18l5-9h16l5 9z" fill="${f}" stroke="${s}" stroke-width="2" stroke-linejoin="round"/><path d="M7 18h26M12 9l4 9 4-9 4 9 4-9M16 18l4 16 4-16" fill="none" stroke="${s}" stroke-width="1" opacity=".55"/><path d="M13 12l-2 4" stroke="${h}" stroke-width="2" stroke-linecap="round"/>`,
  k: (f, s, h) => `<path d="M20 5l13 7.5v15L20 35 7 27.5v-15z" fill="${f}" stroke="${s}" stroke-width="2" stroke-linejoin="round"/><path d="M20 12l7 4v8l-7 4-7-4v-8z" fill="none" stroke="${h}" stroke-width="1" opacity=".6"/><path d="M20 5v7M33 12.5l-6 3.5M33 27.5l-6-3.5M20 35v-7M7 27.5l6-3.5M7 12.5l6 3.5" stroke="${h}" stroke-width=".8" opacity=".45"/><path d="M11 13l4-2" stroke="${h}" stroke-width="2" stroke-linecap="round"/>`,
  y: (f, s, h) => `<circle cx="20" cy="20" r="14" fill="${f}" stroke="${s}" stroke-width="2"/><circle cx="20" cy="20" r="10" fill="none" stroke="${s}" stroke-width="1" opacity=".6"/><path d="M13 24l1.5-8 3.5 4 2-6 2 6 3.5-4 1.5 8z" fill="${s}" opacity=".85"/><path d="M12 13q3-4 8-5" stroke="${h}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
};
const gem = x => { const [f, s, h] = GF[x]; return `<svg viewBox="0 0 40 40" aria-hidden="true">${SHAPE[x](f, s, h)}</svg>`; };
// 포커칩 모양 토큰
const chip = x => { const [f, s] = GF[x]; const rim = x === 'w' ? '#C9CFDB' : s;
  return `<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="28" fill="${rim}"/><circle cx="30" cy="30" r="28" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="7 8.6" opacity=".85"/><circle cx="30" cy="30" r="20" fill="${x === 'k' ? '#1C1F26' : x === 'w' ? '#EEF1F6' : f}" stroke="#fff" stroke-width="1.5" opacity=".98"/><g transform="translate(13 13) scale(.85)">${SHAPE[x](...GF[x])}</g></svg>`; };
// 카드 그림: 1단계 광산 · 2단계 상단(배) · 3단계 궁전
const SCENE = [
  `<path d="M0 70 18 40l14 16 16-26 20 30 12-10 20 20v30H0z" fill="currentColor" opacity=".28"/><path d="M0 84 22 62l18 14 22-20 38 30v14H0z" fill="currentColor" opacity=".45"/><path d="M38 100V84q12-12 24 0v16z" fill="#3A2A1A" opacity=".7"/><path d="M62 70l14 14M70 66l-6 14" stroke="#5A4026" stroke-width="3" stroke-linecap="round"/>`,
  `<path d="M0 82q12-6 25 0t25 0 25 0 25 0v18H0z" fill="currentColor" opacity=".45"/><path d="M28 78h44l-8 10H36z" fill="#6B4220"/><path d="M50 78V40" stroke="#4A2E12" stroke-width="2.5"/><path d="M50 42q18 14 0 32z" fill="#FFF8E6" stroke="#8B6A3C"/><path d="M50 46q-14 10 0 24z" fill="currentColor" opacity=".55"/><path d="M50 40l10-4-10-3z" fill="currentColor"/><circle cx="82" cy="30" r="8" fill="#FFE08A" opacity=".8"/>`,
  `<path d="M14 100V58h14v-8l7-10 7 10v8h16v-8l7-10 7 10v8h14v42z" fill="currentColor" opacity=".38"/><path d="M42 100V74q8-10 16 0v26z" fill="#3A2A1A" opacity=".55"/><path d="M35 40v-8M65 40v-8" stroke="currentColor" stroke-width="2"/><path d="M35 32l7 3-7 3zM65 32l7 3-7 3z" fill="currentColor"/><rect x="20" y="64" width="6" height="8" rx="3" fill="#FFF8E6" opacity=".8"/><rect x="74" y="64" width="6" height="8" rx="3" fill="#FFF8E6" opacity=".8"/>`
];
const TINT = {w: '#7F8AA3', u: '#2F6FE0', g: '#1C9A5C', r: '#D7334A', k: '#2C3039'};
const BG = {w: '#F4F6FA', u: '#E5EEFD', g: '#E3F5EA', r: '#FCE6E9', k: '#E2E4EA'};
const TIERC = ['#3E9E5A', '#D9A21B', '#2A64C8'];
const pip = (x, v, cls = '') => `<i class="sp-pip sp-${x} ${cls}">${v}</i>`;
function cardHTML(id, o = {}) {
  const c = CARDS[id];
  const tag = o.btn ? 'button' : 'div';
  return `<${tag}${o.btn ? ` type="button" ${o.btn}` : ''} class="spc sp-b-${c.b} ${o.cls || ''}" style="--tint:${TINT[c.b]};--cbg:${BG[c.b]}"><svg class="spc-sc" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true" style="color:${TINT[c.b]}">${SCENE[c.t]}</svg><span class="spc-top"><b>${c.p || ''}</b><span class="spc-gem">${gem(c.b)}</span></span><span class="spc-cost">${C5.filter(x => c.c[x]).map(x => pip(x, c.c[x], o.need && o.need[x] ? 'short' : '')).join('')}</span><span class="spc-tier" style="background:${TIERC[c.t]}">${'Ⅰ Ⅱ Ⅲ'.split(' ')[c.t]}</span></${tag}>`;
}
const backHTML = (t, n, attrs = '') => `<button type="button" class="spc sp-back t${t}" ${attrs}><svg viewBox="0 0 60 84" aria-hidden="true"><rect x="2" y="2" width="56" height="80" rx="7" fill="${TIERC[t]}" stroke="#fff" stroke-width="2"/><rect x="7" y="7" width="46" height="70" rx="4" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/><g transform="translate(15 22) scale(.75)">${SHAPE.w('#fff', '#fff', '#fff').replace(/fill="#fff"/, 'fill="rgba(255,255,255,.25)"')}</g><text x="30" y="18" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">${t + 1}단계</text></svg><small>${n}장</small></button>`;
const noblePortrait = i => { const hue = ['#7A3E9D', '#2A56D6', '#B8392E', '#1C7A55', '#8A6510'][i % 5];
  return `<svg viewBox="0 0 60 60" aria-hidden="true"><rect width="60" height="60" rx="8" fill="#F6EAD0"/><circle cx="30" cy="25" r="10" fill="#F2CFA8" stroke="#8B6A3C"/><path d="M14 60c0-14 7-20 16-20s16 6 16 20z" fill="${hue}"/><path d="M24 40l6 8 6-8" fill="#fff" opacity=".85"/><path d="M20 17l3-9 4 6 3-8 3 8 4-6 3 9z" fill="#F5C542" stroke="#946500" stroke-width="1.2" stroke-linejoin="round"/><circle cx="26" cy="25" r="1.3" fill="#3A2410"/><circle cx="34" cy="25" r="1.3" fill="#3A2410"/><path d="M27 30q3 2 6 0" stroke="#7A3E1D" stroke-width="1.3" fill="none"/></svg>`; };
const nobleHTML = (ni, cls = '') => { const q = NOBLES[ni];
  return `<div class="spn ${cls}"><div class="spn-art">${noblePortrait(ni)}<b>3</b></div><div class="spn-req">${C5.filter(x => q[x]).map(x => `<i class="sp-sq sp-${x}">${q[x]}</i>`).join('')}</div><small>${NOBN[ni]}</small></div>`; };

/* ---------- 규칙 계산 ---------- */
const ttot = t => C5.reduce((s, x) => s + t[x], 0) + t.y;
function need(pl, id) {
  const c = CARDS[id], pay = {}, short = {}; let gold = 0;
  for (const x of C5) { const n = Math.max(0, (c.c[x] || 0) - pl.bon[x]); pay[x] = Math.min(n, pl.tok[x]); short[x] = n - pay[x]; gold += short[x]; }
  return {pay, gold, short, ok: gold <= pl.tok.y};
}
const z5 = () => ({w: 0, u: 0, g: 0, r: 0, k: 0});
const draw = (S, t) => S.decks[t].length ? S.decks[t].shift() : null;
function canTakeAny(S) { return C5.some(x => S.tok[x] > 0); }
function hasMove(S, me) {
  const pl = S.pl[me];
  if (canTakeAny(S)) return true;
  if (pl.res.length < 3 && (S.board.some(r => r.some(v => v != null)) || S.decks.some(d => d.length))) return true;
  if (S.board.some(r => r.some(v => v != null && need(pl, v).ok))) return true;
  return pl.res.some(r => need(pl, r.i).ok);
}
function finish(S, me, P) {
  const pl = S.pl[me];
  const ok = S.nobles.map((ni, k) => ({ni, k})).filter(o => C5.every(x => pl.bon[x] >= (NOBLES[o.ni][x] || 0)));
  if (ok.length) {
    const o = ok[0]; S.nobles.splice(o.k, 1); pl.nob.push(o.ni); pl.pts += 3;
    if (S.last) S.last.nob = o.ni;
    lg(S, `👑 ${NOBN[o.ni]}이(가) ${P[me].name}님을 찾아왔어요! +3점`);
  }
  if (pl.pts >= 15 && !S.final) { S.final = true; lg(S, `🏁 ${P[me].name}님 ${pl.pts}점! 이번 바퀴가 마지막이에요.`); }
  S.phase = 'play';
  S.turn = (S.turn + 1) % P.length;
  if (S.turn === 0) S.round++;
  if (S.final && S.turn === 0) {
    const order = P.map((_, i) => i).sort((a, b) => S.pl[b].pts - S.pl[a].pts || S.pl[a].cards - S.pl[b].cards);
    S.rank = order; S.phase = 'end';
    const top = order.filter(i => S.pl[i].pts === S.pl[order[0]].pts && S.pl[i].cards === S.pl[order[0]].cards);
    S.winner = top.length > 1 ? `${top.map(i => P[i].name).join(', ')}님 공동 승리!` : `${P[order[0]].name}님 ${S.pl[order[0]].pts}점으로 승리!`;
  }
}
const lg = (S, m) => { S.log = (S.log || []).concat(m).slice(-6); };
function after(S, me, P) { if (ttot(S.pl[me].tok) > 10) { S.phase = 'disc'; return; } finish(S, me, P); }

G.splendor = {
  name: '스플렌더', tag: '보석을 모아 카드를 사고 귀족을 맞이하기', min: 2, max: 4, mark: '💎', hue: '#7A3E9D',
  rules: ['내 차례에는 네 가지 중 하나만 해요.',
    '① 서로 다른 색 보석 3개 가져오기',
    '② 같은 색 보석 2개 가져오기 (그 색이 4개 이상 남아 있을 때만)',
    '③ 카드 1장 예약하기 + 황금 1개 받기 (예약은 3장까지, 덱 맨 위 카드를 몰래 예약해도 돼요)',
    '④ 펼쳐진 카드나 내가 예약한 카드 사기. 황금은 아무 색으로나 쓸 수 있어요.',
    '산 카드는 그 색 보석 1개 할인(보너스)이 계속 붙어요. 카드 왼쪽 위 숫자가 명예 점수예요.',
    '보석은 10개까지만 가질 수 있어요. 넘으면 차례가 끝날 때 10개가 되도록 돌려놔요.',
    '내 보너스가 귀족의 조건을 채우면 차례 끝에 귀족이 찾아와 3점을 줘요(행동을 쓰지 않아요).',
    '누군가 15점이 되면 그 바퀴 끝까지 하고, 점수가 가장 높은 사람이 승리! 동점이면 카드를 적게 산 사람이 이겨요.'],
  rulesExtra() {
    return `<section class="sp-legend">${C5.concat('y').map(x => `<div><span class="sp-chip">${chip(x)}</span><small>${SN[x]}<br><em>${SS[x]}</em></small></div>`).join('')}</section>`;
  },
  setup(P) {
    const n = P.length; if (n < 2 || n > 4) throw U.err('2~4명이 필요해요.');
    const k = n === 2 ? 4 : n === 3 ? 5 : 7;
    const decks = [0, 1, 2].map(t => U.shuffle(CARDS.filter(c => c.t === t).map(c => c.id)));
    const board = decks.map(d => d.splice(0, 4));
    const nobles = U.shuffle(NOBLES.map((_, i) => i)).slice(0, n + 1);
    return {_g: Math.random().toString(36).slice(2, 9), decks, board, nobles, tok: {w: k, u: k, g: k, r: k, k, y: 5},
      pl: P.map(() => ({tok: Object.assign(z5(), {y: 0}), bon: z5(), res: [], pts: 0, cards: 0, nob: []})),
      turn: 0, round: 1, final: false, phase: 'play', last: null, log: ['스플렌더 시작! 보석을 모아 카드를 사세요.']};
  },
  turns(S) { return S.winner ? [] : [S.turn]; },
  act(S, me, t, a, P) {
    if (S.winner) return;
    if (me !== S.turn) throw U.err('내 차례가 아니에요.');
    const pl = S.pl[me]; a = a || {};
    if (S.phase === 'disc') {
      if (t !== 'ret') throw U.err('먼저 보석을 10개로 맞춰 돌려놔 주세요.');
      const x = a.x; if (!(x in pl.tok) || pl.tok[x] < 1) throw U.err('그 보석이 없어요.');
      pl.tok[x]--; S.tok[x]++; (S.last.ret = S.last.ret || []).push(x);
      if (ttot(pl.tok) <= 10) { lg(S, `${P[me].name}님이 보석 ${S.last.ret.length}개를 돌려놨어요.`); finish(S, me, P); }
      return;
    }
    if (t === 'take') {
      const g = Array.isArray(a.g) ? a.g : [];
      if (!g.length || g.some(x => !C5.includes(x))) throw U.err('보석을 고르세요.');
      if (g.length === 2 && g[0] === g[1]) { if (S.tok[g[0]] < 4) throw U.err('같은 색 2개는 그 색이 4개 이상 남았을 때만 가져올 수 있어요.'); }
      else {
        if (new Set(g).size !== g.length || g.length > 3) throw U.err('서로 다른 색 3개, 또는 같은 색 2개를 골라요.');
        if (g.some(x => S.tok[x] < 1)) throw U.err('남지 않은 보석이 있어요.');
        const avail = C5.filter(x => S.tok[x] > 0).length;
        if (g.length < Math.min(3, avail)) throw U.err('서로 다른 색 3개를 골라 주세요.');
      }
      g.forEach(x => { S.tok[x]--; pl.tok[x]++; });
      S.last = {p: me, k: 'take', g: g.slice(), n: (S.last ? S.last.n : 0) + 1};
      lg(S, `${P[me].name}님: 보석 ${g.map(x => SN[x]).join('·')} 가져감`);
      return after(S, me, P);
    }
    if (t === 'reserve') {
      if (pl.res.length >= 3) throw U.err('예약은 3장까지예요.');
      let id, h = 0;
      if (a.d != null) { const tr = +a.d; if (!S.decks[tr] || !S.decks[tr].length) throw U.err('덱이 비었어요.'); id = S.decks[tr].shift(); h = 1; }
      else { id = S.board[a.t] && S.board[a.t][a.i]; if (id == null) throw U.err('없는 카드예요.'); S.board[a.t][a.i] = draw(S, a.t); }
      pl.res.push({i: id, h});
      let gold = 0; if (S.tok.y > 0) { S.tok.y--; pl.tok.y++; gold = 1; }
      S.last = {p: me, k: 'res', id: h ? null : id, tier: CARDS[id].t, gold, n: (S.last ? S.last.n : 0) + 1};
      lg(S, `${P[me].name}님이 ${h ? `${CARDS[id].t + 1}단계 덱에서 몰래` : '카드를'} 예약했어요${gold ? ' (+황금)' : ''}.`);
      return after(S, me, P);
    }
    if (t === 'buy') {
      let id;
      if (a.r != null) { const r = pl.res[a.r]; if (!r) throw U.err('없는 카드예요.'); id = r.i; }
      else { id = S.board[a.t] && S.board[a.t][a.i]; if (id == null) throw U.err('없는 카드예요.'); }
      const c = CARDS[id], nd = need(pl, id);
      if (!nd.ok) throw U.err('보석이 모자라요.');
      for (const x of C5) { pl.tok[x] -= nd.pay[x]; S.tok[x] += nd.pay[x]; }
      pl.tok.y -= nd.gold; S.tok.y += nd.gold;
      if (a.r != null) pl.res.splice(a.r, 1); else S.board[a.t][a.i] = draw(S, a.t);
      pl.bon[c.b]++; pl.pts += c.p; pl.cards++;
      S.last = {p: me, k: 'buy', id, n: (S.last ? S.last.n : 0) + 1};
      lg(S, `${P[me].name}님이 ${SN[c.b]} 카드를 샀어요${c.p ? ` (+${c.p}점)` : ''}.`);
      return finish(S, me, P);
    }
    if (t === 'pass') {
      if (hasMove(S, me)) throw U.err('아직 할 수 있는 행동이 있어요.');
      S.last = {p: me, k: 'pass', n: (S.last ? S.last.n : 0) + 1}; lg(S, `${P[me].name}님은 할 수 있는 게 없어 넘겼어요.`);
      return finish(S, me, P);
    }
  },
  view(S, me, ui, P) { return `<div class="spw">${G.splendor._view.call(this, S, me, ui, P)}</div>`; },
  _view(S, me, ui, P) {
    const my = me === S.turn && !S.winner, pl = me >= 0 ? S.pl[me] : null;
    let h = '';
    if (S.winner) h += spEnd(S, P);
    // 차례 표시 + 마지막 행동
    if (!S.winner) h += `<div class="sp-turn${my ? ' me' : ''}" style="--pc:${U.pc(S.turn)}"><span class="sp-ti">💎</span><div><small>${S.round}바퀴째${S.final ? ' · 마지막 바퀴!' : ''}</small><b>${U.nm(P, S.turn)}${my ? ' (나)' : ''} 차례</b></div><span class="sp-tt">${my ? (S.phase === 'disc' ? '보석을 10개로 맞춰 주세요' : '행동 하나를 고르세요') : P[S.turn] && P[S.turn].bot ? 'AI가 생각 중…' : '고르는 중…'}</span></div>`;
    h += spLast(S, P);
    // 귀족
    h += `<section class="sp-nobles"><div class="sp-lbl">👑 귀족 <small>보너스 조건을 채우면 3점</small></div><div class="sp-nrow">${S.nobles.map(ni => nobleHTML(ni, pl && C5.every(x => pl.bon[x] >= (NOBLES[ni][x] || 0)) ? 'ready' : '')).join('') || '<small class="muted">모든 귀족이 떠났어요</small>'}</div></section>`;
    // 카드 시장
    const sel = ui.sel || null;
    h += `<section class="sp-market">`;
    for (const t of [2, 1, 0]) {
      h += `<div class="sp-tier">${backHTML(t, S.decks[t].length, my && S.phase === 'play' && S.decks[t].length && pl.res.length < 3 ? `data-ui="sel" data-tog data-val="${U.attr({d: t})}"${sel && sel.d === t ? ' aria-pressed="true"' : ''}` : 'disabled')}${S.board[t].map((id, i) => id == null ? '<div class="spc sp-empty"></div>' : cardHTML(id, {
        btn: `data-ui="sel" data-tog data-val="${U.attr({t, i})}"${my && S.phase === 'play' ? '' : ' disabled'}`,
        cls: (sel && sel.t === t && sel.i === i ? 'sel ' : '') + (pl && need(pl, id).ok ? 'afford' : '')
      })).join('')}</div>`;
    }
    h += `</section>`;
    if (my && S.phase === 'play') h += spSelPanel(S, me, ui, P);
    // 보석 은행
    if (!S.winner) {
      const pick = Array.isArray(ui.pick) ? ui.pick : [];
      h += `<section class="sp-bank"><div class="sp-lbl">💰 보석 은행 ${my && S.phase === 'play' ? '<small>눌러서 고르기 · 다른 색 3개 또는 같은 색 2개</small>' : ''}</div><div class="sp-chips">${C5.concat('y').map(x => {
        const n = S.tok[x], cnt = pick.filter(v => v === x).length;
        const dis = !(my && S.phase === 'play') || x === 'y' || !spCanPick(S, pick, x);
        return `<button type="button" class="sp-tk${cnt ? ' on' : ''}${x === 'y' ? ' gold' : ''}" data-g="pick" data-val="${U.attr(x)}"${dis ? ' disabled' : ''} aria-label="${SN[x]} ${n}개"><span class="sp-chip">${chip(x)}</span><b>${n}</b>${cnt ? `<em>+${cnt}</em>` : ''}</button>`;
      }).join('')}</div>`;
      if (my && S.phase === 'play') {
        const ok = spPickOk(S, pick), aft = pl ? ttot(pl.tok) + pick.length : 0;
        h += pick.length ? `<div class="sp-pickbar"><span>고른 보석 ${pick.map(x => `<span class="sp-mini">${gem(x)}</span>`).join('')}</span>${U.gb('다시', 'pick', null, 'ghost')}${U.btn(ok ? `가져오기${aft > 10 ? ` (넘친 ${aft - 10}개는 돌려놔요)` : ''}` : '보석을 더 고르세요', 'take', {g: pick}, 'primary', !ok)}</div>` : '';
      }
      h += `</section>`;
    }
    // 반납
    if (my && S.phase === 'disc') h += `<section class="sp-disc"><b>보석이 ${ttot(pl.tok)}개예요. ${ttot(pl.tok) - 10}개를 돌려놔 주세요</b><div class="sp-chips">${C5.concat('y').filter(x => pl.tok[x]).map(x => U.btn(`<span class="sp-chip">${chip(x)}</span><b>${pl.tok[x]}</b>`, 'ret', {x}, 'sp-tk')).join('')}</div><small>누르면 한 개씩 은행으로 돌아가요</small></section>`;
    // 내 자리
    if (pl) h += spMine(S, me, ui, P);
    if (my && S.phase === 'play' && !hasMove(S, me)) h += `<div class="sp-pass">${U.btn('할 수 있는 행동이 없어요 · 차례 넘기기', 'pass', {}, 'big')}</div>`;
    // 모두의 자리
    h += `<section class="sp-seats">${P.map((p, i) => i === me ? '' : spSeat(S, i, P)).join('')}</section>`;
    h += `<details class="ref"><summary>진행 기록</summary><ol class="sp-log">${(S.log || []).slice().reverse().map(l => `<li>${U.esc(l)}</li>`).join('')}</ol></details>`;
    return h;
  },
  uiAct(ui, S, me, name, val) {
    if (name !== 'pick') return;
    if (val == null) { ui.pick = []; return; }
    const p = Array.isArray(ui.pick) ? ui.pick.slice() : [];
    // 이미 고른 색을 다시 누르면: 하나만 골랐으면 같은 색 2개, 아니면 빼기
    const i = p.indexOf(val);
    if (i >= 0) {
      if (p.length === 1 && S.tok[val] >= 4) p.push(val);
      else p.splice(i, 1);
    } else if (spCanPick(S, p, val)) p.push(val);
    ui.pick = p; ui.sel = null;
  },
  splash: false
};
function spCanPick(S, p, x) {
  if (S.tok[x] < 1) return false;
  if (p.includes(x)) return true; // 다시 누르면 2개로 바꾸거나 빼기
  if (p.length >= 3) return false;
  if (p.length === 2 && p[0] === p[1]) return false;
  return true;
}
function spPickOk(S, p) {
  if (!p.length) return false;
  if (p.length === 2 && p[0] === p[1]) return S.tok[p[0]] >= 4;
  if (new Set(p).size !== p.length) return false;
  const avail = C5.filter(x => S.tok[x] > 0).length;
  return p.length >= Math.min(3, avail);
}
function spSelPanel(S, me, ui, P) {
  const sel = ui.sel, pl = S.pl[me];
  if (!sel) return '';
  if (sel.d != null) {
    if (!S.decks[sel.d] || !S.decks[sel.d].length) return '';
    return `<section class="sp-sel"><div class="sp-sel-c">${backHTML(sel.d, S.decks[sel.d].length, 'disabled')}</div><div class="sp-sel-r"><b>${sel.d + 1}단계 덱 맨 위 카드</b><small>무슨 카드인지 모른 채 몰래 예약해요. 다른 사람은 내용을 못 봐요.</small>${U.btn(`📌 몰래 예약하기${S.tok.y ? ' + 황금 1개' : ''}`, 'reserve', {d: sel.d}, 'primary big', pl.res.length >= 3)}${pl.res.length >= 3 ? '<small class="bad">예약은 3장까지예요</small>' : ''}</div></section>`;
  }
  let id, buyArg, canRes = false;
  if (sel.r != null) { const r = pl.res[sel.r]; if (!r) return ''; id = r.i; buyArg = {r: sel.r}; }
  else { id = S.board[sel.t] && S.board[sel.t][sel.i]; if (id == null) return ''; buyArg = {t: sel.t, i: sel.i}; canRes = true; }
  const c = CARDS[id], nd = need(pl, id);
  const payTxt = C5.filter(x => nd.pay[x]).map(x => pip(x, nd.pay[x])).join('') + (nd.gold ? pip('y', nd.gold) : '');
  const free = !C5.some(x => nd.pay[x]) && !nd.gold;
  return `<section class="sp-sel"><div class="sp-sel-c">${cardHTML(id, {need: nd.short})}</div><div class="sp-sel-r"><b>${SN[c.b]} 카드 · ${c.p}점</b><small>사면 ${SN[c.b]} 할인 +1</small>
<div class="sp-pay">${nd.ok ? (free ? '<span>보너스만으로 공짜!</span>' : `<span>낼 보석</span>${payTxt}`) : `<span class="bad">모자라요: ${C5.filter(x => nd.short[x]).map(x => pip(x, nd.short[x])).join('')}${pl.tok.y ? ` (황금 ${pl.tok.y}개로는 부족)` : ''}</span>`}</div>
${U.btn('🛒 이 카드 사기', 'buy', buyArg, 'primary big', !nd.ok)}${canRes ? U.btn(`📌 예약${S.tok.y ? ' (+황금)' : ''}`, 'reserve', {t: sel.t, i: sel.i}, 'big', pl.res.length >= 3) : ''}${canRes && pl.res.length >= 3 ? '<small class="bad">예약은 3장까지예요</small>' : ''}</div></section>`;
}
function spMine(S, me, ui, P) {
  const pl = S.pl[me], my = me === S.turn && S.phase === 'play' && !S.winner, sel = ui.sel;
  return `<section class="sp-mine" style="--pc:${U.pc(me)}"><div class="sp-mh"><b>${U.nm(P, me)} (나)</b><span class="sp-pts">${pl.pts}<small>점</small></span><span class="sp-cnt">보석 ${ttot(pl.tok)}/10 · 카드 ${pl.cards}${pl.nob.length ? ` · 👑${pl.nob.length}` : ''}</span></div>
<div class="sp-hold">${C5.map(x => `<div class="sp-col sp-${x}"><span class="sp-bon" title="${SN[x]} 보너스">${pl.bon[x]}</span><span class="sp-chip">${chip(x)}</span><b>${pl.tok[x]}</b></div>`).join('')}<div class="sp-col sp-y"><span class="sp-bon none"></span><span class="sp-chip">${chip('y')}</span><b>${pl.tok.y}</b></div></div>
<small class="sp-help">위 숫자(카드 할인) · 아래 숫자(가진 보석)</small>
${pl.res.length ? `<div class="sp-lbl">📌 예약한 카드 <small>${my ? '눌러서 사기' : ''}</small></div><div class="sp-res">${pl.res.map((r, k) => cardHTML(r.i, {btn: `data-ui="sel" data-tog data-val="${U.attr({r: k})}"${my ? '' : ' disabled'}`, cls: (sel && sel.r === k ? 'sel ' : '') + (need(pl, r.i).ok ? 'afford' : '')})).join('')}</div>` : ''}
${pl.nob.length ? `<div class="sp-nrow sm">${pl.nob.map(ni => nobleHTML(ni, 'got')).join('')}</div>` : ''}</section>`;
}
function spSeat(S, i, P) {
  const pl = S.pl[i];
  return `<div class="sp-seat${i === S.turn && !S.winner ? ' on' : ''}" style="--pc:${U.pc(i)}"><div class="sp-sh"><span class="pdot" style="--pc:${U.pc(i)}"></span><b>${U.nm(P, i)}</b><span class="sp-pts">${pl.pts}<small>점</small></span></div>
<div class="sp-srow">${C5.map(x => `<span class="sp-sc sp-${x}"><i>${pl.bon[x]}</i><em>${pl.tok[x]}</em></span>`).join('')}<span class="sp-sc sp-y"><i></i><em>${pl.tok.y}</em></span></div>
<small>보석 ${ttot(pl.tok)} · 카드 ${pl.cards}${pl.res.length ? ` · 예약 ${pl.res.length}` : ''}${pl.nob.length ? ` · 👑${pl.nob.length}` : ''}</small>${pl.res.length ? `<div class="sp-ores">${pl.res.map(r => r.h || S.winner ? `<span class="sp-ob t${CARDS[r.i].t}"></span>` : cardHTML(r.i, {cls: 'xs'})).join('')}</div>` : ''}</div>`;
}
function spFresh(key, dur) {
  const R0 = typeof window !== 'undefined' ? window : globalThis; R0.__spSeen = R0.__spSeen || {};
  const now = Date.now(); if (!R0.__spSeen[key]) R0.__spSeen[key] = now;
  const el = (now - R0.__spSeen[key]) / 1000; return el < dur ? el : -1;
}
function spLast(S, P) {
  const L = S.last; if (!L) return '';
  const el = spFresh('sp' + S._g + L.n, 1.6), st = el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s"`;
  let body = '';
  if (L.k === 'take') body = `보석을 가져갔어요 ${L.g.map(x => `<span class="sp-mini">${gem(x)}</span>`).join('')}`;
  else if (L.k === 'buy') body = `카드를 샀어요 ${cardHTML(L.id, {cls: 'xs'})}${CARDS[L.id].p ? ` <b>+${CARDS[L.id].p}점</b>` : ''}`;
  else if (L.k === 'res') body = `${L.id == null ? `${L.tier + 1}단계 덱에서 몰래` : '카드를'} 예약했어요 ${L.id == null ? `<span class="sp-ob t${L.tier}"></span>` : cardHTML(L.id, {cls: 'xs'})}${L.gold ? ` <span class="sp-mini">${gem('y')}</span>` : ''}`;
  else body = '차례를 넘겼어요';
  if (L.ret && L.ret.length) body += ` <small>· ${L.ret.length}개 반납</small>`;
  if (L.nob != null) body += ` <b class="sp-nv">👑 ${NOBN[L.nob]} 방문 +3</b>`;
  return `<div class="sp-last"${st}><span class="pdot" style="--pc:${U.pc(L.p)}"></span><b>${U.nm(P, L.p)}</b> ${body}</div>`;
}
function spEnd(S, P) {
  const el = spFresh('spe' + S._g, 4), o = S.rank || [];
  return `<section class="sp-end"${el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s"`}><div class="sp-end-gems">${C5.map(x => `<span>${gem(x)}</span>`).join('')}</div><small>게임 끝</small><b>${U.esc(S.winner)}</b>
<ol class="sp-rank">${o.map((i, k) => `<li class="${k === 0 ? 'top' : ''}"><span>${k === 0 ? '👑' : k + 1}</span><b>${U.nm(P, i)}</b><em>${S.pl[i].pts}점</em><small>카드 ${S.pl[i].cards}장${S.pl[i].nob.length ? ` · 귀족 ${S.pl[i].nob.length}` : ''}</small></li>`).join('')}</ol></section>`;
}

/* ---------- AI ---------- */
function spBotStep(S, P) {
  if (!S || S.winner) return false;
  const me = S.turn; if (!P[me] || !P[me].bot) return false;
  const run = (t, a) => { try { G.splendor.act(S, me, t, a, P); return true; } catch (e) { return false; } };
  const pl = S.pl[me];
  if (S.phase === 'disc') {
    // 목표 카드에 덜 필요한 보석부터 돌려놔요
    const tg = spTarget(S, me), want = tg ? spShort(pl, tg.id) : z5();
    const xs = C5.filter(x => pl.tok[x] > 0).sort((a, b) => (want[a] - pl.tok[a]) - (want[b] - pl.tok[b]));
    return run('ret', {x: xs[0] || 'y'});
  }
  // 1) 살 수 있는 카드 중 가장 좋은 것
  const buys = [];
  S.board.forEach((row, t) => row.forEach((id, i) => { if (id != null && need(pl, id).ok) buys.push({a: {t, i}, id}); }));
  pl.res.forEach((r, k) => { if (need(pl, r.i).ok) buys.push({a: {r: k}, id: r.i, res: 1}); });
  if (buys.length) {
    buys.forEach(b => { b.s = spValue(S, me, b.id) + (b.res ? 1.5 : 0) - spSpend(pl, b.id) * 0.35 + Math.random() * 0.4; });
    buys.sort((a, b) => b.s - a.s);
    const best = buys[0];
    // 0점 카드는 보석을 너무 쓰면 미뤄요(초반 제외)
    if (best.s > 0.5 || CARDS[best.id].p > 0 || pl.cards < 6 || Math.random() < .5) return run('buy', best.a);
  }
  // 2) 목표를 정해 보석 모으기
  const tg = spTarget(S, me);
  const short = tg ? spShort(pl, tg.id) : z5();
  const tot = ttot(pl.tok);
  // 보석이 많고 목표가 비싸면 예약으로 황금 확보
  if (tg && !tg.res && pl.res.length < 3 && (tot >= 8 || (CARDS[tg.id].p >= 3 && Math.random() < .35)) && tg.a) { if (run('reserve', tg.a)) return true; }
  const avail = C5.filter(x => S.tok[x] > 0);
  const order = avail.slice().sort((a, b) => (short[b] - short[a]) || (Math.random() - .5));
  const two = order.find(x => short[x] >= 2 && S.tok[x] >= 4);
  let pick;
  if (two && (short[two] >= 2 && C5.filter(x => short[x] > 0).length <= 2)) pick = [two, two];
  else pick = order.slice(0, Math.min(3, avail.length));
  if (pick.length && tot + pick.length <= 10 + 1 && run('take', {g: pick})) return true;
  if (pl.res.length < 3) {
    const t = U.rint(3); const i = S.board[t].findIndex(v => v != null);
    if (i >= 0 && run('reserve', {t, i})) return true;
    for (let d = 0; d < 3; d++) if (S.decks[d].length && run('reserve', {d})) return true;
  }
  if (pick.length && run('take', {g: pick})) return true;
  for (const x of avail) if (run('take', {g: [x]})) return true;
  return run('pass', {});
}
function spShort(pl, id) { const c = CARDS[id], o = z5(); for (const x of C5) o[x] = Math.max(0, (c.c[x] || 0) - pl.bon[x] - pl.tok[x]); return o; }
function spSpend(pl, id) { const c = CARDS[id]; return C5.reduce((s, x) => s + Math.max(0, (c.c[x] || 0) - pl.bon[x]), 0); }
function spValue(S, me, id) {
  const c = CARDS[id], pl = S.pl[me];
  let v = c.p * 2.2;
  // 귀족에 가까워지는 보너스
  for (const ni of S.nobles) { const q = NOBLES[ni]; if (q[c.b] && pl.bon[c.b] < q[c.b]) v += 0.6; }
  // 앞으로 살 카드들에 필요한 색
  let use = 0; S.board.forEach(r => r.forEach(o => { if (o != null && CARDS[o].c[c.b] > pl.bon[c.b]) use++; }));
  v += Math.min(use, 6) * 0.18;
  if (pl.pts + c.p >= 15) v += 10;
  return v;
}
function spTarget(S, me) {
  const pl = S.pl[me], cand = [];
  S.board.forEach((row, t) => row.forEach((id, i) => { if (id != null) cand.push({id, a: {t, i}}); }));
  pl.res.forEach((r, k) => cand.push({id: r.i, res: 1}));
  let best = null, bs = -1e9;
  for (const o of cand) {
    const sh = spShort(pl, o.id), miss = C5.reduce((s, x) => s + sh[x], 0) - pl.tok.y;
    const s = spValue(S, me, o.id) - Math.max(0, miss) * 1.1 + (o.res ? 1 : 0) + Math.random() * 0.3;
    if (s > bs) { bs = s; best = o; }
  }
  return best;
}
G.splendor.botStep = spBotStep;
G.splendor.art = (k, x) => k === 'chip' ? chip(x) : k === 'gem' ? gem(x) : k === 'card' ? cardHTML(x, {}) : k === 'noble' ? nobleHTML(x) : '';
G.splendor._cards = CARDS;
G.splendor.BOTNAMES = ['보석상', '세공사', '광부', '선장', '상인', '귀공자'];
})();
