(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;
const isDOM = typeof document !== 'undefined';

/* =================== 한밤의 수수께끼 (Werewords) =================== */
/* 촌장이 비밀 단어를 하나 골라요. 늑대인간과 예언자는 그 단어를 알아요.
   낮(4분) 동안 모두 예/아니오로 답할 수 있는 질문을 던지고, 촌장은 토큰으로만 답해요.
   단어를 맞히면 → 늑대인간이 예언자를 찾아내면 늑대 승리, 못 찾으면 마을 승리.
   못 맞히면(시간·예/아니오 토큰 바닥) → 모두 늑대인간을 투표로 찾아내면 마을 승리, 못 찾으면 늑대 승리. */
const WORDS = ('사과 바나나 수박 딸기 포도 귤 복숭아 감자 고구마 당근 양파 김치 라면 떡볶이 김밥 피자 햄버거 치킨 아이스크림 초콜릿 케이크 빵 우유 커피 사탕 계란 밥 국수 만두 삼겹살 ' +
  '강아지 고양이 호랑이 사자 코끼리 기린 토끼 거북이 펭귄 돌고래 상어 고래 원숭이 판다 곰 여우 늑대 독수리 참새 닭 돼지 소 말 뱀 개구리 나비 모기 개미 꿀벌 공룡 ' +
  '자동차 버스 기차 비행기 배 자전거 오토바이 지하철 택시 헬리콥터 로켓 엘리베이터 ' +
  '연필 지우개 공책 책상 의자 가방 칠판 시계 안경 우산 신발 모자 장갑 양말 거울 칫솔 수건 베개 이불 냉장고 세탁기 텔레비전 컴퓨터 휴대폰 카메라 전구 열쇠 가위 풍선 ' +
  '학교 병원 도서관 공원 바다 산 강 섬 사막 동물원 놀이공원 수영장 영화관 편의점 시장 교회 경찰서 소방서 공항 박물관 ' +
  '선생님 의사 경찰 소방관 요리사 가수 화가 군인 농부 우주비행사 대통령 마술사 해적 ' +
  '해 달 별 구름 비 눈 무지개 번개 바람 불 얼음 나무 꽃 돌 모래 ' +
  '축구 야구 농구 피아노 기타 드럼 생일 크리스마스 설날 여름방학 시험 숙제 꿈 사랑 친구 가족 돈 선물 편지 사진 노래 영화 게임 로봇 유령 마법사 왕관 보물').split(' ');
const BOTQ = ['살아있는 거예요?', '먹을 수 있어요?', '손에 들 수 있어요?', '집 안에 있어요?', '동물이에요?', '전기가 필요해요?', '사람보다 커요?', '밖에서 볼 수 있어요?', '돈 주고 사요?', '학교에 있어요?', '물과 관련 있어요?', '탈 수 있어요?', '날 수 있어요?', '매일 써요?', '사람이에요?', '장소예요?', '자연에 있어요?', '여름이랑 관련 있어요?'];
// 토큰: 종류 → [이름, 그림]
const TK = {yes: ['예', 'ww_yes'], no: ['아니오', 'ww_no'], maybe: ['애매해요', 'ww_maybe'], close: ['아주 가까워요', 'ww_hot'], far: ['아주 멀어요', 'ww_cold'], hit: ['정답!', 'ww_hit']};
const ROLE = {W: ['늑대인간', 'ww_wolf', '단어를 알아요. 마을이 단어를 못 맞히게 슬쩍 방해하고, 맞히면 예언자를 찾아내요.'], S: ['예언자', 'crystal', '단어를 알아요. 마을이 맞히도록 몰래 도와요. 들키면 늑대가 이겨요!'], V: ['마을 사람', 'ww_farmer', '단어를 몰라요. 질문으로 단어를 찾아내요.']};
const DAY = 240, HUNT = 30, VOTE = 60;
const ids = P => P.map((_, i) => i);
const pn = (P, i) => U.nm(P, i);
const wolves = S => S.role.map((r, i) => r === 'W' ? i : -1).filter(i => i >= 0);
const lg = (S, m) => U.log(S, m);
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c < 11172 && c % 28 ? a : b; };

