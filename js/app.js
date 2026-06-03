const app = document.querySelector("#app");
const prevButton = document.querySelector("#prevButton");
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
  roundCount: 5,
  roundOrder: [],
  selections: {},
  timer: {
    duration: 45,
    remaining: 45,
    running: false
  },
  captureMode: false,
  teacherMode: false
};

let state = structuredClone(initialState);
let timerInterval = null;
const revealedNewsRounds = new Set();
let roundLeftScrollTop = 0;
let enlargedNewsOpen = false;
let enlargedBoardOpen = false;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const MAX_ROUND_COUNT = 10;

const PREDICTION_OPTIONS = [
  { value: "up", label: "환율 상승" },
  { value: "down", label: "환율 하락" }
];

const IMPACT_OPTIONS = [
  { value: "favorable", label: "우리에게 유리" },
  { value: "unfavorable", label: "우리에게 불리" }
];

function getGameRounds() {
  if (Array.isArray(state.roundOrder) && state.roundOrder.length) {
    const orderedRounds = state.roundOrder
      .map((title) => ROUNDS.find((round) => round.title === title))
      .filter(Boolean);
    if (orderedRounds.length) return orderedRounds;
  }
  return ROUNDS.slice(0, state.roundCount);
}

function buildRandomRoundOrder() {
  return shuffleArray(ROUNDS).slice(0, state.roundCount).map((round) => round.title);
}

