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
const isDOM = typeof document !== 'undefined';
const GST = {w: ['#FFFFFF', '#DCE5F2', '#93A3BC'], u: ['#A3C8FF', '#2F6FE0', '#0D2A6E'], g: ['#9DF2C8', '#1FA463', '#074527'],
  r: ['#FFA8B2', '#E0384B', '#650A18'], k: ['#A3ABBD', '#3B404C', '#07080C'], y: ['#FFF4B5', '#F5C542', '#8F5E00']};
const lin = (id, st, x2 = 1, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${st.map((c, k) => `<stop offset="${k / (st.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
function defsSVG() {
  let d = '';
  for (const x in GST) {
    d += lin('spg-' + x, GST[x]);
    d += `<radialGradient id="spr-${x}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${GST[x][0]}"/><stop offset=".45" stop-color="${GST[x][1]}"/><stop offset="1" stop-color="${GST[x][2]}"/></radialGradient>`;
  }
  d += lin('sp-sky0', ['#BFE3FF', '#FDF3DC'], 0, 1) + lin('sp-sky1', ['#7EC3FF', '#DDF1FF'], 0, 1) + lin('sp-sky2', ['#2A1550', '#8C3A78', '#F39A63'], 0, 1)
    + lin('sp-sea', ['#4FA0E8', '#123F7A'], 0, 1) + lin('sp-mtn', ['#A9B6CC', '#56627C'], 0, 1) + lin('sp-hill', ['#C79B62', '#6A4522'], 0, 1)
    + lin('sp-wood', ['#9A6431', '#4A2C10'], 0, 1) + lin('sp-gold', ['#FFF0A8', '#E3A92F', '#8A5800']) + lin('sp-parch', ['#FFF9EA', '#EED9AE'], 0, 1)
    + lin('sp-bk0', ['#4CB873', '#1D6B3E']) + lin('sp-bk1', ['#F0BE3A', '#A86F07']) + lin('sp-bk2', ['#4E86E8', '#1A3F95']) + lin('sp-wall', ['#FFF6E2', '#D9BE8C'], 0, 1);
  return d;
}
function ensureDefs() {
  if (!isDOM || document.getElementById('sp-defs')) return;
  const host = document.body || document.documentElement; if (!host) return;
  const w = document.createElement('div');
  w.innerHTML = `<svg id="sp-defs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>${defsSVG()}</defs></svg>`;
  host.appendChild(w.firstChild);
}
if (isDOM) { if (document.body) ensureDefs(); else document.addEventListener('DOMContentLoaded', ensureDefs); }

const GEMP = {
  w: `<path d="M5 15 12.5 5.5h15L35 15 20 35.5z" fill="url(#spg-w)" stroke="#6F7E99" stroke-width="1.3" stroke-linejoin="round"/><path d="M12.5 5.5h15L24 15h-8z" fill="#fff" opacity=".85"/><path d="M5 15l7.5-9.5L16 15z" fill="#fff" opacity=".5"/><path d="M27.5 5.5 35 15H24z" fill="#5C6C88" opacity=".35"/><path d="M5 15h11l4 20.5z" fill="#C3D0E3" opacity=".7"/><path d="M24 15h11L20 35.5z" fill="#54637F" opacity=".5"/><path d="M16 15h8l-4 20.5z" fill="#fff" opacity=".6"/>`,
  u: `<ellipse cx="20" cy="20" rx="12.5" ry="15.5" fill="url(#spg-u)" stroke="#0D2A6E" stroke-width="1.3"/><path d="M14 13.5 20 9l6 4.5v13L20 31l-6-4.5z" fill="#CFE1FF" opacity=".45"/><path d="M20 4.5V9M20 31v4.5M7.5 20H14M26 20h6.5M11 9.5l3 4M29 9.5l-3 4M11 30.5l3-4M29 30.5l-3-4" stroke="#0D2A6E" stroke-width=".8" opacity=".55"/><path d="M26 13.5v13l6.5-6.5z" fill="#06173F" opacity=".35"/><path d="M20 31l6-4.5 3 4L20 35.5z" fill="#06173F" opacity=".35"/><path d="M14 13.5 20 9V4.5c-5 0-9 4-10 7.5z" fill="#fff" opacity=".35"/>`,
  g: `<path d="M12 5.5h16l6.5 6.5v16L28 34.5H12L5.5 28V12z" fill="url(#spg-g)" stroke="#063D22" stroke-width="1.3" stroke-linejoin="round"/><path d="M12 5.5h16l-2.5 4.5h-11z" fill="#fff" opacity=".55"/><path d="M5.5 12l4.5 2.5v11L5.5 28z" fill="#fff" opacity=".25"/><path d="M34.5 12 30 14.5v11l4.5 2.5z" fill="#022314" opacity=".35"/><path d="M28 34.5H12l2.5-4.5h11z" fill="#022314" opacity=".4"/><path d="M14.5 10h11l4.5 4.5v11L25.5 30h-11L10 25.5v-11z" fill="#7BE3AE" opacity=".25" stroke="#063D22" stroke-width=".7"/><path d="M16.5 14h7l2.5 2.5v7L23.5 26h-7L14 23.5v-7z" fill="#C9FFE2" opacity=".5"/>`,
  r: `<circle cx="20" cy="20" r="15" fill="url(#spg-r)" stroke="#5A0915" stroke-width="1.3"/><path d="M20 12.5l5.3 2.2 2.2 5.3-2.2 5.3-5.3 2.2-5.3-2.2-2.2-5.3 2.2-5.3z" fill="#FFD0D6" opacity=".45" stroke="#5A0915" stroke-width=".7"/><path d="M20 5v7.5M35 20h-7.5M20 35v-7.5M5 20h7.5M9.4 9.4l5.3 5.3M30.6 9.4l-5.3 5.3M30.6 30.6l-5.3-5.3M9.4 30.6l5.3-5.3" stroke="#5A0915" stroke-width=".8" opacity=".5"/><path d="M30.6 9.4A15 15 0 0 1 9.4 30.6L20 20z" fill="#3A0008" opacity=".28"/><path d="M9.4 9.4A15 15 0 0 1 20 5v7.5l-5.3 2.2z" fill="#fff" opacity=".4"/>`,
  k: `<path d="M20 4.5l13.5 7.8v15.5L20 35.5 6.5 27.8V12.3z" fill="url(#spg-k)" stroke="#000" stroke-width="1.3" stroke-linejoin="round"/><path d="M20 11.5l7.4 4.3v8.5L20 28.5l-7.4-4.2v-8.5z" fill="#5A6275" opacity=".55" stroke="#C5CCDA" stroke-width=".6" stroke-opacity=".5"/><path d="M20 4.5v7l-7.4 4.3-6.1-3.5z" fill="#fff" opacity=".3"/><path d="M33.5 27.8 27.4 24.3 20 28.5v7z" fill="#000" opacity=".45"/><ellipse cx="17" cy="16" rx="3.5" ry="2" fill="#fff" opacity=".45" transform="rotate(-30 17 16)"/>`,
  y: `<circle cx="20" cy="20" r="15.5" fill="url(#spg-y)" stroke="#7A4D00" stroke-width="1.3"/><circle cx="20" cy="20" r="11.5" fill="none" stroke="#8F5E00" stroke-width="1" opacity=".7"/><path d="M12.5 24.5l1.6-9 3.9 4.3 2-6.3 2 6.3 3.9-4.3 1.6 9z" fill="#8F5E00" opacity=".85"/><rect x="12.5" y="25" width="15" height="2.2" rx="1" fill="#8F5E00" opacity=".85"/><path d="M9 14a12 12 0 0 1 9-8" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`
};
const SPARK = `<path class="spk" d="M11 6.5l1.1 3.4 3.4 1.1-3.4 1.1L11 15.5l-1.1-3.4-3.4-1.1 3.4-1.1z" fill="#fff"/>`;
const gem = x => `<svg viewBox="0 0 40 40" class="spgem" aria-hidden="true">${GEMP[x]}${SPARK}</svg>`;
const chip = x => { const ins = x === 'w' ? '#7B89A2' : x === 'y' ? '#FFF8D8' : '#fff';
  return `<svg viewBox="0 0 64 64" class="spchip" aria-hidden="true"><circle cx="32" cy="33.5" r="30" fill="rgba(0,0,0,.28)"/><circle cx="32" cy="32" r="30" fill="url(#spr-${x})" stroke="rgba(0,0,0,.35)"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<rect x="28.5" y="2.6" width="7" height="8.6" rx="2" fill="${ins}" opacity=".92" transform="rotate(${k * 45 + 22.5} 32 32)"/>`).join('')}<circle cx="32" cy="32" r="21" fill="url(#spr-${x})" stroke="${ins}" stroke-width="1.6" stroke-dasharray="3 2.3"/><circle cx="32" cy="32" r="17.5" fill="rgba(255,255,255,.14)" stroke="rgba(0,0,0,.22)"/><g transform="translate(15.5 15.5) scale(.825)">${GEMP[x]}</g><path d="M10 25A23 23 0 0 1 25 9.5" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`; };

// 카드 그림: 1단계 광산 · 2단계 상선 · 3단계 궁전 (보너스 색으로 물들어요)
const SCENE = [
  x => `<rect width="100" height="140" fill="url(#sp-sky0)"/><circle cx="78" cy="44" r="10" fill="#FFE9A8"/><circle cx="78" cy="44" r="16" fill="#FFE9A8" opacity=".35"/><path d="M0 98 18 62l13 16 19-32 20 34 12-12 18 22v50H0z" fill="url(#sp-mtn)"/><path d="M50 46l6 10-4 2-5-4-3 3z" fill="#fff" opacity=".85"/><path d="M0 108q26-18 54-6t46-4v42H0z" fill="url(#sp-hill)"/><path d="M27 140v-26q17-22 34 0v26z" fill="#1A1006"/><path d="M33 140v-22q11-12 22 0v22z" fill="url(#spg-${x})" opacity=".22"/><path d="M25 140v-28M63 140v-28M22 112h44" stroke="url(#sp-wood)" stroke-width="4.5" stroke-linecap="round"/><circle cx="76" cy="122" r="13" fill="url(#spg-${x})" opacity=".3"/><path d="M70 132l4-17 4 17zM77 133l3-12 3 12zM66 134l2.5-9 2.5 9z" fill="url(#spg-${x})" stroke="#fff" stroke-width=".7"/><path d="M6 130h17l-2.5 8H8.5z" fill="#5A3A18" stroke="#2E1C08" stroke-width=".8"/><path d="M9 130l2-4 3 4zM14 130l2.5-5 3 5z" fill="url(#spg-${x})"/><circle cx="11" cy="139" r="2" fill="#222"/><circle cx="19" cy="139" r="2" fill="#222"/>`,
  x => `<rect width="100" height="140" fill="url(#sp-sky1)"/><circle cx="80" cy="40" r="9" fill="#FFF1B8"/><ellipse cx="24" cy="44" rx="13" ry="4" fill="#fff" opacity=".85"/><ellipse cx="32" cy="40" rx="8" ry="4" fill="#fff" opacity=".85"/><path d="M0 108q12-6 25 0t25 0 25 0 25 0v32H0z" fill="url(#sp-sea)"/><path d="M20 110h62l-9 15H30z" fill="url(#sp-wood)" stroke="#2E1C08" stroke-width=".8"/><path d="M24 115h54" stroke="url(#sp-gold)" stroke-width="1.6"/><path d="M44 110V52M64 110V62" stroke="#3E260E" stroke-width="2.2"/><path d="M44 56q17 13 0 30zM44 88q13 9 0 19z" fill="#FFF8E8" stroke="#BFA06A" stroke-width=".8"/><path d="M64 64q13 10 0 24zM64 90q10 7 0 15z" fill="#FFF8E8" stroke="#BFA06A" stroke-width=".8"/><path d="M44 64q8.5 6.5 0 14zM64 70q6.5 5 0 11z" fill="url(#spg-${x})"/><path d="M44 52l12 3.5L44 59zM64 62l9 2.7-9 2.8z" fill="url(#spg-${x})"/><path d="M0 124q10-5 20 0t20 0 20 0 20 0 20 0v16H0z" fill="#9ED0FF" opacity=".45"/><path d="M6 132q5-3 10 0M58 134q5-3 10 0M80 128q5-3 10 0" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/>`,
  x => `<rect width="100" height="140" fill="url(#sp-sky2)"/><circle cx="16" cy="40" r=".9" fill="#fff"/><circle cx="84" cy="34" r="1.1" fill="#fff"/><circle cx="66" cy="46" r=".7" fill="#fff"/><circle cx="30" cy="52" r=".7" fill="#fff"/><path d="M10 140V96h14v44zM76 140V96h14v44z" fill="url(#sp-wall)" stroke="#9C7A44" stroke-width=".7"/><path d="M8 96q9-18 18 0zM74 96q9-18 18 0z" fill="url(#spg-${x})" stroke="url(#sp-gold)" stroke-width="1"/><path d="M17 79v-6M83 79v-6" stroke="url(#sp-gold)" stroke-width="1.4"/><path d="M22 140v-34h56v34z" fill="url(#sp-wall)" stroke="#9C7A44" stroke-width=".7"/><path d="M33 106q17-36 34 0z" fill="url(#spg-${x})" stroke="url(#sp-gold)" stroke-width="1.2"/><path d="M50 70v-8" stroke="url(#sp-gold)" stroke-width="1.8"/><circle cx="50" cy="61" r="2" fill="url(#sp-gold)"/><path d="M22 106h56" stroke="url(#sp-gold)" stroke-width="2"/><path d="M42 140v-18q8-10 16 0v18z" fill="#3A2410"/><rect x="28" y="114" width="6" height="9" rx="3" fill="#FFD27A"/><rect x="66" y="114" width="6" height="9" rx="3" fill="#FFD27A"/><rect x="14" y="104" width="5" height="8" rx="2.5" fill="#FFD27A"/><rect x="81" y="104" width="5" height="8" rx="2.5" fill="#FFD27A"/><path d="M36 140h28l-3-4H39z" fill="#E8D2A4"/>`
];
const TIERN = ['Ⅰ', 'Ⅱ', 'Ⅲ'];
const pip = (x, v, cls = '') => `<i class="sp-pip sp-${x} ${cls}">${v}</i>`;
function cardHTML(id, o = {}) {
  const c = CARDS[id], tag = o.btn ? 'button' : 'div';
  return `<${tag}${o.btn ? ` type="button" ${o.btn}` : ''} class="spc sp-${c.b} t${c.t} ${o.cls || ''}" ${o.style ? `style="${o.style}"` : ''}><svg class="spc-art" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${SCENE[c.t](c.b)}</svg><span class="spc-band"><b class="spc-pt">${c.p || ''}</b><span class="spc-gem">${gem(c.b)}</span></span><span class="spc-cost">${C5.filter(x => c.c[x]).map(x => pip(x, c.c[x], o.need && o.need[x] ? 'short' : '')).join('')}</span><span class="spc-tier">${'●'.repeat(c.t + 1)}</span><span class="spc-shine"></span></${tag}>`;
}
const backSVG = t => `<svg viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="10" fill="url(#sp-bk${t})"/><path d="M-20 0 120 140M0 -20 140 120M-40 20 100 160M20 -40 160 100M120 0-20 140M100 -20-40 120M140 20 0 160M80 -40-60 100" stroke="#fff" stroke-width="1" opacity=".13"/><rect x="7" y="7" width="86" height="126" rx="7" fill="none" stroke="url(#sp-gold)" stroke-width="2"/><rect x="11" y="11" width="78" height="118" rx="5" fill="none" stroke="#fff" stroke-width=".7" opacity=".5" stroke-dasharray="2 3"/><circle cx="50" cy="66" r="25" fill="rgba(255,255,255,.12)" stroke="url(#sp-gold)" stroke-width="1.5"/><g transform="translate(30 46)">${GEMP.w.replace('url(#spg-w)', 'rgba(255,255,255,.55)')}</g><text x="50" y="112" text-anchor="middle" font-size="15" font-weight="900" fill="#fff" font-family="Georgia,serif" letter-spacing="2">${TIERN[t]}</text></svg>`;
const backHTML = (t, n, attrs = '', cls = '') => `<button type="button" class="spc sp-back t${t} ${cls}" ${attrs}>${backSVG(t)}${n != null ? `<small class="sp-cnt">${n}</small>` : ''}</button>`;
const ROBE = ['#7A3E9D', '#2A56D6', '#B8392E', '#1C7A55', '#8A6510', '#3B3F8F', '#9C2F6B', '#2E6E8E', '#7E2433', '#4F6B1E'];
function portrait(i) {
  const robe = ROBE[i % 10], hat = i % 3, hair = ['#3A2410', '#7A4A1E', '#C9A25E', '#1E1E24'][i % 4], fem = [2, 5, 8].includes(i);
  const head = hat === 0 ? `<path d="M27 21l3-10 5 6 5-9 5 9 5-6 3 10z" fill="url(#sp-gold)" stroke="#7A4D00" stroke-width="1" stroke-linejoin="round"/><circle cx="40" cy="14" r="1.8" fill="#E0384B"/>`
    : hat === 1 ? `<ellipse cx="40" cy="20" rx="17" ry="6" fill="${robe}"/><path d="M26 19q14-14 28 0z" fill="${robe}"/><path d="M52 15q10-10 12 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<path d="M30 20q10-9 20 0" stroke="url(#sp-gold)" stroke-width="3" fill="none"/><circle cx="40" cy="13.5" r="2.4" fill="url(#spg-u)"/>`;
  return `<svg viewBox="0 0 80 80" aria-hidden="true"><rect width="80" height="80" rx="9" fill="url(#sp-parch)"/><path d="M0 0h80v80H0z" fill="none" stroke="url(#sp-gold)" stroke-width="5"/><rect x="5" y="5" width="70" height="70" rx="5" fill="none" stroke="#B8955A" stroke-width=".8" opacity=".7"/><path d="M14 80c0-18 11-27 26-27s26 9 26 27z" fill="${robe}"/><path d="M14 80c0-18 11-27 26-27s26 9 26 27z" fill="url(#sp-sky2)" opacity=".12"/><path d="M27 56q13 12 26 0l-3 9q-10 7-20 0z" fill="#fff"/><circle cx="33" cy="61" r=".9" fill="#222"/><circle cx="40" cy="63" r=".9" fill="#222"/><circle cx="47" cy="61" r=".9" fill="#222"/>${fem ? `<path d="M25 34q0-17 15-17t15 17v16q-4-6-4-14H29q0 8-4 14z" fill="${hair}"/>` : `<path d="M27 32q0-14 13-14t13 14q-2-6-5-7-8 4-16 0-3 1-5 7z" fill="${hair}"/>`}<ellipse cx="40" cy="36" rx="11" ry="13" fill="#F3D2AE" stroke="#A8784A" stroke-width=".8"/><circle cx="36" cy="35" r="1.4" fill="#3A2410"/><circle cx="44" cy="35" r="1.4" fill="#3A2410"/><path d="M37 42q3 2 6 0" stroke="#8A4A2A" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="34" cy="39.5" r="2" fill="#F29A8A" opacity=".4"/><circle cx="46" cy="39.5" r="2" fill="#F29A8A" opacity=".4"/>${fem ? '' : i % 2 ? `<path d="M34 46q6 4 12 0q-1 5-6 5t-6-5z" fill="${hair}"/>` : ''}${head}</svg>`;
}
const nobleHTML = (ni, cls = '', attrs = '') => { const q = NOBLES[ni];
  return `<div class="spn ${cls}" ${attrs}>${portrait(ni)}<b class="spn-pt">3</b><span class="spn-req">${C5.filter(x => q[x]).map(x => `<i class="sp-sq sp-${x}">${q[x]}</i>`).join('')}</span><small class="spn-nm">${NOBN[ni]}</small></div>`; };

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
  S.turn = (S.turn + 1) % P.length; S.ts = Date.now();
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
      turn: 0, round: 1, final: false, phase: 'play', last: null, lim: 0, ts: Date.now(), log: ['스플렌더 시작! 보석을 모아 카드를 사세요.']};
  },
  turns(S) { return S.winner ? [] : [S.turn]; },
  // 제한시간: 사람 차례에만 적용. 시간이 지나면 진행하는 쪽(서버·방장·폰)이 timeout을 불러요.
  due(S, P) { return S.lim && !S.winner && !(P && P[S.turn] && P[S.turn].bot) ? (S.ts || 0) + S.lim * 1000 : null; },
  timeout(S, P) {
    if (!S.lim || S.winner || (P[S.turn] && P[S.turn].bot) || Date.now() < (S.ts || 0) + S.lim * 1000 - 400) return false;
    const me = S.turn, pl = S.pl[me];
    if (S.phase === 'disc') {
      while (ttot(pl.tok) > 10) {
        const x = C5.concat('y').filter(c => pl.tok[c] > 0).sort((a, b) => pl.tok[b] - pl.tok[a] || (a === 'y') - (b === 'y'))[0];
        pl.tok[x]--; S.tok[x]++; (S.last.ret = S.last.ret || []).push(x);
      }
      S.last.to = 1;
      lg(S, `⏰ ${P[me].name}님 시간 초과! 넘친 보석을 자동으로 돌려놨어요.`);
    } else {
      S.last = {p: me, k: 'time', n: (S.last ? S.last.n : 0) + 1};
      lg(S, `⏰ ${P[me].name}님 시간 초과! 차례가 넘어갔어요.`);
    }
    finish(S, me, P);
    return true;
  },
  act(S, me, t, a, P) {
    if (S.winner) return;
    if (t === 'limit') {
      const sec = +(a && a.s); if (![0, 30, 60].includes(sec)) throw U.err('제한시간은 없음·30초·1분 중에서 골라요.');
      if (S.lim === sec) return;
      S.lim = sec; S.ts = Date.now();
      lg(S, `⏱ ${P[me].name}님이 제한시간을 ${sec ? (sec === 60 ? '1분' : '30초') : '없음'}으로 바꿨어요.`);
      return;
    }
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
      S.last = {p: me, k: 'res', id: h ? null : id, tier: CARDS[id].t, gold, src: h ? 'd' : 'b', t: h ? undefined : +a.t, i: h ? undefined : +a.i, n: (S.last ? S.last.n : 0) + 1};
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
      const pay = {}; for (const x of C5) if (nd.pay[x]) pay[x] = nd.pay[x]; if (nd.gold) pay.y = nd.gold;
      S.last = {p: me, k: 'buy', id, src: a.r != null ? 'r' : 'b', t: a.r != null ? undefined : +a.t, i: a.r != null ? undefined : +a.i, pay, n: (S.last ? S.last.n : 0) + 1};
      lg(S, `${P[me].name}님이 ${SN[c.b]} 카드를 샀어요${c.p ? ` (+${c.p}점)` : ''}.`);
      return finish(S, me, P);
    }
    if (t === 'pass') {
      if (hasMove(S, me)) throw U.err('아직 할 수 있는 행동이 있어요.');
      S.last = {p: me, k: 'pass', n: (S.last ? S.last.n : 0) + 1}; lg(S, `${P[me].name}님은 할 수 있는 게 없어 넘겼어요.`);
      return finish(S, me, P);
    }
  },
  view(S, me, ui, P) {
    ensureDefs();
    if (isDOM) setTimeout(() => spFx(S, me, P), 0);
    return `<div class="spbox"><div class="spw">${spBody(S, me, ui || {}, P)}</div></div>`;
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
  splash: true
};
function spCanPick(S, p, x) {
  if (x === 'y' || S.tok[x] < 1) return false;
  if (p.includes(x)) return true;
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
// 처음 보는 행동이면 애니메이션 시작 시각을 기록 (새로고침 직후에는 다시 재생하지 않아요)
function fresh(S, key, dur) {
  if (!isDOM) return -1;
  const W = window; if (!W.__spfx || !W.__spfx[S._g]) return -1;
  W.__spT = W.__spT || {}; const k = S._g + key, now = Date.now();
  if (!W.__spT[k]) W.__spT[k] = now;
  const el = (now - W.__spT[k]) / 1000; return el < dur ? el : -1;
}
const anim = el => el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s"`;
const nm = (P, i) => U.nm(P, i);

function spBody(S, me, ui, P) {
  const my = me === S.turn && !S.winner, pl = me >= 0 && S.pl[me] ? S.pl[me] : null, act = my && S.phase === 'play';
  const L = S.last, sel = ui.sel || null;
  let h = '';
  // ── 위쪽 띠: 차례 / 게임 끝
  if (S.winner) h += spEnd(S, P);
  else {
    const bot = P[S.turn] && P[S.turn].bot;
    h += `<header class="sp-strip${my ? ' me' : ''}" style="--pc:${U.pc(S.turn)}"><div class="sp-round"><small>ROUND</small><b>${S.round}</b></div><div class="sp-who"><span class="sp-av">${bot ? '🤖' : '💎'}</span><div><b>${nm(P, S.turn)}${my ? ' (나)' : ''} 차례</b><small>${my ? (S.phase === 'disc' ? '보석이 10개를 넘었어요 · 돌려놓을 보석을 누르세요' : '카드를 누르거나 보석을 고르세요') : bot ? 'AI가 생각하는 중…' : '고르는 중…'}</small></div></div>${spLast(S, P)}${spTimer(S, P)}${me >= 0 ? `<span class="sp-setw"><button type="button" class="sp-setb${ui.lim ? ' on' : ''}" data-ui="lim" data-tog data-val="1" aria-label="제한시간 설정">⏱<span>${S.lim ? '' : ' 제한시간'}</span></button>${ui.lim ? `<div class="sp-limit">${[[0, '없음'], [30, '30초'], [60, '1분']].map(([v, l]) => U.btn(l, 'limit', {s: v}, 'sm' + ((S.lim || 0) === v ? ' on' : ''))).join('')}<small>누구나 바꿀 수 있어요</small></div>` : ''}</span>` : ''}${S.final ? '<span class="sp-final">🏁 <span>마지막 바퀴</span></span>' : '<span class="sp-goal">🏆 <span>먼저 </span><b>15점</b></span>'}</header>`;
  }
  // ── 왼쪽: 카드 시장 + 귀족
  const fr = L && (L.k === 'buy' || L.k === 'res') && L.src === 'b' ? fresh(S, 'deal' + L.n, 0.9) : -1;
  let mk = '';
  for (const t of [2, 1, 0]) {
    const canDeck = act && S.decks[t].length && pl.res.length < 3;
    mk += `<div class="sp-row">${backHTML(t, S.decks[t].length, `data-spdeck="${t}" ${S.decks[t].length ? `data-ui="sel" data-val="${U.attr({d: t, n: S.decks[t].length})}"` : 'disabled'}${canDeck ? '' : ' data-off'}`, sel && sel.d === t ? 'sel' : '')}`;
    S.board[t].forEach((id, i) => {
      const deal = fr >= 0 && L.t === t && L.i === i;
      mk += `<div class="sp-slot" data-spslot="${t}-${i}">${id == null ? '<div class="spc sp-empty"></div>' : cardHTML(id, {
        btn: `data-ui="sel" data-val="${U.attr({t, i, id})}" aria-label="${CARDS[id].t + 1}단계 ${SN[CARDS[id].b]} 카드 ${CARDS[id].p}점"`,
        cls: (sel && sel.t === t && sel.i === i ? 'sel ' : '') + (pl && !S.winner && need(pl, id).ok ? 'afford ' : '') + (deal ? 'deal' : ''),
        style: deal ? `--el:${fr.toFixed(2)}s` : ''})}</div>`;
    });
    mk += `</div>`;
  }
  const nob = S.nobles.map(ni => nobleHTML(ni, pl && C5.every(x => pl.bon[x] >= (NOBLES[ni][x] || 0)) ? 'ready' : '')).join('') || '<small class="sp-none">귀족이 모두 떠났어요</small>';
  h += `<div class="sp-left"><div class="sp-lin"><div class="sp-mk">${mk}</div><div class="sp-nobs" data-spnobs><span class="sp-nl">👑 귀족</span>${nob}</div></div></div>`;
  // ── 오른쪽
  let r = '';
  if (!S.winner) {
    const pick = act && Array.isArray(ui.pick) ? ui.pick : [];
    r += `<section class="sp-bank"><div class="sp-h"><b>보석 은행</b><small>${act ? '다른 색 3개 · 또는 같은 색 2개(4개 이상 남았을 때)' : '황금은 카드를 예약하면 받아요'}</small></div><div class="sp-chips">${C5.concat('y').map(x => {
      const n = S.tok[x], cnt = pick.filter(v => v === x).length;
      const dis = !act || !spCanPick(S, pick, x);
      return `<button type="button" class="sp-tk sp-${x}${cnt ? ' on' : ''}${n ? '' : ' zero'}" data-spb="${x}" data-g="pick" data-val="${U.attr(x)}"${dis ? ' disabled' : ''} aria-label="${SN[x]} ${n}개"><span class="sp-chipw">${chip(x)}${cnt ? `<em>${cnt > 1 ? '×2' : '✓'}</em>` : ''}</span><b>${n}</b></button>`;
    }).join('')}</div>`;
    if (act) {
      const ok = spPickOk(S, pick), aft = ttot(pl.tok) + pick.length;
      r += `<div class="sp-actbar">${pick.length ? `<span class="sp-picked">${pick.map(x => `<span class="sp-mini">${gem(x)}</span>`).join('')}</span>${U.gb('취소', 'pick', null, 'ghost sm')}${U.btn(ok ? `가져오기${aft > 10 ? ` · ${aft - 10}개 반납` : ''}` : '더 고르세요', 'take', {g: pick}, 'primary', !ok)}` : `<span class="sp-tip">💡 보석을 누르거나, 카드를 눌러 <b>사기·예약</b>을 하세요</span>`}</div>`;
    } else if (my && S.phase === 'disc') {
      r += `<div class="sp-actbar disc"><b>보석 ${ttot(pl.tok)}개 → ${ttot(pl.tok) - 10}개 돌려놓기</b><span class="sp-retrow">${C5.concat('y').filter(x => pl.tok[x]).map(x => U.btn(`<span class="sp-chipw">${chip(x)}</span><b>${pl.tok[x]}</b>`, 'ret', {x}, 'sp-tk ret')).join('')}</span></div>`;
    } else r += `<div class="sp-actbar idle"><span class="sp-tip">👀 카드나 다른 사람이 예약한 카드를 눌러 자세히 볼 수 있어요</span></div>`;
    r += `</section>`;
  }
  if (pl) r += spSeat(S, me, P, true, act, sel);
  const others = P.map((_, i) => i).filter(i => i !== me);
  r += `<section class="sp-opps n${others.length}">${others.map(i => spSeat(S, i, P, false, false, sel)).join('')}</section>`;
  r += `<details class="sp-logd"><summary>📜 진행 기록</summary><ol>${(S.log || []).slice().reverse().map(l => `<li>${U.esc(l)}</li>`).join('')}</ol></details>`;
  if (act && !hasMove(S, me)) r += U.btn('할 수 있는 행동이 없어요 · 차례 넘기기', 'pass', {}, 'big');
  h += `<div class="sp-right">${r}</div>`;
  // ── 자세히 보기 창
  h += spModal(S, me, sel, P, act);
  return h;
}

function spTimer(S, P) {
  if (!S.lim || S.winner) return '';
  if (P[S.turn] && P[S.turn].bot) return `<span class="sp-timer idle">⏱ ${S.lim === 60 ? '1분' : '30초'}</span>`;
  let seen = Date.now();
  if (isDOM) { const W = window; W.__spTS = W.__spTS || {}; const k = S._g + ':' + S.ts + ':' + S.lim; seen = W.__spTS[k] = W.__spTS[k] || Date.now(); spTick(); }
  const el = Math.min(S.lim, (Date.now() - seen) / 1000), rem = Math.max(0, Math.ceil(S.lim - el));
  return `<span class="sp-timer${rem <= 10 ? ' warn' : ''}" data-end="${seen + S.lim * 1000}" style="--lim:${S.lim}s;--el:${el.toFixed(2)}s" title="남은 시간"><i></i><b>${rem}</b><small>초</small></span>`;
}
function spTick() {
  const W = window; if (W.__spTick) return;
  W.__spTick = setInterval(() => document.querySelectorAll('.sp-timer[data-end]').forEach(e => {
    const r = Math.max(0, Math.ceil((+e.dataset.end - Date.now()) / 1000)), b = e.querySelector('b');
    if (b && b.textContent !== String(r)) b.textContent = r;
    e.classList.toggle('warn', r <= 10); e.classList.toggle('zero', r === 0);
  }), 250);
}
function spSeat(S, i, P, mine, act, sel) {
  const pl = S.pl[i], tot = ttot(pl.tok), on = i === S.turn && !S.winner;
  const L = S.last, pop = L && L.p === i && (L.k === 'buy' && CARDS[L.id].p || L.nob != null) ? fresh(S, 'pop' + L.n + (L.nob != null ? 'n' : ''), 1.2) : -1;
  const cols = C5.map(x => `<div class="sp-col sp-${x}"><span class="sp-bon${pl.bon[x] ? '' : ' z'}">${pl.bon[x]}</span><span class="sp-tc${pl.tok[x] ? '' : ' z'}"><span class="sp-chipw">${chip(x)}</span><b>${pl.tok[x]}</b></span></div>`).join('')
    + `<div class="sp-col sp-y"><span class="sp-bon none"></span><span class="sp-tc${pl.tok.y ? '' : ' z'}"><span class="sp-chipw">${chip('y')}</span><b>${pl.tok.y}</b></span></div>`;
  const res = pl.res.map((r, k) => {
    const showFace = mine || !r.h || S.winner;
    const v = mine ? {r: k, id: r.i} : {o: i, k, id: showFace ? r.i : -1};
    const isSel = sel && (mine ? sel.r === k && sel.o == null : sel.o === i && sel.k === k);
    const lbl = showFace ? `${SN[CARDS[r.i].b]} 카드 ${CARDS[r.i].p}점` : `몰래 예약한 ${CARDS[r.i].t + 1}단계 카드`;
    return showFace ? cardHTML(r.i, {btn: `data-ui="sel" data-val="${U.attr(v)}" aria-label="${nm(P, i)} 예약: ${lbl}"`, cls: 'mini ' + (isSel ? 'sel ' : '') + (mine && need(pl, r.i).ok ? 'afford' : '') + (mine && r.h ? ' secret' : '')})
      : backHTML(CARDS[r.i].t, null, `data-ui="sel" data-val="${U.attr(v)}" aria-label="${nm(P, i)} 예약: ${lbl}"`, 'mini' + (isSel ? ' sel' : ''));
  });
  if (mine) while (res.length < 3) res.push('<span class="spc mini sp-rslot">📌</span>');
  return `<section class="sp-seat${mine ? ' mine' : ''}${on ? ' on' : ''}" data-sps="${i}" style="--pc:${U.pc(i)}">
<div class="sp-sid"><div class="sp-sh"><span class="pdot"></span><b class="sp-nm">${nm(P, i)}${mine ? ' (나)' : ''}</b>${pl.nob.map(ni => `<span class="sp-crown" title="${NOBN[ni]}">👑</span>`).join('')}</div><div class="sp-sline"><span class="sp-pts${pop >= 0 ? ' pop' : ''}"${pop >= 0 ? ` style="--el:${pop.toFixed(2)}s"` : ''}><b>${pl.pts}</b><small>점</small></span><span class="sp-gt${tot >= 9 ? ' warn' : ''}" title="가진 보석 (10개까지)">💰${tot}</span></div><div class="sp-prog" title="15점까지"><i style="width:${Math.min(100, pl.pts / 15 * 100)}%"></i></div></div>
<div class="sp-hold">${cols}</div>
<div class="sp-resrow" data-spres>${res.join('')}</div>
</section>`;
}

function spModal(S, me, sel, P, act) {
  if (!sel) return '';
  const pl = me >= 0 && S.pl[me] ? S.pl[me] : null;
  let art = '', title = '', sub = '', body = '', btns = '';
  const costRows = (who, id) => {
    const nd = need(who, id), c = CARDS[id];
    return `<table class="sp-ct"><tr><th></th>${C5.filter(x => c.c[x]).map(x => `<th>${pip(x, '')}</th>`).join('')}</tr>
<tr><td>필요</td>${C5.filter(x => c.c[x]).map(x => `<td>${c.c[x]}</td>`).join('')}</tr>
<tr><td>할인</td>${C5.filter(x => c.c[x]).map(x => `<td class="dim">−${Math.min(who.bon[x], c.c[x])}</td>`).join('')}</tr>
<tr><td>낼 보석</td>${C5.filter(x => c.c[x]).map(x => `<td><b>${nd.pay[x]}</b>${nd.short[x] ? `<em>+${nd.short[x]}</em>` : ''}</td>`).join('')}</tr></table>
${nd.ok ? (nd.gold ? `<p class="sp-ok">✓ 살 수 있어요 · 모자란 ${nd.gold}개는 황금으로 내요 ${pip('y', nd.gold)}</p>` : `<p class="sp-ok">✓ 살 수 있어요</p>`) : `<p class="sp-no">✗ 보석 ${nd.gold - who.tok.y}개가 더 있어야 해요 <small>(빨간 +숫자가 모자란 보석, 황금 ${who.tok.y}개 포함)</small></p>`}`;
  };
  if (sel.d != null) {
    if (!S.decks[sel.d] || S.decks[sel.d].length !== sel.n) return '';
    art = backHTML(sel.d, S.decks[sel.d].length, 'disabled', 'big');
    title = `${sel.d + 1}단계 덱 · ${S.decks[sel.d].length}장 남음`;
    sub = '맨 위 카드를 몰래 예약할 수 있어요. 무슨 카드인지는 나만 알게 돼요.';
    if (act) btns = U.btn(`📌 몰래 예약하기${S.tok.y ? ' + 황금 1개' : ''}`, 'reserve', {d: sel.d}, 'primary big', pl.res.length >= 3) + (pl.res.length >= 3 ? '<p class="sp-no">예약은 3장까지예요</p>' : '');
  } else if (sel.o != null) {
    const op = S.pl[sel.o], r = op && op.res[sel.k];
    if (!r || (sel.id >= 0 && r.i !== sel.id)) return '';
    if (sel.id < 0) {
      art = backHTML(CARDS[r.i].t, null, 'disabled', 'big');
      title = `${nm(P, sel.o)}님이 몰래 예약한 카드`;
      sub = `${CARDS[r.i].t + 1}단계 덱에서 뒤집힌 채로 가져간 카드라, 무슨 카드인지는 ${nm(P, sel.o)}님만 알아요.`;
    } else {
      const c = CARDS[r.i];
      art = cardHTML(r.i, {cls: 'big'});
      title = `${nm(P, sel.o)}님이 예약한 카드`;
      sub = `${c.t + 1}단계 · ${SN[c.b]} 할인 +1 · ${c.p}점`;
      body = `<div class="sp-whof">${nm(P, sel.o)}님 기준</div>${costRows(op, r.i)}`;
    }
  } else {
    let id;
    if (sel.r != null) { const r = pl && pl.res[sel.r]; if (!r || r.i !== sel.id) return ''; id = r.i; }
    else { id = S.board[sel.t] && S.board[sel.t][sel.i]; if (id == null || id !== sel.id) return ''; }
    const c = CARDS[id];
    art = cardHTML(id, {cls: 'big', need: pl ? need(pl, id).short : null});
    title = `${SN[c.b]} 카드 · ${c.p ? `${c.p}점` : '0점'}`;
    sub = `${c.t + 1}단계 · 사면 앞으로 ${SN[c.b]} 1개씩 계속 할인`;
    if (pl) body = costRows(pl, id);
    if (act) {
      const nd = need(pl, id);
      btns = U.btn('🛒 이 카드 사기', 'buy', sel.r != null ? {r: sel.r} : {t: sel.t, i: sel.i}, 'primary big', !nd.ok);
      if (sel.r == null) btns += U.btn(`📌 예약하기${S.tok.y ? ' + 황금 1개' : ''}`, 'reserve', {t: sel.t, i: sel.i}, 'big', pl.res.length >= 3) + (pl.res.length >= 3 ? '<p class="sp-no">예약은 3장까지예요</p>' : '');
    } else if (pl && !S.winner) btns = `<p class="sp-tip">${me === S.turn ? '보석을 먼저 10개로 맞춰 주세요' : '내 차례가 되면 사거나 예약할 수 있어요'}</p>`;
  }
  return `<div class="sp-mbg" data-ui="sel" data-val="null"></div><div class="sp-modal" role="dialog" aria-label="${U.esc(title)}"><button type="button" class="sp-x" data-ui="sel" data-val="null" aria-label="닫기">✕</button><div class="sp-mart">${art}</div><div class="sp-minfo"><b class="sp-mt">${title}</b><small>${sub}</small>${body}<div class="sp-mbtns">${btns}</div></div></div>`;
}

function spLast(S, P) {
  const L = S.last;
  if (!L) return `<div class="sp-last" data-still><span class="sp-tip">✨ 첫 차례예요. 보석을 모으며 시작해 보세요!</span></div>`;
  const el = fresh(S, 'last' + L.n, 1.2);
  let body = '';
  if (L.k === 'take') body = `보석 ${L.g.map(x => `<span class="sp-mini">${gem(x)}</span>`).join('')} 가져감`;
  else if (L.k === 'buy') body = `${cardHTML(L.id, {cls: 'xs'})} 구매${CARDS[L.id].p ? ` <b class="sp-plus">+${CARDS[L.id].p}점</b>` : ''}`;
  else if (L.k === 'res') body = `${L.id == null ? backHTML(L.tier, null, 'disabled', 'xs') : cardHTML(L.id, {cls: 'xs'})} ${L.id == null ? '몰래 ' : ''}예약${L.gold ? ` <span class="sp-mini">${gem('y')}</span>` : ''}`;
  else if (L.k === 'time') body = '<b class="sp-to">⏰ 시간 초과 · 차례 넘어감</b>';
  else body = '차례를 넘김';
  if (L.ret && L.ret.length) body += ` <small>· ${L.ret.length}개 반납</small>`;
  if (L.nob != null) body += ` <b class="sp-nv">👑 ${NOBN[L.nob]} 방문 +3</b>`;
  return `<div class="sp-last"${anim(el)}><span class="pdot" style="--pc:${U.pc(L.p)}"></span><b>${nm(P, L.p)}</b><span class="sp-lb">${body}</span></div>`;
}

function spEnd(S, P) {
  const el = fresh(S, 'end', 3), o = S.rank || [];
  return `<section class="sp-end"${anim(el)}><div class="sp-end-gems">${C5.concat('y').map(x => `<span>${gem(x)}</span>`).join('')}</div><small>게임 끝</small><b class="sp-end-t">${U.esc(S.winner)}</b>
<ol class="sp-rank">${o.map((i, k) => `<li class="${k === 0 ? 'top' : ''}" style="--d:${k * 0.15 + 0.4}s"><span>${k === 0 ? '👑' : k + 1}</span><b>${nm(P, i)}</b><em>${S.pl[i].pts}점</em><small>카드 ${S.pl[i].cards}장${S.pl[i].nob.length ? ` · 귀족 ${S.pl[i].nob.length}` : ''}</small></li>`).join('')}</ol></section>`;
}

/* ---------- 움직임 (화면에서만) ---------- */
function spFx(S, me, P) {
  const W = window; W.__spfx = W.__spfx || {};
  const L = S.last || {n: 0};
  const cur = {n: L.n || 0, ret: L.ret ? L.ret.length : 0, nob: L.nob != null ? 1 : 0, end: S.winner ? 1 : 0, turn: S.turn, fin: S.final ? 1 : 0};
  const rec = W.__spfx[S._g];
  W.__spfx[S._g] = cur;
  if (!rec) return;
  if (!document.querySelector('.spw')) return;
  const still = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seat = p => document.querySelector(`[data-sps="${p}"]`);
  const bank = x => document.querySelector(`[data-spb="${x}"] .sp-chipw`) || document.querySelector('.sp-bank');
  let t0 = 0;
  if (cur.n !== rec.n) {
    if (L.k === 'take') L.g.forEach((x, j) => fly(chip(x), bank(x), seat(L.p), {w: 46, h: 46, s2: .55, delay: j * 130, lift: -40, done: () => bump(`[data-sps="${L.p}"] .sp-${x} .sp-tc`)}));
    if (L.k === 'buy') {
      const src = L.src === 'b' ? document.querySelector(`[data-spslot="${L.t}-${L.i}"]`) : document.querySelector(`[data-sps="${L.p}"] [data-spres]`) || seat(L.p);
      let j = 0;
      for (const x in (L.pay || {})) for (let k = 0; k < Math.min(L.pay[x], 3); k++) fly(chip(x), seat(L.p), bank(x), {w: 40, h: 40, s1: .7, s2: .9, delay: j++ * 70, lift: -30, dur: 600});
      t0 = Math.min(j * 70, 400) + 100;
      const r = src && src.getBoundingClientRect();
      fly(cardHTML(L.id), src, seat(L.p), {w: r ? r.width : 80, h: r ? r.height : 112, s2: .3, delay: t0, dur: 850, lift: -70, rot: 6, done: () => { bump(`[data-sps="${L.p}"] .sp-${CARDS[L.id].b} .sp-bon`); if (CARDS[L.id].p) floatTxt(`+${CARDS[L.id].p}점`, seat(L.p)); }});
      t0 += 850;
    }
    if (L.k === 'res') {
      const src = L.src === 'b' ? document.querySelector(`[data-spslot="${L.t}-${L.i}"]`) : document.querySelector(`[data-spdeck="${L.tier}"]`);
      const r = src && src.getBoundingClientRect();
      fly(L.id == null ? backSVG(L.tier) : cardHTML(L.id), src, seat(L.p), {w: r ? r.width : 80, h: r ? r.height : 112, s2: .3, dur: 800, lift: -60, rot: -6, cls: 'card'});
      if (L.gold) fly(chip('y'), bank('y'), seat(L.p), {w: 46, h: 46, s2: .55, delay: 250, lift: -40});
      t0 = 800;
    }
  }
  const r0 = cur.n !== rec.n ? 0 : rec.ret;
  if (cur.ret > r0) L.ret.slice(r0).forEach((x, j) => fly(chip(x), seat(L.p), bank(x), {w: 42, h: 42, s1: .7, s2: .9, delay: j * 90, lift: -30, dur: 600}));
  if (cur.nob && (cur.n !== rec.n || !rec.nob)) {
    const d = t0 + 150;
    setTimeout(() => {
      fly(nobleHTML(L.nob), document.querySelector('[data-spnobs]'), seat(L.p), {w: 90, h: 112, s1: 1.4, s2: .35, dur: 1100, lift: -90});
      banner(`👑 ${NOBN[L.nob]}`, `${nm(P, L.p)}님을 찾아왔어요! +3점`, 'nob');
    }, d);
  }
  if (cur.fin && !rec.fin) setTimeout(() => banner('🏁 마지막 바퀴!', '누군가 15점에 닿았어요. 이번 바퀴가 끝나면 게임 끝!', 'fin'), t0 + 300);
  else if (!S.winner && cur.turn !== rec.turn && cur.turn === me && P[me] && !P[me].bot) setTimeout(() => banner('내 차례!', `${nm(P, me)}님, 행동 하나를 고르세요`, 'me'), t0 + (cur.nob ? 1600 : 200));
  if (cur.n !== rec.n && L.k === 'time') banner('⏰ 시간 초과!', `${nm(P, L.p)}님의 차례가 넘어갔어요`, 'fin');
  if (cur.end && !rec.end) { setTimeout(() => gemRain(), t0 + 200); }

  function fly(html, src, dst, o) {
    if (!src || !dst || still) { if (o.done) setTimeout(o.done, o.delay || 0); return; }
    const a = src.getBoundingClientRect(), b = dst.getBoundingClientRect();
    if (!a.width || !b.width) return;
    const el = document.createElement('div');
    el.className = 'sp-fly'; el.innerHTML = html;
    el.style.cssText = `left:${a.left + a.width / 2 - o.w / 2}px;top:${a.top + a.height / 2 - o.h / 2}px;width:${o.w}px;height:${o.h}px;--cw:${o.w}px`;
    document.body.appendChild(el);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + Math.min(b.height / 2, 60) - (a.top + a.height / 2);
    const s1 = o.s1 || 1, s2 = o.s2 || .5;
    const an = el.animate([
      {transform: `translate(0,0) scale(${s1}) rotate(0deg)`, opacity: 0},
      {transform: `translate(0,-6px) scale(${s1 * 1.08}) rotate(0deg)`, opacity: 1, offset: .12},
      {transform: `translate(${dx * .5}px,${dy * .5 + (o.lift || -50)}px) scale(${(s1 + s2) / 2 + .1}) rotate(${o.rot || 0}deg)`, opacity: 1, offset: .55},
      {transform: `translate(${dx}px,${dy}px) scale(${s2}) rotate(0deg)`, opacity: .2}
    ], {duration: o.dur || 700, delay: o.delay || 0, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both'});
    an.onfinish = () => { el.remove(); if (o.done) o.done(); };
  }
  function bump(q) { const e = document.querySelector(q); if (e && e.animate && !still) e.animate([{transform: 'scale(1)'}, {transform: 'scale(1.35)', filter: 'brightness(1.3)'}, {transform: 'scale(1)'}], {duration: 380, easing: 'ease-out'}); }
  function floatTxt(txt, dst) {
    if (!dst || still) return; const b = dst.getBoundingClientRect(), el = document.createElement('div');
    el.className = 'sp-float'; el.textContent = txt; el.style.cssText = `left:${b.right - 70}px;top:${b.top + 6}px`;
    document.body.appendChild(el);
    el.animate([{transform: 'translateY(10px) scale(.6)', opacity: 0}, {transform: 'translateY(-8px) scale(1.25)', opacity: 1, offset: .25}, {transform: 'translateY(-40px) scale(1)', opacity: 0}], {duration: 1400, easing: 'ease-out', fill: 'both'}).onfinish = () => el.remove();
  }
  function banner(big, small, kind) {
    document.querySelectorAll('.sp-banner').forEach(e => e.remove());
    const el = document.createElement('div'); el.className = 'sp-banner ' + kind;
    el.innerHTML = `<b>${U.esc(big)}</b><small>${U.esc(small)}</small>`;
    document.body.appendChild(el);
    if (still) { setTimeout(() => el.remove(), 1600); return; }
    el.animate([{transform: 'translate(-50%,-50%) scale(.6)', opacity: 0}, {transform: 'translate(-50%,-50%) scale(1.06)', opacity: 1, offset: .15}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .75}, {transform: 'translate(-50%,-60%) scale(.96)', opacity: 0}], {duration: kind === 'me' ? 1300 : 2000, easing: 'ease-out', fill: 'both'}).onfinish = () => el.remove();
  }
  function gemRain() {
    if (still) return;
    const xs = C5.concat('y');
    for (let k = 0; k < 42; k++) {
      const el = document.createElement('div'); el.className = 'sp-rain';
      el.innerHTML = gem(xs[k % 6]); const s = 18 + Math.random() * 26;
      el.style.cssText = `left:${Math.random() * 100}vw;width:${s}px;height:${s}px`;
      document.body.appendChild(el);
      el.animate([{transform: `translateY(-60px) rotate(0deg)`, opacity: 1}, {transform: `translateY(${window.innerHeight + 80}px) rotate(${(Math.random() - .5) * 720}deg)`, opacity: .9}],
        {duration: 2200 + Math.random() * 1800, delay: Math.random() * 1400, easing: 'cubic-bezier(.3,.1,.7,1)', fill: 'both'}).onfinish = () => el.remove();
    }
  }
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
