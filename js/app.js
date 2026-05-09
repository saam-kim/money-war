const app = document.querySelector("#app");
const headerRound = document.querySelector("#headerRound");
const headerExchange = document.querySelector("#headerExchange");
const homeButton = document.querySelector("#homeButton");
const materialsButton = document.querySelector("#materialsButton");
const resetButton = document.querySelector("#resetButton");

const STORAGE_KEY = "exchange-board-game-state-v3";

const initialState = {
  screen: "start",
  teamCount: 5,
  teamNames: [],
  teams: [],
  currentRoundIndex: 0,
  selections: {},
  timer: {
    duration: 45,
    remaining: 45,
    running: false
  },
  captureMode: false
};

let state = structuredClone(initialState);
let timerInterval = null;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function updateHeader() {
  const round = ROUNDS[state.currentRoundIndex] || ROUNDS[0];
  const preGameScreens = ["start", "lesson", "setup", "roles", "materials"];
  const roundText = preGameScreens.includes(state.screen)
    ? "시작 전"
    : `${state.currentRoundIndex + 1} / ${ROUNDS.length}`;

  headerRound.textContent = state.screen === "final" ? "종료" : roundText;
  headerExchange.textContent = preGameScreens.includes(state.screen) ? "수업 준비" : round.shortStatus;
  document.body.classList.toggle("capture-mode", state.captureMode && state.screen === "final");
}

function render() {
  updateHeader();
  app.innerHTML = "";
  app.focus({ preventScroll: true });

  const renderers = {
    start: renderStart,
    lesson: renderLesson,
    setup: renderSetup,
    roles: renderRoles,
    round: renderRound,
    result: renderResult,
    final: renderFinal,
    materials: renderMaterials
  };

  app.appendChild(renderers[state.screen]());
  updateTimerDisplay();
}

function createScreen(className = "") {
  const section = document.createElement("section");
  section.className = `screen ${className}`.trim();
  return section;
}

function renderStart() {
  const hasSavedGame = state.teams.length > 0 && state.screen === "start";
  const screen = createScreen("start-screen");
  screen.innerHTML = `
    <section class="hero-panel">
      <div class="hero-copy">
        <div>
          <p class="subject-label">국제 거래와 환율</p>
          <h2>같은 환율 변화도 역할마다 결과가 다릅니다</h2>
        </div>
        <p class="lead">모둠별로 경제 주체가 되어 환율 상승·하락 상황에서 선택하고, 결과를 비교합니다.</p>
        <div class="action-row">
          <button class="primary-button" type="button" data-action="lesson">수업 흐름 보기</button>
          <button class="secondary-button" type="button" data-action="setup">바로 모둠 설정</button>
          ${hasSavedGame ? '<button class="secondary-button" type="button" data-action="resume">저장된 게임 이어가기</button>' : ""}
        </div>
      </div>
    </section>
  `;

  screen.querySelector("[data-action='lesson']").addEventListener("click", () => go("lesson"));
  screen.querySelector("[data-action='setup']").addEventListener("click", () => go("setup"));
  const resumeButton = screen.querySelector("[data-action='resume']");
  if (resumeButton) {
    resumeButton.addEventListener("click", () => {
      state.screen = state.teams.some((team) => team.history.length) ? "result" : "roles";
      if (state.teams.some((team) => team.history.length) && state.currentRoundIndex >= ROUNDS.length) {
        state.screen = "final";
      }
      persistAndRender();
    });
  }
  return screen;
}

function renderLesson() {
  const screen = createScreen();
  screen.innerHTML = `
    <section class="info-panel">
      <h2 class="screen-title">수업 흐름</h2>
      <p class="lead">학생은 역할을 맡고, 교사는 모둠 선택을 화면에 입력합니다. 토의-선택-결과-짧은 발표가 한 라운드입니다.</p>
      <div class="info-grid">
        <article class="concept-card">
          <h3>1. 역할 이해</h3>
          <p>우리 모둠이 외화를 쓰는지, 외화를 버는지 먼저 판단합니다.</p>
        </article>
        <article class="concept-card">
          <h3>2. 선택과 결과</h3>
          <p>환율 상황에 맞는 선택을 고르고 점수, 자금, 안정도, 위험도 변화를 확인합니다.</p>
        </article>
        <article class="concept-card">
          <h3>3. 개념 정리</h3>
          <p>환율 상승·하락의 의미와 국제 거래 유형을 역할 사례로 정리합니다.</p>
        </article>
      </div>
      <div class="teacher-panel">
        <h3>20분 운영 기준</h3>
        <p>도입 2분, 역할 확인 3분, 라운드별 토의와 결과 12분, 최종 정리 3분으로 운영하면 여유가 있습니다.</p>
      </div>
      <div class="action-row">
        <button class="primary-button" type="button" data-action="setup">모둠 설정하기</button>
      </div>
    </section>
  `;
  screen.querySelector("[data-action='setup']").addEventListener("click", () => go("setup"));
  return screen;
}

