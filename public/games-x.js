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

/* ---------- 그림 배경: 카드마다 다른 '그림책 풍경'을 SVG로 정교하게 그려요 ---------- */
function rng(seed) { let x = (seed * 2654435761 + 1013904223) >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
const PAL = [
  {sky: ['#0B0A2E', '#26206A', '#5B3FA0'], hill: ['#3A2E7A', '#241C55', '#120E33'], glow: '#FFF3B0', orb: 'moon', stars: 60},
  {sky: ['#3B2F8F', '#E0609A', '#FFB07A'], hill: ['#8A4A9A', '#5A2E73', '#2E1747'], glow: '#FFE3A0', orb: 'sunlow', stars: 8},
  {sky: ['#5FB4FF', '#9ED6FF', '#E8F6FF'], hill: ['#9AD27A', '#5FAE5A', '#2F7A45'], glow: '#FFFFFF', orb: 'sun', stars: 0, isle: 1},
  {sky: ['#05263F', '#0B5A7A', '#3FB6C9'], hill: ['#0A4A63', '#073348', '#03182A'], glow: '#B8F4FF', orb: 'rays', stars: 0, sea: 1},
  {sky: ['#1E4A3A', '#3F8A5E', '#BFE3A0'], hill: ['#2F6B48', '#1C4A33', '#0D2A1C'], glow: '#F4FFD0', orb: 'rays', stars: 0, forest: 1},
  {sky: ['#FF9A4A', '#FFC76A', '#FFF0C0'], hill: ['#E8A25A', '#C97B3A', '#8A4A1E'], glow: '#FFF6C8', orb: 'bigsun', stars: 0, dune: 1},
  {sky: ['#8E9BB0', '#C3CCD8', '#EEF1F5'], hill: ['#9AA6B5', '#77828F', '#4E5763'], glow: '#FFFFFF', orb: 'pale', stars: 0, fog: 1},
  {sky: ['#2A0606', '#7A1A0A', '#FF6A1A'], hill: ['#4A0E08', '#2A0704', '#120202'], glow: '#FFB04A', orb: 'ember', stars: 0, lava: 1},
  {sky: ['#FFB3D9', '#C9B3FF', '#B3E8FF'], hill: ['#FF8FC4', '#B48BFF', '#7FC8F0'], glow: '#FFFFFF', orb: 'rainbow', stars: 20, candy: 1},
  {sky: ['#020204', '#0E0E1E', '#22223A'], hill: ['#151526', '#0B0B16', '#040408'], glow: '#FFE6A0', orb: 'lamp', stars: 30}
];
function ridge(r, y0, amp, n, smooth) {
  let d = `M0 140 L0 ${y0.toFixed(1)}`, x = 0, step = 100 / n;
  for (let i = 1; i <= n; i++) {
    x = i * step; const y = y0 - (smooth ? Math.sin(i * 1.3 + r() * 3) * amp : (r() * amp * 2 - amp * .6));
    if (smooth) d += ` Q${(x - step / 2).toFixed(1)} ${(y - amp * (r() - .2)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    else d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + ' L100 140 Z';
}
function trees(r, y, n, col, h) { let d = ''; for (let i = 0; i < n; i++) { const x = r() * 104 - 2, hh = h * (.6 + r() * .7), w = hh * .38; d += `M${(x - w).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y - hh).toFixed(1)} L${(x + w).toFixed(1)} ${y.toFixed(1)}Z`; } return `<path d="${d}" fill="${col}"/>`; }
function dsDefs() {
  if (typeof document === 'undefined' || document.getElementById('dx-defs')) return;
  const d = document.createElement('div'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = `<svg id="dx-defs" width="0" height="0"><defs>
<filter id="dxBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="dxSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="dxPaint"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/></filter>
<filter id="dxGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .55 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<radialGradient id="dxVig" cx="50%" cy="45%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".55"/></radialGradient>
</defs></svg>`;
  document.body.appendChild(d);
}
const SCN = {};
// 배경마다 멀리 흩어 놓는 작은 소품들 (그림을 더 풍성하게)
const PROP = [['star', 'shooting', 'comet', 'owl', 'feather'], ['bird', 'balloon', 'kite', 'blossom', 'dove'], ['bird', 'kite', 'balloon', 'parachute', 'cloud'], ['fish', 'shell', 'jelly', 'bubbles', 'octopus'], ['leaf', 'mushroom', 'butterfly', 'seedling', 'bird'], ['cactus', 'steps', 'scroll', 'compass', 'feather'], ['lantern', 'ghost', 'feather', 'leaf', 'key'], ['fire', 'comet', 'skull', 'crown', 'drop'], ['star', 'balloon', 'gift', 'heart', 'butterfly'], ['candle', 'star', 'key', 'drop', 'feather']];
const SPOT = [[16, 30], [84, 26], [14, 70], [86, 64], [24, 50], [78, 46]];
function dscene(id) {
  if (SCN[id]) return SCN[id];
  const s = SPEC[id], P = PAL[s.b], r = rng(id + 17), u = 'dx' + id;
  let g = `<svg class="dx-scene" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset=".55" stop-color="${P.sky[1]}"/><stop offset="1" stop-color="${P.sky[2]}"/></linearGradient><radialGradient id="${u}g"><stop offset="0" stop-color="${P.glow}" stop-opacity=".95"/><stop offset=".35" stop-color="${P.glow}" stop-opacity=".35"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="${u}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect width="100" height="140" fill="url(#${u}s)"/>`;
  // 별
  for (let i = 0; i < P.stars; i++) { const x = r() * 100, y = r() * 80, z = r(); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.15 + z * .55).toFixed(2)}" fill="#fff" opacity="${(.35 + z * .6).toFixed(2)}"/>`; }
  if (P.stars > 30 && r() < .6) g += `<path d="M${(10 + r() * 30).toFixed(0)} 20 q 40 ${(-10 + r() * 20).toFixed(0)} 80 ${(r() * 20).toFixed(0)}" stroke="#9FFFE0" stroke-width="7" fill="none" opacity=".18" filter="url(#dxSoft)"/>`;
  // 해·달·빛
  const ox = 18 + r() * 64, oy = 16 + r() * 22;
  if (P.orb === 'moon') g += `<circle cx="${ox}" cy="${oy}" r="22" fill="url(#${u}g)"/><circle cx="${ox}" cy="${oy}" r="8" fill="#FFF6D0"/><circle cx="${ox + 3}" cy="${oy - 2}" r="7" fill="${P.sky[0]}" opacity="${r() < .5 ? .95 : 0}"/><circle cx="${ox - 2}" cy="${oy + 1}" r="1.2" fill="#E8DDB0" opacity=".7"/>`;
  else if (P.orb === 'sun' || P.orb === 'bigsun' || P.orb === 'pale') { const R0 = P.orb === 'bigsun' ? 16 : 10; g += `<circle cx="${ox}" cy="${oy + (P.orb === 'bigsun' ? 30 : 0)}" r="${R0 * 3}" fill="url(#${u}g)"/><circle cx="${ox}" cy="${oy + (P.orb === 'bigsun' ? 30 : 0)}" r="${R0}" fill="${P.glow}" opacity="${P.orb === 'pale' ? .6 : 1}"/>`; }
  else if (P.orb === 'sunlow') g += `<circle cx="${ox}" cy="78" r="40" fill="url(#${u}g)"/><circle cx="${ox}" cy="80" r="13" fill="#FFD27A"/>${[0, 1, 2, 3].map(k => `<rect x="${ox - 14}" y="${74 + k * 3.2}" width="28" height="1.1" fill="${P.sky[1]}" opacity=".7"/>`).join('')}`;
  else if (P.orb === 'rays') { for (let k = 0; k < 6; k++) { const x = 10 + r() * 80; g += `<path d="M${x.toFixed(0)} 0 L${(x - 14 + r() * 8).toFixed(0)} 140 L${(x + 6 + r() * 10).toFixed(0)} 140 Z" fill="${P.glow}" opacity="${(.06 + r() * .08).toFixed(2)}"/>`; } }
  else if (P.orb === 'ember') g += `<circle cx="${ox}" cy="96" r="50" fill="url(#${u}g)"/>`;
  else if (P.orb === 'rainbow') { ['#FF6B6B', '#FFB86B', '#FFE66B', '#7BE07B', '#6BC5FF', '#B48BFF'].forEach((c, k) => { g += `<path d="M-10 ${100 - k * 0} A 60 60 0 0 1 110 100" stroke="${c}" stroke-width="3.2" fill="none" opacity=".55" transform="translate(0 ${-k * 3.1}) scale(1 ${1 - k * .02})"/>`; }); }
  else if (P.orb === 'lamp') g += `<circle cx="${ox}" cy="96" r="26" fill="url(#${u}g)"/><rect x="${ox - .6}" y="96" width="1.2" height="30" fill="#2A2A3A"/><circle cx="${ox}" cy="96" r="2.4" fill="#FFE6A0"/>`;
  // 구름
  const nc = P.sea || P.lava ? 0 : 2 + Math.floor(r() * 3);
  for (let i = 0; i < nc; i++) { const cx = r() * 100, cy = 12 + r() * 50, w = 14 + r() * 18; g += `<g opacity="${P.stars > 30 ? .22 : .75}" filter="url(#dxBlur)"><ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${w.toFixed(0)}" ry="${(w * .28).toFixed(1)}" fill="#fff"/><ellipse cx="${(cx - w * .35).toFixed(0)}" cy="${(cy - 3).toFixed(0)}" rx="${(w * .5).toFixed(0)}" ry="${(w * .3).toFixed(1)}" fill="#fff"/><ellipse cx="${(cx + w * .3).toFixed(0)}" cy="${(cy - 4).toFixed(0)}" rx="${(w * .45).toFixed(0)}" ry="${(w * .32).toFixed(1)}" fill="#fff"/></g>`; }
  // 떠 있는 섬
  if (P.isle) { const ix = 15 + r() * 60, iy = 60 + r() * 15; g += `<g><ellipse cx="${ix + 10}" cy="${iy}" rx="14" ry="3.5" fill="#7BC46A"/><path d="M${ix - 4} ${iy} Q${ix + 10} ${iy + 22} ${ix + 24} ${iy} Z" fill="#8A6A4A"/><path d="M${ix + 2} ${iy - 1} l3 -9 l3 9z M${ix + 14} ${iy - 1} l3 -12 l3 12z" fill="#2F7A45"/></g>`; }
  // 땅·바다·숲 (세 겹, 멀수록 흐리게)
  const base = [92, 106, 120];
  for (let k = 0; k < 3; k++) {
    const op = [.55, .8, 1][k], smooth = P.dune || P.candy || P.sea || P.fog;
    g += `<path d="${ridge(r, base[k] + (r() - .5) * 6, P.dune ? 4 : P.candy ? 5 : P.sea ? 2 : 8 - k * 2, P.sea ? 10 : 6 + Math.floor(r() * 5), smooth)}" fill="${P.hill[k]}" opacity="${op}"${k === 0 ? ' filter="url(#dxPaint)"' : ''}/>`;
    if (P.forest) g += trees(r, base[k] + 4, 9 - k * 2, P.hill[k], 14 + k * 6);
    if (P.fog && k < 2) g += `<rect x="0" y="${base[k] - 6}" width="100" height="14" fill="#fff" opacity=".35" filter="url(#dxSoft)"/>`;
    if (P.lava && k === 1) g += `<path d="M0 ${base[k] + 6} Q30 ${base[k] - 2} 55 ${base[k] + 8} T100 ${base[k] + 4}" stroke="#FF8A2A" stroke-width="1.4" fill="none" opacity=".85"/>`;
  }
  // 물결·거품·불티·반짝이
  if (P.sea) { for (let i = 0; i < 12; i++) { const x = r() * 100, y = 30 + r() * 100, z = .6 + r() * 1.8; g += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${z.toFixed(1)}" fill="none" stroke="#DDFBFF" stroke-width=".4" opacity=".7"/>`; } g += `<path d="M0 14 q12 -4 25 0 t25 0 t25 0 t25 0" stroke="#fff" stroke-width=".8" fill="none" opacity=".4"/>`; }
  if (P.lava) for (let i = 0; i < 18; i++) g += `<circle cx="${(r() * 100).toFixed(0)}" cy="${(30 + r() * 80).toFixed(0)}" r="${(.3 + r() * .7).toFixed(1)}" fill="#FFB04A" opacity="${(.5 + r() * .5).toFixed(2)}"/>`;
  if (P.candy || s.b === 0) for (let i = 0; i < 10; i++) { const x = r() * 100, y = 20 + r() * 90, z = 1 + r() * 1.6; g += `<path d="M${x} ${y - z} L${x + z * .3} ${y - z * .3} L${x + z} ${y} L${x + z * .3} ${y + z * .3} L${x} ${y + z} L${x - z * .3} ${y + z * .3} L${x - z} ${y} L${x - z * .3} ${y - z * .3}Z" fill="#fff" opacity="${(.5 + r() * .5).toFixed(2)}"/>`; }
  if (P.dune) g += `<path d="M0 118 Q40 108 100 116" stroke="#FFE3B0" stroke-width=".6" fill="none" opacity=".7"/><path d="M0 126 Q50 120 100 128" stroke="#FFE3B0" stroke-width=".6" fill="none" opacity=".5"/>`;
  // 주인공 발밑 그림자와 빛, 종이 질감, 가장자리 어둡게
  g += `<ellipse cx="50" cy="118" rx="26" ry="4" fill="#000" opacity=".22" filter="url(#dxBlur)"/><rect width="100" height="70" fill="url(#${u}h)"/><rect width="100" height="140" filter="url(#dxGrain)" opacity=".22"/><rect width="100" height="140" fill="url(#dxVig)"/></svg>`;
  return SCN[id] = g;
}
function dcard(id, cls = '', attrs = '') {
  if (isDOM) dsDefs();
  const s = SPEC[id], r = hsh(id), many = s.l === 4 || s.l === 1;
  const sub = many ? [0, 1, 2, 3, 4].slice(0, s.l === 1 ? 3 : 5).map(k => `<span class="dx-o s dxs${k}" style="--rr:${((r(k) - .5) * 40).toFixed(0)}deg;--ss:${(.75 + r(k + 1) * .5).toFixed(2)}">${U.img(s.c)}</span>`).join('') : `<span class="dx-o b" style="--rr:${((r(2) - .5) * 36).toFixed(0)}deg">${U.img(s.c)}</span>`;
  const rr = rng(id + 101), pool = PROP[s.b].filter(k => k !== s.a && k !== s.c), used = new Set(), spots = SPOT.slice().sort(() => rr() - .5);
  let props = '';
  for (let k = 0; k < (s.l === 4 || s.l === 1 ? 2 : 3); k++) { const pk = pool[Math.floor(rr() * pool.length)]; if (used.has(pk)) continue; used.add(pk); const [x, y] = spots[k]; props += `<span class="dx-o x" style="left:${x}%;top:${y}%;--rr:${((rr() - .5) * 50).toFixed(0)}deg;--ss:${(.55 + rr() * .4).toFixed(2)};--d:${(rr() * -6).toFixed(1)}s">${U.img(pk)}</span>`; }
  return `<span class="dxc p${s.b} l${s.l} ${cls}" ${attrs}><span class="dx-bg">${dscene(id)}</span>${props}${sub}<span class="dx-o a" style="--ra:${((r(1) - .5) * 14).toFixed(0)}deg">${U.img(s.a)}</span><span class="dx-glow"></span></span>`;
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
const need = () => 1;
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
    '다른 사람들은 그 제시어에 가장 어울리는 자기 그림을 몰래 한 장 내고, 그 그림에 대한 설명을 직접 적어요(공개 때 함께 보여요).',
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
      S.clue = txt; S.sub = {[me]: [c]}; S.desc = {[me]: txt}; S.phase = 'submit'; S.n++;
      U.log(S, `📖 ${P[me].name}님의 제시어: "${txt}"`);
      return;
    }
    if (t === 'sub') {
      if (S.phase !== 'submit' || me === S.st) throw U.err('지금은 그림을 낼 수 없어요.');
      const c = +a.c, mine = S.sub[me] || [];
      if (mine.length >= need(S, P)) throw U.err('이미 냈어요.');
      if (!S.hand[me].includes(c)) throw U.err('그 그림이 없어요.');
      const txt = String(a.text || '').trim().slice(0, 40);
      if (!txt) throw U.err('내 그림에 대한 설명을 적어 주세요.');
      S.hand[me].splice(S.hand[me].indexOf(c), 1); S.sub[me] = mine.concat(c); S.desc = S.desc || {}; S.desc[me] = txt; S.n++;
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
      S.st = (S.st + 1) % P.length; S.round++; S.phase = 'clue'; S.clue = ''; S.sub = {}; S.table = []; S.votes = {}; S.desc = {}; S.gain = null; S.found = null; S.n++;
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
    if (left > 0) h += `<section class="dx-panel"><div class="dx-h"><b>🎴 “${U.esc(S.clue)}”에 어울리는 내 그림을 내요${need(S, P) > 1 ? ` (${left}장 더)` : ''}</b><small>그림을 고르고, 내 그림에 대한 설명을 직접 적어요. 설명은 공개 때 보여요!</small></div>${hand(ui.dsel, true)}<div class="dx-input"><input id="dx-desc" data-field="text" maxlength="40" placeholder="내 그림 설명 (예: 혼자 달을 올려다보는 여우)" autocomplete="off">${U.btn(ui.dsel != null ? '이 그림과 설명 내기' : '먼저 그림을 고르세요', 'sub', {c: ui.dsel}, 'primary big dx-go', ui.dsel == null).replace('<button ', '<button data-fields ')}</div></section>`;
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
      return `<div class="dx-tc ${cls}" style="--k:${k}"><span class="dx-num">${k + 1}</span>${dcard(t.c, '', attrs)}<button type="button" class="dx-zoom" data-g="dzoom" data-val="${U.attr(t.c)}" aria-label="크게 보기">🔍</button>${own && !rv ? '<span class="dx-own">내 그림</span>' : ''}${rv ? `<div class="dx-rv"><span class="dx-by" style="--pc:${U.pc(t.by)}">${t.by === st ? '📖 ' : ''}${pn(P, t.by)}</span>${S.desc && S.desc[t.by] ? `<span class="dx-desc">“${U.esc(S.desc[t.by])}”</span>` : ''}<span class="dx-vs">${voters.map(i => `<i style="--pc:${U.pc(i)}">${pn(P, i)}</i>`).join('') || '<em>표 없음</em>'}</span></div>` : ''}</div>`;
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
    const tg = tagsOf(best.c), w = tg[U.rint(tg.length)], w2 = tg[U.rint(tg.length)];
    return run(i, 'sub', {c: best.c, text: w === w2 ? `${w}의 순간` : `${w}과 ${w2}`});
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
G.dixit.card = dcard;
G.dixit.BOTNAMES = ['몽상가', '이야기꾼', '그림쟁이', '시인', '꿈나무', '달토끼', '별지기', '구름'];
G.dixit.art = (k, x) => k === 'card' ? dcard(x, 'big') : k === 'back' ? dback('big') : '';
G.dixit._n = NCARD;
})();
