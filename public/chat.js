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
  root.className = 'chatdock'; root.hidden = false; document.body.classList.add('has-chat'); root.setAttribute('aria-label', '채팅');
  root.innerHTML = `<header><b>💬 채팅</b><small class="cd-cnt"></small></header>
<div class="cd-list" aria-live="polite"></div>
<form class="cd-form"><input class="cd-in" maxlength="60" placeholder="메시지 입력…" autocomplete="off" enterkeyhint="send"><button type="submit" class="cd-send">보내기</button></form>`;
  document.body.appendChild(root);
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
  return {
    show(v){ root.hidden = !v; document.body.classList.toggle('has-chat', !!v); },
    enable(v, msg){
      if (enabled === !!v && offMsg === (msg || '')) return;
      enabled = !!v; offMsg = msg || '';
      input.disabled = !enabled; root.querySelector('.cd-send').disabled = !enabled;
      input.placeholder = enabled ? '메시지 입력…' : (offMsg || '방에 들어가면 채팅할 수 있어요');
      if (!enabled){ msgs = []; lastSig = '';  list.innerHTML = `<div class="cd-empty">${esc(offMsg || '방에 들어가면 여기서 같이 채팅할 수 있어요 💬')}</div>`; cnt.textContent = ''; }
    },
    update(m, myId){ me = myId; msgs = (m || []).slice(-40); paint(); }
  };
};
})();
