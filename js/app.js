const app = document.querySelector("#app");
const prevButton = document.querySelector("#prevButton");
const homeButton = document.querySelector("#homeButton");
const wrapUpButton = document.querySelector("#wrapUpButton");
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
  newsDifficultyCounts: {
    low: 2,
    medium: 2,
    high: 1
  },
  roundOrder: [],
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
const revealedNewsRounds = new Set();
let roundLeftScrollTop = 0;
let enlargedNewsOpen = false;
let wrapUpOpen = false;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const DIFFICULTY_CONFIG = [
  { key: "low", label: "하", difficulty: "하" },
  { key: "medium", label: "중", difficulty: "중" },
  { key: "high", label: "상", difficulty: "상" }
];
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
  const counts = normalizeDifficultyCounts(state.newsDifficultyCounts);
  const remaining = {
    "하": counts.low,
    "중": counts.medium,
    "상": counts.high
  };
  const selected = [];
  ROUNDS.forEach((round) => {
    if (remaining[round.difficulty] > 0) {
      selected.push(round);
      remaining[round.difficulty] -= 1;
    }
  });
  return selected;
}

function buildRandomRoundOrder() {
  const counts = normalizeDifficultyCounts(state.newsDifficultyCounts);
  const selected = DIFFICULTY_CONFIG.flatMap(({ key, difficulty }) => {
    const candidates = ROUNDS.filter((round) => round.difficulty === difficulty);
    return shuffleArray(candidates).slice(0, counts[key]);
  });
  return shuffleArray(selected).map((round) => round.title);
}