function shuffleArray(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function getCurrentRound() {
  return getGameRounds()[state.currentRoundIndex] || getGameRounds()[0] || ROUNDS[0];
}

function isTeamSelectionComplete(selection) {
  return Boolean(selection && selection.prediction && selection.impact && Number.isInteger(selection.choiceIndex));
}

function updateHeader() {
  if (prevButton) {
    prevButton.disabled = state.screen === "start";
  }
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
  restoreRoundScrollPosition();
  updateTimerDisplay();
}

function restoreRoundScrollPosition() {
  if (state.screen !== "round") return;
  const roundLeft = app.querySelector(".round-left");
  if (!roundLeft) return;
  requestAnimationFrame(() => {
    roundLeft.scrollTop = roundLeftScrollTop;
  });
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
          <p class="game-tag">환율 전략 시뮬레이션 게임</p>
          <h2>
            <span>환율 배틀: 머니워</span>
            <small>국제 거래와 환율 역할 시뮬레이션</small>
          </h2>
        </div>
        <p class="lead">뉴스를 읽고 환율 방향을 예측한 뒤, 우리 역할에 맞는 대응을 선택합니다.</p>
        <div class="role-preview" aria-label="대표 역할 미리보기">
          <div class="role-chip role-chip-exporter">
            <b aria-hidden="true">🏭</b>
            <span>팀 A</span>
            <strong>수출기업</strong>
            <small>환율 상승 시 유리</small>
          </div>
          <div class="role-chip role-chip-importer">
            <b aria-hidden="true">📦</b>
            <span>팀 B</span>
            <strong>수입기업</strong>
            <small>환율 하락 시 유리</small>
          </div>
          <div class="role-chip role-chip-traveler">
            <b aria-hidden="true">✈️</b>
            <span>팀 C</span>
            <strong>해외여행자</strong>
            <small>환율 하락 시 유리</small>
          </div>
        </div>
        <div class="action-row">
          <button class="primary-button" type="button" data-action="setup">게임 시작하기 →</button>
          <button class="secondary-button" type="button" data-action="lesson">활동 방법 보기</button>
        </div>
        ${hasSavedGame ? '<button class="resume-link" type="button" data-action="resume">저장된 게임 이어가기</button>' : ""}
        <section class="home-flow" aria-label="게임 진행 흐름">
          <h3>어떻게 진행되나요?</h3>
          <div class="home-flow-steps">
            <article><span aria-hidden="true">🎭</span><strong>역할 배정</strong></article>
            <i aria-hidden="true">→</i>
            <article><span aria-hidden="true">📰</span><strong>뉴스 예측</strong></article>
            <i aria-hidden="true">→</i>
            <article><span aria-hidden="true">💱</span><strong>전략 선택</strong></article>
            <i aria-hidden="true">→</i>
            <article><span aria-hidden="true">📊</span><strong>결과 비교</strong></article>
          </div>
        </section>
      </div>
      <aside class="hero-dashboard" aria-label="환율 배틀 핵심 정보">
        <div class="dashboard-section">
          <p class="dashboard-label">게임 시작 환율 <small>(가상 수치)</small></p>
          <div class="ticker-row">
            <strong>원·달러 환율</strong>
            <span>1,380</span>
            <em class="ticker-up">+12</em>
          </div>
        </div>
        <div class="dashboard-section">
          <p class="dashboard-label">게임 규칙</p>
          <div class="rule-list">
            <p>🏆 승리 조건: 대응 점수가 가장 높은 모둠</p>
            <p>🔄 진행: 뉴스 확인 → 예측 → 역할 판단 → 대응 선택</p>
            <p>💡 핵심: 자산은 재미 요소, 승부는 환율 이해</p>
          </div>
        </div>
        <div class="asset-preview" style="grid-template-columns: 1fr;">
          <div style="padding: var(--space-3) var(--space-4);">
            <span>기본 시작 자금</span>
            <strong style="font-size: 24px; color: var(--brand-2);">100만 원</strong>
            <small style="margin-top: var(--space-1); display: block; color: var(--ink-3); line-height: 1.45;">모둠별 역할에 따라 시작 자금이 차등(95만~125만 원) 지급됩니다.</small>
          </div>
        </div>
        <div class="dashboard-section classroom-brief">
          <p class="dashboard-label">모둠 판단 루틴</p>
          <ol>
            <li><strong>뉴스 단서</strong><span>달러 수요가 늘지 줄지 찾기</span></li>
            <li><strong>환율 방향</strong><span>원/달러 환율 상승 또는 하락 예측</span></li>
            <li><strong>역할 판단</strong><span>우리 역할에 유리한지 불리한지 연결</span></li>
            <li><strong>대응 선택</strong><span>이익을 키우거나 손실을 줄이는 전략 고르기</span></li>
          </ol>
        </div>
      </aside>
    </section>
  `;

  screen.querySelectorAll("[data-action='lesson']").forEach((button) => button.addEventListener("click", () => go("lesson")));
  screen.querySelectorAll("[data-action='setup']").forEach((button) => button.addEventListener("click", () => go("setup")));
  const resumeButton = screen.querySelector("[data-action='resume']");
  if (resumeButton) {
    resumeButton.addEventListener("click", () => {
      state.screen = state.teams.some((team) => team.history.length) ? "result" : "roles";
      if (state.teams.some((team) => team.history.length) && state.currentRoundIndex >= getGameRounds().length) {
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
      <h2 class="screen-title">활동 방법</h2>
      <p class="lead">뉴스를 읽고 환율 방향을 예측한 뒤, 역할에 맞는 선택을 정합니다. 결과 화면에서는 왜 유리하거나 불리했는지 발표합니다.</p>
      <div class="flow-rail">
        <article>
          <span>1</span>
          <strong>역할 확인</strong>
          <p>외화를 쓰는 역할인지, 버는 역할인지 판단합니다.</p>
        </article>
        <article>
          <span>2</span>
          <strong>뉴스 예측</strong>
          <p>뉴스 속 수요와 공급 변화를 찾아 환율 방향을 예상합니다.</p>
        </article>
        <article>
          <span>3</span>
          <strong>전략 선택</strong>
          <p>우리 역할이 외화를 쓰는지 버는지 따져 선택합니다.</p>
        </article>
        <article>
          <span>4</span>
          <strong>결과 발표</strong>
          <p>추천 모둠 1~2곳만 이유를 짧게 말합니다.</p>
        </article>
      </div>
      <div class="teacher-panel">
        <h3>20분 운영 기준</h3>
        <p>도입 2분, 역할 확인 3분, 뉴스 예측과 선택 12분, 결과 발표와 정리 3분을 기준으로 합니다.</p>
      </div>
      <div class="concept-card lesson-metrics">
        <h3>점수판 지표 이해하기</h3>
        <div>
          <article>
            <strong>자금</strong>
            <p>모둠이 가진 돈입니다. 선택 결과에 따라 늘거나 줄어들지만, 최종 승리의 기준은 아닙니다.</p>
          </article>
          <article>
            <strong>대응 점수</strong>
            <p>모둠이 환율 변동에 맞춰 얼마나 합리적인 선택을 했는지 평가하는 최종 승리 기준입니다. 환율 예측과 역할 판단에 따라 결정됩니다.</p>
          </article>
        </div>
      </div>
      <div class="concept-card lesson-result-guide">
        <h3>📊 라운드 결과 카드 읽는 방법</h3>
        <div class="result-guide-grid">
          <article>
            <strong>기호 표시 (✓, X)</strong>
            <p>예측과 판단이 정확하면 <b>✓ (성공)</b>, 빗나가면 <b>X (실패)</b>로 표시됩니다.</p>
          </article>
          <article>
            <strong>대응 점수 구성 (합계 8점)</strong>
            <p><b>환율 예측(5점) + 역할 판단(3점)</b>의 합산 점수입니다. 모둠이 경제 원리에 맞춰 합리적으로 의사결정했는지 점수화합니다.</p>
          </article>
          <article>
            <strong>자금 변동 (▲/▼ 자금)</strong>
            <p>선택지 결과에 따라 이 라운드에 늘어나거나 깎인 자금(만 원 단위)입니다.</p>
          </article>
        </div>
      </div>
      <div class="concept-card lesson-example">
        <h3>선택 예시</h3>
        <p><strong>수입기업</strong>이 뉴스에서 달러를 사려는 사람이 많다는 단서를 찾았다면, 환율 상승을 예상할 수 있습니다.</p>
        <p>수입기업은 달러로 대금을 내야 하므로 환율 상승은 <strong>불리</strong>합니다. 그래서 “달러를 일부 미리 확보한다”처럼 비용을 줄이는 선택을 할 수 있습니다.</p>
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
  const roundCount = clamp(Number(state.roundCount) || 5, 1, Math.min(MAX_ROUND_COUNT, ROUNDS.length));
  screen.innerHTML = `
    <section class="setup-panel">
      <div class="setup-two-col">
        <div class="setup-left">
          <div>
            <h2 class="screen-title">모둠 설정</h2>
            <p class="lead">게임 조건을 설정하고 역할을 배정합니다.</p>
          </div>
          <div class="number-control">
            <label for="teamCount">모둠 수</label>
            <input id="teamCount" type="number" min="2" max="8" value="${state.teamCount}" />
          </div>
          <div class="number-control">
            <label for="roundCount">라운드 수</label>
            <select id="roundCount">
              ${Array.from({ length: Math.min(MAX_ROUND_COUNT, ROUNDS.length) }, (_, index) => index + 1)
                .map((count) => `<option value="${count}" ${roundCount === count ? "selected" : ""}>${count}라운드</option>`)
                .join("")}
            </select>
          </div>
          <p class="field-help">모둠 수 변경 후 아래 '적용'을 눌러야 이름 칸이 업데이트됩니다.</p>
          <div class="setup-foot-row">
            <button class="mini-button" type="button" data-action="apply-count">모둠 수 적용</button>
            <button class="primary-button" type="button" data-action="assign">역할 배정 →</button>
          </div>
        </div>
        <div class="setup-right">
          <p class="setup-right-label">모둠 이름 <span>(비우면 자동)</span></p>
          <div class="team-name-grid ${state.teamCount <= 2 ? "single-column" : ""}">
            ${names.map((name, index) => `
              <label>
                ${index + 1}모둠
                <input type="text" maxlength="16" value="${escapeHtml(name)}" data-team-name="${index}" placeholder="${index + 1}모둠" />
              </label>
            `).join("")}
          </div>
          <div class="teacher-panel setup-tip">
            <p>역할 배정을 누르면 전체 뉴스 풀에서 설정한 라운드 수만큼 무작위로 선정되어 게임이 진행됩니다.</p>
          </div>
        </div>
      </div>
    </section>
  `;

  screen.querySelector("[data-action='apply-count']").addEventListener("click", () => {
    const countInput = screen.querySelector("#teamCount");
    state.teamCount = clamp(Number(countInput.value) || 5, 2, 8);
    state.roundCount = clamp(Number(screen.querySelector("#roundCount").value) || 5, 1, Math.min(MAX_ROUND_COUNT, ROUNDS.length));
    state.roundOrder = [];
    state.teamNames = readTeamNames(screen);
    persistAndRender();
  });

  screen.querySelector("#roundCount").addEventListener("change", (event) => {
    state.roundCount = clamp(Number(event.currentTarget.value) || 5, 1, Math.min(MAX_ROUND_COUNT, ROUNDS.length));
    state.roundOrder = [];
    state.teamNames = readTeamNames(screen);
    saveState();
  });

  screen.querySelector("#teamCount").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    state.teamCount = clamp(Number(event.currentTarget.value) || 5, 2, 8);
    state.roundCount = clamp(Number(screen.querySelector("#roundCount").value) || 5, 1, Math.min(MAX_ROUND_COUNT, ROUNDS.length));
    state.roundOrder = [];
    state.teamNames = readTeamNames(screen);
    persistAndRender();
  });

  screen.querySelector("[data-action='assign']").addEventListener("click", () => {
    state.roundCount = clamp(Number(screen.querySelector("#roundCount").value) || 5, 1, Math.min(MAX_ROUND_COUNT, ROUNDS.length));
    state.roundOrder = buildRandomRoundOrder();
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
      <p class="lead">우리 모둠이 외화를 쓰는 쪽인지, 벌어들이는 쪽인지 먼저 확인합니다.</p>
      <div class=”start-check-panel”>
        <p>💡 우리 역할이 외화를 <strong>쓰는 쪽</strong>인지, <strong>버는 쪽</strong>인지 먼저 확인하세요. 환율 방향과 연결됩니다.</p>
      </div>
      <div class="role-grid">
        ${state.teams.map((team) => roleCardTemplate(team)).join("")}
      </div>
      <div class="role-actions">
        <button class="secondary-button" type="button" data-action="setup">모둠 다시 설정</button>
        <button class="primary-button" type="button" data-action="start-round">1라운드 시작</button>
      </div>
    </section>
  `;
  screen.querySelector("[data-action='setup']").addEventListener("click", () => go("setup"));
  screen.querySelector("[data-action='start-round']").addEventListener("click", () => {
    revealedNewsRounds.clear();
    state.currentRoundIndex = 0;
    state.selections = {};
    resetTimer(false);
    go("round");
  });
  return screen;
}

function renderRound() {
  const round = getCurrentRound();
  const selectedCount = state.teams.filter((team) => isTeamSelectionComplete(state.selections[team.id])).length;
  const isRevealed = revealedNewsRounds.has(state.currentRoundIndex);
  const newsTone = getNewsTone(round);
  const currentStep = !isRevealed ? 1 : selectedCount < state.teams.length ? 2 : 3;
  const showTeacherStatus = true;
  const screen = createScreen();
  screen.innerHTML = `
    <section class="round-panel">
      <div class="round-workspace">
        <div class="round-left">
          <div class="round-header">
            <article class="exchange-card news-card ${newsTone} ${isRevealed ? "is-revealed" : ""}">
              <div class="news-card-toolbar">
                <span class="news-label">시장 뉴스</span>
                <button class="mini-button fullscreen-button" type="button" data-action="open-news-large" ${isRevealed ? "" : "disabled"} title="${isRevealed ? "" : "뉴스를 먼저 공개하세요"}">크게 보기</button>
              </div>
              <button class="news-reveal-button" type="button" data-action="reveal-news" aria-label="시장 뉴스 공개">
                <span>▶ 클릭하여 공개</span>
              </button>
              <div class="news-card-content">
                ${roundNewsHintTemplate(true)}
              </div>
              <div aria-live="polite" class="sr-only" id="newsAnnounce"></div>
            </article>
          </div>
          <div class="pace-panel">
            <strong class="${currentStep === 1 ? "pace-step-active" : "pace-step-done"}">① 뉴스 확인</strong>
            <span class="${currentStep === 2 ? "pace-step-active" : currentStep > 2 ? "pace-step-done" : ""}">② 모둠 토의 (45초)</span>
            <span class="${currentStep === 3 ? "pace-step-active" : ""}">③ 선택 입력</span>
            <span>④ 결과 공개</span>
          </div>
          <div class="team-grid">
            ${state.teams.map((team) => teamChoiceTemplate(team, round)).join("")}
          </div>
        </div>
        <aside class="round-side">
          <article class="progress-card">
            <p class="section-label teacher-check-label">선택 완료</p>
            <strong class="progress-count">${selectedCount} / ${state.teams.length}</strong>
            <p style="margin-bottom: var(--space-3)">세 가지를 모두 입력하면 결과를 볼 수 있습니다.</p>
            <button class="primary-button" type="button" data-action="show-result" ${selectedCount === state.teams.length ? "" : "disabled"} style="width: 100%; height: 44px;">결과 보기 →</button>
          </article>
          ${showTeacherStatus ? teacherPanelTemplate(round.teacherGuide) : predictionPanelTemplate()}
          ${promptPanelTemplate("뉴스 속에서 외화를 사려는 쪽과 팔려는 쪽을 찾고, 우리 역할의 비용과 수입이 어떻게 바뀔지 따져 보세요.", true)}
          ${timerPanelTemplate()}
          ${showTeacherStatus ? teacherSubmissionPanelTemplate() : ""}
        </aside>
      </div>
      ${enlargedNewsOpen ? newsLargeViewTemplate() : ""}
    </section>
  `;

  bindNewsCardControls(screen);
  bindTimerControls(screen);

  screen.querySelectorAll("[data-choice-button]").forEach((button) => {
    button.addEventListener("click", () => {
      const teamId = button.dataset.teamId;
      const selectType = button.dataset.selectType;
      const selection = state.selections[teamId] || {};
      if (selectType === "prediction") selection.prediction = button.dataset.value;
      if (selectType === "impact") selection.impact = button.dataset.value;
      if (selectType === "strategy") selection.choiceIndex = Number(button.dataset.choiceIndex);
      state.selections[teamId] = selection;
      saveState();

      // Targeted DOM update — no full re-render, no flicker
      screen.querySelectorAll(`[data-choice-button][data-select-type="${selectType}"][data-team-id="${teamId}"]`).forEach((btn) => {
        const isSelected = selectType === "strategy"
          ? Number(btn.dataset.choiceIndex) === selection.choiceIndex
          : btn.dataset.value === selection[selectType];
        btn.classList.toggle("selected", isSelected);
        btn.setAttribute("aria-pressed", String(isSelected));
        if (selectType === "strategy") btn.disabled = isSelected;
      });

      const complete = isTeamSelectionComplete(selection);
      const cardEl = button.closest(".team-card");
      if (cardEl) {
        cardEl.classList.toggle("selected", complete);
        const bannerEm = cardEl.querySelector(".team-role-banner em");
        if (bannerEm) {
          bannerEm.className = complete ? "done" : "pending";
          bannerEm.textContent = complete ? "✓ 완료" : "입력 중";
        }
      }

      const newSelectedCount = state.teams.filter((t) => isTeamSelectionComplete(state.selections[t.id])).length;
      const progressEl = screen.querySelector(".progress-count");
      if (progressEl) progressEl.textContent = `${newSelectedCount} / ${state.teams.length}`;
      const showResultBtn = screen.querySelector("[data-action='show-result']");
      if (showResultBtn) showResultBtn.disabled = newSelectedCount < state.teams.length;
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
  const round = getCurrentRound();
  const screen = createScreen();
  const isLastRound = state.currentRoundIndex === getGameRounds().length - 1;
  const highlights = getRoundHighlights();
  screen.innerHTML = `
    <section class="result-panel">
      <div class="result-workspace">
        <div class="result-left">
          <h2 class="screen-title">${state.currentRoundIndex + 1}라운드 결과</h2>
          ${roundConceptCardTemplate(round)}
          <article class="round-summary-banner">
            <strong>핵심 정리</strong>
            <span>${round.resultFocus}</span>
          </article>
          <div class="result-grid">
            ${state.teams.map((team) => resultCardTemplate(team)).join("")}
          </div>
        </div>
        <aside class="result-side">
          ${assetBarChartTemplate()}
          ${exchangeImpactBoardTemplate(round)}
          <div class="action-row sticky-actions">
            <button class="primary-button" type="button" data-action="next">${isLastRound ? "최종 결과 보기" : "다음 라운드"}</button>
          </div>
        </aside>
      </div>
      ${enlargedNewsOpen ? newsLargeViewTemplate() : ""}
      ${enlargedBoardOpen ? boardLargeViewTemplate(round) : ""}
    </section>
  `;
  bindLargeNewsControls(screen);
  bindLargeBoardToggleControls(screen);
  if (enlargedBoardOpen) {
    bindLargeBoardControls(screen);
  }
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

function confettiEffectTemplate() {
  let confettiHtml = '<div class="confetti-container" aria-hidden="true">';
  for (let i = 0; i < 40; i++) {
    const left = Math.random() * 100;
    const delay = Math.random() * 3;
    const duration = 2.5 + Math.random() * 2;
    const scale = 0.5 + Math.random() * 0.8;
    const rotate = Math.random() * 360;
    const colorClass = ["color-1", "color-2", "color-3", "color-4", "color-5"][Math.floor(Math.random() * 5)];
    confettiHtml += `<span class="confetti-particle ${colorClass}" style="left: ${left}%; animation-delay: ${delay}s; animation-duration: ${duration}s; transform: scale(${scale}) rotate(${rotate}deg);"></span>`;
  }
  confettiHtml += '</div>';
  return confettiHtml;
}

function renderFinal() {
  const sorted = [...state.teams].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const screen = createScreen();
  screen.innerHTML = `
    ${confettiEffectTemplate()}
    <section class="summary-panel capture-target">
      <div class="final-workspace">
        <div class="final-left">
          ${finalVictoryBannerTemplate(sorted)}
          ${awardSummaryTemplate()}
          <article class="ranking-card">
            <h3>🏆 모둠별 최종 순위</h3>
            <ol class="rank-list">
              ${sorted.map((team, index) => `
                <li>
                  <span>${index + 1}위</span>
                  <span>${escapeHtml(team.name)} · ${team.role.name}</span>
                  <span>누적 ${team.score}점 (최종 자금: ${team.money}만 원)</span>
                </li>
              `).join("")}
            </ol>
          </article>
          ${chalkboardUnifiedTemplate()}
        </div>
        <aside class="final-right">
          ${moneyTrendChartTemplate()}
          ${roleSummaryPanelTemplate()}
          <div class="action-row final-actions">
            <button class="secondary-button" type="button" data-action="capture">${state.captureMode ? "일반 보기" : "인쇄하기 🖨️"}</button>
            <span class="shortcut-hint">Ctrl+P / ⌘P로 인쇄</span>
            <button class="primary-button" type="button" data-action="restart">새 게임 시작</button>
          </div>
        </aside>
      </div>
    </section>
  `;

  // Confetti auto-removal after 3 seconds with smooth transition
  setTimeout(() => {
    const container = screen.querySelector('.confetti-container');
    if (container) {
      container.style.transition = 'opacity 1s ease';
      container.style.opacity = '0';
      setTimeout(() => container.remove(), 1000);
    }
  }, 3000);

  screen.querySelector("[data-action='restart']").addEventListener("click", resetGame);
  screen.querySelector("[data-action='capture']").addEventListener("click", () => {
    state.captureMode = !state.captureMode;
    persistAndRender();
  });
  return screen;
}



function finalVictoryBannerTemplate(sortedTeams) {
  const winner = sortedTeams[0];
  const runnerText = sortedTeams.slice(1, 3)
    .map((team, index) => `${index + 2}위 ${escapeHtml(team.name)}`)
    .join(" · ");
  const visual = roleVisualTemplate(winner);
  return `
    <article class="victory-banner" style="--winner-bg: ${visual.bg}; --winner-text: ${visual.text}; --winner-line: ${visual.line}">
      <strong><span aria-hidden="true">🏆</span> ${escapeHtml(winner.name)} 최고 대응상! 대응 점수 ${winner.score}점</strong>
      <span>${runnerText || "끝까지 참여한 모든 모둠이 환율 전략가입니다."}</span>
    </article>
  `;
}

function awardSummaryTemplate() {
  const bestResponse = [...state.teams].sort((a, b) => b.score - a.score)[0];
  const assetWinner = [...state.teams].sort((a, b) => b.money - a.money)[0];
  const predictionWinner = [...state.teams].sort((a, b) => countPredictionHits(b) - countPredictionHits(a))[0];
  return `
    <section class="award-grid" aria-label="시상">
      <article><strong>최고 대응상</strong><span>${escapeHtml(bestResponse.name)} · ${bestResponse.score}점</span></article>
      <article><strong>예측왕</strong><span>${escapeHtml(predictionWinner.name)} · ${countPredictionHits(predictionWinner)}회 적중</span></article>
      <article><strong>최종 자산상</strong><span>${escapeHtml(assetWinner.name)} · ${assetWinner.money}만 원</span></article>
    </section>
  `;
}

function countPredictionHits(team) {
  return team.history.filter((entry) => entry.prediction === entry.expectedDirection).length;
}

function moneyTrendChartTemplate() {
  const teams = getTrendTeams();
  const series = teams.map((team) => ({
    team,
    visual: roleVisualTemplate(team),
    values: getMoneyHistory(team)
  }));
  const maxRounds = Math.max(...series.map((item) => item.values.length), 1);
  const allValues = series.flatMap((item) => item.values);
  const minValue = Math.max(0, Math.min(...allValues) - 10);
  const maxValue = Math.max(...allValues) + 10;
  const range = Math.max(1, maxValue - minValue);
  const width = 1000;
  const height = 260;
  const plot = { left: 96, right: 36, top: 28, bottom: 58 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const xFor = (index) => plot.left + (maxRounds === 1 ? 0 : (plotWidth * index) / (maxRounds - 1));
  const yFor = (value) => plot.top + plotHeight - ((value - minValue) / range) * plotHeight;
  const labels = Array.from({ length: maxRounds }, (_, index) => index === 0 ? "시작" : `${index}라운드 후`);

  return `
    <article class="trend-card">
      <h3 class="section-label">라운드별 자산 변동</h3>
      <svg class="money-trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="라운드별 자산 변동 꺾은선 그래프">
        <line class="trend-axis" x1="${plot.left}" y1="${plot.top}" x2="${plot.left}" y2="${height - plot.bottom}"></line>
        <line class="trend-axis" x1="${plot.left}" y1="${height - plot.bottom}" x2="${width - plot.right}" y2="${height - plot.bottom}"></line>
        ${labels.map((label, index) => `
          <text class="trend-x-label" x="${xFor(index)}" y="${height - 24}">${label}</text>
        `).join("")}
        ${[minValue, maxValue].map((value) => `
          <text class="trend-y-label" x="${plot.left - 12}" y="${yFor(value) + 4}">${Math.round(value)}</text>
        `).join("")}
        ${series.map((item) => {
          const points = item.values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" ");
          return `
            <polyline class="trend-line" points="${points}" fill="none" stroke="${item.visual.line}"></polyline>
            ${item.values.map((value, index) => `
              <circle class="trend-dot" cx="${xFor(index)}" cy="${yFor(value)}" r="7" fill="${item.visual.line}">
                <title>${escapeHtml(item.team.name)} · ${labels[index]} · ${value}만 원</title>
              </circle>
            `).join("")}
          `;
        }).join("")}
      </svg>
      <div class="trend-legend">
        ${series.map((item) => `<span><i style="background:${item.visual.line}"></i>${escapeHtml(item.team.name)} · ${item.team.role.name}</span>`).join("")}
      </div>
    </article>
  `;
}

function getTrendTeams() {
  const preferred = ["수출", "수입", "여행"]
    .map((keyword) => state.teams.find((team) => team.role.name.includes(keyword)))
    .filter(Boolean);
  const combined = [...preferred, ...state.teams].filter((team, index, array) => (
    array.findIndex((item) => item.id === team.id) === index
  ));
  return combined.slice(0, 3);
}

function getMoneyHistory(team) {
  const values = [team.role.initialMoney];
  team.history.forEach((entry) => {
    const previous = values[values.length - 1];
    values.push(Math.max(0, previous + entry.total.moneyChange));
  });
  if (values.length === 1 && team.money !== values[0]) {
    values.push(team.money);
  }
  return values;
}

function learningSummaryTemplate() {
  return `
    <section class="learning-summary-grid" aria-label="오늘 배운 것">
      <article>
        <span aria-hidden="true">📈</span>
        <h3>환율이 오르면</h3>
        <p>수출기업 유리<br>수입기업 불리<br>여행자 불리</p>
      </article>
      <article>
        <span aria-hidden="true">📉</span>
        <h3>환율이 내리면</h3>
        <p>수입기업 유리<br>수출기업 불리<br>여행자 유리</p>
      </article>
      <article>
        <span aria-hidden="true">⚖️</span>
        <h3>역할마다 전략이 다르다</h3>
        <p>같은 환율도<br>입장에 따라 득실이<br>달라진다</p>
      </article>
    </section>
  `;
}

function chalkboardUnifiedTemplate() {
  return `
    <article class="chalkboard-unified">
      <p class="chalkboard-eyebrow">판서 정리</p>

      <div class="cu-def">
        <span class="cu-def-label">환율이란?</span>
        <span class="cu-def-body">두 나라 화폐가 교환되는 비율&nbsp;&nbsp;·&nbsp;&nbsp;<em>1달러 = ○○○원</em>이 바뀌는 것</span>
      </div>

      <div class="cu-flow">
        <div class="cu-col">
          <div class="cu-trigger cu-trigger-up">
            <span>🛒</span>
            <div>
              <strong>달러 사려는 사람 증가</strong>
              <small>해외여행 증가 · 수입 대금 지급</small>
            </div>
          </div>
          <div class="cu-arrow">↓</div>
          <div class="cu-rate cu-rate-up">환율 상승 ▲</div>
          <div class="cu-arrow">↓</div>
          <div class="cu-outcomes">
            <div class="cu-outcome cu-win">
              <span>외화 버는 쪽</span>
              <strong>유리 ✓</strong>
              <small>수출기업 · K-pop기획사</small>
            </div>
            <div class="cu-outcome cu-lose">
              <span>외화 쓰는 쪽</span>
              <strong>불리 ✗</strong>
              <small>수입기업 · 해외여행자</small>
            </div>
          </div>
        </div>

        <div class="cu-sep"></div>

        <div class="cu-col">
          <div class="cu-trigger cu-trigger-down">
            <span>💵</span>
            <div>
              <strong>달러 파는 사람 증가</strong>
              <small>수출 대금 유입 · 외국인 투자 증가</small>
            </div>
          </div>
          <div class="cu-arrow">↓</div>
          <div class="cu-rate cu-rate-down">환율 하락 ▼</div>
          <div class="cu-arrow">↓</div>
          <div class="cu-outcomes">
            <div class="cu-outcome cu-lose">
              <span>외화 버는 쪽</span>
              <strong>불리 ✗</strong>
              <small>수출기업 · K-pop기획사</small>
            </div>
            <div class="cu-outcome cu-win">
              <span>외화 쓰는 쪽</span>
              <strong>유리 ✓</strong>
              <small>수입기업 · 해외여행자</small>
            </div>
          </div>
        </div>
      </div>

      <div class="cu-table">
        <div class="cu-table-head">
          <span></span><span>수출기업</span><span>수입기업</span><span>여행자·유학생</span>
        </div>
        <div class="cu-table-row">
          <span class="cu-rate-cell cu-rate-up">환율 ▲</span>
          <span class="cu-win-cell">유리 ✓</span><span class="cu-lose-cell">불리 ✗</span><span class="cu-lose-cell">불리 ✗</span>
        </div>
        <div class="cu-table-row">
          <span class="cu-rate-cell cu-rate-down">환율 ▼</span>
          <span class="cu-lose-cell">불리 ✗</span><span class="cu-win-cell">유리 ✓</span><span class="cu-win-cell">유리 ✓</span>
        </div>
      </div>
    </article>
  `;
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
                <span class="tag mint">유리: ${role.strongWhen}</span>
                <span class="tag coral">불리: ${role.weakWhen}</span>
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
            <h3>역할 판단</h3>
            <p>우리 모둠은 환율 변동이 유리한지 불리한지 어떤 근거로 판단했나요?</p>
          </article>
        </div>
      </article>
      <article class="print-section worksheet-section page-break">
        <h2>환율 배틀 · 모둠 활동지</h2>
        <div class="worksheet-meta">
          <span>나의 역할: ____________________</span>
          <span>모둠명: ____________________</span>
          <span>이름: ____________________</span>
        </div>
        <h3>라운드별 대응 기록표</h3>
        <table class="worksheet-table">
          <thead>
            <tr>
              <th>라운드</th>
              <th>뉴스 단서</th>
              <th>환율 예측</th>
              <th>환율 변동의 영향</th>
              <th>대응 선택</th>
              <th>대응 점수</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: getGameRounds().length || state.roundCount }, (_, index) => index + 1).map((roundNumber) => `
              <tr>
                <th>${roundNumber}라운드</th>
                <td></td>
                <td>상승 / 하락</td>
                <td>유리 / 불리</td>
                <td></td>
                <td>예측 ___ / 역할 ___ / 대응 ___</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <h3>선택 이유 문장 만들기</h3>
        <div class="worksheet-question">
          <p>1. 우리 역할은 환율이 __________하면 __________합니다. 왜냐하면</p>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="worksheet-question">
          <p>2. 이번 뉴스는 환율을 __________하게 할 가능성이 있습니다. 그래서 우리는</p>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="worksheet-question">
          <p>3. 자금이 늘거나 줄어든 것보다 더 중요한 판단은 무엇이었나요?</p>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
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
      <h3>진행 안내</h3>
      <p>${text}</p>
    </article>
  `;
}

function exchangeMoveTemplate() {
  const round = getCurrentRound();
  const direction = getRoundDirection(round);
  const move = direction === "up" ? "환율↑" : direction === "down" ? "환율↓" : "영향?";
  return `<span class="exchange-move">${move}</span>`;
}

function roundNewsHintTemplate(compact = false) {
  const hints = {
    "원/달러 환율 상승": {
      title: "공항 환전소 앞 긴 줄... 달러 사려는 사람이 몰렸다",
      lead: "방학 해외여행 예약이 늘고, 일부 수입업체도 결제일을 앞두고 달러를 서둘러 확보하고 있습니다. 은행 직원들은 “오전부터 달러 문의가 평소보다 훨씬 많다”고 전했습니다.",
      cue: "뉴스 판단: 달러를 사려는 사람이 많아지면 원/달러 환율은 어느 쪽으로 움직일까요?"
    },
    "원/달러 환율 하락": {
      title: "수출 대금 들어오고 외국인 투자도 회복... 달러 매물 늘어",
      lead: "대형 수출기업들이 받은 달러를 원화로 바꾸기 시작했고, 외국인 투자자금도 국내 시장으로 들어오고 있습니다. 외환 딜러들은 “달러를 팔려는 주문이 눈에 띈다”고 말했습니다.",
      cue: "뉴스 판단: 시장에 달러를 파는 사람이 많아지면 원/달러 환율은 어느 쪽으로 움직일까요?"
    },
    "달러 약세와 해외 소비 증가": {
      title: "해외직구 결제액 증가... 여행사도 달러 결제 상품 할인 경쟁",
      lead: "달러로 결제하는 해외 숙박권과 직구 상품을 찾는 소비자가 늘고 있습니다. 일부 여행사는 “환전 부담이 줄었다고 느끼는 고객 문의가 많다”고 전했습니다.",
      cue: "뉴스 판단: 달러 결제 부담이 줄어든다면 원/달러 환율은 어느 쪽으로 움직였을까요?"
    },
    "원자재 가격과 환율 동시 상승": {
      title: "기름값·구리값 동반 상승... 공장들 원가 계산 다시 한다",
      lead: "국제 원자재 가격이 뛰자, 해외에서 원료를 들여오는 공장들이 납품 가격과 생산량 조정을 검토하고 있습니다. 여기에 외화 결제 부담까지 겹칠 수 있다는 우려도 나옵니다.",
      cue: "뉴스 판단: 원자재를 수입하는 기업은 어떤 위험을 먼저 줄여야 할까요?"
    },
    "K-콘텐츠 해외 수출 증가": {
      title: "월드투어 매진에 굿즈 주문 폭주... K-콘텐츠 달러 수입 늘었다",
      lead: "해외 공연 티켓과 온라인 콘텐츠 판매가 빠르게 늘면서 기획사들이 해외 홍보 예산을 늘리고 있습니다. 팬덤 소비가 음원, 공연, 관광 상품으로 이어지는 모습입니다.",
      cue: "뉴스 판단: 문화 콘텐츠로 외화를 버는 기업은 지금 어떤 전략을 세우는 게 좋을까요?"
    },
    "미국 금리 인상 가능성": {
      title: "미국 금리 오를까... 달러 예금과 달러 투자 문의 증가",
      lead: "미국 금리 인상 가능성이 커지자 달러를 보유하려는 투자자가 늘고 있습니다. 외환 딜러들은 “달러를 사려는 주문이 늘었다”고 전했습니다.",
      cue: "뉴스 판단: 달러를 보유하려는 사람이 늘면 원/달러 환율은 어느 쪽으로 움직일까요?"
    },
    "외국인 투자자금 국내 유입": {
      title: "외국인 투자자 국내 주식 매수 확대... 원화 수요 늘어",
      lead: "외국인 투자자금이 국내 시장으로 들어오며 달러를 원화로 바꾸는 거래가 늘고 있습니다. 시장에서는 원화 가치가 회복될 수 있다는 전망이 나옵니다.",
      cue: "뉴스 판단: 달러를 팔고 원화를 사는 거래가 늘면 원/달러 환율은 어떻게 움직일까요?"
    },
    "국제 유가 안정": {
      title: "국제 유가 안정세... 원자재 수입 공장 한숨 돌리나",
      lead: "원유와 금속 가격이 안정되며 해외 원자재를 들여오는 기업들의 비용 부담이 줄어들 수 있다는 분석이 나왔습니다.",
      cue: "뉴스 판단: 원자재 가격 부담이 줄어들면 수입기업과 공장은 어떤 선택을 할 수 있을까요?"
    },
    "해외 경기 둔화와 수출 주문 감소": {
      title: "해외 소비 둔화 조짐... 수출기업 주문량 전망 낮춰",
      lead: "해외 경기 둔화로 한국 제품 주문이 줄어들 수 있다는 전망이 나왔습니다. 일부 기업은 생산량과 판매 지역을 다시 검토하고 있습니다.",
      cue: "뉴스 판단: 환율만 보고 수출기업의 유불리를 판단해도 될까요?"
    },
    "지정학 위험과 달러 선호": {
      title: "국제 정세 불안에 달러 찾는 투자자 늘어",
      lead: "세계 경제 불안이 커지자 안전한 자산으로 여겨지는 달러를 사려는 움직임이 강해지고 있습니다. 시장에서는 환율 변동성이 커질 수 있다고 봅니다.",
      cue: "뉴스 판단: 달러 선호가 강해지면 원/달러 환율은 어느 방향으로 움직일까요?"
    }
  };
  const round = getCurrentRound();
  const hint = hints[round.title] || hints["원/달러 환율 상승"];
  return `
    ${compact ? "" : `<h2>${state.currentRoundIndex + 1}라운드 뉴스</h2>`}
    <strong class="news-headline">${hint.title}</strong>
    <p>${hint.lead}</p>
    <p class="news-cue">${hint.cue}</p>
  `;
}

function predictionPanelTemplate() {
  return "";
}

function getNewsTone(round) {
  const text = `${round.shortStatus} ${round.title}`;
  if (text.includes("상승") || text.includes("수출 증가")) {
    return "news-up";
  }
  if (text.includes("하락") || text.includes("달러↓")) {
    return "news-down";
  }
  return "news-neutral";
}

function bindNewsCardControls(root) {
  const newsCard = root.querySelector(".news-card");
  const revealButton = root.querySelector("[data-action='reveal-news']");
  const openLargeButton = root.querySelector("[data-action='open-news-large']");
  const closeLargeButton = root.querySelector("[data-action='close-news-large']");

  if (revealButton && newsCard) {
    revealButton.addEventListener("click", () => {
      revealedNewsRounds.add(state.currentRoundIndex);
      newsCard.classList.add("is-revealed");
      const announce = newsCard.querySelector("#newsAnnounce");
      if (announce) {
        announce.textContent = `${state.currentRoundIndex + 1}라운드 뉴스가 공개되었습니다.`;
      }
      if (!state.timer.running && state.timer.remaining > 0) {
        startTimer();
      }
    });
  }

  if (openLargeButton) {
    const isRevealed = revealedNewsRounds.has(state.currentRoundIndex);
    openLargeButton.disabled = !isRevealed;
    openLargeButton.title = isRevealed ? "" : "뉴스를 먼저 공개하세요";
    openLargeButton.addEventListener("click", () => {
      if (!revealedNewsRounds.has(state.currentRoundIndex)) return;
      enlargedNewsOpen = true;
      render();
    });
  }

  if (closeLargeButton) {
    closeLargeButton.addEventListener("click", () => {
      enlargedNewsOpen = false;
      render();
    });
  }
}

function bindLargeNewsControls(root) {
  const openLargeButton = root.querySelector("[data-action='open-news-large']");
  const closeLargeButton = root.querySelector("[data-action='close-news-large']");

  if (openLargeButton) {
    openLargeButton.addEventListener("click", () => {
      enlargedNewsOpen = true;
      render();
    });
  }

  if (closeLargeButton) {
    closeLargeButton.addEventListener("click", () => {
      enlargedNewsOpen = false;
      render();
    });
  }
}

function newsLargeViewTemplate() {
  return `
    <div class="news-large-backdrop" role="dialog" aria-modal="true" aria-label="시장 뉴스 크게 보기">
      <article class="news-large-panel">
        <div class="news-card-toolbar">
          <span class="news-label">시장 뉴스 크게 보기</span>
          <button class="mini-button" type="button" data-action="close-news-large">닫기</button>
        </div>
        <div class="news-large-content">
          ${roundNewsHintTemplate()}
        </div>
      </article>
    </div>
  `;
}

function bindLargeBoardToggleControls(root) {
  const openBtn = root.querySelector("[data-action='open-board-large']");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      enlargedBoardOpen = true;
      render();
    });
  }
}

function bindLargeBoardControls(root) {
  const closeBtn = root.querySelector("[data-action='close-board-large']");
  const backdrop = root.querySelector(".board-large-backdrop");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      enlargedBoardOpen = false;
      render();
    });
  }
  if (backdrop) {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        enlargedBoardOpen = false;
        render();
      }
    });
  }
}

