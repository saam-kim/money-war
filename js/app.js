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
const revealedNewsRounds = new Set();
let roundLeftScrollTop = 0;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function updateHeader() {
  const round = ROUNDS[state.currentRoundIndex] || ROUNDS[0];
  const preGameScreens = ["start", "lesson", "setup", "roles", "materials"];
  const roundText = preGameScreens.includes(state.screen)
    ? "시작 전"
    : `${state.currentRoundIndex + 1} / ${ROUNDS.length}`;

  headerRound.textContent = state.screen === "final" ? "종료" : roundText;
  headerExchange.textContent = preGameScreens.includes(state.screen)
    ? "수업 준비"
    : state.screen === "round"
      ? "뉴스 예측 중"
      : round.shortStatus;
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
        <p class="lead">뉴스를 읽고 환율 방향을 예측한 뒤, 우리 역할에 가장 유리한 선택을 찾습니다.</p>
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
          <p class="dashboard-label">이번 게임 시작 환율 (가상) <small>실제 환율과 다를 수 있습니다</small></p>
          <div class="ticker-row">
            <strong>USD/KRW</strong>
            <span>1,380</span>
            <em class="ticker-up">+12</em>
          </div>
          <p class="ticker-note">모든 라운드는 원/달러 환율을 중심으로 진행됩니다.</p>
        </div>
        <div class="dashboard-section">
          <p class="dashboard-label">게임 규칙</p>
          <div class="rule-list">
            <p>🏆 승리 조건: 5라운드 후 자산이 가장 많은 모둠</p>
            <p>🔄 진행: 뉴스 확인 → 모둠 토의 → 선택 → 결과 공개</p>
            <p>💡 핵심: 내 역할에 환율 변동이 유리한지 불리한지 판단</p>
          </div>
        </div>
        <div class="asset-preview">
          <div><span>자금</span><strong>100</strong><small>초기 보유 자산 (만 원)</small></div>
          <div><span>안정도</span><strong>50</strong><small>환율 예측 정확도 점수</small></div>
          <div><span>위험도</span><strong>10</strong><small>고위험 환전 시 패널티</small></div>
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
            <p>모둠이 가진 돈입니다. 선택 결과에 따라 늘거나 줄어듭니다. 최종 결과에서는 자금이 많은 모둠이 유리합니다.</p>
          </article>
          <article>
            <strong>안정도</strong>
            <p>환율 변화에 흔들리지 않고 안전하게 대응한 정도입니다. 무리하지 않고 나누어 거래하거나 위험을 줄이면 올라갈 수 있습니다.</p>
          </article>
          <article>
            <strong>위험도</strong>
            <p>선택이 실패했을 때 손해가 커질 가능성입니다. 높을수록 조심해야 하며, 위험도는 낮을수록 좋습니다.</p>
          </article>
        </div>
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
          <p class="field-help">모둠 수를 바꾸면 '적용'을 눌러주세요.</p>
          <button class="mini-button" type="button" data-action="apply-count">적용</button>
        </div>
        <div class="team-name-grid ${state.teamCount <= 2 ? "single-column" : ""}">
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
        <span class="action-help">각 모둠에 역할(해외여행자·수출기업·수입기업 등)을 자동으로 배정합니다.</span>
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
      <p class="lead">우리 모둠이 외화를 쓰는 쪽인지, 벌어들이는 쪽인지 먼저 확인합니다.</p>
      <div class="start-check-panel">
        <h3>시작 전 확인</h3>
        <p>“우리 역할은 외화를 쓰기 때문에 환율이 오르면 불리하다”처럼 역할의 기준을 먼저 말해 봅니다.</p>
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
  const round = ROUNDS[state.currentRoundIndex];
  const selectedCount = Object.keys(state.selections).length;
  const newsTone = "news-neutral";
  const showTeacherStatus = new URLSearchParams(window.location.search).get("teacher") === "true";
  const screen = createScreen();
  screen.innerHTML = `
    <section class="round-panel">
      <div class="round-workspace">
        <div class="round-left">
          <div class="round-header">
            <article class="exchange-card news-card ${newsTone} ${revealedNewsRounds.has(state.currentRoundIndex) ? "is-revealed" : ""}">
              <div class="news-card-toolbar">
                <span class="news-label">시장 뉴스</span>
                <button class="mini-button fullscreen-button" type="button" data-action="toggle-fullscreen">전체화면</button>
              </div>
              <button class="news-reveal-button" type="button" data-action="reveal-news" aria-label="시장 뉴스 공개">
                <span>▶ 클릭하여 공개</span>
              </button>
              <div class="news-card-content">
                ${roundNewsHintTemplate()}
              </div>
            </article>
          </div>
          <div class="pace-panel">
            <strong>① 뉴스 확인</strong>
            <span>② 모둠 토의 (45초)</span>
            <span>③ 선택 입력 (30초)</span>
            <span>④ 결과 공개 (60초)</span>
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
            <p class="section-label teacher-check-label">(교사 확인) 선택 완료</p>
            <strong class="progress-count">${selectedCount} / ${state.teams.length}</strong>
            <p>각 모둠의 전략 선택을 입력합니다.</p>
          </article>
          ${showTeacherStatus ? teacherPanelTemplate(round.teacherGuide) : predictionPanelTemplate()}
          ${promptPanelTemplate("뉴스 속에서 외화를 사려는 쪽과 팔려는 쪽을 찾고, 우리 역할의 비용과 수입이 어떻게 바뀔지 따져 보세요.")}
          ${timerPanelTemplate()}
          ${showTeacherStatus ? teacherSubmissionPanelTemplate() : ""}
        </aside>
      </div>
    </section>
  `;

  bindNewsCardControls(screen);
  bindTimerControls(screen);

  screen.querySelectorAll("[data-choice-button]").forEach((button) => {
    button.addEventListener("click", () => {
      roundLeftScrollTop = screen.querySelector(".round-left")?.scrollTop || 0;
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
      <div class="result-workspace">
        <div class="result-left">
          <h2 class="screen-title">${state.currentRoundIndex + 1}라운드 결과</h2>
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
          ${roundConceptCardTemplate(round)}
          ${state.currentRoundIndex === 2 ? tradeTypesTemplate() : ""}
          <div class="action-row sticky-actions">
            <button class="primary-button" type="button" data-action="next">${isLastRound ? "최종 결과 보기" : "다음 라운드"}</button>
          </div>
        </div>
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
  const screen = createScreen();
  screen.innerHTML = `
    <section class="summary-panel capture-target">
      <div class="final-workspace">
        <div class="final-left">
          ${finalVictoryBannerTemplate(sorted)}
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
          ${learningSummaryTemplate()}
          <div class="explain-box">
            <h3>수업 정리</h3>
            <p>환율 변동은 모든 경제 주체에게 같은 영향을 주지 않습니다. 해외여행자, 수출기업, 수입기업, 유학생 가정처럼 자신이 어떤 경제 활동을 하는지에 따라 유리함과 불리함이 달라집니다.</p>
          </div>
        </div>
        <aside class="final-right">
          ${moneyTrendChartTemplate()}
          <details class="role-summary-accordion">
            <summary>역할별 유불리 정리 ▾</summary>
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
          </details>
          <div class="teacher-panel final-teacher-note">
            <h3>마무리 질문</h3>
            <p>우리 모둠의 선택은 어떤 국제 거래 유형과 연결되었나요? 한 문장으로 정리해 보세요.</p>
            <p class="memo-help">발표 준비 메모 (저장되지 않습니다)</p>
            <textarea class="final-memo" rows="2" placeholder="여기에 입력하세요"></textarea>
          </div>
          <div class="action-row final-actions">
            <button class="secondary-button" type="button" data-action="capture">${state.captureMode ? "일반 보기" : "인쇄하기 🖨️"}</button>
            <span class="shortcut-hint">Ctrl+P / ⌘P로 인쇄</span>
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
      <strong><span aria-hidden="true">🏆</span> ${escapeHtml(winner.name)} 우승! 최종 자산 ${winner.money}만 원</strong>
      <span>${runnerText || "끝까지 참여한 모든 모둠이 환율 전략가입니다."}</span>
    </article>
  `;
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
      <article class="print-section worksheet-section page-break">
        <h2>환율 배틀 · 모둠 활동지</h2>
        <div class="worksheet-meta">
          <span>나의 역할: ____________________</span>
          <span>모둠명: ____________________</span>
          <span>이름: ____________________</span>
        </div>
        <h3>라운드별 기록표</h3>
        <table class="worksheet-table">
          <thead>
            <tr>
              <th>라운드</th>
              <th>뉴스 내용 요약</th>
              <th>우리 팀 예측</th>
              <th>실제 환율 방향</th>
              <th>우리 팀 손익</th>
            </tr>
          </thead>
          <tbody>
            ${[1, 2, 3].map((roundNumber) => `
              <tr>
                <th>${roundNumber}라운드</th>
                <td></td>
                <td>상승 / 하락</td>
                <td>상승 / 하락</td>
                <td>이익 / 손실</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <h3>생각해보기</h3>
        <div class="worksheet-question">
          <p>Q1. 환율이 오르면 수출기업에 유리한 이유는 무엇인가요?</p>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="worksheet-question">
          <p>Q2. 내가 속한 역할에서 환율 변동에 대응하는 가장 좋은 전략은?</p>
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
  const moves = ["+9.2%", "-12.0%", "달러↓", "비용↑", "수출↑"];
  return `<span class="exchange-move">${moves[state.currentRoundIndex] || ""}</span>`;
}

function roundNewsHintTemplate() {
  const hints = [
    {
      title: "공항 환전소 앞 긴 줄... 달러 사려는 사람이 몰렸다",
      lead: "방학 해외여행 예약이 늘고, 일부 수입업체도 결제일을 앞두고 달러를 서둘러 확보하고 있습니다. 은행 직원들은 “오전부터 달러 문의가 평소보다 훨씬 많다”고 전했습니다.",
      cue: "뉴스 판단: 달러를 사려는 사람이 많아지면 원/달러 환율은 어느 쪽으로 움직일까요?"
    },
    {
      title: "수출 대금 들어오고 외국인 투자도 회복... 달러 매물 늘어",
      lead: "대형 수출기업들이 받은 달러를 원화로 바꾸기 시작했고, 외국인 투자자금도 국내 시장으로 들어오고 있습니다. 외환 딜러들은 “달러를 팔려는 주문이 눈에 띈다”고 말했습니다.",
      cue: "뉴스 판단: 시장에 달러를 파는 사람이 많아지면 원/달러 환율은 어느 쪽으로 움직일까요?"
    },
    {
      title: "해외직구 결제액 증가... 여행사도 달러 결제 상품 할인 경쟁",
      lead: "달러로 결제하는 해외 숙박권과 직구 상품을 찾는 소비자가 늘고 있습니다. 일부 여행사는 “환전 부담이 줄었다고 느끼는 고객 문의가 많다”고 전했습니다.",
      cue: "뉴스 판단: 달러 결제 부담이 줄어든다면 원/달러 환율은 어느 쪽으로 움직였을까요?"
    },
    {
      title: "기름값·구리값 동반 상승... 공장들 원가 계산 다시 한다",
      lead: "국제 원자재 가격이 뛰자, 해외에서 원료를 들여오는 공장들이 납품 가격과 생산량 조정을 검토하고 있습니다. 여기에 외화 결제 부담까지 겹칠 수 있다는 우려도 나옵니다.",
      cue: "뉴스 판단: 원자재를 수입하는 기업은 어떤 위험을 먼저 줄여야 할까요?"
    },
    {
      title: "월드투어 매진에 굿즈 주문 폭주... K-콘텐츠 달러 수입 늘었다",
      lead: "해외 공연 티켓과 온라인 콘텐츠 판매가 빠르게 늘면서 기획사들이 해외 홍보 예산을 늘리고 있습니다. 팬덤 소비가 음원, 공연, 관광 상품으로 이어지는 모습입니다.",
      cue: "뉴스 판단: 문화 콘텐츠로 외화를 버는 기업은 지금 어떤 전략을 세우는 게 좋을까요?"
    }
  ];
  const hint = hints[state.currentRoundIndex] || hints[0];
  return `
    <h2>${state.currentRoundIndex + 1}라운드 뉴스</h2>
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
  const fullscreenButton = root.querySelector("[data-action='toggle-fullscreen']");

  if (revealButton && newsCard) {
    revealButton.addEventListener("click", () => {
      revealedNewsRounds.add(state.currentRoundIndex);
      newsCard.classList.add("is-revealed");
    });
  }

  if (fullscreenButton) {
    updateFullscreenButtons();
    fullscreenButton.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.warn("Fullscreen toggle failed", error);
      } finally {
        updateFullscreenButtons();
      }
    });
  }
}

function updateFullscreenButtons() {
  document.querySelectorAll("[data-action='toggle-fullscreen']").forEach((button) => {
    button.textContent = document.fullscreenElement ? "나가기" : "전체화면";
  });
}

document.addEventListener("fullscreenchange", updateFullscreenButtons);

function promptPanelTemplate(text) {
  return `
    <article class="prompt-panel">
      <h3>모둠 토의 질문</h3>
      <p>${text}</p>
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
      <h3>${escapeHtml(team.name)} · ${team.role.name}</h3>
      <p class="role-desc">${team.role.description}</p>
      <div class="tag-row">
        <span class="tag">유리: ${team.role.strongWhen}</span>
        <span class="tag">불리: ${team.role.weakWhen}</span>
        <span class="tag trade-tag" title="${tradeTypeTitle(team.role.tradeType)}">${team.role.tradeType}</span>
      </div>
      <div class="compact-stats">
        <span><small>자금</small><strong>${team.money}</strong></span>
        <span><small>안정도</small><strong>${team.stability}</strong></span>
        <span><small>위험도</small><strong>${team.risk}</strong></span>
      </div>
    </article>
  `;
}

function teamChoiceTemplate(team, round) {
  const selected = state.selections[team.id];
  const visual = roleVisualTemplate(team);
  return `
    <article class="team-card ${selected !== undefined ? "selected" : ""}">
      <div class="team-role-banner" style="--team-bg: ${visual.bg}; --team-text: ${visual.text}; --team-line: ${visual.line}">
        <span aria-hidden="true">${visual.icon}</span>
        <strong>${escapeHtml(team.name)} · ${team.role.name}</strong>
        <em>${selected !== undefined ? "선택 완료" : "지금 결정하세요"}</em>
      </div>
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
          </button>
        `).join("")}
      </div>
    </article>
  `;
}

function tradeTypeTitle(tradeType) {
  if (tradeType === "재화 거래") return "자동차·가전 등 물건을 사고파는 거래";
  if (tradeType === "서비스 거래") return "여행·교육 등 서비스를 사고파는 거래";
  return "국가 사이에서 이루어지는 거래";
}

function roleVisualTemplate(team) {
  const roleName = team.role.name;
  if (roleName.includes("수출") || roleName.includes("K-pop")) {
    return { icon: "🏭", bg: "#dcfce7", text: "#166534", line: "#16a34a" };
  }
  if (roleName.includes("수입") || roleName.includes("원자재")) {
    return { icon: "📦", bg: "#fee2e2", text: "#991b1b", line: "#dc2626" };
  }
  if (roleName.includes("여행") || roleName.includes("직구") || roleName.includes("유학생")) {
    return { icon: "✈️", bg: "#fef9c3", text: "#854d0e", line: "#d97706" };
  }
  return { icon: "💱", bg: "var(--color-brand-soft)", text: "var(--color-brand-ink)", line: "var(--color-brand)" };
}

function teacherSubmissionPanelTemplate() {
  return `
    <aside class="submission-panel" aria-label="선생님용 제출 현황">
      <strong>제출 현황</strong>
      ${state.teams.map((team) => {
        const done = state.selections[team.id] !== undefined;
        return `<span class="${done ? "is-done" : ""}">${escapeHtml(team.name)} 제출: ${done ? "✅ 완료" : "⏳ 대기중"}</span>`;
      }).join("")}
    </aside>
  `;
}

function resultCardTemplate(team) {
  const last = team.history[team.history.length - 1];
  return `
    <article class="change-card">
      <h3 class="result-card-title">${escapeHtml(team.name)} ${profitBadgeTemplate(team, last)}</h3>
      <p class="result-choice">${team.role.name} · 선택: ${last.choiceText}</p>
      <div class="delta-row">
        ${deltaTemplate("점수", last.total.scoreChange)}
        ${deltaTemplate("자금", last.total.moneyChange)}
        ${deltaTemplate("안정도", last.total.stabilityChange)}
        ${deltaTemplate("위험도", last.total.riskChange, true)}
      </div>
      <div class="metric-row">
        <span class="metric">현재 점수 ${team.score}</span>
        <span class="metric">자금 ${team.money}</span>
        <span class="metric">안정도 ${team.stability}</span>
        <span class="metric">위험도 ${team.risk}</span>
      </div>
    </article>
  `;
}

function assetBarChartTemplate() {
  const maxMoney = Math.max(...state.teams.map((team) => team.money), 1);
  const rowHeight = 52;
  const chartHeight = state.teams.length * rowHeight + 16;
  return `
    <article class="asset-chart-card">
      <h3 class="section-label">팀별 현재 자산 비교</h3>
      <svg class="asset-bar-chart" viewBox="0 0 1000 ${chartHeight}" role="img" aria-label="팀별 현재 자산 가로 막대 차트">
        ${state.teams.map((team, index) => {
          const visual = roleVisualTemplate(team);
          const y = 10 + index * rowHeight;
          const width = Math.max(28, Math.round((team.money / maxMoney) * 680));
          const isTop = team.money === maxMoney;
          const valueX = Math.min(950, 230 + width + 16);
          return `
            <text class="bar-team-label" x="18" y="${y + 26}">${escapeHtml(team.name)}</text>
            <rect class="asset-bar ${isTop ? "is-top" : ""}" x="230" y="${y}" width="${width}" height="40" rx="6" fill="${visual.line}" ${isTop ? 'stroke="#d97706" stroke-width="4"' : ""}></rect>
            <text class="bar-value-label" x="${valueX}" y="${y + 26}">${team.money}만 원</text>
          `;
        }).join("")}
      </svg>
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
  if (direction === "down") {
    return `
      <article class="round-core-card">
        <h3>📉 이번 라운드 핵심</h3>
        <p>환율이 내렸습니다. (USD/KRW ▼)</p>
        <p>→ 수출기업: 달러 수입을 원화로 환전할 때 이익 ↓</p>
        <p>→ 수입기업: 달러 결제 비용 감소 → 부담 완화</p>
        <p>→ 여행자: 해외 체류비 부담 감소 → 유리</p>
      </article>
    `;
  }
  if (direction === "up") {
    return `
      <article class="round-core-card">
        <h3>📈 이번 라운드 핵심</h3>
        <p>환율이 올랐습니다. (USD/KRW ▲)</p>
        <p>→ 수출기업: 달러 수입을 원화로 환전 시 이익 ↑</p>
        <p>→ 수입기업: 달러 결제 비용 증가 → 손실</p>
        <p>→ 여행자: 해외 체류비 증가 → 손실</p>
      </article>
    `;
  }
  return `
    <article class="round-core-card">
      <h3>💡 이번 라운드 핵심</h3>
      <p>환율 변화는 재화, 서비스, 관광, 문화 콘텐츠 거래에 서로 다른 영향을 줍니다.</p>
      <p>→ 같은 변화도 역할에 따라 기회가 되거나 위험이 될 수 있습니다.</p>
    </article>
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
  return `${team.role.name}${subjectParticle(team.role.name)} “${choice.text}”를 선택했습니다. ${roleText} ${riskText}`;
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
  if (screen !== "round") {
    roundLeftScrollTop = 0;
  }
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