function pickWords(S) { const pool = WORDS.filter(w => !(S.used || []).includes(w)); const a = U.shuffle(pool.slice()); return a.slice(0, 2); }
function toPhase(S, ph, len) { S.phase = ph; S.ts = Date.now(); S.len = len || 0; S.n++; }
function finish(S, P, wt, why) {
  S.phase = 'end'; S.wt = wt; S.why = why; S.n++;
  S.winner = wt === 'V' ? `🏡 마을 승리! ${why}` : `🐺 늑대인간 승리! ${why}`;
  lg(S, S.winner);
}
function toVote(S, P, why) { toPhase(S, 'vote', VOTE); S.votes = {}; lg(S, `${why} 이제 늑대인간을 투표로 찾아요!`); }
function tally(S, P) {
  const cnt = P.map(() => 0); Object.values(S.votes).forEach(v => { if (v >= 0) cnt[v]++; });
  const mx = Math.max(...cnt); const top = mx > 0 ? ids(P).filter(i => cnt[i] === mx) : [];
  S.vcnt = cnt; S.vtop = top;
  const hit = top.filter(i => S.role[i] === 'W');
  if (hit.length) finish(S, P, 'V', `${hit.map(i => P[i].name).join(', ')}님이 늑대인간이었어요.`);
  else finish(S, P, 'W', top.length ? `${top.map(i => P[i].name).join(', ')}님은 늑대인간이 아니었어요.` : '아무도 지목하지 못했어요.');
}