function boardLargeViewTemplate(round) {
  const direction = getRoundDirection(round);
  const isUp = direction === "up";
  const earners = round.strongRoles.length ? round.strongRoles.join(" · ") : "외화를 벌어들이는 역할";
  const spenders = round.weakRoles.length ? round.weakRoles.join(" · ") : "외화를 써야 하는 역할";
  const favorableReason = isUp
    ? "달러를 벌어들이는 쪽은 받은 달러를 원화로 바꿀 때 더 많은 원화를 받을 수 있습니다."
    : "달러를 써야 하는 쪽은 같은 달러를 사는 데 필요한 원화가 줄어 비용 부담이 낮아집니다.";
  const unfavorableReason = isUp
    ? "달러를 써야 하는 쪽은 같은 달러를 사는 데 더 많은 원화가 필요해 비용 부담이 커집니다."
    : "달러를 벌어들이는 쪽은 받은 달러를 원화로 바꿀 때 받을 수 있는 원화가 줄어듭니다.";
  return `
    <div class="board-large-backdrop" role="dialog" aria-modal="true" aria-label="판서 크게 보기">
      <article class="board-large-panel">
        <div class="board-large-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: var(--space-2)">
          <span style="font-size: 16px; font-weight: 800; color: #7DD3FC">📝 오늘의 판서 학습</span>
          <button class="mini-button" type="button" data-action="close-board-large" style="background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.2)">닫기</button>
        </div>
        <div class="board-large-content" style="display: grid; gap: var(--space-5)">
          <h2 style="font-size: 32px; font-weight: 800; color: #fff; margin: 0">같은 환율, 다른 결과</h2>
          <div class="board-large-rule ${isUp ? "" : "rule-down"}" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); background: rgba(255,255,255,0.06); border-radius: var(--r-lg)">
            <strong style="font-size: 26px; font-weight: 900; color: ${isUp ? '#FCA5A5' : '#86EFAC'}">${isUp ? "📈 환율 상승" : "📉 환율 하락"}</strong>
            <span style="font-size: 20px; color: rgba(255,255,255,0.8)">${isUp ? "달러 가격이 오르고 원화 가치는 낮아집니다. (원화 가치 하락)" : "달러 가격이 내리고 원화 가치는 높아집니다. (원화 가치 상승)"}</span>
          </div>
          <div class="board-large-columns" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); margin-top: var(--space-2)">
            <section style="background: rgba(34,197,94,0.08); padding: var(--space-4); border-radius: var(--r-lg); border: 1.5px solid rgba(34,197,94,0.2)">
              <h4 style="font-size: 20px; color: #86EFAC; margin: 0 0 var(--space-2); border-bottom: 2px solid rgba(134,239,172,0.2); padding-bottom: 8px">👍 유리한 역할</h4>
              <p style="font-size: 24px; font-weight: 800; color: #fff; margin: 12px 0">${earners}</p>
              <span style="font-size: 18px; color: rgba(255,255,255,0.7); line-height: 1.6; display: block">${favorableReason}</span>
            </section>
            <section style="background: rgba(239,68,68,0.08); padding: var(--space-4); border-radius: var(--r-lg); border: 1.5px solid rgba(239,68,68,0.2)">
              <h4 style="font-size: 20px; color: #FCA5A5; margin: 0 0 var(--space-2); border-bottom: 2px solid rgba(252,165,165,0.2); padding-bottom: 8px">👎 불리한 역할</h4>
              <p style="font-size: 24px; font-weight: 800; color: #fff; margin: 12px 0">${spenders}</p>
              <span style="font-size: 18px; color: rgba(255,255,255,0.7); line-height: 1.6; display: block">${unfavorableReason}</span>
            </section>
          </div>
          <div class="board-large-summary" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: var(--space-2); padding-top: var(--space-4); border-top: 1px dashed rgba(255,255,255,0.2)">
            <div style="background: rgba(255,255,255,0.04); padding: var(--space-4); border-radius: var(--r-lg)">
              <h4 style="font-size: 18px; color: #7DD3FC; margin: 0 0 10px">💡 환율 변동과 경제 주체</h4>
              <ul style="font-size: 15px; color: rgba(255,255,255,0.8); line-height: 1.6; margin: 0; padding-left: 20px">
                <li>환율이 변하면 모든 사람에게 똑같은 영향이 가지 않고, 각자 하는 일(역할)에 따라 유리하거나 불리해집니다.</li>
                <li><strong>환율 상승 시:</strong> 외화 버는 쪽(수출, 관광 매장 등) 유리 / 외화 쓰는 쪽(유학, 수입 등) 불리</li>
                <li><strong>환율 하락 시:</strong> 외화 쓰는 쪽(유학, 수입 등) 유리 / 외화 버는 쪽(수출, 관광 매장 등) 불리</li>
              </ul>
            </div>
            <div style="background: rgba(255,255,255,0.04); padding: var(--space-4); border-radius: var(--r-lg)">
              <h4 style="font-size: 18px; color: #C084FC; margin: 0 0 10px">🎯 현명한 외환 대응 전략</h4>
              <ul style="font-size: 15px; color: rgba(255,255,255,0.8); line-height: 1.6; margin: 0; padding-left: 20px">
                <li>환율이 오를지 내릴지 짐작해서 한 번에 돈을 바꾸는 것은 위험합니다. 조금씩 나누어 바꾸거나 미리 고정된 환율로 약속하는 것이 손해를 막는 현명한 전략입니다.</li>
                <li>"환율은 단순한 숫자가 아니라, 우리가 돈을 아끼거나 수출을 늘리는 등 현명하게 선택할 수 있게 돕는 신호등 역할을 합니다."</li>
              </ul>
            </div>
          </div>
        </div>
      </article>
    </div>
  `;
}

