/* 효과음: 파일 없이 브라우저(Web Audio)로 직접 만들어 내는 소리예요. 🔊 버튼으로 끄고 켤 수 있어요. */
(function () {
  if (typeof window === 'undefined' || window.SFX) return;
  const W = window;
  let ctx = null, master = null;
  const KEY = 'bg_sfx';
  let on = true; try { on = localStorage.getItem(KEY) !== '0'; } catch (e) {}
  const last = {};
  function ac() {
    if (!ctx) {
      const C = W.AudioContext || W.webkitAudioContext; if (!C) return null;
      try { ctx = new C(); master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination); } catch (e) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  // 첫 터치/클릭 때 소리를 켤 수 있게 준비해요(브라우저 자동재생 규칙)
  const unlock = () => { ac(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => W.addEventListener(ev, unlock, {capture: true, passive: true}));

  function tone(f, d, o = {}) {
    const c = ctx, t = c.currentTime + (o.at || 0);
    const g = c.createGain(), osc = c.createOscillator();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide || d));
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibAmt || 12; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + .05); }
    const v = o.vol == null ? .3 : o.vol, a = o.att || .005;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    let node = osc;
    if (o.lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); node = fl; }
    node.connect(g); g.connect(master); osc.start(t); osc.stop(t + d + .05);
  }
  function noise(d, o = {}) {
    const c = ctx, t = c.currentTime + (o.at || 0), n = Math.floor(c.sampleRate * d);
    const b = c.createBuffer(1, n, c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = b;
    const f = c.createBiquadFilter(); f.type = o.ftype || 'bandpass'; f.frequency.setValueAtTime(o.f || 1200, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + d); f.Q.value = o.q || 1;
    const g = c.createGain(), v = o.vol == null ? .25 : o.vol;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.att || .01)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + d + .05);
  }
  const N = {C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, B5: 987.8, C6: 1046.5, E6: 1318.5, G6: 1568};
  const SOUNDS = {
    tick: () => tone(1400, .04, {type: 'triangle', vol: .06}),
    pop: () => tone(520, .09, {to: 980, vol: .16}),
    sparkle: () => [2093, 2637, 3136].forEach((f, i) => tone(f, .12, {at: i * .045, vol: .07})),
    whoosh: () => noise(.28, {f: 400, to: 3000, q: .7, vol: .14, att: .06}),
    coin: () => { tone(N.B5, .08, {type: 'square', vol: .08}); tone(N.E6, .28, {type: 'square', vol: .08, at: .07}); },
    success: () => [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(f, i === 3 ? .5 : .16, {type: 'triangle', vol: .2, at: i * .09})),
    fanfare: () => { [N.G5, N.G5, N.G5, N.C6].forEach((f, i) => tone(f, i === 3 ? .7 : .12, {type: 'square', vol: .07, at: i * .12, lp: 3000})); [N.E5, N.G5, N.C6].forEach(f => tone(f, .9, {type: 'triangle', vol: .08, at: .36})); },
    fail: () => { tone(330, .22, {type: 'sawtooth', to: 220, vol: .12, lp: 1400}); tone(247, .45, {type: 'sawtooth', to: 130, vol: .12, at: .2, lp: 1200}); },
    notify: () => { tone(N.E5, .12, {vol: .16}); tone(N.A5, .25, {vol: .16, at: .1}); },
    chime: () => { tone(N.A5, .8, {vol: .14}); tone(N.E6, .6, {vol: .06, at: .01}); },
    bell: () => { tone(N.G6, 1.3, {vol: .22}); tone(3136, .8, {vol: .07}); tone(4700, .4, {vol: .03}); },
    monster: () => { tone(70, .9, {type: 'sawtooth', vib: 7, vibAmt: 18, vol: .2, lp: 500, att: .08}); noise(.8, {ftype: 'lowpass', f: 300, vol: .2, att: .08}); },
    howl: () => { tone(380, 1.5, {to: 720, slide: .6, vib: 6, vibAmt: 14, vol: .14, att: .25}); tone(760, 1.2, {to: 560, slide: 1.2, at: .6, vol: .06, att: .1}); },
    treasure: () => { SOUNDS.coin(); [N.E6, N.G6].forEach((f, i) => tone(f, .25, {type: 'square', vol: .05, at: .25 + i * .08})); setTimeout(() => SOUNDS.sparkle(), 300); },
    morning: () => [N.C5, N.E5, N.G5, N.B5, N.E6].forEach((f, i) => tone(f, .5, {vol: .1, at: i * .1, att: .03})),
    night: () => [N.E5, N.C5, 392, 329.6].forEach((f, i) => tone(f, .7, {vol: .1, at: i * .16, att: .03, type: 'triangle'})),
    stamp: () => { noise(.12, {ftype: 'lowpass', f: 700, vol: .35}); tone(130, .15, {vol: .3, to: 70}); },
    yes: () => { tone(N.A5, .1, {type: 'triangle', vol: .18}); tone(1175, .22, {type: 'triangle', vol: .18, at: .08}); },
    no: () => tone(196, .3, {type: 'square', vol: .07, lp: 900}),
    swish: () => noise(.18, {f: 2500, to: 600, q: 1.2, vol: .1}),
    flip: () => { noise(.06, {f: 3000, q: 2, vol: .12}); tone(800, .05, {vol: .05, at: .02}); },
    alarm: () => [0, .18, .36].forEach(a => tone(880, .12, {type: 'square', vol: .06, at: a})),
    // 바둑알 '딱': 짧고 맑은 클릭 + 높은 울림(돌·유리 느낌)
    clack: (v = 1) => { const p = .95 + Math.random() * .1; noise(.018, {f: 2200 * p, q: 1.4, vol: .4 * v, att: .0008}); tone(1900 * p, .03, {type: 'triangle', vol: .12 * v, att: .0008}); },
    thud: () => { tone(110, .25, {to: 55, vol: .35}); noise(.15, {ftype: 'lowpass', f: 400, vol: .18}); }
  };
  const GAP = {clack: 25, sparkle: 280, pop: 90, whoosh: 160, coin: 70, tick: 40, flip: 70, swish: 120};
  function play(name, arg) {
    if (!on || !SOUNDS[name]) return;
    const t = Date.now(), g = GAP[name] == null ? 200 : GAP[name];
    if (last[name] && t - last[name] < g) return; last[name] = t;
    if (!ac()) return;
    try { SOUNDS[name](arg); } catch (e) {}
  }
  function setOn(v) { on = !!v; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} paint(); if (on) { ac(); play('pop'); } }
  W.SFX = {play, setOn, get on() { return on; }};

  // 화면에 효과가 나타나면 어울리는 소리를 내요 (모든 게임 공통)
  const GOOD = /승리|🏆|정답|딩동|발견|👑|성공|맞았|맞혔|우승|이겼|보물|마을 승리|축하/;
  const BAD = /패배|실패|땡|위험|크라켄|틀렸|❌|탈락|늑대인간 승리|떠안|빼앗|잃었/;
  const WARN = /⏰|시간 초과|마지막/;
  function classify(el) {
    const c = el.className && el.className.baseVal == null ? String(el.className) : '';
    if (!c) return;
    if (/fx-banner|sp-banner/.test(c)) {
      const tx = el.textContent || '';
      if (/늑대인간 등장|🐺/.test(tx) && !/마을 승리/.test(tx)) return W.SFX.play('howl');
      if (BAD.test(tx)) return W.SFX.play('fail');
      if (GOOD.test(tx)) return W.SFX.play(/승리|우승|🏆|이겼/.test(tx) ? 'fanfare' : 'success');
      if (WARN.test(tx)) return W.SFX.play('alarm');
      if (/내 차례|왔어요|차례/.test(tx)) return W.SFX.play('notify');
      return W.SFX.play('chime');
    }
    if (/kfx-octo|kfx-redflash|kfx-ink/.test(c)) return W.SFX.play('monster');
    if (/wwfx-howl/.test(c)) return W.SFX.play('howl');
    if (/kfx-goldflash/.test(c)) return W.SFX.play('treasure');
    if (/wwfx-sun/.test(c)) return W.SFX.play('morning');
    if (/wwfx-night/.test(c)) return W.SFX.play('night');
    if (/hgfx-wave/.test(c)) return W.SFX.play('bell');
    if (/kfx-coin|wwfx-coin/.test(c)) return W.SFX.play('coin');
    if (/fx-conf|wwfx-c\b|fx-rain|sp-rain/.test(c)) return W.SFX.play('sparkle');
    if (/fx-fly|sp-fly/.test(c)) return W.SFX.play('whoosh');
    if (/fx-spark|wwfx-p\b|sp-float/.test(c)) return W.SFX.play('pop');
  }
  function watch() {
    try {
      new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.parentNode === document.body) classify(n); })
        .observe(document.body, {childList: true});
    } catch (e) {}
    // 게임 버튼을 누를 때 살짝 '톡'
    document.addEventListener('pointerdown', e => {
      const b = e.target.closest && e.target.closest('#game button, #game [data-act], .gp, .gbtn, .btn');
      if (b && !b.disabled && !b.classList.contains('sfx-tog')) play(b.closest('#game') ? 'flip' : 'tick');
    }, {capture: true, passive: true});
    // 끄고 켜는 버튼
    const t = document.createElement('button'); t.type = 'button'; t.className = 'sfx-tog'; t.setAttribute('aria-label', '효과음 끄기/켜기');
    t.addEventListener('click', () => setOn(!on));
    document.body.appendChild(t); paint();
  }
  function paint() { const t = document.querySelector('.sfx-tog'); if (t) { t.textContent = on ? '🔊' : '🔇'; t.classList.toggle('off', !on); t.title = on ? '효과음 끄기' : '효과음 켜기'; } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
