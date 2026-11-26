(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;
const isDOM = typeof document !== 'undefined';

/* =================== 루미큐브 =================== */
/* 타일 106개: 1~13 × 4색 × 2벌 + 조커 2. 각자 14장으로 시작.
   내 차례: 바닥에 '세트'를 내거나 바닥 세트를 고쳐 내 타일을 붙여요. 아무것도 못 내면 한 장 가져가요.
   세트 = 같은 숫자 다른 색 3~4장(그룹) 또는 같은 색 연속 숫자 3장 이상(런). 조커는 아무 타일 대신.
   첫 등록은 내 타일만으로 합 30 이상이어야 하고, 그 전에는 바닥 세트를 건드릴 수 없어요.
   손패를 먼저 다 내면 승리! 더미가 바닥나고 모두 한 바퀴 넘기면 손패 합이 가장 적은 사람이 승리. */
const JK = [104, 105];
const isJ = id => id >= 104;
const colOf = id => Math.floor(id / 26), numOf = id => id % 13 + 1;
const CN = ['빨강', '파랑', '주황', '검정'];
function check(set) {
  const n = set.length; if (n < 3) return null;
  const nj = set.filter(isJ), rs = set.filter(id => !isJ(id));
  if (!rs.length) return null;
  // 그룹
  const num = numOf(rs[0]);
  if (n <= 4 && rs.every(id => numOf(id) === num) && new Set(rs.map(colOf)).size === rs.length) {
    return {kind: 'g', pts: num * rs.length, order: rs.slice().sort((a, b) => colOf(a) - colOf(b)).concat(nj)};
  }
  // 런
  const c = colOf(rs[0]);
  if (n <= 13 && rs.every(id => colOf(id) === c)) {
    const ns = rs.map(numOf).sort((a, b) => a - b);
    if (new Set(ns).size !== ns.length) return null;
    const span = ns[ns.length - 1] - ns[0] + 1; if (span > n) return null;
    let start = ns[0], end = start + n - 1; if (end > 13) { start = 13 - n + 1; end = 13; }
    if (start > ns[0]) return null;
    const by = {}; rs.forEach(id => by[numOf(id)] = id); const js = nj.slice(), order = [];
    let pts = 0; for (let v = start; v <= end; v++) { if (by[v] != null) { order.push(by[v]); pts += v; } else order.push(js.shift()); }
    return {kind: 'r', pts, order};
  }
  return null;
}
const tval = id => isJ(id) ? 30 : numOf(id);
/* 바닥은 칸 격자: 가로 COLS칸 × 세로 ROWS줄. 세트 자리 = [칸, 줄] */
const COLS = 22, ROWS = 4, MAXR = 8;
function autoPlace(pos, table) {
  const occ = [], out = table.map(() => null);
  const free = (c, r, n) => { if (c < 0 || c + n > COLS || r < 0 || r >= MAXR) return false; const row = occ[r] || []; for (let k = c - 1; k <= c + n; k++) if (row[k]) return false; return true; };
  const take = (c, r, n) => { const row = occ[r] = occ[r] || []; for (let k = c; k < c + n; k++) row[k] = 1; };
  const wish = i => { const q = pos && pos[i]; if (!q || !isFinite(q[0]) || !isFinite(q[1])) return null; const n = Math.min(COLS, table[i].length); return [Math.max(0, Math.min(COLS - n, Math.round(+q[0]))), Math.max(0, Math.min(MAXR - 1, Math.round(+q[1]))), Number.isInteger(+q[0]) && Number.isInteger(+q[1]) && +q[1] < MAXR]; };
  table.forEach((s, i) => { const w = wish(i), n = Math.min(COLS, s.length); if (w && w[2] && free(w[0], w[1], n)) { out[i] = [w[0], w[1]]; take(w[0], w[1], n); } });
  table.forEach((s, i) => {
    if (out[i]) return; const w = wish(i), n = Math.min(COLS, s.length); let best = null, bs = 1e9;
    for (let r = 0; r < MAXR; r++) for (let c = 0; c + n <= COLS; c++) { if (!free(c, r, n)) continue; const sc = (r >= ROWS ? 500 : 0) + (w ? Math.abs(r - w[1]) * 4 + Math.abs(c - w[0]) : r * 40 + c); if (sc < bs) { bs = sc; best = [c, r]; } }
    out[i] = best || [0, MAXR - 1]; take(out[i][0], out[i][1], n);
  });
  return out;
}
/* 붙을 수 있는 조합인지(아직 3장이 안 돼도 이어질 수 있으면 OK) */
function compat(set) {
  const rs = set.filter(id => !isJ(id)), J = set.length - rs.length, n = set.length;
  if (!rs.length) return n <= 13;
  const num = numOf(rs[0]);
  if (n <= 4 && rs.every(id => numOf(id) === num) && new Set(rs.map(colOf)).size === rs.length) return true;
  const c = colOf(rs[0]);
  if (n <= 13 && rs.every(id => colOf(id) === c)) { const ns = rs.map(numOf); if (new Set(ns).size !== ns.length) return false; const span = Math.max(...ns) - Math.min(...ns) + 1; return span - rs.length <= J; }
  return false;
}
const partOrder = s => { const rs = s.filter(id => !isJ(id)), js = s.filter(isJ); const g = rs.length > 1 && rs.every(id => numOf(id) === numOf(rs[0])); return rs.slice().sort(g ? (a, b) => colOf(a) - colOf(b) : (a, b) => numOf(a) - numOf(b) || colOf(a) - colOf(b)).concat(js); };
const handSum = h => h.reduce((s, id) => s + tval(id), 0);
G.rummikub = {
  name: '루미큐브', tag: '숫자 타일로 세트를 만들어 먼저 다 내기', min: 2, max: 4, mark: '🀄', hue: '#E8873A',
  rules: ['타일은 1~13 숫자 × 4가지 색 × 2벌, 그리고 조커 2장(106장). 각자 14장으로 시작해요.', '세트는 두 종류: ① 같은 숫자, 서로 다른 색 3~4장(그룹) ② 같은 색, 연속된 숫자 3장 이상(런). 조커는 어떤 타일 대신으로도 쓸 수 있어요.', '첫 등록: 내 타일로만 만든 세트들의 숫자 합이 30 이상이어야 내려놓을 수 있어요(조커는 합에 넣지 않아요). 등록 전에는 바닥 세트를 건드릴 수 없어요.', '등록한 뒤에는 바닥 세트를 자유롭게 쪼개고 합쳐서 내 타일을 붙여요. 단, 차례가 끝날 때 바닥의 모든 세트가 올바라야 해요.', '낼 게 없으면 더미에서 한 장 가져가고 차례가 넘어가요.', '손패를 가장 먼저 다 내면 승리! 더미가 바닥나고 모두 한 바퀴 넘기면 손패 숫자 합이 가장 적은 사람이 승리(조커는 30점).', '조작: 타일을 마우스로 집어서 바닥의 원하는 자리에 놓으면 그 자리에 새 세트가 생겨요. 세트의 타일 사이에 놓으면 그 사이에 끼워져요. 세트 테두리를 잡고 끌면 세트를 옮길 수 있어요. "내기"를 누르면 확정!'],
  setup(P) {
    const pool = U.shuffle(Array.from({length: 106}, (_, i) => i));
    const hand = P.map(() => pool.splice(0, 14));
    const first = Math.floor(Math.random() * P.length);
    return {_g: Math.random().toString(36).slice(2, 9), pool, hand, table: [], melded: P.map(() => false), turn: first, n: 0, pass: 0, tl: 0, ts: Date.now(), log: [`${P[first].name}님부터 시작해요.`]};
  },
  turns: S => S.winner ? [] : [S.turn],
  due(S) { return !S.winner && S.tl ? S.ts + S.tl * 1000 : null; },
  timeout(S, P) {
    if (S.winner || !S.tl || Date.now() < S.ts + S.tl * 1000 - 300) return false;
    U.log(S, `⏰ ${P[S.turn].name}님 시간 초과! 한 장 가져가요.`);
    drawFor(S, P, S.turn); return true;
  },
  act(S, me, t, a, P) {
    if (S.winner) return;
    if (t === 'tl') { if (S.n > 0) throw U.err('첫 차례 전에만 바꿀 수 있어요.'); S.tl = [0, 15, 30, 60].includes(+a.s) ? +a.s : 0; S.ts = Date.now(); return; }
    if (me !== S.turn) throw U.err('내 차례가 아니에요.');
    if (t === 'draw') { if (Array.isArray(a.p) && a.p.length === S.table.length) S.pos = autoPlace(a.p, S.table); drawFor(S, P, me); return; }
    if (t !== 'play') throw U.err('알 수 없는 행동이에요.');
    const raw = (a.t || []).map((s, i) => [(s || []).map(Number), (a.p || [])[i]]).filter(x => x[0].length), T = raw.map(x => x[0]);
    const all = T.flat(), seen = new Set();
    for (const id of all) { if (!(id >= 0 && id < 106) || seen.has(id)) throw U.err('타일이 이상해요. 다시 해 주세요.'); seen.add(id); }
    const old = S.table.flat(), hand = S.hand[me];
    for (const id of old) if (!seen.has(id)) throw U.err('바닥에 있던 타일은 손으로 가져갈 수 없어요.');
    const from = all.filter(id => !old.includes(id));
    for (const id of from) if (!hand.includes(id)) throw U.err('내 손에 없는 타일이 있어요.');
    if (!from.length) throw U.err('손에서 타일을 한 장 이상 내야 해요. 낼 게 없으면 "한 장 가져가기"!');
    const chk = T.map(check);
    const bad = chk.findIndex(x => !x); if (bad >= 0) throw U.err(`${bad + 1}번째 세트가 올바르지 않아요.`);
    if (!S.melded[me]) {
      // 등록 전: 기존 세트는 그대로, 새 세트는 내 타일로만, 합 30 이상
      const oldSig = S.table.map(s => s.slice().sort((x, y) => x - y).join(',')).sort().join('|');
      const keep = [], fresh = [];
      T.forEach((s, i) => (s.some(id => old.includes(id)) ? keep : fresh).push(i));
      const keepSig = keep.map(i => T[i].slice().sort((x, y) => x - y).join(',')).sort().join('|');
      if (keepSig !== oldSig) throw U.err('첫 등록 전에는 바닥 세트를 바꿀 수 없어요.');
      const pts = fresh.reduce((s, i) => s + chk[i].pts, 0);
      if (pts < 30) throw U.err(`첫 등록은 합이 30 이상이어야 해요(지금 ${pts}).`);
      S.melded[me] = true;
    }
    S.table = T.map((s, i) => chk[i].order); S.pos = autoPlace(raw.map(x => x[1]), S.table);
    S.hand[me] = hand.filter(id => !seen.has(id));
    S.pass = 0; S.last = {by: me, ids: from, n: S.n + 1};
    U.log(S, `${P[me].name}님이 타일 ${from.length}장을 냈어요.`);
    if (!S.hand[me].length) { S.winner = `${P[me].name}님 승리! 손패를 다 냈어요.`; S.wp = me; S.n++; return; }
    next(S, P);
  },
  view(S, me, ui, P) {
    if (isDOM) setTimeout(() => { mFx(S, me, P); rmSnapFx(ui); }, 0);
    return `<div class="rkbox2"><div class="rmw">${mBody(S, me, ui, P)}</div></div>`;
  },
  uiAct(ui, S, me, name, val) {
    const d = draft(ui, S, me);
    const where = id => { const hi = d.hand.indexOf(id); if (hi >= 0) return ['h', hi]; for (let i = 0; i < d.table.length; i++) { const j = d.table[i].indexOf(id); if (j >= 0) return ['t', i, j]; } return null; };
    const pull = () => { const ids = d.sel.slice(); d.sel = []; for (const id of ids) { const w = where(id); if (!w) continue; if (w[0] === 'h') d.hand.splice(w[1], 1); else d.table[w[1]].splice(w[2], 1); } return ids; };
    const clean = () => { if (!d.pos) d.pos = autoPlace(null, d.table); const k = d.table.map((s, i) => s.length ? i : -1).filter(i => i >= 0); d.table = k.map(i => d.table[i]); d.pos = autoPlace(k.map(i => d.pos[i]), d.table); };
    const oldSet = new Set(S.table.flat());
    if (name === 'rsel') { const id = +val; if (!S.melded[me] && oldSet.has(id)) { ui.rmsg = '첫 등록 전에는 바닥 타일을 옮길 수 없어요.'; return; } ui.rmsg = ''; const k = d.sel.indexOf(id); if (k >= 0) d.sel.splice(k, 1); else d.sel.push(id); return; }
    if (name === 'rnew') { if (!d.sel.length) return; const ids = pull(); d.table.push(ids); d.pos.push(null); clean(); return; }
    if (name === 'rto') { if (!d.sel.length) return; const tgt = d.table[+val]; const ids = pull(); if (tgt) tgt.push(...ids); else { d.table.push(ids); d.pos.push(null); } clean(); return; }
    if (name === 'rback') { const ids = d.sel.filter(id => !oldSet.has(id)); if (!ids.length) { ui.rmsg = '원래 바닥에 있던 타일은 손으로 못 가져와요.'; return; } d.sel = ids; d.hand.push(...pull()); clean(); return; }
    if (name === 'rreset') { ui.rk = null; return; }
    if (name === 'rsort') { ui.rsort = val; if (d) d.hand = sortHand(d.hand, val); return; }
    if (name === 'rclr') { d.sel = []; return; }
    if (name === 'rdrop') {
      const v = val || {}; let ids = (v.ids || []).map(Number).filter(id => where(id));
      if (!S.melded[me] && ids.some(id => oldSet.has(id))) { ui.rmsg = '첫 등록 전에는 바닥 타일을 옮길 수 없어요.'; return; }
      if (v.to === 'hand') { ids = ids.filter(id => !oldSet.has(id)); if (!ids.length) { ui.rmsg = '원래 바닥에 있던 타일은 손으로 못 가져와요.'; return; } }
      ui.rmsg = ''; if (!ids.length) return;
      d.sel = ids; const tgt = v.to === 'set' ? d.table[+v.i] : null; const moved = pull();
      if (tgt) { const at = v.before != null ? tgt.indexOf(+v.before) : -1; if (at >= 0) tgt.splice(at, 0, ...moved); else tgt.push(...moved); }
      else if (v.to === 'hand') d.hand.push(...moved);
      else { d.table.push(moved); d.pos.push(v.x != null ? [+v.x, +v.y] : null); }
      clean(); if (tgt) ui.rsnap = moved; else if (v.rep != null) ui.rrep = {ids: moved, dir: +v.dir || 1}; else ui.rsnap = moved; return;
    }
    if (name === 'rmove') {
      const v = val || {}, i = +v.i; if (!d.table[i]) return;
      const others = d.pos.map((q, j) => j === i ? null : q); others[i] = [+v.x, +v.y];
      const order = [i, ...d.table.map((_, j) => j).filter(j => j !== i)], placed = autoPlace(order.map(j => others[j]), order.map(j => d.table[j]));
      order.forEach((j, k) => { d.pos[j] = placed[k]; }); ui.rsnap = d.table[i].slice(); return;
    }
  },
  splash: true
};
function drawFor(S, P, me) {
  if (S.pool.length) { const id = S.pool.pop(); S.hand[me].push(id); S.pass = 0; U.log(S, `${P[me].name}님이 한 장 가져갔어요.`); S.last = {by: me, draw: 1, n: S.n + 1}; }
  else {
    S.pass++; U.log(S, `${P[me].name}님 넘김 (더미가 비었어요).`);
    if (S.pass >= P.length) {
      const sc = S.hand.map(handSum), mn = Math.min(...sc), w = sc.indexOf(mn);
      S.winner = `${P[w].name}님 승리! 남은 손패 합 ${mn}점이 가장 적어요.`; S.wp = w; S.n++; return;
    }
  }
  next(S, P);
}
function next(S, P) { S.turn = (S.turn + 1) % P.length; S.ts = Date.now(); S.n++; }
function sortHand(h, mode) { return h.slice().sort(mode === 'col' ? (a, b) => (isJ(a) - isJ(b)) || colOf(a) - colOf(b) || numOf(a) - numOf(b) : (a, b) => (isJ(a) - isJ(b)) || numOf(a) - numOf(b) || colOf(a) - colOf(b)); }
function draft(ui, S, me) {
  if (!ui.rk || ui.rk.n !== S.n || ui.rk.g !== S._g) ui.rk = {n: S.n, g: S._g, table: S.table.map(s => s.slice()), pos: autoPlace(S.pos, S.table), hand: sortHand(S.hand[me] || [], ui.rsort || 'num'), sel: []};
  return ui.rk;
}
const tile = (id, cls = '', attrs = '') => isJ(id) ? `<span class="rt j ${cls}" ${attrs}><b>☺</b></span>` : `<span class="rt c${colOf(id)} ${cls}" ${attrs}><b>${numOf(id)}</b><i></i></span>`;
function mBody(S, me, ui, P) {
  const my = me === S.turn && !S.winner;
  const d = me >= 0 ? draft(ui, S, me) : null;
  const oldSet = new Set(S.table.flat()), sel = new Set(d ? d.sel : []), lastSet = new Set(S.last && S.last.ids || []);
  const table = my ? d.table : S.table, pos = my ? d.pos : autoPlace(S.pos, S.table);
  // 상단: 사람들
  let h = `<header class="rm-top">${P.map((p, i) => `<div class="rm-p${i === S.turn && !S.winner ? ' on' : ''}${S.winner && S.wp === i ? ' win' : ''}" style="--pc:${U.pc(i)}"><span class="rm-av">${U.esc(Array.from(String(p.name || '?').replace(/^🤖/u, ''))[0] || '?')}</span><div><b>${U.nm(P, i)}${i === me ? ' <small>(나)</small>' : ''}</b><small>${S.melded[i] ? '✅ 등록함' : '첫 등록 전'}</small></div><span class="rm-cnt"><i></i>${S.hand[i].length}</span>${i === S.turn && !S.winner ? '<span class="om-turn">차례</span>' : ''}</div>`).join('')}<div class="rm-pool"><span class="rm-pile">${Array.from({length: Math.min(5, Math.ceil(S.pool.length / 15))}, () => '<i></i>').join('')}</span><b>${S.pool.length}</b><small>더미</small></div></header>`;
  const tm = S.tl && !S.winner ? (() => { if (!isDOM) return ''; const W = window; W.__rmT = W.__rmT || {}; const k = S._g + ':' + S.ts; const seen = W.__rmT[k] = W.__rmT[k] || Date.now(); rmTick(); const left = Math.max(0, S.tl - (Date.now() - seen) / 1000); return `<b class="om-clock${left <= Math.min(10, S.tl / 3) ? ' hurry' : ''}" data-seen="${seen}" data-len="${S.tl}">⏳ <span>${Math.ceil(left)}</span>초</b>`; })() : '';
  const msg = S.winner ? `🏆 ${U.esc(S.winner)}` : my ? (S.melded[me] ? '👉 내 차례! 타일을 끌어다 세트에 붙이거나 빈 곳에 놓아 새 세트를 만들어요' : '👉 내 차례! 내 타일로 합 30 이상을 첫 등록해요 (조커는 0점)') : `${U.nm(P, S.turn)}님 차례…`;
  const tools = S.n === 0 && !S.winner && me >= 0 ? `<span class="om-tl"><b>⏱ 한 차례 제한시간</b>${[0, 15, 30, 60].map(s => U.btn(s ? (s < 60 ? `${s}초` : '1분') : '없음', 'tl', {s}, 'sm' + (S.tl === s ? ' primary' : ''))).join('')}</span>` : '';
  h += `<div class="rm-msg${my ? ' me' : ''}${S.winner ? ' end' : ''}"><span>${msg}</span>${tm}${tools}</div>`;
  // 바닥
  const rows = Math.max(ROWS, ...pos.map(q => q[1] + 1));
  const sets = table.map((s, i) => { const c = check(s), ord = c ? c.order : partOrder(s); const fresh = my && !S.melded[me] && s.every(id => !oldSet.has(id)); return `<div class="rm-set ${s.length && !c ? 'bad' : 'ok'}${fresh ? ' fresh' : ''}" data-si="${i}" data-ids="${s.join(',')}" data-n="${s.length}" data-c="${pos[i][0]}" data-r="${pos[i][1]}" style="--c:${pos[i][0]};--r:${pos[i][1]}">${ord.map(id => my ? `<button type="button" class="rt-b" data-g="rsel" data-val="${id}" data-tid="${id}">${tile(id, (sel.has(id) ? 'sel ' : '') + (!oldSet.has(id) ? 'new ' : ''))}</button>` : `<span class="rt-s">${tile(id, lastSet.has(id) ? 'last' : '')}</span>`).join('')}${c && fresh ? `<em class="rm-pts">${c.pts}점</em>` : ''}</div>`; }).join('');
  const freshPts = my && !S.melded[me] ? table.filter(s => s.every(id => !oldSet.has(id))).reduce((sum, s) => { const c = check(s); return sum + (c ? c.pts : 0); }, 0) : 0;
  h += `<section class="rm-table"><div class="rm-felt${my ? ' mine' : ''}" data-rows="${rows}" style="--rows:${rows}">${sets ? '' : '<p class="rm-empty">아직 바닥이 비었어요. 첫 세트를 내 보세요!</p>'}<div class="rm-grid">${sets}</div>${my && sel.size ? `<button type="button" class="rm-newset" data-g="rnew">＋ 새 세트 만들기</button>` : ''}</div></section>`;
  // 손패와 버튼
  if (me >= 0 && d) {
    const hand = sortHand(my ? d.hand : S.hand[me], ui.rsort || 'num');
    const changed = my && (d.hand.length !== S.hand[me].length);
    const meldable = new Set(); if (!S.melded[me]) { const sets = findSets(S.hand[me]); if (sets.reduce((t, x) => t + check(x).pts, 0) >= 30) sets.flat().forEach(id => meldable.add(id)); }
    const allOk = my && d.table.every(s => check(s));
    h += `<section class="rm-hand"><header><b>🀄 내 타일 ${hand.length}장</b><span class="rm-sort">${U.ub('123 순', 'rsort', 'num', 'sm' + ((ui.rsort || 'num') === 'num' ? ' primary' : ''))}${U.ub('색깔 순', 'rsort', 'col', 'sm' + (ui.rsort === 'col' ? ' primary' : ''))}</span>${meldable.size ? '<span class="rm-hint">✨ 황금빛 타일로 첫 등록(조커 빼고 합 30↑) 가능!</span>' : ''}${!S.melded[me] && my ? `<span class="rm-meld${freshPts >= 30 ? ' ok' : ''}">첫 등록 ${freshPts}/30</span>` : ''}</header>
<div class="rm-rack" data-drop="hand">${hand.map((id, k) => my ? `<button type="button" class="rt-b" style="--k:${k}" data-g="rsel" data-val="${id}" data-tid="${id}">${tile(id, (sel.has(id) ? 'sel ' : '') + (meldable.has(id) ? 'meld' : ''))}</button>` : `<span class="rt-b" style="--k:${k}">${tile(id, meldable.has(id) ? 'meld' : '')}</span>`).join('')}</div>
${my ? `<div class="rm-acts">${sel.size ? `<button type="button" class="btn sm" data-g="rclr">선택 풀기 (${sel.size})</button><button type="button" class="btn sm" data-g="rback">↩ 손으로 되돌리기</button>` : ''}${changed || d.table.length !== S.table.length ? `<button type="button" class="btn sm ghost" data-g="rreset">↺ 처음부터</button>` : ''}${U.btn(changed ? (allOk ? '✅ 이대로 내기' : '세트를 올바르게 맞춰 주세요') : '낼 타일을 고르세요', 'play', {t: d.table, p: d.pos}, 'primary big rm-go', !changed || !allOk)}${U.btn(S.pool.length ? '🎴 한 장 가져가기' : '넘기기', 'draw', {p: d.table.length === S.table.length ? d.pos : null}, 'big rm-draw')}</div>${ui.rmsg ? `<p class="rm-warn">${U.esc(ui.rmsg)}</p>` : ''}` : ''}</section>`;
  }
  return h;
}
function rmTick() { const W = window; if (W.__rmTick) return; W.__rmTick = setInterval(() => document.querySelectorAll('.rmw .om-clock[data-seen]').forEach(e => { const l = Math.max(0, +e.dataset.len - (Date.now() - +e.dataset.seen) / 1000); const sp = e.querySelector('span'); if (sp) sp.textContent = Math.ceil(l); e.classList.toggle('hurry', l <= Math.min(10, +e.dataset.len / 3)); }), 250); }

/* ---------- 끌어서 놓기 ---------- */
const gridInfo = () => { const g = document.querySelector('.rmw .rm-grid'); if (!g) return null; const r = g.getBoundingClientRect(), cs = getComputedStyle(document.documentElement); return {r, cw: parseFloat(cs.getPropertyValue('--rmCW')) || r.width / COLS, rh: parseFloat(cs.getPropertyValue('--rmRH')) || 70, rows: +(document.querySelector('.rmw .rm-felt') || {}).dataset.rows || ROWS}; };
function bindDrag() {
  const box = document.querySelector('.rmw'); if (!box || box.__drag) return; box.__drag = 1;
  let dr = null;
  const target = (x, y) => {
    const el = document.elementFromPoint(x, y); if (!el) return null;
    const rk = el.closest('.rm-rack'); if (rk) return dr && dr.set != null ? null : {to: 'hand', el: rk};
    const f = el.closest('.rm-felt'); if (f) return {to: 'felt', el: f, st: el.closest('.rm-set[data-si]')};
    return null;
  };
  // 바닥에 놓을 때: 칸에 맞추고, 옆 세트와 붙을지(자석) 밀어낼지 결정
  const plan = (x, y, ids, stEl) => {
    const G2 = gridInfo(); if (!G2) return null; const k = ids.length;
    const row = Math.max(0, Math.min(G2.rows - 1, Math.floor((y - G2.r.top) / G2.rh)));
    const col = Math.max(0, Math.min(COLS - k, Math.round((x - G2.r.left) / G2.cw - k / 2)));
    let cand = stEl;
    if (!cand) for (const st of box.querySelectorAll('.rm-set[data-si]')) { const c = +st.dataset.c, n = +st.dataset.n; if (+st.dataset.r !== row) continue; if (col <= c + n && col + k - 1 >= c - 1) { cand = st; break; } }
    if (cand) {
      const rest = cand.dataset.ids.split(',').map(Number).filter(id => !ids.includes(id));
      if (!rest.length) return {g: 'rmove', v: {i: +cand.dataset.si, x: col, y: row}};
      const c = +cand.dataset.c, n = +cand.dataset.n, mid = c + n / 2, dir = (col + k / 2) < mid ? -1 : 1;
      if (compat(rest.concat(ids))) return {g: 'rdrop', v: {ids, to: 'set', i: +cand.dataset.si}, el: cand};
      return {g: 'rdrop', v: {ids, to: 'new', x: dir < 0 ? c - k - 1 : c + n + 1, y: row, rep: +cand.dataset.si, dir}, el: cand, bad: 1};
    }
    return {g: 'rdrop', v: {ids, to: 'new', x: col, y: row}};
  };
  box.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const b = e.target.closest('.rt-b[data-tid]');
    if (b) { const id = +b.dataset.tid, selIds = [...box.querySelectorAll('.rt.sel')].map(t => +t.closest('[data-tid]').dataset.tid); dr = {id, ids: selIds.includes(id) ? selIds : [id], x0: e.clientX, y0: e.clientY, b, on: false, pid: e.pointerId}; return; }
    const st = e.target.closest('.rm-felt.mine .rm-set[data-si]');
    if (st && !e.target.closest('button')) { const r = st.getBoundingClientRect(); dr = {set: +st.dataset.si, el: st, ids: [], ox: e.clientX - r.left, oy: e.clientY - r.top, x0: e.clientX, y0: e.clientY, on: false, pid: e.pointerId}; }
  });
  const clearHi = () => box.querySelectorAll('.drop,.magnet,.repel').forEach(x => x.classList.remove('drop', 'magnet', 'repel'));
  box.addEventListener('pointermove', e => {
    if (!dr) return;
    if (!dr.on) {
      if (Math.hypot(e.clientX - dr.x0, e.clientY - dr.y0) < 7) return;
      dr.on = true; try { box.setPointerCapture(dr.pid); } catch (er) {}
      const g = document.createElement('div');
      if (dr.set != null) { g.className = 'rm-ghost set'; g.innerHTML = [...dr.el.querySelectorAll('.rt')].map(t => t.outerHTML).join(''); dr.el.classList.add('lifted'); }
      else {
        g.className = 'rm-ghost';
        g.innerHTML = dr.ids.map(id => { const t = box.querySelector(`[data-tid="${id}"] .rt`); return t ? t.outerHTML : ''; }).join('');
        dr.ids.forEach(id => { const t = box.querySelector(`[data-tid="${id}"]`); if (t) t.classList.add('lifted'); });
      }
      document.body.appendChild(g); dr.g = g;
      if (window.SFX) window.SFX.play('flip');
    }
    if (dr.set != null) { dr.g.style.left = (e.clientX - dr.ox) + 'px'; dr.g.style.top = (e.clientY - dr.oy) + 'px'; }
    else { dr.g.style.left = e.clientX + 'px'; dr.g.style.top = e.clientY + 'px'; }
    const t = target(e.clientX, e.clientY); clearHi();
    if (!t) return;
    if (t.to === 'hand') { t.el.classList.add('drop'); return; }
    if (dr.set != null) return;
    const pl = plan(e.clientX, e.clientY, dr.ids, t.st);
    if (pl && pl.el) pl.el.classList.add(pl.bad ? 'repel' : 'magnet');
  });
  const end = e => {
    if (!dr) return; const d = dr; dr = null;
    if (!d.on) return;
    const gr = d.g.getBoundingClientRect(); d.g.remove();
    clearHi(); box.querySelectorAll('.lifted').forEach(x => x.classList.remove('lifted'));
    const swallow = ev => { ev.stopPropagation(); ev.preventDefault(); };
    window.addEventListener('click', swallow, true); setTimeout(() => window.removeEventListener('click', swallow, true), 40);
    if (e.type !== 'pointerup') return;
    const t = target(e.clientX, e.clientY); if (!t) return;
    let val;
    if (d.set != null) { if (t.to !== 'felt') return; const G2 = gridInfo(); if (!G2) return; val = {g: 'rmove', v: {i: d.set, x: Math.max(0, Math.round((gr.left - G2.r.left) / G2.cw)), y: Math.max(0, Math.min(G2.rows - 1, Math.round((gr.top - G2.r.top) / G2.rh)))}}; }
    else if (t.to === 'hand') val = {g: 'rdrop', v: {ids: d.ids, to: 'hand'}};
    else { val = plan(e.clientX, e.clientY, d.ids, t.st); if (!val) return; }
    const btn = document.createElement('button'); btn.type = 'button'; btn.hidden = true; btn.dataset.g = val.g;
    btn.dataset.val = JSON.stringify(val.v);
    box.appendChild(btn); setTimeout(() => btn.click(), 70);
  };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
}
/* 붙는 '착' / 밀려나는 '팅' 움직임 */
function rmSnapFx(ui) {
  if (!ui || (!ui.rsnap && !ui.rrep)) return;
  const W = window, f = document.querySelector('.rmw .rm-felt'); if (!f) return;
  if (ui.rsnap) {
    const ids = ui.rsnap; ui.rsnap = null;
    ids.forEach((id, k) => { const t = f.querySelector(`[data-tid="${id}"] .rt`); if (t && t.animate) t.animate([{transform: 'translateY(-10px) scale(1.18)', filter: 'brightness(1.25)'}, {transform: 'translateY(1px) scale(.96)', offset: .55}, {transform: 'none', filter: 'none'}], {duration: 260, delay: k * 25, easing: 'cubic-bezier(.3,1.5,.5,1)'}); });
    const st = ids.length && f.querySelector(`[data-tid="${ids[0]}"]`); const set = st && st.closest('.rm-set'); if (set && set.animate) set.animate([{boxShadow: 'inset 0 0 0 3px #FFE07A,0 0 22px rgba(255,224,122,.9)'}, {boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.12),0 0 0 rgba(0,0,0,0)'}], {duration: 520, easing: 'ease-out'});
    if (W.SFX) W.SFX.play('clack', 1);
  }
  if (ui.rrep) {
    const {ids, dir} = ui.rrep; ui.rrep = null; const G2 = gridInfo(), cw = G2 ? G2.cw : 40;
    const t = ids.length && f.querySelector(`[data-tid="${ids[0]}"]`), set = t && t.closest('.rm-set');
    if (set && set.animate) set.animate([{transform: `translateX(${-dir * cw * 1.1}px) scale(1.05)`}, {transform: `translateX(${dir * cw * .35}px) rotate(${dir * 4}deg)`, offset: .45}, {transform: `translateX(${-dir * 4}px)`, offset: .75}, {transform: 'none'}], {duration: 520, easing: 'cubic-bezier(.2,.9,.3,1)'});
    const fx = document.createElement('i'); fx.className = 'rm-zap'; if (set) { const r = set.getBoundingClientRect(); fx.style.left = (dir > 0 ? r.left : r.right) + 'px'; fx.style.top = (r.top + r.height / 2) + 'px'; document.body.appendChild(fx); setTimeout(() => fx.remove(), 600); }
    if (W.SFX) { W.SFX.play('no'); W.SFX.play('swish'); }
  }
}
/* 한 화면에 맞추기 + 칸 크기 정하기 */
function rmFit() {
  const w = document.querySelector('.rmw'); if (!w) return;
  const D = document.documentElement, f0 = w.querySelector('.rm-felt');
  if (!f0) return;
  { const h0 = f0.offsetHeight, room = window.innerHeight - D.scrollHeight; const nh = Math.max(220, Math.round(h0 + room - 2)); if (room < -1 || room > 3) D.style.setProperty('--rmF', nh + 'px'); }
  const fw = f0.clientWidth - 12, fh = f0.clientHeight - 12, rows = +f0.dataset.rows || ROWS;
  let cw = Math.min(fw / COLS, ((fh / rows) - 12) / 1.36 + 4, 52); cw = Math.max(18, Math.floor(cw * 10) / 10);
  const rh = Math.floor(((cw - 4) * 1.36 + 12) * 10) / 10;
  if (Math.abs((parseFloat(D.style.getPropertyValue('--rmCW')) || 0) - cw) > .2) { D.style.setProperty('--rmCW', cw + 'px'); D.style.setProperty('--rmRH', rh + 'px'); }
  if (!window.__rmFitR) { window.__rmFitR = 1; window.addEventListener('resize', () => { document.documentElement.style.removeProperty('--rmF'); rmFit(); }); }
}

/* ---------- 움직임 ---------- */
function mFx(S, me, P) {
  const W = window; W.__mfx = W.__mfx || {};
  bindDrag(); rmFit(); requestAnimationFrame(rmFit);
  const cur = {n: S.n, end: !!S.winner, last: S.last ? S.last.n : 0}, rec = W.__mfx[S._g]; W.__mfx[S._g] = cur;
  if (!rec || rec.n === cur.n || (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  const $ = q => document.querySelector(q);
  if (S.last && S.last.n !== rec.last) {
    if (S.last.draw) { const pile = $('.rm-pool'); if (pile && pile.animate) pile.animate([{transform: 'scale(1)'}, {transform: 'scale(1.15) rotate(-4deg)'}, {transform: 'none'}], {duration: 400}); if (W.SFX) W.SFX.play('flip'); }
    else { document.querySelectorAll('.rt.last').forEach((e, k) => e.animate && e.animate([{transform: 'translateY(-40px) scale(1.3) rotate(-10deg)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 480, delay: k * 60, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'backwards'})); if (W.SFX) W.SFX.play(S.last.by === me ? 'success' : 'coin'); }
  }
  if (!S.winner && S.turn === me && rec.n !== cur.n) { const m = $('.rm-msg'); if (m && m.animate) m.animate([{transform: 'scale(.94)'}, {transform: 'scale(1.03)'}, {transform: 'none'}], {duration: 420}); }
  if (cur.end && !rec.end) {
    const el = document.createElement('div'); el.className = 'omfx-banner rmfx' + (S.wp === me ? ' me' : '');
    el.innerHTML = `<b>${S.wp === me ? '🏆 루미큐브! 승리!' : `🏆 ${U.esc(P[S.wp].name)}님 승리!`}</b><small>${U.esc(S.winner)}</small>`;
    const w = $('.rmw'), wr = w && w.getBoundingClientRect(); if (wr) el.style.left = (wr.left + wr.width / 2) + 'px';
    document.body.appendChild(el);
    el.animate([{transform: 'translate(-50%,-50%) scale(.4)', opacity: 0}, {transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1, offset: .2}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .8}, {transform: 'translate(-50%,-60%) scale(.95)', opacity: 0}], {duration: 2800, fill: 'both'}).onfinish = () => el.remove();
    for (let i = 0; i < 70; i++) { const p = document.createElement('i'); p.className = 'omfx-c'; p.style.cssText = `left:${Math.random() * 100}vw;background:${['#E5484D', '#2A6FDB', '#F5A623', '#222', '#FFD54F'][i % 5]};border-radius:2px`; document.body.appendChild(p); p.animate([{transform: 'translateY(-10vh)'}, {transform: `translateY(110vh) rotate(${Math.random() * 720}deg)`}], {duration: 2200 + Math.random() * 1600, delay: Math.random() * 400}).onfinish = () => p.remove(); }
  }
}

/* ---------- AI ---------- */
function findSets(hand) {
  const left = hand.filter(id => !isJ(id)), out = [];
  const take = ids => { ids.forEach(id => left.splice(left.indexOf(id), 1)); out.push(ids); };
  // 런 먼저 (색별 연속)
  for (let c = 0; c < 4; c++) {
    let changed = true;
    while (changed) {
      changed = false;
      const by = {}; left.filter(id => colOf(id) === c).forEach(id => { if (by[numOf(id)] == null) by[numOf(id)] = id; });
      let run = [];
      for (let v = 1; v <= 14; v++) { if (by[v] != null) run.push(by[v]); else { if (run.length >= 3) { take(run); changed = true; break; } run = []; } }
    }
  }
  // 그룹
  for (let v = 1; v <= 13; v++) { const by = {}; left.filter(id => numOf(id) === v).forEach(id => { if (by[colOf(id)] == null) by[colOf(id)] = id; }); const g = Object.values(by); if (g.length >= 3) take(g); }
  // 조커로 두 장짜리 채우기
  const js = hand.filter(isJ);
  while (js.length) {
    let done = false;
    for (let c = 0; c < 4 && !done; c++) { const ns = left.filter(id => colOf(id) === c).sort((a, b) => numOf(a) - numOf(b)); for (let i = 0; i + 1 < ns.length; i++) { const d = numOf(ns[i + 1]) - numOf(ns[i]); if (d === 1 || d === 2) { const s = [ns[i], ns[i + 1], js.pop()]; if (check(s)) { s.forEach(id => { const k = left.indexOf(id); if (k >= 0) left.splice(k, 1); }); out.push(s); done = true; break; } else js.push(s[2]); } } }
    if (!done) break;
  }
  return out;
}
function mBot(S, P) {
  if (!S || S.winner) return false;
  const me = S.turn; if (!P[me] || !P[me].bot) return false;
  const hand = S.hand[me].slice(), sets = findSets(hand);
  let table = S.table.map(s => s.slice()), used = new Set();
  const pts = sets.reduce((s, x) => s + check(x).pts, 0);
  if (!S.melded[me] && pts < 30) { G.rummikub.act(S, me, 'draw', {}, P); return true; }
  sets.forEach(s => { table.push(s); s.forEach(id => used.add(id)); });
  if (S.melded[me]) {
    for (const id of hand) { if (used.has(id)) continue; for (const s of table) { for (const cand of [s.concat(id), [id].concat(s)]) { if (check(cand)) { s.splice(0, s.length, ...cand); used.add(id); break; } } if (used.has(id)) break; } }
  }
  if (!used.size) { G.rummikub.act(S, me, 'draw', {}, P); return true; }
  try { G.rummikub.act(S, me, 'play', {t: table, p: autoPlace(S.pos, S.table)}, P); } catch (e) { G.rummikub.act(S, me, 'draw', {}, P); }
  return true;
}
G.rummikub.botStep = mBot;
G.rummikub.botDelay = () => 1200;
G.rummikub.BOTNAMES = ['타일왕', '조커', '숫자박사', '런런'];
G.rummikub.check = check; G.rummikub.compat = compat;
})();