function bindLargeBoardToggleControls(root) {
  const openBtn = root.querySelector("[data-action='open-board-large']");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      enlargedBoardOpen = true;
      render();
    });
  }
}

function bindLargeBoardControls(root) {
  const closeBtn = root.querySelector("[data-action='close-board-large']");
  const backdrop = root.querySelector(".board-large-backdrop");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      enlargedBoardOpen = false;
      render();
    });
  }
  if (backdrop) {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        enlargedBoardOpen = false;
        render();
      }
    });
  }
}

function promptPanelTemplate(text, includeFrame = false) {
  return `
    <article class="prompt-panel">
      <h3>🗣️ 모둠 토의 질문</h3>
      <p>${text}</p>
      ${includeFrame ? `
        <div class="discussion-frame">
          <strong>📣 발표 문장 틀 (이대로 읽어보세요)</strong>
          <span>"우리 역할은 환율이 <b>[상승/하락]</b>하면 <b>[유리/불리]</b>합니다. 왜냐하면..."</span>
          <span>"이번 뉴스는 달러 <b>[수요/공급]</b>의 변화로 환율 <b>[상승/하락]</b>을 암시합니다."</span>
          <span>"따라서 우리는 위험을 분산하기 위해 <b>[선택 전략]</b>을 선택했습니다."</span>
        </div>
      ` : ""}
    </article>
  `;
}

function timerPanelTemplate() {
  const progress = state.timer.duration ? Math.round((state.timer.remaining / state.timer.duration) * 100) : 0;
  return `
    <article class="timer-panel ${state.timer.remaining <= 10 ? "timer-panel-danger" : state.timer.remaining <= 20 ? "timer-panel-warning" : ""}" style="--timer-progress: ${progress}%">
      <h3>토의 타이머</h3>
      <div class="timer-orb" aria-label="남은 시간">
        <strong id="timerDisplay">${formatTime(state.timer.remaining)}</strong>
      </div>
      <div class="timer-presets">
        <button class="mini-button" type="button" data-timer-duration="30">30초</button>
        <button class="mini-button" type="button" data-timer-duration="45">45초</button>
        <button class="mini-button" type="button" data-timer-duration="60">60초</button>
      </div>
      <div class="action-row">
        <button class="primary-button" type="button" data-timer-action="start" ${state.timer.running ? "disabled" : ""}>▷ ${state.timer.running ? "진행 중" : "시작"}</button>
        <button class="secondary-button" type="button" data-timer-action="pause">Ⅱ 일시정지</button>
        <button class="ghost-button timer-reset-button" type="button" data-timer-action="reset" title="다시 설정" aria-label="다시 설정">↻</button>
      </div>
    </article>
  `;
}

function getRoleType(roleName) {
  const earners = ["수출", "K-pop", "관광객", "가게"];
  return earners.some((k) => roleName.includes(k)) ? "earner" : "spender";
}

function roleCardTemplate(team) {
  const visual = roleVisualTemplate(team);
  const roleType = getRoleType(team.role.name);
  const typeLabel = roleType === "earner"
    ? `<span class="role-type-badge role-type-earner">💰 외화 버는 쪽</span>`
    : `<span class="role-type-badge role-type-spender">💸 외화 쓰는 쪽</span>`;
  return `
    <article class="role-card" style="border-top: 4px solid ${visual.line};">
      <div class="role-card-header" style="background: ${visual.bg};">
        <span class="role-card-icon" aria-hidden="true">${visual.icon}</span>
        <div class="role-card-titles">
          <span class="role-card-team">${escapeHtml(team.name)}</span>
          <strong class="role-card-name">${team.role.name}</strong>
        </div>
        ${typeLabel}
      </div>
      <p class="role-desc">${team.role.description}</p>
      <div class="role-advantage-row">
        <span class="role-adv role-adv-good">유리: ${team.role.strongWhen}</span>
        <span class="role-adv role-adv-bad">불리: ${team.role.weakWhen}</span>
      </div>
      <p class="role-hint">${team.role.explanation}</p>
      <div class="compact-stats" style="margin-top: var(--space-3)">
        <span><small>시작 자금</small><strong>${team.money}만 원</strong></span>
      </div>
    </article>
  `;
}

