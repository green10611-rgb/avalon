(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G = {}; const U = R.U = {};
U.shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
U.rint = n => Math.floor(Math.random() * n);
U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
U.attr = v => U.esc(JSON.stringify(v));
U.btn = (label, act, arg, cls = '', dis = false) =>
  `<button type="button" class="btn ${cls}" data-act="${act}"${arg !== undefined ? ` data-arg="${U.attr(arg)}"` : ''}${dis ? ' disabled' : ''}>${label}</button>`;
U.ub = (label, key, val, cls = '', dis = false) =>
  `<button type="button" class="btn ${cls}" data-ui="${key}" data-tog data-val="${U.attr(val)}"${dis ? ' disabled' : ''}>${label}</button>`;
U.gb = (label, name, val, cls = '', dis = false) =>
  `<button type="button" class="btn ${cls}" data-g="${name}" data-val="${U.attr(val === undefined ? null : val)}"${dis ? ' disabled' : ''}>${label}</button>`;
U.log = (S, m) => { S.log = (S.log || []).concat(m).slice(-10); };
U.nm = (P, i) => U.esc(P[i] ? P[i].name : '?');
U.pc = i => `var(--p${i % 10})`;
U.chip = (P, i) => `<span class="pchip" style="--pc:${U.pc(i)}">${U.nm(P, i)}</span>`;
U.err = m => { const e = new Error(m); e.game = true; return e; };
U.nextOk = (i, n, ok) => { for (let k = 1; k <= n; k++) { const j = (i + k) % n; if (ok(j)) return j; } return i; };
U.sum = a => a.reduce((x, y) => x + y, 0);
U.clone = o => JSON.parse(JSON.stringify(o));
// 그림 (마이크로소프트 Fluent Emoji 3D, MIT 라이선스): img/이름.webp
U.img = (k, cls = '', alt = '') => `<img class="fe ${cls}" src="img/${k}.webp" alt="${alt}" draggable="false" loading="eager">`;
})();
