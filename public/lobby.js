/* 대기실을 게임마다 그 보드게임 분위기로 꾸며요 (자체 서버·게임판 공통) */
(function () {
  const R = typeof window !== 'undefined' ? window : globalThis;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const T = {
    avalon: {c1: '#3D5AFE', c2: '#141A4A', c3: '#E9C46A', tag: '원정대를 꾸려 성배를 지켜라', sub: '선의 세력 vs 숨은 악의 세력', art: ['castle', 'knight', 'merlin', 'crown', 'assassin', 'scroll'], seat: 'knight', empty: '빈 원탁 자리', ready: '원정 출발!'},
    kraken: {c1: '#13B5A6', c2: '#062B40', c3: '#F5C542', tag: '보물 상자를 열어라, 단 크라켄은 건드리지 마', sub: '탐험대 vs 해골 해적단', art: ['ship', 'kraken', 'coin', 'anchor', 'skull', 'compass'], seat: 'pirate', empty: '빈 선실', ready: '닻을 올려라!'},
    splendor: {c1: '#A65CFF', c2: '#2A1260', c3: '#FFD54F', tag: '보석을 모아 르네상스 최고의 상인이 되어라', sub: '15점 먼저 달성!', art: ['gem', 'crown', 'sp_city', 'coin', 'pcrown', 'sp_camel'], seat: 'gem', empty: '빈 상점', ready: '거래 시작!'},
    cockroach: {c1: '#7CC242', c2: '#1A4A16', c3: '#FFD54F', tag: '"이건 바퀴벌레야!" 진짜일까, 거짓말일까?', sub: '같은 벌레 4장이면 패배', art: ['rk_roach', 'rk_bat', 'rk_fly', 'rk_toad', 'rk_rat', 'rk_spider'], seat: 'rk_roach', empty: '빈 자리', ready: '벌레 넘기기 시작!'},
    halli: {c1: '#FFB300', c2: '#E0461E', c3: '#FFFFFF', tag: '같은 과일이 딱 5개면 종을 땡!', sub: '눈치와 순발력 대결', art: ['bell', 'strawberry', 'banana', 'lime', 'plum', 'bell'], seat: 'banana', empty: '빈 자리', ready: '종 칠 준비!'},
    dixit: {c1: '#FF5FA2', c2: '#4A1FA0', c3: '#FFF0A8', tag: '그림 한 장에 담긴 이야기를 맞혀라', sub: '너무 쉽지도 어렵지도 않게', art: ['crystal', 'rainbow', 'unicorn', 'balloon', 'fairy', 'kite'], seat: 'palette', empty: '빈 자리', ready: '이야기 시작!'},
    werewords: {c1: '#4B3BC4', c2: '#0B0726', c3: '#FFE38A', tag: '예/아니오로 비밀 단어를 찾아라', sub: '숨은 늑대인간과 예언자', art: ['ww_moon', 'ww_wolf', 'crystal', 'ww_mayor', 'owl', 'star'], seat: 'ww_farmer', empty: '빈 자리', ready: '밤이 찾아와요!'},
  };
  const img = (k, cls = '') => `<img class="fe ${cls}" src="img/${k}.webp" alt="" draggable="false">`;
  function theme(key) { return T[key] || {c1: '#4A5AE8', c2: '#1A2050', c3: '#FFD54F', tag: '', sub: '', art: ['die', 'star', 'gift'], seat: 'pawn', empty: '빈 자리', ready: '시작!'}; }
  function style(key) { const t = theme(key); return `--lb1:${t.c1};--lb2:${t.c2};--lb3:${t.c3}`; }
  function hero(key, name, min, max, n, cap) {
    cap = cap || max; const t = theme(key), need = Math.max(0, min - n), full = n >= cap;
    const pct = Math.min(100, Math.round(n / Math.max(min, 1) * 100));
    return `<section class="lb-hero"><div class="lb-fly" aria-hidden="true">${t.art.map((a, i) => img(a, 'f' + i)).join('')}</div>
<div class="lb-ht"><span class="lb-kick">대기실 · ${min}~${max}명${cap < max ? ` · 이 방은 최대 ${cap}명` : ''}</span><h2>${esc(name)}</h2><p>${esc(t.tag)}</p><small>${esc(t.sub)}</small></div>
<div class="lb-gauge${need ? '' : ' ok'}"><div class="lb-gbar"><i style="width:${pct}%"></i></div><b>${need ? `${n}/${min}명 · ${need}명 더 모이면 시작!` : full ? `${n}명 가득! ${esc(t.ready)}` : `${n}명 모였어요 · ${esc(t.ready)}`}</b></div></section>`;
  }
  // list: [{name, bot, host, me, off, color, extra}]
  function seats(key, list, min, max) {
    const t = theme(key), slots = Math.min(max, Math.max(min, list.length + 1));
    let h = `<section class="lb-seats">`;
    list.forEach((p, i) => {
      const ini = Array.from(String(p.name || '?'))[0] || '?';
      h += `<div class="lb-seat${p.me ? ' me' : ''}${p.host ? ' host' : ''}${p.off ? ' off' : ''}" style="--pc:${p.color};--k:${i}"><span class="lb-av">${p.bot ? img('tux', 'bot') : `<b>${esc(ini)}</b>`}${p.host ? `<i class="lb-crown">${img('crown')}</i>` : ''}</span><span class="lb-nm"><b>${esc(p.name)}</b><small>${p.bot ? '🤖 AI' : p.off ? '⚪ 잠시 나감' : '🟢 접속 중'}${p.host ? ' · 방장' : ''}${p.me ? ' · 나' : ''}</small></span>${p.extra || ''}</div>`;
    });
    for (let i = list.length; i < slots; i++) h += `<div class="lb-seat empty" style="--k:${i}"><span class="lb-av">${img(t.seat)}</span><span class="lb-nm"><b>${esc(t.empty)}</b><small>${i < min ? '친구를 기다려요…' : '더 올 수 있어요'}</small></span></div>`;
    return h + `</section>`;
  }
  // 방장이 정하는 최대 인원 (navKey: 서버는 data-nav, 게임판도 data-nav 사용)
  function cap(c, lo, hi, host) {
    if (!host) return `<div class="lb-cap ro"><span>👥 최대 인원</span><b>${c}명</b></div>`;
    return `<div class="lb-cap"><span>👥 방 인원 제한</span><button type="button" class="lb-cb" data-nav="setcap" data-n="${c - 1}"${c - 1 < lo ? ' disabled' : ''} aria-label="한 명 줄이기">−</button><b>${c}명</b><button type="button" class="lb-cb" data-nav="setcap" data-n="${c + 1}"${c + 1 > hi ? ' disabled' : ''} aria-label="한 명 늘리기">+</button><small>${lo}~${hi}명 사이로 정할 수 있어요</small></div>`;
  }
  R.LOBBY = {theme, style, hero, seats, cap};
})();