function teamChoiceTemplate(team, round) {
  const selected = state.selections[team.id] || {};
  const visual = roleVisualTemplate(team);
  const choices = roleStrategyOptions(team.role.name, round);
  const roleType = getRoleType(team.role.name);
  const typeBadge = roleType === "earner"
    ? `<span class="role-type-badge role-type-earner">💰 외화 수입 모둠</span>`
    : `<span class="role-type-badge role-type-spender">💸 외화 지출 모둠</span>`;
  return `
    <article class="team-card ${isTeamSelectionComplete(selected) ? "selected" : ""}">
      <div class="team-role-banner" style="--team-bg: ${visual.bg}; --team-text: ${visual.text}; --team-line: ${visual.line}">
        <span aria-hidden="true">${visual.icon}</span>
        <div class="team-role-titles">
          <strong>${escapeHtml(team.name)} · ${team.role.name}</strong>
          ${typeBadge}
        </div>
        <em class="${isTeamSelectionComplete(selected) ? "done" : "pending"}">${isTeamSelectionComplete(selected) ? "✓ 완료" : "입력 중"}</em>
      </div>
      <div class="team-stats-row">
        <span class="metric">대응 점수 ${team.score}점</span>
        <span class="metric">자금 ${team.money}만 원</span>
      </div>
      <div class="decision-block">
        <strong>환율 예측</strong>
        <div class="segmented-options">
          ${PREDICTION_OPTIONS.map((option) => `
            <button class="mini-button ${selected.prediction === option.value ? "selected" : ""}" type="button" aria-pressed="${selected.prediction === option.value ? "true" : "false"}" data-choice-button data-select-type="prediction" data-team-id="${team.id}" data-value="${option.value}">
              ${option.label}
            </button>
          `).join("")}
        </div>
      </div>
      <div class="decision-block">
        <strong>환율 변동의 영향</strong>
        <div class="segmented-options">
          ${IMPACT_OPTIONS.map((option) => `
            <button class="mini-button ${selected.impact === option.value ? "selected" : ""}" type="button" aria-pressed="${selected.impact === option.value ? "true" : "false"}" data-choice-button data-select-type="impact" data-team-id="${team.id}" data-value="${option.value}">
              ${option.label}
            </button>
          `).join("")}
        </div>
      </div>
      <div class="choice-section-label">우리의 선택</div>
      <div class="choices-list">
        ${choices.map((choice, index) => `
          <button class="choice-button ${selected.choiceIndex === index ? "selected" : ""}" type="button" aria-pressed="${selected.choiceIndex === index ? "true" : "false"}" data-choice-button data-select-type="strategy" data-team-id="${team.id}" data-choice-index="${index}" ${selected.choiceIndex === index ? "disabled" : ""}>
            <span>${choice.text}</span>
          </button>
        `).join("")}
      </div>
    </article>
  `;
}

const STRATEGY_VARIATIONS = {
  traveler: {
    split: [
      "여행 경비를 한 번에 환전하지 않고 분할 환전한다",
      "환율 변동에 대응하기 위해 여행 경비를 며칠로 나누어 조금씩 환전한다",
      "평균 환율 리스크를 낮추기 위해 여행 자금을 여러 차례 분할 환전한다"
    ],
    wait: [
      "환전 시점을 늦추며 환율이 떨어지기를 기다린다",
      "환율 추가 하락을 기대하며 우선은 환전 결정을 미루고 지켜본다",
      "환율 흐름이 더 유리해질 때까지 일단 환전 시기를 뒤로 늦춘다"
    ],
    protect: [
      "여행 예산을 축소하거나 국내 여행으로 일부 대체한다",
      "환율 상승 부담을 줄이기 위해 현지 쇼핑 지출을 아끼고 예산을 조정한다",
      "해외 지출을 절감하고자 일정을 일부 단축하거나 국내 대체 여행을 계획한다"
    ],
    lock: [
      "지금 전액 환전하여 앞으로의 추가 환율 불안을 없낸다",
      "더 큰 환율 불안이 닥치기 전에 필요한 경비 전액을 지금 즉시 환전한다",
      "추가적인 환율 상승 위험을 선제적으로 차단하고자 현 시점에 일괄 환전한다"
    ]
  },
  exporter: {
    expand: [
      "바이어 대상 마케팅을 확대하고 수출 선적을 서두른다",
      "해외 홍보를 공격적으로 강화하고 수출 선적 물량을 신속히 출고한다",
      "바이어 마케팅을 강화하는 동시에 제품 수출 선적 일정을 최대한 앞당긴다"
    ],
    split: [
      "수출 대금으로 받은 달러를 날짜별로 나누어 원화로 환전한다",
      "해외 수령 달러 대금을 주 단위로 쪼개어 차례대로 원화로 바꾼다",
      "한꺼번에 바꾸는 리스크를 피하도록 수출 대금 환전을 여러 번 분배하여 실행한다"
    ],
    protect: [
      "수출 계약 시 결제 대금을 원화(KRW)로 고정하거나 고정 환율 계약을 맺는다",
      "바이어와 사전에 고정된 환율로 결제하도록 계약 조건을 체결하여 환리스크를 회피한다",
      "환율 변동에 흔들리지 않도록 결제 대금을 원화로 확정하거나 고정 환율 계약을 맺는다"
    ],
    wait: [
      "원화 환산 이익을 높이기 위해 달러 환전을 최대한 미룬다",
      "환율 상승으로 인한 이익 극대화를 위해 환전 시점을 가능한 뒤로 미룬다",
      "수출 달러 대금 환전을 뒤로 보류하여 원화 환산 가치가 최고일 때 바꾼다"
    ]
  },
  importer: {
    split: [
      "수입 결제용 달러를 분할 구매하여 환율 변동 위험을 낮춘다",
      "결제할 외화를 며칠에 나누어 사들여 달러 평균 매입 단가를 안정화한다",
      "수입 대금 결제용 달러를 수차례 분산 구매하여 환리스크를 고르게 나눈다"
    ],
    wait: [
      "수입 대금 결제일을 최대한 연기하고 환율 하락을 기다린다",
      "대금 결제 기한을 뒤로 미루며 환율이 더 떨어질 때까지 지켜본다",
      "외화 송금을 가능한 늦추면서 시장의 환율 하락 안정에 대기한다"
    ],
    protect: [
      "수입 물량을 긴급 감축하고 국내 대체 거래처를 확보한다",
      "수입 단가가 오른 품목의 공급량을 조절하고 대체 국내 거래처를 물색한다",
      "비싼 수입 원가를 방어하기 위해 국내 유통망을 통해 유사 품목 대체재를 수급한다"
    ],
    lock: [
      "선물환 계약 등을 통해 결제 환율을 현재 시점에 고정한다",
      "은행 선물환 서비스를 신청하여 장래의 결제 환율을 미리 고정해 둔다",
      "미래의 환율 변동 부담을 원천 차단하기 위해 지금 결제 환율을 확정 계약한다"
    ]
  },
  buyer: {
    split: [
      "직구 결제 시 여러 품목의 구매 시점을 분산한다",
      "장바구니 직구 상품 결제 요일을 나누어 분할 구매를 진행한다",
      "구매 시점을 며칠 간격으로 쪼개서 결제해 환율 변동 위험을 분배한다"
    ],
    wait: [
      "장바구니 상품 결제를 보류하고 할인 시즌이나 환율 하락을 대기한다",
      "주문을 잠시 멈추고 블랙프라이데이나 환율이 내릴 시기를 모니터링한다",
      "환율 상황이 비교적 잠잠해질 때까지 장바구니 결제 진행을 일시 대기한다"
    ],
    protect: [
      "해외직구 대신 국내 쇼핑몰이나 대체 국산 브랜드를 이용한다",
      "직구 메리트가 낮아진 상황이므로 가성비 좋은 국산 브랜드로 소비를 전환한다",
      "환율 변동 부담이 없는 국내 쇼핑몰이나 대체 상품 구매로 눈을 돌린다"
    ],
    lock: [
      "더 오르기 전에 꼭 필요한 직구 상품은 즉시 결제한다",
      "나중에 환율이 더 오기 전에 필요 수준의 직구 제품을 곧바로 결제한다",
      "추가 환율 상승으로 인한 손해를 방지하고자 필요한 물품을 지금 즉시 구매한다"
    ]
  },
  student: {
    split: [
      "학비와 생활비용 달러 송금액을 분기별로 나누어 송금한다",
      "거액 송금에 따른 리스크를 관리하도록 생활비와 등록금을 주기적으로 분할 송금한다",
      "송금 시기를 고르게 쪼개 보냄으로써 환율 급변 위험을 평준화한다"
    ],
    wait: [
      "학비 마감일까지 송금을 연기하며 달러 가격이 하락하기를 대기한다",
      "학비 납기일 직전까지 달러 가격 추이를 살피며 외화 송금을 늦춘다",
      "송금 마감일 한도 안에서 달러가 더 저렴해지기를 기다렸다가 보낸다"
    ],
    protect: [
      "환율이 저렴할 때 미리 외화예금(달러 통장)에 저축해 둔 달러를 찾아서 송금한다",
      "갑작스러운 환율 상승에 대비해 평소 조금씩 사두었던 외화 통장의 달러로 등록금을 낸다",
      "과거 환율이 안정적일 때 외화 적금으로 적립해 둔 달러 자금을 인출하여 송금한다"
    ],
    lock: [
      "미리 1년 치 학비를 전액 환전 및 송금하여 등록금 변동 위험을 제거한다",
      "추가적인 환율 폭등 위험에 대비해 1년 동안 쓸 유학 비용을 지금 선송금한다",
      "나중에 원화 가치가 더 떨어질 것에 대비해 현시점에 학비 전액을 먼저 송금한다"
    ]
  },
  shop: {
    expand: [
      "외국인 대상 온라인 프로모션을 늘리고 안내 서비스를 강화한다",
      "해외 SNS 홍보를 늘리고 외국인 관광객 맞춤 다국어 서비스를 보강한다",
      "해외 여행객 유치를 위해 타겟 프로모션을 개시하고 매장 서비스를 강화한다"
    ],
    split: [
      "결제 대금으로 들어온 달러 및 모바일 페이 환전 시점을 주 단위로 분산한다",
      "방문객들이 지불한 외화 및 간편결제 환전을 여러 날짜에 나누어 실행한다",
      "외국인 결제 대금을 모아서 한 번에 환전하지 않고 일정 주기로 쪼개어 환전한다"
    ],
    protect: [
      "내수 고객용 신메뉴를 개발하고 국내 관광객 유치 이벤트를 강화한다",
      "해외 관광객에만 쏠리지 않도록 국내 로컬 고객 전용 신상품과 행사를 추진한다",
      "매장의 안정적 매출을 지키기 위해 국내 거주 소비자를 위한 행사를 확대한다"
    ],
    wait: [
      "환율이 최고점에 도달할 때까지 달러 대금 환전을 보류하고 보관한다",
      "추가 환율 상승 시기에 맞춘 환전 차익을 얻으려고 달러화 환전을 홀딩한다",
      "더 많은 원화를 확보할 수 있도록 보유한 외화 대금의 환전을 당분간 보류한다"
    ]
  },
  factory: {
    split: [
      "원자재 수입 물량을 주 단위로 잘게 나누어 구매 계약을 맺는다",
      "대량의 원자재 매입 계약을 주 단위 또는 월 단위 분할 형태로 분산 체결한다",
      "수입 원자재 물량을 분할 발주함으로써 단가 변동과 환리스크를 분해한다"
    ],
    wait: [
      "재고 잔량을 최대한 사용하며 가격과 환율이 하락하기를 대기한다",
      "공장에 쌓인 원자재 재고를 소진해 가면서 가격 및 환율 하락을 관망한다",
      "비축한 자재 재고로 공장을 우선 가동하고 수입 시기는 최대한 연기한다"
    ],
    protect: [
      "생산 공정을 효율화하여 원료 손실을 줄이고 국산 원료 대체 비율을 높인다",
      "원료 소모량을 최소화하는 혁신 공정을 가동하고 국산 자재 비율을 보강한다",
      "생산 손실률을 줄여 원가를 절감하고 가격이 비교적 싼 국산 대체 자재를 도입한다"
    ],
    lock: [
      "원자재 공급사와 장기 고정 환율 계약을 체결해 가격 안정성을 최우선 확보한다",
      "원자재 매입 거래처와 중장기 고정 계약을 맺어 원가 변동 위험을 묶어둔다",
      "환율의 극심한 요동 속에서 안정을 도모하기 위해 장기 고정단가 환율을 설정한다"
    ]
  },
  kpop: {
    expand: [
      "글로벌 월드투어 일정을 확대하고 해외 굿즈 판매를 적극 개시한다",
      "해외 콘서트 투어를 전격 확대하고 글로벌 타겟 MD 마케팅을 본격화한다",
      "달러 수익 기회를 넓히기 위해 월드투어 개최지와 굿즈 판매처를 확장한다"
    ],
    split: [
      "해외 티켓 대금과 로열티로 들어온 달러 수익을 월별로 분할 환전한다",
      "해외 로열티 정산 및 투어 수입 달러를 매월 일정 주기별로 나누어 환전한다",
      "한꺼번에 바꾸는 리스크를 방지하고자 수령한 외화 수익금을 일정 기간 나누어 원화로 환전한다"
    ],
    protect: [
      "해외 공연 출연 정산 조건을 안정적인 통화 고정 방식으로 조정한다",
      "급격한 외환 불안정성에 대응해 기획사 정산 방식을 계약 고정 환율로 조율한다",
      "파트너사들과의 공연/유통 계약 시 원화 혹은 통화 고정 비율 정산 방식을 취한다"
    ],
    wait: [
      "환율 상승의 수혜를 극대화하기 위해 달러 대금 환전하는 시기를 전면 대기한다",
      "달러 가치 상승에 맞춘 환산 이익을 보기 위해 외화 정산금 환전을 늦춘다",
      "기획사의 달러 수입금 환전을 당분간 보류하고 외화로 보관하며 시기를 조율한다"
    ]
  },
  default: {
    split: [
      "거래 시점을 나누어 위험을 분산한다",
      "환율 급변에 대비해 자금 거래 일정을 여러 차례로 쪼갠다",
      "외환 거래 횟수를 나누어서 평균 리스크 분산을 유도한다"
    ],
    protect: [
      "비용과 계약 조건을 다시 점검한다",
      "계약 조건을 세심히 조정하여 환율 영향으로부터 자산을 보호한다",
      "급박한 환율 변동을 이겨내도록 내부 원가와 협의 조건을 긴급 점검한다"
    ],
    expand: [
      "해외 거래를 적극적으로 늘린다",
      "해외 파트너십 유치 마케팅을 통해 기회를 늘린다",
      "글로벌 시장의 문을 더 두드리며 해외 판로 및 유입을 대폭 늘린다"
    ],
    wait: [
      "아무것도 하지 않고 지켜본다",
      "일단 어떤 행동도 취하지 않고 환율 상황이 바뀔 때까지 관망한다",
      "시장에 섣불리 대응하기보다 추가 정보를 파악하며 추이를 대기한다"
    ]
  }
};