function renderSetup() {
  const screen = createScreen();
  const names = Array.from({ length: state.teamCount }, (_, index) => state.teamNames[index] || "");
  screen.innerHTML = `
    <section class="setup-panel">
      <h2 class="screen-title">모둠 설정</h2>
      <p class="lead">2~8개 모둠을 설정합니다. 이름을 비우면 1모둠, 2모둠처럼 자동 표시됩니다.</p>
      <div class="setup-controls">
        <div class="number-control">
          <label for="teamCount">모둠 수</label>
          <input id="teamCount" type="number" min="2" max="8" value="${state.teamCount}" />
          <button class="mini-button" type="button" data-action="apply-count">적용</button>
        </div>
        <div class="team-name-grid">
          ${names.map((name, index) => `
            <label>
              ${index + 1}모둠 이름
              <input type="text" maxlength="16" value="${escapeHtml(name)}" data-team-name="${index}" placeholder="${index + 1}모둠" />
            </label>
          `).join("")}
        </div>
      </div>
      <div class="teacher-panel">
        <h3>운영 팁</h3>
        <p>시간이 부족하면 이름 입력을 생략하고 바로 역할을 배정하세요.</p>
      </div>
      <div class="action-row">
        <button class="primary-button" type="button" data-action="assign">역할 자동 배정</button>
      </div>
    </section>
  `;

  screen.querySelector("[data-action='apply-count']").addEventListener("click", () => {
    const countInput = screen.querySelector("#teamCount");
    state.teamCount = clamp(Number(countInput.value) || 5, 2, 8);
    state.teamNames = readTeamNames(screen);
    persistAndRender();
  });

  screen.querySelector("[data-action='assign']").addEventListener("click", () => {
    state.teamNames = readTeamNames(screen);
    createTeams();
    go("roles");
  });

  return screen;
}

function renderRoles() {
  const screen = createScreen();
  screen.innerHTML = `
    <section class="info-panel">
      <h2 class="screen-title">역할 배정</h2>
      <p class="lead">각 모둠은 서로 다른 경제 주체가 되어 5개의 환율 상황에 대응합니다.</p>
      <div class="teacher-panel">
        <h3>활동 안내</h3>
        <p>시작 전 각 모둠이 “우리 역할은 환율 상승에 유리/불리하다”를 한 문장으로 말하게 하면 판단 기준이 선명해집니다.</p>
      </div>
      <div class="role-grid">
        ${state.teams.map((team) => roleCardTemplate(team)).join("")}
      </div>
      <div class="action-row">
        <button class="secondary-button" type="button" data-action="setup">모둠 다시 설정</button>
        <button class="primary-button" type="button" data-action="start-round">1라운드 시작</button>
      </div>
    </section>
  `;
  screen.querySelector("[data-action='setup']").addEventListener("click", () => go("setup"));
  screen.querySelector("[data-action='start-round']").addEventListener("click", () => {
    state.currentRoundIndex = 0;
    state.selections = {};
    resetTimer(false);
    go("round");
  });
  return screen;
}

