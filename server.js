// 아발론: 레지스탕스 실시간 서버 (Node.js + WebSocket)
// 실행: npm install && npm start   →  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

require('./public/core.js');
require('./public/games-d.js');
require('./public/games-k.js');
require('./public/games-s.js');
require('./public/games-r.js');
require('./public/games-h.js');
require('./public/games-x.js');
const G = globalThis.G, U = globalThis.U;
const GAMES = ['avalon', 'kraken', 'splendor', 'cockroach', 'halli', 'dixit'];
const gOf = r => G[r && GAMES.includes(r.game) ? r.game : 'avalon'];

const PORT = process.env.PORT || 3000;
const BOOT = Date.now().toString(36);
const PUB = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (p === '/' || /^\/(kraken|avalon|splendor|cockroach|halli|dixit)\/?$/.test(p)) p = '/index.html';
  p = p.replace(/^\/(kraken|avalon|splendor|cockroach|halli|dixit)\/(img\/)/, '/$2');
  const f = path.normalize(path.join(PUB, p));
  if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    // 새 버전이 올라가면 브라우저가 예전 파일을 쓰지 않도록 파일 주소에 버전 표시
    if (path.extname(f) === '.html') buf = Buffer.from(buf.toString().replace(/(src|href)="(\/[\w.-]+\.(?:js|css))"/g, `$1="$2?v=${BOOT}"`));
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': path.extname(f) === '.webp' ? 'public, max-age=604800' : 'no-cache' });
    res.end(buf);
  });
});


/* ---------- AI 참가자 (두뇌는 public/games-d.js에 있어요) ---------- */
function botStep(r) {
  if (r.status !== 'play' || !r.state || r.state.winner) return false;
  const g = gOf(r); return g.botStep ? g.botStep(r.state, r.players) : false;
}
// 제한시간: 게임이 due()로 마감 시각을 알려주면 그때 timeout()을 불러요
function scheduleDue(r) {
  clearTimeout(r.dueTimer); r.dueTimer = null;
  const g = gOf(r), st = r.state;
  if (!st || st.winner || !g.due || !g.timeout) return;
  const d = g.due(st, r.players); if (d == null) return;
  r.dueTimer = setTimeout(() => {
    r.dueTimer = null; if (!rooms.has(r.code) || r.state !== st) return;
    const S = JSON.parse(JSON.stringify(st));
    if (g.timeout(S, r.players)) { r.state = S; broadcast(r); }
  }, Math.max(0, d - Date.now()) + 250);
}
function scheduleBots(r) {
  if (r.botTimer || !r.players.some(p => p.bot)) return;
  const st = r.state;
  const wait = st && st.phase === 'kill' ? 4500 : st && st.phase === 'team' ? 2200 : 1300;
  r.botTimer = setTimeout(() => { r.botTimer = null; if (!rooms.has(r.code)) return; if (botStep(r)) broadcast(r); }, wait + U.rint(600) + (gOf(r).botDelay && st ? gOf(r).botDelay(st) : 0));
}

/* ---------- 방 ---------- */
const rooms = new Map();          // code -> room
const socks = new Map();          // ws -> {pid, code}
const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const newCode = () => { for (;;) { const c = Array.from({ length: 4 }, () => A[U.rint(A.length)]).join(''); if (!rooms.has(c)) return c; } };
const pub = r => ({ code: r.code, game: r.game || 'avalon', host: r.host, status: r.status, players: r.players, state: r.state, gid: r.gid, chat: r.chat || [], online: r.players.map(p => p.bot ? true : isOnline(r.code, p.id)) });
function isOnline(code, pid) { for (const v of socks.values()) if (v.code === code && v.pid === pid) return true; return false; }
function send(ws, m) { if (ws.readyState === 1) ws.send(JSON.stringify(m)); }
function broadcast(r) { r.touched = Date.now(); const m = JSON.stringify({ type: 'room', room: pub(r) }); for (const [ws, v] of socks) if (v.code === r.code && ws.readyState === 1) ws.send(m); scheduleBots(r); scheduleDue(r); }
const err = (ws, msg) => send(ws, { type: 'err', msg });

