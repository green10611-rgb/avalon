/* 실시간 채팅 창 (게임판·자체 서버판 공용)
   const dock = ChatDock({onSend: text => ...});
   dock.update(messages, myId)   // messages: [{id, n(이름), t(내용), at}]
   dock.show(true/false) */
(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
R.ChatDock = function(opts){
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root = document.createElement('div');
  root.className = 'chatdock'; root.hidden = true;
  root.innerHTML = `<div class="cd-peek" hidden></div>
<section class="cd-panel" hidden><header><b>💬 채팅</b><button type="button" class="cd-x" aria-label="채팅 닫기">✕</button></header>
<div class="cd-list" aria-live="polite"></div>
<form class="cd-form"><input class="cd-in" maxlength="60" placeholder="메시지 입력…" autocomplete="off" enterkeyhint="send"><button type="submit" class="cd-send">보내기</button></form></section>
<button type="button" class="cd-btn" aria-label="채팅 열기">💬<span class="cd-badge" hidden></span></button>`;
  document.body.appendChild(root);
  const $ = s => root.querySelector(s);
  const panel = $('.cd-panel'), list = $('.cd-list'), badge = $('.cd-badge'), peek = $('.cd-peek'), input = $('.cd-in');
  let open = false, msgs = [], me = '', seen = 0, peekT = null, lastKey = '';
  const key = m => m.at + '|' + m.id + '|' + m.t;
  function paint(){
    list.innerHTML = msgs.length ? msgs.map(m => `<div class="cd-m${m.id === me ? ' me' : ''}"><small>${esc(m.n)}</small><span>${esc(m.t)}</span></div>`).join('') : '<div class="cd-empty">아직 메시지가 없어요. 먼저 인사해 보세요!</div>';
    list.scrollTop = list.scrollHeight;
    const unread = open ? 0 : Math.max(0, msgs.length - seen);
    badge.hidden = !unread; badge.textContent = unread > 9 ? '9+' : unread;
  }
  function setOpen(v){ open = v; panel.hidden = !v; root.classList.toggle('open', v); if (v){ seen = msgs.length; peek.hidden = true; setTimeout(() => input.focus(), 30); } paint(); }
  $('.cd-btn').addEventListener('click', () => setOpen(!open));
  $('.cd-x').addEventListener('click', () => setOpen(false));
  peek.addEventListener('click', () => setOpen(true));
  $('.cd-form').addEventListener('submit', e => {
    e.preventDefault(); const t = input.value.trim(); if (!t) return;
    input.value = ''; opts.onSend(t.slice(0, 60)); input.focus();
  });
  return {
    show(v){ root.hidden = !v; if (!v) setOpen(false); },
    update(m, myId){
      me = myId; const prevLast = msgs.length ? key(msgs[msgs.length - 1]) : '';
      msgs = (m || []).slice(-40);
      const last = msgs[msgs.length - 1];
      if (open) seen = msgs.length; else if (seen > msgs.length) seen = msgs.length;
      if (last && key(last) !== prevLast && key(last) !== lastKey && !open && last.id !== me && !root.hidden){
        peek.innerHTML = `<b>${esc(last.n)}</b> ${esc(last.t)}`; peek.hidden = false;
        clearTimeout(peekT); peekT = setTimeout(() => peek.hidden = true, 3500);
      }
      if (last) lastKey = key(last);
      paint();
    },
    markAllSeen(){ seen = msgs.length; paint(); }
  };
};
})();