function renderRound() {
  const round = ROUNDS[state.currentRoundIndex];
  const selectedCount = Object.keys(state.selections).length;
  const screen = createScreen();
  screen.innerHTML = `
    <section class="round-panel">
      <div class="round-header">
        <article class="exchange-card">
          <h2>${state.currentRoundIndex + 1}라운드: ${round.title}</h2>
          ${exchangeMoveTemplate()}
          <p>${round.situation}</p>
        </article>
        <article class="progress-card">
          <p class="section-label">선택 완료</p>
          <strong>${selectedCount} / ${state.teams.length}</strong>
          <p>모둠 카드에서 선택지 하나를 고릅니다.</p>
        </article>
      </div>
      <div class="classroom-tools">
        ${teacherPanelTemplate(round.teacherGuide)}
        ${promptPanelTemplate(round.discussionPrompt)}
        ${timerPanelTemplate()}
      </div>
      <div class="pace-panel">
        <strong>진행 리듬</strong>
        <span>토의 45초</span>
        <span>입력 30초</span>
        <span>결과 60초</span>
        <span>발표는 1~2모둠만</span>
      </div>
      <div class="team-grid">
        ${state.teams.map((team) => teamChoiceTemplate(team, round)).join("")}
      </div>
      <div class="action-row sticky-actions">
        <button class="primary-button" type="button" data-action="show-result" ${selectedCount === state.teams.length ? "" : "disabled"}>결과 보기</button>
      </div>
    </section>
  `;

  bindTimerControls(screen);

  screen.querySelectorAll("[data-choice-button]").forEach((button) => {
    button.addEventListener("click", () => {
      const teamId = button.dataset.teamId;
      state.selections[teamId] = Number(button.dataset.choiceIndex);
      persistAndRender();
    });
  });

  screen.querySelector("[data-action='show-result']").addEventListener("click", () => {
    stopTimer(false);
    applyRoundResults();
    go("result");
  });

  return screen;
}

function renderResult() {
  const round = ROUNDS[state.currentRoundIndex];
  const screen = createScreen();
  const isLastRound = state.currentRoundIndex === ROUNDS.length - 1;
  const highlights = getRoundHighlights();
  screen.innerHTML = `
    <section class="result-panel">
      <h2 class="screen-title">${state.currentRoundIndex + 1}라운드 결과</h2>
      <div class="classroom-tools two-column-tools">
        ${teacherPanelTemplate("추천 모둠 1~2곳만 짧게 발표하고, 나머지는 결과 카드 확인으로 넘어가면 흐름이 끊기지 않습니다.")}
        ${promptPanelTemplate(round.resultFocus)}
      </div>
      <div class="pace-panel">
        <strong>발표 추천</strong>
        <span>${highlights.best.name}: 대응이 좋았던 이유</span>
        <span>${highlights.risky.name}: 위험이 커진 이유</span>
      </div>
      <div class="explain-box">
        <h3>경제 개념 해설</h3>
        <p>${round.concept}</p>
      </div>
      <div class="result-grid">
        ${state.teams.map((team) => resultCardTemplate(team)).join("")}
      </div>
      ${state.currentRoundIndex === 2 ? tradeTypesTemplate() : ""}
      <div class="action-row sticky-actions">
        <button class="primary-button" type="button" data-action="next">${isLastRound ? "최종 결과 보기" : "다음 라운드"}</button>
      </div>
    </section>
  `;
  screen.querySelector("[data-action='next']").addEventListener("click", () => {
    if (isLastRound) {
      go("final");
      return;
    }
    state.currentRoundIndex += 1;
    state.selections = {};
    resetTimer(false);
    go("round");
  });
  return screen;
}

