$appJsPath = "c:\Users\USER\Desktop\money-war-main\js\app.js"
$content = [System.IO.File]::ReadAllText($appJsPath, [System.Text.Encoding]::UTF8)

# 1. Simplify rules in renderStart
$target1 = @'
      <div class="result-guide">
        <h3>📊 대응 점수 및 결과 규칙</h3>
        <div>
          <article>
            <strong>자금</strong>
            <p>모둠이 가진 돈입니다. 선택 결과에 따라 늘거나 줄어들지만, 최종 승리의 기준은 아닙니다.</p>
          </article>
          <article>
            <strong>대응 점수</strong>
            <p>모둠이 환율 변동에 맞춰 얼마나 합리적인 선택을 했는지 평가하는 최종 승리 기준입니다. 환율 예측, 유불리 판단, 대응 전략 선택에 따라 결정됩니다.</p>
          </article>
        </div>
      </div>
      <div class="concept-card lesson-result-guide">
        <h3>📊 라운드 결과 카드 읽는 방법</h3>
        <div class="result-guide-grid">
          <article>
            <strong>기호 표시 (✓, △, X)</strong>
            <p>예측과 판단이 정확하면 <b>✓ (성공)</b>, 빗나가면 <b>X (실패)</b>로 표시됩니다. 대응 전략의 효율성은 <b>✓ (최선)</b>, <b>△ (보통)</b>, <b>X (위험)</b>로 나누어 평가합니다.</p>
          </article>
          <article>
            <strong>대응 점수 구성 (합계 10점)</strong>
            <p><b>환율 예측(5점) + 역할 판단(3점) + 대응 전략(2점)</b>의 합산 점수입니다. 모둠이 경제 원리에 맞춰 합리적으로 의사결정했는지 점수화합니다.</p>
          </article>
          <article>
            <strong>자금 변동 (▲/▼ 자금)</strong>
            <p>선택지 결과에 따라 이 라운드에 늘어나거나 깎인 자금(만 원 단위)입니다.</p>
          </article>
        </div>
      </div>
'@

$replace1 = @'
      <div class="result-guide">
        <h3>📊 대응 점수 및 결과 규칙</h3>
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
'@

$content = $content.Replace($target1, $replace1)

# 2. boardLargeViewTemplate simplified wording
$target2 = @'
          <div class="board-large-summary" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: var(--space-2); padding-top: var(--space-4); border-top: 1px dashed rgba(255,255,255,0.2)">
            <div style="background: rgba(255,255,255,0.04); padding: var(--space-4); border-radius: var(--r-lg)">
              <h4 style="font-size: 18px; color: #7DD3FC; margin: 0 0 10px">💡 환율 변동과 경제 주체</h4>
              <ul style="font-size: 15px; color: rgba(255,255,255,0.8); line-height: 1.6; margin: 0; padding-left: 20px">
                <li>환율 변동은 모든 경제 주체에게 같은 영향을 주지 않고, 역할에 따라 유리함과 불리함이 다르게 나타납니다.</li>
                <li><strong>환율 상승 시:</strong> 외화 버는 쪽(수출 등) 유리, 외화 쓰는 쪽(수입/유학 등) 불리</li>
                <li><strong>환율 하락 시:</strong> 외화 쓰는 쪽(수입/유학 등) 유리, 외화 버는 쪽(수출 등) 불리</li>
              </ul>
            </div>
            <div style="background: rgba(255,255,255,0.04); padding: var(--space-4); border-radius: var(--r-lg)">
              <h4 style="font-size: 18px; color: #C084FC; margin: 0 0 10px">🎯 현명한 외환 대응 전략</h4>
              <ul style="font-size: 15px; color: rgba(255,255,255,0.8); line-height: 1.6; margin: 0; padding-left: 20px">
                <li>예측에만 의존하는 도박성 대기 전략보다는, 분할 환전이나 계약 고정 등 리스크를 분산하고 안정을 확보하는 전략이 합리적입니다.</li>
                <li>"환율은 단순한 숫자만이 아니라, 경제 주체들이 합리적으로 선택하도록 이끄는 중요한 신호입니다."</li>
              </ul>
            </div>
          </div>