function getRoleCategory(roleName) {
  if (roleName.includes("여행") || roleName.includes("관광객")) return "traveler";
  if (roleName.includes("수출기업")) return "exporter";
  if (roleName.includes("수입기업") && !roleName.includes("원자재")) return "importer";
  if (roleName.includes("직구")) return "buyer";
  if (roleName.includes("유학생")) return "student";
  if (roleName.includes("관광") || roleName.includes("가게")) return "shop";
  if (roleName.includes("원자재") || roleName.includes("공장")) return "factory";
  if (roleName.includes("K-pop") || roleName.includes("공연")) return "kpop";
  return "default";
}

function roleStrategyOptions(roleName, round) {
  const direction = getRoundDirection(round);
  const category = getRoleCategory(roleName);
  const roundIdx = state.currentRoundIndex || 0;
  
  const getParaphrase = (type) => {
    const list = STRATEGY_VARIATIONS[category]?.[type] || STRATEGY_VARIATIONS.default[type] || [];
    return list[roundIdx % list.length] || "";
  };

  if (category === "traveler") {
    return [
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? -2 : 4, stabilityChange: 6 }, feedback: direction === "up" ? "환율 상승기에는 분할 환전을 통해 달러가 가장 비쌀 때 올인해 환전하는 위험을 피할 수 있습니다." : "환율 하락기에는 분할 환전을 통해 달러 가격이 점차 내려가는 이점을 분산해 챙길 수 있습니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "down" ? 7 : -8, stabilityChange: -2 }, feedback: direction === "down" ? "환율 하락기에는 달러가 계속 저렴해지므로 환전 시점을 늦추는 대기 전략이 매우 유리하게 작용합니다." : "환율 상승기에는 환전을 미루는 대기가 독이 됩니다. 달러 가격이 계속 올라 여행 비용 부담이 크게 증가합니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: direction === "up" ? "환율이 크게 올라 예산이 부담될 때 해외 지출을 줄이거나 일정을 축소하는 것이 확실한 비용 방어 전략입니다." : "환율이 내려 지출 부담이 적은 시기지만, 과소비를 막기 위해 합리적으로 여행 예산을 조정하는 행동입니다." },
      { text: getParaphrase("lock"), type: "lock", effect: { moneyChange: direction === "up" ? -4 : 1, stabilityChange: 4 }, feedback: direction === "up" ? "환율 추가 상승 위험을 빠르게 회피하기 위해 현 시점에 일괄 환전하여 불안 요소를 제거하는 판단입니다." : "달러 가격이 하락하는 시기인데 한꺼번에 즉시 환전해버려, 향후 더 싸게 달러를 매입할 기회를 잃었습니다." }
    ];
  }
  
  if (category === "exporter") {
    return [
      { text: getParaphrase("expand"), type: "expand", effect: { moneyChange: direction === "up" ? 10 : 2, stabilityChange: 1 }, feedback: direction === "up" ? "환율 상승기에는 달러 가치가 높으므로, 수출 물량을 대폭 늘려 원화 환산 이익을 극대화하는 최고의 선택입니다." : "환율 하락기(원화 강세)에는 달러 가치가 떨어지므로, 수출 물량을 무리하게 늘려도 원화로 바꿀 때 손해를 보거나 마진이 크게 감소합니다." },
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? 6 : 2, stabilityChange: 6 }, feedback: direction === "up" ? "수출 대금을 나누어 원화로 환전해 평균 환율을 확보하고, 혹시 모를 환율 꺾임 위험에 대비합니다." : "환율 하락기에는 대금을 분할 환전하여 환율이 계속 하락할 때 발생할 수 있는 원화 수입 감소 피해를 고르게 분산하여 방어합니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 3, stabilityChange: 5 }, feedback: direction === "up" ? "달러 가치가 오르는 시기인데 원화 결제로 고정해 두면, 환율 상승으로 얻을 수 있는 원화 환산 이익 기회를 놓치게 됩니다." : "환율 하락기에는 원화 결제 고정이나 고정 환율 계약을 통해 환율 하락으로 인한 달러 대금의 원화 가치 급락 위험을 확실히 차단할 수 있습니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "up" ? 7 : -6, stabilityChange: -3 }, feedback: direction === "up" ? "달러 가격이 계속 오르고 있으므로 환전 시점을 최대한 늦추어 원화 환산 가치를 극대화하는 영리한 전략입니다." : "환율이 떨어지는 중인데 환전을 계속 미루면 달러 가치가 더 하락해 원화 환산액이 눈덩이처럼 줄어드는 큰 피해를 입습니다." }
    ];
  }
  
  if (category === "importer") {
    return [
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? -2 : 4, stabilityChange: 6 }, feedback: direction === "up" ? "환율이 오르고 있을 때 달러를 쪼개서 매입하면, 달러 평균 매입 단가를 낮추어 한 번에 비싸게 사는 위험을 방어합니다." : "환율 하락기에는 달러를 쪼개서 구매해 환율 하락 이득을 분산 챙기면서 자금의 안정성을 확보합니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "down" ? 7 : -8, stabilityChange: -2 }, feedback: direction === "down" ? "환율 하락기에는 달러 가치가 계속 떨어지므로 결제 시점을 미룰수록 더 적은 원화 비용으로 대금을 지불할 수 있어 유리합니다." : "환율 상승기에는 결제를 미루는 대기가 치명적입니다. 대금 결제일이 다가올수록 더 비싼 환율로 달러를 사야 하므로 비용이 폭증합니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: direction === "up" ? "환율이 올라 수입 비용이 치솟을 때 국내 대체 거래처로 눈을 돌려 원가 상승 압박을 피하는 현명한 방어책입니다." : "달러가 저렴해져 수입에 유리한 시기지만, 장기적 비용 관리와 안정성을 위해 국내 대체 공급망을 확보해 두는 대안입니다." },
      { text: getParaphrase("lock"), type: "lock", effect: { moneyChange: direction === "up" ? -4 : 1, stabilityChange: 4 }, feedback: direction === "up" ? "환율 상승세가 지속되어 수입 원가 부담이 커질 때, 미리 고정한 환율로 결제해 장래의 비용 불안정성을 차단하는 적절한 방어책입니다." : "달러 가격이 계속 떨어지는 시기인데 환율을 높은 시점에 미리 묶어버리면, 추가 하락으로 얻을 수 있는 원가 절감 기회를 상실합니다." }
    ];
  }
  
  if (category === "buyer") {
    return [
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? -2 : 4, stabilityChange: 6 }, feedback: direction === "up" ? "환율 상승으로 직구 단가가 오를 때 장바구니 결제 시점을 분산하여 달러 고점 매수의 위험을 분산합니다." : "환율 하락기에는 달러가 계속 싸지므로 분할 구매를 통해 점차 저렴해지는 혜택을 고르게 누릴 수 있습니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "down" ? 7 : -8, stabilityChange: -2 }, feedback: direction === "down" ? "환율 하락기에는 달러 가격이 계속 내려가므로 직구 결제를 미루고 대기하면 나중에 훨씬 싼 가격에 구매할 수 있습니다." : "환율 상승기에는 직구 결제를 미루다가는 달러가 계속 올라 결국 제품 가격이 더 비싸지거나 구매를 포기하게 됩니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: direction === "up" ? "환율이 올라 해외 제품이 비싸졌을 때, 가격 부담이 없는 국내 쇼핑몰이나 국산 대체품으로 빠르게 소비를 전환하는 현명한 선택입니다." : "달러가 저렴해서 직구가 유리해진 시기지만, 불필요한 해외 배송 대기 대신 신속한 국내 배송 제품으로 대체하는 판단입니다." },
      { text: getParaphrase("lock"), type: "lock", effect: { moneyChange: direction === "up" ? -4 : 1, stabilityChange: 4 }, feedback: direction === "up" ? "환율 추가 급등이 우려될 때 필요한 제품을 지금 가격으로 즉시 구매하여 가격 인상 부담을 회피하는 전략입니다." : "달러 가격이 내려가는 하락기인데 바로 구매해버려, 향후 더 저렴한 가격에 구매할 기회를 놓쳤습니다." }
    ];
  }
  
  if (category === "student") {
    return [
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? -2 : 4, stabilityChange: 6 }, feedback: direction === "up" ? "환율 상승기에 유학 자금을 분할 송금하여 한꺼번에 고점에서 송금하는 환율 리스크를 방어합니다." : "환율 하락기에는 점차 낮아지는 달러 환율 이점을 분할 송금으로 안정적으로 취하며 리스크를 줄입니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "down" ? 7 : -8, stabilityChange: -2 }, feedback: direction === "down" ? "환율 하락기에는 달러 가격이 계속 내려가므로, 학비 송금을 납기 한도 내에서 최대한 늦추어 원화 비용을 절약하는 최선의 대기 전략입니다." : "환율 상승기에는 송금을 지연시키다가 더 비싸진 환율로 학비를 보내야 하므로 가계의 원화 송금 부담이 폭발적으로 늘어납니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: direction === "up" ? "갑작스럽게 환율이 급등하여 등록금 송금 부담이 큰 시기인데, 과거 환율이 낮을 때 외화예금(달러 통장)에 저축해 두었던 달러를 인출하여 활용함으로써 비용 부담을 크게 아꼈습니다." : "과거에 환율이 저렴할 때 외화 적금으로 적립해 둔 달러 자금을 활용하여 안전하게 송금 처리를 마치는 방법입니다." },
      { text: getParaphrase("lock"), type: "lock", effect: { moneyChange: direction === "up" ? -4 : 1, stabilityChange: 4 }, feedback: direction === "up" ? "환율 폭등세가 장기화될 것으로 보일 때 1년 치 등록금을 현재 환율로 선송금하여 향후 추가 폭등 위험을 예방하는 판단입니다." : "달러가 계속 하락하여 원화 가치가 오르는 시기인데 거액의 1년 치 학비를 즉시 선송금해버려, 추가 환율 하락에 따른 큰 원화 절감 혜택을 놓치게 됩니다." }
    ];
  }
  
  if (category === "shop") {
    return [
      { text: getParaphrase("expand"), type: "expand", effect: { moneyChange: direction === "up" ? 10 : 2, stabilityChange: 1 }, feedback: direction === "up" ? "환율 상승기에는 원화 가치가 약해져 외국인들에게 한국 여행 물가가 매우 저렴하게 체감되므로, 이 기회를 활용해 적극적으로 관광객을 유치하는 최고의 판단입니다." : "환율 하락기에는 원화 가치가 올라 외국인 관광객들의 지갑이 닫히는 시기이므로, 무리한 해외 프로모션은 광고 비용만 낭비할 수 있습니다." },
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? 6 : 2, stabilityChange: 6 }, feedback: direction === "up" ? "관광 대금으로 모인 달러를 나누어 환전해 평균 환율을 확보하고, 혹시 모를 환율 꺾임 위험에 대처합니다." : "환율 하락기에는 외화 관광 결제 대금을 여러 시점에 분산하여 환전함으로써, 하루아침에 매출의 원화 환산 가치가 폭락하는 위험을 분산합니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 3, stabilityChange: 5 }, feedback: direction === "up" ? "환율 상승으로 해외 관광객이 많이 늘어난 시기지만, 국내 고객층의 비중도 안정적으로 지키기 위해 내수용 프로모션을 병행하여 균형을 잡는 방안입니다." : "환율 하락으로 외국인 관광객 소비가 급감할 때, 빠르게 국내 관광객 및 로컬 내수 고객 대상의 신상품과 행사를 추진하여 매출 타격을 방어하는 현명한 피봇 전략입니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "up" ? 7 : -6, stabilityChange: -3 }, feedback: direction === "up" ? "달러 가치가 계속 올라가고 있으므로 외화 결제 대금 환전을 보류하고 모았다가 원화 가치가 최고점일 때 바꾸는 합리적인 대기 행동입니다." : "환율이 떨어져 달러 가치가 내리는 중인데 환전을 미루고 홀딩하고 있으면, 하루가 다르게 원화 매출액이 감소하는 손실을 겪습니다." }
    ];
  }
  
  if (category === "factory") {
    return [
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? -2 : 4, stabilityChange: 6 }, feedback: direction === "up" ? "원자재 수입을 분할 발주해 평균 수입 단가를 낮추며 환율 급상승 리스크를 방어하는 안전한 조달 방식입니다." : "원자재 가격 및 환율 하락의 혜택을 안정적인 분할 체결로 나누어 반영하여 원료 조달 단가를 낮추는 방법입니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "down" ? 7 : -8, stabilityChange: -2 }, feedback: direction === "down" ? "환율 하락기에는 달러가 계속 싸지므로, 기존 원자재 재고를 소진해가며 구매를 늦추면 수입 비용을 크게 절감할 수 있는 훌륭한 대기 전략입니다." : "환율 상승기에는 비축 재고만 믿고 원자재 수입을 미루다가는 재고가 바닥난 시점에 엄청나게 비싸진 환율로 원료를 강제 수입해야 하므로 공장 비용이 폭증합니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: direction === "up" ? "원자재 가격과 환율이 치솟을 때, 공정 손실을 줄이고 비교적 저렴한 국산 대체 자재로 빠르게 전환하여 공장 마진을 확보하는 든든한 방어막입니다." : "수입 비용 부담이 적은 시기지만 장기적인 원가 절감을 위해 공장 생산 공정을 혁신하고 대체 자재 비율을 보강하는 행동입니다." },
      { text: getParaphrase("lock"), type: "lock", effect: { moneyChange: direction === "up" ? -4 : 1, stabilityChange: 4 }, feedback: direction === "up" ? "환율이 오르는 추세에서 장기 고정 환율 계약을 맺어 미래의 수입 원가를 현재 시점에 안정적으로 묶어두는 좋은 방어 조치입니다." : "달러 가격이 하락하는 중인데 원자재 장기 수입 환율을 미리 높은 수준으로 묶어버려, 향후 단가 하락에 따른 이익을 보지 못합니다." }
    ];
  }
  
  if (category === "kpop") {
    return [
      { text: getParaphrase("expand"), type: "expand", effect: { moneyChange: direction === "up" ? 10 : 2, stabilityChange: 1 }, feedback: direction === "up" ? "환율 상승기에는 달러로 버는 티켓 및 굿즈 수익의 원화 가치가 폭등하므로, 글로벌 공연 일정을 공격적으로 넓혀 기획사 수익을 극대화하는 최고의 전략입니다." : "환율 하락기에는 달러 수익을 원화로 바꿀 때 환차손이 발생하므로, 무리한 글로벌 투어 확대보다는 현지 운영 비용 지출 리스크를 조율해야 합니다." },
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? 6 : 2, stabilityChange: 6 }, feedback: direction === "up" ? "글로벌 정산금 환전을 쪼개어 실행해 평균 환율을 취하며 급격한 환율 하락 변동에 선제 대처합니다." : "달러 가격이 계속 내리는 하락기에는 글로벌 수익금을 주기적으로 여러 번 환전하여 원화 가치 급락으로 인한 환차손 위험을 평준화합니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 3, stabilityChange: 5 }, feedback: direction === "up" ? "해외 공연 정산금을 원화나 고정 환율로 묶어두면, 환율 상승에 따른 추가 달러 환산 수익 혜택을 누리지 못해 아쉬운 선택이 됩니다." : "환율이 떨어질 때는 해외 파트너와의 정산 방식을 계약 당시 고정된 환율이나 원화 지급 방식으로 전환하여 기획사 매출이 환손실로 깎여나가는 것을 안전하게 지킬 수 있습니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "up" ? 7 : -6, stabilityChange: -3 }, feedback: direction === "up" ? "달러 가치가 오르고 있으므로 해외 티켓 수입 환전 시기를 뒤로 보류하여 원화 환산 가치가 최고일 때 환전하는 현명한 조치입니다." : "환율 하락기인데도 환전을 계속 보류하면, 보유한 달러의 원화 가치가 점점 떨어져 결국 기획사 정산 매출이 축소되는 불이익을 당합니다." }
    ];
  }

  return [
    { text: getParaphrase("split"), type: "split", effect: { moneyChange: 3, stabilityChange: 6 }, feedback: direction === "up" ? "환율 상승 시점에 분할 대응하여 고점 매수/저점 매도의 불안을 덜어내고 안정성을 도모합니다." : "환율 하락의 이점을 안정적으로 가져가기 위해 분할 거래를 진행하여 리스크를 분산합니다." },
    { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: direction === "up" ? "불리한 환율 조건에 대항하기 위해 내부 거래 가격이나 계약 조건을 신속히 보호 장치로 묶어둡니다." : "환율 변동 폭에 구애받지 않도록 사전에 계약 조건을 안전하게 조율하여 위험을 차단합니다." },
    { text: getParaphrase("expand"), type: "expand", effect: { moneyChange: 5, stabilityChange: 0 }, feedback: direction === "up" ? "글로벌 기회가 커지는 환경을 적극 공략하여 달러 수익 기회를 극대화합니다." : "환율 하락로 마진이 위축될 수 있으므로 지나치게 공격적인 해외 확장보다는 조율이 필요합니다." },
    { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: 0, stabilityChange: -3 }, feedback: direction === "down" ? "환율 하락기에는 시장을 관망하며 보다 유리한 조건이 찾아올 때까지 대기하는 판단이 적절할 수 있습니다." : "환율 상승기에 아무 대책 없이 대기하다가는 향후 추가적인 외화 조달 비용 증가를 감당해야 할 수 있습니다." }
  ];
}

