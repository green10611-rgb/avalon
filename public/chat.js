/* 실시간 채팅 창 (게임판·자체 서버판 공용) — 항상 열려 있는 채팅
   넓은 화면: 오른쪽에 고정된 채팅 칸 / 폰: 화면 아래에 고정된 채팅 칸
   const dock = ChatDock({onSend: text => ...});
   dock.update(messages, myId)   // messages: [{id, n(이름), t(내용), at}]
   dock.show(true/false) */
(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const EMO = ['😂', '🤣', '😆', '😊', '😍', '🥰', '😘', '😎', '🤩', '🤔', '🧐', '🤨', '😏', '🙄', '😬', '😳', '😱', '😨', '😭', '🥺', '😢', '😤', '😡', '🤬', '🥳', '😴', '🤯', '🤪', '😵', '🤮', '🫠', '🙃', '😇', '😈', '👻', '💀', '🤡', '💩', '👍', '👎', '👏', '🙌', '🙏', '💪', '✌️', '🤞', '👌', '🫡', '🔥', '❤️', '💔', '💯', '🎉', '✨', '⭐', '💤', '👀', '🤫', '🍀', '🎯', '🏆', '⚔️', '🐺', '🐙', '💎', '🪳', '🔔', '🔮', '⚫', '⚪'];
const isEmo = t => { const s = String(t || '').replace(/\s/g, ''); return !!s && s.length <= 12 && /\p{Extended_Pictographic}/u.test(s) && !/[\p{L}\p{N}]/u.test(s.replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '')); };
R.ChatDock = function(opts){
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root = document.createElement('section');
  root.className = 'chatdock'; root.setAttribute('aria-label', '채팅');
  root.innerHTML = `<header><b>💬 채팅</b><small class="cd-cnt"></small><button type="button" class="cd-x" aria-label="채팅 닫기">✕ 닫기</button></header>
<div class="cd-list" aria-live="polite"></div>
<div class="cd-emo" hidden>${EMO.map(e => `<button type="button" class="cd-e" data-e="${e}">${e}</button>`).join('')}</div>
<form class="cd-form"><button type="button" class="cd-eb" aria-label="이모티콘">😊</button><input class="cd-in" maxlength="60" placeholder="메시지 입력…" autocomplete="off" enterkeyhint="send"><button type="submit" class="cd-send">보내기</button></form>`;
  document.body.appendChild(root);
  const opener = document.createElement('button');
  opener.type = 'button'; opener.className = 'cd-open'; opener.hidden = true;
  opener.innerHTML = '💬 채팅<span class="cd-badge" hidden></span>';
  document.body.appendChild(opener);
  const badge = opener.querySelector('.cd-badge');
  let enabled = true, offMsg = '';
  let closed = false; try { closed = localStorage.getItem('chat_closed') === '1'; } catch(e){}
  let shown = true, seenCount = 0;
  const narrow = () => { try { return matchMedia('(max-width:759px)').matches; } catch(e){ return false; } };
  function layout(){
    const shut = closed || (!enabled && narrow());   // 폰에서 방 밖이면 작게 접어 두기
    root.hidden = !shown || shut; opener.hidden = !shown || !shut;
    document.body.classList.toggle('has-chat', shown && !shut);
  }
  try { matchMedia('(max-width:759px)').addEventListener('change', () => layout()); } catch(e){}
  function setClosed(v){ closed = v; try { localStorage.setItem('chat_closed', v ? '1' : '0'); } catch(e){} if (!v){ seenCount = msgs.length; badge.hidden = true; setTimeout(() => input.focus(), 30); } layout(); }
  root.querySelector('.cd-x').addEventListener('click', () => setClosed(true));
  opener.addEventListener('click', () => { if (!enabled && narrow() && !closed) { root.hidden = false; opener.hidden = true; document.body.classList.add('has-chat'); return; } setClosed(false); });
  const list = root.querySelector('.cd-list'), input = root.querySelector('.cd-in'), cnt = root.querySelector('.cd-cnt');
  const emo = root.querySelector('.cd-emo');
  root.querySelector('.cd-eb').addEventListener('click', () => { if (enabled) emo.hidden = !emo.hidden; });
  emo.addEventListener('click', e => { const b = e.target.closest('.cd-e'); if (!b || !enabled) return; opts.onSend(b.dataset.e); emo.hidden = true; });
  let msgs = [], me = '', lastSig = '';
  const time = at => { try { const d = new Date(at); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; } catch(e){ return ''; } };
  function paint(){
    const sig = msgs.map(m => m.at + m.id).join(',') + me;
    if (sig === lastSig) return; lastSig = sig;
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    list.innerHTML = msgs.length ? msgs.map(m => `<div class="cd-m${m.id === me ? ' me' : ''}${isEmo(m.t) ? ' emo' : ''}"><small><b>${esc(m.n)}</b>${m.id === me ? ' (나)' : ''} · ${time(m.at)}</small><span>${esc(m.t)}</span></div>`).join('') : '<div class="cd-empty">아직 메시지가 없어요. 먼저 인사해 보세요!</div>';
    if (nearBottom || (msgs.length && msgs[msgs.length - 1].id === me)) list.scrollTop = list.scrollHeight;
    cnt.textContent = msgs.length ? `${msgs.length}개` : '';
  }
  root.querySelector('.cd-form').addEventListener('submit', e => {
    e.preventDefault(); const t = input.value.trim(); if (!t) return;
    input.value = ''; opts.onSend(t.slice(0, 60)); input.focus();
  });
  const seenKeys = new Set(); let primed = false, popN = 0;
  // 이모티콘은 채팅창을 닫아도 화면에 '누가 보냈는지'와 함께 둥실 떠올라요
  function pop(x){
    const el = document.createElement('div'); el.className = 'cd-pop' + (x.id === me ? ' me' : '');
    const lane = popN++ % 4; el.style.setProperty('--lane', lane);
    try {
      const wrap = document.querySelector('.wrap') || document.querySelector('#game') || document.body, wr = wrap.getBoundingClientRect();
      const dk = !root.hidden ? root.getBoundingClientRect() : null, right = dk && dk.width ? dk.left : innerWidth;
      const gapR = right - wr.right, gapL = wr.left;
      const H = innerHeight, y = H * (.22 + lane * .17);
      let x = null, size = 0;
      if (gapR >= 90) { x = wr.right + gapR / 2; size = Math.min(84, gapR * .62); }
      else if (gapL >= 90) { x = gapL / 2; size = Math.min(84, gapL * .62); }
      if (x != null) { el.style.cssText += `;left:${x}px;top:${y}px;bottom:auto;translate:-50% 0;--es:${size}px`; el.classList.add('side'); }
      else if (dk && dk.width > 200) { x = dk.left + dk.width * (.22 + (lane % 2) * .18); el.style.cssText += `;left:${x}px;top:${dk.top + 90 + lane * 70}px;bottom:auto;translate:-50% 0;--es:56px`; el.classList.add('side'); }   // 빈 곳이 없으면 채팅 칸 위쪽 빈자리에
      else el.classList.add('corner');   // 그것도 없으면 화면 오른쪽 구석에 작게
    } catch(e){}
    el.innerHTML = `<span class="cd-pe">${esc(x.t)}</span><b>${esc(x.n)}${x.id === me ? ' (나)' : ''}</b>`;
    document.body.appendChild(el);
    if (el.animate) el.animate([{transform: 'translateY(30px) scale(.4)', opacity: 0}, {transform: 'translateY(-8px) scale(1.15)', opacity: 1, offset: .15}, {transform: 'translateY(-20px) scale(1)', opacity: 1, offset: .7}, {transform: 'translateY(-70px) scale(.9)', opacity: 0}], {duration: 3200, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both'}).onfinish = () => el.remove();
    else setTimeout(() => el.remove(), 3200);
    try { if (window.SFX) window.SFX.play('pop'); } catch(e){}
  }
  layout();
  return {
    show(v){ shown = !!v; layout(); },
    enable(v, msg){
      if (enabled === !!v && offMsg === (msg || '')) return;
      enabled = !!v; offMsg = msg || '';
      input.disabled = !enabled; root.querySelector('.cd-send').disabled = !enabled;
      input.placeholder = enabled ? '메시지 입력…' : (offMsg || '방에 들어가면 채팅할 수 있어요');
      layout();
      if (!enabled){ emo.hidden = true; msgs = []; lastSig = '';  list.innerHTML = `<div class="cd-empty">${esc(offMsg || '방에 들어가면 여기서 같이 채팅할 수 있어요 💬')}</div>`; cnt.textContent = ''; }
    },
    update(m, myId){
      me = myId; msgs = (m || []).slice(-40);
      const fresh = msgs.filter(x => !seenKeys.has(x.at + '|' + x.id));
      msgs.forEach(x => seenKeys.add(x.at + '|' + x.id));
      if (primed) fresh.filter(x => isEmo(x.t) && Date.now() - x.at < 15000).forEach((x, k) => setTimeout(() => pop(x), k * 180));
      primed = true;
      paint();
      if (!closed) seenCount = msgs.length; else if (seenCount > msgs.length) seenCount = msgs.length;
      const unread = closed ? msgs.slice(seenCount).filter(x => x.id !== me).length : 0;
      badge.hidden = !unread; badge.textContent = unread > 9 ? '9+' : unread;
    }
  };
};
})();