'@

$replace2 = @'
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
'@

$content = $content.Replace($target2, $replace2)

# 3. teamChoiceTemplate - move typeBadge, delete team-role-type-row
$target3 = @'
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
        <strong>${escapeHtml(team.name)} · ${team.role.name}</strong>
        <em class="${isTeamSelectionComplete(selected) ? "done" : "pending"}">${isTeamSelectionComplete(selected) ? "✓ 완료" : "입력 중"}</em>
      </div>
      <div class="team-role-type-row">
        ${typeBadge}
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
'@

$replace3 = @'
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
        <strong>${escapeHtml(team.name)} · ${team.role.name} ${typeBadge}</strong>
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
'@

$content = $content.Replace($target3, $replace3)

# 4. STRATEGY_VARIATIONS & roleStrategyOptions update (protect strategy + dynamic feedback)
$target4 = @'
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
      "수출 가격이나 정산 통화를 안정적인 방식으로 재조정한다",
      "급격한 외환 변동 리스크에 대비하여 계약 결제 및 정산 조건을 재조정한다",
      "환리스크가 낮은 결제 통화 비중을 조절하여 수출 거래 조건을 재정비한다"
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
      "현지 유학 생활비를 절약하도록 유학생 자녀에게 지출 감축을 요청한다",
      "송금 부담이 늘었으므로 현지 체류 중인 자녀에게 불필요한 소비를 줄이도록 알린다",
      "환율 상승을 고려해 자녀에게 지출을 아껴 쓰고 소비를 조절할 것을 요청한다"
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
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? -2 : 4, stabilityChange: 6 }, feedback: "여행 경비를 쪼개서 환전하면 평균 환율을 낮춰 리스크를 줄일 수 있습니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "down" ? 7 : -8, stabilityChange: -2 }, feedback: "환율이 떨어지길 마냥 기다리는 것은 예측이 맞으면 이득이지만, 더 오르면 여행 경비 부담이 매우 커집니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: "환율 부담이 클 때 여행 일정을 조정하거나 예산을 아끼는 것은 확실한 방어책입니다." },
      { text: getParaphrase("lock"), type: "lock", effect: { moneyChange: direction === "up" ? -4 : 1, stabilityChange: 4 }, feedback: "불확실성이 높을 때 즉시 환전하면 추가 환율 상승 위험은 차단하지만 더 싸게 살 기회는 잃게 됩니다." }
    ];
  }
  
  if (category === "exporter") {
    return [
      { text: getParaphrase("expand"), type: "expand", effect: { moneyChange: direction === "up" ? 10 : 2, stabilityChange: 1 }, feedback: "환율 상승기에 수출 물량을 늘리면 매출 극대화가 가능하지만 해외 수요 변동도 고려해야 합니다." },
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? 6 : 2, stabilityChange: 6 }, feedback: "수출 달러 대금을 나누어 원화로 바꾸면 환율 하락 변동에 대한 안전성을 확보할 수 있습니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 3, stabilityChange: 5 }, feedback: "수출 가격이나 결제 통화를 조절하는 것은 급격한 환율 변화 속에서 회사 안정을 도모합니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "up" ? 7 : -6, stabilityChange: -3 }, feedback: "환율 상승을 기대하고 환전을 미루는 것은 큰 이익 기회도 되지만 환율이 반대로 꺾일 때 큰 타격을 받습니다." }
    ];
  }
  
  if (category === "importer") {
    return [
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? -2 : 4, stabilityChange: 6 }, feedback: "수입 대금용 달러를 나누어 확보하면 평균 매입 단가를 안정화할 수 있습니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "down" ? 7 : -8, stabilityChange: -2 }, feedback: "환전 결정을 무작정 미루다가 환율이 더 오르면 수입 단가 부담이 이중으로 커집니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: "수입 단가가 치솟을 때 국내 유통 대체품을 찾아 원가 상승을 막는 것은 현명한 대응입니다." },
      { text: getParaphrase("lock"), type: "lock", effect: { moneyChange: direction === "up" ? -4 : 1, stabilityChange: 4 }, feedback: "환율이 불리할 때 현재 시점에서 환율을 고정해두면 안정적인 예산 수립이 가능해집니다." }
    ];
  }
  
  if (category === "buyer") {
    return [
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? -2 : 4, stabilityChange: 6 }, feedback: "분할하여 구매 시점을 쪼개면 일시적인 환율 급등 위험에 노출되는 것을 방지합니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "down" ? 7 : -8, stabilityChange: -2 }, feedback: "환율 변동 폭이 클 때는 직구를 잠시 미루고 모니터링하는 것이 합리적인 소비입니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: "환율 상승으로 직구 메리트가 사라졌을 때 국산 대체품으로 선회하는 것은 훌륭한 대처입니다." },
      { text: getParaphrase("lock"), type: "lock", effect: { moneyChange: direction === "up" ? -4 : 1, stabilityChange: 4 }, feedback: "환율 추가 급등을 우려해 서둘러 결제할 수 있으나, 환율이 떨어지면 손해를 봅니다." }
    ];
  }
  
  if (category === "student") {
    return [
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? -2 : 4, stabilityChange: 6 }, feedback: "거액의 송금을 쪼개서 하면 환율이 급변할 때의 평균 리스크를 상쇄하는 안전한 유학 자금 관리법이 됩니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "down" ? 7 : -8, stabilityChange: -2 }, feedback: "학비 납부 기한까지 기다리는 전략은 도박성이 짙어, 환율이 급상승하면 엄청난 비용 증가를 겪습니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: "달러 가치가 비쌀 때 현지 소비를 줄이도록 유도하는 방어 행동은 현실적인 대책입니다." },
      { text: getParaphrase("lock"), type: "lock", effect: { moneyChange: direction === "up" ? -4 : 1, stabilityChange: 4 }, feedback: "학비 일시에 미리 처리하면 추가 인상 위험은 사라지지만, 송금 후 환율이 급락할 경우 기회비용 손실이 큽니다." }
    ];
  }
  
  if (category === "shop") {
    return [
      { text: getParaphrase("expand"), type: "expand", effect: { moneyChange: direction === "up" ? 10 : 2, stabilityChange: 1 }, feedback: "원화 가치가 약해졌을 때(환율 상승) 외국인 관광객 마케팅을 공격적으로 확대하면 효과적인 낙수 효과를 얻습니다." },
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? 6 : 2, stabilityChange: 6 }, feedback: "외화 현찰이나 디지털 대금을 나눠서 환전하는 습관은 환율 역방향 리스크를 줄입니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 3, stabilityChange: 5 }, feedback: "해외 변수에만 기댈 수 없으므로 국내 내수 소비자 수요도 챙겨 균형을 잡는 것이 현명합니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "up" ? 7 : -6, stabilityChange: -3 }, feedback: "환전 차익을 얻기 위해 달러 현금을 쌓아두는 것은 도박적인 환차익 노리기로, 안전성이 급격히 떨어집니다." }
    ];
  }
  
  if (category === "factory") {
    return [
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? -2 : 4, stabilityChange: 6 }, feedback: "대량의 원료를 나누어 수입하면 환율 등락에 따른 리스크 평준화가 이루어집니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "down" ? 7 : -8, stabilityChange: -2 }, feedback: "공장 가동을 멈출 수 없는 상황에서 무작정 대기하는 것은 납기 불이행 및 비용 급증 위험이 매우 높습니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: "생산성 혁신과 국산 대체재 투자는 환율 고공행진 시 공장의 든든한 보호막이 됩니다." },
      { text: getParaphrase("lock"), type: "lock", effect: { moneyChange: direction === "up" ? -4 : 1, stabilityChange: 4 }, feedback: "장기 고정 환율 계약은 추가 가격 폭등을 예방해 주어 공장 가동 안정성을 확 올려줍니다." }
    ];
  }
  
  if (category === "kpop") {
    return [
      { text: getParaphrase("expand"), type: "expand", effect: { moneyChange: direction === "up" ? 10 : 2, stabilityChange: 1 }, feedback: "원화 가치 하락기(환율 상승)에 달러 수입을 안겨다 줄 해외 투어를 늘리는 것은 탁월한 이익 극대화 전략입니다." },
      { text: getParaphrase("split"), type: "split", effect: { moneyChange: direction === "up" ? 6 : 2, stabilityChange: 6 }, feedback: "글로벌 비즈니스의 티켓/음원 수익 환전 시기를 쪼개 가져가는 것은 외환 리스크 관리의 기본입니다." },
      { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 3, stabilityChange: 5 }, feedback: "수익 정산 조건을 안정적인 고정 방식으로 전환하는 것은 글로벌 시장의 급격한 변화에서 회사 자금을 지키는 훌륭한 방패가 됩니다." },
      { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: direction === "up" ? 7 : -6, stabilityChange: -3 }, feedback: "환율 피크를 예상하고 환전을 장기간 미루는 행동은 외화 운전자금 동결과 급격한 하락 시 큰 위험을 동반합니다." }
    ];
  }

  return [
    { text: getParaphrase("split"), type: "split", effect: { moneyChange: 3, stabilityChange: 6 }, feedback: "상황이 불확실할 때는 나누어 결정하는 전략이 안정적입니다." },
    { text: getParaphrase("protect"), type: "protect", effect: { moneyChange: 2, stabilityChange: 5 }, feedback: "계약 조건을 점검하면 환율 변동 위험을 줄일 수 있습니다." },
    { text: getParaphrase("expand"), type: "expand", effect: { moneyChange: 5, stabilityChange: 0 }, feedback: "기회를 키울 수 있지만 부담도 함께 커질 수 있습니다." },
    { text: getParaphrase("wait"), type: "wait", effect: { moneyChange: 0, stabilityChange: -3 }, feedback: "기다리는 선택도 가능하지만 근거 없는 대기는 위험합니다." }
  ];
}
'@

