/* 실시간 채팅 창 (게임판·자체 서버판 공용) — 항상 열려 있는 채팅
   넓은 화면: 오른쪽에 고정된 채팅 칸 / 폰: 화면 아래에 고정된 채팅 칸
   const dock = ChatDock({onSend: text => ...});
   dock.update(messages, myId)   // messages: [{id, n(이름), t(내용), at}]
   dock.show(true/false) */
(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
R.ChatDock = function(opts){
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root = document.createElement('section');
  root.className = 'chatdock'; root.setAttribute('aria-label', '채팅');
  root.innerHTML = `<header><b>💬 채팅</b><small class="cd-cnt"></small><button type="button" class="cd-x" aria-label="채팅 닫기">✕ 닫기</button></header>
<div class="cd-list" aria-live="polite"></div>
<form class="cd-form"><input class="cd-in" maxlength="60" placeholder="메시지 입력…" autocomplete="off" enterkeyhint="send"><button type="submit" class="cd-send">보내기</button></form>`;
  document.body.appendChild(root);
  const opener = document.createElement('button');
  opener.type = 'button'; opener.className = 'cd-open'; opener.hidden = true;
  opener.innerHTML = '💬 채팅<span class="cd-badge" hidden></span>';
  document.body.appendChild(opener);
  const badge = opener.querySelector('.cd-badge');
  let closed = false; try { closed = localStorage.getItem('chat_closed') === '1'; } catch(e){}
  let shown = true, seenCount = 0;
  function layout(){
    root.hidden = !shown || closed; opener.hidden = !shown || !closed;
    document.body.classList.toggle('has-chat', shown && !closed);
  }
  function setClosed(v){ closed = v; try { localStorage.setItem('chat_closed', v ? '1' : '0'); } catch(e){} if (!v){ seenCount = msgs.length; badge.hidden = true; setTimeout(() => input.focus(), 30); } layout(); }
  root.querySelector('.cd-x').addEventListener('click', () => setClosed(true));
  opener.addEventListener('click', () => setClosed(false));
  const list = root.querySelector('.cd-list'), input = root.querySelector('.cd-in'), cnt = root.querySelector('.cd-cnt');
  let msgs = [], me = '', lastSig = '';
  const time = at => { try { const d = new Date(at); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; } catch(e){ return ''; } };
  function paint(){
    const sig = msgs.map(m => m.at + m.id).join(',') + me;
    if (sig === lastSig) return; lastSig = sig;
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    list.innerHTML = msgs.length ? msgs.map(m => `<div class="cd-m${m.id === me ? ' me' : ''}"><small><b>${esc(m.n)}</b>${m.id === me ? ' (나)' : ''} · ${time(m.at)}</small><span>${esc(m.t)}</span></div>`).join('') : '<div class="cd-empty">아직 메시지가 없어요. 먼저 인사해 보세요!</div>';
    if (nearBottom || (msgs.length && msgs[msgs.length - 1].id === me)) list.scrollTop = list.scrollHeight;
    cnt.textContent = msgs.length ? `${msgs.length}개` : '';
  }
  root.querySelector('.cd-form').addEventListener('submit', e => {
    e.preventDefault(); const t = input.value.trim(); if (!t) return;
    input.value = ''; opts.onSend(t.slice(0, 60)); input.focus();
  });
  let enabled = true, offMsg = '';
  layout();
  return {
    show(v){ shown = !!v; layout(); },
    enable(v, msg){
      if (enabled === !!v && offMsg === (msg || '')) return;
      enabled = !!v; offMsg = msg || '';
      input.disabled = !enabled; root.querySelector('.cd-send').disabled = !enabled;
      input.placeholder = enabled ? '메시지 입력…' : (offMsg || '방에 들어가면 채팅할 수 있어요');
      if (!enabled){ msgs = []; lastSig = '';  list.innerHTML = `<div class="cd-empty">${esc(offMsg || '방에 들어가면 여기서 같이 채팅할 수 있어요 💬')}</div>`; cnt.textContent = ''; }
    },
    update(m, myId){
      me = myId; msgs = (m || []).slice(-40); paint();
      if (!closed) seenCount = msgs.length; else if (seenCount > msgs.length) seenCount = msgs.length;
      const unread = closed ? msgs.slice(seenCount).filter(x => x.id !== me).length : 0;
      badge.hidden = !unread; badge.textContent = unread > 9 ? '9+' : unread;
    }
  };
};
})();
