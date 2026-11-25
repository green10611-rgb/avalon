(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;
const isDOM = typeof document !== 'undefined';

/* =================== 한밤의 수수께끼 (Werewords) =================== */
/* 원작 규칙(Bézier Games, 2017)
   - 시장·예언자·늑대인간(7명 이상이면 2장) 카드에 마을 사람 카드를 더해 '인원+1장'을 만들어 한 장씩 나눠요.
     시장 카드를 받은 사람은 시장임을 공개하고, 남은 한 장을 몰래 봐요 → 그게 시장의 비밀 역할(예언자·늑대인간·마을 사람 중 하나).
   - 밤: 시장이 비밀 역할을 확인하고 단어를 골라요 → 예언자가 단어를 봐요 → 늑대인간이 단어를 봐요(늑대가 둘이면 서로를 알아요).
   - 낮 4분: 모두 예/아니오 질문, 시장은 토큰으로만 답해요(예/아니오 36 · 애매해요 10 · 아주 가까워요 1 · 정답 1).
   - 맞히면: 늑대인간이 정체를 드러내고 15초 안에 예언자를 지목 → 맞히면 늑대 승, 틀리면 마을 승.
   - 못 맞히면(시간 끝·예/아니오 토큰 바닥): 1분 토론 후 모두 늑대인간을 지목. 최다 득표자(동점이면 모두) 중 늑대가 있으면 마을 승.
     단, 모두가 정확히 1표씩 받았으면 늑대 승.
   온라인 규칙: 질문은 '질문 채팅'으로, 한 사람당 3초에 한 번. 질문은 먼저 온 순서대로 시장에게 가고,
   시장이 5초 안에 답하지 않으면 그 질문은 사라져요. 다음 질문의 5초는 앞 질문이 끝난 뒤부터 시작돼요. */
const WORDS = ('사과 바나나 수박 딸기 포도 귤 복숭아 감자 고구마 당근 양파 김치 라면 떡볶이 김밥 피자 햄버거 치킨 아이스크림 초콜릿 케이크 빵 우유 커피 사탕 계란 밥 국수 만두 삼겹살 ' +
  '강아지 고양이 호랑이 사자 코끼리 기린 토끼 거북이 펭귄 돌고래 상어 고래 원숭이 판다 곰 여우 늑대 독수리 참새 닭 돼지 소 말 뱀 개구리 나비 모기 개미 꿀벌 공룡 ' +
  '자동차 버스 기차 비행기 배 자전거 오토바이 지하철 택시 헬리콥터 로켓 엘리베이터 ' +
  '연필 지우개 공책 책상 의자 가방 칠판 시계 안경 우산 신발 모자 장갑 양말 거울 칫솔 수건 베개 이불 냉장고 세탁기 텔레비전 컴퓨터 휴대폰 카메라 전구 열쇠 가위 풍선 ' +
  '학교 병원 도서관 공원 바다 산 강 섬 사막 동물원 놀이공원 수영장 영화관 편의점 교회 경찰서 소방서 공항 박물관 ' +
  '선생님 의사 경찰 소방관 요리사 가수 화가 군인 농부 우주비행사 대통령 마술사 해적 ' +
  '해 달 별 구름 비 눈 무지개 번개 바람 불 얼음 나무 꽃 돌 모래 ' +
  '축구 야구 농구 피아노 기타 드럼 생일 크리스마스 설날 여름방학 시험 숙제 꿈 사랑 친구 가족 돈 선물 편지 사진 노래 영화 게임 로봇 유령 마법사 왕관 보물').split(' ');
const BOTQ = ['살아있는 거예요?', '먹을 수 있어요?', '손에 들 수 있어요?', '집 안에 있어요?', '동물이에요?', '전기가 필요해요?', '사람보다 커요?', '밖에서 볼 수 있어요?', '돈 주고 사요?', '학교에 있어요?', '물과 관련 있어요?', '탈 수 있어요?', '날 수 있어요?', '매일 써요?', '사람이에요?', '장소예요?', '자연에 있어요?', '여름이랑 관련 있어요?'];
// 토큰 (원작 기본판)
const TK = {yes: ['예', 'ww_yes'], no: ['아니오', 'ww_no'], maybe: ['애매해요', 'ww_maybe'], close: ['아주 가까워요', 'ww_hot'], hit: ['정답!', 'ww_hit']};
const TKS = ['yes', 'no', 'maybe', 'close', 'hit'];
const ROLE = {
  W: ['늑대인간', 'ww_wolf', '단어를 알아요. 마을이 못 맞히게 슬쩍 헷갈리게 해요. 단어가 맞혀지면 예언자를 찾아내면 이겨요.'],
  S: ['예언자', 'crystal', '단어를 알아요. 마을이 맞히도록 몰래 도와요. 너무 티 나면 늑대에게 들켜요!'],
  V: ['마을 사람', 'ww_farmer', '단어를 몰라요. 질문으로 단어를 찾아내고, 늑대인간을 가려내요.']};
const DAY = 240, HUNT = 15, VOTE = 60, ANS = 5, ASKGAP = 3;
const ids = P => P.map((_, i) => i);
const pn = (P, i) => U.nm(P, i);
const wolves = S => S.role.map((r, i) => r === 'W' ? i : -1).filter(i => i >= 0);
const lg = (S, m) => U.log(S, m);
const now = () => Date.now();

function pickWords(S) { const pool = WORDS.filter(w => !(S.used || []).includes(w)); return U.shuffle(pool.slice()).slice(0, 2); }
function toPhase(S, ph, len) { S.phase = ph; S.ts = now(); S.len = len || 0; S.n++; }
function finish(S, P, wt, why) {
  S.phase = 'end'; S.wt = wt; S.why = why; S.queue = []; S.n++;
  S.winner = wt === 'V' ? `🏡 마을 승리! ${why}` : `🐺 늑대인간 승리! ${why}`;
  lg(S, S.winner);
}
function toVote(S, P, why) { S.queue = []; toPhase(S, 'vote', VOTE); S.votes = {}; lg(S, `${why} 1분 동안 이야기하고 늑대인간을 지목해요!`); }
function tally(S, P) {
  const cnt = P.map(() => 0); Object.values(S.votes).forEach(v => { if (v >= 0) cnt[v]++; });
  const mx = Math.max(...cnt); const top = mx > 0 ? ids(P).filter(i => cnt[i] === mx) : [];
  S.vcnt = cnt; S.vtop = top;
  if (mx === 1 && cnt.every(c => c === 1)) return finish(S, P, 'W', '모두가 한 표씩 받아 아무도 가려내지 못했어요.');
  const hit = top.filter(i => S.role[i] === 'W');
  if (hit.length) finish(S, P, 'V', `${hit.map(i => P[i].name).join(', ')}님이 늑대인간이었어요!`);
  else finish(S, P, 'W', top.length ? `${top.map(i => P[i].name).join(', ')}님은 늑대인간이 아니었어요.` : '아무도 지목하지 못했어요.');
}
// 질문 줄: 맨 앞 질문만 시장에게 가고, 5초 안에 답이 없으면 사라져요
const head = S => S.queue && S.queue.length ? S.qs[S.queue[0]] : null;
function nextHead(S) { S.queue.shift(); S.headAt = now(); }
function expire(S, P) {
  let changed = false;
  while (S.phase === 'day' && S.queue.length && now() >= S.headAt + ANS * 1000 - 150) {
    const q = S.qs[S.queue[0]]; q.gone = 1; nextHead(S); changed = true;
    S.goneN = (S.goneN || 0) + 1; S.lastGone = {id: q.id};
  }
  if (changed) S.n++;
  return changed;
}

G.werewords = {
  name: '한밤의 수수께끼', tag: '예/아니오로 비밀 단어 맞히기, 숨은 늑대인간 찾기', min: 4, max: 10, mark: '🌙', hue: '#3B2C7A',
  rules: ['시장·예언자·늑대인간(7명 이상이면 2명)·마을 사람 역할을 나눠요. 시장은 모두에게 공개되고, 시장도 예언자·늑대인간·마을 사람 중 하나의 비밀 역할을 따로 가져요.',
    '밤: 시장이 비밀 역할을 확인하고 단어를 골라요. 예언자와 늑대인간이 그 단어를 몰래 봐요(늑대가 둘이면 서로를 알아요). 마을 사람은 단어를 몰라요.',
    '낮 4분: "질문 채팅"으로 예/아니오로 답할 수 있는 질문을 하거나 단어를 맞혀 봐요(한 사람당 3초에 한 번).',
    '질문은 먼저 온 순서대로 시장에게 가요. 시장은 말없이 토큰(예·아니오·애매해요·아주 가까워요·정답)으로만, 5초 안에 답해요. 5초가 지나면 그 질문은 사라지고, 다음 질문의 5초가 시작돼요.',
    '토큰은 예/아니오 36개, 애매해요 10개, 아주 가까워요 1개뿐! 예/아니오 토큰이 바닥나거나 시간이 끝나면 단어 찾기는 실패예요.',
    '단어를 맞히면: 늑대인간이 정체를 드러내고 15초 안에 예언자를 지목해요. 맞히면 늑대 승리, 틀리면 마을 승리.',
    '못 맞히면: 1분 동안 이야기하고 모두 늑대인간을 지목해요. 가장 많이 지목된 사람(동점이면 모두) 중에 늑대인간이 있으면 마을 승리. 모두가 한 표씩 받으면 늑대 승리.',
    '시장이 늑대인간이면 토큰으로 거짓말을 해도 돼요!'],
  rulesExtra() { return `<section class="ww-legend">${TKS.map(k => tkimg(k)).join('')}</section>`; },
  setup(P) {
    const n = P.length; if (n < 4 || n > 10) throw U.err('4~10명이 필요해요.');
    const nw = n >= 7 ? 2 : 1;
    // 시장 카드 + 예언자 + 늑대 + 마을 사람 = 인원+1장. 시장 카드를 받은 사람이 남은 한 장(deck[n])을 비밀 역할로 가져요.
    const deck = U.shuffle(['M', 'S'].concat(Array(nw).fill('W'), Array(n + 1 - 2 - nw).fill('V')));
    const humans = ids(P).filter(i => !P[i].bot);
    let mayor = deck.indexOf('M');
    // 시장 카드가 가운데 남았거나 AI에게 갔으면 사람 한 명과 바꿔요(AI는 질문을 알아듣지 못해 시장을 못 맡아요)
    if (mayor === n || (P[mayor].bot && humans.length)) {
      const h = humans.length ? humans[U.rint(humans.length)] : U.rint(n);
      [deck[mayor], deck[h]] = [deck[h], deck[mayor]]; mayor = h;
    }
    const role = deck.slice(0, n); role[mayor] = deck[n];
    const S = {_g: Math.random().toString(36).slice(2, 9), role, mayor, word: '', words: [], reroll: 1, used: [], qs: [], queue: [], headAt: 0, lastAsk: {}, tok: {yn: 36, maybe: 10, close: 1}, seen: {}, votes: {}, n: 0, log: [`🌙 한밤의 수수께끼! 시장은 ${P[mayor].name}님이에요.`]};
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
  allTurn(S) { return S.phase === 'day' ? '🌞 낮: 질문하고 맞혀요!' : S.phase === 'look' ? '🌙 모두 몰래 역할 확인' : S.phase === 'vote' ? '🗳 모두 늑대인간 지목하기' : S.phase === 'hunt' ? '🐺 늑대인간이 예언자를 찾는 중…' : S.phase === 'word' ? '🤫 시장이 단어를 고르는 중' : ''; },
  open(S) { return S.phase === 'day' || S.phase === 'hunt'; },
  due(S) {
    if (S.winner || !S.len || !['day', 'hunt', 'vote'].includes(S.phase)) return null;
    const end = S.ts + S.len * 1000;
    return S.phase === 'day' && S.queue.length ? Math.min(end, S.headAt + ANS * 1000) : end;
  },
  timeout(S, P) {
    if (S.winner || !S.len) return false;
    const late = now() >= S.ts + S.len * 1000 - 300;
    if (S.phase === 'day') {
      if (late) { toVote(S, P, '⏰ 시간이 다 됐어요! 단어를 못 찾았어요.'); return true; }
      return expire(S, P);
    }
    if (!late) return false;
    if (S.phase === 'hunt') { finish(S, P, 'V', `늑대인간이 15초 안에 예언자를 지목하지 못했어요. (단어: "${S.word}")`); return true; }
    if (S.phase === 'vote') { tally(S, P); return true; }
    return false;
  },
  act(S, me, t, a, P) {
    if (S.winner) return;
    a = a || {};
    if (S.phase === 'day') expire(S, P);
    if (t === 'reroll') {
      if (S.phase !== 'word' || me !== S.mayor) throw U.err('시장만 단어를 골라요.');
      if (!S.reroll) throw U.err('다시 뽑기는 한 번만 돼요.');
      S.used = S.used.concat(S.words); S.words = pickWords(S); S.reroll--; S.n++; return;
    }
    if (t === 'pick') {
      if (S.phase !== 'word' || me !== S.mayor) throw U.err('시장만 단어를 골라요.');
      const w = String(a.w || '');
      if (!S.words.includes(w)) throw U.err('단어를 골라 주세요.');
      S.word = w; S.seen = {}; toPhase(S, 'look');
      lg(S, '🤫 시장이 비밀 단어를 골랐어요. 예언자와 늑대인간은 단어를 확인해요.');
      return;
    }
    if (t === 'seen') {
      if (S.phase !== 'look') throw U.err('지금은 확인할 때가 아니에요.');
      S.seen[me] = 1; S.n++;
      if (ids(P).every(i => S.seen[i])) { toPhase(S, 'day', DAY); S.queue = []; lg(S, '🌞 낮이 밝았어요! 4분 안에 단어를 맞혀요.'); }
      return;
    }
    if (t === 'ask') {
      if (S.phase !== 'day') throw U.err('지금은 질문할 수 없어요.');
      if (me === S.mayor) throw U.err('시장은 토큰으로만 답해요.');
      const q = String(a.q || '').trim().replace(/\s+/g, ' ').slice(0, 50);
      if (!q) throw U.err('질문이나 맞힐 단어를 적어 주세요.');
      if (now() - (S.lastAsk[me] || 0) < ASKGAP * 1000 - 100) throw U.err(`질문은 ${ASKGAP}초에 한 번만 할 수 있어요.`);
      if (S.queue.filter(i => S.qs[i].by === me).length >= 3) throw U.err('내 질문이 3개 밀려 있어요. 시장의 답을 기다려 주세요.');
      const id = S.qs.length;
      S.qs.push({id, by: me, q, t: null});
      if (!S.queue.length) S.headAt = now();
      S.queue.push(id); S.lastAsk[me] = now(); S.n++;
      return;
    }
    if (t === 'ans') {
      if (S.phase !== 'day' || me !== S.mayor) throw U.err('시장만 답해요.');
      const k = a.t; if (!TK[k]) throw U.err('토큰을 골라 주세요.');
      if ((k === 'yes' || k === 'no') && S.tok.yn <= 0) throw U.err('예/아니오 토큰이 없어요.');
      if (k === 'maybe' && S.tok.maybe <= 0) throw U.err('애매해요 토큰을 다 썼어요.');
      if (k === 'close' && S.tok.close <= 0) throw U.err('아주 가까워요 토큰은 한 번만 쓸 수 있어요.');
      let q = head(S);
      if (a.i != null && (!q || q.id !== +a.i)) throw U.err('그 질문은 시간이 지나 사라졌어요.');
      if (q) nextHead(S);
      else { if (!a.free) throw U.err('답할 질문이 없어요.'); q = {id: S.qs.length, by: -1, q: '', t: null}; S.qs.push(q); }
      q.t = k; S.n++;
      if (k === 'yes' || k === 'no') S.tok.yn--; else if (k === 'maybe') S.tok.maybe--; else if (k === 'close') S.tok.close--;
      S.lastAns = {id: q.id, t: k, n: S.n};
      if (k === 'hit') {
        S.found = q.by; S.queue = []; toPhase(S, 'hunt', HUNT);
        lg(S, `🎯 정답! 단어는 "${S.word}"${q.by >= 0 ? ` · ${P[q.by].name}님이 맞혔어요` : ''}. 늑대인간이 정체를 드러내고 예언자를 찾아요!`);
        return;
      }
      if (S.tok.yn <= 0) toVote(S, P, '예/아니오 토큰이 바닥났어요!');
      return;
    }
    if (t === 'hunt') {
      if (S.phase !== 'hunt' || S.role[me] !== 'W') throw U.err('늑대인간만 지목할 수 있어요.');
      const p = +a.p; if (!(p >= 0 && p < P.length) || S.role[p] === 'W') throw U.err('늑대인간이 아닌 사람을 골라요.');
      S.hunted = p; S.huntBy = me;
      if (S.role[p] === 'S') finish(S, P, 'W', `${P[p].name}님이 예언자였어요! (단어: "${S.word}")`);
      else finish(S, P, 'V', `${P[p].name}님은 예언자가 아니었어요. (단어: "${S.word}")`);
      return;
    }
    if (t === 'vote') {
      if (S.phase !== 'vote') throw U.err('지금은 지목할 때가 아니에요.');
      const p = +a.p; if (!(p >= 0 && p < P.length) || p === me) throw U.err('나 말고 다른 사람을 골라요.');
      if (S.votes[me] != null) throw U.err('이미 지목했어요.');
      S.votes[me] = p; S.n++;
      if (ids(P).every(i => S.votes[i] != null)) tally(S, P);
      return;
    }
    throw U.err('알 수 없는 행동이에요.');
  },
  view(S, me, ui, P) {
    if (isDOM) setTimeout(() => wFx(S, me, P), 0);
    return `<div class="wwbox"><div class="www ph-${S.phase}${S.winner ? ' won-' + S.wt : ''}"><div class="ww-sky" aria-hidden="true"><i class="s1"></i><i class="s2"></i><i class="s3"></i><span class="ww-cl c1"></span><span class="ww-cl c2"></span></div>${wBody(S, me, ui || {}, P)}</div></div>`;
  },
  uiAct(ui, S, me, name, val) {
    if (name === 'wpick') { ui.wpick = ui.wpick === val ? null : val; return; }
  },
  splash: true
};

/* ---------- 시간 표시 (기기 시계 차이를 피하려고, 처음 본 순간부터 세요) ---------- */
function seenAt(key) { const W = window; W.__wwT = W.__wwT || {}; return W.__wwT[key] = W.__wwT[key] || Date.now(); }
const fmt = s => { s = Math.ceil(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function ring(len, key, cls, label) {
  const seen = isDOM ? seenAt(key) : Date.now(), left = Math.max(0, len - (Date.now() - seen) / 1000), f = left / len;
  if (isDOM) wTick();
  return `<span class="ww-ring ${cls}${left < len * .25 ? ' hurry' : ''}" data-seen="${seen}" data-len="${len}" style="--f:${f.toFixed(3)}"><svg viewBox="0 0 40 40"><circle class="bg" cx="20" cy="20" r="17"/><circle class="fg" cx="20" cy="20" r="17" pathLength="100"/></svg><b>${label === 'sec' ? Math.ceil(left) : fmt(left)}</b></span>`;
}
function wTick() {
  const W = window; if (W.__wwTick) return;
  W.__wwTick = setInterval(() => {
    document.querySelectorAll('.ww-ring[data-seen]').forEach(e => {
      const len = +e.dataset.len, left = Math.max(0, len - (Date.now() - +e.dataset.seen) / 1000);
      e.style.setProperty('--f', (left / len).toFixed(3));
      const b = e.querySelector('b'); if (b) b.textContent = e.classList.contains('sec') ? Math.ceil(left) : fmt(left);
      e.classList.toggle('hurry', left < len * .25);
    });
    document.querySelectorAll('.ww-cool[data-until]').forEach(e => {
      const l = Math.max(0, +e.dataset.until - Date.now()); const b = e.querySelector('i');
      if (l <= 0) { e.removeAttribute('data-until'); e.disabled = false; e.classList.remove('cooling'); if (b) b.textContent = ''; }
      else if (b) b.textContent = ` ${Math.ceil(l / 1000)}`;
    });
  }, 200);
}

/* ---------- 화면 ---------- */
const tkimg = (k, cls = '') => `<span class="ww-tk k-${k} ${cls}">${U.img(TK[k][1])}<b>${TK[k][0]}</b></span>`;
const tokOk = (S, k) => k === 'yes' || k === 'no' ? S.tok.yn > 0 : k === 'maybe' ? S.tok.maybe > 0 : k === 'close' ? S.tok.close > 0 : true;
const tokLeft = (S, k) => k === 'yes' || k === 'no' ? S.tok.yn : k === 'maybe' ? S.tok.maybe : k === 'close' ? S.tok.close : 1;
function roleCard(S, me, ui, P) {
  if (me < 0 || !S.role) return '';
  const r = S.role[me], R0 = ROLE[r], knows = r !== 'V' || me === S.mayor;
  const open = !!ui.wwpeek, mates = r === 'W' ? wolves(S).filter(i => i !== me) : [];
  return `<section class="ww-my${open ? ' open' : ''}">
<div class="ww-flip"><div class="ww-face back"><span class="ww-back-moon">${U.img('ww_moon')}</span><b>${me === S.mayor ? '👑 나는 시장 · 비밀 역할' : '내 비밀 역할'}</b><small>남에게 안 보이게 확인하세요</small></div>
<div class="ww-face front r-${r}"><span class="ww-rimg">${U.img(R0[1])}</span><div class="ww-rtxt"><small>${me === S.mayor ? '시장의 비밀 역할' : '나의 역할'}</small><b>${R0[0]}</b><p>${R0[2]}</p>${mates.length ? `<p class="ww-mates">🐺 동료 늑대: ${mates.map(i => pn(P, i)).join(', ')}</p>` : ''}${knows && S.word ? `<div class="ww-word"><small>비밀 단어</small><b>${U.esc(S.word)}</b></div>` : ''}</div></div></div>
${U.ub(open ? '🙈 숨기기' : '👁 역할 보기', 'wwpeek', true, `ww-peek${open ? '' : ' primary'}`)}</section>`;
}
function seats(S, me, P, pick) {
  const ph = S.phase, end = ph === 'end', reveal = ph === 'hunt';
  return `<section class="ww-seats n${P.length}">${ids(P).map((i, k) => {
    const r = S.role[i], cnt = S.qs.filter(q => q.by === i && !q.gone).length;
    const showRole = end || (reveal && r === 'W');
    const can = pick && pick.ok(i);
    const badge = `${i === S.mayor ? `<span class="ww-badge mayor">${U.img('ww_mayor')}시장</span>` : ''}${showRole ? `<span class="ww-rbadge r-${r}">${U.img(ROLE[r][1])}${ROLE[r][0]}</span>` : ''}`;
    const extra = `${ph === 'vote' && S.votes[i] != null ? '<span class="ww-voted">✔ 지목함</span>' : ''}${end && S.vcnt && S.vcnt[i] ? `<span class="ww-vc">👉 ${S.vcnt[i]}표</span>` : ''}${end && S.found === i ? '<span class="ww-vc gold">🎯 맞힘</span>' : ''}`;
    const inner = `<span class="ww-av" style="--pc:${U.pc(i)}">${showRole ? U.img(ROLE[r][1]) : `<b>${U.esc(Array.from(String(P[i].name || '?').replace(/^🤖\s*/u, ''))[0] || '?')}</b>`}</span><span class="ww-sn"><b>${pn(P, i)}${i === me ? ' <small>(나)</small>' : ''}</b><span class="ww-sb">${badge}${!end ? `<em>💬 ${cnt}</em>` : ''}${extra}</span></span>`;
    const cls = `ww-seat${showRole ? ' rv r-' + r : ''}${end && S.hunted === i ? ' hunted' : ''}${end && S.vtop && S.vtop.includes(i) ? ' top' : ''}${i === me ? ' me' : ''}`;
    return can ? `<button type="button" class="${cls} pick${pick.sel === i ? ' on' : ''}" style="--pc:${U.pc(i)};--k:${k}" data-g="wpick" data-val="${i}">${inner}</button>` : `<div class="${cls}" style="--pc:${U.pc(i)};--k:${k}">${inner}</div>`;
  }).join('')}</section>`;
}
function tokBar(S) {
  const yn = S.tok.yn;
  return `<section class="ww-tokbar"><span class="ww-tb yn${yn <= 8 ? ' low' : ''}"><span class="ww-tb-ic">${U.img('ww_yes')}${U.img('ww_no')}</span><b>${yn}</b><small>예/아니오</small><i class="ww-tb-bar"><i style="width:${yn / 36 * 100}%"></i></i></span><span class="ww-tb${S.tok.maybe ? '' : ' used'}"><span class="ww-tb-ic">${U.img('ww_maybe')}</span><b>${S.tok.maybe}</b><small>애매해요</small></span><span class="ww-tb${S.tok.close ? '' : ' used'}"><span class="ww-tb-ic">${U.img('ww_hot')}</span><b>${S.tok.close}</b><small>가까워요</small></span></section>`;
}
function chat(S, P, me) {
  const list = S.qs.filter(q => !q.gone || (S.lastGone && S.lastGone.id === q.id)).slice(-40);
  const hd = head(S);
  const bubbles = list.map(q => {
    const mine = q.by === me, qi = S.queue.indexOf(q.id);
    const st = q.gone ? 'gone' : q.t ? 'done' : qi === 0 ? 'head' : 'wait';
    const tag = q.gone ? '<span class="ww-st gone">⌛ 5초가 지나 사라졌어요</span>' : q.t ? tkimg(q.t, 'stamp' + (S.lastAns && S.lastAns.id === q.id ? ' fresh' : '')) : qi === 0 ? `<span class="ww-st head">${ring(ANS, S._g + ':h:' + q.id + ':' + S.headAt, 'sec r-mini', 'sec')} 시장이 답하는 중</span>` : `<span class="ww-st wait">⏳ ${qi}번째 대기</span>`;
    return `<li class="ww-b ${st}${mine ? ' mine' : ''}${q.by < 0 ? ' oral' : ''}" data-q="${q.id}"><span class="ww-bwho" style="--pc:${U.pc(Math.max(0, q.by))}">${q.by >= 0 ? pn(P, q.by) : '🗣 말로 한 질문'}</span><p>${q.by >= 0 ? U.esc(q.q) : '(토큰만 사용)'}</p>${tag}</li>`;
  }).join('');
  const canAsk = me >= 0 && me !== S.mayor;
  const until = canAsk ? (S.lastAsk[me] || 0) + ASKGAP * 1000 : 0, cool = isDOM && Date.now() < until;
  if (isDOM) wTick();
  return `<section class="ww-chat"><header class="ww-ch-h"><b>💬 질문 채팅</b><small>한 사람당 ${ASKGAP}초에 한 번 · 시장은 ${ANS}초 안에 답해요</small></header>
<ol class="ww-bubbles">${bubbles || `<li class="ww-b empty">${me === S.mayor ? '질문이 오면 여기에 차례로 쌓여요.' : '첫 질문을 보내 보세요! 예: "먹을 수 있어요?"'}</li>`}</ol>
${canAsk ? `<div class="ww-send"><input id="ww-q" data-field="q" data-clear data-enter maxlength="50" placeholder="${hd ? '질문은 순서대로 시장에게 가요' : '예: 살아있는 거예요? / 사과?'}" autocomplete="off"><button type="button" class="btn primary ww-cool${cool ? ' cooling' : ''}" data-act="ask" data-arg="{}" data-fields${cool ? ` data-until="${until}" disabled` : ''}>보내기<i>${cool ? ' ' + Math.ceil((until - Date.now()) / 1000) : ''}</i></button></div>` : me === S.mayor ? '<p class="ww-ch-note">👑 시장은 말없이 토큰으로만 답해요.</p>' : ''}</section>`;
}
function mayorPad(S, P, ui) {
  const q = head(S), local = !!ui._local;
  const btns = free => TKS.map(k => U.btn(`<span class="ww-abi">${U.img(TK[k][1])}</span><b>${TK[k][0]}</b>${k !== 'hit' ? `<small>${tokLeft(S, k)}</small>` : ''}`, 'ans', free ? {t: k, free: 1} : {t: k, i: q.id}, `ww-ab k-${k}`, !tokOk(S, k))).join('');
  if (q) return `<section class="ww-pad live"><div class="ww-pad-q"><span class="ww-bwho" style="--pc:${U.pc(q.by)}">${pn(P, q.by)}님의 질문</span>${ring(ANS, S._g + ':h:' + q.id + ':' + S.headAt, 'sec r-big', 'sec')}<p>${U.esc(q.q)}</p>${S.queue.length > 1 ? `<small>뒤에 ${S.queue.length - 1}개 대기 중</small>` : ''}</div><div class="ww-abs">${btns(false)}</div></section>`;
  return `<section class="ww-pad idle"><div class="ww-pad-q"><span class="ww-pad-ic">${U.img('ww_talk')}</span><p>${local ? '말로 받은 질문에 바로 토큰으로 답해요' : '질문을 기다리는 중…'}</p><small>${local ? '한 폰으로 할 땐 질문을 말로 하고, 시장이 아래 토큰을 눌러요.' : '질문이 오면 5초 안에 토큰을 눌러 답해요.'}</small></div>${local ? `<div class="ww-abs">${btns(true)}</div>` : ''}</section>`;
}
function spotlight(S, P) {
  const q = head(S);
  if (!q) return `<section class="ww-spot idle"><span class="ww-spot-ic">${U.img('ww_mayor')}</span><p>시장이 다음 질문을 기다리고 있어요</p></section>`;
  return `<section class="ww-spot live"><span class="ww-bwho" style="--pc:${U.pc(q.by)}">${pn(P, q.by)}님의 질문</span><p>“${U.esc(q.q)}”</p>${ring(ANS, S._g + ':h:' + q.id + ':' + S.headAt, 'sec r-big', 'sec')}</section>`;
}
function lastAnswer(S, P) {
  const L = S.lastAns; if (!L) return '';
  const q = S.qs[L.id]; if (!q) return '';
  return `<section class="ww-last k-${L.t}"><small>방금 시장의 답</small><div>${tkimg(L.t, 'big')}<p>${q.by >= 0 ? `<b>${pn(P, q.by)}</b> “${U.esc(q.q)}”` : '말로 한 질문'}</p></div></section>`;
}
function wBody(S, me, ui, P) {
  const isMayor = me === S.mayor, ph = S.phase;
  let h = '';
  const title = ph === 'word' ? '🤫 시장이 비밀 단어를 고르는 중' : ph === 'look' ? '🌙 밤: 몰래 역할을 확인해요' : ph === 'day' ? '🌞 낮: 질문하고 단어를 맞혀요!' : ph === 'hunt' ? '🐺 늑대인간이 예언자를 노려요!' : ph === 'vote' ? '🗳 늑대인간은 누구?' : S.wt === 'V' ? '🏡 마을 승리!' : '🐺 늑대인간 승리!';
  const sub = ph === 'day' ? '시장은 말없이 토큰으로만 답해요' : ph === 'hunt' ? `정답 "${U.esc(S.word)}"! 늑대인간이 15초 안에 예언자를 지목해요` : ph === 'vote' ? '단어를 못 찾았어요. 1분 동안 이야기하고 늑대인간을 지목해요' : ph === 'word' ? `시장: ${pn(P, S.mayor)}님` : ph === 'look' ? `확인 ${Object.keys(S.seen).length}/${P.length}명` : '';
  const tm = ['day', 'hunt', 'vote'].includes(ph) && S.len ? ring(S.len, S._g + ':' + ph + ':' + S.ts, 'r-main', 'mm') : '';
  h += `<header class="ww-strip"><span class="ww-moon">${U.img(ph === 'day' ? 'sun' : ph === 'end' && S.wt === 'V' ? 'house' : ph === 'end' || ph === 'hunt' ? 'ww_wolf' : 'ww_moon')}</span><div class="ww-tt"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>${tm}</header>`;
  if (ph === 'end') {
    const el = wFresh(S, 'end', 5);
    h += `<section class="ww-end ${S.wt === 'V' ? 'v' : 'w'}"${el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s"`}><span class="ww-end-art">${U.img(S.wt === 'V' ? 'house' : 'ww_wolf')}</span><small>비밀 단어</small><b class="ww-end-word">${U.esc(S.word || '—')}</b><strong>${S.wt === 'V' ? '🏡 마을 승리!' : '🐺 늑대인간 승리!'}</strong><p>${U.esc(S.why || '')}</p></section>`;
    return h + seats(S, me, P);
  }
  if (ph === 'word') {
    if (isMayor) h += roleCard(S, me, ui, P) + `<section class="ww-panel ww-pick"><div class="ww-h"><b>👑 시장님, 비밀 단어를 골라 주세요</b><small>위에서 내 비밀 역할을 먼저 확인하세요! 늑대인간이면 조금 어려운 단어, 예언자면 조금 쉬운 단어가 좋아요. 고르면 예언자와 늑대인간이 이 단어를 알게 돼요.</small></div><div class="ww-words">${S.words.map((w, i) => U.btn(`<small>${i + 1}</small><b>${U.esc(w)}</b>`, 'pick', {w}, 'ww-wbtn')).join('')}</div>${S.reroll ? U.btn('🎲 다른 단어 2개 뽑기 (1번)', 'reroll', {}, 'ww-reroll') : ''}</section>`;
    else h += `<section class="ww-panel ww-waitp"><span class="ww-big">${U.img('ww_mayor')}</span><b>${pn(P, S.mayor)}님이 시장이에요</b><p>시장이 비밀 역할을 확인하고 단어를 고르는 동안 기다려요… 🌙</p></section>`;
    return h + seats(S, me, P);
  }
  if (ph === 'look') {
    h += roleCard(S, me, ui, P);
    h += `<section class="ww-panel ww-look"><b>${me >= 0 && (S.role[me] !== 'V' || isMayor) ? '역할과 비밀 단어를 몰래 확인했으면' : '역할을 몰래 확인했으면'} 눌러 주세요</b>${me >= 0 && !S.seen[me] ? U.btn('✅ 확인했어요', 'seen', {}, 'primary big ww-go') : `<p class="ww-note">다른 사람을 기다리는 중… (${Object.keys(S.seen).length}/${P.length})</p>`}</section>`;
    return h + seats(S, me, P);
  }
  if (ph === 'day') {
    h += `<div class="ww-day${isMayor ? ' mayor' : ''}"><div class="ww-left">${tokBar(S)}${isMayor ? `<div class="ww-mword"><small>비밀 단어</small><b>${ui._local && !ui.wwpeek ? '••••' : U.esc(S.word)}</b></div>` + mayorPad(S, P, ui) : spotlight(S, P)}${lastAnswer(S, P)}${roleCard(S, me, ui, P)}</div><div class="ww-right">${chat(S, P, me)}</div></div>`;
    return h + seats(S, me, P);
  }
  if (ph === 'hunt') {
    const iW = me >= 0 && S.role[me] === 'W';
    h += `<section class="ww-panel ww-hunt"><span class="ww-big howl">${U.img('ww_wolf')}</span><b class="ww-hword">정답: ${U.esc(S.word)}</b><p>${iW ? '🐺 늑대인간님! 예언자라고 생각하는 사람을 골라 지목하세요. 한 번에 결정돼요.' : `늑대인간 <b>${wolves(S).map(i => pn(P, i)).join(', ')}</b>님이 정체를 드러냈어요! 예언자를 노리고 있어요…`}</p></section>`;
    if (iW) h += seats(S, me, P, {sel: ui.wpick, ok: i => S.role[i] !== 'W'}) + U.btn(ui.wpick != null ? `🔮 ${pn(P, ui.wpick)}님이 예언자다!` : '예언자를 골라 주세요', 'hunt', {p: ui.wpick}, 'ww-go hunt big', ui.wpick == null);
    else h += seats(S, me, P);
    return h;
  }
  if (ph === 'vote') {
    const can = me >= 0 && S.votes[me] == null;
    h += `<section class="ww-panel ww-vote"><span class="ww-big">${U.img('ww_wolf')}</span><b>늑대인간이라고 생각하는 사람을 지목해요</b><p>말로 실컷 따져 보세요! 가장 많이 지목된 사람(동점이면 모두) 중에 늑대인간이 있으면 마을 승리.</p></section>`;
    if (can) h += seats(S, me, P, {sel: ui.wpick, ok: i => i !== me}) + U.btn(ui.wpick != null ? `👉 ${pn(P, ui.wpick)}님을 지목` : '한 명을 골라 주세요', 'vote', {p: ui.wpick}, 'primary big ww-go', ui.wpick == null);
    else h += `<p class="ww-note">지목했어요. 다른 사람을 기다리는 중… (${Object.keys(S.votes).length}/${P.length})</p>` + seats(S, me, P);
    return h;
  }
  return h;
}
function wFresh(S, key, dur) {
  if (!isDOM) return -1;
  const W = window; if (!W.__wfx || !W.__wfx[S._g]) return -1;
  W.__wT2 = W.__wT2 || {}; const k = S._g + key, t = Date.now();
  if (!W.__wT2[k]) W.__wT2[k] = t;
  const el = (t - W.__wT2[k]) / 1000; return el < dur ? el : -1;
}

/* ---------- 움직임 ---------- */
function wFx(S, me, P) {
  const W = window; W.__wfx = W.__wfx || {};
  const cur = {ph: S.phase, la: S.lastAns ? S.lastAns.n : 0, nq: S.qs.length, gone: S.goneN || 0, end: !!S.winner};
  const rec = W.__wfx[S._g]; W.__wfx[S._g] = cur;
  const $ = q => document.querySelector(q);
  const box = $('.ww-bubbles'); if (box) box.scrollTop = box.scrollHeight;
  if (!rec || !$('.www')) return;
  if (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (cur.ph !== rec.ph) {
    const B = cur.ph === 'look' ? ['🌙 밤이 되었어요', '시장이 단어를 골랐어요. 몰래 역할을 확인하세요', 'n'] : cur.ph === 'day' ? ['🌞 낮이 밝았어요!', '4분 안에 비밀 단어를 찾아요', 'd'] : cur.ph === 'hunt' ? ['🎯 정답!', `"${S.word}" · 늑대인간이 정체를 드러내요!`, 'g'] : cur.ph === 'vote' ? ['⏰ 단어 찾기 실패', '늑대인간을 지목해요', 'r'] : cur.ph === 'end' ? [S.wt === 'V' ? '🏡 마을 승리!' : '🐺 늑대인간 승리!', S.why || '', S.wt === 'V' ? 'g' : 'r'] : null;
    if (B) banner(B[0], B[1], B[2]);
    if (cur.ph === 'day') sunrise();
    if (cur.ph === 'look') nightfall();
    if (cur.ph === 'hunt') { goldRain(); setTimeout(howl, 900); }
    if (cur.ph === 'end') setTimeout(() => S.wt === 'V' ? confetti() : howl(), 500);
    document.querySelectorAll('.ww-panel,.ww-pad,.ww-spot,.ww-chat,.ww-my').forEach((e, k) => e.animate && e.animate([{opacity: 0, transform: 'translateY(18px) scale(.97)'}, {opacity: 1, transform: 'none'}], {duration: 500, delay: k * 70, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'backwards'}));
    document.querySelectorAll('.ww-seat').forEach((e, k) => e.animate && e.animate([{opacity: 0, transform: 'translateY(14px) rotateX(60deg)'}, {opacity: 1, transform: 'none'}], {duration: 520, delay: 200 + k * 60, easing: 'cubic-bezier(.2,1.2,.4,1)', fill: 'backwards'}));
  }
  if (cur.la !== rec.la && S.lastAns) {
    const k = S.lastAns.t, st = $(`.ww-b[data-q="${S.lastAns.id}"] .ww-tk`), big = $('.ww-last .ww-tk');
    [st, big].forEach(e => e && e.animate && e.animate([{transform: 'scale(2.6) rotate(-25deg)', opacity: 0, filter: 'blur(4px)'}, {transform: 'scale(.88) rotate(5deg)', opacity: 1, filter: 'blur(0)', offset: .6}, {transform: 'none', opacity: 1}], {duration: 560, easing: 'cubic-bezier(.2,1.5,.4,1)'}));
    const cols = k === 'yes' ? ['#3DDC84', '#B6F5CF', '#fff'] : k === 'no' ? ['#FF5A6E', '#FFC2CA', '#fff'] : k === 'close' ? ['#FF8A3D', '#FFD54F', '#fff', '#FF3D3D'] : k === 'hit' ? ['#FFD54F', '#fff', '#FFB300'] : ['#C59BFF', '#fff'];
    burst(st || big, cols, k === 'close' ? 36 : 16);
    if (k === 'close') { shake($('.www'), 7); flash('rgba(255,120,40,.45)'); }
  }
  if (cur.gone > rec.gone) { const e = $('.ww-b.gone'); if (e && e.animate) e.animate([{opacity: 1, transform: 'none'}, {opacity: .4, transform: 'translateX(14px) scale(.96)', filter: 'grayscale(1)'}], {duration: 600, fill: 'forwards'}); }
  if (cur.nq > rec.nq && cur.ph === 'day') {
    const e = document.querySelectorAll('.ww-b'); const l = e[e.length - 1];
    if (l && l.animate) l.animate([{transform: 'translateY(20px) scale(.9)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 380, easing: 'cubic-bezier(.2,1.4,.4,1)'});
    const sp = $('.ww-spot.live,.ww-pad.live'); if (sp && sp.animate) sp.animate([{boxShadow: '0 0 0 0 rgba(255,213,79,.9)'}, {boxShadow: '0 0 0 18px rgba(255,213,79,0)'}], {duration: 700});
  }
  function layer(cls, html) { const el = document.createElement('div'); el.className = cls; if (html) el.innerHTML = html; document.body.appendChild(el); return el; }
  function banner(big, small, tone) {
    document.querySelectorAll('.wwfx-banner').forEach(e => e.remove());
    const el = layer('wwfx-banner t-' + tone, `<b>${U.esc(big)}</b><small>${U.esc(small)}</small>`);
    const w = $('.www'), wr = w && w.getBoundingClientRect(); if (wr && wr.width) el.style.left = (wr.left + wr.width / 2) + 'px';
    el.animate([{transform: 'translate(-50%,-50%) scale(.5) rotateX(50deg)', opacity: 0, filter: 'blur(8px)'}, {transform: 'translate(-50%,-50%) scale(1.06)', opacity: 1, filter: 'blur(0)', offset: .18}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .75}, {transform: 'translate(-50%,-62%) scale(.96)', opacity: 0}], {duration: 2100, easing: 'ease-out', fill: 'both'}).onfinish = () => el.remove();
  }
  function burst(src, cols, n) {
    if (!src) return; const r = src.getBoundingClientRect(); if (!r.width) return;
    for (let i = 0; i < n; i++) {
      const p = layer('wwfx-p'), a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 130, sz = 6 + Math.random() * 8;
      p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:${sz}px;height:${sz}px;background:${cols[i % cols.length]}`;
      p.animate([{transform: 'translate(-50%,-50%) scale(1)', opacity: 1}, {transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(.2)`, opacity: 0}], {duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)'}).onfinish = () => p.remove();
    }
  }
  function shake(e, a) { if (e && e.animate) e.animate([{transform: 'none'}, {transform: `translate(-${a}px,2px) rotate(-.4deg)`}, {transform: `translate(${a}px,-2px) rotate(.4deg)`}, {transform: 'none'}], {duration: 300, iterations: 2}); }
  function flash(c) { const f = layer('wwfx-flash'); f.style.background = c; f.animate([{opacity: 0}, {opacity: 1, offset: .15}, {opacity: 0}], {duration: 700}).onfinish = () => f.remove(); }
  function sunrise() { const el = layer('wwfx-sun', U.img('sun')); el.animate([{opacity: 0}, {opacity: 1, offset: .25}, {opacity: 1, offset: .6}, {opacity: 0}], {duration: 1900, easing: 'ease-out'}).onfinish = () => el.remove(); }
  function nightfall() { const el = layer('wwfx-night', U.img('ww_moon')); el.animate([{opacity: 0}, {opacity: 1, offset: .25}, {opacity: 1, offset: .65}, {opacity: 0}], {duration: 2000}).onfinish = () => el.remove(); }
  function howl() { const el = layer('wwfx-howl', `${U.img('ww_moon', 'm')}${U.img('ww_wolf', 'w')}`); el.animate([{opacity: 0}, {opacity: 1, offset: .2}, {opacity: 1, offset: .75}, {opacity: 0}], {duration: 2300, fill: 'both'}).onfinish = () => el.remove(); }
  function goldRain() {
    flash('radial-gradient(circle,rgba(255,240,180,.9),rgba(255,200,60,.35) 50%,transparent 75%)');
    for (let i = 0; i < 26; i++) { const c = layer('wwfx-coin', U.img('ww_hit')); c.style.left = Math.random() * 100 + 'vw'; c.animate([{transform: 'translateY(-15vh) rotate(0) scale(.7)'}, {transform: `translateY(115vh) rotate(${(Math.random() - .5) * 720}deg) scale(1)`}], {duration: 1600 + Math.random() * 1400, delay: Math.random() * 500, easing: 'cubic-bezier(.4,.1,.7,1)'}).onfinish = () => c.remove(); }
  }
  function confetti() {
    const cols = ['#FFD54F', '#7CF0B0', '#8FB8FF', '#FF8FB1', '#fff', '#C59BFF'];
    for (let i = 0; i < 70; i++) {
      const p = layer('wwfx-c'); p.style.cssText = `left:${Math.random() * 100}vw;background:${cols[i % cols.length]}`;
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
    if (P[S.mayor].bot) { const q = head(S); if (q) { const w = q.q.replace(/[?\s!.]/g, ''); return run(S.mayor, 'ans', {i: q.id, t: w === S.word ? 'hit' : (S.tok.maybe && Math.random() < .3 ? 'maybe' : Math.random() < .5 ? 'yes' : 'no')}); } }
    if (S.queue.length < 2 && Math.random() < 0.3) {
      const b = bots.filter(i => i !== S.mayor && S.qs.filter(x => x.by === i).length < 6 && !S.queue.some(x => S.qs[x].by === i));
      if (b.length) { const me = b[U.rint(b.length)]; const asked = new Set(S.qs.map(x => x.q)); const opts = BOTQ.filter(q => !asked.has(q)); if (opts.length) return run(me, 'ask', {q: opts[U.rint(opts.length)]}); }
    }
    return false;
  }
  if (S.phase === 'hunt') {
    const w = wolves(S).find(i => P[i].bot); if (w == null || wolves(S).some(i => !P[i].bot)) return false;
    if (now() - S.ts < 5000) return false;
    // 좋은 답(예·아주 가까워요·정답)을 많이 끌어낸 사람을 예언자로 의심
    const sc = ids(P).filter(i => S.role[i] !== 'W').map(i => [i, S.qs.filter(q => q.by === i && (q.t === 'yes' || q.t === 'close' || q.t === 'hit')).length + Math.random() * 1.5]);
    sc.sort((a, b) => b[1] - a[1]);
    return run(w, 'hunt', {p: sc[0][0]});
  }
  if (S.phase === 'vote') {
    const b = bots.find(i => S.votes[i] == null); if (b == null) return false;
    const cand = ids(P).filter(i => i !== b && !(S.role[b] === 'W' && S.role[i] === 'W'));
    const sc = cand.map(i => [i, S.qs.filter(q => q.by === i && q.t === 'no').length - S.qs.filter(q => q.by === i).length * .3 + Math.random() * 2]);
    sc.sort((a, c) => c[1] - a[1]);
    return run(b, 'vote', {p: sc[0][0]});
  }
  return false;
}
G.werewords.botStep = wBot;
G.werewords.botDelay = S => S && S.phase === 'day' ? 1800 : 0;
G.werewords.BOTNAMES = ['올빼미', '부엉이', '달빛', '별똥', '반딧불', '밤바람', '그림자', '새벽', '고슴도치'];
G.werewords.art = k => k === 'wolf' ? U.img('ww_wolf') : '';
})();