function renderFinal() {
  const sorted = [...state.teams].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const riskiest = [...state.teams].sort((a, b) => b.risk - a.risk)[0];
  const screen = createScreen();
  screen.innerHTML = `
    <section class="summary-panel capture-target">
      <h2 class="screen-title">최종 결과</h2>
      <div class="final-grid">
        <article class="winner-card">
          <h3>환율 변화에 가장 잘 대응한 모둠</h3>
          <span class="score-big">${escapeHtml(best.name)}</span>
          <p>${best.role.name} 역할, 최종 ${best.score}점</p>
        </article>
        <article class="winner-card">
          <h3>가장 위험하게 대응한 모둠</h3>
          <span class="score-big">${escapeHtml(riskiest.name)}</span>
          <p>위험도 ${riskiest.risk}. 기회와 위험을 함께 보는 판단이 필요합니다.</p>
        </article>
      </div>
      <article class="ranking-card">
        <h3>모둠별 최종 점수</h3>
        <ol class="rank-list">
          ${sorted.map((team, index) => `
            <li>
              <span>${index + 1}위</span>
              <span>${escapeHtml(team.name)} · ${team.role.name}</span>
              <span>${team.score}점 · 자금 ${team.money} · 안정도 ${team.stability} · 위험도 ${team.risk}</span>
            </li>
          `).join("")}
        </ol>
      </article>
      <article class="info-panel">
        <h3 class="section-label">역할별 유불리 정리</h3>
        <div class="role-grid">
          ${ROLE_CARDS.map((role) => `
            <article class="role-card">
              <h3>${role.name}</h3>
              <div class="tag-row">
                <span class="tag">유리: ${role.strongWhen}</span>
                <span class="tag">불리: ${role.weakWhen}</span>
              </div>
              <p>${role.explanation}</p>
            </article>
          `).join("")}
        </div>
      </article>
      ${tradeTypesTemplate()}
      <div class="explain-box">
        <h3>수업 정리</h3>
        <p>환율 변동은 모든 경제 주체에게 같은 영향을 주지 않습니다. 해외여행자, 수출기업, 수입기업, 유학생 가정처럼 자신이 어떤 경제 활동을 하는지에 따라 유리함과 불리함이 달라집니다.</p>
      </div>
      <div class="teacher-panel final-teacher-note">
        <h3>마무리 질문</h3>
        <p>우리 모둠의 선택은 어떤 국제 거래 유형과 연결되었나요? 한 문장으로 정리해 보세요.</p>
      </div>
      <div class="action-row final-actions">
        <button class="secondary-button" type="button" data-action="capture">${state.captureMode ? "일반 보기" : "캡처용 보기"}</button>
        <span class="shortcut-hint">Ctrl+P / ⌘P로 인쇄</span>
        <button class="secondary-button" type="button" data-action="restart">새 게임 시작</button>
      </div>
    </section>
  `;
  screen.querySelector("[data-action='restart']").addEventListener("click", resetGame);
  screen.querySelector("[data-action='capture']").addEventListener("click", () => {
    state.captureMode = !state.captureMode;
    persistAndRender();
  });
  return screen;
}

function renderMaterials() {
  const screen = createScreen();
  screen.innerHTML = `
    <section class="summary-panel print-materials">
      <h2 class="screen-title">인쇄 자료</h2>
      <p class="lead">수업 전 출력하거나 화면으로 보여 줄 수 있는 역할 카드와 진행 요약입니다.</p>
      <div class="action-row print-hide">
        <button class="primary-button" type="button" data-action="print">현재 자료 인쇄</button>
        <button class="secondary-button" type="button" data-action="setup">게임으로 돌아가기</button>
      </div>
      <article class="print-section">
        <h3 class="section-label">역할 카드</h3>
        <div class="print-card-grid">
          ${ROLE_CARDS.map((role) => `
            <article class="print-role-card">
              <h3>${role.name}</h3>
              <p>${role.description}</p>
              <div class="tag-row">
                <span class="tag">유리: ${role.strongWhen}</span>
                <span class="tag">불리: ${role.weakWhen}</span>
                <span class="tag">${role.tradeType}</span>
              </div>
              <p><strong>생각할 점</strong><br>${role.explanation}</p>
            </article>
          `).join("")}
        </div>
      </article>
      <article class="print-section">
        <h3 class="section-label">라운드 요약</h3>
        <div class="material-table">
          <div class="material-row material-head">
            <span>라운드</span>
            <span>상황</span>
            <span>토의 질문</span>
            <span>핵심 정리</span>
          </div>
          ${ROUNDS.map((round, index) => `
            <div class="material-row">
              <span>${index + 1}라운드</span>
              <span>${round.title}<br>${round.situation}</span>
              <span>${round.discussionPrompt}</span>
              <span>${round.resultFocus}</span>
            </div>
          `).join("")}
        </div>
      </article>
      <article class="print-section">
        <h3 class="section-label">마무리 질문</h3>
        <div class="info-grid">
          <article class="concept-card">
            <h3>개념 확인</h3>
            <p>환율 상승은 원화 가치와 외화 가치 중 무엇이 어떻게 변한 것인가요?</p>
          </article>
          <article class="concept-card">
            <h3>역할 비교</h3>
            <p>같은 환율 상승 상황에서 해외여행자와 수출기업의 결과가 왜 달랐나요?</p>
          </article>
          <article class="concept-card">
            <h3>거래 유형</h3>
            <p>K-pop 공연, 유학, 원자재 수입은 각각 어떤 국제 거래 유형과 연결되나요?</p>
          </article>
        </div>
      </article>
    </section>
  `;
  screen.querySelector("[data-action='print']").addEventListener("click", () => window.print());
  screen.querySelector("[data-action='setup']").addEventListener("click", () => {
    go(state.teams.length ? "roles" : "setup");
  });
  return screen;
}

