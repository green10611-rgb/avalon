// 원탁의 기사단 실시간 서버 (Node.js + WebSocket)
// 실행: npm install && npm start   →  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

require('./public/core.js');
require('./public/games-d.js');
const G = globalThis.G, U = globalThis.U, g = G.avalon;

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (p === '/') p = '/index.html';
  const f = path.normalize(path.join(PUB, p));
  if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
});


/* ---------- AI 참가자 ---------- */
const EVIL = {AS: 1, MO: 1, MD: 1, OB: 1, MI: 1};
const isEvil = r => !!EVIL[r];
const SIZES = {4: [2,2,2,3,3], 5: [2,3,2,3,3], 6: [2,3,4,3,4], 7: [2,3,3,4,4], 8: [3,4,4,5,5], 9: [3,4,4,5,5], 10: [3,4,4,5,5]};
const BOTNAMES = ['랜슬롯', '가웨인', '트리스탄', '베디비어', '갤러해드', '케이', '보스', '라모락', '가레스'];
const rnd = () => Math.random();
const HUNCH = new Map();
const pickN = (arr, k) => U.shuffle(arr.slice()).slice(0, k);
// 이 AI가 아는 '확실한 악' 목록
function knownEvil(S, me) {
  const r = S.role[me], n = S.role.length, out = new Set();
  if (r === 'ME') for (let i = 0; i < n; i++) if (isEvil(S.role[i]) && S.role[i] !== 'MD') out.add(i);
  if (isEvil(r) && r !== 'OB') for (let i = 0; i < n; i++) if (isEvil(S.role[i]) && S.role[i] !== 'OB') out.add(i);
  return out;
}
// 원정 실패 기록으로 계산한 의심 점수 (선의 AI 시점)
function suspicion(S, me) {
  const n = S.role.length, sc = Array(n).fill(0), ke = knownEvil(S, me);
  const ql = S.qlog || [];
  ql.forEach((q, k) => {
    const others = q.team.filter(i => i !== me);
    const h = S.hist.filter(x => x.ok && x.q === k).pop();
    if (q.f > 0) { for (const i of others) sc[i] += q.f / Math.max(1, others.length) * 1.5; if (h && h.lead !== me) sc[h.lead] += 0.3; if (h && h.bv) for (const i in h.bv) if (+i !== me) sc[+i] += h.bv[i] ? 0.25 : -0.15; }
    else for (const i of others) sc[i] -= 0.2;
  });
  if (S.role[me] === 'PE') for (let i = 0; i < n; i++) if (S.role[i] === 'ME' || S.role[i] === 'MO') sc[i] -= 0.1;
  // 사람처럼 '감'이 있는 AI: 게임마다 정해지는 막연한 느낌(가끔 틀려요)
  const hk = (S._g || '') + ':' + me; if (HUNCH.size > 5000) HUNCH.clear(); if (!HUNCH.has(hk)) HUNCH.set(hk, S.role.map(r => (isEvil(r) ? 0.45 : 0) + (rnd() - 0.5) * 0.7));
  const hu = HUNCH.get(hk); for (let i = 0; i < n; i++) sc[i] += hu[i] * Math.min(1, 0.5 + 0.25 * ql.length);
  sc[me] = -9;
  if (S.role[me] === 'ME') for (const i of ke) sc[i] += rnd() < 0.85 ? 3 : 0; // 티 안 나게 가끔 실수
  return sc;
}
function botTeam(S, me, n) {
  const need = SIZES[n][S.quest], all = [...Array(n).keys()];
  if (isEvil(S.role[me])) {
    const mates = [...knownEvil(S, me)].filter(i => i !== me);
    const team = [me];
    if (need >= 3 && mates.length && rnd() < 0.4) team.push(mates[U.rint(mates.length)]);
    const goods = pickN(all.filter(i => !team.includes(i) && !mates.includes(i)), need);
    for (const i of goods) if (team.length < need) team.push(i);
    for (const i of pickN(all, n)) if (team.length < need && !team.includes(i)) team.push(i);
    return team;
  }
  const sc = suspicion(S, me);
  return all.map(i => [i, sc[i] + rnd() * 0.3]).sort((a, b) => a[1] - b[1]).slice(0, need).map(x => x[0]);
}
function botVote(S, me) {
  const team = S.team;
  if (isEvil(S.role[me])) {
    if (S.rej >= 4) return false;
    const ke = knownEvil(S, me); ke.add(me);
    if (S.role[me] === 'OB') return team.includes(me) || rnd() < 0.3;
    return team.some(i => ke.has(i)) ? rnd() < 0.9 : rnd() < 0.15;
  }
  if (S.rej >= 4) return true;
  const sc = suspicion(S, me), worst = Math.max(...team.filter(i => i !== me).map(i => sc[i]), -1);
  if (S.role[me] === 'ME' && team.some(i => knownEvil(S, me).has(i))) return rnd() < 0.15;
  if (S.quest === 0) return team.includes(me) ? rnd() < 0.9 : rnd() < 0.4;
  if (worst >= 0.5) return rnd() < 0.08;
  return team.includes(me) ? (worst < 0.3 ? rnd() < 0.9 : rnd() < 0.4) : (worst < 0.1 ? rnd() < 0.6 : rnd() < 0.2);
}
function botCard(S, me, n) {
  if (!isEvil(S.role[me])) return true;
  const evilsOnTeam = S.team.filter(i => isEvil(S.role[i]) && S.role[i] !== 'OB' && S.role[me] !== 'OB');
  const leadEvil = evilsOnTeam.length ? Math.min(...evilsOnTeam) : me;
  const needF = (n >= 7 && S.quest === 3) ? 2 : 1;
  if (needF === 1 && S.role[me] !== 'OB' && leadEvil !== me) return true; // 동료가 실패를 낼 거라 믿고 숨기
  return rnd() < (S.quest === 0 ? 0.55 : 0.9) ? false : true;
}
function botKill(S, n) {
  const goods = [...Array(n).keys()].filter(i => !isEvil(S.role[i]));
  const score = goods.map(i => {
    let s = rnd() * 0.5;
    for (const h of S.hist) if (h.lead === i) s += h.team.some(t => isEvil(S.role[t])) ? -1 : 1;
    if (S.role[i] === 'PE') s += 0.5;
    return [i, s];
  }).sort((a, b) => b[1] - a[1]);
  return score[0][0];
}
function botStep(r) {
  if (r.status !== 'play' || !r.state || r.state.winner) return false;
  const S = r.state, P = r.players, n = P.length, isBot = i => P[i] && P[i].bot;
  let acted = false;
  const run = (i, t, a) => { try { g.act(S, i, t, a, P); acted = true; } catch (e) {} };
  if (S.phase === 'look') { for (let i = 0; i < n; i++) if (isBot(i) && !S.seen[i]) { run(i, 'seen', {}); break; } }
  else if (S.phase === 'team' && isBot(S.lead)) run(S.lead, 'propose', {team: botTeam(S, S.lead, n)});
  else if (S.phase === 'vote' && !S.bv && P.some(p => p.bot)) { const bv = {}; for (let i = 0; i < n; i++) if (isBot(i)) bv[i] = botVote(S, i); S.bv = bv; acted = true; }
  else if (S.phase === 'quest') { const i = S.team.find(k => isBot(k) && S.cards[k] === undefined); if (i !== undefined) run(i, 'card', {ok: botCard(S, i, n)}); }
  else if (S.phase === 'kill') { const as = S.role.indexOf('AS'); if (isBot(as)) run(as, 'kill', {t: botKill(S, n)}); }
  return acted;
}
function scheduleBots(r) {
  if (r.botTimer || !r.players.some(p => p.bot)) return;
  const st = r.state;
  const wait = st && st.phase === 'kill' ? 4500 : st && st.phase === 'team' ? 2200 : 1300;
  r.botTimer = setTimeout(() => { r.botTimer = null; if (!rooms.has(r.code)) return; if (botStep(r)) broadcast(r); }, wait + U.rint(600));
}

