/* ===== 아발론: 레지스탕스 · 자체 서버판 클라이언트 ===== */
(function(){
const $app = document.getElementById('app');
const esc = U.esc;
const GAMES = ['avalon', 'kraken', 'splendor', 'cockroach', 'halli', 'dixit'];
const SOLO = (location.pathname.match(/^\/(kraken|avalon|splendor|cockroach|halli|dixit)\/?$/) || [])[1] || '';
let g = G[SOLO] || G.avalon;
if (SOLO) document.title = G[SOLO].name;
document.body.classList.toggle('solo-' + (SOLO || 'all'), true);
const GN = () => g.name;
const ls = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }, del(k){ try { localStorage.removeItem(k); } catch(e){} } };
// 탭(창)마다 다른 사람으로 취급해요. 같은 브라우저에서 링크를 열어도 방장이 되지 않게.
const ss = { get(k){ try { return sessionStorage.getItem(k); } catch(e){ return null; } }, set(k, v){ try { sessionStorage.setItem(k, v); } catch(e){} }, del(k){ try { sessionStorage.removeItem(k); } catch(e){} } };
let pid = ss.get('av_pid'); if (!pid) { pid = Math.random().toString(36).slice(2, 12); ss.set('av_pid', pid); }
let myName = ls.get('av_name') || '';
let code = ss.get('av_room') || '';
let invite = (new URLSearchParams(location.search).get('room') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
let room = null, ui = {}, busy = false, connected = false, lastGid = null, confirmQ = null, ws = null, retry = 0;

function toast(m){ const t = document.getElementById('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 3200); }
const players = () => room ? room.players : [];
const state = () => room ? room.state : null;
const myIdx = () => players().findIndex(p => p.id === pid);

const dock = window.ChatDock ? ChatDock({onSend: text => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({type: 'chat', text})); else toast('연결되지 않았어요.'); }}) : null;
function connect(){
  const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  ws = new WebSocket(url);
  ws.onopen = () => { connected = true; retry = 0; ws.send(JSON.stringify({type: 'hello', pid, code})); render(); };
  ws.onclose = () => { connected = false; busy = false; render(); setTimeout(connect, retry++ === 0 ? 300 : Math.min(1000 * 2 ** (retry - 1), 8000)); };
  ws.onmessage = e => {
    const m = JSON.parse(e.data); if (m.type === 'pong') return; busy = false;
    if (m.type === 'err') { toast(m.msg); return render(); }
    if (m.type === 'closed') { toast('방장이 방을 닫았어요.'); return leaveLocal(); }
    if (m.type === 'kicked') { toast('방에서 나가게 되었어요.'); return leaveLocal(); }
    if (m.type === 'room') {
      if (!m.room) { room = null; if (code) { code = ''; ss.del('av_room'); } if (invite && myName.trim() && !joinRoom.tried) { joinRoom.tried = true; joinRoom(invite); } return render(); }
      room = m.room; g = G[room.game] || G.avalon; code = room.code; ss.set('av_room', code); if (invite) clearInvite();
      if (room.gid !== lastGid) { lastGid = room.gid; ui = {}; }
      render();
    }
  };
}
function sendMsg(m){ if (!ws || ws.readyState !== 1) return toast('서버에 연결하는 중이에요. 잠시 후 다시 눌러 주세요.'); busy = true; ws.send(JSON.stringify(m)); }
function leaveLocal(){ room = null; code = ''; ss.del('av_room'); ui = {}; render(); }
const createRoom = key => { if (!myName.trim()) return toast('이름을 먼저 적어 주세요.'); sendMsg({type: 'create', name: myName, game: key}); };
const joinRoom = c => { c = (c || '').toUpperCase().replace(/[^A-Z]/g, ''); if (c.length !== 4) return toast('방 코드 4글자를 넣어 주세요.'); if (!myName.trim()) return toast('이름을 먼저 적어 주세요.'); sendMsg({type: 'join', code: c, name: myName}); };
const startGame = () => sendMsg({type: 'start'});
const act = (t, a) => { ui = {}; sendMsg({type: 'act', t, a, gid: room && room.gid}); };
const leaveRoom = () => { sendMsg({type: 'leave'}); leaveLocal(); };
const backToLobby = () => sendMsg({type: 'lobby'});
const kick = id => sendMsg({type: 'kick', id});
const inviteURL = c => `${location.origin}${room && room.game && SOLO === room.game ? '/' + room.game : ''}/?room=${c}`.replace(/\/\/\?room/, '/?room');
function qrSVG(text){ try { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({cellSize: 6, margin: 2, scalable: true}); } catch(e){ return ''; } }
function clearInvite(){ invite = ''; try { history.replaceState(null, '', location.pathname); } catch(e){} }

/* ---------- 화면 ---------- */
const conn = () => `<div class="connline ${connected ? 'ok' : 'bad'}"><i></i>${connected ? '실시간 서버 연결됨' : (room ? '연결이 잠깐 끊겼어요. 다시 연결하는 중… (방은 그대로 있어요)' : '서버에 연결하는 중… (서버가 잠들어 있었다면 30초~1분 걸려요)')}</div>`;
function render(){
  if (dock){ dock.show(true); if (room && myIdx() >= 0){ dock.enable(true); dock.update(room.chat || [], pid); } else dock.enable(false, '방에 들어가면 여기서 같이 채팅할 수 있어요 💬'); }
  const y = window.scrollY;
  const keep = {}; document.querySelectorAll('#game [data-field]').forEach(f => { if (f.id) keep[f.id] = f.value; }); const focus = document.activeElement && document.activeElement.id;
  $app.innerHTML = !code ? homeHTML() : !room ? `<div class="empty">방 <b>${esc(code)}</b>에 연결하는 중…</div><button type="button" class="btn ghost" data-nav="leaveLocal">처음으로</button>` : room.status === 'lobby' ? lobbyHTML() : gameHTML();
  document.body.classList.toggle('g-kraken', !!(room && room.status !== 'lobby' && room.game === 'kraken' && state()));
  document.body.classList.toggle('g-dixit', !!(room && room.status !== 'lobby' && room.game === 'dixit' && state()));
  document.body.classList.toggle('g-halli', !!(room && room.status !== 'lobby' && room.game === 'halli' && state()));
  document.body.classList.toggle('g-cockroach', !!(room && room.status !== 'lobby' && room.game === 'cockroach' && state()));
  document.body.classList.toggle('g-splendor', !!(room && room.status !== 'lobby' && room.game === 'splendor' && state()));
  const st = state(), lk = st && st.last && !st.decks ? JSON.stringify(st.last) + (st.quest || 0) : '';
  if (lk && render.lk !== undefined && lk !== render.lk) window.scrollTo(0, 0); else window.scrollTo(0, y);
  render.lk = lk;
  for (const id in keep) { const f = document.getElementById(id); if (f) f.value = keep[id]; }
  if (focus && keep[focus] !== undefined) { const f = document.getElementById(focus); if (f) { f.focus(); try { f.setSelectionRange(f.value.length, f.value.length); } catch (e) {} } }
}
function homeHTML(){
  if (invite) return `<div class="hero"><span class="kicker">초대장이 도착했어요</span><h1>우리끼리 보드게임</h1><p>방 <b>${esc(invite)}</b>에 초대받았어요. 이름만 적고 들어가세요!</p></div>${conn()}
<section class="panel"><div class="nick"><label for="nm">내 이름</label><input id="nm" maxlength="10" placeholder="예: 동규" value="${esc(myName)}" data-name></div></section>
<button type="button" class="btn primary big avjoin" data-nav="joinInvite">${esc(invite)} 방 들어가기</button>
<button type="button" class="btn ghost" data-nav="noInvite">다른 방으로 가기</button>`;
  if (SOLO === 'dixit') { const X = G.dixit; return `<div class="dxhero"><div class="dxh-art">${X.art('card', 2)}${X.art('card', 0)}${X.art('card', 16)}</div><span class="kicker">각자 폰으로 · 실시간 · 3~8명</span><h1>딕싯</h1><p>그림 한 장에 담긴 이야기를 찾아요.<br>너무 쉽지도, 너무 어렵지도 않은 제시어가 승리의 비결! AI와 함께 해도 돼요.</p></div>${conn()}
<section class="panel"><div class="nick"><label for="nm">내 이름</label><input id="nm" maxlength="10" placeholder="예: 동규" value="${esc(myName)}" data-name></div></section>
<button type="button" class="btn big dx-start" data-nav="create" data-key="dixit">🔮 딕싯 방 만들기</button>
<section class="panel"><div class="lbl">방 코드로 참가</div><div class="codeform"><input id="code" class="codein" maxlength="4" placeholder="ABCD" autocomplete="off"><button type="button" class="btn primary" data-nav="join">참가</button></div></section>
<details class="ref"><summary>규칙 보기</summary><ol class="rules">${X.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>${X.rulesExtra()}</details>
<p class="more-games-w"><a class="more-games" href="/">🎲 다른 게임도 보기 <span>→</span></a></p>`; }
  if (SOLO === 'halli') { const H = G.halli; return `<div class="hghero"><div class="hgh-art">${H.art('card', 2)}${H.art('card', 9)}${H.art('back')}</div><span class="kicker">각자 폰으로 · 실시간 · 2~6명</span><h1>할리갈리</h1><p>같은 과일이 딱 5개! 먼저 종을 치는 사람이 카드를 다 가져가요.<br>AI와 함께 해도 돼요. 스페이스바로도 종을 칠 수 있어요.</p></div>${conn()}
<section class="panel"><div class="nick"><label for="nm">내 이름</label><input id="nm" maxlength="10" placeholder="예: 동규" value="${esc(myName)}" data-name></div></section>
<button type="button" class="btn big hg-start" data-nav="create" data-key="halli">🔔 할리갈리 방 만들기</button>
<section class="panel"><div class="lbl">방 코드로 참가</div><div class="codeform"><input id="code" class="codein" maxlength="4" placeholder="ABCD" autocomplete="off"><button type="button" class="btn primary" data-nav="join">참가</button></div></section>
<details class="ref"><summary>규칙 보기</summary><ol class="rules">${H.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>${H.rulesExtra()}</details>
<p class="more-games-w"><a class="more-games" href="/">🎲 다른 게임도 보기 <span>→</span></a></p>`; }
  if (SOLO === 'cockroach') { const C = G.cockroach; return `<div class="rkhero"><div class="rkh-art">${C.art('card', 1)}${C.art('card', 0)}${C.art('back')}</div><span class="kicker">각자 폰으로 · 실시간 · 2~6명</span><h1>바퀴벌레 포커</h1><p>"이건 바퀴벌레야!" 진짜일까, 거짓말일까?<br>같은 벌레 4장을 떠안으면 패배! AI와 함께 해도 돼요.</p></div>${conn()}
<section class="panel"><div class="nick"><label for="nm">내 이름</label><input id="nm" maxlength="10" placeholder="예: 동규" value="${esc(myName)}" data-name></div></section>
<button type="button" class="btn big rk-start" data-nav="create" data-key="cockroach">🪳 바퀴벌레 포커 방 만들기</button>
<section class="panel"><div class="lbl">방 코드로 참가</div><div class="codeform"><input id="code" class="codein" maxlength="4" placeholder="ABCD" autocomplete="off"><button type="button" class="btn primary" data-nav="join">참가</button></div></section>
<details class="ref"><summary>규칙 보기</summary><ol class="rules">${C.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>${C.rulesExtra()}</details>
<p class="more-games-w"><a class="more-games" href="/">🎲 다른 게임도 보기 <span>→</span></a></p>`; }
  if (SOLO === 'splendor') { const S = G.splendor; return `<div class="sphero"><div class="sph-art">${S.art('card', 20)}${S.art('card', 85)}${S.art('card', 61)}</div><div class="sph-chips">${['w','u','g','r','k','y'].map(x => `<span>${S.art('chip', x)}</span>`).join('')}</div><span class="kicker">각자 폰으로 · 실시간 · 2~4명</span><h1>스플렌더</h1><p>보석을 모아 광산·상선·궁전 카드를 사고, 귀족을 맞이해 먼저 15점을 노려요.<br>사람이 모자라면 AI와 함께 해도 돼요.</p></div>${conn()}
<section class="panel"><div class="nick"><label for="nm">내 이름</label><input id="nm" maxlength="10" placeholder="예: 동규" value="${esc(myName)}" data-name></div></section>
<button type="button" class="btn big sp-go" data-nav="create" data-key="splendor">💎 스플렌더 방 만들기</button>
<section class="panel"><div class="lbl">방 코드로 참가</div><div class="codeform"><input id="code" class="codein" maxlength="4" placeholder="ABCD" autocomplete="off"><button type="button" class="btn primary" data-nav="join">참가</button></div></section>
<details class="ref"><summary>규칙 보기</summary><ol class="rules">${S.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>${S.rulesExtra()}</details>
<p class="more-games-w"><a class="more-games" href="/">🎲 다른 게임도 보기 <span>→</span></a></p>`; }
  if (SOLO === 'kraken') return `<div class="khero"><div class="kh-art">${G.kraken.art('K')}${G.kraken.art('T')}${G.kraken.art('back')}</div><span class="kicker">각자 폰으로 · 실시간 · 4~8명</span><h1>노 터치 크라켄</h1><p>보물 상자를 열어라! 단, 크라켄은 절대 건드리지 마.<br>탐험대와 해골 해적단의 정체 숨김 게임이에요.</p></div>${conn()}
<section class="panel"><div class="nick"><label for="nm">내 이름</label><input id="nm" maxlength="10" placeholder="예: 동규" value="${esc(myName)}" data-name></div></section>
<button type="button" class="btn big kh-go" data-nav="create" data-key="kraken">🐙 크라켄 방 만들기</button>
<section class="panel"><div class="lbl">방 코드로 참가</div><div class="codeform"><input id="code" class="codein" maxlength="4" placeholder="ABCD" autocomplete="off"><button type="button" class="btn primary" data-nav="join">참가</button></div></section>
<details class="ref"><summary>규칙 보기</summary><ol class="rules">${G.kraken.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>${G.kraken.rulesExtra()}</details>
<p class="more-games-w"><a class="more-games" href="/">🎲 다른 게임도 보기 <span>→</span></a></p>`;
  if (SOLO === 'avalon') return `<div class="hero"><span class="kicker">각자 폰으로 · 실시간 · 4~10명</span><h1>아발론: 레지스탕스</h1><p>원정대를 꾸리고 숨은 배신자를 찾아요. 방을 만들고 대기실의 QR이나 링크를 친구들에게 보내세요.</p></div>${conn()}
<section class="panel"><div class="nick"><label for="nm">내 이름</label><input id="nm" maxlength="10" placeholder="예: 동규" value="${esc(myName)}" data-name></div></section>
<button type="button" class="btn primary big" data-nav="create" data-key="avalon">⚔ 아발론 방 만들기</button>
<section class="panel"><div class="lbl">방 코드로 참가</div><div class="codeform"><input id="code" class="codein" maxlength="4" placeholder="ABCD" autocomplete="off"><button type="button" class="btn primary" data-nav="join">참가</button></div></section>
<p class="more-games-w"><a class="more-games" href="/">🎲 다른 게임도 보기 <span>→</span></a></p>`;
  return `<div class="hero"><span class="kicker">각자 폰으로 · 실시간</span><h1>우리끼리 보드게임</h1><p>게임을 골라 방을 만들고, 대기실의 QR이나 링크를 친구들에게 보내세요. 로그인 필요 없어요.</p></div>${conn()}
<section class="panel"><div class="nick"><label for="nm">내 이름</label><input id="nm" maxlength="10" placeholder="예: 동규" value="${esc(myName)}" data-name></div></section>
<section class="stack"><h2>방 만들기</h2><div class="gpick">${GAMES.map(k => { const x = G[k]; return `<button type="button" class="gp gp-${k}" data-nav="create" data-key="${k}"><span class="gp-ic">${esc(x.mark)}</span><b>${esc(x.name)}</b><small>${esc(x.tag)}</small><em>${x.min}~${x.max}명</em></button>`; }).join('')}</div><p class="small muted">게임별 전용 주소: ${GAMES.map(k => `<a href="/${k}">${esc(location.host)}/${k}</a>`).join(' · ')}</p></section>
<section class="panel"><div class="lbl">방 코드로 참가</div><div class="codeform"><input id="code" class="codein" maxlength="4" placeholder="ABCD" autocomplete="off"><button type="button" class="btn primary" data-nav="join">참가</button></div></section>`;
}
function lobbyHTML(){
  const P = players(), host = room.host === pid, n = P.length, ok = n >= g.min && n <= g.max;
  let h = `<div class="bar"><button type="button" class="btn ghost" data-nav="leave">${host ? '방 닫기' : '나가기'}</button><div class="t"><b>대기실</b><small>${esc(GN())} · ${g.min}~${g.max}명</small></div></div>${conn()}`;
  const link = inviteURL(code);
  h += `<section class="invite"><div class="inv-qr">${qrSVG(link)}</div><div class="inv-r"><span class="small">방 코드</span><b class="inv-code">${esc(code)}</b><p>폰 카메라로 QR을 찍거나 링크를 열면 바로 들어와요.</p><div class="inv-link">${esc(link.replace(/^https?:\/\//, ''))}</div><div class="row"><button type="button" class="btn primary" data-nav="copyLink">🔗 링크 복사</button>${navigator.share ? '<button type="button" class="btn" data-nav="shareLink">📤 공유하기</button>' : ''}</div></div></section>`;
  h += `<section class="panel"><div class="lbl">참가자 ${n}명</div><div class="plist">${P.map((p, i) => `<div class="seat" style="--pc:${U.pc(i)}"><span>${p.bot ? '' : room.online && room.online[i] === false ? '⚪ ' : '🟢 '}${esc(p.name)}${p.bot ? ' <small class="bot-tag">AI</small>' : ''}${p.id === room.host ? ' · 방장' : ''}${p.id === pid ? ' (나)' : ''}</span>${host && p.id !== pid ? `<button type="button" class="btn tiny ghost" data-nav="kick" data-id="${esc(p.id)}">내보내기</button>` : ''}</div>`).join('')}</div></section>`;
  if (host) h += `<div class="row"><button type="button" class="btn" data-nav="addbot"${n >= g.max ? ' disabled' : ''}>🤖 AI 참가자 추가</button><span class="small muted">사람이 모자랄 때 AI가 같이 해요</span></div>`;
  h += host ? `<button type="button" class="btn primary big" data-nav="start"${ok && !busy ? '' : ' disabled'}>${ok ? `${n}명으로 시작하기` : `${g.min}명 이상 모이면 시작할 수 있어요`}</button>` : `<div class="hint">방장이 시작하기를 기다리는 중이에요.</div>`;
  h += `<details class="ref"><summary>규칙 보기</summary><ol class="rules">${g.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>${g.rulesExtra ? g.rulesExtra() : ''}</details>`;
  if (host && !SOLO) h += `<section class="swgame"><div class="small muted">다른 게임으로 바꾸기</div><div class="row">${GAMES.map(k => `<button type="button" class="btn${k === room.game ? ' primary' : ''}" data-nav="setgame" data-key="${k}">${esc(G[k].mark)} ${esc(G[k].name)}</button>`).join('')}</div></section>`;
  return h;
}
function gameHTML(){
  const P = players(), S = state(), me = myIdx(), host = room.host === pid;
  if (!S) return `<div class="empty">게임을 불러오는 중…</div>`;
  let h = `<div class="bar"><div class="t"><b>${esc(GN())}</b><small>방 ${esc(code)} · ${P.length}명${me >= 0 ? ` · 나: ${esc(P[me].name)}` : ' · 관전'}</small></div></div>${conn()}`;
  if (S.winner){
    h += `<div class="winbar"><span class="small">게임 끝</span>${host ? `<div class="row"><button type="button" class="btn" data-nav="again">같은 사람들로 다시 하기</button><button type="button" class="btn" data-nav="lobby">대기실로</button></div>` : '<span class="small">방장이 다음 게임을 시작할 수 있어요.</span>'}</div>`;
    h += `<div id="game">${g.view(S, -1, {}, P)}</div>`;
  } else {
    const t = g.turns(S, P), mine = t.includes(me);
    const at = g.allTurn ? g.allTurn(S) : '';
    h += at ? `<div class="turnbar me">${at}</div>` : mine ? `<div class="turnbar me">내 차례예요!</div>` : `<div class="turnbar">${t.length === 1 ? `${U.chip(P, t[0])} 차례` : `${t.length}명 기다리는 중`}</div>`;
    h += `<div id="game"${busy ? ' class="busy"' : ''}>${g.view(S, me, ui, P)}</div>`;
  }
  if (S.log && S.log.length) h += `<div class="log">${S.log.slice().reverse().map(l => `<div>${esc(l)}</div>`).join('')}</div>`;
  h += `<details class="ref"><summary>규칙 보기</summary><ol class="rules">${g.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>${g.rulesExtra ? g.rulesExtra() : ''}</details>`;
  if (host && !S.winner) h += confirmQ === 'end' ? `<div class="panel"><div>지금 게임을 끝내고 대기실로 갈까요?</div><div class="row"><button type="button" class="btn danger" data-nav="lobby">끝내기</button><button type="button" class="btn ghost" data-nav="cancel">취소</button></div></div>` : `<div class="row"><button type="button" class="btn ghost" data-nav="askEnd">게임 끝내기(방장)</button></div>`;
  return h;
}

/* ---------- 입력 ---------- */
document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.name !== undefined) { myName = e.target.value; ls.set('av_name', myName); } });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'code') joinRoom(e.target.value); });
document.addEventListener('click', e => {
  const el = e.target.closest('[data-nav],[data-act],[data-g],[data-ui]'); if (!el) return;
  const d = el.dataset;
  if (d.nav){
    const n = d.nav; confirmQ = null;
    if (n === 'create') return createRoom(d.key);
    if (n === 'setgame') return sendMsg({type: 'setgame', game: d.key});
    if (n === 'joinInvite') return joinRoom(invite);
    if (n === 'noInvite'){ clearInvite(); return render(); }
    if (n === 'copyLink'){ const l = inviteURL(code); (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(() => toast('링크를 복사했어요. 단톡방에 붙여 넣으세요!'), () => toast(l)); return; }
    if (n === 'shareLink'){ navigator.share({title: GN(), text: `${GN()} ${code} 방으로 와!`, url: inviteURL(code)}).catch(() => {}); return; }
    if (n === 'join') return joinRoom(document.getElementById('code').value);
    if (n === 'leave') return leaveRoom();
    if (n === 'leaveLocal') return leaveLocal();
    if (n === 'start' || n === 'again') return startGame();
    if (n === 'lobby') return backToLobby();
    if (n === 'kick') return kick(d.id);
    if (n === 'addbot') return sendMsg({type: 'addbot'});
    if (n === 'askEnd'){ confirmQ = 'end'; return render(); }
    if (n === 'cancel') return render();
    return;
  }
  const S = state(); if (!S) return;
  if (d.ui !== undefined){
    if (el.tagName === 'SUMMARY') e.preventDefault();
    const v = JSON.parse(d.val); ui[d.ui] = (d.tog !== undefined && JSON.stringify(ui[d.ui]) === JSON.stringify(v)) ? null : v; return render();
  }
  if (d.g){ g.uiAct(ui, S, myIdx(), d.g, d.val ? JSON.parse(d.val) : null, players()); return render(); }
  if (d.act){ if (busy) return; let arg = d.arg ? JSON.parse(d.arg) : {}; if (d.fields !== undefined) { if (typeof arg !== 'object' || !arg) arg = {}; document.querySelectorAll('#game [data-field]').forEach(f => arg[f.dataset.field] = f.value); } act(d.act, arg); }
});


connect(); render();
// 가만히 있어도 연결이 끊기지 않게 10초마다 신호 보내기
setInterval(() => { try { if (ws && ws.readyState === 1) ws.send('{"type":"ping"}'); } catch(e){} }, 10000);
// 폰 화면을 다시 켰을 때 바로 재연결
document.addEventListener('visibilitychange', () => { if (!document.hidden && (!ws || ws.readyState > 1)) { retry = 0; connect(); } });
})();