function teacherPanelTemplate(text) {
  return `
    <article class="teacher-panel">
      <h3>교사용 진행 안내</h3>
      <p>${text}</p>
    </article>
  `;
}

function exchangeMoveTemplate() {
  const moves = ["+9.2%", "-12.0%", "엔화↓", "비용↑", "수출↑"];
  return `<span class="exchange-move">${moves[state.currentRoundIndex] || ""}</span>`;
}

function promptPanelTemplate(text) {
  return `
    <article class="prompt-panel">
      <h3>모둠 토의 질문</h3>
      <p>${text}</p>
    </article>
  `;
}

function timerPanelTemplate() {
  return `
    <article class="timer-panel">
      <h3>토의 타이머</h3>
      <strong id="timerDisplay">${formatTime(state.timer.remaining)}</strong>
      <div class="timer-presets">
        <button class="mini-button" type="button" data-timer-duration="30">30초</button>
        <button class="mini-button" type="button" data-timer-duration="45">45초</button>
        <button class="mini-button" type="button" data-timer-duration="60">60초</button>
      </div>
      <div class="action-row">
        <button class="primary-button" type="button" data-timer-action="start">${state.timer.running ? "진행 중" : "시작"}</button>
        <button class="secondary-button" type="button" data-timer-action="pause">일시정지</button>
        <button class="ghost-button" type="button" data-timer-action="reset">다시 설정</button>
      </div>
    </article>
  `;
}

function roleCardTemplate(team) {
  return `
    <article class="role-card">
      <h3>${escapeHtml(team.name)}</h3>
      <p><strong>${team.role.name}</strong> · ${team.role.description}</p>
      <div class="tag-row">
        <span class="tag">유리: ${team.role.strongWhen}</span>
        <span class="tag">불리: ${team.role.weakWhen}</span>
        <span class="tag">${team.role.tradeType}</span>
      </div>
      <div class="metric-row">
        <span class="metric">자금 ${team.money}</span>
        <span class="metric">안정도 ${team.stability}</span>
        <span class="metric">위험도 ${team.risk}</span>
      </div>
      <p>${team.role.explanation}</p>
    </article>
  `;
}

function teamChoiceTemplate(team, round) {
  const selected = state.selections[team.id];
  return `
    <article class="team-card ${selected !== undefined ? "selected" : ""}">
      <h3>${escapeHtml(team.name)}</h3>
      <p>${team.role.name}</p>
      <div class="metric-row">
        <span class="metric">점수 ${team.score}</span>
        <span class="metric">자금 ${team.money}</span>
        <span class="metric">안정도 ${team.stability}</span>
        <span class="metric">위험도 ${team.risk}</span>
      </div>
      <p class="section-label">선택 ${selected !== undefined ? "완료" : "대기"}</p>
      <div class="choices-list">
        ${round.choices.map((choice, index) => `
          <button class="choice-button ${selected === index ? "selected" : ""}" type="button" data-choice-button data-team-id="${team.id}" data-choice-index="${index}">
            <span>${choice.text}</span>
            <small>${choiceMetaTemplate(choice, team.role.name)}</small>
          </button>
        `).join("")}
      </div>
    </article>
  `;
}

function resultCardTemplate(team) {
  const last = team.history[team.history.length - 1];
  return `
    <article class="change-card">
      <h3>${escapeHtml(team.name)}</h3>
      <p>${team.role.name} · 선택: ${last.choiceText}</p>
      <div class="delta-row">
        ${deltaTemplate("점수", last.total.scoreChange)}
        ${deltaTemplate("자금", last.total.moneyChange)}
        ${deltaTemplate("안정도", last.total.stabilityChange)}
        ${deltaTemplate("위험도", last.total.riskChange, true)}
      </div>
      <div class="result-reason">
        <strong>결과 이유</strong>
        <p>${last.summary}</p>
      </div>
      <div class="metric-row">
        <span class="metric">현재 점수 ${team.score}</span>
        <span class="metric">자금 ${team.money}</span>
        <span class="metric">안정도 ${team.stability}</span>
        <span class="metric">위험도 ${team.risk}</span>
      </div>
      <p>${last.feedback}</p>
      <p>${last.roleNote}</p>
    </article>
  `;
}