function roleVisualTemplate(team) {
  const roleName = team.role.name;
  if (roleName.includes("수출"))  return { icon: "🏭", bg: "#FFE6E1", text: "#A8331F", line: "#FF6B57" };
  if (roleName.includes("K-pop")) return { icon: "🎤", bg: "#FFE0EF", text: "#8E1F5F", line: "#FF49A4" };
  if (roleName.includes("수입") && !roleName.includes("원자재")) return { icon: "📦", bg: "#E9EEFD", text: "#0C2A8C", line: "#2E58E0" };
  if (roleName.includes("원자재")) return { icon: "🏗️", bg: "#E5ECF1", text: "#22323D", line: "#4F6B7C" };
  if (roleName.includes("여행"))  return { icon: "✈️", bg: "#D9F4EA", text: "#0A6E4F", line: "#1FBF8F" };
  if (roleName.includes("직구"))  return { icon: "🛒", bg: "#FFF1D2", text: "#7A4E00", line: "#F4B740" };
  if (roleName.includes("유학생")) return { icon: "🎓", bg: "#E8E3F9", text: "#3D2E8B", line: "#6E55C8" };
  if (roleName.includes("관광") || roleName.includes("가게")) return { icon: "🏪", bg: "#FCE2E7", text: "#8A1F36", line: "#E94D6A" };
  return { icon: "💱", bg: "#E9EEFD", text: "#0C2A8C", line: "#2E58E0" };
}

function teacherSubmissionPanelTemplate() {
  return `
    <aside class="submission-panel" aria-label="선생님용 제출 현황">
      <strong>제출 현황</strong>
      ${state.teams.map((team) => {
        const done = isTeamSelectionComplete(state.selections[team.id]);
        return `<span class="${done ? "is-done" : ""}">${escapeHtml(team.name)} 제출: ${done ? "✅ 완료" : "⏳ 대기중"}</span>`;
      }).join("")}
    </aside>
  `;
}

function resultCardTemplate(team) {
  const last = team.history[team.history.length - 1];
  const choiceFeedback = last.choiceFeedback || "";
  return `
    <article class="change-card">
      <div class="result-card-head">
        <h3 class="result-card-title">${escapeHtml(team.name)} <span class="result-role-name">${team.role.name}</span></h3>
        ${profitBadgeTemplate(team, last)}
      </div>
      <div class="result-selections">
        <span class="result-sel ${last.response.predictionScore ? "is-correct" : "is-wrong"}">
          ${last.response.predictionScore ? "✓" : "✗"} 예측 ${predictionLabel(last.prediction)}
        </span>
        <span class="result-sel ${last.response.impactScore ? "is-correct" : "is-wrong"}">
          ${last.response.impactScore ? "✓" : "✗"} 영향 ${impactLabel(last.impact)}
        </span>
        <span class="result-sel">대응 선택: ${last.choiceText}</span>
      </div>
      ${choiceFeedback ? `<p class="result-feedback">${choiceFeedback}</p>` : ""}
      <div class="response-score-row">
        <div class="score-chip ${last.response.predictionScore ? "ok" : "miss"}" data-tooltip="${last.response.predictionScore ? '환율 변동 방향 예측 성공 (+5점)' : '환율 변동 방향 예측 실패 (+0점)'}">
          <span>환율 예측</span><strong>${last.response.predictionScore}점</strong>
        </div>
        <div class="score-chip ${last.response.impactScore ? "ok" : "miss"}" data-tooltip="${last.response.impactScore ? '우리 역할에 미치는 유불리 분석 성공 (+3점)' : '우리 역할에 미치는 유불리 분석 실패 (+0점)'}">
          <span>역할 판단</span><strong>${last.response.impactScore}점</strong>
        </div>
        <div class="score-chip total" data-tooltip="환율 예측(${last.response.predictionScore}점) + 역할 판단(${last.response.impactScore}점) = 총 ${last.response.total}점">
          <span>이번 점수</span><strong>${last.response.total}점</strong>
        </div>
      </div>
      <div class="metric-row">
        ${deltaTemplate("자금", last.total.moneyChange)}
        <span class="metric">누적 점수 ${team.score}점</span>
        <span class="metric">자금 ${team.money}만 원</span>
      </div>
    </article>
  `;
}

function responseReasonTemplate(last) {
  const prediction = last.response.predictionScore ? "환율 방향을 맞혔고" : "환율 방향 예측은 빗나갔고";
  const impact = last.response.impactScore ? "우리 역할의 유불리도 정확히 판단했습니다." : "우리 역할의 유불리 판단은 다시 확인해야 합니다.";
  return `${prediction}, ${impact}`;
}

function predictionLabel(value) {
  return PREDICTION_OPTIONS.find((option) => option.value === value)?.label || "-";
}

function impactLabel(value) {
  return IMPACT_OPTIONS.find((option) => option.value === value)?.label || "-";
}

function assetBarChartTemplate() {
  const maxMoney = Math.max(...state.teams.map((team) => team.money), 1);
  const rowHeight = 44;
  const chartHeight = state.teams.length * rowHeight + 12;
  return `
    <article class="asset-chart-card">
      <h3 class="section-label">팀별 현재 자산 비교</h3>
      <svg class="asset-bar-chart" style="height: ${chartHeight}px" viewBox="0 0 1000 ${chartHeight}" role="img" aria-label="팀별 현재 자산 가로 막대 차트">
        ${state.teams.map((team, index) => {
          const visual = roleVisualTemplate(team);
          const y = 8 + index * rowHeight;
          const width = Math.max(28, Math.round((team.money / maxMoney) * 640));
          const isTop = team.money === maxMoney;
          const valueX = Math.min(950, 160 + width + 16);
          return `
            <text class="bar-team-label" x="18" y="${y + 22}">${escapeHtml(team.name)}</text>
            <rect class="asset-bar ${isTop ? "is-top" : ""}" x="160" y="${y}" width="${width}" height="34" rx="6" fill="${visual.line}" ${isTop ? 'stroke="#d97706" stroke-width="4"' : ""}></rect>
            <text class="bar-value-label" x="${valueX}" y="${y + 22}">${team.money}만 원</text>
          `;
        }).join("")}
      </svg>
    </article>
  `;
}

function exchangeImpactBoardTemplate(round) {
  const direction = getRoundDirection(round);
  const isUp = direction === "up";
  const earners = round.strongRoles.length ? round.strongRoles.join("·") : "외화를 벌어들이는 역할";
  const spenders = round.weakRoles.length ? round.weakRoles.join("·") : "외화를 써야 하는 역할";
  const favorableReason = isUp
    ? "달러를 벌어들이는 쪽은 받은 달러를 원화로 바꿀 때 더 많은 원화를 받을 수 있습니다."
    : "달러를 써야 하는 쪽은 같은 달러를 사는 데 필요한 원화가 줄어 비용 부담이 낮아집니다.";
  const unfavorableReason = isUp
    ? "달러를 써야 하는 쪽은 같은 달러를 사는 데 더 많은 원화가 필요해 비용 부담이 커집니다."
    : "달러를 벌어들이는 쪽은 받은 달러를 원화로 바꿀 때 받을 수 있는 원화가 줄어듭니다.";
  return `
    <article class="impact-board">
      <div class="impact-board-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3)">
        <h3 style="margin: 0">판서: 같은 환율, 다른 결과</h3>
        <button class="mini-button" type="button" data-action="open-board-large" style="font-size: 11.5px; height: 28px; padding: 0 10px">크게 보기</button>
      </div>
      <div class="board-rule ${isUp ? "" : "rule-down"}">
        <strong>${isUp ? "환율 상승" : "환율 하락"}</strong>
        <span>${isUp ? "달러 가격이 오르고 원화 가치는 낮아집니다." : "달러 가격이 내리고 원화 가치는 높아집니다."}</span>
      </div>
      <div class="board-columns">
        <section>
          <h4>유리한 역할</h4>
          <p>${earners}</p>
          <span>${favorableReason}</span>
        </section>
        <section>
          <h4>불리한 역할</h4>
          <p>${spenders}</p>
          <span>${unfavorableReason}</span>
        </section>
      </div>
      <div class="board-note">
        💡 <strong>배움 핵심:</strong> 환율 변동은 각자가 맡은 역할(수출, 수입 등)에 따라 유리함과 불리함이 정반대로 나타납니다. 환율이 오를지 내릴지 어림짐작하기보다는, 상황에 맞춰 위험을 나누는(분할 환전 등) 대응 전략이 현명합니다.
      </div>
    </article>
  `;
}