function handle(ws, m) {
  const me = socks.get(ws); if (!me) return;
  if (m.type === 'ping') return send(ws, { type: 'pong' });
  if (m.type === 'hello') {
    me.pid = String(m.pid || '').slice(0, 20) || Math.random().toString(36).slice(2, 12);
    const r = m.code && rooms.get(m.code);
    if (r && r.players.some(p => p.id === me.pid)) { me.code = r.code; broadcast(r); }
    else send(ws, { type: 'room', room: null });
    return;
  }
  if (!me.pid) return err(ws, '연결 준비 중이에요. 잠시 후 다시 눌러 주세요.');
  const name = String(m.name || '').trim().slice(0, 10);
  if (m.type === 'create') {
    if (!name) return err(ws, '이름을 먼저 적어 주세요.');
    const r = { code: newCode(), game: GAMES.includes(m.game) ? m.game : 'avalon', host: me.pid, status: 'lobby', players: [{ id: me.pid, name }], state: null, gid: '', touched: Date.now() };
    rooms.set(r.code, r); me.code = r.code; return broadcast(r);
  }
  if (m.type === 'join') {
    const c = String(m.code || '').toUpperCase().replace(/[^A-Z]/g, '');
    const r = rooms.get(c);
    if (!r) return err(ws, '그런 방이 없어요. 코드를 확인해 주세요.');
    if (!name) return err(ws, '이름을 먼저 적어 주세요.');
    if (!r.players.some(p => p.id === me.pid)) {
      if (r.status !== 'lobby') return err(ws, '이미 게임이 시작된 방이에요.');
      const g = gOf(r); if (r.players.length >= g.max) return err(ws, `방이 꽉 찼어요(최대 ${g.max}명).`);
      let nm = name; while (r.players.some(p => p.name === nm)) nm += '2';
      r.players.push({ id: me.pid, name: nm });
    }
    me.code = r.code; return broadcast(r);
  }
  const r = me.code && rooms.get(me.code);
  if (!r) return err(ws, '방을 찾을 수 없어요.');
  const idx = r.players.findIndex(p => p.id === me.pid);
  if (m.type === 'leave') {
    me.code = null; send(ws, { type: 'room', room: null });
    if (r.host === me.pid) { for (const [w, v] of socks) if (v.code === r.code) { v.code = null; send(w, { type: 'closed' }); } rooms.delete(r.code); return; }
    if (r.status === 'lobby') r.players = r.players.filter(p => p.id !== me.pid);
    return broadcast(r);
  }
  if (m.type === 'chat') {
    const t = String(m.text || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!t || idx < 0) return;
    const now = Date.now(); if (me.lastChat && now - me.lastChat < 120) return; me.lastChat = now;
    r.chat = (r.chat || []).concat([{ id: me.pid, n: r.players[idx].name, t, at: now }]).slice(-50);
    return broadcast(r);
  }
  if (m.type === 'setgame') {
    if (r.host !== me.pid || r.status !== 'lobby') return err(ws, '대기실에서 방장만 바꿀 수 있어요.');
    if (!GAMES.includes(m.game)) return; r.game = m.game; return broadcast(r);
  }
  if (m.type === 'addbot') {
    if (r.host !== me.pid || r.status !== 'lobby') return err(ws, '대기실에서 방장만 할 수 있어요.');
    const g = gOf(r); if (r.players.length >= g.max) return err(ws, `최대 ${g.max}명까지예요.`);
    const used = new Set(r.players.map(p => p.name));
    const nm = '🤖' + ((g.BOTNAMES || []).find(b => !used.has('🤖' + b)) || ('AI' + r.players.length));
    r.players.push({ id: 'bot-' + Math.random().toString(36).slice(2, 8), name: nm, bot: true });
    return broadcast(r);
  }
  if (m.type === 'kick') {
    if (r.host !== me.pid || r.status !== 'lobby') return err(ws, '대기실에서 방장만 할 수 있어요.');
    r.players = r.players.filter(p => p.id !== m.id);
    for (const [w, v] of socks) if (v.code === r.code && v.pid === m.id) { v.code = null; send(w, { type: 'kicked' }); }
    return broadcast(r);
  }
  if (m.type === 'start') {
    if (r.host !== me.pid) return err(ws, '방장만 시작할 수 있어요.');
    const g = gOf(r); if (r.players.length < g.min || r.players.length > g.max) return err(ws, `${g.name}은(는) ${g.min}~${g.max}명이 필요해요.`);
    r.state = g.setup(r.players); r.status = 'play'; r.gid = Math.random().toString(36).slice(2, 10); r.state._g = r.gid;
    return broadcast(r);
  }
  if (m.type === 'lobby') {
    if (r.host !== me.pid) return err(ws, '방장만 할 수 있어요.');
    r.status = 'lobby'; r.state = null; r.gid = ''; return broadcast(r);
  }
  if (m.type === 'act') {
    if (idx < 0) return err(ws, '이 방의 참가자가 아니에요.');
    if (!r.state || r.state.winner) return err(ws, '게임이 끝났어요.');
    if (m.gid && m.gid !== r.gid) return;
    const S = JSON.parse(JSON.stringify(r.state));
    try { gOf(r).act(S, idx, String(m.t), m.a || {}, r.players); }
    catch (e) { return err(ws, e.game ? e.message : '처리하지 못했어요.'); }
    r.state = S; return broadcast(r);
  }
}

const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', ws => {
  socks.set(ws, { pid: null, code: null });
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', buf => { let m; try { m = JSON.parse(buf); } catch (e) { return; } try { handle(ws, m); } catch (e) { console.error(e); } });
  ws.on('close', () => { const v = socks.get(ws); socks.delete(ws); const r = v && v.code && rooms.get(v.code); if (r) broadcast(r); });
});
// 연결 유지 + 오래된 방 정리
setInterval(() => {
  for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch (e) {} }
  const now = Date.now();
  for (const [c, r] of rooms) if (now - r.touched > 6 * 3600 * 1000) rooms.delete(c);
}, 10000);

server.listen(PORT, () => console.log(`아발론: 레지스탕스 서버 실행 중: http://localhost:${PORT}`));
