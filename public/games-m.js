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
    return {kind: 'g', pts: num * n, order: rs.slice().sort((a, b) => colOf(a) - colOf(b)).concat(nj)};
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
    let pts = 0; for (let v = start; v <= end; v++) { order.push(by[v] != null ? by[v] : js.shift()); pts += v; }
    return {kind: 'r', pts, order};
  }
  return null;
}
const tval = id => isJ(id) ? 30 : numOf(id);
const handSum = h => h.reduce((s, id) => s + tval(id), 0);
G.rummikub = {
  name: '루미큐브', tag: '숫자 타일로 세트를 만들어 먼저 다 내기', min: 2, max: 4, mark: '🀄', hue: '#E8873A',
  rules: ['타일은 1~13 숫자 × 4가지 색 × 2벌, 그리고 조커 2장(106장). 각자 14장으로 시작해요.', '세트는 두 종류: ① 같은 숫자, 서로 다른 색 3~4장(그룹) ② 같은 색, 연속된 숫자 3장 이상(런). 조커는 어떤 타일 대신으로도 쓸 수 있어요.', '첫 등록: 내 타일로만 만든 세트들의 숫자 합이 30 이상이어야 내려놓을 수 있어요. 등록 전에는 바닥 세트를 건드릴 수 없어요.', '등록한 뒤에는 바닥 세트를 자유롭게 쪼개고 합쳐서 내 타일을 붙여요. 단, 차례가 끝날 때 바닥의 모든 세트가 올바라야 해요.', '낼 게 없으면 더미에서 한 장 가져가고 차례가 넘어가요.', '손패를 가장 먼저 다 내면 승리! 더미가 바닥나고 모두 한 바퀴 넘기면 손패 숫자 합이 가장 적은 사람이 승리(조커는 30점).', '조작: 타일을 눌러 고르고 → "새 세트" 또는 바닥 세트의 "+여기에"를 눌러 옮겨요. "내기"를 누르면 확정!'],
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
    if (t === 'tl') { if (S.n > 0) throw U.err('첫 차례 전에만 바꿀 수 있어요.'); S.tl = [0, 60, 120].includes(+a.s) ? +a.s : 0; S.ts = Date.now(); return; }
    if (me !== S.turn) throw U.err('내 차례가 아니에요.');
    if (t === 'draw') { drawFor(S, P, me); return; }
    if (t !== 'play') throw U.err('알 수 없는 행동이에요.');
    const T = (a.t || []).map(s => (s || []).map(Number)).filter(s => s.length);
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
    S.table = T.map((s, i) => chk[i].order);
    S.hand[me] = hand.filter(id => !seen.has(id));
    S.pass = 0; S.last = {by: me, ids: from, n: S.n + 1};
    U.log(S, `${P[me].name}님이 타일 ${from.length}장을 냈어요.`);
    if (!S.hand[me].length) { S.winner = `${P[me].name}님 승리! 손패를 다 냈어요.`; S.wp = me; S.n++; return; }
    next(S, P);
  },
  view(S, me, ui, P) {
    if (isDOM) setTimeout(() => mFx(S, me, P), 0);
    return `<div class="rkbox2"><div class="rkw">${mBody(S, me, ui, P)}</div></div>`;
  },
  uiAct(ui, S, me, name, val) {
    const d = draft(ui, S, me);
    const where = id => { const hi = d.hand.indexOf(id); if (hi >= 0) return ['h', hi]; for (let i = 0; i < d.table.length; i++) { const j = d.table[i].indexOf(id); if (j >= 0) return ['t', i, j]; } return null; };
    const pull = () => { const ids = d.sel.slice(); d.sel = []; for (const id of ids) { const w = where(id); if (!w) continue; if (w[0] === 'h') d.hand.splice(w[1], 1); else d.table[w[1]].splice(w[2], 1); } return ids; };
    const clean = () => { d.table = d.table.filter(s => s.length); };
    const oldSet = new Set(S.table.flat());
    if (name === 'rsel') { const id = +val; if (!S.melded[me] && oldSet.has(id)) { ui.rmsg = '첫 등록 전에는 바닥 타일을 옮길 수 없어요.'; return; } ui.rmsg = ''; const k = d.sel.indexOf(id); if (k >= 0) d.sel.splice(k, 1); else d.sel.push(id); return; }
    if (name === 'rnew') { if (!d.sel.length) return; const ids = pull(); d.table.push(ids); clean(); return; }
    if (name === 'rto') { if (!d.sel.length) return; const tgt = d.table[+val]; const ids = pull(); if (tgt) tgt.push(...ids); else d.table.push(ids); clean(); return; }
    if (name === 'rback') { const ids = d.sel.filter(id => !oldSet.has(id)); if (!ids.length) { ui.rmsg = '원래 바닥에 있던 타일은 손으로 못 가져와요.'; return; } d.sel = ids; d.hand.push(...pull()); clean(); return; }
    if (name === 'rreset') { ui.rk = null; return; }
    if (name === 'rsort') { ui.rsort = val; if (d) d.hand = sortHand(d.hand, val); return; }
    if (name === 'rclr') { d.sel = []; return; }
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
  if (!ui.rk || ui.rk.n !== S.n || ui.rk.g !== S._g) ui.rk = {n: S.n, g: S._g, table: S.table.map(s => s.slice()), hand: sortHand(S.hand[me] || [], ui.rsort || 'num'), sel: []};
  return ui.rk;
}
const tile = (id, cls = '', attrs = '') => isJ(id) ? `<span class="rt j ${cls}" ${attrs}><b>☺</b></span>` : `<span class="rt c${colOf(id)} ${cls}" ${attrs}><b>${numOf(id)}</b><i></i></span>`;
function mBody(S, me, ui, P) {
  const my = me === S.turn && !S.winner;
  const d = me >= 0 ? draft(ui, S, me) : null;
  const oldSet = new Set(S.table.flat()), sel = new Set(d ? d.sel : []), lastSet = new Set(S.last && S.last.ids || []);
  const table = my ? d.table : S.table;
  // 상단: 사람들
  let h = `<header class="rm-top">${P.map((p, i) => `<div class="rm-p${i === S.turn && !S.winner ? ' on' : ''}${S.winner && S.wp === i ? ' win' : ''}" style="--pc:${U.pc(i)}"><span class="rm-av">${U.esc(Array.from(String(p.name || '?').replace(/^🤖/u, ''))[0] || '?')}</span><div><b>${U.nm(P, i)}${i === me ? ' <small>(나)</small>' : ''}</b><small>${S.melded[i] ? '✅ 등록함' : '첫 등록 전'}</small></div><span class="rm-cnt"><i></i>${S.hand[i].length}</span>${i === S.turn && !S.winner ? '<span class="om-turn">차례</span>' : ''}</div>`).join('')}<div class="rm-pool"><span class="rm-pile">${Array.from({length: Math.min(5, Math.ceil(S.pool.length / 15))}, () => '<i></i>').join('')}</span><b>${S.pool.length}</b><small>더미</small></div></header>`;
  const tm = S.tl && !S.winner ? (() => { if (!isDOM) return ''; const W = window; W.__rmT = W.__rmT || {}; const k = S._g + ':' + S.ts; const seen = W.__rmT[k] = W.__rmT[k] || Date.now(); rmTick(); const left = Math.max(0, S.tl - (Date.now() - seen) / 1000); return `<b class="om-clock${left < 15 ? ' hurry' : ''}" data-seen="${seen}" data-len="${S.tl}">⏳ <span>${Math.ceil(left)}</span>초</b>`; })() : '';
  const msg = S.winner ? `🏆 ${U.esc(S.winner)}` : my ? (S.melded[me] ? '👉 내 차례! 세트를 만들거나 바닥 세트에 붙여요' : '👉 내 차례! 내 타일로 합 30 이상을 첫 등록해요') : `${U.nm(P, S.turn)}님 차례…`;
  h += `<div class="rm-msg${my ? ' me' : ''}${S.winner ? ' end' : ''}"><span>${msg}</span>${tm}</div>`;
  // 바닥
  const sets = table.map((s, i) => { const c = check(s), ord = c ? c.order : s; const fresh = my && !S.melded[me] && s.every(id => !oldSet.has(id)); return `<div class="rm-set ${s.length && !c ? 'bad' : 'ok'}${fresh ? ' fresh' : ''}" style="--k:${i}">${ord.map(id => my ? `<button type="button" class="rt-b" data-g="rsel" data-val="${id}">${tile(id, (sel.has(id) ? 'sel ' : '') + (!oldSet.has(id) ? 'new ' : '') + (lastSet.has(id) && !my ? 'last' : ''))}</button>` : tile(id, lastSet.has(id) ? 'last' : '')).join('')}${my && sel.size ? `<button type="button" class="rm-add" data-g="rto" data-val="${i}">+여기에</button>` : ''}${c && fresh ? `<em class="rm-pts">${c.pts}점</em>` : ''}</div>`; }).join('');
  const freshPts = my && !S.melded[me] ? table.filter(s => s.every(id => !oldSet.has(id))).reduce((sum, s) => { const c = check(s); return sum + (c ? c.pts : 0); }, 0) : 0;
  h += `<section class="rm-table"><div class="rm-felt">${sets || '<p class="rm-empty">아직 바닥이 비었어요. 첫 세트를 내 보세요!</p>'}${my && sel.size ? `<button type="button" class="rm-newset" data-g="rnew">＋ 새 세트 만들기</button>` : ''}</div></section>`;
  // 손패와 버튼
  if (me >= 0 && d) {
    const hand = sortHand(my ? d.hand : S.hand[me], ui.rsort || 'num');
    const changed = my && (d.hand.length !== S.hand[me].length);
    const allOk = my && d.table.every(s => check(s));
    h += `<section class="rm-hand"><header><b>🀄 내 타일 ${hand.length}장</b><span class="rm-sort">${U.ub('123 순', 'rsort', 'num', 'sm' + ((ui.rsort || 'num') === 'num' ? ' primary' : ''))}${U.ub('색깔 순', 'rsort', 'col', 'sm' + (ui.rsort === 'col' ? ' primary' : ''))}</span>${!S.melded[me] && my ? `<span class="rm-meld${freshPts >= 30 ? ' ok' : ''}">첫 등록 ${freshPts}/30</span>` : ''}</header>
<div class="rm-rack">${hand.map((id, k) => my ? `<button type="button" class="rt-b" style="--k:${k}" data-g="rsel" data-val="${id}">${tile(id, sel.has(id) ? 'sel' : '')}</button>` : `<span class="rt-b" style="--k:${k}">${tile(id)}</span>`).join('')}</div>
${my ? `<div class="rm-acts">${sel.size ? `<button type="button" class="btn sm" data-g="rclr">선택 풀기 (${sel.size})</button><button type="button" class="btn sm" data-g="rback">↩ 손으로 되돌리기</button>` : ''}${changed || d.table.length !== S.table.length ? `<button type="button" class="btn sm ghost" data-g="rreset">↺ 처음부터</button>` : ''}${U.btn(changed ? (allOk ? '✅ 이대로 내기' : '세트를 올바르게 맞춰 주세요') : '낼 타일을 고르세요', 'play', {t: d.table}, 'primary big rm-go', !changed || !allOk)}${U.btn(S.pool.length ? '🎴 한 장 가져가기' : '넘기기', 'draw', {}, 'big rm-draw')}</div>${ui.rmsg ? `<p class="rm-warn">${U.esc(ui.rmsg)}</p>` : ''}` : ''}</section>`;
  }
  if (S.n === 0 && !S.winner && me >= 0) h += `<div class="om-tools"><span class="om-tl"><b>⏱ 한 차례 제한시간</b>${[0, 60, 120].map(s => U.btn(s ? `${s / 60}분` : '없음', 'tl', {s}, 'sm' + (S.tl === s ? ' primary' : ''))).join('')}</span></div>`;
  return h;
}
function rmTick() { const W = window; if (W.__rmTick) return; W.__rmTick = setInterval(() => document.querySelectorAll('.rkw .om-clock[data-seen]').forEach(e => { const l = Math.max(0, +e.dataset.len - (Date.now() - +e.dataset.seen) / 1000); const sp = e.querySelector('span'); if (sp) sp.textContent = Math.ceil(l); e.classList.toggle('hurry', l < 15); }), 250); }

/* ---------- 움직임 ---------- */
function mFx(S, me, P) {
  const W = window; W.__mfx = W.__mfx || {};
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
    const w = $('.rkw'), wr = w && w.getBoundingClientRect(); if (wr) el.style.left = (wr.left + wr.width / 2) + 'px';
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
  try { G.rummikub.act(S, me, 'play', {t: table}, P); } catch (e) { G.rummikub.act(S, me, 'draw', {}, P); }
  return true;
}
G.rummikub.botStep = mBot;
G.rummikub.botDelay = () => 1200;
G.rummikub.BOTNAMES = ['타일왕', '조커', '숫자박사', '런런'];
G.rummikub.check = check;
})();
