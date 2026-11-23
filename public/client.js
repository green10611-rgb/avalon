/* ===== 원탁의 기사단 · 자체 서버판 클라이언트 ===== */
(function(){
const $app = document.getElementById('app');
const esc = U.esc, g = G.avalon;
const ls = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }, del(k){ try { localStorage.removeItem(k); } catch(e){} } };
let pid = ls.get('av_pid'); if (!pid) { pid = Math.random().toString(36).slice(2, 12); ls.set('av_pid', pid); }
let myName = ls.get('av_name') || '';
let code = ls.get('av_room') || '';
let invite = (new URLSearchParams(location.search).get('room') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
let room = null, ui = {}, busy = false, connected = false, lastGid = null, confirmQ = null, ws = null, retry = 0;

function toast(m){ const t = document.getElementById('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 3200); }
const players = () => room ? room.players : [];
const state = () => room ? room.state : null;
const myIdx = () => players().findIndex(p => p.id === pid);

function connect(){
  const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  ws = new WebSocket(url);
  ws.onopen = () => { connected = true; retry = 0; ws.send(JSON.stringify({type: 'hello', pid, code})); render(); };
  ws.onclose = () => { connected = false; render(); setTimeout(connect, Math.min(1000 * 2 ** retry++, 8000)); };
  ws.onmessage = e => {
    const m = JSON.parse(e.data); busy = false;
    if (m.type === 'err') { toast(m.msg); return render(); }
    if (m.type === 'closed') { toast('방장이 방을 닫았어요.'); return leaveLocal(); }
    if (m.type === 'kicked') { toast('방에서 나가게 되었어요.'); return leaveLocal(); }
    if (m.type === 'room') {
      if (!m.room) { room = null; if (code) { code = ''; ls.del('av_room'); } if (invite && myName.trim() && !joinRoom.tried) { joinRoom.tried = true; joinRoom(invite); } return render(); }
      room = m.room; code = room.code; ls.set('av_room', code); if (invite) clearInvite();
      if (room.gid !== lastGid) { lastGid = room.gid; ui = {}; }
      render();
    }
  };
}
function sendMsg(m){ if (!ws || ws.readyState !== 1) return toast('서버에 연결하는 중이에요. 잠시 후 다시 눌러 주세요.'); busy = true; ws.send(JSON.stringify(m)); }
function leaveLocal(){ room = null; code = ''; ls.del('av_room'); ui = {}; render(); }
const createRoom = () => { if (!myName.trim()) return toast('이름을 먼저 적어 주세요.'); sendMsg({type: 'create', name: myName}); };
const joinRoom = c => { c = (c || '').toUpperCase().replace(/[^A-Z]/g, ''); if (c.length !== 4) return toast('방 코드 4글자를 넣어 주세요.'); if (!myName.trim()) return toast('이름을 먼저 적어 주세요.'); sendMsg({type: 'join', code: c, name: myName}); };
const startGame = () => sendMsg({type: 'start'});
const act = (t, a) => { ui = {}; sendMsg({type: 'act', t, a, gid: room && room.gid}); };
const leaveRoom = () => { sendMsg({type: 'leave'}); leaveLocal(); };
const backToLobby = () => sendMsg({type: 'lobby'});
const kick = id => sendMsg({type: 'kick', id});
const inviteURL = c => `${location.origin}/?room=${c}`;
function qrSVG(text){ try { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({cellSize: 6, margin: 2, scalable: true}); } catch(e){ return ''; } }
function clearInvite(){ invite = ''; try { history.replaceState(null, '', location.pathname); } catch(e){} }

/* ---------- 화면 ---------- */
const conn = () => `<div class="connline ${connected ? 'ok' : 'bad'}"><i></i>${connected ? '실시간 서버 연결됨' : '서버에 연결하는 중… (서버가 잠들어 있었다면 30초~1분 걸려요)'}</div>`;
function render(){
  const y = window.scrollY;
  $app.innerHTML = !code ? homeHTML() : !room ? `<div class="empty">방 <b>${esc(code)}</b>에 연결하는 중…</div><button type="button" class="btn ghost" data-nav="leaveLocal">처음으로</button>` : room.status === 'lobby' ? lobbyHTML() : gameHTML();
  const st = state(), lk = st && st.last ? JSON.stringify(st.last) + (st.quest || 0) : '';
  if (lk && render.lk !== undefined && lk !== render.lk) window.scrollTo(0, 0); else window.scrollTo(0, y);
  render.lk = lk;
}
function homeHTML(){
  if (invite) return `<div class="hero"><span class="kicker">초대장이 도착했어요</span><h1>원탁의 기사단</h1><p>방 <b>${esc(invite)}</b>에 초대받았어요. 이름만 적고 들어가세요!</p></div>${conn()}
<section class="panel"><div class="nick"><label for="nm">내 이름</label><input id="nm" maxlength="10" placeholder="예: 동규" value="${esc(myName)}" data-name></div></section>
<button type="button" class="btn primary big avjoin" data-nav="joinInvite">${esc(invite)} 방 들어가기</button>
<button type="button" class="btn ghost" data-nav="noInvite">다른 방으로 가기</button>`;
  return `<div class="hero"><span class="kicker">각자 폰으로 · 실시간</span><h1>원탁의 기사단</h1><p>아발론 규칙으로 하는 정체 숨김 게임. 방을 만들고 코드를 친구들에게 알려 주세요. 로그인 필요 없어요.</p></div>${conn()}
<section class="panel"><div class="nick"><label for="nm">내 이름</label><input id="nm" maxlength="10" placeholder="예: 동규" value="${esc(myName)}" data-name></div></section>
<section class="panel"><button type="button" class="btn primary big" data-nav="create">방 만들기</button></section>
<section class="panel"><div class="lbl">방 코드로 참가</div><div class="codeform"><input id="code" class="codein" maxlength="4" placeholder="ABCD" autocomplete="off"><button type="button" class="btn primary" data-nav="join">참가</button></div></section>`;
}
function lobbyHTML(){
  const P = players(), host = room.host === pid, n = P.length, ok = n >= g.min && n <= g.max;
  let h = `<div class="bar"><button type="button" class="btn ghost" data-nav="leave">${host ? '방 닫기' : '나가기'}</button><div class="t"><b>대기실</b><small>원탁의 기사단 · ${g.min}~${g.max}명</small></div></div>${conn()}`;
  const link = inviteURL(code);
  h += `<section class="invite"><div class="inv-qr">${qrSVG(link)}</div><div class="inv-r"><span class="small">방 코드</span><b class="inv-code">${esc(code)}</b><p>폰 카메라로 QR을 찍거나 링크를 열면 바로 들어와요.</p><div class="inv-link">${esc(link.replace(/^https?:\/\//, ''))}</div><div class="row"><button type="button" class="btn primary" data-nav="copyLink">🔗 링크 복사</button>${navigator.share ? '<button type="button" class="btn" data-nav="shareLink">📤 공유하기</button>' : ''}</div></div></section>`;
  h += `<section class="panel"><div class="lbl">참가자 ${n}명</div><div class="plist">${P.map((p, i) => `<div class="seat" style="--pc:${U.pc(i)}"><span>${p.bot ? '' : room.online && room.online[i] === false ? '⚪ ' : '🟢 '}${esc(p.name)}${p.bot ? ' <small class="bot-tag">AI</small>' : ''}${p.id === room.host ? ' · 방장' : ''}${p.id === pid ? ' (나)' : ''}</span>${host && p.id !== pid ? `<button type="button" class="btn tiny ghost" data-nav="kick" data-id="${esc(p.id)}">내보내기</button>` : ''}</div>`).join('')}</div></section>`;
  if (host) h += `<div class="row"><button type="button" class="btn" data-nav="addbot"${n >= g.max ? ' disabled' : ''}>🤖 AI 참가자 추가</button><span class="small muted">사람이 모자랄 때 AI가 같이 해요</span></div>`;
  h += host ? `<button type="button" class="btn primary big" data-nav="start"${ok && !busy ? '' : ' disabled'}>${ok ? `${n}명으로 시작하기` : `${g.min}명 이상 모이면 시작할 수 있어요`}</button>` : `<div class="hint">방장이 시작하기를 기다리는 중이에요.</div>`;
  h += `<details class="ref"><summary>규칙 보기</summary><ol class="rules">${g.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>${g.rulesExtra ? g.rulesExtra() : ''}</details>`;
  return h;
}
function gameHTML(){
  const P = players(), S = state(), me = myIdx(), host = room.host === pid;
  if (!S) return `<div class="empty">게임을 불러오는 중…</div>`;
  let h = `<div class="bar"><div class="t"><b>원탁의 기사단</b><small>방 ${esc(code)} · ${P.length}명${me >= 0 ? ` · 나: ${esc(P[me].name)}` : ' · 관전'}</small></div></div>${conn()}`;
  if (S.winner){
    h += `<div class="winbar"><span class="small">게임 끝</span>${host ? `<div class="row"><button type="button" class="btn" data-nav="again">같은 사람들로 다시 하기</button><button type="button" class="btn" data-nav="lobby">대기실로</button></div>` : '<span class="small">방장이 다음 게임을 시작할 수 있어요.</span>'}</div>`;
    h += `<div id="game">${g.view(S, -1, {}, P)}</div>`;
  } else {
    const t = g.turns(S, P), mine = t.includes(me);
    h += S.phase === 'cfg' ? `<div class="turnbar me">역할 구성 고르기</div>` : S.phase === 'vote' ? `<div class="turnbar me">모두 함께 투표</div>` : S.phase === 'qdone' ? `<div class="turnbar me">원정 3번 성공!</div>` : S.phase === 'kill' ? `<div class="turnbar me">🗡 암살의 시간</div>` : S.phase === 'reveal' ? `<div class="turnbar me">모두 함께 결과 보기</div>` : mine ? `<div class="turnbar me">내 차례예요!</div>` : `<div class="turnbar">${t.length === 1 ? `${U.chip(P, t[0])} 차례` : `${t.length}명 기다리는 중`}</div>`;
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
    if (n === 'create') return createRoom();
    if (n === 'joinInvite') return joinRoom(invite);
    if (n === 'noInvite'){ clearInvite(); return render(); }
    if (n === 'copyLink'){ const l = inviteURL(code); (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(() => toast('링크를 복사했어요. 단톡방에 붙여 넣으세요!'), () => toast(l)); return; }
    if (n === 'shareLink'){ navigator.share({title: '원탁의 기사단', text: `원탁의 기사단 ${code} 방으로 와!`, url: inviteURL(code)}).catch(() => {}); return; }
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
  if (d.act){ if (busy) return; act(d.act, d.arg ? JSON.parse(d.arg) : {}); }
});


connect(); render();
})();
