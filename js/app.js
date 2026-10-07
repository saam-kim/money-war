(() => {
  'use strict';
  const D = MWData, C = MWCore, app = document.querySelector('#app');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const labels = { rehearsal: '활동 안내', newsReading: '뉴스 함께 읽기', individual: '개인 판단', discussion: '모둠 토의', responseEntry: '모둠 답안 입력', responsesLocked: '최초 답안 확정', explanation: '이유를 단계별로 확인', roundFeedback: '모둠 결과', correction: '개인 기록 고치기', individualA: '개인 확인 A', individualB: '개인 확인 B', individualAnswers: '개인 확인 해설', final: '원리와 결과 정리' };
  let state = null, view = 'landing', activeTeam = 0, selectedDetail = null, timerEnded = false, printPrepared = false, storageAvailable = true;
  let dialogReturnFocus = null;
  let rehearsalMode = false;
  let shortcutsEnabled = true;
  const shortcutKeys = { next:'N', back:'P', timerToggle:'T', timerAdd:'+', news:'V', correctionToggle:'R', teamPrev:'ArrowUp', teamNext:'ArrowDown' };
  let mutationPending = false;
  let focusAfterMutation = false;
  let renderedFrame = null;
  let resultLayoutObserver = null;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderMotions = new Set();
  function cancelRenderMotions() {
    for (const motion of renderMotions) motion.cancel();
    renderMotions.clear();
  }
  motionPreference.addEventListener('change', event => { if (event.matches) cancelRenderMotions(); });
  function animateElement(element, keyframes, duration) {
    if (!element || motionPreference.matches || typeof element.animate !== 'function') return;
    const motion = element.animate(keyframes, { duration, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    renderMotions.add(motion);
    motion.addEventListener('finish', () => renderMotions.delete(motion), { once: true });
  }
  function animateRender(previous, current) {
    if (!previous || motionPreference.matches || view === 'conflict') return;
    if (previous.screen !== current.screen) {
      animateElement(app, [{ opacity: .55 }, { opacity: 1 }], 180);
      return;
    }
    if (current.reveal <= previous.reveal) return;
    app.querySelectorAll('.chain-step:not(.pending)>div').forEach((element, index) => {
      if (index >= previous.reveal) animateElement(element, [{ opacity: .45, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], 240);
    });
    const graph = app.querySelector('#market-graph');
    if (previous.reveal < 2 && current.reveal >= 2) {
      animateElement(graph, [{ opacity: .55 }, { opacity: 1 }], 240);
    } else if (previous.reveal < 3 && current.reveal >= 3) {
      graph?.querySelectorAll('.guide,.old-point,.new-point,.rate-direction').forEach(element => animateElement(element, [{ opacity: .4 }, { opacity: 1 }], 240));
      graph?.querySelectorAll('text').forEach(element => {
        if (element.textContent.startsWith('E')) animateElement(element, [{ opacity: .4 }, { opacity: 1 }], 240);
      });
    }
  }
  let draft = { count: 5, length: 6, names: [] };
  const liveSession = MWStorage.createSession(C.STORAGE_KEY, { storage: () => window.localStorage, locks: navigator.locks });
  let session = liveSession;
  const initial = session.load();
  storageAvailable = initial.available;
  state = initial.raw && C.restore(initial.raw);
  if (initial.raw && !state) notice('저장된 기록을 읽을 수 없습니다. 새 수업을 준비해 주세요. 지원하지 않는 기록은 자동 변환하지 않습니다.');
  const migrationNotice = '이전 수업을 불러왔습니다. 최초 답안은 보존하고 원화 가치 항목을 제외한 6점 기준으로 계산합니다.';
  function notice(message) { const node = document.querySelector('#notice'); node.textContent = message; node.hidden = !message; }
  function announce(message) { document.querySelector('#announcer').textContent = message; }
  function conflict() {
    if (view === 'conflict') return;
    document.querySelector('#dialog').close();
    closeMenu(); view = 'conflict';
    notice('다른 탭에서 수업 기록이 바뀌었습니다. 최신 기록을 불러온 뒤 이어가세요.');
    render(); announce('다른 탭에서 수업 기록이 바뀌어 이 탭의 진행을 멈췄습니다.');
  }
  async function save(candidate) {
    const result = await session.commit(candidate);
    if (result.status === 'conflict') { conflict(); return false; }
    storageAvailable = result.status === 'saved';
    state = result.state;
    return true;
  }
  async function mutate(task) {
    if (mutationPending || view === 'conflict') return;
    const previousFocus = document.activeElement;
    mutationPending = true; app.inert = true; app.setAttribute('aria-busy', 'true');
    try { await task(); }
    catch (error) { notice('현재 단계에서는 이 조작을 할 수 없습니다. 선택 상태를 확인해 주세요.'); console.error(error); }
    finally {
      mutationPending = false; app.inert = false; app.removeAttribute('aria-busy'); updateSaveStatus();
      if (view === 'conflict' || focusAfterMutation) app.querySelector('h1')?.focus({ preventScroll: true });
      else if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      focusAfterMutation = false;
    }
  }
  function updateSaveStatus() {
    const status = document.querySelector('#save-status');
    if (rehearsalMode) {
      status.textContent = '수업 리허설 · 예시 답안으로 연습 중 · 실제 수업 기록에는 반영되지 않습니다.';
      status.hidden = false;
      return;
    }
    status.textContent = view === 'conflict' ? '이 탭의 이전 기록은 저장하지 않습니다.' : storageAvailable ? '' : '자동 저장을 사용할 수 없습니다. 이 창을 닫으면 진행 기록이 사라질 수 있습니다.';
    status.hidden = !status.textContent;
  }
  function startTeacherRehearsal() {
    const records = new Map();
    const memory = { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) };
    session = MWStorage.createSession(C.STORAGE_KEY, { storage: () => memory });
    session.load();
    rehearsalMode = true;
    state = C.create({ count: 5, length: 6 });
    selectedDetail = null; activeTeam = 0; timerEnded = false; printPrepared = false;
    document.querySelector('#print-root').innerHTML = '';
    view = 'lesson'; notice(''); closeMenu(); render();
  }
  function leaveTeacherRehearsal() {
    rehearsalMode = false; session = liveSession;
    const latest = session.load(); storageAvailable = latest.available;
    state = latest.raw && C.restore(latest.raw);
    selectedDetail = null; activeTeam = 0; timerEnded = false; printPrepared = false;
    document.querySelector('#print-root').innerHTML = '';
    view = 'landing'; notice(latest.raw && !state ? '저장된 기록을 읽을 수 없습니다. 새 수업을 준비해 주세요.' : ''); closeMenu(); render();
  }
  function rehearsalExamples(candidate) {
    if (!rehearsalMode || candidate.phase !== 'responseEntry' || candidate.rounds[candidate.index].entries.some(C.complete)) return candidate;
    const expected = D.rounds[candidate.index].cause, codes = Object.keys(D.causes);
    for (let team = 0; team < candidate.config.teams.length; team++) {
      if (team === 4) { candidate = C.dispatch(candidate, { type: 'missing', team }); continue; }
      const cause = team === 0 ? expected : codes[(codes.indexOf(expected) + team) % codes.length];
      const rate = team === 2 ? D.causes[expected].rate === 'up' ? 'down' : 'up' : D.causes[expected].rate;
      candidate = C.dispatch(candidate, { type: 'answer', team, field: 'cause', value: cause });
      candidate = C.dispatch(candidate, { type: 'answer', team, field: 'rate', value: rate });
    }
    return candidate;
  }
  function reloadLatest() {
    const latest = session.load(); storageAvailable = latest.available;
    if (!latest.available) { notice('저장된 기록에 접근할 수 없습니다. 브라우저 저장 설정을 확인한 뒤 다시 불러오세요.'); return; }
    state = latest.raw && C.restore(latest.raw);
    selectedDetail = null; activeTeam = 0; timerEnded = false; printPrepared = false;
    document.querySelector('#print-root').innerHTML = '';
    view = state ? 'lesson' : 'landing';
    notice(latest.raw && !state ? '저장된 기록을 읽을 수 없습니다. 새 수업을 준비해 주세요.' : state ? state.migratedFrom === 2 ? migrationNotice : '최신 기록을 불러왔습니다. 최초 답안과 공개 단계는 유지됩니다.' : '다른 탭에서 수업을 초기화했습니다. 새 수업을 준비하세요.');
    render();
  }
  function phaseLabel() {
    if (['individualA', 'individualB', 'individualAnswers', 'final'].includes(state.phase)) return labels[state.phase];
    return `${state.index + 1}라운드 ${labels[state.phase]}${state.phase === 'explanation' ? ' ' + state.rounds[state.index].reveal + '단계' : ''}`;
  }
  const button = (action, text, cls = '', disabled = false) => `<button type="button" data-action="${action}" class="${cls}" ${disabled ? 'disabled' : ''}>${text}</button>`;
  const heading = (title, subtitle = '') => `<div class="view-heading"><h1 tabindex="-1">${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>`;
  const keycap = (key, decorative = false) => `<kbd class="keycap" ${decorative ? 'aria-hidden="true"' : ''}>${key}</kbd>`;
  function inputKeyboardHint() {
    return shortcutsEnabled ? `<p class="keyboard-entry-hint"><strong id="keyboard-team">입력: ${activeTeam + 1}. ${esc(state.config.teams[activeTeam])}</strong><span>원인 ${keycap('1–4')} · 상승 ${keycap('5')} · 하락 ${keycap('6')} · 모둠 ${keycap('↑')} ${keycap('↓')}</span></p>` : '';
  }
  function applyShortcutLabels() {
    app.querySelectorAll('button[data-action]').forEach(control => {
      const key = shortcutKeys[control.dataset.action]; if (!key) return;
      const displayedKey = {ArrowUp:'↑',ArrowDown:'↓'}[key] || key;
      const label = control.querySelector('.button-label')?.textContent ?? control.textContent;
      if (shortcutsEnabled) {
        control.setAttribute('aria-keyshortcuts', key);
        control.title = `${label} · 단축키 ${displayedKey}`;
        control.innerHTML = `<span class="button-label">${esc(label)}</span>${keycap(displayedKey,true)}`;
      } else {
        control.removeAttribute('aria-keyshortcuts'); control.removeAttribute('title'); control.textContent = label;
      }
    });
  }
  function selectInputTeam(team, focus = false) {
    activeTeam = Math.max(0,Math.min(state.config.teams.length - 1,team));
    app.querySelectorAll('.team-row[data-row]').forEach(row => {
      const active = Number(row.dataset.row) === activeTeam;
      row.classList.toggle('mobile-active',active);
      row.classList.toggle('keyboard-active',shortcutsEnabled && active);
    });
    const hint = app.querySelector('#keyboard-team');
    if (hint) hint.textContent = `입력: ${activeTeam + 1}. ${state.config.teams[activeTeam]}`;
    if (focus) {
      const row = app.querySelector(`.team-row[data-row="${activeTeam}"]`);
      (row?.querySelector('input:not(:disabled)') || row?.querySelector('.missing-button'))?.focus({preventScroll:true});
      row?.scrollIntoView({block:'nearest'});
    }
  }
  function showShortcutHelp() {
    showDialog(`<h2>키보드로 수업 진행</h2><label class="setup-choice"><input type="checkbox" id="shortcuts-enabled" ${shortcutsEnabled ? 'checked' : ''}>키보드 단축키 사용</label><p>한글 입력 상태에서도 같은 위치의 키를 누릅니다. 이름 입력 중이나 메뉴·팝업을 연 동안에는 수업 단축키가 작동하지 않습니다.</p><table class="shortcut-guide"><tbody><tr><th>다음 / 이전 단계</th><td>${keycap('N')} / ${keycap('P')}</td></tr><tr><th>타이머 정지·시작 / 10초 추가</th><td>${keycap('T')} / ${keycap('+')}</td></tr><tr><th>원인 선택 · 화면의 왼쪽부터</th><td>${keycap('1')} 수요 증가 · ${keycap('2')} 수요 감소<br>${keycap('3')} 공급 증가 · ${keycap('4')} 공급 감소</td></tr><tr><th>환율 상승 / 하락</th><td>${keycap('5')} / ${keycap('6')}</td></tr><tr><th>이전 / 다음 모둠</th><td>${keycap('↑')} / ${keycap('↓')}</td></tr><tr><th>미제출 기록·해제</th><td>${keycap('0')}</td></tr><tr><th>모둠 결과 상세</th><td>${keycap('1–8')} 해당 모둠 보기</td></tr><tr><th>뉴스 다시 보기 / 수정 기록 열기·닫기</th><td>${keycap('V')} / ${keycap('R')}</td></tr><tr><th>단축키 안내 / 팝업 닫기</th><td>${keycap('H')} / ${keycap('Esc')}</td></tr></tbody></table><p>화면에 있는 버튼만 조작합니다. 입력이 끝나지 않으면 다음 단계로 넘어가지 않습니다. 키를 길게 눌러도 한 단계씩 진행합니다.</p>`);
  }
  const unit = '<p class="unit">원/달러 환율 = 1달러에 필요한 원화</p>';
  function footer(text, action, actionText, disabled = false, extra = '') {
    return `<footer class="footer">${text ? `<p>${text}</p>` : ''}<div class="actions">${state.history.length ? button('back', '이전 단계', 'quiet') : ''}${extra}${action ? button(action, actionText, 'primary', disabled) : ''}</div></footer>`;
  }
  function timer(compact = false, extraControls = '') {
    const seconds = C.remaining(state.timer), isRunning = state.timer.deadline !== null && seconds > 0;
    return `<div class="timer ${compact ? 'compact' : ''} ${seconds <= 10 && seconds > 0 ? 'closing' : ''}"><span class="clock" aria-label="남은 시간" id="timer-value">${formatTime(seconds)}</span><div class="timer-actions">${button('timerToggle', isRunning ? '일시 정지' : '타이머 시작', 'quiet', seconds === 0)}${button('timerAdd', '+10초', 'quiet')}${extraControls}</div><p class="timer-message" id="timer-message">${seconds === 0 ? '시간이 끝났습니다 · 계속 진행할 수 있습니다' : seconds <= 10 ? '마무리할 시간' : '시간이 끝나도 자동으로 넘어가지 않습니다'}</p></div>`;
  }
  function formatTime(seconds) { return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); }
  function reasoningRail() {
    return `<section class="reason-rail" aria-label="원인과 환율을 설명하는 문장 틀"><div class="reason-item"><h2 class="reason">① 원인 · 달러 수요·공급의 변화</h2><p class="reason-template">달러를 [사는 / 파는] 거래가 [늘어난다 / 줄어든다].<br>그래서 달러 [수요 / 공급]가 [증가 / 감소]한다.</p></div><div class="reason-item"><h2 class="reason">② 원/달러 환율</h2><p class="reason-template">달러 [수요 / 공급]가 [증가 / 감소]하므로,<br>원/달러 환율은 [상승 / 하락]한다.</p></div></section>`;
  }
  // Situation symbols stay neutral: no market or rate direction before a response.
  function situationGraphic(id) {
    const symbols = {
      travel: '<rect x="53" y="31" width="63" height="56" rx="8"/><path d="M73 31v-9h23v9M69 43v32M100 43v32M63 87v5M106 87v5"/><path d="m20 44 11-4 16 8-13 5-6-4-8 2z"/>',
      study: '<path d="m24 43 56-23 56 23-56 23zM43 52v24q37 22 74 0V52M136 43v34"/><path d="M129 83h14"/>',
      content: '<rect x="27" y="23" width="106" height="72" rx="8"/><path d="m70 43 27 16-27 16zM40 85h25M95 85h25"/>',
      visitors: '<rect x="34" y="27" width="57" height="65" rx="5"/><circle cx="62" cy="50" r="12"/><path d="M50 50h24M62 38q-10 12 0 24q10-12 0-24M48 75h29M48 82h18"/><rect x="99" y="47" width="29" height="41" rx="5"/><path d="M107 47v-8h13v8M106 88v5M121 88v5"/>',
      outward: '<path d="M24 92V51l29-15v18l29-15v15h30v38zM101 54V23h16v69M36 70h12v10H36zM62 70h12v10H62zM88 70h12v10H88z"/>',
      inward: '<path d="M24 92V51l29-15v18l29-15v15h30v38zM101 54V23h16v69M36 70h12v10H36zM62 70h12v10H62zM88 70h12v10H88z"/>',
      coffee: '<path d="M40 43h64v31q0 19-32 19T40 74zM104 49h10q22 0 0 26h-10M31 98h84M55 31v-9M72 31V17M89 31v-9"/>',
      remittance: '<rect x="23" y="33" width="85" height="59" rx="5"/><path d="m26 37 39 30 40-30M26 88l28-26M105 88 77 62"/><circle cx="117" cy="36" r="21"/><path d="M117 22v28M124 27h-9a6 6 0 0 0 0 12h4a6 6 0 0 1 0 12h-9"/>'
    };
    return `<svg class="situation-graphic" viewBox="0 0 160 120" aria-hidden="true" focusable="false"><circle cx="82" cy="61" r="49" fill="var(--pale)"/><circle cx="130" cy="86" r="10" fill="var(--amber)"/><g fill="none" stroke="var(--blue)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${symbols[id] || symbols.content}</g></svg>`;
  }
  function exchangeGraphic() {
    return `<svg class="exchange-graphic" viewBox="15 55 400 282" aria-hidden="true" focusable="false"><path d="M56 204v-85q0-35 35-35h256" fill="none" stroke="var(--line)" stroke-width="3"/><path d="M384 156v85q0 35-35 35H93" fill="none" stroke="var(--line)" stroke-width="3"/><g fill="var(--white)" stroke="var(--blue)" stroke-width="3"><rect x="35" y="117" width="155" height="103" rx="13"/><rect x="45" y="107" width="155" height="103" rx="13"/><rect x="240" y="150" width="155" height="103" rx="13"/><rect x="230" y="140" width="155" height="103" rx="13"/></g><circle cx="122" cy="158" r="33" fill="var(--pale)"/><circle cx="307" cy="191" r="33" fill="var(--pale)"/><g fill="var(--blue)" text-anchor="middle" font-size="44" font-weight="650"><text x="122" y="174">₩</text><text x="307" y="207">$</text></g><g fill="none" stroke="var(--blue)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M192 82h92m-13-12 13 12-13 12M248 277h-92m13-12-13 12 13 12"/></g><circle cx="352" cy="82" r="13" fill="var(--amber)"/><g fill="var(--ink)" text-anchor="middle" font-size="24" font-weight="550"><text x="122" y="324">원화</text><text x="307" y="324">달러</text></g></svg>`;
  }
  function transactionGraphic(news) {
    const buying = D.causes[news.cause].market === 'demand';
    const from = buying ? '원화' : '달러', to = buying ? '달러' : '원화';
    return `<figure class="transaction-figure"><figcaption>${buying ? '달러를 사는 거래' : '달러를 파는 거래'}</figcaption><svg class="transaction-graphic" viewBox="0 0 480 210" role="img" aria-label="${from}를 주고 ${to}를 받습니다."><rect x="16" y="26" width="156" height="108" rx="12" fill="var(--pale)"/><rect x="308" y="26" width="156" height="108" rx="12" fill="var(--pale)"/><g fill="var(--blue)" text-anchor="middle" font-size="46" font-weight="650"><text x="94" y="98">${buying ? '₩' : '$'}</text><text x="386" y="98">${buying ? '$' : '₩'}</text></g><path d="M197 80h86m-14-14 14 14-14 14" fill="none" stroke="var(--blue)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><g fill="var(--ink)" text-anchor="middle" font-size="28" font-weight="550"><text x="94" y="174">${from}를 주고</text><text x="386" y="174">${to}를 받음</text></g></svg><p class="transaction-next">다음: 달러 시장에서 확인</p></figure>`;
  }
  function newsCard(news, number = state.index + 1, level = 1) {
    const identifier = typeof number === 'number' ? String(number).padStart(2, '0') : number;
    return `<article class="news"><div class="news-meta"><span>NEWS ${identifier}</span></div><div class="news-heading"><h${level} class="news-title" tabindex="-1">${news.title}</h${level}>${situationGraphic(news.id)}</div>${news.text.split('\n\n').map(paragraph => `<p class="news-paragraph">${esc(paragraph)}</p>`).join('')}<p class="condition">다른 조건은 같습니다.</p></article>`;
  }
  function groups(team, answers, prefix = 'entry') {
    return ['cause', 'rate'].map(field => {
      const options = field === 'cause' ? Object.entries(D.causes).map(([key, cause]) => [key, cause.label, cause.label]) : [['up', '↑ 상승', '상승'], ['down', '↓ 하락', '하락']];
      const fieldName = { cause: '원인', rate: '원/달러 환율' }[field];
      const practice = prefix === 'practice';
      const legend = practice ? `${field === 'cause' ? '① 원인' : '② 환율 방향'} <small>하나 고르기</small>` : fieldName;
      return `<fieldset class="answer-group ${field}-group"><legend>${legend}</legend><div class="options">${options.map(([value, label, full]) => `<label class="option"><input type="radio" name="${prefix}-${team}-${field}" value="${value}" data-team="${team}" data-field="${field}" aria-label="${practice ? '연습' : `${team + 1}모둠`} ${fieldName}: ${full}" ${answers[field] === value && !answers.missing ? 'checked' : ''} ${answers.missing ? 'disabled' : ''}><span>${label}</span></label>`).join('')}</div></fieldset>`;
    }).join('');
  }
  function responseTable(correction = false) {
    const record = state.rounds[state.index], answers = correction ? record.corrections : record.entries;
    const content = `<div class="mobile-team-nav">${button('teamPrev', '이전 모둠', '', activeTeam === 0)}<strong>${activeTeam + 1}/${answers.length}모둠</strong>${button('teamNext', '다음 모둠', '', activeTeam === answers.length - 1)}</div><div class="team-table" role="region" aria-label="${correction ? '수정' : '모둠'} 답안 입력"><div class="team-row head" aria-hidden="true"><span>모둠</span><span>① 원인</span><span>② 환율</span><span>상태</span></div>${answers.map((a, team) => `<div class="team-row ${team === activeTeam ? 'mobile-active' : ''}" data-row="${team}"><div class="team-name"><span class="team-icon">${team + 1}</span><strong>${esc(state.config.teams[team])}</strong></div>${groups(team, a, correction ? 'correction' : 'entry')}<div class="status" data-status="${team}">${answerStatus(a)}${!correction ? `<button type="button" class="missing-button" data-missing="${team}">${a.missing ? '입력으로 전환' : '미제출로 기록'}</button>` : ''}</div></div>`).join('')}</div>`;
    return content + (correction ? '<p class="input-count" id="input-count">수정 답안은 선택 기록이며 최초 점수는 유지됩니다.</p>' : '');
  }
  function answerStatus(a) { return `<span class="${C.complete(a) ? 'complete' : ''}">${a.missing ? '미제출' : C.complete(a) ? '입력 완료' : [a.cause, a.rate].filter(Boolean).length + '/2 선택'}</span>`; }
  function answerText(a) { return !a || a.missing ? '미제출' : `${a.cause ? D.causes[a.cause].label : '원인 미선택'} / 환율 ${a.rate ? D.direction(a.rate) : '미선택'}`; }
  function chain(news, reveal) {
    const c = D.causes[news.cause], curve = c.market === 'demand' ? '수요' : '공급';
    const steps = [
      ['거래 행동', news.action, news.context || '달러를 사는 쪽인지 파는 쪽인지 확인합니다.'],
      ['외환 시장', c.label, `${curve} 곡선이 ${c.change === 'increase' ? '오른쪽' : '왼쪽'}으로 이동합니다. 다른 조건은 일정합니다.`],
      ['환율', `원/달러 환율 ${D.direction(c.rate)}`, c.rate === 'up' ? '1달러를 사는 데 필요한 원화 금액이 늘어납니다.' : '1달러를 사는 데 필요한 원화 금액이 줄어듭니다.']
    ];
    return `<div class="chain">${steps.map(([name, title, detail], i) => `<section class="chain-step ${reveal <= i ? 'pending' : ''}"><span class="num">0${i + 1}</span><div>${reveal > i ? `<h2>${title}</h2><p>${detail}</p>` : `<h2>${name} · 아직 공개 전</h2>`}</div></section>`).join('')}</div>`;
  }
  function resultTable() {
    const record = state.rounds[state.index], news = D.rounds[state.index], totals = C.totals(state);
    if (selectedDetail === null) {
      const needsReview = record.originals.findIndex(a => !a.missing && C.score(a, news.cause).total < C.POINTS_PER_ROUND);
      selectedDetail = needsReview >= 0 ? needsReview : 0;
    }
    return `<div class="results-region"><div class="result-scroll" tabindex="0" role="region" aria-label="이번 라운드 모둠 점수"><table class="result-table"><caption class="sr-only">최초 답안 기준 요소별 점수와 누적 점수</caption><thead><tr><th scope="col">모둠</th><th scope="col">수요·공급</th><th scope="col">증감</th><th scope="col">환율</th><th scope="col">이번</th><th scope="col">누적</th></tr></thead><tbody>${record.originals.map((a, team) => {
      const result = C.score(a, news.cause);
      return `<tr><th scope="row"><button type="button" data-team-detail="${team}" aria-controls="team-detail" aria-pressed="${selectedDetail === team}">${team + 1}. ${esc(state.config.teams[team])}</button></th>${result.parts.map(p => `<td><span class="${p ? 'correct' : 'review'}"><span class="sr-only">${p ? '정답 ' : '다시 확인 '}</span>${p ? '2' : '0'}</span></td>`).join('')}<td><strong>${result.total}/6</strong></td><td>${totals[team].total}</td></tr>`;
    }).join('')}</tbody></table></div><div id="team-detail">${selectedDetail !== null ? detailPanel(selectedDetail) : '<p class="hint">모둠 이름을 누르면 최초 답안과 다시 살펴볼 부분을 확인합니다.</p>'}</div></div>`;
  }
  function detailPanel(team) {
    const record = state.rounds[state.index], a = record.originals[team], result = C.score(a, D.rounds[state.index].cause);
    const feedback = ['달러를 사는 쪽은 수요, 파는 쪽은 공급입니다.', '그 거래가 전보다 늘었는지 줄었는지 확인하세요.', '움직인 곡선에서 새 균형 환율을 찾아보세요.'];
    return `<section class="feedback-detail"><h2>${team + 1}. ${esc(state.config.teams[team])}</h2><p class="feedback-verdict">${result.total === 6 ? '분석 완성 · 6/6' : '다시 살펴볼 부분'}</p><p>최초 답안<br><strong>${answerText(a)}</strong></p>${!result.parts[0] && result.parts[2] ? '<p>환율 방향은 맞았습니다. 달러 거래의 주체를 다시 살펴보세요.</p>' : ''}${a.missing ? '<p>이번 라운드는 미제출로 기록했습니다.</p>' : `<ul>${result.parts.map((p, i) => !p ? `<li>${feedback[i]}</li>` : '').join('')}</ul>`}${C.complete(record.corrections[team]) ? `<p>수정 기록<br><strong>${answerText(record.corrections[team])}</strong></p>` : ''}</section>`;
  }
  function personalComparison() {
    return `<div class="individual-answer-grid">${D.individual.map(q => {
      const c = D.causes[q.cause];
      return `<article class="transfer-case"><h2>${q.title}</h2><dl><div><dt>거래 행동</dt><dd>${q.action}</dd></div><div><dt>달러 시장</dt><dd>${c.label}</dd></div><div><dt>환율</dt><dd class="transfer-rate">원/달러 환율 ${D.direction(c.rate)}</dd></div></dl></article>`;
    }).join('')}</div>`;
  }
  function fitResultRows() {
    const region = app.querySelector('.results-region');
    if (!region) return;
    if (window.innerWidth < 1200) {
      region.style.removeProperty('--result-row-height');
      region.style.removeProperty('--result-font-size');
      return;
    }
    if (!region.getClientRects().length) return;
    const content = region.closest('.lesson-content');
    const table = region.querySelector('.result-table');
    const count = table.tBodies[0].rows.length;
    const available = content.getBoundingClientRect().bottom - region.getBoundingClientRect().top - 8;
    const headerHeight = table.tHead.getBoundingClientRect().height;
    // Fill the projection area while keeping few-team rows and short screens usable.
    const rowHeight = Math.max(44, Math.min(144, Math.floor((available - headerHeight - 2) / count)));
    const fontSize = Math.max(20, Math.min(28, Math.round(rowHeight * .2 + 10)));
    region.style.setProperty('--result-row-height', `${rowHeight}px`);
    region.style.setProperty('--result-font-size', `${fontSize}px`);
  }
  function watchResultLayout() {
    resultLayoutObserver?.disconnect();
    resultLayoutObserver = null;
    fitResultRows();
    const region = app.querySelector('.results-region');
    if (!region || typeof ResizeObserver === 'undefined') return;
    resultLayoutObserver = new ResizeObserver(fitResultRows);
    resultLayoutObserver.observe(region.closest('.lesson-content'));
    resultLayoutObserver.observe(app.querySelector('.feedback-heading'));
  }
  function finalView() {
    return heading('새 뉴스에서도 달러 거래부터 설명해 보세요.', '거래 행동 → 달러 시장 → 환율') + `<div class="final-grid"><section class="panel"><h2>네 가지 관계</h2><div class="result-scroll">${MWPrint.principles()}</div></section><section class="panel"><h2>모둠 분석 결과 <small>${state.config.length * C.POINTS_PER_ROUND}점 만점</small></h2><p>각 항목은 정답 횟수입니다. 동점은 공동 순위이며 개인 확인은 점수에 합치지 않습니다.</p><div class="result-scroll"><table class="result-table"><thead><tr><th>순위</th><th>모둠</th><th>총점</th><th>수요·공급</th><th>증감</th><th>환율</th></tr></thead><tbody>${C.ranking(state).map(r => `<tr><td>${r.tied ? '공동 ' : ''}${r.rank}위</td><th>${r.team + 1}. ${esc(r.name)}</th><td><strong>${r.total}/${state.config.length * C.POINTS_PER_ROUND}</strong></td>${r.parts.map(p => `<td>${p}/${state.config.length}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section></div>` + footer('최초 제출 답안을 기준으로 분석 점수를 계산했습니다.', 'printResult', '결과·정리 인쇄', false, button('home', '처음으로', 'quiet'));
  }
  function practiceView() {
    const steps = [
      ['먼저 혼자 판단', '기록지에 혼자 적어요', '<rect x="6" y="3" width="16" height="22" rx="2"/><path d="M10 9h8M10 14h8M10 19h5"/>'],
      ['모둠과 근거 비교', '모둠의 답을 정해요', '<circle cx="10" cy="8" r="4"/><path d="M3 24v-3a7 7 0 0 1 14 0v3M20 4a4 4 0 0 1 0 8M22 16a6 6 0 0 1 3 5v3"/>'],
      ['답안판 함께 들기', '교사 신호에 맞춰요', '<rect x="2" y="4" width="11" height="15" rx="2"/><rect x="16" y="7" width="10" height="15" rx="2"/><path d="M7 19v6M21 22v3M5 10h5M19 13h4"/>'],
      ['설명 듣고 고치기', '틀린 판단을 고쳐요', '<path d="M5 7h18M5 14h9M5 21h9m3-1 3 3 6-8"/>']
    ];
    return heading('시작 전에, 함께 익혀볼까요?', '뉴스를 읽고 달러 거래의 변화로 환율을 설명해 보세요.') +
      `<ol class="rules-flow" aria-label="한 라운드의 활동 순서">${steps.map(([title, description, drawing]) => `<li><svg viewBox="0 0 28 28" aria-hidden="true" focusable="false">${drawing}</svg><div><strong>${title}</strong><span>${description}</span></div></li>`).join('')}</ol>` +
      `<section class="panel practice-panel" aria-labelledby="practice-title"><div class="practice-heading"><h2 id="practice-title">원인 하나, 환율 방향 하나를 골라요.</h2><p class="practice-unit"><strong>원/달러 환율</strong><span>1달러에 필요한 원화 금액</span></p></div><div class="practice-row">${groups(0, C.blankAnswer(), 'practice')}</div><div class="practice-score" role="group" aria-label="한 라운드의 채점 기준"><span>수요·공급 <strong>2점</strong></span><span>증가·감소 <strong>2점</strong></span><span>환율 방향 <strong>2점</strong></span><strong class="practice-total">한 라운드 6점</strong></div><p class="practice-hint">지금은 제출 방법을 익히는 연습이에요. 어떤 선택도 점수와 수업 기록에 반영되지 않습니다.</p></section>`;
  }
  function lessonView() {
    const phase = state.phase, record = state.rounds[state.index], news = D.rounds[state.index];
    const personal = ['individualA', 'individualB', 'individualAnswers', 'final'].includes(phase);
    const top = `<div class="phase"><strong>${labels[phase]}</strong><span>${personal ? '새 사례에 혼자 적용' : '원인과 환율 · 라운드당 6점'}</span></div>`;
    if (phase === 'rehearsal') return top + practiceView() + footer('개인 기록지와 모둠 답안판을 준비하면 시작할 수 있어요.', 'next', '첫 뉴스 읽기');
    if (['newsReading', 'individual', 'discussion'].includes(phase)) {
      const instructions = { newsReading: ['뉴스를 함께 읽으세요', '거래 주체와 달라진 행동을 찾아보세요.', '개인 판단 시작'], individual: ['먼저 혼자 판단하세요', '기록지에서 원인과 환율의 알맞은 말에 동그라미를 치세요.', '모둠 토의 시작'], discussion: ['함께 근거를 비교하세요', '누가 달러를 사거나 팔까요? 그 거래가 늘었나요, 줄었나요?', '답안판 동시에 들고 입력'] }[phase];
      return top + `<div class="workspace">${newsCard(news)}<aside class="activity"><h2>${instructions[0]}</h2>${timer()}<p>${instructions[1]}</p></aside></div>` + reasoningRail() + footer(phase === 'discussion' ? '모든 모둠이 동시에 공개한 뒤 입력하세요.' : '각 판단의 이유를 한 문장으로 설명해 보세요.', 'next', instructions[2]);
    }
    if (phase === 'responseEntry') return top + `<div class="input-heading">${heading('모둠의 답안을 기록하세요.', news.title)}${timer(true)}${button('news', '뉴스 다시 보기')}</div>` + `<div class="input-summary">${inputKeyboardHint()}<p class="input-count" id="input-count">${record.entries.filter(C.complete).length}/${record.entries.length}모둠 입력 완료</p></div>` + responseTable() + footer('동시 공개한 원인과 환율을 기록합니다. 미제출은 직접 표시하세요.', 'next', '선택 확정', !record.entries.every(C.complete));
    if (phase === 'responsesLocked') return top + heading('최초 답안을 확인하세요.', '입력 실수는 해설을 시작하기 전에 고칠 수 있습니다.') + `<section class="panel locked-panel"><ul class="locked-list">${record.originals.map((a, team) => `<li><strong>${team + 1}. ${esc(state.config.teams[team])}</strong><span>${answerText(a)}</span></li>`).join('')}</ul></section>` + footer('', 'next', '거래 행동 공개', false, button('unlock', '입력 수정', 'quiet'));
    if (phase === 'explanation') {
      const next = ['거래 행동 공개', '달러 시장 공개', '환율 공개', '모둠 결과 보기'][record.reveal];
      return top + `<div class="reveal-heading">${heading('달러 거래에서 환율까지', `${record.reveal}/3단계 공개 · ${news.title}`)}<div class="explanation-timer">${timer(true)}</div></div><div class="reveal-layout">${chain(news, record.reveal)}<section class="chart-panel">${record.reveal >= 2 ? '<h2>우리나라 달러 외환 시장</h2><div id="market-graph"></div>' : transactionGraphic(news)}</section></div>` + footer(record.reveal < 3 ? '공개한 설명은 계속 남아 있습니다.' : '점수는 다음 버튼에서 따로 공개합니다.', 'next', next);
    }
    if (['roundFeedback', 'correction'].includes(phase)) {
      const c = D.causes[news.cause];
      return top + `<div class="feedback-heading">${heading(phase === 'correction' ? '틀린 부분을 개인 기록지에서 고치세요.' : '원인과 환율을 나누어 확인합니다.', `${c.label} → 환율 ${D.direction(c.rate)}`)}${phase === 'correction' ? `${timer(true, '<button type="button" data-action="correctionToggle" aria-controls="correction-records" aria-expanded="false" class="quiet">모둠 수정 기록</button>')}` : ''}</div>` + resultTable() + (phase === 'correction' ? `<details class="correction-editor" id="correction-records"><summary class="sr-only">모둠 수정 기록 · 선택</summary><p>고친 답은 개인 기록지의 선택어로 표시합니다. 앱 수정 기록은 최초 점수에 합치지 않습니다.</p>${inputKeyboardHint()}${responseTable(true)}</details>` : '') + footer(phase === 'correction' ? '기록지의 거래·원인·환율 선택어를 다시 확인하세요.' : '각 요소 2점 · 틀린 판단의 이유를 다시 설명해 보세요.', 'next', phase === 'roundFeedback' ? '개인 기록 고치기 · 30초' : state.index + 1 === state.config.length ? '개인 확인 시작' : '다음 뉴스 읽기', false);
    }
    if (['individualA', 'individualB'].includes(phase)) {
      const q = D.individual[phase === 'individualA' ? 0 : 1];
      return top + `<div class="workspace">${newsCard(q, phase === 'individualA' ? 'A' : 'B', 1)}<aside class="activity"><h2>이번에는 혼자 설명하세요.</h2>${timer()}<p>기록지의 알맞은 말에 동그라미를 치고, 뉴스의 판단 근거에 밑줄을 그으세요.</p></aside></div>` + reasoningRail() + footer('두 문항을 모두 푼 뒤 함께 해설합니다.', 'next', phase === 'individualA' ? 'A 응답 완료 · B 보기' : '개인 응답 완료 · 해설 보기');
    }
    if (phase === 'individualAnswers') return top + heading('모두 감소인데, 환율은 왜 다를까요?', '달러를 사는 거래와 파는 거래를 비교해 보세요.') + personalComparison() + footer('개인 확인은 모둠 점수에 합치지 않습니다.', 'next', '최종 원리와 결과 보기');
    if (phase === 'final') return top + finalView();
    return '';
  }
  function setupView() {
    return heading('함께 분석할 수업을 준비하세요.') + `<form id="setup-form" class="setup-panel"><div class="setup-grid"><label>모둠 수<select name="count" id="team-count">${[2,3,4,5,6,7,8].map(n => `<option value="${n}" ${draft.count === n ? 'selected' : ''}>${n}모둠</option>`).join('')}</select></label><fieldset><legend>수업 길이</legend><label class="setup-choice"><input type="radio" name="length" value="6" ${draft.length === 6 ? 'checked' : ''}>기본 6라운드 · 약 30분 · 36점</label><label class="setup-choice"><input type="radio" name="length" value="4" ${draft.length === 4 ? 'checked' : ''}>단축 4라운드 · 약 20분 · 24점</label></fieldset></div><fieldset><legend>모둠 이름 <small>최대 8자 · 같은 이름도 번호로 구분합니다.</small></legend><div class="team-names">${Array.from({ length: draft.count }, (_, i) => `<label>${i + 1}모둠<input type="text" name="name-${i}" value="${esc(draft.names[i] || `${i + 1}모둠`)}" maxlength="8"></label>`).join('')}</div></fieldset><div class="actions">${button('worksheet', '개인 기록지 인쇄')}${button('home', '처음으로', 'quiet')}<button class="primary" type="submit">수업 시작</button></div></form>`;
  }
  function landingView() {
    return `<section class="landing"><div class="landing-intro"><div><span class="tag">경제 · 뉴스 분석 수업</span><h1 tabindex="-1">뉴스를 읽고,<br>환율의 이유를 밝혀라.</h1><p class="large">달러를 사거나 파는 거래에서 시작해<br>환율 변동의 원인과 방향을 설명합니다.</p></div>${exchangeGraphic()}</div><div class="landing-start"><div class="landing-flow"><span>개인 판단</span><span>모둠 토의</span><span>동시 응답</span><span>이유 확인</span></div><p>6라운드 · 약 30분 · 2~8모둠</p><div class="actions">${state ? button('resume', `이어서 수업 · ${phaseLabel()}`, 'primary') : ''}${button('setup', state ? '새 수업 준비' : '수업 준비', state ? '' : 'primary')}${button('teacherRehearsal', '수업 리허설', 'quiet')}${button('worksheet', '개인 기록지 인쇄', 'quiet')}</div>${state ? '<p class="hint">새 수업은 시작 버튼을 누를 때 기존 기록을 교체합니다.</p>' : ''}</div></section>`;
  }
  function render(focus = true) {
    cancelRenderMotions();
    const previousFrame = renderedFrame;
    const frame = {
      screen: view === 'lesson' && state ? `${view}:${rehearsalMode}:${state.index}:${state.phase}` : view,
      reveal: view === 'lesson' && state?.phase === 'explanation' ? state.rounds[state.index].reveal : 0
    };
    app.dataset.phase = view === 'lesson' && state ? state.phase : view;
    document.querySelector('#rehearsal-exit').hidden = !rehearsalMode;
    document.querySelector('[data-tool="reset"]').textContent = rehearsalMode ? '리허설 다시 시작' : '수업 초기화';
    const shortcutHelp = document.querySelector('[data-tool="shortcuts"]');
    if (shortcutsEnabled) shortcutHelp.setAttribute('aria-keyshortcuts','H'); else shortcutHelp.removeAttribute('aria-keyshortcuts');
    app.innerHTML = view === 'conflict' ? heading('최신 수업 기록에서 이어가세요.', '다른 탭에서 진행하거나 초기화한 기록을 먼저 확인합니다.') + `<section class="panel"><p>이 탭의 오래된 답안은 저장하지 않습니다.</p>${button('reloadLatest', '최신 기록 불러오기', 'primary')}</section>` : view === 'landing' ? landingView() : view === 'setup' ? setupView() : lessonView();
    if (view === 'lesson') {
      const controls = app.querySelector('.footer');
      const content = document.createElement('div'); content.className = 'lesson-content';
      content.tabIndex = 0; content.setAttribute('role', 'region'); content.setAttribute('aria-label', '수업 내용');
      while (app.firstChild && app.firstChild !== controls) content.append(app.firstChild);
      app.prepend(content);
    }
    document.querySelector('#round-progress').innerHTML = view === 'lesson' && state ? `<span>${['individualA','individualB','individualAnswers','final'].includes(state.phase) ? '본 게임 완료' : '라운드'}</span><strong>${state.index + 1} / ${state.config.length}</strong><div class="dots" aria-hidden="true">${state.rounds.map((r, i) => `<i class="${r.scored ? 'done' : i === state.index ? 'now' : ''}"></i>`).join('')}</div>` : '';
    if (document.querySelector('#market-graph')) MWGraph.render(document.querySelector('#market-graph'), D.rounds[state.index].cause, state.rounds[state.index].reveal);
    if (rehearsalMode) document.querySelector('#round-progress').insertAdjacentHTML('afterbegin', '<span class="rehearsal-label">수업 리허설</span>');
    if (focus) { if (mutationPending) focusAfterMutation = true; else app.querySelector('h1')?.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); app.querySelector('.lesson-content')?.scrollTo({ top: 0 }); }
    updateTimer();
    applyShortcutLabels();
    if (app.querySelector('.team-table')) selectInputTeam(activeTeam);
    updateSaveStatus();
    watchResultLayout();
    renderedFrame = frame;
    animateRender(previousFrame, frame);
  }
  function act(action) {
    return mutate(async () => {
      const oldPhase = state.phase;
      if (!await save(rehearsalExamples(C.dispatch(state, action)))) return;
      if (state.phase !== oldPhase || action.type === 'back') { if (!(oldPhase === 'roundFeedback' && state.phase === 'correction')) selectedDetail = null; activeTeam = 0; timerEnded = false; notice(''); }
      if (action.type.startsWith('timer')) updateTimer();
      else render(action.type !== 'missing');
      if (action.type.startsWith('timer')) announce(action.type === 'timerAdd' ? '10초를 추가했습니다.' : state.timer.deadline ? '타이머를 시작했습니다.' : '타이머를 일시 정지했습니다.');
    });
  }
  function updateTimer() {
    if (view !== 'lesson' || !state) return;
    const value = document.querySelector('#timer-value'); if (!value) return;
    const seconds = C.remaining(state.timer);
    value.textContent = formatTime(seconds);
    value.closest('.timer').classList.toggle('closing', seconds > 0 && seconds <= 10);
    const message = document.querySelector('#timer-message');
    message.textContent = seconds === 0 ? '시간이 끝났습니다 · 계속 진행할 수 있습니다' : seconds <= 10 ? '마무리할 시간' : '시간이 끝나도 자동으로 넘어가지 않습니다';
    const toggle = app.querySelector('[data-action="timerToggle"]');
    toggle.disabled = seconds === 0; (toggle.querySelector('.button-label') || toggle).textContent = seconds === 0 ? '시간 종료' : state.timer.deadline !== null ? '일시 정지' : '타이머 시작';
    if (seconds === 0 && !timerEnded) { announce('시간이 끝났습니다. 계속 진행할 수 있습니다.'); timerEnded = true; }
    if (seconds > 0) timerEnded = false;
  }
  function showDialog(content, returnFocus = document.activeElement) {
    dialogReturnFocus = returnFocus;
    document.querySelector('#dialog').classList.remove('teacher-guide-dialog');
    document.querySelector('#dialog-content').innerHTML = content;
    const title = document.querySelector('#dialog-content h1, #dialog-content h2');
    if (title) { title.id = 'dialog-title'; document.querySelector('#dialog').setAttribute('aria-labelledby', title.id); }
    document.querySelector('#dialog').showModal();
  }
  document.querySelector('#teacher-guide').addEventListener('click', () => {
    closeMenu();
    showDialog(MWGuide.render());
    const dialog = document.querySelector('#dialog');
    dialog.classList.add('teacher-guide-dialog');
    document.querySelector('#dialog-content').scrollTop = 0;
    document.querySelector('#dialog-title').focus({ preventScroll: true });
  });
  document.querySelector('#dialog-content').addEventListener('click', event => {
    const target = event.target.closest('[data-guide-target]');
    if (!target) return;
    const heading = document.getElementById(target.dataset.guideTarget)?.querySelector('h3');
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: 'start' });
  });
  function preparePrint(kind) {
    document.querySelector('#print-root').innerHTML = kind === 'result' && state?.phase === 'final' ? MWPrint.summary(state) : MWPrint.worksheet(view === 'setup' ? draft.length : state?.config.length || 6);
    if (rehearsalMode && kind === 'result') document.querySelector('#print-root .print-heading')?.insertAdjacentHTML('afterend', '<p class="print-intro">수업 리허설 · 예시 답안 결과</p>');
    printPrepared = true;
  }
  function print(kind) { preparePrint(kind); window.print(); }
  function collectDraft(form) {
    const f = new FormData(form);
    draft.names = Array.from({ length: draft.count }, (_, i) => String(f.get(`name-${i}`) || `${i + 1}모둠`));
    draft.length = Number(f.get('length'));
  }
  app.addEventListener('change', event => {
    const input = event.target;
    if (view === 'setup') {
      collectDraft(document.querySelector('#setup-form'));
      if (input.name === 'count') { draft.count = Number(input.value); render(false); document.querySelector('#team-count').focus(); }
      return;
    }
    if (input.matches('input[type="radio"][data-field]') && state?.phase !== 'rehearsal') {
      mutate(async () => {
      const team = Number(input.dataset.team); selectInputTeam(team);
      if (!await save(C.dispatch(state, { type: 'answer', team, field: input.dataset.field, value: input.value }))) return;
      const row = input.closest('.team-row'), answer = state.rounds[state.index][state.phase === 'correction' ? 'corrections' : 'entries'][team];
      const status = row.querySelector('[data-status]');
      status.querySelector('span').outerHTML = answerStatus(answer);
      if (state.phase === 'responseEntry') {
        const answers = state.rounds[state.index].entries;
        document.querySelector('#input-count').textContent = `${answers.filter(C.complete).length}/${answers.length}모둠 입력 완료`;
        app.querySelector('[data-action="next"]').disabled = !answers.every(C.complete);
        if (C.complete(answer)) announce(`${team + 1}. ${state.config.teams[team]} 입력 완료. ${answers.filter(C.complete).length}/${answers.length}모둠 완료.${answers.every(C.complete) ? ' 선택을 확정할 수 있습니다.' : ''}`);
      }
      });
    }
  });
  app.addEventListener('submit', event => {
    if (event.target.id !== 'setup-form') return;
    event.preventDefault(); collectDraft(event.target);
    if (state && !window.confirm('새 수업을 시작하면 이 브라우저에 저장된 기존 수업 기록을 교체합니다. 시작할까요?')) return;
    mutate(async () => { if (await save(C.create(draft))) { view = 'lesson'; notice(state.migratedFrom === 2 ? migrationNotice : ''); render(); } });
  });
  function handleAction(action) {
    if (mutationPending) return;
    if (action === 'reloadLatest') { reloadLatest(); return; }
    if (view === 'conflict') return;
    if (action === 'home') { if (rehearsalMode) leaveTeacherRehearsal(); else { view = 'landing'; render(); } return; }
    if (action === 'teacherRehearsal') { startTeacherRehearsal(); return; }
    if (action === 'setup') { view = 'setup'; render(); return; }
    if (action === 'resume') {
      view = 'lesson'; notice(state.migratedFrom === 2 ? migrationNotice : ''); render();
      const message = `${phaseLabel()}에서 이어집니다. 이미 공개한 해설과 최초 답안은 유지됩니다.`;
      announce(message); return;
    }
    if (action === 'worksheet') { print('worksheet'); return; }
    if (action === 'printResult') { print('result'); return; }
    if (action === 'news') { showDialog(newsCard(D.rounds[state.index], state.index + 1, 2)); return; }
    if (action === 'correctionToggle') {
      setCorrectionOpen(!app.querySelector('.correction-editor').open);
      if (selectedDetail !== null) app.querySelector('#team-detail').innerHTML = detailPanel(selectedDetail);
      app.querySelector('.lesson-content')?.scrollTo({ top:0 }); return;
    }
    if (action === 'teamPrev' || action === 'teamNext') {
      activeTeam = Math.max(0, Math.min(state.config.teams.length - 1, activeTeam + (action === 'teamNext' ? 1 : -1)));
      const correctionOpen = app.querySelector('.correction-editor')?.open; render(false);
      if (correctionOpen) setCorrectionOpen(true);
      selectInputTeam(activeTeam,true); return;
    }
    act({ type: action });
  }
  function setCorrectionOpen(open) {
    app.querySelector('.correction-editor').open = open;
    const control = app.querySelector('[data-action="correctionToggle"]');
    control.setAttribute('aria-expanded', String(open));
    (control.querySelector('.button-label') || control).textContent = open ? '결과로 돌아가기' : '모둠 수정 기록';
    if (!open) fitResultRows();
  }
  app.addEventListener('click', async event => {
    const action = event.target.closest('[data-action]'); if (action) handleAction(action.dataset.action);
    const missing = event.target.closest('[data-missing]');
    if (missing) {
      const scroll = app.querySelector('.team-table').scrollTop;
      await act({ type: 'missing', team: Number(missing.dataset.missing) });
      if (view === 'conflict') return;
      app.querySelector('.team-table').scrollTop = scroll;
      app.querySelector(`[data-missing="${missing.dataset.missing}"]`).focus({ preventScroll: true });
    }
    const detail = event.target.closest('[data-team-detail]');
    if (detail) {
      selectedDetail = Number(detail.dataset.teamDetail);
      app.querySelectorAll('[data-team-detail]').forEach(b => b.setAttribute('aria-pressed', String(b === detail)));
      document.querySelector('#team-detail').innerHTML = detailPanel(selectedDetail);
      // Feedback occupies its own column; selecting a team does not resize or scroll the table.
      announce(`${selectedDetail + 1}. ${state.config.teams[selectedDetail]}의 최초 답안과 다시 살펴볼 부분을 표시했습니다.`);
    }
  });
  document.querySelector('#home').addEventListener('click', event => { event.preventDefault(); handleAction('home'); });
  document.querySelector('#rehearsal-exit').addEventListener('click', () => handleAction('home'));
  document.querySelector('#menu').addEventListener('click', () => { const panel = document.querySelector('#menu-panel'); panel.hidden = !panel.hidden; document.querySelector('#menu').setAttribute('aria-expanded', String(!panel.hidden)); });
  function closeMenu(focus = false) {
    document.querySelector('#menu-panel').hidden = true;
    document.querySelector('#menu').setAttribute('aria-expanded', 'false');
    if (focus) document.querySelector('#menu').focus({ preventScroll: true });
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.querySelector('#menu-panel').hidden && !document.querySelector('#dialog').open) closeMenu(true);
  });
  app.addEventListener('focusin', event => {
    const row = event.target.closest('.team-row[data-row]');
    if (row) selectInputTeam(Number(row.dataset.row));
  });
  document.querySelector('#dialog').addEventListener('change', event => {
    if (event.target.id !== 'shortcuts-enabled') return;
    const correctionOpen = app.querySelector('.correction-editor')?.open;
    shortcutsEnabled = event.target.checked; render(false);
    if (correctionOpen) setCorrectionOpen(true);
    announce(shortcutsEnabled ? '키보드 단축키를 켰습니다.' : '키보드 단축키를 껐습니다.');
  });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || (event.shiftKey && event.code !== 'Equal' && !/^Key[A-Z]$/.test(event.code))) return;
    if (document.querySelector('#dialog').open || !document.querySelector('#menu-panel').hidden) return;
    const target = event.target instanceof Element ? event.target : document.activeElement;
    if (target.closest('textarea, select, [contenteditable]:not([contenteditable="false"])') || (target.closest('input') && !target.matches('input[type="radio"][data-field]'))) return;
    if (!shortcutsEnabled) return;
    const inputOpen = view === 'lesson' && state && (state.phase === 'responseEntry' || (state.phase === 'correction' && app.querySelector('.correction-editor')?.open));
    if (inputOpen && ['ArrowUp','ArrowDown'].includes(event.code)) {
      // Stop native radio selection even at the table edge or while saving.
      event.preventDefault();
      if (!event.repeat && !mutationPending) handleAction(event.code === 'ArrowUp' ? 'teamPrev' : 'teamNext');
      return;
    }
    if (event.repeat || mutationPending) return;
    if (event.code === 'KeyH') { event.preventDefault(); showShortcutHelp(); return; }
    if (view !== 'lesson' || !state) return;
    const actions = {KeyN:'next',KeyP:'back',KeyT:'timerToggle',Equal:'timerAdd',NumpadAdd:'timerAdd',KeyV:'news',KeyR:'correctionToggle'};
    if (actions[event.code]) {
      const control = app.querySelector(`button[data-action="${actions[event.code]}"]`);
      event.preventDefault();
      if (control && !control.disabled && control.getClientRects().length) control.click();
      return;
    }
    const practice = state.phase === 'rehearsal';
    const digit = event.code.startsWith('Numpad') && !/^[0-9]$/.test(event.key) ? null : /^(?:Digit|Numpad)([0-9])$/.exec(event.code)?.[1];
    if (inputOpen || practice) {
      const area = practice ? app.querySelector('.practice-row') : app.querySelector(`.team-row[data-row="${activeTeam}"]`);
      if (digit === '0' && state.phase === 'responseEntry') {
        event.preventDefault(); area?.querySelector('.missing-button')?.click(); return;
      }
      if (digit && Number(digit) >= 1 && Number(digit) <= 6) {
        event.preventDefault();
        const field = Number(digit) <= 4 ? 'cause' : 'rate';
        const value = field === 'cause' ? Object.keys(D.causes)[Number(digit)-1] : digit === '5' ? 'up' : 'down';
        const control = area?.querySelector(`input[data-field="${field}"][value="${value}"]`);
        if (control && !control.disabled) {control.focus({preventScroll:true});control.click();}
      }
    } else if (['roundFeedback','correction'].includes(state.phase) && digit && Number(digit) >= 1 && Number(digit) <= state.config.teams.length) {
      event.preventDefault(); app.querySelector(`[data-team-detail="${Number(digit)-1}"]`)?.click();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('#menu, #menu-panel') && !document.querySelector('#menu-panel').hidden) closeMenu();
  });
  document.querySelector('#menu-panel').addEventListener('click', event => {
    const tool = event.target.closest('[data-tool]'); if (!tool) return;
    closeMenu(true);
    if (mutationPending || view === 'conflict') return;
    if (tool.dataset.tool === 'settings') {
      showDialog(state ? `<h2>현재 수업 설정</h2><p>${state.config.teams.length}모둠 · ${state.config.length}라운드 · ${state.config.length * C.POINTS_PER_ROUND}점 만점</p><ol>${state.config.teams.map(n => `<li>${esc(n)}</li>`).join('')}</ol><p>진행 중 모둠 수는 바꾸지 않습니다.</p>` : '<h2>아직 수업을 시작하지 않았습니다.</h2><p>수업 준비에서 모둠과 라운드를 설정하세요.</p>');
    } else if (tool.dataset.tool === 'shortcuts') {
      showShortcutHelp();
    } else if (tool.dataset.tool === 'reset') {
      if (rehearsalMode) { startTeacherRehearsal(); return; }
      if (!window.confirm('저장된 수업 기록, 최초 답안과 점수를 모두 지웁니다. 수업을 초기화할까요?')) return;
      mutate(async () => {
        if (!await save(null)) return;
        view = 'landing'; draft = { count: 5, length: 6, names: [] };
        notice(storageAvailable ? '수업 기록을 초기화했습니다.' : '이 창의 수업은 초기화했습니다. 브라우저 저장 기록은 삭제하지 못했습니다.'); render();
      });
    } else handleAction(tool.dataset.tool);
  });
  document.querySelector('#fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch (_) { notice('전체 화면을 사용할 수 없습니다. 브라우저의 F11 키로 화면을 넓힐 수 있습니다.'); }
  });
  document.addEventListener('fullscreenchange', () => { document.querySelector('#fullscreen').textContent = document.fullscreenElement ? '전체 화면 종료' : '전체 화면'; });
  window.addEventListener('beforeprint', () => { if (!printPrepared) preparePrint(state?.phase === 'final' ? 'result' : 'worksheet'); });
  window.addEventListener('afterprint', () => { printPrepared = false; document.querySelector('#print-root').innerHTML = ''; });
  window.addEventListener('storage', event => {
    if (!rehearsalMode && (event.key === C.STORAGE_KEY || event.key === null) && session.changed()) conflict();
  });
  let resizeFrame;
  window.addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { fitResultRows(); const graph = document.querySelector('#market-graph'); if (graph) MWGraph.render(graph, D.rounds[state.index].cause, state.rounds[state.index].reveal); }); });
  document.querySelector('#dialog').addEventListener('click', event => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) event.currentTarget.close();
  });
  document.querySelector('#dialog').addEventListener('close', () => {
    if (dialogReturnFocus?.isConnected && !dialogReturnFocus.closest('[hidden]')) dialogReturnFocus.focus({ preventScroll: true });
    else document.querySelector('#menu').focus({ preventScroll: true });
    dialogReturnFocus = null;
  });
  setInterval(updateTimer, 250);
  render();
})();