G.werewords = {
  name: '한밤의 수수께끼', tag: '예/아니오로 비밀 단어 맞히기, 숨은 늑대인간 찾기', min: 4, max: 10, mark: '🌙', hue: '#3B2C7A',
  rules: ['모두 몰래 역할을 받아요: 늑대인간(4~6명 1명, 7명 이상 2명), 예언자 1명, 나머지는 마을 사람. 그리고 한 명은 촌장이 돼요(촌장도 몰래 역할이 있어요).',
    '촌장은 비밀 단어를 하나 골라요. 늑대인간과 예언자는 그 단어를 알 수 있어요.',
    '낮 4분 동안 모두 촌장에게 예/아니오로 답할 수 있는 질문을 하거나 단어를 직접 맞혀 봐요. 촌장은 말 없이 토큰(예·아니오·애매해요·아주 가까워요·아주 멀어요·정답)으로만 답해요.',
    '예/아니오 토큰은 36개뿐! 다 쓰거나 시간이 지나면 단어 찾기는 실패예요.',
    '단어를 맞히면: 늑대인간이 30초 안에 예언자를 찾아내면 늑대 승리, 못 찾으면 마을 승리.',
    '못 맞히면: 모두 1분 동안 늑대인간이라고 생각하는 사람에게 투표해요. 가장 많은 표를 받은 사람 중에 늑대인간이 있으면 마을 승리, 없으면 늑대 승리.',
    '예언자는 너무 티 나게 도우면 들켜요. 늑대인간은 엉뚱한 질문으로 시간을 끌어요!'],
  rulesExtra() { return `<section class="ww-legend">${Object.keys(TK).map(k => `<span class="ww-tk k-${k}">${U.img(TK[k][1])}<b>${TK[k][0]}</b></span>`).join('')}</section>`; },
  setup(P) {
    const n = P.length; if (n < 4 || n > 10) throw U.err('4~10명이 필요해요.');
    const nw = n >= 7 ? 2 : 1;
    const role = U.shuffle(Array(nw).fill('W').concat(['S'], Array(n - nw - 1).fill('V')));
    const humans = ids(P).filter(i => !P[i].bot);
    const mayor = humans.length ? humans[U.rint(humans.length)] : U.rint(n);
    const S = {_g: Math.random().toString(36).slice(2, 9), role, mayor, word: '', words: [], reroll: 1, used: [], qs: [], tok: {yn: 36, maybe: 10, close: 1, far: 1}, seen: {}, votes: {}, n: 0, log: [`🌙 한밤의 수수께끼! 촌장은 ${P[mayor].name}님이에요.`]};
    S.words = pickWords(S);
    toPhase(S, 'word');
    return S;
  },
  turns(S, P) {
    if (S.winner) return [];
    if (S.phase === 'word') return [S.mayor];
    if (S.phase === 'look') return ids(P).filter(i => !S.seen[i]);
    if (S.phase === 'day') return [S.mayor];
    if (S.phase === 'hunt') return wolves(S);
    if (S.phase === 'vote') return ids(P).filter(i => S.votes[i] == null);
    return [];
  },
  allTurn(S) { return S.phase === 'day' ? '🌞 낮: 질문하고 맞혀요!' : S.phase === 'look' ? '모두 역할 확인' : S.phase === 'vote' ? '모두 투표하기' : S.phase === 'hunt' ? '🐺 늑대인간이 예언자를 찾는 중…' : ''; },
  open(S) { return S.phase === 'day'; },
  due(S) { return !S.winner && S.len && (S.phase === 'day' || S.phase === 'hunt' || S.phase === 'vote') ? S.ts + S.len * 1000 : null; },
  timeout(S, P) {
    if (S.winner || !S.len || Date.now() < S.ts + S.len * 1000 - 300) return false;
    if (S.phase === 'day') { toVote(S, P, '⏰ 시간이 다 됐어요! 단어를 못 찾았어요.'); return true; }
    if (S.phase === 'hunt') { finish(S, P, 'V', `늑대인간이 시간 안에 예언자를 고르지 못했어요. 단어는 "${S.word}"!`); return true; }
    if (S.phase === 'vote') { tally(S, P); return true; }
    return false;
  },
  act(S, me, t, a, P) {
    if (S.winner) return;
    a = a || {};
    if (t === 'reroll') {
      if (S.phase !== 'word' || me !== S.mayor) throw U.err('촌장만 단어를 골라요.');
      if (!S.reroll) throw U.err('다시 뽑기는 한 번만 돼요.');
      S.used = S.used.concat(S.words); S.words = pickWords(S); S.reroll--; S.n++; return;
    }
    if (t === 'pick') {
      if (S.phase !== 'word' || me !== S.mayor) throw U.err('촌장만 단어를 골라요.');
      const w = String(a.w || '');
      if (!S.words.includes(w)) throw U.err('단어를 골라 주세요.');
      S.word = w; S.seen = {}; toPhase(S, 'look');
      lg(S, '🤫 촌장이 비밀 단어를 골랐어요. 모두 몰래 역할을 확인해요.');
      return;
    }
    if (t === 'seen') {
      if (S.phase !== 'look') throw U.err('지금은 확인할 때가 아니에요.');
      S.seen[me] = 1; S.n++;
      if (ids(P).every(i => S.seen[i])) { toPhase(S, 'day', DAY); lg(S, '🌞 낮이 밝았어요! 4분 안에 단어를 맞혀요.'); }
      return;
    }
    if (t === 'ask') {
      if (S.phase !== 'day') throw U.err('지금은 질문할 수 없어요.');
      if (me === S.mayor) throw U.err('촌장은 답만 해요.');
      const q = String(a.q || '').trim().slice(0, 60);
      if (!q) throw U.err('질문이나 맞힐 단어를 적어 주세요.');
      if (S.qs.filter(x => x.by === me && !x.t).length >= 2) throw U.err('촌장이 답할 때까지 조금만 기다려 주세요(대기 질문은 2개까지).');
      S.qs.push({by: me, q, t: null, id: S.qs.length}); S.n++;
      return;
    }
    if (t === 'ans') {
      if (S.phase !== 'day' || me !== S.mayor) throw U.err('촌장만 답해요.');
      const k = a.t; if (!TK[k]) throw U.err('토큰을 골라 주세요.');
      if ((k === 'yes' || k === 'no') && S.tok.yn <= 0) throw U.err('예/아니오 토큰이 없어요.');
      if (k === 'maybe' && S.tok.maybe <= 0) throw U.err('애매해요 토큰을 다 썼어요.');
      if ((k === 'close' || k === 'far') && S.tok[k] <= 0) throw U.err('그 토큰은 한 번만 쓸 수 있어요.');
      let q = a.i != null ? S.qs[+a.i] : null;
      if (q && q.t) throw U.err('이미 답한 질문이에요.');
      if (!q) { q = {by: -1, q: '', t: null, id: S.qs.length}; S.qs.push(q); }
      q.t = k; q.at = S.n + 1; S.n++;
      if (k === 'yes' || k === 'no') S.tok.yn--; else if (k === 'maybe') S.tok.maybe--; else if (k === 'close' || k === 'far') S.tok[k]--;
      S.lastAns = {id: q.id, t: k, n: S.n};
      if (k === 'hit') {
        S.found = q.by; toPhase(S, 'hunt', HUNT);
        lg(S, `🎯 정답! 단어는 "${S.word}"${q.by >= 0 ? ` · ${P[q.by].name}님이 맞혔어요` : ''}. 늑대인간이 예언자를 찾아요…`);
        return;
      }
      if (S.tok.yn <= 0) toVote(S, P, '예/아니오 토큰이 바닥났어요!');
      return;
    }
    if (t === 'hunt') {
      if (S.phase !== 'hunt' || S.role[me] !== 'W') throw U.err('늑대인간만 고를 수 있어요.');
      const p = +a.p; if (!(p >= 0 && p < P.length) || S.role[p] === 'W') throw U.err('늑대인간이 아닌 사람을 골라요.');
      S.hunted = p; S.huntBy = me;
      if (S.role[p] === 'S') finish(S, P, 'W', `${P[p].name}님이 예언자였어요! 단어는 "${S.word}".`);
      else finish(S, P, 'V', `${P[p].name}님은 예언자가 아니었어요. 단어는 "${S.word}".`);
      return;
    }
    if (t === 'vote') {
      if (S.phase !== 'vote') throw U.err('지금은 투표할 때가 아니에요.');
      const p = +a.p; if (!(p >= 0 && p < P.length) || p === me) throw U.err('다른 사람을 골라요.');
      if (S.votes[me] != null) throw U.err('이미 투표했어요.');
      S.votes[me] = p; S.n++;
      if (ids(P).every(i => S.votes[i] != null)) tally(S, P);
      return;
    }
    throw U.err('알 수 없는 행동이에요.');
  },
  view(S, me, ui, P) {
    if (isDOM) setTimeout(() => wFx(S, me, P), 0);
    return `<div class="wwbox"><div class="www">${wBody(S, me, ui || {}, P)}</div></div>`;
  },
  uiAct(ui, S, me, name, val) {
    if (name === 'wsel') { ui.wsel = ui.wsel === val ? null : val; return; }
    if (name === 'wpick') { ui.wpick = ui.wpick === val ? null : val; return; }
  },
  splash: true
};

