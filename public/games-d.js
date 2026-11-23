(function(){
const R = typeof window !== 'undefined' ? window : globalThis;
const G = R.G, U = R.U;

/* =================== 아발론: 레지스탕스 (아발론 규칙) =================== */
const AR = {ME: '멀린', PE: '퍼시벌', LS: '충성스러운 기사', AS: '암살자', MO: '모르가나', MD: '모드레드', OB: '오베론', MI: '모드레드의 부하'};
const EVIL = {AS: 1, MO: 1, MD: 1, OB: 1, MI: 1};
const ARD = {
  ME: '악의 세력이 누군지 알고 있어요(모드레드만 빼고). 하지만 들키면 마지막에 암살당해요. 티 안 나게 선의 편을 도우세요.',
  PE: '멀린 후보 두 명이 보여요. 한 명은 진짜 멀린, 한 명은 멀린인 척하는 모르가나예요.',
  LS: '아무 정보도 없어요. 대화와 투표 기록으로 악의 세력을 찾아내세요.',
  AS: '악의 편. 선이 원정 3번을 성공해도, 마지막에 멀린을 맞히면 악의 승리예요.',
  MO: '악의 편. 퍼시벌에게 멀린처럼 보여요. 퍼시벌을 헷갈리게 하세요.',
  MD: '악의 편. 멀린에게도 정체가 보이지 않아요.',
  OB: '악의 편이지만 동료가 누군지 모르고, 동료도 나를 몰라요. 멀린에게는 보여요.',
  MI: '악의 편. 동료와 함께 원정을 실패시키세요.'
};
const ASIZE = {4: [2,2,2,3,3], 5: [2,3,2,3,3], 6: [2,3,4,3,4], 7: [2,3,3,4,4], 8: [3,4,4,5,5], 9: [3,4,4,5,5], 10: [3,4,4,5,5]};
const AROLES = {
  4: ['ME','LS','LS','AS'],
  5: ['ME','PE','LS','AS','MO'],
  6: ['ME','PE','LS','LS','AS','MO'],
  7: ['ME','PE','LS','LS','AS','MO','MD'],
  8: ['ME','PE','LS','LS','LS','AS','MO','MD'],
  9: ['ME','PE','LS','LS','LS','LS','AS','MO','MD'],
  10: ['ME','PE','LS','LS','LS','LS','AS','MO','MD','OB']
};
const isEvil = r => !!EVIL[r];
const AVAR = {
  MO: {name: '기본 (모르가나)', good: '멀린 · 퍼시벌 · 기사', evil: '암살자 · 모르가나', d: '퍼시벌에게 멀린 후보 2명(멀린·모르가나)이 보여요. 진짜를 가려내는 재미.'},
  MDP: {name: '모드레드 + 퍼시벌', good: '멀린 · 퍼시벌 · 기사', evil: '암살자 · 모드레드', d: '모드레드는 멀린에게 안 보여요. 퍼시벌은 진짜 멀린을 바로 알아요. 퍼시벌의 연기가 중요해요.'}
};
const AIMG = {ME: 'merlin', PE: 'percival', LS: 'knight', AS: 'assassin', MO: 'morgana', MD: 'mordred', OB: 'oberon', MI: 'minion'};
const AE = new Proxy({}, {get: (_, k) => AIMG[k] ? U.img(AIMG[k], 'em') : ''});
const IM = (k, cls = 'em') => U.img(k, cls);
function avFresh(key, dur) {
  const R0 = typeof window !== 'undefined' ? window : globalThis; R0.__avSeen = R0.__avSeen || {};
  const now = Date.now(); if (!R0.__avSeen[key]) R0.__avSeen[key] = now;
  const el = (now - R0.__avSeen[key]) / 1000; return el < dur ? el : -1;
}
const animAttr = el => el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s"`;
const needFail = (n, q) => (n >= 7 && q === 3) ? 2 : 1;
const ids = P => P.map((_, i) => i);
// 이름표: 색깔 방패 + 이름
const avNm = (P, i) => U.esc(((P[i] && P[i].name) || '').replace('🤖', '').trim() || U.nm(P, i));
const avSh = (P, i) => `<i class="avsh" style="--pc:${U.pc(i)}">${P[i] && P[i].bot ? '🤖' : U.esc(Array.from(avNm(P, i))[0] || '?')}</i>`;
const avChip = (P, i, k) => `<span class="avchip" style="--pc:${U.pc(i)}${k != null ? `;--k:${k}` : ''}">${avSh(P, i)}<em>${avNm(P, i)}</em></span>`;
function aKnow(S, me, P) {
  const r = S.role[me], o = [];
  if (r === 'ME') { const s = ids(P).filter(i => isEvil(S.role[i]) && S.role[i] !== 'MD'); o.push(`악의 세력: ${s.map(i => U.nm(P, i)).join(', ') || '없음'}`); if (S.role.includes('MD')) o.push('모드레드는 이 목록에 없어요.'); }
  if (r === 'PE') { const s = ids(P).filter(i => S.role[i] === 'ME' || S.role[i] === 'MO'); o.push(`멀린 후보: ${s.map(i => U.nm(P, i)).join(', ')}`); }
  if (isEvil(r) && r !== 'OB') { const s = ids(P).filter(i => i !== me && isEvil(S.role[i]) && S.role[i] !== 'OB'); o.push(`동료: ${s.map(i => `${U.nm(P, i)}(${AR[S.role[i]]})`).join(', ') || '없음'}`); if (S.role.includes('OB')) o.push('오베론도 악의 편이지만 누군지 몰라요.'); }
  return o;
}
function finishVote(S, P, pass, y, no, bv) {
  S.hist.push({q: S.quest, lead: S.lead, team: S.team.slice(), ok: pass, bv});
  S.votes = {};
  if (pass) S.rej = 0; else S.rej++;
  const keys = bv ? Object.keys(bv).map(Number).sort((a, b) => a - b) : [];
  S.vr = {ok: pass, y, n: no, q: S.quest, rej: S.rej, yes: keys.filter(i => bv[i]), no: keys.filter(i => !bv[i]), hand: y == null};
  S.phase = 'vresult';
  U.log(S, `원정대 투표 ${pass ? '가결' : '부결'}${y != null ? ` (찬성 ${y} : 반대 ${no})` : ''}`);
}
function aNext(S, P) {
  S.lead = (S.lead + 1) % P.length; S.phase = 'team'; S.votes = {}; S.draft = [];
}
G.avalon = {
  name: '아발론: 레지스탕스', tag: '원정대를 꾸리고 숨은 배신자 찾기', min: 4, max: 10, mark: '⚔', hue: 'var(--p6)',
  banner(S, P) { return avBanner(S, P); },
  rules: ['선(아서왕의 기사)과 악(모드레드의 부하)으로 나뉘어요. 처음에 각자 몰래 역할을 확인해요.',
    '대장이 원정대원을 정해 제안하면 모두 주먹을 쥐고 "하나, 둘, 셋!"에 엄지를 올리면 찬성, 주먹 그대로면 반대예요. 찬성이 과반이면 가결(출발), 반대가 같거나 많으면 부결되고 대장이 다음 사람에게 넘어가요. 5번 연속 부결되면 악의 승리. 앱에는 가결/부결만 눌러요.',
    '원정대원은 몰래 성공/실패 카드를 내요. 선은 성공만 낼 수 있어요. 실패가 1장이라도 나오면 원정 실패(7명 이상일 때 4번째 원정은 2장 필요).',
    '원정 3번이 먼저 성공하면 선, 3번 실패하면 악이 이겨요.',
    '선이 3번 성공해도 암살자가 멀린을 맞히면 악의 역전승!',
    '4명은 공식 규칙에 없는 변형이에요: 멀린·기사 2명 vs 암살자 1명, 원정 인원 2-2-2-3-3.'],
  rulesExtra() {
    const card = (k, d, when) => `<div class="avrole ${isEvil(k) ? 'e' : 'g'}"><div class="avrole-em">${AE[k]}</div><b>${AR[k]}</b><p>${d}</p><small>${when}</small></div>`;
    return `<section class="avroles"><div class="avroles-h">7. 역할 카드</div>
<div class="avroles-side g"><div class="avroles-t">⚜ 선의 세력 <small>아서 왕의 편</small></div><div class="avroles-g">${card('ME', '악의 세력이 누군지 알아요(모드레드 빼고). 들키면 마지막에 암살당해요.', '항상')}${card('PE', '멀린 후보 2명(멀린·모르가나)이 보여요. 진짜 멀린을 지켜요.', '5명부터')}${card('LS', '아무 정보도 없어요. 대화와 원정 결과로 악을 찾아요.', '남는 자리')}</div></div>
<div class="avroles-side e"><div class="avroles-t">🩸 악의 세력 <small>모드레드의 편 · 서로를 알아요</small></div><div class="avroles-g">${card('AS', '원정 실패를 노리고, 마지막에 멀린을 맞히면 역전승!', '항상')}${card('MO', '퍼시벌에게 멀린처럼 보여요. 퍼시벌을 헷갈리게 해요.', '5명부터')}${card('MD', '멀린에게도 정체가 보이지 않아요.', '7명부터 · 5~6명은 선택')}${card('OB', '동료를 모르고 동료도 나를 몰라요. 멀린에게는 보여요.', '10명')}</div></div></section>`;
  },
  setup(P) {
    const n = P.length;
    if (!AROLES[n]) throw U.err('4~10명이 필요해요.');
    if (n === 5 || n === 6) return {_g: Math.random().toString(36).slice(2, 10), role: [], phase: 'cfg', seen: {}, lead: U.rint(n), quest: 0, res: [], fails: [], rej: 0, team: [], votes: {}, cards: {}, hist: [], log: ['역할 구성을 골라 주세요.']};
    const roles = U.shuffle(AROLES[n].slice());
    return {_g: Math.random().toString(36).slice(2, 10), role: roles, phase: 'look', seen: {}, lead: U.rint(n), quest: 0, res: [], fails: [], rej: 0, team: [], votes: {}, cards: {}, hist: [],
      log: [`악의 세력 ${roles.filter(isEvil).length}명이 숨어 있어요. 각자 역할을 확인하세요.`]};
  },
  turns(S, P) {
    if (S.phase === 'cfg') return [0];
    if (S.phase === 'look') return ids(P).filter(i => !S.seen[i]);
    if (S.phase === 'team') return [S.lead];
    if (S.phase === 'vote') return ids(P).filter(i => S.votes[i] === undefined);
    if (S.phase === 'vresult') return [S.lead];
    if (S.phase === 'quest') return S.team.filter(i => S.cards[i] === undefined);
    if (S.phase === 'reveal' || S.phase === 'qdone' || S.phase === 'qres') return [S.lead];
    if (S.phase === 'kill') return [S.role.indexOf('AS')];
    if (S.phase === 'kshow') return [S.lead];
    return [];
  },
  act(S, me, t, a, P) {
    const n = P.length;
    if (t === 'cfg') {
      if (S.phase !== 'cfg') return;
      const v = AVAR[a.v] ? a.v : 'MO', good = ['ME'], evil = ['AS', v === 'MO' ? 'MO' : 'MD'];
      if (v !== 'MD') good.push('PE');
      while (good.length < n - 2) good.push('LS');
      S.role = U.shuffle(good.concat(evil)); S.cfg = v; S.phase = 'look';
      U.log(S, `역할 구성: ${AVAR[v].name}. 악의 세력 2명이 숨어 있어요. 각자 역할을 확인하세요.`); return;
    }
    if (t === 'seen') { if (S.phase !== 'look') throw U.err('지금은 할 수 없어요.'); S.seen[me] = true;
      if (ids(P).every(i => S.seen[i])) { S.phase = 'team'; U.log(S, `모두 확인했어요. 첫 대장은 ${P[S.lead].name}님!`); } return; }
    if (t === 'pick') {   // 대장이 고르는 중인 원정대를 모두에게 실시간으로
      if (S.phase !== 'team' || me !== S.lead) throw U.err('대장만 고를 수 있어요.');
      const x = Number(a.i), need = ASIZE[n][S.quest], d = (S.draft || []).slice();
      if (!(x >= 0 && x < n)) return;
      const k = d.indexOf(x);
      if (k >= 0) d.splice(k, 1); else { if (d.length >= need) throw U.err(`${need}명까지 고를 수 있어요. 먼저 한 명을 빼 주세요.`); d.push(x); }
      S.draft = d; return;
    }
    if (t === 'propose') {
      if (S.phase !== 'team' || me !== S.lead) throw U.err('대장만 제안할 수 있어요.');
      const src = Array.isArray(a.team) && a.team.length ? a.team : (S.draft || []);
      const team = [...new Set(src.map(Number))].filter(i => i >= 0 && i < n);
      if (team.length !== ASIZE[n][S.quest]) throw U.err(`${ASIZE[n][S.quest]}명을 골라야 해요.`);
      S.team = team.sort((x, y) => x - y); S.votes = {}; S.phase = 'vote'; S.draft = [];
      U.log(S, `대장 ${P[me].name}님 제안: ${S.team.map(i => P[i].name).join(', ')}`); return;
    }
    if (t === 'vres') {   // 폰 하나로: 손으로 투표한 결과만 입력
      if (S.phase !== 'vote') return;
      const bots = {}; ids(P).forEach(i => { if (P[i].bot && S.votes[i] !== undefined) bots[i] = S.votes[i]; });
      finishVote(S, P, !!a.ok, null, null, bots); return;
    }
    if (t === 'vote') {   // 각자 기기: 한 사람씩 눌러서 모으기
      if (S.phase !== 'vote') throw U.err('지금은 투표할 수 없어요.');
      S.votes[me] = !!a.ok;
      if (ids(P).every(i => S.votes[i] !== undefined)) {
        const y = ids(P).filter(i => S.votes[i]).length;
        finishVote(S, P, y > n / 2, y, n - y, Object.assign({}, S.votes));
      }
      return;
    }
    if (t === 'vnext') {
      if (S.phase !== 'vresult' || !S.vr) return;
      const ok = S.vr.ok; S.vr = null;
      if (ok) { S.phase = 'quest'; S.cards = {}; U.log(S, '원정대가 출발했어요!'); return; }
      if (S.rej >= 5) { S.phase = 'end'; S.wt = 'rej'; S.winner = '5번 연속 부결! 악의 세력 승리.'; return; }
      aNext(S, P); U.log(S, `새 대장은 ${P[S.lead].name}님. 원정대를 다시 꾸려요.`); return;
    }
    if (t === 'card') {
      if (S.phase !== 'quest' || !S.team.includes(me) || S.cards[me] !== undefined) throw U.err('지금은 낼 수 없어요.');
      if (!a.ok && !isEvil(S.role[me])) throw U.err('선의 편은 성공만 낼 수 있어요.');
      S.cards[me] = !!a.ok;
      if (S.team.every(i => S.cards[i] !== undefined)) {
        const f = S.team.filter(i => !S.cards[i]).length, ok = f < needFail(n, S.quest);
        S.pend = {ok, f}; S.cards = {}; S.phase = 'reveal';
        U.log(S, `${S.quest + 1}번째 원정대가 카드를 모두 냈어요. 다 같이 결과를 확인하세요!`);
      }
      return;
    }
    if (t === 'reveal') {
      if (S.phase !== 'reveal' || !S.pend) return;
      const {ok, f} = S.pend; S.pend = null;
      S.res.push(ok); S.fails.push(f); S.qlog = (S.qlog || []).concat([{team: S.team.slice(), f, ok, lead: S.lead, tries: S.hist.filter(x => x.q === S.quest).length}]);
      S.last = {k: 'quest', q: S.quest, ok, f, sz: S.team.length, team: S.team.slice()};
      U.log(S, `${S.quest + 1}번째 원정 ${ok ? '성공' : '실패'}! (실패 카드 ${f}장)`);
      S.quest++;
      const w = S.res.filter(Boolean).length, l = S.res.length - w;
      if (w >= 3) { S.phase = 'qdone'; U.log(S, '원정 3번 성공!'); return; }
      S.phase = 'qres'; return;
    }
    if (t === 'qnext') {
      if (S.phase !== 'qres') return;
      const w = S.res.filter(Boolean).length, l = S.res.length - w;
      if (l >= 3) { S.phase = 'end'; S.wt = 'fail'; S.winner = '원정 3번 실패. 악의 세력 승리!'; return; }
      aNext(S, P); U.log(S, `새 대장은 ${P[S.lead].name}님. 원정대를 꾸려요.`); return;
    }
    if (t === 'tokill') {
      if (S.phase !== 'qdone') return;
      S.phase = 'kill'; U.log(S, '하지만 암살자가 멀린을 노립니다…'); return;
    }
    if (t === 'kill') {
      if (S.phase !== 'kill' || S.role[me] !== 'AS') throw U.err('암살자만 할 수 있어요.');
      const x = +a.t; if (!(x >= 0 && x < n) || isEvil(S.role[x])) throw U.err('선의 편 중에서 고르세요.');
      S.shot = x; S.phase = 'kshow'; U.log(S, `암살자가 ${P[x].name}님을 지목했어요!`); return;
    }
    if (t === 'kreveal') {
      if (S.phase !== 'kshow') return;
      const x = S.shot;
      S.phase = 'end'; S.wt = S.role[x] === 'ME' ? 'killhit' : 'killmiss';
      S.winner = S.role[x] === 'ME' ? `암살자가 멀린(${P[x].name}님)을 찾아냈어요! 악의 역전승.` : `${P[x].name}님은 멀린이 아니었어요. 선의 세력 승리!`;
    }
  },
  view(S, me, ui, P) { if (typeof document !== 'undefined') setTimeout(() => avFx(S, me, P), 0); return `<div class="avw">${G.avalon._view.call(this, S, me, ui, P)}</div>`; },
  _view(S, me, ui, P) {
    const n = P.length, r = me >= 0 ? S.role[me] : null, end = S.phase === 'end' || S.winner;
    let h = '';
    if (S.phase === 'cfg') {
      return `<section class="avcfg"><div class="avt-h"><b>역할 구성 고르기</b><span>${n}명 게임 · 선 ${n - 2}명 vs 악 2명</span></div>${Object.keys(AVAR).map(k => { const v = AVAR[k]; return `<div class="avcfg-o"><div class="avcfg-t"><b>${v.name}</b></div><div class="avcfg-r"><span class="g">선</span> 멀린 · ${k === 'MD' ? `기사 ${n - 3}` : `퍼시벌 · 기사 ${n - 4}`}</div><div class="avcfg-r"><span class="e">악</span> ${v.evil}</div><p>${v.d}</p>${me >= 0 ? U.btn('이 구성으로 시작', 'cfg', {v: k}, k === 'MO' ? 'primary big' : 'big') : ''}</div>`; }).join('')}<p class="small muted">누구든 한 명이 골라 주세요. 고르면 역할이 섞여서 나눠져요.</p></section>`;
    }
    if (!end && (S.phase === 'team' || S.phase === 'vote' || S.phase === 'vresult')) h += `<div class="avlead${me === S.lead ? ' me' : ''}"><span class="avl-cr">${IM('mordred', 'crown')}</span><div><small>${S.quest + 1}번째 원정 · 원정대장</small><b>${U.nm(P, S.lead)}${me === S.lead && !ui._local ? ' (나)' : ''}</b></div><span class="avl-tag">${S.phase === 'team' ? `원정대 ${ASIZE[n][S.quest]}명 고르는 중` : S.phase === 'vote' ? '찬반 투표 중' : '투표 결과'}</span></div>`;
    const sharedScreen = ui._local && ['kshow', 'qres', 'vote', 'vresult', 'team', 'reveal', 'kill', 'qdone'].includes(S.phase);
    if (me >= 0 && !end && S.phase === 'look' && !S.seen[me]) h += ui.drawn ? roleCard(S, me, P, true) : avDeck(n);
    else if (me >= 0 && !end && !sharedScreen) h += `<section class="avmy${ui.peek ? ' open' : ''}">${ui.peek ? roleCard(S, me, P, false) : ''}<div class="avmy-bar"><span class="avmy-c">⚜</span><div><b>내 역할 카드</b><small>${ui.peek ? '다 봤으면 숨겨 주세요' : '남에게 안 보이게 확인하세요'}</small></div>${U.ub(ui.peek ? '🙈 숨기기' : '👁 카드 보기', 'peek', true, ui.peek ? 'avmy-btn' : 'primary avmy-btn')}</div></section>`;
    if (end) h += avEnd(S, P);
    else if (S.phase === 'kill') h += avKill(S, me, ui, P);
    else if (S.phase === 'kshow') h += `<section class="avkill avkshow"><div class="avk-ttl"><span class="avk-dag">${IM('assassin', 'big')}</span><b>지목 완료</b></div><p class="avk-sub">암살자 <b>${U.nm(P, S.role.indexOf('AS'))}</b>님이 멀린이라고 지목한 사람은</p><div class="avk-target"><span class="pdot" style="--pc:${U.pc(S.shot)}"></span><b>${U.nm(P, S.shot)}</b><small>정체는…?</small></div><p class="avk-sub">모두 숨을 고르고, 다 같이 확인하세요!</p>${me >= 0 ? U.btn('🔍 정체 확인하기', 'kreveal', {}, 'avk-go avk-pulse') : ''}<small class="avnext-s">누구든 한 명이 누르면 모든 화면에 동시에 공개돼요</small></section>`;
    else if (S.phase === 'reveal') h += `<div class="avreveal"><small>${S.quest + 1}번째 원정 · ${S.team.map(i => U.nm(P, i)).join(', ')}</small><div class="avseal">🔒</div><b>봉인된 카드 ${S.team.length}장</b><div class="avdeck">${S.team.map(() => '<span class="avback in">⚜</span>').join('')}</div><p>모두 화면 앞에 모였나요? 하나, 둘, 셋!</p>${me >= 0 ? U.btn('원정 결과 보기', 'reveal', {}, 'primary avopen') : ''}<span class="small">누구든 누르면 모든 화면에 결과가 동시에 떠요.</span></div>`;
    else if (S.phase === 'qres' || S.phase === 'qdone') h += avBanner(S, P);
    const mine = end ? false : this.turns(S, P).includes(me);
    if (end) {
    } else if (S.phase === 'look') {
      const left = ids(P).filter(i => !S.seen[i]).length;
      h += mine ? (ui.drawn ? U.btn('기억했어요 · 확인 완료', 'seen', {}, 'primary big avgo avseen') : '') : `<div class="avwait"><div>📜 역할 확인 중</div><span>아직 ${left}명이 확인하고 있어요</span></div>`;
    } else if (S.phase === 'team') {
      const need = ASIZE[n][S.quest], sel = S.draft || [];
      const slots = `<div class="avslots">${Array.from({length: need}, (_, k) => sel[k] != null ? `<span class="avslot full avpop" style="--pc:${U.pc(sel[k])}">${avSh(P, sel[k])}${avNm(P, sel[k])}</span>` : `<span class="avslot">${k + 1}</span>`).join('')}</div>`;
      if (mine) {
        h += `<div class="panel avteam"><div class="avt-h"><b>${S.quest + 1}번째 원정대</b><span>${need}명을 골라 주세요 · 대장 본인도 가능 · 고르는 대로 모두에게 보여요</span></div>
${slots}
<div class="avgrid big">${P.map((p, i) => U.btn(`<span class="pdot" style="--pc:${U.pc(i)}"></span><span class="avnm">${U.nm(P, i)}</span>${i === S.lead ? '<small>대장</small>' : ''}${sel.includes(i) ? '<em>✓</em>' : ''}`, 'pick', {i}, 'avbtn' + (sel.includes(i) ? ' sel' : ''), !sel.includes(i) && sel.length >= need)).join('')}</div>
${U.btn(sel.length === need ? '이 원정대로 제안하기' : `${need - sel.length}명 더 고르세요`, 'propose', {}, 'primary big avgo', sel.length !== need)}<p class="small muted">제안 전에 다 같이 이야기해 보세요. 다시 누르면 선택이 취소돼요.</p></div>`;
      } else {
        h += `<div class="panel avteam avwatch"><div class="avt-h"><b>${IM('mordred')} ${U.nm(P, S.lead)}님이 고르는 중</b><span>${S.quest + 1}번째 원정대 ${need}명 · 실시간으로 보여요</span></div>${slots}
<div class="avlive-p">${P.map((p, i) => `<span class="${sel.includes(i) ? 'on' : ''}">${avSh(P, i)}${avNm(P, i)}${sel.includes(i) ? ' ✔' : ''}</span>`).join('')}</div><p class="small muted" style="text-align:center">${sel.length === need ? '다 골랐어요! 곧 제안할 거예요.' : '의견을 말해 보세요!'}</p></div>`;
      }
    } else if (S.phase === 'vote') {
      const head = `<div class="avt-h"><b>${S.quest + 1}번째 원정대 찬반 투표</b><span>대장 ${U.nm(P, S.lead)}님 제안</span></div><div class="avslots">${S.team.map(i => `<span class="avslot full" style="--pc:${U.pc(i)}">${avSh(P, i)}${avNm(P, i)}</span>`).join('')}</div>`;
      if (ui._local) {
        const bots = ids(P).filter(i => P[i].bot);
        h += `<section class="panel avteam">${head}
<div class="avhand"><b>✊ 모두 주먹을 쥐고 "하나, 둘, 셋!"</b><div class="avhand-r"><span>${IM('yes', 'big')} 엄지 위로<b>찬성</b></span><span>${IM('no', 'big')} 주먹 그대로<b>반대</b></span></div><small>찬성이 과반이면 가결 · 반대가 같거나 많으면 부결</small></div>
${bots.length ? (bots.every(i => S.votes[i] !== undefined) ? `<div class="avbots"><b>🤖 AI의 손</b><div>${bots.map(i => `<span class="${S.votes[i] ? 'y' : 'n'}">${U.nm(P, i)} ${S.votes[i] ? '👍 찬성' : '✊ 반대'}</span>`).join('')}</div><small>AI의 표도 함께 세어서 가결/부결을 눌러 주세요.</small></div>` : '<div class="avbots"><b>🤖 AI가 생각하는 중…</b></div>') : ''}
<div class="avres2">${U.btn('<b>가결</b><small>찬성이 더 많아요</small>', 'vres', {ok: true}, 'avr-ok')}${U.btn(`<b>부결</b><small>${S.rej === 4 ? '5번째 부결 → 악 승리!' : '반대가 같거나 많아요'}</small>`, 'vres', {ok: false}, 'avr-no')}</div>${rejStrip(S)}</section>`;
      } else {
        const done = ids(P).filter(i => S.votes[i] !== undefined).length, mine2 = me >= 0 && S.votes[me] !== undefined;
        h += `<section class="panel avteam">${head}
<div class="avlive"><div class="avlive-n"><b>${done}</b> / ${n}</div><small>명이 투표했어요 · 모두 내면 누가 찬성·반대했는지 공개돼요</small><div class="avlive-bar"><i style="width:${(done / n * 100).toFixed(0)}%"></i></div><div class="avlive-p">${P.map((p, i) => `<span class="${S.votes[i] !== undefined ? 'on' : ''}">${avSh(P, i)}${avNm(P, i)}${S.votes[i] !== undefined ? ' <b class="avsealed">✉</b>' : ' …'}</span>`).join('')}</div></div>
${me < 0 ? '' : mine2 ? `<div class="avmine ${S.votes[me] ? 'y' : 'n'}">내 선택: <b>${S.votes[me] ? `${IM('yes')} 찬성` : `${IM('no')} 반대`}</b><small>모두 내기 전까지는 바꿀 수 있어요</small></div><div class="avyn ch">${U.btn(S.votes[me] ? '✔ 찬성 (선택됨)' : `${IM('yes')} 찬성으로 바꾸기`, 'vote', {ok: true}, 'avy big' + (S.votes[me] ? ' cur' : ''), !!S.votes[me])}${U.btn(!S.votes[me] ? '✔ 반대 (선택됨)' : `${IM('no')} 반대로 바꾸기`, 'vote', {ok: false}, 'avn big' + (!S.votes[me] ? ' cur' : ''), !S.votes[me])}</div>` : `<div class="avhow">이 원정대로 출발할까요? 몰래 골라 주세요.</div><div class="avyn">${U.btn(`${IM('yes')} 찬성`, 'vote', {ok: true}, 'avy big')}${U.btn(`${IM('no')} 반대`, 'vote', {ok: false}, 'avn big')}</div>`}${rejStrip(S)}</section>`;
      }
    } else if (S.phase === 'vresult') {
      const V = S.vr || {}, last5 = !V.ok && S.rej >= 5;
      const el = avFresh('vr' + S.hist.length + (S._g || ''), 2);
      h += `<section class="avb2 ${V.ok ? 'ok' : 'no'}"${animAttr(el)}><small>${(V.q || 0) + 1}번째 원정대 투표 결과</small><div class="avstamp">${V.ok ? '가결' : '부결'}</div>${V.y != null ? avTally(V.y, V.n) : ''}${V.yes && (V.yes.length || V.no.length) ? `<div class="avcols"><div class="avcol y"><small>👍 찬성${V.hand ? ' (AI)' : ''}</small>${V.yes.map((i, k) => avChip(P, i, k)).join('') || '<span class="x">없음</span>'}</div><div class="avcol n"><small>✊ 반대${V.hand ? ' (AI)' : ''}</small>${V.no.map((i, k) => avChip(P, i, k + V.yes.length)).join('') || '<span class="x">없음</span>'}</div></div>` : ''}<div class="avl">${V.ok ? `<span class="avl-t">⚔ 원정대</span>${S.team.map(i => avChip(P, i)).join('')}` : last5 ? '5번 연속 부결! 악의 세력이 이겨요' : `연속 부결 ${S.rej} / 5`}</div>
${me >= 0 ? U.btn(V.ok ? '⚔ 원정 출발하기' : last5 ? '결과 보기' : '↻ 다시 원정대 구성하기', 'vnext', {}, 'avnext') : ''}<small class="avnext-s">누구든 한 명이 누르면 모두 다음으로 넘어가요</small></section>`;
    } else if (S.phase === 'quest') {
      const sub = S.team.filter(i => S.cards[i] !== undefined).length, sz = S.team.length;
      h += `<section class="avquest"><div class="avt-h"><b>${S.quest + 1}번째 원정 출발</b><span>${S.team.map(i => U.nm(P, i)).join(' · ')}</span></div>
<div class="avdeck">${S.team.map((i, k) => `<span class="avback ${k < sub ? 'in' : ''}">${k < sub ? '⚜' : ''}</span>`).join('')}</div><div class="avdeck-n">카드 제출 <b>${sub}</b> / ${sz}</div>`;
      if (mine) h += `<div class="avhow">아무도 못 보게 몰래 한 장을 내세요.</div><div class="avplay">${U.btn(`<i>${IM('sun', 'big')}</i><b>성공</b><small>원정을 돕는다</small>`, 'card', {ok: true}, 'avpc ok')}${isEvil(r) ? U.btn(`<i>${IM('blood', 'big')}</i><b>실패</b><small>원정을 망친다</small>`, 'card', {ok: false}, 'avpc no') : U.gb(`<i>${IM('blood', 'big')}</i><b>실패</b><small>원정을 망친다</small>`, 'nofail', 1, 'avpc no')}</div>${ui.nofail ? `<div class="avnofail" data-k="${ui.nofail}">🚫 선의 세력은 실패 카드를 낼 수 없어요!<small>성공 카드를 내 주세요.</small></div>` : ''}`;
      else if (S.team.includes(me)) h += `<div class="avhow">카드를 냈어요. 다른 원정대원을 기다려요.</div>`;
      else h += `<div class="avhow">원정대가 몰래 카드를 내는 중이에요. 표정을 살펴보세요 👀</div>`;
      h += `</section>`;
    } else if (S.phase === 'reveal') {
    } else if (S.phase === 'qres') {
      const L = S.last || {}, w2 = S.res.filter(Boolean).length, l2 = S.res.length - w2, endNow = l2 >= 3;
      const qel = avFresh('q' + S.res.length + S.role.join(''), 2.2 + (L.sz || 3) * 0.6);
      h += `<section class="avqdone"${qel < 0 ? ' data-still' : ` style="--el:${qel.toFixed(2)}s;--sd:${(1.4 + (L.sz || 3) * 0.6).toFixed(1)}s"`}><b>${endNow ? '원정이 3번 실패했어요…' : `다음은 ${S.quest + 1}번째 원정이에요`}</b><p>${endNow ? '모두 확인했으면 결과를 보세요.' : `결과를 다 확인했으면 원정대를 새로 꾸려요.<br>다음 대장: <b>${U.nm(P, (S.lead + 1) % n)}</b>님`}</p>${me >= 0 ? U.btn(endNow ? '결과 보기' : '⚜ 다음 원정대 구성하기', 'qnext', {}, endNow ? 'avk-go' : 'primary big avgo') : ''}<small class="muted">누구든 한 명이 누르면 모두 다음으로 넘어가요</small></section>`;
    } else if (S.phase === 'qdone') {
      const qel = avFresh('q' + S.res.length + S.role.join(''), 2.2 + S.last.sz * 0.6);
      h += `<section class="avqdone"${qel < 0 ? ' data-still' : ` style="--el:${qel.toFixed(2)}s;--sd:${(1.4 + S.last.sz * 0.6).toFixed(1)}s"`}><b>선의 세력이 원정 3번을 성공했어요!</b><p>하지만 아직 끝나지 않았어요…<br>모두 준비되면 다음으로 넘어가세요.</p>${me >= 0 ? U.btn('🗡 다음: 암살의 시간', 'tokill', {}, 'avk-go') : ''}</section>`;
    }
    // quest track
    const w = S.res.filter(Boolean).length, l = S.res.length - w;
    let trackAnim = '';
    if (S.last && S.last.k === 'quest' && S.phase !== 'reveal') { const qel = avFresh('q' + S.res.length + S.role.join(''), 2.2 + S.last.sz * 0.6); if (qel >= 0) trackAnim = ` style="--el:${qel.toFixed(2)}s;--sd:${(0.6 + S.last.sz * 0.6).toFixed(1)}s" data-late`; }
    h += `<section class="avtrack-w"${trackAnim}><div class="avscore"><span class="g">선 <b>${w}</b></span><i>원정 현황</i><span class="e"><b>${l}</b> 악</span></div><div class="avtrack">${ASIZE[n].map((sz, q) => { const done = q < S.res.length, now = q === S.quest && !end; return `<div class="avm ${done ? (S.res[q] ? 'ok' : 'no') : now ? 'now' : ''}"><div class="avm-c">${done ? (S.res[q] ? '⚔' : '✕') : `<b>${sz}</b>`}</div><small>${done ? (S.res[q] ? '성공' : `실패${S.fails[q] > 1 ? ' ' + S.fails[q] : ''}`) : `${q + 1}차 · ${sz}명`}${!done && needFail(n, q) > 1 ? '<em>실패 2장</em>' : ''}</small></div>`; }).join('')}</div></section>`;
    h += `<section class="avqh${ui.qh ? ' open' : ''}">${U.ub(ui.qh ? '📜 원정 기록 닫기' : `📜 원정 기록 보기 (${(S.qlog || []).length}/5)`, 'qh', true, 'avqh-btn')}${ui.qh ? questLog(S, P) : ''}</section>`;
    h += `<div class="seats">${P.map((p, i) => `<div class="seat ${i === S.lead && !end ? 'on' : ''}" data-avs="${i}" style="--pc:${U.pc(i)}"><span>${i === S.lead && !end ? '♛ ' : ''}${avSh(P, i)}${avNm(P, i)}</span>${S.team.includes(i) && (S.phase === 'vote' || S.phase === 'quest') ? '<small>원정대</small>' : ''}${S.phase === 'vote' && S.votes[i] !== undefined ? '<small>투표함</small>' : ''}${S.phase === 'look' && S.seen[i] ? '<small>확인</small>' : ''}${end ? `<small class="${isEvil(S.role[i]) ? 'av-et' : 'av-gt'}">${AR[S.role[i]]}</small>` : ''}</div>`).join('')}</div>`;
    if (!end && S.phase !== 'kill' && S.phase !== 'kshow') h += avRules(S, P);
    if (S.hist.length) h += histHTML(S, P);
    return h;
  },
  splash: true,
  allTurn(S) { return S.phase === 'kshow' ? '🗡 정체 확인' : S.phase === 'cfg' ? '역할 구성 고르기' : S.phase === 'qres' ? '원정 결과' : S.phase === 'vresult' ? '투표 결과' : S.phase === 'vote' ? '모두 함께 투표' : S.phase === 'qdone' ? '원정 3번 성공!' : S.phase === 'kill' ? '🗡 암살의 시간' : S.phase === 'reveal' ? '모두 함께 결과 보기' : S.phase === 'vote' ? '모두 함께 투표' : ''; },
  open(S) { return S.phase === 'kshow' || S.phase === 'cfg' || S.phase === 'qres' || S.phase === 'vresult' || S.phase === 'vote' || S.phase === 'team' || S.phase === 'reveal' || S.phase === 'kill' || S.phase === 'qdone'; },
  uiAct(ui, S, me, name, val) {
    if (name === 'draw') { ui.drawn = true; ui.dk = val; return; }
    if (name === 'nofail') { ui.nofail = (ui.nofail || 0) + 1; return; }
    if (name === 'kt') { ui.kt = ui.kt === val ? null : val; return; }
    if (name === 'vv') { ui.vv = Object.assign({}, ui.vv); ui.vv[val[0]] = val[1]; return; }
    if (name !== 'pick') return; // (예전 방식: 이제 대장 선택은 게임 상태로 공유돼요)
    const s = Array.isArray(ui.pick) ? ui.pick.slice() : [];
    const i = s.indexOf(val); if (i >= 0) s.splice(i, 1); else s.push(val);
    ui.pick = s;
  }
};
/* ---------- 움직임 (화면 구성은 그대로, 효과만) ---------- */
function avFx(S, me, P) {
  const W = window; W.__avfx = W.__avfx || {};
  const gid = S._g || S.role.join('');
  const nv = ids(P).filter(i => S.votes && S.votes[i] !== undefined);
  const cur = {lead: S.lead, ph: S.phase, h: S.hist.length, cs: Object.keys(S.cards || {}).sort().join(','), vs: nv.join(','), res: S.res.length, end: !!S.winner || S.phase === 'end', draft: (S.draft || []).join(',')};
  const rec = W.__avfx[gid]; W.__avfx[gid] = cur;
  if (!rec || !document.querySelector('.avw')) return;
  const still = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) return;
  const $ = q => document.querySelector(q), seat = i => $(`.seats [data-avs="${i}"]`);
  // 단계가 바뀌면: 화면 조각들이 차례로 떠오르고, 큰 알림
  if (cur.ph !== rec.ph) {
    document.querySelectorAll('.avw > section, .avw > .panel, .avw > div').forEach((e, k) => e.animate && e.animate([{opacity: 0, transform: 'translateY(14px) scale(.98)'}, {opacity: 1, transform: 'none'}], {duration: 450, delay: Math.min(k, 6) * 60, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'backwards'}));
    const B = {team: rec.ph === 'vresult' || rec.ph === 'qres' || rec.ph === 'look' ? ['♛ 원정대 구성', `${U.nm(P, S.lead)}님이 대장이에요`, 'g'] : null, vote: ['🗳 찬반 투표!', '이 원정대로 출발할까요?', 'b'], quest: ['⚔ 원정 출발!', '원정대는 몰래 카드를 내요', 'q'], reveal: ['🔒 카드 봉인 완료', '다 같이 결과를 확인해요', 'q'], kill: ['🗡 암살의 시간', '암살자가 멀린을 찾아요', 'k']}[cur.ph];
    if (B) setTimeout(() => banner(B[0], B[1], B[2]), 120);
    if (cur.ph === 'vresult' && S.vr) setTimeout(() => burst($('.avstamp'), S.vr.ok ? ['#F5C542', '#FFFFFF', '#8EC5FF'] : ['#9AA3B5', '#E5484D', '#5F5848'], S.vr.ok ? 26 : 14), 450);
    if ((cur.ph === 'qres' || cur.ph === 'qdone') && cur.res > rec.res) {
      const ok = S.res[S.res.length - 1], d = 900 + ((S.last && S.last.sz) || 3) * 600;
      setTimeout(() => { burst($('.avb2 .avstamp') || $('.avb2'), ok ? ['#F5C542', '#3E7BFA', '#FFFFFF'] : ['#E5484D', '#7A0F1C', '#2B0A10'], ok ? 34 : 22); if (!ok) shake('.avb2'); }, d);
    }
    if (cur.ph === 'kshow') { const as = S.role.indexOf('AS'); fly(`<span class="avfx-dag">${IM('assassin', 'big')}</span>`, seat(as), $('.avk-target') || seat(S.shot), {w: 64, h: 64, dur: 950, lift: -70, rot: 360, done: () => shake('.avk-target')}); }
  }
  // 대장이 바뀌면 왕관이 날아가요
  if (cur.lead !== rec.lead && !cur.end && rec.ph !== 'cfg') {
    fly(`<span class="avfx-crown">${IM('mordred', 'big')}</span>`, seat(rec.lead), seat(cur.lead), {w: 50, h: 50, dur: 900, lift: -70, done: () => pop(seat(cur.lead))});
    setTimeout(() => pop($('.avlead')), 300);
  }
  // 대장이 고를 때마다 칸이 톡 튀어요
  if (cur.ph === 'team' && cur.draft !== rec.draft) { document.querySelectorAll('.avslot.full').forEach(e => e.classList.add('avfx-in')); }
  // 누가 투표하면 그 사람 칸이 반짝
  if (cur.ph === 'vote' && cur.vs !== rec.vs) {
    const before = new Set((rec.ph === 'vote' ? rec.vs : '').split(',').filter(Boolean));
    nv.filter(i => !before.has(String(i))).forEach(i => { pop(document.querySelectorAll('.avlive-p > span')[i]); pop(seat(i)); });
    pop($('.avlive-n b'));
  }
  // 원정 카드를 내면 카드가 날아가요
  if (cur.ph === 'quest' && cur.cs !== rec.cs) {
    const before = new Set((rec.ph === 'quest' ? rec.cs : '').split(',').filter(Boolean));
    cur.cs.split(',').filter(x => x && !before.has(x)).forEach((x, j) => fly('<span class="avfx-card">⚜</span>', seat(+x), $('.avdeck') || $('.avquest'), {w: 38, h: 54, dur: 800, delay: j * 140, lift: -60, rot: 14, done: () => pop($('.avdeck-n b'))}));
  }
  if (cur.end && !rec.end) setTimeout(() => confetti(S.wt !== 'killmiss'), 700);

  function pop(e) { if (e && e.animate) e.animate([{transform: 'scale(1)'}, {transform: 'scale(1.18)', filter: 'brightness(1.25)'}, {transform: 'scale(1)'}], {duration: 420, easing: 'cubic-bezier(.3,1.6,.5,1)'}); }
  function shake(q) { const e = typeof q === 'string' ? $(q) : q; if (e && e.animate) e.animate([{transform: 'none'}, {transform: 'translateX(-8px) rotate(-1deg)'}, {transform: 'translateX(8px) rotate(1deg)'}, {transform: 'none'}], {duration: 320, iterations: 2}); }
  function fly(html, src, dst, o) {
    if (!src || !dst) { if (o.done) o.done(); return; }
    const a = src.getBoundingClientRect(), b = dst.getBoundingClientRect(); if (!a.width || !b.width) return;
    const el = document.createElement('div'); el.className = 'avfx-fly'; el.innerHTML = html;
    el.style.cssText = `left:${a.left + a.width / 2 - o.w / 2}px;top:${a.top + a.height / 2 - o.h / 2}px;width:${o.w}px;height:${o.h}px`;
    document.body.appendChild(el);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    el.animate([{transform: 'translate(0,0) scale(.5)', opacity: 0}, {transform: 'translate(0,-10px) scale(1.15)', opacity: 1, offset: .15},
      {transform: `translate(${dx / 2}px,${dy / 2 + (o.lift || -60)}px) scale(1.35) rotate(${(o.rot || 0) / 2}deg)`, opacity: 1, offset: .55},
      {transform: `translate(${dx}px,${dy}px) scale(1) rotate(${o.rot || 0}deg)`, opacity: .85}],
    {duration: o.dur || 800, delay: o.delay || 0, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both'}).onfinish = () => { el.remove(); if (o.done) o.done(); };
  }
  function banner(big, small, kind) {
    document.querySelectorAll('.avfx-banner').forEach(e => e.remove());
    const el = document.createElement('div'); el.className = 'avfx-banner ' + kind;
    el.innerHTML = `<b>${U.esc(big)}</b><small>${U.esc(small)}</small>`; const wr = $('.avw') && $('.avw').getBoundingClientRect(); if (wr && wr.width) el.style.left = (wr.left + wr.width / 2) + 'px'; document.body.appendChild(el);
    el.animate([{transform: 'translate(-50%,-50%) scale(.5)', opacity: 0}, {transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1, offset: .15}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .7}, {transform: 'translate(-50%,-58%) scale(.95)', opacity: 0}], {duration: 1600, easing: 'ease-out', fill: 'both'}).onfinish = () => el.remove();
  }
  function burst(src, cols, n) {
    if (!src) return; const r = src.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let k = 0; k < n; k++) {
      const el = document.createElement('div'); el.className = 'avfx-spark';
      const s = 6 + Math.random() * 8; el.style.cssText = `left:${cx}px;top:${cy}px;width:${s}px;height:${s}px;background:${cols[k % cols.length]}`;
      document.body.appendChild(el);
      const ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 140;
      el.animate([{transform: 'translate(-50%,-50%) scale(1)', opacity: 1}, {transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px),calc(-50% + ${Math.sin(ang) * dist + 40}px)) scale(.3) rotate(${Math.random() * 540}deg)`, opacity: 0}], {duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'both'}).onfinish = () => el.remove();
    }
  }
  function confetti(evil) {
    const cols = evil ? ['#E5484D', '#7A0F1C', '#2B0A10', '#FF8A8E'] : ['#F5C542', '#3E7BFA', '#FFFFFF', '#8EC5FF'];
    for (let k = 0; k < 70; k++) {
      const el = document.createElement('div'); el.className = 'avfx-conf';
      el.style.cssText = `left:${Math.random() * 100}vw;background:${cols[k % cols.length]};width:${6 + Math.random() * 8}px;height:${10 + Math.random() * 12}px`;
      document.body.appendChild(el);
      el.animate([{transform: 'translateY(-30px) rotate(0)', opacity: 1}, {transform: `translate(${(Math.random() - .5) * 200}px,${innerHeight + 40}px) rotate(${(Math.random() - .5) * 900}deg)`, opacity: .9}],
        {duration: 2400 + Math.random() * 2000, delay: Math.random() * 1500, easing: 'cubic-bezier(.3,.1,.7,1)', fill: 'both'}).onfinish = () => el.remove();
    }
  }
}
function avTally(y, n) {
  const w = y + n ? Math.round(y / (y + n) * 100) : 50;
  return `<div class="avbig avtally"><span class="y"><i>${IM('yes', 'big')}</i><b>${y}</b><small>찬성</small></span><span class="vs">VS</span><span class="n"><i>${IM('no', 'big')}</i><b>${n}</b><small>반대</small></span></div><div class="avratio" style="--w:${w}%"><i></i></div>`;
}
function rejStrip(S) {
  return `<div class="avrej ${S.rej >= 3 ? 'hot' : ''}"><div class="avrej-t"><b>⚠ 반대가 찬성과 같거나 많으면 부결</b><span>5번 연속 부결되면 <b>악의 세력 승리</b></span></div><div class="avpips">${[1,2,3,4,5].map(k => `<i class="${k <= S.rej ? 'on' : ''}">${k}</i>`).join('')}</div><div class="avrej-n">연속 부결 <b>${S.rej}</b> / 5${S.rej === 4 ? ' · 이번에 부결되면 악 승리!' : ''}</div></div>`;
}
function avRules(S, P) {
  const n = P.length, q = Math.min(S.quest, 4), sz = ASIZE[n][q], nf = needFail(n, q);
  const good = S.role.filter(r => !isEvil(r)), evil = S.role.filter(isEvil);
  const cnt = a => Object.entries(a.reduce((o, r) => (o[AR[r]] = (o[AR[r]] || 0) + 1, o), {})).map(([k, v]) => v > 1 ? `${k} ${v}` : k).join(' · ');
  return `<section class="avrule"><div class="avr-h">이번 라운드 규칙 · ${n}명 게임${n === 4 ? ' (변형)' : ''}</div>
<div class="avr-big"><div><small>지금</small><b>${q + 1}번째 원정</b></div><div><small>원정대</small><b>${sz}명</b></div><div><small>실패 조건</small><b>실패 ${nf}장${nf > 1 ? '↑' : ''}</b></div><div class="${S.rej >= 3 ? 'warn' : ''}"><small>연속 부결</small><b>${S.rej} / 5</b></div></div>
<ul class="avr-l"><li><b>구성</b> 선 ${good.length}명(${cnt(good)}) vs 악 ${evil.length}명(${cnt(evil)})</li><li><b>투표</b> 공개 투표 · 찬성이 과반이어야 출발 · <b class="avred">반대가 같거나 많으면 부결, 5번 연속 부결이면 악 승리</b></li><li><b>원정</b> 선은 성공만 · 실패 ${nf}장${nf > 1 ? ' 이상' : '만'} 나와도 원정 실패</li><li><b>승리</b> 성공 3번 → 선(단, 암살자가 멀린을 맞히면 악) · 실패 3번 → 악</li></ul>${S.phase === 'vote' || S.phase === 'vresult' ? '' : rejStrip(S)}</section>`;
}
function avBanner(S, P) {
  const L = S.last; if (!L) return '';
  const w = S.res.filter(Boolean).length, l = S.res.length - w;
  const prog = `<div class="avprog"><div class="avdots">${[0,1,2,3,4].map(q => `<span class="avd ${q < S.res.length ? (S.res[q] ? 'ok' : 'no') : ''}">${q < S.res.length ? (S.res[q] ? '⚔' : '✕') : q + 1}</span>`).join('')}</div><div>원정 현황 · 성공 ${w} : 실패 ${l}</div></div>`;
  if (L.k === 'vote') {
    const el = avFresh('v' + S.hist.length + S.role.join(''), 3);
    return `<section class="avb2 ${L.ok ? 'ok' : 'no'}"${animAttr(el)}><small>${L.q + 1}번째 원정대 투표 결과</small><div class="avstamp">${L.ok ? '가결' : '부결'}</div>${L.yes ? avTally(L.yes.length, L.no.length) : ''}<div class="avl">${L.ok ? `<span class="avl-t">⚔ 원정대 출발</span>${L.team.map(i => avChip(P, i)).join('')}` : `연속 부결 ${S.rej} / 5${S.rej ? ' · 5번이면 악 승리' : ''}`}</div>${prog}</section>`;
  }
  const el = avFresh('q' + S.res.length + S.role.join(''), 2.2 + L.sz * 0.6);
  const cards = U.shuffle(Array(L.sz - L.f).fill(1).concat(Array(L.f).fill(0)));
  const R0 = typeof window !== 'undefined' ? window : globalThis; R0.__avCards = R0.__avCards || {};
  const ck = 'q' + S.res.length + S.role.join(''); if (!R0.__avCards[ck]) R0.__avCards[ck] = cards; const cs = R0.__avCards[ck];
  return `<section class="avb2 q ${L.ok ? 'ok' : 'no'}"${el < 0 ? ' data-still' : ` style="--el:${el.toFixed(2)}s;--sd2:${(0.5 + L.sz * 0.6).toFixed(1)}s"`}><small>${L.q + 1}번째 원정 결과 · ${L.team.map(i => U.nm(P, i)).join(', ')}</small><div class="avflip">${cs.map((c, k) => `<span class="avfc ${c ? 'ok' : 'no'}" style="--k:${k}"><i class="b">⚜</i><i class="f">${c ? `${IM('sun', 'big')}<b>성공</b>` : `${IM('blood', 'big')}<b>실패</b>`}</i></span>`).join('')}</div><div class="avstamp" style="--sd:${(0.5 + L.sz * 0.6).toFixed(1)}s">원정 ${L.ok ? '성공' : '실패'}</div><div class="avbig avlate" style="--sd:${(0.9 + L.sz * 0.6).toFixed(1)}s">실패 카드 ${L.f}장</div><div class="avlate" style="--sd:${(1.1 + L.sz * 0.6).toFixed(1)}s">${prog}</div></section>`;
}
function avDeck(n) {
  const k = Math.min(Math.max(n, 5), 7), mid = (k - 1) / 2, step = 8;
  return `<section class="avdraw"><small>운명의 카드</small><b>역할 카드를 한 장 뽑으세요</b><div class="avfan">${Array.from({length: k}, (_, i) => U.gb('<span>⚜</span>', 'draw', i, 'avdc', false).replace('class="btn avdc', `style="--r:${((i - mid) * step).toFixed(1)}deg;--y:${(Math.abs(i - mid) * 6).toFixed(0)}px;--d:${(i * 0.07).toFixed(2)}s" class="btn avdc`)).join('')}</div><p>마음에 드는 카드를 눌러 뒤집어요. 뽑은 카드는 나만 보세요!</p></section>`;
}
function roleCard(S, me, P, big) {
  const r = S.role[me], ev = isEvil(r), el = big ? avFresh('look' + me + S.role.join(''), 1.6) : -1;
  const know = [];
  if (r === 'ME') { know.push({t: '악의 세력', who: ids(P).filter(i => isEvil(S.role[i]) && S.role[i] !== 'MD'), c: 'e'}); if (S.role.includes('MD')) know.push({note: '모드레드는 이 목록에 없어요.'}); }
  if (r === 'PE' && !S.role.includes('MO')) know.push({t: '멀린', who: ids(P).filter(i => S.role[i] === 'ME'), c: 'g'});
  else if (r === 'PE') know.push({t: '멀린 후보 (한 명은 모르가나)', who: ids(P).filter(i => S.role[i] === 'ME' || S.role[i] === 'MO'), c: 'g'});
  if (ev && r !== 'OB') { know.push({t: '함께하는 동료', who: ids(P).filter(i => i !== me && isEvil(S.role[i]) && S.role[i] !== 'OB'), c: 'e', role: true}); if (S.role.includes('OB')) know.push({note: '오베론도 악의 편이지만 누군지 몰라요.'}); }
  return `<section class="avrc${big ? ' big' : ''}"${big ? animAttr(el) : ' data-still'}><div class="avrc-side">${ev ? '악의 세력 · 모드레드의 편' : '선의 세력 · 아서 왕의 편'}</div><div class="avrc-art">${U.img(AIMG[r], 'role')}</div><div class="avrc-name">${AR[r]}</div><p class="avrc-desc">${r === 'PE' && !S.role.includes('MO') ? '진짜 멀린이 누군지 알아요. 멀린을 돕되, 마지막 암살을 피하도록 내가 멀린인 척해 주세요.' : ARD[r]}</p>${know.map(k => k.note ? `<div class="avrc-note">${k.note}</div>` : `<div class="avrc-k"><small>${k.t}</small><div>${k.who.map(i => `<span>${U.nm(P, i)}${k.role ? ` <em>${AR[S.role[i]]}</em>` : ''}</span>`).join('') || '<span class="x">없음</span>'}</div></div>`).join('')}</section>`;
}
function avKill(S, me, ui, P) {
  const as = S.role.indexOf('AS'), isAs = me === as, kt = ui.kt;
  const goods = ids(P).filter(i => !isEvil(S.role[i])), evils = ids(P).filter(i => isEvil(S.role[i]));
  let h = `<section class="avkill"><div class="avk-ttl"><span class="avk-dag">${IM('assassin', 'big')}</span><b>암살의 시간</b></div>
<p class="avk-sub">선의 세력이 원정 3번을 성공했어요.<br>하지만 아직 끝나지 않았어요…</p>
<div class="avk-who">암살자 <b>${U.nm(P, as)}</b>님이 멀린을 찾습니다</div>
<div class="avk-evil">악의 세력: ${evils.map(i => `<span>${U.nm(P, i)} <small>${AR[S.role[i]]}</small></span>`).join('')}</div>`;
  if (isAs) {
    h += `<div class="avk-q">누가 멀린일까요?</div><div class="avk-grid">${goods.map(i => U.gb(`<span class="pdot" style="--pc:${U.pc(i)}"></span><span>${U.nm(P, i)}</span>${kt === i ? '<em>🎯</em>' : ''}`, 'kt', i, 'avk-t' + (kt === i ? ' sel' : ''))).join('')}</div>`;
    h += kt != null ? U.btn(`🗡 ${U.nm(P, kt)}님을 암살한다`, 'kill', {t: kt}, 'avk-go') : `<div class="avk-hint">한 명을 고른 뒤 암살 버튼을 누르세요. 동료들과 상의해도 돼요.</div>`;
  } else if (me >= 0 && isEvil(S.role[me])) h += `<div class="avk-hint">암살자와 함께 멀린이 누군지 상의하세요!</div>`;
  else h += `<div class="avk-hint">선의 세력은 표정 관리! 멀린을 들키지 마세요.</div>`;
  return h + `</section>`;
}
function avEnd(S, P) {
  const key = 'av' + S.role.join('') + (S.shot == null ? '' : S.shot) + S.wt + S.res.length + S.hist.length;
  const el0 = avFresh(key, 6), fresh = el0 >= 0, el = Math.max(el0, 0);
  const evilWin = S.wt !== 'killmiss', mer = S.role.indexOf('ME'), as = S.role.indexOf('AS');
  let h = `<section class="avend ${evilWin ? 'evil' : 'good'}${fresh ? '' : ' still'}" style="--el:${fresh ? el.toFixed(2) : 0}s">`;
  if (S.wt === 'killhit' || S.wt === 'killmiss') {
    const hit = S.wt === 'killhit';
    h += `<div class="ave-s1">🗡 암살자 <b>${U.nm(P, as)}</b>님이 지목한 사람은…</div>
<div class="ave-target ${hit ? 'hit' : 'miss'}"><span class="pdot" style="--pc:${U.pc(S.shot)}"></span><b>${U.nm(P, S.shot)}</b><small>${AR[S.role[S.shot]]}</small></div>
<div class="ave-stamp">${hit ? '멀린이었다!' : '멀린이 아니다!'}</div>
${hit ? '' : `<div class="ave-real">진짜 멀린은 <b>${U.nm(P, mer)}</b>님이었어요 ✨</div>`}`;
  } else {
    h += `<div class="ave-s1">${S.wt === 'rej' ? '원정대 제안이 5번 연속 부결되었어요…' : '원정이 3번 실패했어요…'}</div>`;
  }
  h += `<div class="ave-win"><small>${evilWin ? '모드레드의 그림자가 원탁을 덮었습니다' : '아서 왕의 원탁이 지켜졌습니다'}</small><b>${evilWin ? '악의 세력 승리' : '선의 세력 승리'}</b></div>
<div class="ave-teams"><div class="g"><small>선의 세력</small>${ids(P).filter(i => !isEvil(S.role[i])).map(i => `<span>${U.nm(P, i)} <em>${AR[S.role[i]]}</em></span>`).join('')}</div><div class="e"><small>악의 세력</small>${ids(P).filter(i => isEvil(S.role[i])).map(i => `<span>${U.nm(P, i)} <em>${AR[S.role[i]]}</em></span>`).join('')}</div></div></section>`;
  return h;
}
/* ---------- AI 참가자 ---------- */
const SIZES = ASIZE;
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
  // 사람처럼: 내가 대장으로 꾸린 원정대는 항상 찬성해요
  if (me === S.lead) return true;
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
function botStep(S, P) {
  if (!S || S.winner || S.phase === 'end') return false;
  const n = P.length, isBot = i => P[i] && P[i].bot;
  let acted = false;
  const run = (i, t, a) => { try { G.avalon.act(S, i, t, a, P); acted = true; } catch (e) {} };
  if (S.phase === 'look') { for (let i = 0; i < n; i++) if (isBot(i) && !S.seen[i]) { run(i, 'seen', {}); break; } }
  else if (S.phase === 'team' && isBot(S.lead)) {
    const need = ASIZE[n][S.quest], d = S.draft || [];
    if (!S._bplan || S._bplan.q !== S.quest || S._bplan.l !== S.lead || S._bplan.r !== S.rej) S._bplan = {q: S.quest, l: S.lead, r: S.rej, t: botTeam(S, S.lead, n)};
    const nx = S._bplan.t.find(i => !d.includes(i));
    if (d.length < need && nx !== undefined) run(S.lead, 'pick', {i: nx});
    else run(S.lead, 'propose', {});
  }
  else if (S.phase === 'vote') { const i = [...Array(n).keys()].find(k => isBot(k) && S.votes[k] === undefined); if (i !== undefined) run(i, 'vote', {ok: botVote(S, i)}); }
  else if (S.phase === 'quest') { const i = S.team.find(k => isBot(k) && S.cards[k] === undefined); if (i !== undefined) run(i, 'card', {ok: botCard(S, i, n)}); }
  else if (S.phase === 'kill') { const as = S.role.indexOf('AS'); if (isBot(as)) run(as, 'kill', {t: botKill(S, n)}); }
  return acted;
}
G.avalon.botStep = botStep;
G.avalon.BOTNAMES = BOTNAMES;
function voteLine(S, P, q) {
  const h = S.hist.filter(x => x.q === q && x.ok).pop();
  if (!h || !h.bv) return '';
  const ks = Object.keys(h.bv).map(Number), yes = ks.filter(i => h.bv[i]), no = ks.filter(i => !h.bv[i]);
  const chips = arr => arr.map(i => `<span>${U.nm(P, i)}</span>`).join('') || '<span class="x">없음</span>';
  return `<div class="avqr-row y"><em>👍 찬성</em><div>${chips(yes)}</div></div><div class="avqr-row n"><em>✊ 반대</em><div>${chips(no)}</div></div>`;
}
function questLog(S, P) {
  const n = P.length, ql = S.qlog || [];
  const rows = ASIZE[n].map((sz, q) => {
    const e = ql[q];
    if (!e) {
      const now = q === S.quest && !S.winner, tries = S.hist.filter(x => x.q === q && !x.ok).length;
      return `<div class="avqr ${now ? 'now' : 'wait'}"><div class="avqr-n">${q + 1}차</div><div class="avqr-b"><b>${now ? '진행 중' : '아직 안 했어요'}</b><small>${sz}명 원정${needFail(n, q) > 1 ? ' · 실패 2장 필요' : ''}${now && tries ? ` · 부결 ${tries}번` : ''}</small>${now ? `<div class="avqr-row l"><em>♛ 대장</em><div><span>${U.nm(P, S.lead)}</span></div></div>` : ''}${now && S.team.length && ['vote', 'vresult', 'quest', 'reveal'].includes(S.phase) ? `<div class="avqr-row t"><em>⚔ 원정대</em><div>${S.team.map(i => `<span>${U.nm(P, i)}</span>`).join('')}</div></div>` : ''}</div></div>`;
    }
    return `<div class="avqr ${e.ok ? 'ok' : 'no'}"><div class="avqr-n">${q + 1}차</div><div class="avqr-b"><b>${e.ok ? '⚔ 성공' : '✕ 실패'} <em>실패 카드 ${e.f}장</em></b>${e.tries > 1 ? `<small>${e.tries}번째 제안에 가결</small>` : ''}<div class="avqr-row l"><em>♛ 대장</em><div><span>${e.lead != null ? U.nm(P, e.lead) : '?'}</span></div></div><div class="avqr-row t"><em>⚔ 원정대</em><div>${e.team.map(i => `<span>${U.nm(P, i)}</span>`).join('')}</div></div>${voteLine(S, P, q)}</div></div>`;
  }).join('');
  return `<div class="avqrs">${rows}</div>`;
}
function histHTML(S, P) {
  return `<details class="ref"><summary>투표 기록 (${S.hist.length})</summary>${S.hist.slice().reverse().map(x => `<div>${x.q + 1}원정 · 대장 ${U.nm(P, x.lead)} · [${x.team.map(i => U.nm(P, i)).join(', ')}] → <b>${x.ok ? '가결' : '부결'}</b>${x.yes ? ` · 찬성: ${x.yes.map(i => U.nm(P, i)).join(', ') || '없음'} / 반대: ${x.no.map(i => U.nm(P, i)).join(', ') || '없음'}` : ''}</div>`).join('')}</details>`;
}
})();
