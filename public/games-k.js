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

/* ---------- 직접 그린 그림 (SVG) ---------- */
const ART = {
  back: `<svg viewBox="0 0 100 140" aria-hidden="true"><defs><linearGradient id="kbw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E4E79"/><stop offset="1" stop-color="#0D2338"/></linearGradient></defs><rect x="2" y="2" width="96" height="136" rx="10" fill="url(#kbw)" stroke="#E6C47A" stroke-width="3"/><rect x="9" y="9" width="82" height="122" rx="6" fill="none" stroke="#E6C47A" stroke-width="1.2" stroke-dasharray="3 3" opacity=".7"/><g fill="none" stroke="#7FB8E0" stroke-width="1.5" opacity=".5"><path d="M10 100q10-8 20 0t20 0 20 0 20 0"/><path d="M10 112q10-8 20 0t20 0 20 0 20 0"/><path d="M10 124q10-8 20 0t20 0 20 0 20 0"/></g><circle cx="50" cy="58" r="24" fill="#0B1C2D" stroke="#E6C47A" stroke-width="2"/><path d="M50 38l4 14h-8zM50 78l-4-14h8zM30 58l14-4v8zM70 58l-14 4v-8z" fill="#E6C47A"/><circle cx="50" cy="58" r="3" fill="#E6C47A"/></svg>`,
  E: `<svg viewBox="0 0 100 140" aria-hidden="true"><rect x="2" y="2" width="96" height="136" rx="10" fill="#F3E6C6" stroke="#8B6A3C" stroke-width="3"/><path d="M8 120q12-6 24 0t24 0 24 0 18 0V134H8z" fill="#D9C08E"/><g transform="translate(18 52)"><path d="M0 22h64v38H0z" fill="#8B5A2B" stroke="#4A2E12" stroke-width="2"/><path d="M0 22l8-22h48l8 22z" fill="#A0693A" stroke="#4A2E12" stroke-width="2"/><path d="M4 26h56v6H4z" fill="#3A2410" opacity=".5"/><rect x="0" y="34" width="64" height="5" fill="#C9A24A"/><rect x="28" y="30" width="8" height="12" rx="2" fill="#C9A24A" stroke="#4A2E12"/><path d="M14 44h36" stroke="#4A2E12" stroke-width="1.5" opacity=".4"/></g><text x="50" y="34" text-anchor="middle" font-size="12" font-weight="800" fill="#6B4E22">텅…</text></svg>`,
  T: `<svg viewBox="0 0 100 140" aria-hidden="true"><defs><radialGradient id="kgl" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#FFF4B0"/><stop offset="1" stop-color="#FFF4B0" stop-opacity="0"/></radialGradient></defs><rect x="2" y="2" width="96" height="136" rx="10" fill="#FBF0D2" stroke="#B8892A" stroke-width="3"/><circle cx="50" cy="74" r="44" fill="url(#kgl)"/><g transform="translate(18 56)"><path d="M0 26h64v36H0z" fill="#8B5A2B" stroke="#4A2E12" stroke-width="2"/><path d="M-2 26C4 6 60 6 66 26z" fill="#F2C94C" stroke="#B8892A" stroke-width="2"/><g fill="#FFD95A" stroke="#B8892A" stroke-width="1"><circle cx="12" cy="20" r="6"/><circle cx="24" cy="15" r="6"/><circle cx="38" cy="14" r="6"/><circle cx="51" cy="19" r="6"/></g><path d="M26 6l6-10 6 10z" fill="#E5484D" stroke="#7E1418"/><rect x="0" y="38" width="64" height="5" fill="#C9A24A"/><rect x="28" y="34" width="8" height="12" rx="2" fill="#C9A24A" stroke="#4A2E12"/></g><g fill="#FFF" opacity=".9"><path d="M20 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M80 40l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"/></g><text x="50" y="128" text-anchor="middle" font-size="13" font-weight="900" fill="#8A6510">보물!</text></svg>`,
  K: `<svg viewBox="0 0 100 140" aria-hidden="true"><defs><linearGradient id="kkr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B0D3A"/><stop offset="1" stop-color="#0F0418"/></linearGradient></defs><rect x="2" y="2" width="96" height="136" rx="10" fill="url(#kkr)" stroke="#E5484D" stroke-width="3"/><g fill="#9C2D8F" stroke="#4E0F4A" stroke-width="2"><path d="M50 30c-18 0-28 14-28 30 0 12 6 20 14 24l-10 30c8 2 12-8 14-20 2 12 4 22 10 24 6-2 8-12 10-24 2 12 6 22 14 20l-10-30c8-4 14-12 14-24 0-16-10-30-28-30z"/></g><g fill="none" stroke="#C04AB2" stroke-width="5" stroke-linecap="round"><path d="M24 92c-10 6-14 18-6 26"/><path d="M76 92c10 6 14 18 6 26"/></g><circle cx="40" cy="58" r="7" fill="#FFE14D"/><circle cx="60" cy="58" r="7" fill="#FFE14D"/><circle cx="40" cy="59" r="3" fill="#111"/><circle cx="60" cy="59" r="3" fill="#111"/><path d="M38 74q12 8 24 0" stroke="#2A0328" stroke-width="3" fill="none"/><g fill="#E5484D"><circle cx="30" cy="106" r="2"/><circle cx="70" cy="106" r="2"/><circle cx="20" cy="116" r="2"/><circle cx="80" cy="116" r="2"/></g><text x="50" y="22" text-anchor="middle" font-size="12" font-weight="900" fill="#FF6B70">KRAKEN</text></svg>`,
  ex: `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="47" fill="#E8F1FB" stroke="#2A56D6" stroke-width="3"/><path d="M22 44c4-16 52-16 56 0z" fill="#8B5A2B" stroke="#4A2E12" stroke-width="2"/><rect x="18" y="42" width="64" height="7" rx="3" fill="#6B4220"/><circle cx="50" cy="60" r="17" fill="#F7D3AE" stroke="#8B5A2B" stroke-width="1.5"/><circle cx="44" cy="58" r="2.2" fill="#222"/><circle cx="56" cy="58" r="2.2" fill="#222"/><path d="M44 66q6 5 12 0" stroke="#7A3E1D" stroke-width="2" fill="none"/><path d="M28 86c6-8 38-8 44 0" fill="#2A56D6"/><circle cx="74" cy="76" r="9" fill="#F2C94C" stroke="#8A6510" stroke-width="1.5"/><path d="M74 69l2 7-2 7-2-7z" fill="#C8323A"/></svg>`,
  sk: `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="47" fill="#2A1020" stroke="#C8323A" stroke-width="3"/><path d="M26 40c0-14 48-14 48 0l-4 4H30z" fill="#C8323A"/><circle cx="68" cy="34" r="4" fill="#fff"/><path d="M30 44c-4 22 6 34 20 34s24-12 20-34z" fill="#F4F0E6" stroke="#5A4A3A" stroke-width="2"/><ellipse cx="41" cy="55" rx="6" ry="7" fill="#1A0A12"/><ellipse cx="59" cy="55" rx="6" ry="7" fill="#1A0A12"/><path d="M50 62l-4 7h8z" fill="#1A0A12"/><path d="M38 72h24" stroke="#5A4A3A" stroke-width="2"/><path d="M42 70v6M47 70v7M53 70v7M58 70v6" stroke="#5A4A3A" stroke-width="1.5"/><path d="M14 86l22-14M86 86l-22-14" stroke="#B8B0A0" stroke-width="5" stroke-linecap="round"/></svg>`
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
  view(S, me, ui, P) { return `<div class="kw">${G.kraken._view.call(this, S, me, ui, P)}</div>`; },
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
function kCount(h) {
  const t = h.filter(c => c === 'T').length, k = h.filter(c => c === 'K').length;
  return `보물 ${t} · 크라켄 ${k} · 빈 상자 ${h.length - t - k}`;
}
function kDeclForm(S, me, ui, P) {
  const h = S.hand[me] || [], per = h.length, tv = ui.kt == null ? 0 : ui.kt, kv = !!ui.kk;
  return `<section class="kdecl"><div class="avt-h"><b>📣 ${S.round}라운드 선언</b><span>내 상자 ${per}개를 몰래 보고, 보물과 크라켄 개수를 말하세요. 거짓말도 OK!</span></div>
<div class="khand">${h.map(c => card(c, 'peek')).join('')}</div><small class="muted" style="text-align:center">진짜: ${kCount(h)} · 선언하면 상자가 섞여서 위치는 몰라요</small>
<div class="kd-row"><span>💰 보물</span><div class="kd-num">${U.gb('−', 'kt', -1, 'kd-b', tv <= 0)}<b>${tv}</b>${U.gb('+', 'kt', 1, 'kd-b', tv + (kv ? 1 : 0) >= per)}</div></div>
<div class="kd-row"><span>🐙 크라켄</span>${U.gb(kv ? '있어요' : '없어요', 'kk', 1, 'kd-tg' + (kv ? ' on' : ''), !kv && tv >= per)}</div>
${U.btn(`이렇게 선언하기 (보물 ${tv}${kv ? ' · 크라켄 있음' : ''})`, 'decl', {t: tv, k: kv}, 'primary big avgo')}</section>`;
}
function kTable(S, me, P, picking, ui) {
  const n = P.length;
  return `<section class="ktable">${P.map((p, i) => {
    const d = S.decl[i], hand = S.hand[i] || [], isAct = S.act === i && !S.winner;
    const can = picking && i !== me;
    return `<div class="kseat${isAct ? ' act' : ''}${i === me ? ' me' : ''}" style="--pc:${U.pc(i)}"><div class="ks-h"><span class="pdot" style="--pc:${U.pc(i)}"></span><b>${U.nm(P, i)}${i === me ? ' (나)' : ''}</b>${isAct ? '<span class="ks-cap">🧭 선장</span>' : ''}${S.winner ? `<span class="ks-role ${S.role[i] === 'X' ? 'g' : 'e'}">${S.role[i] === 'X' ? '탐험대' : '해골'}</span>` : ''}</div>
<div class="ks-d">${d ? `<span>💰 ${d.t}</span>${d.k ? '<span class="k">🐙 크라켄</span>' : '<span class="n">🐙 없음</span>'}` : (S.phase === 'decl' ? '<span class="w">선언 중…</span>' : '<span class="w">—</span>')}</div>
<div class="ks-c">${hand.map((c, k) => can ? `<button type="button" class="kc kc-B pick" data-act="open" data-arg="${U.attr({p: i, k})}" aria-label="${U.nm(P, i)}의 ${k + 1}번째 상자 열기">${ART.back}</button>` : (S.winner ? card(c, 'sm') : card('B', 'sm'))).join('')}</div></div>`;
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
function kShown(S, me, P) {
  const L = S.last, c = L.c, el = kFresh('k' + S._g + L.n, 3);
  const st = el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s"`;
  const word = c === 'T' ? '보물 발견!' : c === 'K' ? '크라켄이다!!' : '빈 상자…';
  const pd = S.pend;
  const btn = pd === 'K' || pd === 'T' || pd === 'R4' ? '결과 보기' : pd === 'R' ? `${S.round}라운드 끝 → 상자 다시 나누기` : `🧭 다음 선장 ${P[S.act] ? P[S.act].name : ''}님 차례로`;
  return `<section class="kshow k-${c}"${st}><small>${U.nm(P, L.by)}님이 ${U.nm(P, L.from)}님의 상자를 열었어요</small><div class="kflip"><i class="b">${ART.back}</i><i class="f">${ART[c]}</i></div><div class="kword">${word}</div>${c === 'T' ? `<div class="kb">💰 보물 ${S.found} / ${P.length}</div>` : ''}${me >= 0 ? U.btn(btn, 'next', {}, c === 'K' ? 'avk-go' : 'primary big avgo') : ''}<small class="avnext-s">누구든 한 명이 누르면 모두 다음으로 넘어가요</small></section>`;
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
