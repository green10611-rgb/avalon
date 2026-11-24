(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;

/* =================== 노 터치 크라켄 =================== */
/* 규칙: 탐험대 vs 해골 해적단. 상자 카드(빈 상자·보물·크라켄)를 각자 받아 개수를 선언하고,
   선장(차례인 사람)이 다른 사람의 상자를 하나 열어요. 보물을 인원수만큼 모두 찾으면 탐험대 승리,
   크라켄이 나오거나 4라운드가 끝나면 해골 해적단 승리. */
const KROLE = {4: [3, 2], 5: [4, 2], 6: [4, 2], 7: [5, 3], 8: [6, 3]};
const kids = P => P.map((_, i) => i);
const KN = {E: '빈 상자', T: '보물', K: '크라켄'};

/* ---------- 보물상자 (그라데이션 SVG) ---------- */
const KDEF = `<defs><linearGradient id="kchw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C07A36"/><stop offset=".55" stop-color="#8A4F1E"/><stop offset="1" stop-color="#5A2F0E"/></linearGradient><linearGradient id="kchd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A3A14"/><stop offset="1" stop-color="#3E1F08"/></linearGradient><linearGradient id="kchg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3B8"/><stop offset=".45" stop-color="#E8B23A"/><stop offset="1" stop-color="#8A5800"/></linearGradient><radialGradient id="kchin" cx=".5" cy=".2" r=".9"><stop offset="0" stop-color="#2E1808"/><stop offset="1" stop-color="#0E0602"/></radialGradient></defs>`;
const RIV = (xs, y) => xs.map(x => `<circle cx="${x}" cy="${y}" r="1.8" fill="#FFF1B0" stroke="#8A5800" stroke-width=".6"/>`).join('');
// 몸통 (뚜껑 없음, 위가 열린 모양) — viewBox 0 0 120 70
const CH_BODY = `<svg viewBox="0 0 120 70" class="kch-body" aria-hidden="true">${KDEF}<ellipse cx="60" cy="9" rx="51" ry="8" fill="url(#kchin)"/><path d="M9 9h102v50a9 9 0 0 1-9 9H18a9 9 0 0 1-9-9z" fill="url(#kchw)" stroke="#3A1E08" stroke-width="2"/><path d="M9 30h102M9 49h102" stroke="#3A1E08" stroke-opacity=".45" stroke-width="1.4"/><path d="M12 20h20M40 40h26M76 22h22M14 58h18" stroke="#E7A962" stroke-opacity=".35" stroke-width="1.2" stroke-linecap="round"/><rect x="19" y="9" width="11" height="59" fill="url(#kchg)" stroke="#7A4D00" stroke-width=".8"/><rect x="90" y="9" width="11" height="59" fill="url(#kchg)" stroke="#7A4D00" stroke-width=".8"/>${RIV([24.5, 95.5], 20)}${RIV([24.5, 95.5], 40)}${RIV([24.5, 95.5], 60)}<rect x="6" y="5" width="108" height="8" rx="3.5" fill="url(#kchg)" stroke="#7A4D00" stroke-width=".8"/><rect x="49" y="11" width="22" height="24" rx="4" fill="url(#kchg)" stroke="#7A4D00" stroke-width="1"/><circle cx="60" cy="21" r="3.4" fill="#3A1E08"/><path d="M60 22v7" stroke="#3A1E08" stroke-width="2.6" stroke-linecap="round"/></svg>`;
// 닫힌 뚜껑 — viewBox 0 0 120 44
const CH_LID = `<svg viewBox="0 0 120 44" class="kch-lid" aria-hidden="true">${KDEF}<path d="M9 42V26Q9 3 60 3t51 23v16z" fill="url(#kchw)" stroke="#3A1E08" stroke-width="2"/><path d="M14 20Q30 8 60 7" stroke="#E7A962" stroke-opacity=".45" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M19 42V16Q22 9 30 6.5V42z" fill="url(#kchg)" stroke="#7A4D00" stroke-width=".8"/><path d="M101 42V16Q98 9 90 6.5V42z" fill="url(#kchg)" stroke="#7A4D00" stroke-width=".8"/>${RIV([24.5, 95.5], 24)}<rect x="6" y="36" width="108" height="8" rx="3.5" fill="url(#kchg)" stroke="#7A4D00" stroke-width=".8"/><path d="M53 36h14v10a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z" fill="url(#kchg)" stroke="#7A4D00"/></svg>`;
// 열린 뚜껑 안쪽 판 — viewBox 0 0 120 44
const CH_OPEN = `<svg viewBox="0 0 120 44" class="kch-open" aria-hidden="true">${KDEF}<path d="M8 44 16 4h88l8 40z" fill="url(#kchd)" stroke="#3A1E08" stroke-width="2"/><path d="M22 44 27 4h10l-3 40zM98 44 93 4H83l3 40z" fill="url(#kchg)" opacity=".85"/><path d="M14 26h92" stroke="#2A1404" stroke-opacity=".5"/><rect x="14" y="1" width="92" height="6" rx="3" fill="url(#kchg)" stroke="#7A4D00" stroke-width=".8"/></svg>`;
const KIN = {T: () => `${U.img('moneybag', 'kin-a')}${U.img('coin', 'kin-c c1')}${U.img('coin', 'kin-c c2')}${U.img('coin', 'kin-c c3')}${U.img('gem', 'kin-c c4')}`, K: () => U.img('octopus', 'kin-k'), E: () => `<span class="kin-e">텅…</span>`};
// 카드 앞면: 열린 상자 + 안에 든 것
const openChest = c => `<span class="kchs"><span class="kchs-open">${CH_OPEN}</span><span class="kchs-in">${KIN[c]()}</span><span class="kchs-body">${CH_BODY}</span></span>`;

/* ---------- 카드 그림 ---------- */
const ART = {
  back: `<svg viewBox="0 0 100 140" aria-hidden="true"><defs><linearGradient id="kbw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E4E79"/><stop offset="1" stop-color="#0D2338"/></linearGradient></defs><rect x="2" y="2" width="96" height="136" rx="10" fill="url(#kbw)" stroke="#E6C47A" stroke-width="3"/><rect x="9" y="9" width="82" height="122" rx="6" fill="none" stroke="#E6C47A" stroke-width="1.2" stroke-dasharray="3 3" opacity=".7"/><g fill="none" stroke="#7FB8E0" stroke-width="1.5" opacity=".5"><path d="M10 100q10-8 20 0t20 0 20 0 20 0"/><path d="M10 112q10-8 20 0t20 0 20 0 20 0"/><path d="M10 124q10-8 20 0t20 0 20 0 20 0"/></g><circle cx="50" cy="58" r="24" fill="#0B1C2D" stroke="#E6C47A" stroke-width="2"/><path d="M50 38l4 14h-8zM50 78l-4-14h8zM30 58l14-4v8zM70 58l-14 4v-8z" fill="#E6C47A"/><circle cx="50" cy="58" r="3" fill="#E6C47A"/></svg>`,
  E: `<span class="kcard kE">${openChest('E')}<b>빈 상자</b></span>`,
  T: `<span class="kcard kT"><span class="kc-rays"></span>${openChest('T')}<b>보물!</b></span>`,
  K: `<span class="kcard kK"><span class="kc-rays"></span>${openChest('K')}<b>크라켄!</b></span>`,
  ex: `<span class="krole-pic g">${U.img('compass')}</span>`,
  sk: `<span class="krole-pic e">${U.img('skullx')}</span>`
};
const card = (c, cls = '') => `<span class="kc kc-${c} ${cls}">${ART[c === 'B' ? 'back' : c]}</span>`;

function deal(S, P, per) {
  const deck = U.shuffle(S.pool.slice());
  S.pool = [];
  S.hand = kids(P).map(i => deck.slice(i * per, i * per + per));
}
G.kraken = {
  name: '노 터치 크라켄', tag: '보물 상자를 열어라! 단, 크라켄은 건드리지 마', min: 4, max: 8, mark: '🐙', hue: '#1E4E79',
  rules: ['탐험대와 해골 해적단으로 나뉘어요. 처음에 각자 몰래 내 정체 카드를 확인해요.',
    '상자 카드에는 빈 상자, 보물(인원수만큼), 크라켄(1장)이 있어요. 1라운드에 5장씩 받고, 라운드마다 1장씩 줄어요.',
    '받은 상자를 몰래 보고 보물과 크라켄이 몇 개인지 말해요(선언). 거짓말해도 돼요! 확인이 끝나면 상자가 섞여서 나도 어디에 뭐가 있는지 몰라요.',
    '선장(차례인 사람)은 다른 사람 앞의 상자 하나를 골라 열어요. 상자를 열린 사람이 다음 선장이 돼요.',
    '한 라운드에 인원수만큼 상자를 열면 라운드가 끝나요. 남은 상자를 모두 섞어 다시 나눠요.',
    '보물을 모두 찾으면 탐험대 승리! 크라켄이 나오거나 4라운드가 끝나도 보물을 다 못 찾으면 해골 해적단 승리.'],
  rulesExtra() {
    return `<section class="kroles"><div class="krole g">${ART.ex}<b>탐험대</b><p>보물 상자를 모두 찾아야 해요. 크라켄은 절대 건드리지 마세요!</p></div><div class="krole e">${ART.sk}<b>해골 해적단</b><p>크라켄을 깨우거나, 4라운드가 끝날 때까지 보물 찾기를 방해하면 이겨요.</p></div></section>`;
  },
  setup(P) {
    const n = P.length; if (!KROLE[n]) throw U.err('4~8명이 필요해요.');
    const [g, e] = KROLE[n];
    const roles = U.shuffle(Array(g).fill('X').concat(Array(e).fill('S'))).slice(0, n);
    // 남는 정체 카드는 아무도 모르게 빼요(7명: 탐험대5+해골3 중 7장)
    const pool = Array(4 * n - 1).fill('E').concat(Array(n).fill('T'), ['K']);
    const S = {_g: Math.random().toString(36).slice(2, 10), role: roles, pool, round: 1, act: U.rint(n), opened: 0, found: 0,
      revealed: [], decl: {}, seen: {}, phase: 'look', log: ['정체 카드를 받았어요. 몰래 확인하세요.'], last: null};
    deal(S, P, 5);
    return S;
  },
  turns(S, P) {
    if (S.phase === 'look') return kids(P).filter(i => !S.seen[i]);
    if (S.phase === 'decl') return kids(P).filter(i => S.decl[i] == null);
    if (S.phase === 'pick') return [S.act];
    if (S.phase === 'shown' || S.phase === 'rend') return [S.act];
    return [];
  },
  open(S) { return S.phase === 'shown' || S.phase === 'rend' || S.phase === 'pick'; },
  allTurn(S) { return S.phase === 'shown' ? '상자 공개!' : S.phase === 'rend' ? '라운드 끝' : S.phase === 'decl' ? '모두 선언하기' : ''; },
  splash: true,
  act(S, me, t, a, P) {
    const n = P.length;
    if (t === 'seen') { if (S.phase !== 'look') return; S.seen[me] = true; if (kids(P).every(i => S.seen[i])) { S.phase = 'decl'; U.log(S, `${S.round}라운드! 받은 상자를 보고 선언하세요.`); } return; }
    if (t === 'decl') {
      if (S.phase !== 'decl') throw U.err('지금은 선언할 수 없어요.');
      if (S.decl[me] != null) throw U.err('이미 선언했어요.');
      const per = S.hand[me].length, tr = Math.max(0, Math.min(per, +a.t || 0)), kr = a.k ? 1 : 0;
      if (tr + kr > per) throw U.err(`상자는 ${per}개뿐이에요.`);
      S.decl[me] = {t: tr, k: kr};
      S.hand[me] = U.shuffle(S.hand[me].slice());   // 선언하고 나면 섞여서 위치를 몰라요
      if (kids(P).every(i => S.decl[i] != null)) { S.phase = 'pick'; U.log(S, `선장 ${P[S.act].name}님이 상자를 열 차례예요.`); }
      return;
    }
    if (t === 'open') {
      if (S.phase !== 'pick' || me !== S.act) throw U.err('선장만 상자를 열 수 있어요.');
      const p = +a.p, k = +a.k;
      if (p === me) throw U.err('내 상자는 열 수 없어요.');
      if (!(p >= 0 && p < n) || !S.hand[p] || !(k >= 0 && k < S.hand[p].length)) throw U.err('그 상자는 열 수 없어요.');
      const c = S.hand[p].splice(k, 1)[0];
      S.revealed.push({c, from: p, by: me, round: S.round});
      S.opened++; if (c === 'T') S.found++;
      S.last = {c, from: p, by: me, n: S.revealed.length};
      U.log(S, `${P[me].name}님이 ${P[p].name}님의 상자를 열었어요: ${KN[c]}${c === 'T' ? ` (${S.found}/${n})` : ''}`);
      S.act = p;
      if (c === 'K') { S.pend = 'K'; }
      else if (S.found >= n) { S.pend = 'T'; }
      else if (S.opened >= n) { S.pend = S.round >= 4 ? 'R4' : 'R'; }
      else S.pend = null;
      S.phase = 'shown'; return;
    }
    if (t === 'next') {
      if (S.phase === 'shown') {
        const pd = S.pend; S.pend = null;
        if (pd === 'K') { S.phase = 'end'; S.wt = 'K'; S.winner = '크라켄이 깨어났어요! 해골 해적단 승리.'; return; }
        if (pd === 'T') { S.phase = 'end'; S.wt = 'T'; S.winner = '보물을 모두 찾았어요! 탐험대 승리.'; return; }
        if (pd === 'R4') { S.phase = 'end'; S.wt = 'R4'; S.winner = '4라운드가 끝났어요. 보물을 다 못 찾아 해골 해적단 승리.'; return; }
        if (pd === 'R') { S.phase = 'rend'; return; }
        S.phase = 'pick'; return;
      }
      if (S.phase === 'rend') {
        S.round++; S.opened = 0;
        S.pool = [].concat(...S.hand); deal(S, P, 6 - S.round);
        S.decl = {}; S.phase = 'decl'; S.last = null;
        U.log(S, `${S.round}라운드 시작! 상자를 다시 섞어 ${6 - S.round}개씩 나눴어요.`); return;
      }
    }
  },
  view(S, me, ui, P) { if (typeof document !== 'undefined') setTimeout(() => kFx(S, me, P), 0); return `<div class="kw">${G.kraken._view.call(this, S, me, ui, P)}</div>`; },
  _view(S, me, ui, P) {
    const n = P.length, end = S.phase === 'end' || S.winner, mine = end ? false : this.turns(S, P).includes(me);
    const shared = ui._local && ['shown', 'rend', 'pick'].includes(S.phase);
    let h = '';
    // 위: 진행판
    h += `<section class="kbar"><div class="kb-r"><small>라운드</small><b>${Math.min(S.round, 4)}<i>/4</i></b></div><div class="kb-t"><small>찾은 보물</small><div class="kb-gold">${Array.from({length: n}, (_, i) => `<span class="${i < S.found ? 'on' : ''}">${i < S.found ? '💰' : ''}</span>`).join('')}</div></div><div class="kb-r"><small>이번 라운드</small><b>${S.opened}<i>/${n}</i></b></div></section>`;
    if (end) return h + kEnd(S, P) + kTable(S, me, P, false, ui);
    // 내 정체
    if (me >= 0 && S.phase === 'look' && !S.seen[me]) {
      const r = S.role[me];
      h += `<section class="krc ${ui.kdrawn ? '' : 'back'}">${ui.kdrawn ? `<div class="krc-art">${r === 'X' ? ART.ex : ART.sk}</div><small>나의 정체</small><b>${r === 'X' ? '탐험대' : '해골 해적단'}</b><p>${r === 'X' ? '보물 상자를 모두 찾으세요. 크라켄은 절대 열지 마세요!' : '정체를 숨기고 크라켄을 깨우거나, 보물 찾기를 방해하세요.'}</p>${U.btn('확인했어요', 'seen', {}, 'primary big avgo avseen')}` : `<div class="krc-art">${ART.back}</div><b>정체 카드를 뒤집어 보세요</b><p>남에게 안 보이게!</p>${U.gb('🃏 정체 확인하기', 'kdraw', 1, 'primary big avgo')}`}</section>`;
    } else if (me >= 0 && !shared) {
      const r = S.role[me];
      h += `<section class="avmy${ui.kpeek ? ' open' : ''}">${ui.kpeek ? `<div class="kmy"><div class="krc-art sm">${r === 'X' ? ART.ex : ART.sk}</div><div><small>나의 정체</small><b>${r === 'X' ? '탐험대' : '해골 해적단'}</b>${S.hand[me] && S.phase !== 'look' ? `<small>내 상자: ${kCount(S.hand[me])}</small>` : ''}</div></div>` : ''}<div class="avmy-bar"><span class="avmy-c">🃏</span><div><b>내 정체 · 내 상자</b><small>${ui.kpeek ? '다 봤으면 숨겨 주세요' : '남에게 안 보이게 확인하세요'}</small></div>${U.ub(ui.kpeek ? '🙈 숨기기' : '👁 보기', 'kpeek', true, ui.kpeek ? 'avmy-btn' : 'primary avmy-btn')}</div></section>`;
    }
    if (S.phase === 'look') {
      if (!(me >= 0 && !S.seen[me])) h += `<div class="avwait"><div>🃏 정체 확인 중</div><span>아직 ${kids(P).filter(i => !S.seen[i]).length}명이 확인하고 있어요</span></div>`;
    } else if (S.phase === 'decl') {
      if (me >= 0 && S.decl[me] == null && !ui._local) h += kDeclForm(S, me, ui, P);
      else if (ui._local && mine) h += kDeclForm(S, me, ui, P);
      else h += `<div class="avwait"><div>📣 선언하는 중</div><span>${kids(P).filter(i => S.decl[i] != null).length} / ${n}명이 선언했어요</span></div>`;
    } else if (S.phase === 'shown') {
      h += kShown(S, me, P);
    } else if (S.phase === 'rend') {
      h += `<section class="kround"><small>${S.round}라운드 끝</small><b>상자를 다시 섞어요</b><p>열리지 않은 상자를 모두 모아 섞은 뒤, 한 사람에 ${5 - S.round}개씩 다시 나눠요.<br>보물 ${S.found}/${n}개 찾음 · 남은 라운드 ${4 - S.round}번</p>${me >= 0 ? U.btn(`🌊 ${S.round + 1}라운드 시작하기`, 'next', {}, 'primary big avgo') : ''}<small class="muted">누구든 한 명이 누르면 모두 넘어가요</small></section>`;
    } else if (S.phase === 'pick') {
      h += `<div class="kturn ${S.act === me ? 'me' : ''}"><span class="kt-ic">🧭</span><div><small>지금 선장</small><b>${U.nm(P, S.act)}${S.act === me ? ' (나)' : ''}</b></div><span class="kt-tag">${S.act === me ? '다른 사람의 상자를 하나 고르세요!' : '어떤 상자를 열지 고르는 중…'}</span></div>`;
    }
    h += kTable(S, me, P, S.phase === 'pick' && S.act === me, ui);
    h += kRevealed(S, P);
    return h;
  },
  uiAct(ui, S, me, name, val) {
    if (name === 'kdraw') { ui.kdrawn = true; return; }
    if (name === 'kt') { ui.kt = Math.max(0, Math.min(5, (ui.kt || 0) + val)); return; }
    if (name === 'kk') { ui.kk = !ui.kk; return; }
  }
};
/* ---------- 움직임 (화면 구성은 그대로, 효과만) ---------- */
function kFx(S, me, P) {
  const W = window; W.__kfx = W.__kfx || {};
  const gid = S._g || '';
  const cur = {ph: S.phase, n: S.last ? S.last.n : 0, round: S.round, act: S.act, dc: Object.keys(S.decl || {}).sort().join(','), found: S.found, end: !!S.winner};
  const rec = W.__kfx[gid]; W.__kfx[gid] = cur;
  if (!rec || !document.querySelector('.kw')) return;
  if (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = q => document.querySelector(q), seat = i => $(`.kw [data-ks="${i}"]`);
  const box = () => $('.kw');
  if (cur.ph !== rec.ph) {
    document.querySelectorAll('.kw > section, .kw > div').forEach((e, k) => e.animate && e.animate([{opacity: 0, transform: 'translateY(14px) scale(.98)'}, {opacity: 1, transform: 'none'}], {duration: 450, delay: Math.min(k, 6) * 60, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'backwards'}));
    const B = cur.ph === 'decl' ? [`📣 ${S.round}라운드 선언`, '내 상자를 보고 보물·크라켄 개수를 말해요', 'b'] : cur.ph === 'pick' && rec.ph === 'decl' ? ['🧭 탐험 시작!', `선장 ${U.nm(P, S.act)}님부터 상자를 열어요`, 'g'] : cur.ph === 'rend' ? ['🌊 라운드 끝', '남은 상자를 섞어 다시 나눠요', 'b'] : null;
    if (B) setTimeout(() => banner(B[0], B[1], B[2]), 120);
    if (cur.ph === 'decl' && cur.round !== rec.round || cur.ph === 'decl' && rec.ph === 'look') deal();
    if (cur.ph === 'rend') document.querySelectorAll('.ktable .kc').forEach((e, k) => e.animate && e.animate([{transform: 'none'}, {transform: `translate(${(Math.random() - .5) * 30}px,${(Math.random() - .5) * 16}px) rotate(${(Math.random() - .5) * 40}deg)`}, {transform: 'none'}], {duration: 700, delay: k * 25, easing: 'ease-in-out'}));
  }
  if (cur.dc !== rec.dc && cur.ph === 'decl') {
    const before = new Set((rec.ph === 'decl' ? rec.dc : '').split(',').filter(Boolean));
    cur.dc.split(',').filter(x => x && !before.has(x)).forEach(x => pop($(`.kw [data-ks="${x}"] .ks-d`)));
  }
  if (cur.n !== rec.n && S.last && cur.ph === 'shown') {
    const L = S.last;
    fly(`<span class="kfx-card">${ART.back}</span>`, seat(L.from), $('.kchx') || $('.kshow'), {w: 52, h: 73, dur: 600, lift: -40, rot: 10});
    if (L.by !== L.from) fly('<span class="kfx-comp">🧭</span>', seat(L.by), seat(L.from), {w: 44, h: 44, dur: 900, delay: 300, lift: -70, rot: 360, done: () => pop(seat(L.from))});
    setTimeout(() => {
      const fx = $('.kchx-body') || $('.kshow');
      if (L.c === 'T') { treasure(fx); burst(fx, ['#F5C542', '#FFE38A', '#FFFFFF', '#E3A92F'], 44, 'coin'); }
      else if (L.c === 'K') { kraken(fx); burst(fx, ['#3B0D3A', '#7A1E6B', '#1A0A20', '#C8323A'], 36); }
      else burst(fx, ['#D9CDB4', '#BFB39A', '#EEE5D0'], 16, 'dust');
    }, 1400);
    if (L.c === 'T' || L.c === 'K') setTimeout(() => { const c = $('.kchx'); if (c && c.animate) c.animate([{transform: 'none'}, {transform: 'translateX(-5px) rotate(-3deg)'}, {transform: 'translateX(5px) rotate(3deg)'}, {transform: 'translateX(-7px) rotate(-4deg) scale(1.03)'}, {transform: 'translateX(7px) rotate(4deg) scale(1.05)'}, {transform: 'none'}], {duration: 420, easing: 'ease-in-out'}); }, 260);
  }
  if (cur.end && !rec.end) setTimeout(() => confetti(S.wt === 'T'), 600);

  function layer(cls, html) { const el = document.createElement('div'); el.className = cls; if (html) el.innerHTML = html; document.body.appendChild(el); return el; }
  function treasure(src) {
    const f = layer('kfx-goldflash'); f.animate([{opacity: 0}, {opacity: .95, offset: .12}, {opacity: 0}], {duration: 900, easing: 'ease-out', fill: 'both'}).onfinish = () => f.remove();
    const r = layer('kfx-rays'); r.animate([{opacity: 0, transform: 'translate(-50%,-50%) rotate(0) scale(.4)'}, {opacity: .9, transform: 'translate(-50%,-50%) rotate(40deg) scale(1.1)', offset: .25}, {opacity: 0, transform: 'translate(-50%,-50%) rotate(140deg) scale(1.4)'}], {duration: 2600, easing: 'ease-out', fill: 'both'}).onfinish = () => r.remove();
    const sh = box(); if (sh && sh.animate) sh.animate([{transform: 'scale(1)'}, {transform: 'scale(1.025)', filter: 'brightness(1.18) saturate(1.2)'}, {transform: 'scale(1)'}], {duration: 600, easing: 'cubic-bezier(.3,1.6,.5,1)'});
    const a = src && src.getBoundingClientRect(); if (!a) return;
    const cx = a.left + a.width / 2, cy = a.top + a.height * .3, gold = $('.kb-gold'), g = gold && gold.getBoundingClientRect();
    for (let k = 0; k < 26; k++) {
      const c = layer('kfx-coin', U.img('coin', '', '')), vx = (Math.random() - .5) * 520, up = 180 + Math.random() * 260, sz = 26 + Math.random() * 26;
      c.style.cssText = `left:${cx - sz / 2}px;top:${cy - sz / 2}px;width:${sz}px;height:${sz}px`;
      const toGold = g && k < 8, ex = toGold ? g.left + g.width * (k + .5) / 8 - cx : vx * 1.3, ey = toGold ? g.top + g.height / 2 - cy : innerHeight - cy + 80;
      c.animate([{transform: 'translate(0,0) scale(.3) rotateY(0)', opacity: 0}, {transform: `translate(${vx * .6}px,${-up}px) scale(1.15) rotateY(540deg)`, opacity: 1, offset: .4}, {transform: `translate(${ex}px,${ey}px) scale(${toGold ? .5 : .9}) rotateY(1080deg)`, opacity: toGold ? .2 : 0}], {duration: 1300 + Math.random() * 600, delay: k * 28, easing: 'cubic-bezier(.25,.6,.4,1)', fill: 'both'}).onfinish = () => c.remove();
    }
    setTimeout(() => { pop($('.kb-gold')); const s = $('.kb-gold span.on:last-of-type') || $('.kb-gold'); pop(s); }, 1100);
    for (let k = 0; k < 14; k++) {
      const s = layer('kfx-spark'); s.style.cssText = `left:${cx + (Math.random() - .5) * 260}px;top:${cy + (Math.random() - .5) * 160}px`;
      s.animate([{transform: 'scale(0) rotate(0)', opacity: 0}, {transform: 'scale(1.3) rotate(90deg)', opacity: 1, offset: .4}, {transform: 'scale(0) rotate(180deg)', opacity: 0}], {duration: 900, delay: 200 + Math.random() * 900, fill: 'both'}).onfinish = () => s.remove();
    }
  }
  function kraken(src) {
    const f = layer('kfx-redflash'); f.animate([{opacity: 0}, {opacity: .9, offset: .08}, {opacity: .15, offset: .3}, {opacity: .7, offset: .42}, {opacity: 0}], {duration: 1300, fill: 'both'}).onfinish = () => f.remove();
    ink();
    const v = layer('kfx-vign'); v.animate([{opacity: 0}, {opacity: 1, offset: .15}, {opacity: .8, offset: .8}, {opacity: 0}], {duration: 2600, fill: 'both'}).onfinish = () => v.remove();
    const b = box(); if (b && b.animate) b.animate([{transform: 'none'}, {transform: 'translate(-16px,8px) rotate(-1.5deg) scale(1.02)'}, {transform: 'translate(14px,-8px) rotate(1.5deg)'}, {transform: 'translate(-12px,5px) rotate(-1deg)'}, {transform: 'translate(9px,-3px)'}, {transform: 'translate(-5px,2px)'}, {transform: 'none'}], {duration: 750, iterations: 2, easing: 'ease-in-out'});
    const big = layer('kfx-octo', U.img('octopus', '', '')); big.animate([{transform: 'translate(-50%,60vh) scale(.6) rotate(-8deg)', opacity: 0}, {transform: 'translate(-50%,8vh) scale(1.15) rotate(4deg)', opacity: 1, offset: .35}, {transform: 'translate(-50%,12vh) scale(1.1) rotate(-3deg)', opacity: 1, offset: .7}, {transform: 'translate(-50%,70vh) scale(.9) rotate(6deg)', opacity: 0}], {duration: 2400, easing: 'cubic-bezier(.3,1.2,.5,1)', fill: 'both'}).onfinish = () => big.remove();
    for (let k = 0; k < 6; k++) {
      const t = layer('kfx-arm'); const left = k < 3; t.style.cssText = `${left ? 'left' : 'right'}:${-4 + (k % 3) * 9}vw;bottom:-10vh;height:${48 + Math.random() * 25}vh;--r:${left ? 1 : -1}`;
      t.animate([{transform: `translateY(100%) rotate(${left ? -10 : 10}deg)`}, {transform: `translateY(8%) rotate(${left ? 14 : -14}deg)`, offset: .35}, {transform: `translateY(14%) rotate(${left ? 4 : -4}deg)`, offset: .7}, {transform: `translateY(105%) rotate(${left ? 18 : -18}deg)`}], {duration: 2300, delay: k * 70, easing: 'ease-in-out', fill: 'both'}).onfinish = () => t.remove();
    }
  }
  function deal() {
    document.querySelectorAll('.ktable .ks-c .kc').forEach((e, k) => e.animate && e.animate([{transform: 'translateY(-60px) rotate(-25deg) scale(.6)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 420, delay: 200 + k * 45, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'backwards'}));
  }
  function pop(e) { if (e && e.animate) e.animate([{transform: 'scale(1)'}, {transform: 'scale(1.2)', filter: 'brightness(1.25)'}, {transform: 'scale(1)'}], {duration: 420, easing: 'cubic-bezier(.3,1.6,.5,1)'}); }
  function shake(e) { if (e && e.animate) e.animate([{transform: 'none'}, {transform: 'translate(-10px,4px) rotate(-1deg)'}, {transform: 'translate(10px,-4px) rotate(1deg)'}, {transform: 'translate(-6px,2px)'}, {transform: 'none'}], {duration: 500, iterations: 2}); }
  function ink() {
    const el = document.createElement('div'); el.className = 'kfx-ink'; document.body.appendChild(el);
    el.animate([{opacity: 0, transform: 'scale(.2)'}, {opacity: .92, transform: 'scale(1.1)', offset: .3}, {opacity: .85, transform: 'scale(1.2)', offset: .7}, {opacity: 0, transform: 'scale(1.4)'}], {duration: 1800, easing: 'ease-out', fill: 'both'}).onfinish = () => el.remove();
    for (let k = 0; k < 8; k++) {
      const t = document.createElement('div'); t.className = 'kfx-tent'; t.textContent = '🐙';
      t.style.cssText = `left:${10 + Math.random() * 80}vw;top:${60 + Math.random() * 30}vh;font-size:${36 + Math.random() * 40}px`;
      document.body.appendChild(t);
      t.animate([{transform: 'translateY(120px) rotate(-20deg)', opacity: 0}, {transform: 'translateY(-40px) rotate(10deg)', opacity: 1, offset: .5}, {transform: 'translateY(-90px) rotate(-10deg)', opacity: 0}], {duration: 1600, delay: k * 90, easing: 'ease-out', fill: 'both'}).onfinish = () => t.remove();
    }
  }
  function fly(html, src, dst, o) {
    if (!src || !dst) { if (o.done) o.done(); return; }
    const a = src.getBoundingClientRect(), b = dst.getBoundingClientRect(); if (!a.width || !b.width) return;
    const el = document.createElement('div'); el.className = 'kfx-fly'; el.innerHTML = html;
    el.style.cssText = `left:${a.left + a.width / 2 - o.w / 2}px;top:${a.top + a.height / 2 - o.h / 2}px;width:${o.w}px;height:${o.h}px`;
    document.body.appendChild(el);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    el.animate([{transform: 'translate(0,0) scale(.6)', opacity: 0}, {transform: 'translate(0,-10px) scale(1.1)', opacity: 1, offset: .15},
      {transform: `translate(${dx / 2}px,${dy / 2 + (o.lift || -60)}px) scale(1.3) rotate(${(o.rot || 0) / 2}deg)`, opacity: 1, offset: .55},
      {transform: `translate(${dx}px,${dy}px) scale(1) rotate(${o.rot || 0}deg)`, opacity: .2}],
    {duration: o.dur || 800, delay: o.delay || 0, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both'}).onfinish = () => { el.remove(); if (o.done) o.done(); };
  }
  function banner(big, small, kind) {
    document.querySelectorAll('.kfx-banner').forEach(e => e.remove());
    const el = document.createElement('div'); el.className = 'kfx-banner ' + kind;
    el.innerHTML = `<b>${U.esc(big)}</b><small>${U.esc(small)}</small>`;
    const wr = box() && box().getBoundingClientRect(); if (wr && wr.width) el.style.left = (wr.left + wr.width / 2) + 'px';
    document.body.appendChild(el);
    el.animate([{transform: 'translate(-50%,-50%) scale(.5)', opacity: 0}, {transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1, offset: .15}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .7}, {transform: 'translate(-50%,-58%) scale(.95)', opacity: 0}], {duration: 1600, easing: 'ease-out', fill: 'both'}).onfinish = () => el.remove();
  }
  function burst(src, cols, n, kind) {
    if (!src) return; const r = src.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let k = 0; k < n; k++) {
      const el = document.createElement('div'); el.className = 'kfx-spark' + (kind ? ' ' + kind : '');
      const sz = kind === 'coin' ? 12 + Math.random() * 10 : 6 + Math.random() * 9;
      el.style.cssText = `left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;background:${cols[k % cols.length]}`;
      document.body.appendChild(el);
      const ang = Math.random() * Math.PI * 2, dist = (kind === 'dust' ? 40 : 90) + Math.random() * 140;
      el.animate([{transform: 'translate(-50%,-50%) scale(1)', opacity: 1}, {transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px),calc(-50% + ${Math.sin(ang) * dist + (kind === 'coin' ? 80 : 20)}px)) scale(.4) rotate(${Math.random() * 720}deg)`, opacity: 0}], {duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'both'}).onfinish = () => el.remove();
    }
  }
  function confetti(good) {
    const cols = good ? ['#F5C542', '#2A9DF4', '#FFFFFF', '#7AD3FF'] : ['#3B0D3A', '#7A1E6B', '#C8323A', '#1A0A20'];
    for (let k = 0; k < 70; k++) {
      const el = document.createElement('div'); el.className = 'kfx-conf';
      el.style.cssText = `left:${Math.random() * 100}vw;background:${cols[k % cols.length]};width:${6 + Math.random() * 8}px;height:${10 + Math.random() * 12}px`;
      document.body.appendChild(el);
      el.animate([{transform: 'translateY(-30px) rotate(0)', opacity: 1}, {transform: `translate(${(Math.random() - .5) * 200}px,${innerHeight + 40}px) rotate(${(Math.random() - .5) * 900}deg)`, opacity: .9}],
        {duration: 2400 + Math.random() * 2000, delay: Math.random() * 1500, easing: 'cubic-bezier(.3,.1,.7,1)', fill: 'both'}).onfinish = () => el.remove();
    }
  }
}
function kCount(h) {
  const t = h.filter(c => c === 'T').length, k = h.filter(c => c === 'K').length;
  return `보물 ${t} · 크라켄 ${k} · 빈 상자 ${h.length - t - k}`;
}
function kDeclForm(S, me, ui, P) {
  const h = S.hand[me] || [], per = h.length, tv = ui.kt == null ? 0 : ui.kt, kv = !!ui.kk;
  return `<section class="kdecl"><div class="avt-h"><b>📣 ${S.round}라운드 선언</b><span>내 상자 ${per}개를 몰래 보고, 보물과 크라켄 개수를 말하세요. 거짓말도 OK!</span></div>
<div class="khand">${h.map(c => card(c, 'peek')).join('')}</div><small class="muted" style="text-align:center">진짜: ${kCount(h)} · 선언하면 상자가 섞여서 위치는 몰라요</small>
<div class="kd-row"><span>💰 보물</span><div class="kd-num">${U.gb('−', 'kt', -1, 'kd-b', tv <= 0)}<b>${tv}</b>${U.gb('+', 'kt', 1, 'kd-b', tv + (kv ? 1 : 0) >= per)}</div></div>
<div class="kd-row kd-k"><span>🐙 크라켄<small>${kv ? '있다고 말해요' : '없음이 기본이에요 · 있으면 눌러요'}</small></span>${U.gb(`<i class="kd-box">${kv ? '✔' : ''}</i>크라켄 있음`, 'kk', 1, 'kd-tg' + (kv ? ' on' : ''), !kv && tv >= per)}</div>
${U.btn(`이렇게 선언하기 (보물 ${tv}${kv ? ' · 크라켄 있음' : ''})`, 'decl', {t: tv, k: kv}, 'primary big avgo')}</section>`;
}
function kTable(S, me, P, picking, ui) {
  const n = P.length;
  return `<section class="ktable">${P.map((p, i) => {
    const d = S.decl[i], hand = S.hand[i] || [], isAct = S.act === i && !S.winner;
    const can = picking && i !== me;
    return `<div class="kseat${isAct ? ' act' : ''}${i === me ? ' me' : ''}" data-ks="${i}" style="--pc:${U.pc(i)}"><div class="ks-h"><span class="pdot" style="--pc:${U.pc(i)}"></span><b>${U.nm(P, i)}${i === me ? ' (나)' : ''}</b>${isAct ? '<span class="ks-cap"><i>🧭</i> 선장</span>' : ''}${S.winner ? `<span class="ks-role ${S.role[i] === 'X' ? 'g' : 'e'}">${S.role[i] === 'X' ? '탐험대' : '해골'}</span>` : ''}</div>
<div class="ks-d">${d ? `<span>💰 ${d.t}</span>${d.k ? '<span class="k">🐙 크라켄</span>' : '<span class="n">🐙 없음</span>'}` : (S.phase === 'decl' ? '<span class="w">선언 중…</span>' : '<span class="w">—</span>')}</div>
<div class="ks-c">${hand.map((c, k) => can ? `<button type="button" class="kc kc-B pick" data-act="open" data-arg="${U.attr({p: i, k})}" aria-label="${U.nm(P, i)}의 ${k + 1}번째 상자 열기">${ART.back}</button>` : (S.winner ? card(c, 'sm') : card('B', 'sm'))).join('')}${S.revealed.map((r, j) => r.from === i && r.round === S.round ? card(r.c, 'sm kopd' + (S.last && S.last.n === j + 1 ? ' knew' : '')) : '').join('')}</div></div>`;
  }).join('')}</section>`;
}
function kRevealed(S, P) {
  if (!S.revealed.length) return '';
  return `<details class="ref kopen"><summary>열린 상자 ${S.revealed.length}개 보기</summary><div class="krev">${S.revealed.map(r => `<div>${card(r.c, 'xs')}<small>${r.round}R · ${U.nm(P, r.from)}</small></div>`).join('')}</div></details>`;
}
function kFresh(key, dur) {
  const R0 = typeof window !== 'undefined' ? window : globalThis; R0.__kSeen = R0.__kSeen || {};
  const now = Date.now(); if (!R0.__kSeen[key]) R0.__kSeen[key] = now;
  const el = (now - R0.__kSeen[key]) / 1000; return el < dur ? el : -1;
}
const KBG = {
  T: () => `<span class="kbg kbg-T"><span class="kbg-glow"></span><span class="kbg-rays"></span>${Array.from({length: 16}, (_, k) => `<i style="--x:${(k * 61 + 7) % 96}%;--d:${(k * 0.37) % 2.4}s;--s:${0.7 + (k % 4) * 0.18};--t:${1.6 + (k % 3) * 0.45}s">${U.img('coin', '', '')}</i>`).join('')}${Array.from({length: 10}, (_, k) => `<b style="--x:${(k * 37 + 11) % 94}%;--y:${(k * 53 + 9) % 80}%;--d:${(k * 0.29) % 1.8}s"></b>`).join('')}</span>`,
  K: () => `<span class="kbg kbg-K">${Array.from({length: 7}, (_, k) => `<i style="--x:${[8, 88, 30, 70, 50, 15, 85][k]}%;--y:${[20, 25, 75, 70, 45, 85, 88][k]}%;--d:${k * 0.09}s;--s:${[1.1, 1, 1.3, 1.2, 1.6, .9, 1][k]}"></i>`).join('')}<span class="kbg-drip">${Array.from({length: 9}, (_, k) => `<em style="--x:${k * 11 + 4}%;--h:${30 + (k * 23) % 45}%;--d:${(k * 0.13) % .8}s"></em>`).join('')}</span></span>`
};
function kShown(S, me, P) {
  const L = S.last, c = L.c, el = kFresh('k' + S._g + L.n, 3);
  const st = el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s"`;
  const word = c === 'T' ? '보물 발견!' : c === 'K' ? '크라켄이다!!' : '빈 상자…';
  const pd = S.pend;
  const btn = pd === 'K' || pd === 'T' || pd === 'R4' ? '결과 보기' : pd === 'R' ? `${S.round}라운드 끝 → 상자 다시 나누기` : `🧭 다음 선장 ${P[S.act] ? P[S.act].name : ''}님 차례로`;
  return `<section class="kshow k-${c}"${st}>${KBG[c] ? KBG[c]() : ''}<small>${U.nm(P, L.by)}님이 ${U.nm(P, L.from)}님의 상자를 열었어요</small><div class="kchx k-${c}"><span class="kchx-glow"></span><span class="kchx-open">${CH_OPEN}</span><span class="kchx-in">${KIN[c]()}</span><span class="kchx-body">${CH_BODY}</span><span class="kchx-lid">${CH_LID}</span><span class="kchx-dust"><i></i><i></i><i></i><i></i></span></div><div class="kword">${word}</div>${c === 'T' ? `<div class="kb">💰 보물 ${S.found} / ${P.length}</div>` : ''}${me >= 0 ? U.btn(btn, 'next', {}, c === 'K' ? 'avk-go' : 'primary big avgo') : ''}<small class="avnext-s">누구든 한 명이 누르면 모두 다음으로 넘어가요</small></section>`;
}
function kEnd(S, P) {
  const el = kFresh('ke' + S._g, 5), good = S.wt === 'T';
  return `<section class="kend ${good ? 'g' : 'e'}"${el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s"`}><div class="ke-art">${good ? ART.T : ART.K}</div><small>${S.wt === 'K' ? '크라켄이 깨어났어요!' : S.wt === 'T' ? `보물 ${P.length}개를 모두 찾았어요!` : '4라운드가 끝났어요…'}</small><b>${good ? '탐험대 승리' : '해골 해적단 승리'}</b>
<div class="ke-teams"><div class="g">${ART.ex}<small>탐험대</small>${kids(P).filter(i => S.role[i] === 'X').map(i => `<span>${U.nm(P, i)}</span>`).join('')}</div><div class="e">${ART.sk}<small>해골 해적단</small>${kids(P).filter(i => S.role[i] === 'S').map(i => `<span>${U.nm(P, i)}</span>`).join('')}</div></div></section>`;
}

/* ---------- AI ---------- */
function kBotStep(S, P) {
  if (!S || S.winner || S.phase === 'end') return false;
  const n = P.length, isBot = i => P[i] && P[i].bot;
  const run = (i, t, a) => { try { G.kraken.act(S, i, t, a, P); return true; } catch (e) { return false; } };
  if (S.phase === 'look') { const i = kids(P).find(k => isBot(k) && !S.seen[k]); return i !== undefined && run(i, 'seen', {}); }
  if (S.phase === 'decl') {
    const i = kids(P).find(k => isBot(k) && S.decl[k] == null); if (i === undefined) return false;
    const h = S.hand[i], t = h.filter(c => c === 'T').length, k = h.includes('K');
    if (S.role[i] === 'X') return run(i, 'decl', {t, k});
    // 해골: 크라켄은 숨기고, 보물은 조금 부풀리거나 줄여요
    const lieT = Math.max(0, Math.min(h.length - 0, t + (Math.random() < .5 ? 1 : 0) - (Math.random() < .3 ? 1 : 0)));
    return run(i, 'decl', {t: Math.min(lieT, h.length), k: k && Math.random() < .25});
  }
  if (S.phase === 'pick' && isBot(S.act)) {
    const me = S.act, evil = S.role[me] === 'S';
    let best = null, bs = -1e9;
    for (const p of kids(P)) {
      if (p === me || !S.hand[p] || !S.hand[p].length) continue;
      const d = S.decl[p] || {t: 0, k: 0}, len = S.hand[p].length;
      let s = (d.t / len) * 2 - (d.k ? 1.5 : 0) + Math.random() * 0.8;
      // 지금까지 이 사람 상자에서 나온 결과로 믿을지 판단
      const fromP = S.revealed.filter(r => r.from === p);
      s += fromP.filter(r => r.c === 'T').length * 0.3;
      if (evil) s = (d.k ? 2 : 0) + Math.random() * 1.5 - (S.role[p] === 'S' ? 0.5 : 0);
      if (s > bs) { bs = s; best = p; }
    }
    if (best == null) return false;
    return run(me, 'open', {p: best, k: U.rint(S.hand[best].length)});
  }
  return false;
}
G.kraken.botStep = kBotStep;
G.kraken.art = k => ART[k] || '';
G.kraken.BOTNAMES = ['바다거북', '갈매기', '돌고래', '해마', '불가사리', '앵무새', '고래', '문어'];
})();