/* ---------- 화면 ---------- */
function clock(S) {
  if (!S.len || S.winner || !['day', 'hunt', 'vote'].includes(S.phase)) return '';
  let left = S.len;
  if (isDOM) { const W = window; W.__wwT = W.__wwT || {}; const k = S._g + ':' + S.ts; const seen = W.__wwT[k] = W.__wwT[k] || Date.now(); left = Math.max(0, S.len - (Date.now() - seen) / 1000); wTick(); return `<b class="ww-clock${left < 31 ? ' hurry' : ''}" data-seen="${seen}" data-len="${S.len}"><i>⏳</i><span>${fmt(left)}</span></b>`; }
  return `<b class="ww-clock"><i>⏳</i><span>${fmt(left)}</span></b>`;
}
const fmt = s => { s = Math.ceil(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function wTick() {
  const W = window; if (W.__wwTick) return;
  W.__wwTick = setInterval(() => {
    const els = document.querySelectorAll('.ww-clock[data-seen]'); if (!els.length) return;
    els.forEach(e => { const left = Math.max(0, +e.dataset.len - (Date.now() - +e.dataset.seen) / 1000); const sp = e.querySelector('span'); if (sp) sp.textContent = fmt(left); e.classList.toggle('hurry', left < 31); });
  }, 500);
}
const tkimg = (k, cls = '') => `<span class="ww-tk k-${k} ${cls}">${U.img(TK[k][1])}<b>${TK[k][0]}</b></span>`;
function roleCard(S, me, ui, P) {
  if (me < 0 || !S.role) return '';
  const r = S.role[me], R0 = ROLE[r], knows = r !== 'V' || me === S.mayor;
  const open = !!ui.wwpeek;
  return `<section class="ww-my${open ? ' open' : ''}"><div class="ww-my-bar"><span class="ww-my-ic">${U.img(open ? R0[1] : 'ww_moon')}</span><div><b>내 역할${me === S.mayor ? ' · 촌장' : ''}</b><small>${open ? '다 봤으면 숨겨 주세요' : '남에게 안 보이게 확인하세요'}</small></div>${U.ub(open ? '🙈 숨기기' : '👁 보기', 'wwpeek', true, open ? 'ww-my-btn' : 'primary ww-my-btn')}</div>
${open ? `<div class="ww-my-in r-${r}"><span class="ww-rimg">${U.img(R0[1])}</span><div><small>나의 역할</small><b>${R0[0]}</b><p>${R0[2]}</p>${knows && S.word ? `<div class="ww-word"><small>비밀 단어</small><b>${U.esc(S.word)}</b></div>` : ''}${r === 'W' && wolves(S).length > 1 ? `<p class="ww-mates">🐺 동료: ${wolves(S).filter(i => i !== me).map(i => pn(P, i)).join(', ')}</p>` : ''}</div></div>` : ''}</section>`;
}
function seats(S, me, P, pickAct, pickOk) {
  return `<section class="ww-seats">${ids(P).map(i => {
    const cnt = S.qs.filter(q => q.by === i).length, end = S.phase === 'end', r = S.role[i];
    const can = pickAct && pickOk(i);
    const inner = `<span class="pdot" style="--pc:${U.pc(i)}"></span><b>${pn(P, i)}${i === me ? ' (나)' : ''}</b>${i === S.mayor ? `<span class="ww-badge">${U.img('ww_mayor')}촌장</span>` : ''}${end ? `<span class="ww-rbadge r-${r}">${U.img(ROLE[r][1])}${ROLE[r][0]}</span>` : `<em>💬 ${cnt}</em>`}${S.phase === 'vote' && S.votes[i] != null ? '<span class="ww-voted">✔ 투표함</span>' : ''}${end && S.vcnt && S.vcnt[i] ? `<span class="ww-vc">🗳 ${S.vcnt[i]}</span>` : ''}`;
    return can ? `<button type="button" class="ww-seat pick${pickAct.sel === i ? ' on' : ''}" style="--pc:${U.pc(i)}" data-g="wpick" data-val="${i}">${inner}</button>` : `<div class="ww-seat${end && S.hunted === i ? ' hunted' : ''}" style="--pc:${U.pc(i)}" data-ws="${i}">${inner}</div>`;
  }).join('')}</section>`;
}
function qlist(S, P, me, isMayor) {
  const qs = S.qs.slice().reverse().slice(0, 30);
  if (!qs.length) return `<p class="ww-empty">아직 질문이 없어요. "${isMayor ? '질문을 기다리는 중…' : '살아있는 거예요?'}"처럼 물어보세요!</p>`;
  return `<ol class="ww-qs">${qs.map(q => {
    const fresh = S.lastAns && S.lastAns.id === q.id ? ' fresh' : '';
    const who = q.by >= 0 ? `<span class="ww-qwho" style="--pc:${U.pc(q.by)}">${pn(P, q.by)}</span>` : '<span class="ww-qwho m">말로 한 질문</span>';
    const ans = q.t ? tkimg(q.t, 'sm' + fresh) : isMayor ? `<span class="ww-ansrow">${['yes', 'no', 'maybe', 'close', 'far', 'hit'].map(k => U.btn(`${U.img(TK[k][1])}<b>${TK[k][0]}</b>`, 'ans', {i: q.id, t: k}, `ww-ab k-${k}`, !tokOk(S, k))).join('')}</span>` : '<span class="ww-wait">촌장이 생각 중…</span>';
    return `<li class="${q.t ? 'done' : 'pend'}${fresh}">${who}<p>${U.esc(q.q) || '<i>(토큰만 사용)</i>'}</p>${ans}</li>`;
  }).join('')}</ol>`;
}
const tokOk = (S, k) => k === 'yes' || k === 'no' ? S.tok.yn > 0 : k === 'maybe' ? S.tok.maybe > 0 : k === 'close' || k === 'far' ? S.tok[k] > 0 : true;
function tokBar(S) {
  const yn = S.tok.yn;
  return `<section class="ww-tokbar"><span class="ww-tb yn${yn <= 8 ? ' low' : ''}">${U.img('ww_yes')}${U.img('ww_no')}<b>${yn}</b><small>예/아니오 남음</small></span><span class="ww-tb">${U.img('ww_maybe')}<b>${S.tok.maybe}</b><small>애매해요</small></span><span class="ww-tb${S.tok.close ? '' : ' used'}">${U.img('ww_hot')}<b>${S.tok.close}</b><small>가까워요</small></span><span class="ww-tb${S.tok.far ? '' : ' used'}">${U.img('ww_cold')}<b>${S.tok.far}</b><small>멀어요</small></span></section>`;
}
function wBody(S, me, ui, P) {
  const isMayor = me === S.mayor, ph = S.phase;
  let h = '';
  const title = ph === 'word' ? '🤫 촌장이 비밀 단어를 고르는 중' : ph === 'look' ? '🌙 밤: 몰래 역할을 확인해요' : ph === 'day' ? '🌞 낮: 질문하고 단어를 맞혀요!' : ph === 'hunt' ? '🐺 늑대인간이 예언자를 찾는 중…' : ph === 'vote' ? '🗳 늑대인간은 누구?' : '🌅 게임 끝';
  const sub = ph === 'day' ? '촌장은 토큰으로만 답해요' : ph === 'hunt' ? `정답은 "${U.esc(S.word)}"! 늑대인간이 예언자를 맞히면 늑대 승리` : ph === 'vote' ? '단어를 못 찾았어요. 늑대인간을 찍어 주세요' : ph === 'word' ? `촌장: ${pn(P, S.mayor)}님` : '';
  h += `<header class="ww-strip ph-${ph}"><span class="ww-moon">${U.img(ph === 'day' ? 'sun' : ph === 'end' && S.wt === 'V' ? 'ww_hit' : 'ww_moon')}</span><div><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>${clock(S)}</header>`;
  if (ph === 'end') {
    const el = wFresh(S, 'end', 4);
    h += `<section class="ww-end ${S.wt === 'V' ? 'v' : 'w'}"${el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s"`}><span class="ww-end-art">${U.img(S.wt === 'V' ? 'house' : 'ww_wolf')}</span><small>비밀 단어</small><b class="ww-end-word">${U.esc(S.word || '—')}</b><strong>${S.wt === 'V' ? '🏡 마을 승리!' : '🐺 늑대인간 승리!'}</strong><p>${U.esc(S.why || '')}</p></section>`;
    h += seats(S, me, P);
    return h;
  }
  if (ph !== 'word') h += roleCard(S, me, ui, P);
  if (ph === 'word') {
    if (isMayor) h += `<section class="ww-panel ww-pick"><div class="ww-h"><b>👑 촌장님, 비밀 단어를 골라 주세요</b><small>모두가 맞히기 너무 쉽지도 어렵지도 않은 걸로! 고르면 늑대인간과 예언자만 이 단어를 알게 돼요.</small></div><div class="ww-words">${S.words.map((w, i) => U.btn(`<small>${i + 1}</small><b>${U.esc(w)}</b>`, 'pick', {w}, 'ww-wbtn')).join('')}</div>${S.reroll ? U.btn('🎲 다른 단어 2개 뽑기 (1번)', 'reroll', {}, 'ww-reroll') : ''}</section>`;
    else h += `<section class="ww-panel ww-waitp"><span class="ww-big">${U.img('ww_mayor')}</span><b>${pn(P, S.mayor)}님이 촌장이에요</b><p>촌장이 비밀 단어를 고르는 동안 기다려 주세요…</p></section>`;
    h += seats(S, me, P);
    return h;
  }
  if (ph === 'look') {
    h += `<section class="ww-panel ww-look"><b>위의 "👁 보기"로 내 역할${S.role[me] !== 'V' || isMayor ? '과 비밀 단어' : ''}를 몰래 확인하세요</b>${me >= 0 && !S.seen[me] ? U.btn('확인했어요', 'seen', {}, 'primary big ww-go') : `<p class="ww-note">다른 사람들이 확인하길 기다리는 중… (${Object.keys(S.seen).length}/${P.length})</p>`}</section>`;
    h += seats(S, me, P);
    return h;
  }
  if (ph === 'day') {
    h += tokBar(S);
    if (isMayor) {
      h += `<section class="ww-panel ww-mayor"><div class="ww-h"><b>👑 촌장: 질문에 토큰으로 답해요</b><small>말로 받은 질문은 아래 버튼으로 바로 답해도 돼요. 단어를 맞히면 🎯정답!</small></div><div class="ww-ansrow free">${['yes', 'no', 'maybe', 'close', 'far', 'hit'].map(k => U.btn(`${U.img(TK[k][1])}<b>${TK[k][0]}</b>`, 'ans', {t: k}, `ww-ab big k-${k}`, !tokOk(S, k))).join('')}</div></section>`;
    } else if (me >= 0) {
      h += `<section class="ww-panel ww-ask"><div class="ww-h"><b>💬 촌장에게 질문하기</b><small>예/아니오로 답할 수 있게 물어요. 단어를 알 것 같으면 그냥 단어를 적어요!</small></div><div class="ww-input"><input id="ww-q" data-field="q" maxlength="60" placeholder="예: 먹을 수 있어요? / 사과?" autocomplete="off">${U.btn('질문하기', 'ask', {}, 'primary big ww-go').replace('<button ', '<button data-fields ')}</div></section>`;
    }
    h += `<section class="ww-panel ww-log"><div class="ww-h"><b>📜 질문과 답</b></div>${qlist(S, P, me, isMayor)}</section>`;
    h += seats(S, me, P);
    return h;
  }
  if (ph === 'hunt') {
    const iW = me >= 0 && S.role[me] === 'W';
    h += `<section class="ww-panel ww-hunt"><span class="ww-big howl">${U.img('ww_wolf')}</span><b class="ww-hword">정답: ${U.esc(S.word)}</b>${iW ? '<p>🐺 늑대인간님! 예언자라고 생각하는 사람을 아래에서 골라 주세요. 한 번에 결정돼요.</p>' : '<p>늑대인간이 예언자를 노리고 있어요… 숨죽여 기다려요.</p>'}</section>`;
    if (iW) {
      h += seats(S, me, P, {sel: ui.wpick}, i => S.role[i] !== 'W');
      h += U.btn(ui.wpick != null ? `${pn(P, ui.wpick)}님이 예언자다!` : '예언자를 골라 주세요', 'hunt', {p: ui.wpick}, 'ww-go hunt big', ui.wpick == null);
    } else h += seats(S, me, P);
    return h;
  }
  if (ph === 'vote') {
    const can = me >= 0 && S.votes[me] == null;
    h += `<section class="ww-panel ww-vote"><span class="ww-big">${U.img('ww_wolf')}</span><b>늑대인간이라고 생각하는 사람을 골라요</b><p>비밀 단어는 끝나고 공개돼요. 가장 많은 표를 받은 사람 중에 늑대인간이 있으면 마을 승리!</p></section>`;
    if (can) {
      h += seats(S, me, P, {sel: ui.wpick}, i => i !== me);
      h += U.btn(ui.wpick != null ? `${pn(P, ui.wpick)}님에게 투표` : '한 명을 골라 주세요', 'vote', {p: ui.wpick}, 'primary big ww-go', ui.wpick == null);
    } else { h += `<p class="ww-note">투표했어요. 다른 사람을 기다리는 중… (${Object.keys(S.votes).length}/${P.length})</p>`; h += seats(S, me, P); }
    return h;
  }
  return h;
}
function wFresh(S, key, dur) {
  if (!isDOM) return -1;
  const W = window; if (!W.__wfx || !W.__wfx[S._g]) return -1;
  W.__wT = W.__wT || {}; const k = S._g + key, now = Date.now();
  if (!W.__wT[k]) W.__wT[k] = now;
  const el = (now - W.__wT[k]) / 1000; return el < dur ? el : -1;
}

/* ---------- 움직임 ---------- */
function wFx(S, me, P) {
  const W = window; W.__wfx = W.__wfx || {};
  const cur = {ph: S.phase, la: S.lastAns ? S.lastAns.n : 0, nq: S.qs.length, end: !!S.winner};
  const rec = W.__wfx[S._g]; W.__wfx[S._g] = cur;
  if (!rec || !document.querySelector('.www')) return;
  if (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = q => document.querySelector(q);
  if (cur.ph !== rec.ph) {
    const B = cur.ph === 'look' ? ['🌙 밤이 되었어요', '몰래 역할을 확인하세요', 'n'] : cur.ph === 'day' ? ['🌞 낮이 밝았어요!', '4분 안에 비밀 단어를 찾아요', 'd'] : cur.ph === 'hunt' ? ['🎯 정답!', `"${S.word}" · 늑대인간이 예언자를 찾아요`, 'g'] : cur.ph === 'vote' ? ['⏰ 단어 찾기 실패', '늑대인간을 투표로 찾아요', 'r'] : cur.ph === 'end' ? [S.wt === 'V' ? '🏡 마을 승리!' : '🐺 늑대인간 승리!', S.why || '', S.wt === 'V' ? 'g' : 'r'] : null;
    if (B) banner(B[0], B[1], B[2]);
    if (cur.ph === 'day') sunrise();
    if (cur.ph === 'hunt') { burst($('.ww-hword'), ['#FFE38A', '#FFD54F', '#FFFFFF', '#7CF0B0'], 40); howl(); }
    if (cur.ph === 'end') setTimeout(() => S.wt === 'V' ? confetti() : howl(), 500);
    document.querySelectorAll('.ww-panel').forEach((e, k) => e.animate && e.animate([{opacity: 0, transform: 'translateY(16px) scale(.98)'}, {opacity: 1, transform: 'none'}], {duration: 450, delay: k * 70, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'backwards'}));
  }
  if (cur.la !== rec.la && S.lastAns) {
    const e = $('.ww-qs li.fresh .ww-tk');
    if (e && e.animate) e.animate([{transform: 'scale(2.4) rotate(-25deg)', opacity: 0}, {transform: 'scale(.9) rotate(6deg)', opacity: 1, offset: .6}, {transform: 'none', opacity: 1}], {duration: 520, easing: 'cubic-bezier(.2,1.5,.4,1)'});
    const k = S.lastAns.t;
    if (e) burst(e, k === 'yes' ? ['#3DDC84', '#B6F5CF', '#fff'] : k === 'no' ? ['#FF5A6E', '#FFC2CA', '#fff'] : k === 'close' ? ['#FF8A3D', '#FFD54F', '#fff'] : k === 'far' ? ['#5AB8FF', '#C8E8FF', '#fff'] : ['#C59BFF', '#fff'], k === 'close' || k === 'far' ? 30 : 14);
    if (k === 'close') shake($('.www'), 6);
  }
  if (cur.nq > rec.nq && cur.ph === 'day') { const e = $('.ww-qs li.pend'); if (e && e.animate) e.animate([{transform: 'translateX(-30px)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 380, easing: 'cubic-bezier(.2,1.3,.4,1)'}); }
  function banner(big, small, tone) {
    document.querySelectorAll('.wwfx-banner').forEach(e => e.remove());
    const el = document.createElement('div'); el.className = 'wwfx-banner t-' + tone;
    el.innerHTML = `<b>${U.esc(big)}</b><small>${U.esc(small)}</small>`;
    const w = $('.www'), wr = w && w.getBoundingClientRect(); if (wr && wr.width) el.style.left = (wr.left + wr.width / 2) + 'px';
    document.body.appendChild(el);
    el.animate([{transform: 'translate(-50%,-50%) scale(.5)', opacity: 0, filter: 'blur(8px)'}, {transform: 'translate(-50%,-50%) scale(1.06)', opacity: 1, filter: 'blur(0)', offset: .18}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .75}, {transform: 'translate(-50%,-62%) scale(.96)', opacity: 0}], {duration: 2000, easing: 'ease-out', fill: 'both'}).onfinish = () => el.remove();
  }
  function burst(src, cols, n) {
    if (!src) return; const r = src.getBoundingClientRect(); if (!r.width) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i'); p.className = 'wwfx-p'; const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 120;
      p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${cols[i % cols.length]}`;
      document.body.appendChild(p);
      p.animate([{transform: 'translate(-50%,-50%) scale(1)', opacity: 1}, {transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(.3)`, opacity: 0}], {duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)'}).onfinish = () => p.remove();
    }
  }
  function shake(e, a) { if (e && e.animate) e.animate([{transform: 'none'}, {transform: `translateX(-${a}px)`}, {transform: `translateX(${a}px)`}, {transform: 'none'}], {duration: 300, iterations: 2}); }
  function sunrise() {
    const el = document.createElement('div'); el.className = 'wwfx-sun'; document.body.appendChild(el);
    el.animate([{opacity: 0}, {opacity: .9, offset: .25}, {opacity: 0}], {duration: 1600, easing: 'ease-out'}).onfinish = () => el.remove();
  }
  function howl() {
    const el = document.createElement('div'); el.className = 'wwfx-howl'; el.innerHTML = `${U.img('ww_moon', 'm')}${U.img('ww_wolf', 'w')}`; document.body.appendChild(el);
    el.animate([{opacity: 0}, {opacity: 1, offset: .2}, {opacity: 1, offset: .75}, {opacity: 0}], {duration: 2200, fill: 'both'}).onfinish = () => el.remove();
  }
  function confetti() {
    const cols = ['#FFD54F', '#7CF0B0', '#8FB8FF', '#FF8FB1', '#fff'];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('i'); p.className = 'wwfx-c'; p.style.cssText = `left:${Math.random() * 100}vw;background:${cols[i % cols.length]}`;
      document.body.appendChild(p);
      p.animate([{transform: 'translateY(-10vh) rotate(0)'}, {transform: `translateY(110vh) rotate(${Math.random() * 720}deg)`}], {duration: 2200 + Math.random() * 1800, delay: Math.random() * 500, easing: 'cubic-bezier(.3,.6,.6,1)'}).onfinish = () => p.remove();
    }
  }
}

/* ---------- AI ---------- */
function wBot(S, P) {
  if (!S || S.winner) return false;
  const run = (i, t, a) => { try { G.werewords.act(S, i, t, a, P); return true; } catch (e) { return false; } };
  const bots = ids(P).filter(i => P[i].bot);
  if (!bots.length) return false;
  if (S.phase === 'word' && P[S.mayor].bot) return run(S.mayor, 'pick', {w: S.words[0]});
  if (S.phase === 'look') { const b = bots.find(i => !S.seen[i]); return b != null ? run(b, 'seen', {}) : false; }
  if (S.phase === 'day') {
    // AI 촌장은 질문 뜻을 몰라서 '애매해요'와 예/아니오를 섞어 답해요 (사람 촌장을 권해요)
    if (P[S.mayor].bot) { const q = S.qs.find(x => !x.t); if (q) { const w = q.q.replace(/[?\s!.]/g, ''); return run(S.mayor, 'ans', {i: q.id, t: w === S.word ? 'hit' : (S.tok.maybe && Math.random() < .3 ? 'maybe' : Math.random() < .5 ? 'yes' : 'no')}); } }
    if (Math.random() < 0.25) {
      const b = bots.filter(i => i !== S.mayor && S.qs.filter(x => x.by === i).length < 6 && !S.qs.some(x => x.by === i && !x.t));
      if (b.length) { const me = b[U.rint(b.length)]; const asked = new Set(S.qs.map(x => x.q)); const opts = BOTQ.filter(q => !asked.has(q)); if (opts.length) return run(me, 'ask', {q: opts[U.rint(opts.length)]}); }
    }
    return false;
  }
  if (S.phase === 'hunt') {
    const w = wolves(S).find(i => P[i].bot); if (w == null || wolves(S).some(i => !P[i].bot)) return false;
    if (Date.now() - S.ts < 5000) return false;
    // 질문을 많이 하고 답을 잘 끌어낸 사람을 예언자로 의심
    const sc = ids(P).filter(i => S.role[i] !== 'W').map(i => [i, S.qs.filter(q => q.by === i && (q.t === 'yes' || q.t === 'close' || q.t === 'hit')).length + Math.random() * 1.5]);
    sc.sort((a, b) => b[1] - a[1]);
    return run(w, 'hunt', {p: sc[0][0]});
  }
  if (S.phase === 'vote') {
    const b = bots.find(i => S.votes[i] == null); if (b == null) return false;
    const cand = ids(P).filter(i => i !== b && !(S.role[b] === 'W' && S.role[i] === 'W'));
    // 질문을 적게 하거나 '아니오'를 많이 받은 사람을 의심
    const sc = cand.map(i => [i, S.qs.filter(q => q.by === i && (q.t === 'no' || q.t === 'far')).length - S.qs.filter(q => q.by === i).length * .3 + Math.random() * 2]);
    sc.sort((a, c) => c[1] - a[1]);
    return run(b, 'vote', {p: sc[0][0]});
  }
  return false;
}
G.werewords.botStep = wBot;
G.werewords.botDelay = S => S && S.phase === 'day' ? 2500 : 0;
G.werewords.BOTNAMES = ['올빼미', '부엉이', '달빛', '별똥', '반딧불', '밤바람', '그림자', '새벽', '고슴도치'];
G.werewords.art = k => k === 'wolf' ? U.img('ww_wolf') : '';
})();