$replace4 = @'
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
'@

$content = $content.Replace($target4, $replace4)

# 5. resultCardTemplate - remove strategyScore, neutralize 대응 selection span
$target5 = @'
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
        <span class="result-sel ${last.response.strategyScore === 2 ? "is-correct" : last.response.strategyScore === 1 ? "is-partial" : "is-wrong"}">
          ${last.response.strategyScore === 2 ? "✓" : last.response.strategyScore === 1 ? "△" : "✗"} 대응: ${last.choiceText}
        </span>
      </div>
      ${choiceFeedback ? `<p class="result-feedback">${choiceFeedback}</p>` : ""}
      <div class="response-score-row">
        <div class="score-chip ${last.response.predictionScore ? "ok" : "miss"}" data-tooltip="${last.response.predictionScore ? '환율 변동 방향 예측 성공 (+5점)' : '환율 변동 방향 예측 실패 (+0점)'}">
          <span>환율 예측</span><strong>${last.response.predictionScore}점</strong>
        </div>
        <div class="score-chip ${last.response.impactScore ? "ok" : "miss"}" data-tooltip="${last.response.impactScore ? '우리 역할에 미치는 유불리 분석 성공 (+3점)' : '우리 역할에 미치는 유불리 분석 실패 (+0점)'}">
          <span>역할 판단</span><strong>${last.response.impactScore}점</strong>
        </div>
        <div class="score-chip ${last.response.strategyScore === 2 ? "ok" : last.response.strategyScore === 1 ? "partial" : "miss"}" data-tooltip="${last.response.strategyScore === 2 ? '역할과 상황에 가장 적절한 추천 전략 선택 (+2점)' : last.response.strategyScore === 1 ? '상황에 부분적으로 적절한 대안 전략 선택 (+1점)' : '우리 역할에 리스크가 크거나 부적절한 전략 선택 (+0점)'}">
          <span>대응 전략</span><strong>${last.response.strategyScore}점</strong>
        </div>
        <div class="score-chip total" data-tooltip="환율 예측(${last.response.predictionScore}점) + 역할 판단(${last.response.impactScore}점) + 대응 전략(${last.response.strategyScore}점) = 총 ${last.response.total}점">
          <span>이번 점수</span><strong>${last.response.total}점</strong>
        </div>
      </div>