function shuffleArray(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function getAvailableDifficultyCount(difficulty) {
  return ROUNDS.filter((round) => round.difficulty === difficulty).length;
}

function normalizeDifficultyCounts(rawCounts = initialState.newsDifficultyCounts, targetRoundCount = state.roundCount) {
  const source = rawCounts && Object.keys(rawCounts).length ? rawCounts : initialState.newsDifficultyCounts;
  return {
    low: clamp(Number(source.low) || 0, 0, getAvailableDifficultyCount("하")),
    medium: clamp(Number(source.medium) || 0, 0, getAvailableDifficultyCount("중")),
    high: clamp(Number(source.high) || 0, 0, getAvailableDifficultyCount("상"))
  };
}

function getSelectedRoundCount() {
  const counts = normalizeDifficultyCounts(state.newsDifficultyCounts, state.roundCount);
  return counts.low + counts.medium + counts.high;
}

function getDifficultyTotal(counts) {
  return counts.low + counts.medium + counts.high;
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
  if (wrapUpOpen) {
    app.insertAdjacentHTML("beforeend", wrapUpModalTemplate());
    bindWrapUpControls(app);
  }
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
        <div class="asset-preview">
          <div><span>시작 자금</span><strong>100만 원</strong></div>
          <div><span>대응 안전성</span><strong>50점</strong><small>안전하게 대응할수록 올라갑니다</small></div>
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
            <strong>대응 안전성</strong>
            <p>환율 변화에 흔들리지 않고 안전하게 대응한 정도입니다. 무리하지 않고 나누어 거래하거나 위험을 줄이면 올라갈 수 있습니다.</p>
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
  const difficultyCounts = normalizeDifficultyCounts(state.newsDifficultyCounts, roundCount);
  const selectedRoundCount = difficultyCounts.low + difficultyCounts.medium + difficultyCounts.high;
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
          <div class="difficulty-builder" aria-label="뉴스 난이도 구성">
            <div class="difficulty-builder-head">
              <strong>뉴스 난이도 구성</strong>
              <span class="difficulty-total ${selectedRoundCount === roundCount ? "" : "is-mismatch"}">합계 ${selectedRoundCount} / ${roundCount}개</span>
            </div>
            ${DIFFICULTY_CONFIG.map(({ key, label, difficulty }) => `
              <label class="difficulty-count">
                <span>난이도 ${label}</span>
                <input type="number" min="0" max="${getAvailableDifficultyCount(difficulty)}" value="${difficultyCounts[key]}" data-difficulty-count="${key}" />
                <small>최대 ${getAvailableDifficultyCount(difficulty)}개</small>
              </label>
            `).join("")}
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
            <p>역할 배정을 누르면 선택한 난이도 구성 안에서 뉴스 순서가 무작위로 정해집니다.</p>
          </div>
        </div>
      </div>
    </section>
  `;

  screen.querySelector("[data-action='apply-count']").addEventListener("click", () => {
    const countInput = screen.querySelector("#teamCount");
    state.teamCount = clamp(Number(countInput.value) || 5, 2, 8);
    state.roundCount = clamp(Number(screen.querySelector("#roundCount").value) || 5, 1, Math.min(MAX_ROUND_COUNT, ROUNDS.length));
    state.newsDifficultyCounts = readDifficultyCounts(screen, state.roundCount);
    state.roundOrder = [];
    state.teamNames = readTeamNames(screen);
    persistAndRender();
  });

  screen.querySelector("#roundCount").addEventListener("change", (event) => {
    state.roundCount = clamp(Number(event.currentTarget.value) || 5, 1, Math.min(MAX_ROUND_COUNT, ROUNDS.length));
    state.newsDifficultyCounts = readDifficultyCounts(screen, state.roundCount);
    state.roundOrder = [];
    state.teamNames = readTeamNames(screen);
    saveState();
    updateDifficultyBadge(screen);
  });

  screen.querySelectorAll("[data-difficulty-count]").forEach((input) => {
    input.addEventListener("change", () => {
      state.roundCount = clamp(Number(screen.querySelector("#roundCount").value) || 5, 1, Math.min(MAX_ROUND_COUNT, ROUNDS.length));
      state.newsDifficultyCounts = readDifficultyCounts(screen, state.roundCount);
      state.roundOrder = [];
      state.teamNames = readTeamNames(screen);
      saveState();
      updateDifficultyBadge(screen);
    });
  });

  screen.querySelector("#teamCount").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    state.teamCount = clamp(Number(event.currentTarget.value) || 5, 2, 8);
    state.roundCount = clamp(Number(screen.querySelector("#roundCount").value) || 5, 1, Math.min(MAX_ROUND_COUNT, ROUNDS.length));
    state.newsDifficultyCounts = readDifficultyCounts(screen, state.roundCount);
    state.roundOrder = [];
    state.teamNames = readTeamNames(screen);
    persistAndRender();
  });

  screen.querySelector("[data-action='assign']").addEventListener("click", () => {
    state.roundCount = clamp(Number(screen.querySelector("#roundCount").value) || 5, 1, Math.min(MAX_ROUND_COUNT, ROUNDS.length));
    const difficultyCounts = readDifficultyCounts(screen, state.roundCount);
    const difficultyTotal = getDifficultyTotal(difficultyCounts);
    if (difficultyTotal !== state.roundCount) {
      showSetupError(screen, `난이도 합계(${difficultyTotal}개)가 라운드 수(${state.roundCount}개)와 다릅니다. 맞춰주세요.`);
      return;
    }
    state.newsDifficultyCounts = difficultyCounts;
    state.roundOrder = buildRandomRoundOrder();
    state.teamNames = readTeamNames(screen);
    createTeams();
    go("roles");
  });

  return screen;
}

function showSetupError(screen, message) {
  let el = screen.querySelector(".setup-error");
  if (!el) {
    el = document.createElement("p");
    el.className = "setup-error";
    screen.querySelector(".action-row").before(el);
  }
  el.textContent = message;
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
  const showTeacherStatus = new URLSearchParams(window.location.search).get("teacher") === "true";
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
          <div class="action-row sticky-actions">
            <button class="primary-button" type="button" data-action="show-result" ${selectedCount === state.teams.length ? "" : "disabled"}>결과 보기</button>
          </div>
        </div>
        <aside class="round-side">
          <article class="progress-card">
            <p class="section-label teacher-check-label">선택 완료</p>
            <strong class="progress-count">${selectedCount} / ${state.teams.length}</strong>
            <p>세 가지를 모두 입력하면 결과를 볼 수 있습니다.</p>
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
    </section>
  `;
  bindLargeNewsControls(screen);
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
  const screen = createScreen();
  screen.innerHTML = `
    <section class="summary-panel capture-target">
      <div class="final-workspace">
        <div class="final-left">
          ${finalVictoryBannerTemplate(sorted)}
          ${awardSummaryTemplate()}
          <article class="ranking-card">
            <h3>모둠별 대응 점수</h3>
            <ol class="rank-list">
              ${sorted.map((team, index) => `
                <li>
                  <span>${index + 1}위</span>
                  <span>${escapeHtml(team.name)} · ${team.role.name}</span>
                  <span>${team.score}점 · 자금 ${team.money} · 대응 안전성 ${team.stability}</span>
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
            <button class="secondary-button" type="button" data-action="wrap-up">수업 마무리</button>
            <button class="primary-button" type="button" data-action="restart">새 게임 시작</button>
          </div>
        </aside>
      </div>
    </section>
  `;
  screen.querySelector("[data-action='restart']").addEventListener("click", resetGame);
  screen.querySelector("[data-action='capture']").addEventListener("click", () => {
    state.captureMode = !state.captureMode;
    persistAndRender();
  });
  screen.querySelector("[data-action='wrap-up']").addEventListener("click", () => {
    wrapUpOpen = true;
    render();
  });
  return screen;
}

function wrapUpModalTemplate() {
  return `
    <div class="wrapup-backdrop" role="dialog" aria-modal="true" aria-label="수업 마무리" id="wrapUpModal">
      <section class="wrapup-panel">
        <div class="wrapup-header">
          <div>
              <h2 class="wrapup-title">오늘 배운 것</h2>
          </div>
          <button class="wrapup-close ghost-button" type="button" data-action="close-wrap-up">닫기</button>
        </div>
        <div class="wrapup-grid">
          <article class="wrapup-card wrapup-card-blue">
            <div class="wrapup-card-header">
              <span class="wrapup-icon wrapup-icon-blue">📈</span>
              <h3>환율이 오르면</h3>
            </div>
            <ul class="wrapup-list">
              <li>수출기업은 받은 달러를 원화로 바꿀 때 더 많은 원화를 받을 수 있어 유리합니다.</li>
              <li>수입기업은 달러 결제 비용이 커져 불리합니다.</li>
              <li>해외여행자와 유학생 가정은 같은 달러를 사는 데 더 많은 원화가 필요합니다.</li>
            </ul>
          </article>
          <article class="wrapup-card wrapup-card-red">
            <div class="wrapup-card-header">
              <span class="wrapup-icon wrapup-icon-red">📉</span>
              <h3>환율이 내리면</h3>
            </div>
            <ul class="wrapup-list">
              <li>수입기업과 해외여행자는 달러 비용 부담이 줄어 유리합니다.</li>
              <li>수출기업은 달러 수입을 원화로 바꿀 때 받을 금액이 줄어 불리할 수 있습니다.</li>
              <li>원화 가치가 오르면 해외 상품과 서비스의 체감 비용이 낮아질 수 있습니다.</li>
            </ul>
          </article>
          <article class="wrapup-card wrapup-card-green">
            <div class="wrapup-card-header">
              <span class="wrapup-icon wrapup-icon-green">💡</span>
              <h3>역할마다 전략이 다릅니다</h3>
            </div>
            <ul class="wrapup-list">
              <li>먼저 우리 역할이 외화를 쓰는 쪽인지, 벌어들이는 쪽인지 판단합니다.</li>
              <li>그다음 뉴스가 환율 상승을 암시하는지 하락을 암시하는지 근거를 찾습니다.</li>
              <li>마지막으로 손실을 줄이거나 이익을 키우는 선택을 고릅니다.</li>
            </ul>
          </article>
          <article class="wrapup-card wrapup-card-orange">
            <div class="wrapup-card-header">
              <span class="wrapup-icon wrapup-icon-orange">💬</span>
              <h3>토의 질문</h3>
            </div>
            <ul class="wrapup-list">
              <li>우리 모둠은 어떤 뉴스 단서를 보고 환율 방향을 예측했나요?</li>
              <li>우리 역할에 유리하거나 불리하다고 판단한 근거는 무엇인가요?</li>
              <li>큰 이익을 노리는 선택과 안전한 대응 중 무엇이 더 적절했나요?</li>
            </ul>
          </article>
          <article class="wrapup-card wrapup-card-purple">
            <div class="wrapup-card-header">
              <span class="wrapup-icon wrapup-icon-purple">✅</span>
              <h3>잊지 말기</h3>
            </div>
            <ul class="wrapup-list">
              <li>환율 변동은 모든 경제 주체에게 같은 영향을 주지 않습니다.</li>
              <li>좋은 대응은 예측, 역할 판단, 선택 이유가 서로 연결될 때 만들어집니다.</li>
            </ul>
          </article>
        </div>
        <div class="wrapup-footer">
          <p class="wrapup-quote">“환율은 숫자만이 아니라, 경제 주체의 선택을 바꾸는 신호입니다.”</p>
        </div>
      </section>
    </div>
  `;
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
                <span class="tag">유리: ${role.strongWhen}</span>
                <span class="tag">불리: ${role.weakWhen}</span>
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

function promptPanelTemplate(text, includeFrame = false) {
  return `
    <article class="prompt-panel">
      <h3>모둠 토의 질문</h3>
      <p>${text}</p>
      ${includeFrame ? `
        <div class="discussion-frame">
          <strong>발표 문장 틀</strong>
          <span>우리 역할은 환율이 ___하면 유리/불리합니다.</span>
          <span>이번 뉴스는 환율 ___을 암시합니다.</span>
          <span>그래서 우리는 ___을 선택했습니다.</span>
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
        <span><small>시작 자금</small><strong>${team.money}만</strong></span>
        <span><small>대응 안전성</small><strong>${team.stability}</strong></span>
      </div>
    </article>
  `;
}
function teamChoiceTemplate(team, round) {
  const selected = state.selections[team.id] || {};
  const visual = roleVisualTemplate(team);
  const choices = round.choices || roleStrategyOptions(team.role.name, round);
  return `
    <article class="team-card ${isTeamSelectionComplete(selected) ? "selected" : ""}">
      <div class="team-role-banner" style="--team-bg: ${visual.bg}; --team-text: ${visual.text}; --team-line: ${visual.line}">
        <span aria-hidden="true">${visual.icon}</span>
        <strong>${escapeHtml(team.name)} · ${team.role.name}</strong>
        <em class="${isTeamSelectionComplete(selected) ? "done" : "pending"}">${isTeamSelectionComplete(selected) ? "✓ 완료" : "입력 중"}</em>
      </div>
      <div class="metric-row">
        <span class="metric">점수 ${team.score}</span>
        <span class="metric">자금 ${team.money}</span>
        <span class="metric">대응 안전성 ${team.stability}</span>
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

function roleStrategyOptions(roleName, round) {
  const direction = getRoundDirection(round);
  const spender = roleName.includes("여행") || roleName.includes("수입") || roleName.includes("직구") || roleName.includes("유학생") || roleName.includes("원자재");
  const earner = roleName.includes("수출") || roleName.includes("K-pop") || roleName.includes("관광객");
  if (spender) {
    return [
      { text: "필요한 달러를 일부 미리 확보한다", type: "split", effect: { moneyChange: direction === "up" ? -2 : 4, stabilityChange: 6 }, feedback: "일부만 먼저 처리하면 환율이 불리하게 움직일 때 손실을 줄일 수 있습니다." },
      { text: "환전을 미루고 환율 하락을 기다린다", type: "wait", effect: { moneyChange: direction === "down" ? 7 : -8, stabilityChange: -2 }, feedback: "예상이 맞으면 비용을 줄이지만, 틀리면 부담이 커질 수 있습니다." },
      { text: "비용을 줄이고 계획을 조정한다", type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: "불리한 환율 상황에서 지출 규모를 줄이는 방어 전략입니다." },
      { text: "지금 전액 환전해 불확실성을 없앤다", type: "lock", effect: { moneyChange: direction === "up" ? -4 : 1, stabilityChange: 4 }, feedback: "큰 이익 기회는 줄지만 앞으로의 불확실성을 낮출 수 있습니다." }
    ];
  }
  if (earner) {
    return [
      { text: "해외 판매와 홍보를 확대한다", type: "expand", effect: { moneyChange: direction === "up" ? 10 : 2, stabilityChange: 1 }, feedback: "외화를 벌어들이는 역할은 유리한 환율에서 이익을 키울 수 있습니다." },
      { text: "받은 달러를 나누어 환전한다", type: "split", effect: { moneyChange: direction === "up" ? 6 : 2, stabilityChange: 6 }, feedback: "환전 시점을 나누면 환율 변동 위험을 줄일 수 있습니다." },
      { text: "가격과 계약 조건을 조정한다", type: "protect", effect: { moneyChange: 3, stabilityChange: 5 }, feedback: "불리한 환율에서도 가격·계약 조건을 조정해 피해를 줄일 수 있습니다." },
      { text: "환율이 더 좋아질 때까지 모두 보유한다", type: "wait", effect: { moneyChange: direction === "up" ? 7 : -6, stabilityChange: -3 }, feedback: "기다리기는 이익 기회가 있지만 예상이 틀리면 위험이 커집니다." }
    ];
  }
  return [
    { text: "거래 시점을 나누어 위험을 분산한다", type: "split", effect: { moneyChange: 3, stabilityChange: 6 }, feedback: "상황이 불확실할 때는 나누어 결정하는 전략이 안정적입니다." },
    { text: "비용과 계약 조건을 다시 점검한다", type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: "계약 조건을 점검하면 환율 변동 위험을 줄일 수 있습니다." },
    { text: "해외 거래를 적극적으로 늘린다", type: "expand", effect: { moneyChange: 5, stabilityChange: 0 }, feedback: "기회를 키울 수 있지만 부담도 함께 커질 수 있습니다." },
    { text: "아무것도 하지 않고 지켜본다", type: "wait", effect: { moneyChange: 0, stabilityChange: -3 }, feedback: "기다리는 선택도 가능하지만 근거 없는 대기는 위험합니다." }
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
        <span class="result-sel ${last.response.strategyScore >= 5 ? "is-correct" : last.response.strategyScore >= 3 ? "is-partial" : "is-wrong"}">
          ${last.response.strategyScore >= 5 ? "✓" : "△"} 대응: ${last.choiceText}
        </span>
      </div>
      ${choiceFeedback ? `<p class="result-feedback">${choiceFeedback}</p>` : ""}
      <div class="response-score-row">
        <div class="score-chip ${last.response.predictionScore ? "ok" : "miss"}">
          <span>환율 예측</span><strong>${last.response.predictionScore}점</strong>
        </div>
        <div class="score-chip ${last.response.impactScore ? "ok" : "miss"}">
          <span>역할 판단</span><strong>${last.response.impactScore}점</strong>
        </div>
        <div class="score-chip ${last.response.strategyScore >= 5 ? "ok" : last.response.strategyScore >= 3 ? "partial" : "miss"}">
          <span>대응 전략</span><strong>${last.response.strategyScore}점</strong>
        </div>
        <div class="score-chip total">
          <span>이번 점수</span><strong>${last.response.total}점</strong>
        </div>
      </div>
      <div class="delta-row">
        ${deltaTemplate("자금", last.total.moneyChange)}
        ${deltaTemplate("안전성", last.total.stabilityChange)}
      </div>
      <div class="metric-row">
        <span class="metric">누적 점수 ${team.score}</span>
        <span class="metric">자금 ${team.money}</span>
        <span class="metric">안전성 ${team.stability}</span>
      </div>
    </article>
  `;
}

function responseReasonTemplate(last) {
  const prediction = last.response.predictionScore ? "환율 방향을 맞혔고" : "환율 방향 예측은 빗나갔고";
  const impact = last.response.impactScore ? "우리 역할의 유불리도 정확히 판단했습니다" : "우리 역할의 유불리 판단은 다시 확인해야 합니다";
  const strategy = last.response.strategyScore >= 5 ? "대응 선택도 역할에 잘 맞았습니다." : last.response.strategyScore >= 3 ? "대응 선택은 부분적으로 적절했습니다." : "대응 선택은 위험이 컸습니다.";
  return `${prediction}, ${impact}. ${strategy}`;
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
          const width = Math.max(28, Math.round((team.money / maxMoney) * 680));
          const isTop = team.money === maxMoney;
          const valueX = Math.min(950, 230 + width + 16);
          return `
            <text class="bar-team-label" x="18" y="${y + 22}">${escapeHtml(team.name)}</text>
            <rect class="asset-bar ${isTop ? "is-top" : ""}" x="230" y="${y}" width="${width}" height="34" rx="6" fill="${visual.line}" ${isTop ? 'stroke="#d97706" stroke-width="4"' : ""}></rect>
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
      <h3>판서: 같은 환율, 다른 결과</h3>
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
        대응 점수는 “방향을 맞혔는가”만 보지 않습니다. 역할에 맞는 안전한 대응은 높게, 큰 이익을 노린 선택은 자금 변동은 커도 대응 안전성이 낮을 수 있습니다.
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

function updateDifficultyBadge(root) {
  const roundCount = clamp(Number(root.querySelector("#roundCount")?.value) || 5, 1, Math.min(MAX_ROUND_COUNT, ROUNDS.length));
  const counts = readDifficultyCounts(root, roundCount);
  const total = getDifficultyTotal(counts);
  const badge = root.querySelector(".difficulty-total");
  if (!badge) return;
  badge.textContent = `합계 ${total} / ${roundCount}개`;
  badge.classList.toggle("is-mismatch", total !== roundCount);
}

function readDifficultyCounts(root, targetRoundCount = state.roundCount) {
  const counts = {};
  root.querySelectorAll("[data-difficulty-count]").forEach((input) => {
    counts[input.dataset.difficultyCount] = Number(input.value) || 0;
  });
  return normalizeDifficultyCounts(counts, targetRoundCount);
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
      history: []
    };
  });
}

function applyRoundResults() {
  const round = getCurrentRound();
  state.teams.forEach((team) => {
    const selection = state.selections[team.id] || {};
    const choiceIndex = selection.choiceIndex;
    const choices = round.choices || roleStrategyOptions(team.role.name, round);
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
    team.stability = clamp(team.stability + total.stabilityChange, 0, 100);

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
  const predictionScore = selection.prediction === direction ? 8 : 0;
  const impactScore = selection.impact === impact ? 5 : 0;
  const strategyScore = scoreStrategyChoice(choice, team.role.name, roleAdjust.type);
  return {
    predictionScore,
    impactScore,
    strategyScore,
    total: predictionScore + impactScore + strategyScore
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

function scoreStrategyChoice(choice, roleName, roleEffectType) {
  // round.choices path: use recommendedRoles
  if (Array.isArray(choice.recommendedRoles)) {
    const recommended = choice.recommendedRoles.includes(roleName);
    if (recommended) return 5;
    return roleEffectType === "neutral" ? 3 : 2;
  }
  // legacy roleStrategyOptions path
  const { type: choiceType } = choice;
  if (roleEffectType === "weak") {
    if (choiceType === "protect" || choiceType === "split" || choiceType === "lock") return 5;
    if (choiceType === "wait") return 2;
    return 1;
  }
  if (roleEffectType === "strong") {
    if (choiceType === "split") return 5;
    if (choiceType === "expand") return 4;
    if (choiceType === "protect" || choiceType === "lock") return 3;
    return 2;
  }
  if (choiceType === "split" || choiceType === "protect") return 5;
  return 2;
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
  const safetyText = total.stabilityChange > 0
    ? "대응 안전성이 올라 계획적인 선택으로 볼 수 있습니다."
    : total.stabilityChange < 0
      ? "대응 안전성이 낮아져 다음 선택에서는 더 신중한 판단이 필요합니다."
      : "대응 안전성 변화는 크지 않았습니다.";
  return `${team.role.name}${subjectParticle(team.role.name)} “${choice.text}”를 선택했습니다. ${roleText} ${safetyText}`;
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
    team.stability = clamp(team.stability - last.total.stabilityChange, 0, 100);
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
  wrapUpOpen = false;
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

wrapUpButton.addEventListener("click", () => {
  wrapUpOpen = true;
  render();
});

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