function deltaTemplate(label, value, inverse = false) {
  const className = value === 0 ? "neutral" : (inverse ? value < 0 : value > 0) ? "positive delta-up" : "negative delta-down";
  const sign = value > 0 ? "+" : "";
  return `<span class="delta ${className}">${label} ${sign}${value}</span>`;
}

function tradeTypesTemplate() {
  return `
    <article class="info-panel">
      <h3 class="section-label">국제 거래 유형 정리</h3>
      <div class="trade-grid">
        ${TRADE_TYPES.map((item) => `
          <article class="trade-card">
            <h3>${item.title}</h3>
            <p>${item.text}</p>
          </article>
        `).join("")}
      </div>
      <div class="explain-box">
        <p>K-pop 공연 기획사는 서비스 거래와 문화 콘텐츠 거래, 해외 원자재 수입 공장은 재화 거래, 유학생 가정은 교육 서비스 거래와 연결됩니다.</p>
      </div>
    </article>
  `;
}

function choiceMetaTemplate(choice, roleName) {
  const roles = choice.recommendedRoles || [];
  if (!roles.length) return "공통 선택";
  if (roles.includes(roleName)) return "우리 역할과 잘 맞는 선택";
  return `추천 역할: ${roles.slice(0, 2).join(", ")}${roles.length > 2 ? " 등" : ""}`;
}

function readTeamNames(root) {
  return Array.from(root.querySelectorAll("[data-team-name]")).map((input) => input.value.trim());
}

function createTeams() {
  state.teams = Array.from({ length: state.teamCount }, (_, index) => {
    const role = ROLE_CARDS[index % ROLE_CARDS.length];
    return {
      id: `team-${index + 1}`,
      name: state.teamNames[index] || `${index + 1}모둠`,
      role,
      score: 0,
      money: role.initialMoney,
      stability: role.initialStability,
      risk: role.initialRisk,
      history: []
    };
  });
}

function applyRoundResults() {
  const round = ROUNDS[state.currentRoundIndex];
  state.teams.forEach((team) => {
    const choiceIndex = state.selections[team.id];
    const choice = round.choices[choiceIndex];
    const roleAdjust = getRoleAdjustment(team.role.name, round);
    const total = addEffects(round.baseEffect, choice.effect, roleAdjust.effect);

    team.score += total.scoreChange;
    team.money = Math.max(0, team.money + total.moneyChange);
    team.stability = clamp(team.stability + total.stabilityChange, 0, 100);
    team.risk = clamp(team.risk + total.riskChange, 0, 100);

    team.history.push({
      roundTitle: round.title,
      choiceText: choice.text,
      feedback: choice.feedback,
      roleNote: roleAdjust.note,
      summary: buildResultSummary(team, choice, roleAdjust, total),
      total
    });
  });
}

function getRoleAdjustment(roleName, round) {
  if (round.strongRoles.includes(roleName)) {
    return {
      type: "strong",
      effect: { scoreChange: 2, moneyChange: 4, stabilityChange: 1, riskChange: -1 },
      note: "역할 보정: 이번 환율 상황은 이 역할에 유리하게 작용했습니다."
    };
  }
  if (round.weakRoles.includes(roleName)) {
    return {
      type: "weak",
      effect: { scoreChange: -2, moneyChange: -5, stabilityChange: -2, riskChange: 3 },
      note: "역할 보정: 이번 환율 상황은 이 역할에 불리하게 작용했습니다."
    };
  }
  return {
    type: "neutral",
    effect: { scoreChange: 0, moneyChange: 0, stabilityChange: 0, riskChange: 0 },
    note: "역할 보정: 이번 상황의 직접 영향은 크지 않았습니다."
  };
}

function getRoundHighlights() {
  const teamsWithLast = state.teams
    .map((team) => ({ team, last: team.history[team.history.length - 1] }))
    .filter((item) => item.last);
  const best = [...teamsWithLast].sort((a, b) => b.last.total.scoreChange - a.last.total.scoreChange)[0]?.team || state.teams[0];
  const risky = [...teamsWithLast].sort((a, b) => b.last.total.riskChange - a.last.total.riskChange)[0]?.team || state.teams[0];
  return { best, risky };
}