'@

$replace5 = @'
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
'@

$content = $content.Replace($target5, $replace5)

# 6. assetBarChartTemplate - shift left, reduce width multiplier
$target6 = @'
          const width = Math.max(28, Math.round((team.money / maxMoney) * 680));
          const isTop = team.money === maxMoney;
          const valueX = Math.min(950, 230 + width + 16);
          return `
            <text class="bar-team-label" x="18" y="${y + 22}">${escapeHtml(team.name)}</text>
            <rect class="asset-bar ${isTop ? "is-top" : ""}" x="230" y="${y}" width="${width}" height="34" rx="6" fill="${visual.line}" ${isTop ? 'stroke="#d97706" stroke-width="4"' : ""}></rect>
            <text class="bar-value-label" x="${valueX}" y="${y + 22}">${team.money}만 원</text>
'@

$replace6 = @'
          const width = Math.max(28, Math.round((team.money / maxMoney) * 640));
          const isTop = team.money === maxMoney;
          const valueX = Math.min(950, 160 + width + 16);
          return `
            <text class="bar-team-label" x="18" y="${y + 22}">${escapeHtml(team.name)}</text>
            <rect class="asset-bar ${isTop ? "is-top" : ""}" x="160" y="${y}" width="${width}" height="34" rx="6" fill="${visual.line}" ${isTop ? 'stroke="#d97706" stroke-width="4"' : ""}></rect>
            <text class="bar-value-label" x="${valueX}" y="${y + 22}">${team.money}만 원</text>