function profitBadgeTemplate(team, last) {
  const startMoney = Math.max(1, team.money - last.total.moneyChange);
  const rate = ((team.money - startMoney) / startMoney) * 100;
  if (Math.abs(rate) < 0.05) {
    return '<span class="profit-badge neutral">— 0%</span>';
  }
  const isUp = rate > 0;
  return `<span class="profit-badge ${isUp ? "up" : "down"}">${isUp ? "▲" : "▼"} ${isUp ? "+" : ""}${rate.toFixed(1)}%</span>`;
}

function roundConceptCardTemplate(round) {
  const direction = getRoundDirection(round);
  const directionText = direction === "up" ? "환율이 올랐습니다. (USD/KRW ▲)" : direction === "down" ? "환율이 내렸습니다. (USD/KRW ▼)" : "환율 영향이 역할별로 다르게 나타났습니다.";
  const strongText = round.strongRoles.length ? round.strongRoles.join("·") : "상황을 잘 활용한 역할";
  const weakText = round.weakRoles.length ? round.weakRoles.join("·") : "해당 없음";
  const exchangeText = exchangeResultText(round);
  if (direction === "down") {
    return `
      <article class="round-core-card">
        <div class="round-core-head">
          <h3>📉 이번 라운드 핵심</h3>
          <button class="mini-button" type="button" data-action="open-news-large">뉴스 보기</button>
        </div>
        ${exchangeText}
        <p>${directionText}</p>
        <p>→ 경제 해석: ${round.resultFocus}</p>
        <p>→ 유리한 역할: ${strongText}</p>
        <p>→ 불리한 역할: ${weakText}</p>
      </article>
    `;
  }
  if (direction === "up") {
    return `
      <article class="round-core-card">
        <div class="round-core-head">
          <h3>📈 이번 라운드 핵심</h3>
          <button class="mini-button" type="button" data-action="open-news-large">뉴스 보기</button>
        </div>
        ${exchangeText}
        <p>${directionText}</p>
        <p>→ 경제 해석: ${round.resultFocus}</p>
        <p>→ 유리한 역할: ${strongText}</p>
        <p>→ 불리한 역할: ${weakText}</p>
      </article>
    `;
  }
  return `
    <article class="round-core-card">
      <div class="round-core-head">
        <h3>💡 이번 라운드 핵심</h3>
        <button class="mini-button" type="button" data-action="open-news-large">뉴스 보기</button>
      </div>
      ${exchangeText}
      <p>${directionText}</p>
      <p>→ 경제 해석: ${round.resultFocus}</p>
      <p>→ 유리한 역할: ${strongText}</p>
      <p>→ 불리한 역할: ${weakText}</p>
    </article>
  `;
}

function exchangeResultText(round) {
  if (!Number.isFinite(round.exchangeFrom) || !Number.isFinite(round.exchangeTo)) return "";
  const direction = getRoundDirection(round);
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "→";
  const change = round.exchangeTo - round.exchangeFrom;
  const sign = change > 0 ? "+" : "";
  return `
    <div class="exchange-result-line">
      <span>1달러</span>
      <strong>${round.exchangeFrom.toLocaleString("ko-KR")}원</strong>
      <b>${arrow}</b>
      <strong>${round.exchangeTo.toLocaleString("ko-KR")}원</strong>
      <em>${sign}${change.toLocaleString("ko-KR")}원</em>
    </div>
  `;
}

function getRoundDirection(round) {
  const text = `${round.shortStatus} ${round.title}`;
  if (text.includes("상승") || text.includes("수출 증가")) return "up";
  if (text.includes("하락") || text.includes("달러↓")) return "down";
  return "neutral";
}

function deltaTemplate(label, value, inverse = false) {
  const className = value === 0 ? "neutral" : (inverse ? value < 0 : value > 0) ? "positive delta-up" : "negative delta-down";
  const sign = value > 0 ? "+" : "";
  return `<span class="delta ${className}">${label} ${sign}${value}</span>`;
}

function roleSummaryPanelTemplate() {
  return `
    <article class="role-summary-panel">
      <h3>역할별 유불리 정리</h3>
      <div class="role-grid">
        ${ROLE_CARDS.map((role) => `
          <article class="role-card">
            <h3>${role.name}</h3>
            <div class="role-advantage-row">
              <span class="role-adv role-adv-good">유리: ${role.strongWhen}</span>
              <span class="role-adv role-adv-bad">불리: ${role.weakWhen}</span>
            </div>
            <p>${role.explanation}</p>
          </article>
        `).join("")}
      </div>
    </article>
  `;
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
      history: []
    };
  });
}

function applyRoundResults() {
  const round = getCurrentRound();
  state.teams.forEach((team) => {
    const selection = state.selections[team.id] || {};
    const choiceIndex = selection.choiceIndex;
    const choices = roleStrategyOptions(team.role.name, round);
    const choice = choices[choiceIndex];
    const roleAdjust = getRoleAdjustment(team.role.name, round);
    const response = calculateResponseScore(team, round, choice, selection, roleAdjust);
    const total = addEffects(
      { scoreChange: response.total, moneyChange: 0, stabilityChange: 0 },
      { ...round.baseEffect, scoreChange: 0 },
      { ...choice.effect, scoreChange: 0 },
      { ...roleAdjust.effect, scoreChange: 0 }
    );

    team.score += total.scoreChange;
    team.money = Math.max(0, team.money + total.moneyChange);

    team.history.push({
      roundTitle: round.title,
      choiceText: choice.text,
      choiceFeedback: choice.feedback || "",
      prediction: selection.prediction,
      impact: selection.impact,
      expectedDirection: getRoundDirection(round),
      expectedImpact: getExpectedImpact(team.role.name, round),
      response,
      roleNote: roleAdjust.note,
      summary: buildResultSummary(team, choice, roleAdjust, total),
      total
    });
  });
}

function calculateResponseScore(team, round, choice, selection, roleAdjust) {
  const direction = getRoundDirection(round);
  const impact = getExpectedImpact(team.role.name, round);
  const predictionScore = selection.prediction === direction ? 5 : 0;
  const impactScore = selection.impact === impact ? 3 : 0;
  return {
    predictionScore,
    impactScore,
    total: predictionScore + impactScore
  };
}

function getExpectedImpact(roleName, round) {
  if (round.strongRoles.includes(roleName)) return "favorable";
  if (round.weakRoles.includes(roleName)) return "unfavorable";
  const role = ROLE_CARDS.find((item) => item.name === roleName);
  const direction = getRoundDirection(round);
  if (role && direction === "up") {
    if (role.strongWhen.includes("상승") || role.strongWhen.includes("수출 증가")) return "favorable";
    if (role.weakWhen.includes("상승") || role.weakWhen.includes("비용 증가")) return "unfavorable";
  }
  if (role && direction === "down") {
    if (role.strongWhen.includes("하락")) return "favorable";
    if (role.weakWhen.includes("하락")) return "unfavorable";
  }
  return direction === "down" ? "unfavorable" : "favorable";
}


function getRoleAdjustment(roleName, round) {
  if (round.strongRoles.includes(roleName)) {
    return {
      type: "strong",
      effect: { scoreChange: 2, moneyChange: 4, stabilityChange: 1 },
      note: "역할 보정: 이번 환율 상황은 이 역할에 유리하게 작용했습니다."
    };
  }
  if (round.weakRoles.includes(roleName)) {
    return {
      type: "weak",
      effect: { scoreChange: -2, moneyChange: -5, stabilityChange: -2 },
      note: "역할 보정: 이번 환율 상황은 이 역할에 불리하게 작용했습니다."
    };
  }
  return {
    type: "weak",
    effect: { scoreChange: 0, moneyChange: 0, stabilityChange: 0 },
    note: "역할 보정: 직접 영향이 크지 않더라도 환율 변화가 비용이나 수입에 미칠 가능성을 따져 보아야 합니다."
  };
}

function getRoundHighlights() {
  const teamsWithLast = state.teams
    .map((team) => ({ team, last: team.history[team.history.length - 1] }))
    .filter((item) => item.last);
  const best = [...teamsWithLast].sort((a, b) => b.last.total.scoreChange - a.last.total.scoreChange)[0]?.team || state.teams[0];
  return { best };
}

function buildResultSummary(team, choice, roleAdjust, total) {
  const roleText = {
    strong: "이 역할은 이번 상황에서 기본적으로 유리했습니다.",
    weak: "이 역할은 이번 상황에서 기본적으로 불리했습니다.",
    neutral: "이 역할은 이번 상황의 직접 영향이 크지 않았습니다."
  }[roleAdjust.type];
  return `${team.role.name}${subjectParticle(team.role.name)} “${choice.text}”를 선택했습니다. ${roleText}`;
}

function subjectParticle(text) {
  const last = text.trim().charCodeAt(text.trim().length - 1);
  if (last < 0xac00 || last > 0xd7a3) return "은";
  return (last - 0xac00) % 28 === 0 ? "는" : "은";
}

function addEffects(...effects) {
  return effects.reduce((sum, effect) => ({
    scoreChange: sum.scoreChange + effect.scoreChange,
    moneyChange: sum.moneyChange + effect.moneyChange,
    stabilityChange: sum.stabilityChange + effect.stabilityChange
  }), { scoreChange: 0, moneyChange: 0, stabilityChange: 0 });
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

  root.querySelector("[data-timer-action='start']")?.addEventListener("click", startTimer);
  root.querySelector("[data-timer-action='pause']")?.addEventListener("click", () => stopTimer(true));
  root.querySelector("[data-timer-action='reset']")?.addEventListener("click", () => resetTimer(true));
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
      playTimerBeep();
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
  const timerPanel = document.querySelector(".timer-panel");
  if (timerDisplay) {
    timerDisplay.textContent = formatTime(state.timer.remaining);
    timerDisplay.classList.toggle("timer-done", state.timer.remaining === 0);
    timerDisplay.classList.toggle("timer-urgent", state.timer.remaining > 0 && state.timer.remaining <= 10);
  }
  if (timerPanel) {
    const progress = state.timer.duration ? Math.round((state.timer.remaining / state.timer.duration) * 100) : 0;
    timerPanel.style.setProperty("--timer-progress", `${progress}%`);
    timerPanel.classList.toggle("timer-panel-warning", state.timer.remaining > 10 && state.timer.remaining <= 20);
    timerPanel.classList.toggle("timer-panel-danger", state.timer.remaining <= 10);
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function playTimerBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.24);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.25);
  } catch (error) {
    console.warn("타이머 알림음을 재생하지 못했습니다.", error);
  }
}

function go(screen) {
  state.screen = screen;
  state.captureMode = false;
  enlargedNewsOpen = false;
  enlargedBoardOpen = false;
  wrapUpOpen = false;
  if (screen !== "round") {
    roundLeftScrollTop = 0;
  }
  persistAndRender();
}

function goPreviousStep() {
  stopTimer(false);
  enlargedNewsOpen = false;
  if (state.screen === "lesson") {
    go("start");
    return;
  }
  if (state.screen === "setup") {
    go("lesson");
    return;
  }
  if (state.screen === "roles") {
    go("setup");
    return;
  }
  if (state.screen === "round") {
    state.selections = {};
    if (state.currentRoundIndex > 0) {
      state.currentRoundIndex -= 1;
      go("result");
      return;
    }
    go("roles");
    return;
  }
  if (state.screen === "result") {
    undoCurrentRoundResults();
    state.selections = {};
    go("round");
    return;
  }
  if (state.screen === "final") {
    state.currentRoundIndex = getGameRounds().length - 1;
    go("result");
    return;
  }
  if (state.screen === "materials") {
    go("start");
    return;
  }
  go("start");
}

function bindWrapUpControls(root) {
  const modal = root.querySelector("#wrapUpModal");
  if (!modal) return;
  modal.querySelector("[data-action='close-wrap-up']")?.addEventListener("click", () => {
    wrapUpOpen = false;
    render();
  });
  modal.addEventListener("click", (event) => {
    if (event.target !== modal) return;
    wrapUpOpen = false;
    render();
  });
  document.addEventListener("keydown", function closeOnEscape(event) {
    if (!wrapUpOpen) {
      document.removeEventListener("keydown", closeOnEscape);
      return;
    }
    if (event.key === "Escape") {
      wrapUpOpen = false;
      document.removeEventListener("keydown", closeOnEscape);
      render();
    }
  });
}

function undoCurrentRoundResults() {
  const round = getCurrentRound();
  state.teams.forEach((team) => {
    const last = team.history[team.history.length - 1];
    if (!last || last.roundTitle !== round.title) return;
    team.score -= last.total.scoreChange;
    team.money = Math.max(0, team.money - last.total.moneyChange);
    team.history.pop();
  });
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
      captureMode: false,
      screen: "start"
    };
  } catch (error) {
    console.warn("저장된 진행 상황을 불러오지 못했습니다.", error);
  }
}

function resetGame() {
  stopTimer(false);
  revealedNewsRounds.clear();
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

prevButton.addEventListener("click", goPreviousStep);

homeButton.addEventListener("click", () => {
  state.screen = "start";
  state.captureMode = false;
  enlargedNewsOpen = false;
  stopTimer(false);
  render();
});

materialsButton.addEventListener("click", () => {
  state.screen = "materials";
  state.captureMode = false;
  enlargedNewsOpen = false;
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