function buildResultSummary(team, choice, roleAdjust, total) {
  const roleText = {
    strong: "이 역할은 이번 상황에서 기본적으로 유리했습니다.",
    weak: "이 역할은 이번 상황에서 기본적으로 불리했습니다.",
    neutral: "이 역할은 이번 상황의 직접 영향이 크지 않았습니다."
  }[roleAdjust.type];
  const riskText = total.riskChange > 0
    ? "다만 위험도가 올라 다음 선택에서 신중한 대응이 필요합니다."
    : total.riskChange < 0
      ? "위험도를 낮춘 점은 안정적인 대응으로 볼 수 있습니다."
      : "위험도 변화는 크지 않았습니다.";
  return `${team.role.name}은 “${choice.text}”를 선택했습니다. ${roleText} ${riskText}`;
}

function addEffects(...effects) {
  return effects.reduce((sum, effect) => ({
    scoreChange: sum.scoreChange + effect.scoreChange,
    moneyChange: sum.moneyChange + effect.moneyChange,
    stabilityChange: sum.stabilityChange + effect.stabilityChange,
    riskChange: sum.riskChange + effect.riskChange
  }), { scoreChange: 0, moneyChange: 0, stabilityChange: 0, riskChange: 0 });
}

function bindTimerControls(root) {
  root.querySelectorAll("[data-timer-duration]").forEach((button) => {
    button.addEventListener("click", () => {
      const seconds = Number(button.dataset.timerDuration);
      state.timer.duration = seconds;
      state.timer.remaining = seconds;
      state.timer.running = false;
      stopTimer(false);
      persistAndRender();
    });
  });

  root.querySelector("[data-timer-action='start']").addEventListener("click", startTimer);
  root.querySelector("[data-timer-action='pause']").addEventListener("click", () => stopTimer(true));
  root.querySelector("[data-timer-action='reset']").addEventListener("click", () => resetTimer(true));
}

function startTimer() {
  if (state.timer.remaining <= 0) {
    state.timer.remaining = state.timer.duration;
  }
  state.timer.running = true;
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerInterval = setInterval(() => {
    state.timer.remaining = Math.max(0, state.timer.remaining - 1);
    updateTimerDisplay();
    saveState();
    if (state.timer.remaining <= 0) {
      stopTimer(true);
    }
  }, 1000);
  persistAndRender();
}

function stopTimer(shouldRender) {
  state.timer.running = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (shouldRender) {
    persistAndRender();
  } else {
    saveState();
  }
}

function resetTimer(shouldRender) {
  state.timer.remaining = state.timer.duration;
  state.timer.running = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (shouldRender) {
    persistAndRender();
  } else {
    saveState();
  }
}

function updateTimerDisplay() {
  const timerDisplay = document.querySelector("#timerDisplay");
  if (timerDisplay) {
    timerDisplay.textContent = formatTime(state.timer.remaining);
    timerDisplay.classList.toggle("timer-done", state.timer.remaining === 0);
    timerDisplay.classList.toggle("timer-urgent", state.timer.remaining > 0 && state.timer.remaining <= 10);
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function go(screen) {
  state.screen = screen;
  state.captureMode = false;
  persistAndRender();
}

function persistAndRender() {
  saveState();
  render();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      timer: {
        ...state.timer,
        running: false
      },
      captureMode: false
    }));
  } catch (error) {
    console.warn("진행 상황을 저장하지 못했습니다.", error);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    const savedTimer = parsed.timer || {};
    const migratedDuration = [30, 45, 60].includes(savedTimer.duration) ? savedTimer.duration : 45;
    state = {
      ...structuredClone(initialState),
      ...parsed,
      timer: {
        ...initialState.timer,
        ...savedTimer,
        duration: migratedDuration,
        remaining: Math.min(savedTimer.remaining || migratedDuration, migratedDuration),
        running: false
      },
      captureMode: false
    };
  } catch (error) {
    console.warn("저장된 진행 상황을 불러오지 못했습니다.", error);
  }
}

function resetGame() {
  stopTimer(false);
  state = structuredClone(initialState);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("저장된 진행 상황을 지우지 못했습니다.", error);
  }
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

homeButton.addEventListener("click", () => {
  state.screen = "start";
  state.captureMode = false;
  stopTimer(false);
  render();
});

materialsButton.addEventListener("click", () => {
  state.screen = "materials";
  state.captureMode = false;
  stopTimer(false);
  render();
});

resetButton.addEventListener("click", () => {
  if (confirm("모든 진행 상황을 초기화할까요?")) {
    resetGame();
  }
});

loadState();
render();