'@

$content = $content.Replace($target6, $replace6)

# 7. exchangeImpactBoardTemplate - simplified 어휘
$target7 = @'
      <div class="board-note">
        💡 <strong>배움 핵심:</strong> 환율 변동은 역할(수출/수입 등)에 따라 영향이 정반대로 나타납니다. 예측에만 의존하기보다는 리스크를 분산(분할 환전 등)하고 안정을 확보하는 대응 전략이 합리적입니다.
      </div>
'@

$replace7 = @'
      <div class="board-note">
        💡 <strong>배움 핵심:</strong> 환율 변동은 각자가 맡은 역할(수출, 수입 등)에 따라 유리함과 불리함이 정반대로 나타납니다. 환율이 오를지 내릴지 어림짐작하기보다는, 상황에 맞춰 위험을 나누는(분할 환전 등) 대응 전략이 현명합니다.
      </div>
'@

$content = $content.Replace($target7, $replace7)

# 8. calculateResponseScore - strategyScore removed, total is prediction + impact
$target8 = @'
function calculateResponseScore(team, round, choice, selection, roleAdjust) {
  const direction = getRoundDirection(round);
  const impact = getExpectedImpact(team.role.name, round);
  const predictionScore = selection.prediction === direction ? 5 : 0;
  const impactScore = selection.impact === impact ? 3 : 0;
  const strategyScore = scoreStrategyChoice(choice, team.role.name, roleAdjust.type);
  return {
    predictionScore,
    impactScore,
    strategyScore,
    total: predictionScore + impactScore + strategyScore
  };
}
'@

$replace8 = @'
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
'@

$content = $content.Replace($target8, $replace8)

[System.IO.File]::WriteAllText($appJsPath, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Successfully patched all changes in app.js!"
