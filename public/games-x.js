(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;
const isDOM = typeof document !== 'undefined';

/* =================== 딕싯 (상상 그림 이야기 게임) =================== */
/* 이야기꾼이 손에 든 그림 하나를 골라 제시어(단어·문장·소리…)를 말해요. 다른 사람은 그 제시어에 어울리는 자기 그림을 몰래 내요.
   섞어 펼친 그림 중에서 이야기꾼의 그림을 찾아 투표해요. 모두 찾거나 아무도 못 찾으면 이야기꾼 0점·나머지 2점,
   아니면 이야기꾼과 찾은 사람이 3점. 이야기꾼이 아닌 사람은 자기 그림이 받은 표마다 1점 더. 30점에 먼저 닿으면 끝! */
// 그림 재료(3D 그림)와 그 느낌 낱말 — AI가 제시어를 고르고 맞힐 때 써요
const TAG = {
  whale: '고래 바다 거대 외로움 꿈', moon: '달 밤 꿈 고요 그리움', fullmoon: '보름달 밤 소원 빛', star: '별 소원 빛 희망 밤', cloud: '구름 하늘 자유 꿈',
  rainbow: '무지개 희망 행운 약속', rocket: '로켓 우주 도전 모험 꿈', key: '열쇠 비밀 기회 정답', door: '문 기회 새로운 시작 비밀', ladder: '사다리 성공 도전 오르다',
  umbrella: '우산 비 보호 슬픔', hourglass: '모래시계 시간 기다림 끝', tree: '나무 성장 자연 고향', pine: '숲 겨울 고요 자연', mushroom: '버섯 숲 동화 신비',
  snail: '달팽이 느림 여유 집', butterfly: '나비 변화 자유 봄', owl: '부엉이 지혜 밤 공부', fox: '여우 교활 외로움 숲', rabbit: '토끼 빠름 동화 귀여움',
  cat: '고양이 신비 밤 혼자', teacup: '찻잔 휴식 따뜻함 대화', candle: '촛불 희망 기도 어둠', book: '책 이야기 지식 공부 추억', envelope: '편지 소식 기다림 그리움',
  balloon: '풍선 축하 가벼움 자유', kite: '연 바람 자유 어린시절', anchor: '닻 정착 안정 바다', feather: '깃털 가벼움 자유 부드러움', dove: '비둘기 평화 소식',
  rose: '장미 사랑 아름다움 가시', wilted: '시든꽃 이별 슬픔 끝', sunflower: '해바라기 해 희망 기다림', fish: '물고기 바다 자유 헤엄', jelly: '해파리 바다 신비 투명',
  dragon: '용 힘 전설 모험', unicorn: '유니콘 환상 꿈 순수', ghost: '유령 무서움 장난 비밀', wand: '마법봉 마법 소원 기적', mirror: '거울 나 진실 비밀',
  clock: '시계 시간 기다림 늦음', lantern: '등불 축제 길 빛', lock: '자물쇠 비밀 갇힘 보호', ring: '반지 약속 사랑 결혼', heart: '하트 사랑 마음',
  broken: '깨진하트 이별 상처 슬픔', shell: '조개 바다 추억 소리', steps: '발자국 여행 흔적 길', mask: '가면 연기 두얼굴 거짓', puzzle: '퍼즐 조각 맞춤 문제',
  pawn: '체스 전략 희생 작음', die: '주사위 운 도박 선택', bubbles: '거품 꿈 순간 가벼움', snow: '눈 겨울 차가움 순수', fire: '불 열정 위험 분노',
  drop: '물방울 눈물 비 슬픔', wave: '파도 바다 위기 힘', seedling: '새싹 시작 성장 희망', leaf: '낙엽 가을 끝 이별', shooting: '별똥별 소원 순간',
  telescope: '망원경 관찰 꿈 먼곳', moai: '석상 침묵 고대 신비', teddy: '곰인형 어린시절 위로 추억', yarn: '실타래 엉킴 고민 연결', palette: '팔레트 그림 예술 색깔',
  violin: '바이올린 음악 감성 슬픔', notes: '음표 음악 노래 기쁨', carousel: '회전목마 놀이 추억 어린시절', ferris: '관람차 놀이공원 데이트 추억', tent: '텐트 캠핑 모험 여행',
  house: '집 가족 고향 안식', window: '창문 바깥 기다림 바라봄', chair: '의자 기다림 빈자리 휴식', bed: '침대 잠 꿈 휴식', tophat: '모자 마술 신사 쇼',
  gift: '선물 깜짝 마음 축하', egg: '알 시작 탄생 가능성', chick: '병아리 탄생 시작 귀여움', nest: '둥지 가족 보호 집', wing: '날개 자유 비상 천사',
  parachute: '낙하산 모험 착륙 용기', bird: '새 자유 노래 하늘', lotus: '연꽃 평온 명상 깨달음', tornado: '회오리 혼란 소용돌이 위기', comet: '혜성 순간 운명 우주',
  planet: '행성 우주 먼곳 꿈', ice: '얼음 차가움 멈춤 겨울', blossom: '벚꽃 봄 설렘 순간', cactus: '선인장 사막 버팀 가시', bulb: '전구 아이디어 생각 빛',
  globe: '지구 여행 세상 꿈', turtle: '거북이 느림 장수 끈기', snowman: '눈사람 겨울 동심 녹음', island: '섬 휴가 외딴 혼자', volcano: '화산 폭발 분노 위험',
  bridge: '다리 연결 밤 도시', castle: '성 꿈 왕국 동화', octopus: '문어 바다 여러팔 엉킴', crown: '왕관 권력 왕 성공', crystal: '수정구슬 미래 예언 신비',
  sail: '돛단배 여행 바다 떠남', compass: '나침반 방향 길 모험', scroll: '두루마리 옛날 비밀 지도', skull: '해골 죽음 위험 해적', moneybag: '돈 부자 욕심 행운',
  merlin: '마법사 지혜 마법 노인', fairy: '요정 마법 작음 꿈', web: '거미줄 덫 엉킴 기다림', bell: '종 알림 시작 소리', trophy: '트로피 승리 성공 영광'
};
const BGT = ['밤 꿈 고요', '새벽 노을 설렘', '하늘 맑음 자유', '바다 깊음 신비', '숲 자연 비밀', '사막 뜨거움 외로움', '안개 신비 불안', '불 위험 열정', '달콤 환상 동화', '어둠 혼자 침묵'];
// 카드 84장: 배경, 배치, 주인공, 곁들이, (덤)
const SPEC = `0 3 fox fullmoon|2 1 house balloon|3 0 whale moon|6 0 door ladder|0 2 owl book|1 0 teacup tornado|4 3 snail mushroom|8 4 unicorn star|6 0 mirror ghost|3 1 anchor bubbles
1 2 bird envelope|0 0 telescope comet|9 0 candle hourglass|2 4 kite cloud|4 0 tree lantern|3 2 fish key|8 1 castle rainbow|5 3 cactus moon|6 2 chair window|0 1 tent shooting
7 0 dragon crown|1 4 dove blossom|2 0 ladder cloud|3 0 jelly lantern|9 2 mask heart|4 2 fox mushroom|8 0 teddy balloon|0 3 cat planet|5 0 steps hourglass|6 0 lock key
1 0 sunflower clock|3 3 turtle island|2 1 parachute globe|0 0 bed moon|7 2 volcano umbrella|4 4 owl star|9 0 broken drop|8 2 rabbit tophat|6 3 moai cloud|3 0 shell notes
0 2 rocket book|2 4 balloon bird|5 2 compass steps|1 0 egg crown|4 0 seedling drop|9 3 pawn crown|8 0 carousel moon|0 4 window star|3 2 octopus puzzle|6 1 house cloud
2 0 wing feather|7 0 fire snow|1 3 bridge fullmoon|4 2 rabbit clock|0 0 crystal butterfly|5 0 skull rose|8 4 ferris heart|3 1 whale island|9 0 mirror candle|2 2 dove ring
6 0 door wave|1 2 violin rose|0 3 fairy fullmoon|4 0 nest egg|7 2 tornado house|3 0 sail moon|8 2 gift ghost|5 3 tent star|2 0 umbrella sunflower|0 1 globe balloon
9 2 snowman fire|1 0 chick shell|4 3 snail seedling|6 2 owl lock|3 4 fish bubbles|0 0 wand planet|8 0 die rainbow|5 2 cactus heart|2 3 bird castle|7 0 trophy wilted
1 4 lotus blossom|0 2 merlin star|6 0 web butterfly|3 2 ice whale`.replace(/\n/g, '|').split('|').map(s => { const [b, l, a, c, d] = s.trim().split(/\s+/); return {b: +b, l: +l, a, c, d}; });
const NCARD = SPEC.length;
const tagsOf = id => { const s = SPEC[id]; return (TAG[s.a] + ' ' + TAG[s.c] + ' ' + BGT[s.b]).split(' '); };
const hsh = id => { let h = id * 2654435761 % 4294967296; return k => ((h >>> (k * 5)) & 31) / 31; };
function dcard(id, cls = '', attrs = '') {
  const s = SPEC[id], r = hsh(id), many = s.l === 4 || s.l === 1;
  const sub = many ? [0, 1, 2, 3, 4].slice(0, s.l === 1 ? 3 : 5).map(k => `<span class="dx-o s dxs${k}" style="--rr:${((r(k) - .5) * 40).toFixed(0)}deg;--ss:${(.75 + r(k + 1) * .5).toFixed(2)}">${U.img(s.c)}</span>`).join('') : `<span class="dx-o b" style="--rr:${((r(2) - .5) * 36).toFixed(0)}deg">${U.img(s.c)}</span>`;
  return `<span class="dxc p${s.b} l${s.l} ${cls}" ${attrs}><span class="dx-bg"></span>${sub}<span class="dx-o a" style="--ra:${((r(1) - .5) * 14).toFixed(0)}deg">${U.img(s.a)}</span><span class="dx-glow"></span></span>`;
}
const dback = (cls = '') => `<span class="dxc back ${cls}"><span class="dx-bg"></span><span class="dx-o a">${U.img('crystal')}</span></span>`;
const ids = P => P.map((_, i) => i);
const pn = (P, i) => U.nm(P, i);
function xFresh(S, key, dur) {
  if (!isDOM) return -1;
  const W = window; if (!W.__xfx || !W.__xfx[S._g]) return -1;
  W.__xT = W.__xT || {}; const k = S._g + key, now = Date.now();
  if (!W.__xT[k]) W.__xT[k] = now;
  const el = (now - W.__xT[k]) / 1000; return el < dur ? el : -1;
}
const anim = el => el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s"`;
const need = (S, P) => P.length === 3 ? 2 : 1;
function refill(S, P) {
  const hs = P.length === 3 ? 7 : 6;
  for (const i of ids(P)) while (S.hand[i].length < hs) { if (!S.deck.length) return false; S.hand[i].push(S.deck.pop()); }
  return true;
}
function score(S, P) {
  const n = P.length, st = S.st, stIdx = S.table.findIndex(t => t.by === st);
  const voters = ids(P).filter(i => i !== st), found = voters.filter(i => S.votes[i] === stIdx);
  const gain = P.map(() => 0);
  if (found.length === 0 || found.length === voters.length) voters.forEach(i => gain[i] += 2);
  else { gain[st] += 3; found.forEach(i => gain[i] += 3); }
  voters.forEach(i => { const v = S.votes[i]; if (v != null && v !== stIdx) { const by = S.table[v].by; if (by !== st) gain[by] += 1; } });
  gain.forEach((g, i) => S.score[i] += g);
  S.gain = gain; S.found = found;
}

G.dixit = {
  name: '딕싯', tag: '그림 한 장에 담은 이야기 맞히기', min: 3, max: 8, mark: '🔮', hue: '#7A3E9D',
  rules: ['돌아가며 한 명이 이야기꾼이 돼요. 이야기꾼은 손에 든 그림 하나를 골라 제시어를 말해요(단어·문장·노래·소리 무엇이든!).',
    '다른 사람들은 그 제시어에 가장 어울리는 자기 그림을 몰래 한 장 내요. (3명이면 2장씩)',
    '모인 그림을 섞어 펼치면, 이야기꾼이 아닌 사람들은 이야기꾼의 그림이 무엇인지 몰래 투표해요(내 그림엔 투표 못 해요).',
    '모두 찾거나 아무도 못 찾으면: 이야기꾼 0점, 나머지 모두 2점. 그 밖에는: 이야기꾼과 찾은 사람이 3점.',
    '이야기꾼이 아닌 사람은 자기 그림이 받은 표 하나마다 1점 더!',
    '너무 쉽지도, 너무 어렵지도 않은 제시어가 비결이에요. 30점에 먼저 닿거나 카드가 떨어지면 끝!'],
  rulesExtra() { return `<section class="dx-legend">${[0, 6, 20, 33, 47].map(i => dcard(i, 'sm')).join('')}</section>`; },
  setup(P) {
    const n = P.length; if (n < 3 || n > 8) throw U.err('3~8명이 필요해요.');
    const S = {_g: Math.random().toString(36).slice(2, 9), deck: U.shuffle(SPEC.map((_, i) => i)), hand: P.map(() => []), score: P.map(() => 0), st: U.rint(n), round: 1, phase: 'clue', clue: '', sub: {}, table: [], votes: {}, n: 0, log: ['딕싯 시작! 이야기꾼이 그림을 고르고 제시어를 말해요.']};
    refill(S, P);
    return S;
  },
  turns(S, P) {
    if (S.winner) return [];
    if (S.phase === 'clue') return [S.st];
    if (S.phase === 'submit') return ids(P).filter(i => i !== S.st && (S.sub[i] || []).length < need(S, P));
    if (S.phase === 'vote') return ids(P).filter(i => i !== S.st && S.votes[i] == null);
    if (S.phase === 'reveal') { const h = ids(P).filter(i => !P[i].bot); return h.length ? h : [S.st]; }
    return [];
  },
  allTurn(S) { return S.phase === 'submit' ? '모두 그림 내기' : S.phase === 'vote' ? '모두 투표하기' : S.phase === 'reveal' ? '결과 보기' : ''; },
  open(S) { return S.phase === 'reveal'; },
  act(S, me, t, a, P) {
    if (S.winner) return;
    a = a || {};
    if (t === 'clue') {
      if (S.phase !== 'clue' || me !== S.st) throw U.err('이야기꾼만 제시어를 정해요.');
      const c = +a.c, txt = String(a.text || '').trim().slice(0, 40);
      if (!S.hand[me].includes(c)) throw U.err('그림을 골라 주세요.');
      if (!txt) throw U.err('제시어를 적어 주세요.');
      S.hand[me].splice(S.hand[me].indexOf(c), 1);
      S.clue = txt; S.sub = {[me]: [c]}; S.phase = 'submit'; S.n++;
      U.log(S, `📖 ${P[me].name}님의 제시어: "${txt}"`);
      return;
    }
    if (t === 'sub') {
      if (S.phase !== 'submit' || me === S.st) throw U.err('지금은 그림을 낼 수 없어요.');
      const c = +a.c, mine = S.sub[me] || [];
      if (mine.length >= need(S, P)) throw U.err('이미 냈어요.');
      if (!S.hand[me].includes(c)) throw U.err('그 그림이 없어요.');
      S.hand[me].splice(S.hand[me].indexOf(c), 1); S.sub[me] = mine.concat(c); S.n++;
      if (ids(P).every(i => i === S.st || (S.sub[i] || []).length >= need(S, P))) {
        const all = []; for (const i in S.sub) S.sub[i].forEach(c2 => all.push({c: c2, by: +i}));
        S.table = U.shuffle(all); S.votes = {}; S.phase = 'vote';
        U.log(S, `그림 ${S.table.length}장이 펼쳐졌어요. 이야기꾼의 그림을 찾아 투표!`);
      }
      return;
    }
    if (t === 'vote') {
      if (S.phase !== 'vote' || me === S.st) throw U.err('지금은 투표할 수 없어요.');
      const k = +a.k;
      if (!S.table[k]) throw U.err('그림을 골라 주세요.');
      if (S.table[k].by === me) throw U.err('내 그림에는 투표할 수 없어요.');
      S.votes[me] = k; S.n++;
      if (ids(P).every(i => i === S.st || S.votes[i] != null)) {
        score(S, P); S.phase = 'reveal'; S.n++;
        S.last = {n: S.n, round: S.round};
        U.log(S, `공개! ${S.found.length ? S.found.map(i => P[i].name).join(', ') + '님이 찾았어요' : '아무도 못 찾았어요'}.`);
      }
      return;
    }
    if (t === 'next') {
      if (S.phase !== 'reveal') return;
      const top = Math.max(...S.score);
      const ok = refill(S, P);
      if (top >= 30 || !ok) {
        const order = ids(P).sort((x, y) => S.score[y] - S.score[x]); S.rank = order; S.phase = 'end';
        const best = order.filter(i => S.score[i] === S.score[order[0]]);
        S.winner = `${best.map(i => P[i].name).join(', ')}님 ${S.score[order[0]]}점으로 승리!`; U.log(S, S.winner);
        return;
      }
      S.st = (S.st + 1) % P.length; S.round++; S.phase = 'clue'; S.clue = ''; S.sub = {}; S.table = []; S.votes = {}; S.gain = null; S.found = null; S.n++;
      return;
    }
    throw U.err('알 수 없는 행동이에요.');
  },
  view(S, me, ui, P) {
    if (isDOM) setTimeout(() => xFx(S, me, P), 0);
    return `<div class="dxbox"><div class="dxw">${xBody(S, me, ui || {}, P)}</div></div>`;
  },
  uiAct(ui, S, me, name, val) {
    if (name === 'dsel') { ui.dsel = ui.dsel === val ? null : val; return; }
    if (name === 'dzoom') { ui.dzoom = val; return; }
  },
  splash: true
};

function xTrack(S, P) {
  const L = S.phase === 'reveal' && S.gain;
  return `<section class="dx-score">${ids(P).map(i => `<span class="dx-sc${i === S.st ? ' st' : ''}" style="--pc:${U.pc(i)}"><i class="dx-dot"></i><b>${pn(P, i)}</b><em>${S.score[i]}</em>${L && S.gain[i] ? `<strong class="dx-plus">+${S.gain[i]}</strong>` : ''}<span class="dx-bar"><i style="width:${Math.min(100, S.score[i] / 30 * 100)}%"></i></span></span>`).join('')}<span class="dx-goal">🏁 30점</span></section>`;
}
function xBody(S, me, ui, P) {
  const n = P.length, st = S.st, isSt = me === st;
  let h = '';
  if (S.winner) {
    const el = xFresh(S, 'end', 4), o = S.rank || [];
    h += `<section class="dx-end"${anim(el)}><div class="dx-end-art">${[3, 8, 50].map(i => dcard(i, 'sm')).join('')}</div><small>게임 끝</small><b>${U.esc(S.winner)}</b><ol>${o.map((i, k) => `<li class="${k === 0 ? 'top' : ''}"><span>${k === 0 ? '👑' : k + 1}</span><b>${pn(P, i)}</b><em>${S.score[i]}점</em></li>`).join('')}</ol></section>`;
    return h + xTrack(S, P);
  }
  // 위 띠: 이야기꾼과 제시어
  h += `<header class="dx-strip"><span class="dx-st" style="--pc:${U.pc(st)}">${U.img('book', 'big')}<span><small>${S.round}라운드 이야기꾼</small><b>${pn(P, st)}${isSt ? ' (나)' : ''}</b></span></span>${S.clue ? `<div class="dx-clue"${anim(xFresh(S, 'clue' + S.round, 1.4))}><small>제시어</small><b>“${U.esc(S.clue)}”</b></div>` : `<div class="dx-clue wait"><small>제시어</small><b>${isSt ? '그림을 고르고 제시어를 적어요' : '이야기꾼이 생각하는 중… 💭'}</b></div>`}</header>`;
  h += xTrack(S, P);
  const status = list => `<div class="dx-who">${ids(P).filter(i => i !== st).map(i => `<span class="${list.includes(i) ? '' : 'on'}"><i class="dx-dot" style="--pc:${U.pc(i)}"></i>${pn(P, i)} ${list.includes(i) ? '…' : '✔'}</span>`).join('')}</div>`;
  const hand = (sel, can) => `<div class="dx-hand">${(S.hand[me] || []).map(c => `<span class="dx-slot${sel === c ? ' on' : ''}">${dcard(c, '', `role="button" tabindex="0" ${can ? `data-g="dsel" data-val="${U.attr(c)}"` : ''}`)}<button type="button" class="dx-zoom" data-g="dzoom" data-val="${U.attr(c)}" aria-label="크게 보기">🔍</button></span>`).join('')}</div>`;
  if (S.phase === 'clue') {
    if (isSt) {
      h += `<section class="dx-panel"><div class="dx-h"><b>📖 그림 한 장을 고르고 제시어를 적어요</b><small>너무 쉬우면 0점, 너무 어려워도 0점! 몇 명만 맞힐 만한 말이 최고예요</small></div>${hand(ui.dsel, true)}
<div class="dx-input"><input id="dx-clue" data-field="text" maxlength="40" placeholder="예: 기다림, 첫사랑, 어릴 적 여름방학…" autocomplete="off">${U.btn(ui.dsel != null ? '이 그림으로 제시어 말하기' : '먼저 그림을 고르세요', 'clue', {c: ui.dsel}, 'primary big dx-go', ui.dsel == null).replace('<button ', '<button data-fields ')}</div></section>`;
    } else if (me >= 0) h += `<section class="dx-panel wait"><div class="dx-think">${U.img('crystal', 'big')}<b>${pn(P, st)}님이 그림을 고르고 있어요</b><small>내 그림을 미리 살펴보며 기다려요</small></div>${hand(null, false)}</section>`;
  } else if (S.phase === 'submit') {
    const mine = S.sub[me] || [], left = me >= 0 && !isSt ? need(S, P) - mine.length : 0;
    const waiting = ids(P).filter(i => i !== st && (S.sub[i] || []).length < need(S, P));
    if (left > 0) h += `<section class="dx-panel"><div class="dx-h"><b>🎴 “${U.esc(S.clue)}”에 어울리는 내 그림을 내요${need(S, P) > 1 ? ` (${left}장 더)` : ''}</b><small>이야기꾼의 그림인 척 다른 사람을 헷갈리게 하면 보너스!</small></div>${hand(ui.dsel, true)}${U.btn(ui.dsel != null ? '이 그림 내기' : '그림을 고르세요', 'sub', {c: ui.dsel}, 'primary big dx-go', ui.dsel == null)}</section>`;
    else h += `<section class="dx-panel wait"><div class="dx-pile">${Array.from({length: Object.values(S.sub).reduce((s, a) => s + a.length, 0)}, (_, k) => dback(`sm k${k}`)).join('')}</div><b>그림을 모으는 중…</b>${status(waiting)}</section>`;
  } else if (S.phase === 'vote' || S.phase === 'reveal') {
    const rv = S.phase === 'reveal', stIdx = S.table.findIndex(t => t.by === st);
    const myVote = S.votes[me], canVote = !rv && me >= 0 && !isSt;
    const rel = rv ? xFresh(S, 'rv' + S.round, 4) : -1;
    h += `<section class="dx-panel"><div class="dx-h"><b>${rv ? '✨ 공개! 이야기꾼의 그림은?' : isSt ? '🗳 모두가 내 그림을 찾는 중…' : `🗳 “${U.esc(S.clue)}” 이야기꾼의 그림은 어느 것?`}</b><small>${rv ? '' : isSt ? '이야기꾼은 투표하지 않아요' : myVote != null ? '모두 내기 전까지 바꿀 수 있어요' : '내 그림에는 투표할 수 없어요'}</small></div>
<div class="dx-table${rv ? ' rv' : ''}"${rv ? anim(rel) : ''}>${S.table.map((t, k) => {
      const own = t.by === me, voters = ids(P).filter(i => S.votes[i] === k);
      const cls = (rv && k === stIdx ? 'st ' : '') + (myVote === k ? 'my ' : '') + (own && !rv ? 'own ' : '');
      const attrs = canVote && !own ? `role="button" tabindex="0" data-act="vote" data-arg="${U.attr({k})}"` : '';
      return `<div class="dx-tc ${cls}" style="--k:${k}"><span class="dx-num">${k + 1}</span>${dcard(t.c, '', attrs)}<button type="button" class="dx-zoom" data-g="dzoom" data-val="${U.attr(t.c)}" aria-label="크게 보기">🔍</button>${own && !rv ? '<span class="dx-own">내 그림</span>' : ''}${rv ? `<div class="dx-rv"><span class="dx-by" style="--pc:${U.pc(t.by)}">${t.by === st ? '📖 ' : ''}${pn(P, t.by)}</span><span class="dx-vs">${voters.map(i => `<i style="--pc:${U.pc(i)}">${pn(P, i)}</i>`).join('') || '<em>표 없음</em>'}</span></div>` : ''}</div>`;
    }).join('')}</div>${!rv ? status(ids(P).filter(i => i !== st && S.votes[i] == null)) : ''}
${rv ? `<div class="dx-gain">${ids(P).map(i => `<span style="--pc:${U.pc(i)}"><i class="dx-dot"></i>${pn(P, i)} <b>${S.gain[i] ? '+' + S.gain[i] : '0'}</b></span>`).join('')}</div><p class="dx-sum">${S.found.length === 0 ? '아무도 못 찾았어요 — 이야기꾼 0점, 나머지 2점' : S.found.length === n - 1 ? '모두 찾았어요 — 너무 쉬웠나 봐요! 이야기꾼 0점, 나머지 2점' : `${S.found.map(i => pn(P, i)).join(', ')}님이 찾았어요 — 이야기꾼과 함께 3점!`}</p>${me >= 0 ? U.btn('다음 라운드 ▶', 'next', {}, 'primary big dx-go') : ''}` : ''}</section>`;
  }
  if (ui.dzoom != null) h += `<div class="dx-mbg" data-g="dzoom" data-val="null"></div><div class="dx-modal">${dcard(ui.dzoom, 'huge')}<button type="button" class="dx-x" data-g="dzoom" data-val="null">✕ 닫기</button></div>`;
  return h;
}

/* ---------- 움직임 ---------- */
function xFx(S, me, P) {
  const W = window; W.__xfx = W.__xfx || {};
  const cur = {ph: S.phase, round: S.round, end: !!S.winner};
  const rec = W.__xfx[S._g]; W.__xfx[S._g] = cur;
  if (!rec || !document.querySelector('.dxw')) return;
  if (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (cur.ph !== rec.ph) {
    document.querySelectorAll('.dx-panel').forEach(e => e.animate && e.animate([{opacity: 0, transform: 'translateY(16px)'}, {opacity: 1, transform: 'none'}], {duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.2)'}));
    const B = cur.ph === 'submit' ? ['📖 제시어 발표!', `“${S.clue}”`] : cur.ph === 'vote' ? ['🎴 그림 공개', '이야기꾼의 그림을 찾아요'] : cur.ph === 'reveal' ? ['✨ 정답 공개!', S.found && S.found.length ? `${S.found.length}명이 찾았어요` : '아무도 못 찾았어요'] : cur.ph === 'clue' ? [`${S.round}라운드`, `이야기꾼: ${U.nm(P, S.st)}님`] : null;
    if (B) banner(B[0], B[1]);
    if (cur.ph === 'reveal') setTimeout(() => sparkle(document.querySelector('.dx-tc.st')), 900);
  }
  if (cur.end && !rec.end) setTimeout(rain, 700);
  function banner(big, small) {
    document.querySelectorAll('.dxfx-banner').forEach(e => e.remove());
    const el = document.createElement('div'); el.className = 'dxfx-banner';
    el.innerHTML = `<b>${U.esc(big)}</b><small>${U.esc(small)}</small>`;
    const w = document.querySelector('.dxw'), wr = w && w.getBoundingClientRect(); if (wr && wr.width) el.style.left = (wr.left + wr.width / 2) + 'px';
    document.body.appendChild(el);
    el.animate([{transform: 'translate(-50%,-50%) scale(.5)', opacity: 0, filter: 'blur(8px)'}, {transform: 'translate(-50%,-50%) scale(1.05)', opacity: 1, filter: 'blur(0)', offset: .18}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .72}, {transform: 'translate(-50%,-60%) scale(.96)', opacity: 0}], {duration: 1800, easing: 'ease-out', fill: 'both'}).onfinish = () => el.remove();
  }
  function sparkle(src) {
    if (!src) return; const r = src.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let k = 0; k < 30; k++) {
      const el = document.createElement('div'); el.className = 'dxfx-spark'; el.textContent = '✦';
      el.style.cssText = `left:${cx}px;top:${cy}px;font-size:${10 + Math.random() * 18}px;color:${['#FFE38A', '#FFFFFF', '#C9B8FF', '#8EE6FF'][k % 4]}`;
      document.body.appendChild(el);
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 140;
      el.animate([{transform: 'translate(-50%,-50%) scale(.3)', opacity: 1}, {transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(1) rotate(180deg)`, opacity: 0}], {duration: 1100 + Math.random() * 600, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'both'}).onfinish = () => el.remove();
    }
  }
  function rain() {
    const ks = ['star', 'moon', 'butterfly', 'feather', 'balloon', 'blossom'];
    for (let k = 0; k < 40; k++) {
      const el = document.createElement('div'); el.className = 'dxfx-rain'; el.innerHTML = U.img(ks[k % ks.length]); const s = 24 + Math.random() * 30;
      el.style.cssText = `left:${Math.random() * 100}vw;width:${s}px;height:${s}px`; document.body.appendChild(el);
      el.animate([{transform: 'translateY(-60px) rotate(0)'}, {transform: `translateY(${innerHeight + 80}px) rotate(${(Math.random() - .5) * 540}deg)`}], {duration: 3000 + Math.random() * 2000, delay: Math.random() * 1500, easing: 'cubic-bezier(.3,.1,.7,1)', fill: 'both'}).onfinish = () => el.remove();
    }
  }
}

/* ---------- AI ---------- */
function xBot(S, P) {
  if (!S || S.winner) return false;
  const run = (i, t, a) => { try { G.dixit.act(S, i, t, a, P); return true; } catch (e) { return false; } };
  const match = (c, clue) => tagsOf(c).reduce((s, t) => s + (clue.includes(t) ? 2 : 0), 0);
  if (S.phase === 'clue' && P[S.st].bot) {
    const me = S.st, c = S.hand[me][U.rint(S.hand[me].length)], tg = tagsOf(c);
    // 그림의 느낌 낱말 하나 (가끔 두 개를 이어서)
    const w = tg[U.rint(tg.length)], w2 = tg[U.rint(tg.length)];
    return run(me, 'clue', {c, text: Math.random() < 0.3 && w !== w2 ? `${w}과 ${w2}` : w});
  }
  if (S.phase === 'submit') {
    const i = ids(P).find(k => P[k].bot && k !== S.st && (S.sub[k] || []).length < need(S, P)); if (i == null) return false;
    const best = S.hand[i].map(c => ({c, s: match(c, S.clue) + Math.random() * 1.5})).sort((a, b) => b.s - a.s)[0];
    return run(i, 'sub', {c: best.c});
  }
  if (S.phase === 'vote') {
    const i = ids(P).find(k => P[k].bot && k !== S.st && S.votes[k] == null); if (i == null) return false;
    const opts = S.table.map((t, k) => ({k, by: t.by, s: match(t.c, S.clue) + Math.random() * 2.2})).filter(o => o.by !== i).sort((a, b) => b.s - a.s);
    return run(i, 'vote', {k: opts[0].k});
  }
  // 공개 화면은 사람이 '다음 라운드'를 눌러 넘겨요 (결과를 볼 시간)
  if (S.phase === 'reveal' && P.every(p => p.bot)) return run(S.st, 'next', {});
  return false;
}
G.dixit.botStep = xBot;
G.dixit.BOTNAMES = ['몽상가', '이야기꾼', '그림쟁이', '시인', '꿈나무', '달토끼', '별지기', '구름'];
G.dixit.art = (k, x) => k === 'card' ? dcard(x, 'big') : k === 'back' ? dback('big') : '';
G.dixit._n = NCARD;
})();