/* ---------- 방 ---------- */
const rooms = new Map();          // code -> room
const socks = new Map();          // ws -> {pid, code}
const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const newCode = () => { for (;;) { const c = Array.from({ length: 4 }, () => A[U.rint(A.length)]).join(''); if (!rooms.has(c)) return c; } };
const pub = r => ({ code: r.code, host: r.host, status: r.status, players: r.players, state: r.state, gid: r.gid, online: r.players.map(p => p.bot ? true : isOnline(r.code, p.id)) });
function isOnline(code, pid) { for (const v of socks.values()) if (v.code === code && v.pid === pid) return true; return false; }
function send(ws, m) { if (ws.readyState === 1) ws.send(JSON.stringify(m)); }
function broadcast(r) { r.touched = Date.now(); const m = JSON.stringify({ type: 'room', room: pub(r) }); for (const [ws, v] of socks) if (v.code === r.code && ws.readyState === 1) ws.send(m); scheduleBots(r); }
const err = (ws, msg) => send(ws, { type: 'err', msg });

function handle(ws, m) {
  const me = socks.get(ws); if (!me) return;
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
    const r = { code: newCode(), host: me.pid, status: 'lobby', players: [{ id: me.pid, name }], state: null, gid: '', touched: Date.now() };
    rooms.set(r.code, r); me.code = r.code; return broadcast(r);
  }
  if (m.type === 'join') {
    const c = String(m.code || '').toUpperCase().replace(/[^A-Z]/g, '');
    const r = rooms.get(c);
    if (!r) return err(ws, '그런 방이 없어요. 코드를 확인해 주세요.');
    if (!name) return err(ws, '이름을 먼저 적어 주세요.');
    if (!r.players.some(p => p.id === me.pid)) {
      if (r.status !== 'lobby') return err(ws, '이미 게임이 시작된 방이에요.');
      if (r.players.length >= g.max) return err(ws, `방이 꽉 찼어요(최대 ${g.max}명).`);
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
  if (m.type === 'addbot') {
    if (r.host !== me.pid || r.status !== 'lobby') return err(ws, '대기실에서 방장만 할 수 있어요.');
    if (r.players.length >= g.max) return err(ws, `최대 ${g.max}명까지예요.`);
    const used = new Set(r.players.map(p => p.name));
    const nm = '🤖' + (BOTNAMES.find(b => !used.has('🤖' + b)) || ('AI' + r.players.length));
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
    if (r.players.length < g.min || r.players.length > g.max) return err(ws, `${g.min}~${g.max}명이 필요해요.`);
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
    try { g.act(S, idx, String(m.t), m.a || {}, r.players); }
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
}, 25000);

server.listen(PORT, () => console.log(`원탁의 기사단 서버 실행 중: http://localhost:${PORT}`));
