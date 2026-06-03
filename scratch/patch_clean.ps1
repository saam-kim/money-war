$appJsPath = "c:\Users\USER\Desktop\money-war-main\js\app.js"
$content = [System.IO.File]::ReadAllText($appJsPath, [System.Text.Encoding]::UTF8)

# Normalize line endings to LF to prevent mismatches
$content = $content.Replace("`r`n", "`n")

# --- REPLACE 1 (Rule simplifications in renderStart) ---
$target1 = @'
      <div class="concept-card lesson-metrics">
        <h3>점수판 지표 이해하기</h3>
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
'@.Replace("`r`n", "`n")

$replace1 = @'
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
'@.Replace("`r`n", "`n")

if ($content.Contains($target1)) {
    $content = $content.Replace($target1, $replace1)
    Write-Host "Success: Replaced renderStart rules."
} else {
    Write-Host "Info: Target 1 already replaced or not found."
}

# --- REPLACE 2 (boardLargeViewTemplate) ---
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
'@.Replace("`r`n", "`n")

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
'@.Replace("`r`n", "`n")

if ($content.Contains($target2)) {
    $content = $content.Replace($target2, $replace2)
    Write-Host "Success: Replaced boardLargeViewTemplate."
} else {
    Write-Host "Info: Target 2 already replaced or not found."
}

# --- REPLACE 3 (teamChoiceTemplate typeBadge banner move) ---
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
'@.Replace("`r`n", "`n")

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
'@.Replace("`r`n", "`n")

if ($content.Contains($target3)) {
    $content = $content.Replace($target3, $replace3)
    Write-Host "Success: Replaced teamChoiceTemplate typeBadge."
} else {
    Write-Host "Info: Target 3 already replaced or not found."
}

# --- REPLACE 4 (STRATEGY_VARIATIONS & roleStrategyOptions using range IndexOf) ---
$startStr = "const STRATEGY_VARIATIONS = {"
$endStr = "function roleVisualTemplate(team) {"
$startIndex = $content.IndexOf($startStr)
$endIndex = $content.IndexOf($endStr)

if ($startIndex -ge 0 -and $endIndex -gt $startIndex) {
    # Extract replace block from scratch/patch_full_v2.ps1
    $patchV2Path = "c:\Users\USER\Desktop\money-war-main\scratch\patch_full_v2.ps1"
    $patchV2Content = [System.IO.File]::ReadAllText($patchV2Path, [System.Text.Encoding]::UTF8)
    $patchV2Content = $patchV2Content.Replace("`r`n", "`n")
    
    # Locate `$replace4 = @'` and the matching end `'@`
    $searchMarker = "`$replace4 = @'"
    $idx1 = $patchV2Content.IndexOf($searchMarker)
    if ($idx1 -ge 0) {
        $startPos = $idx1 + $searchMarker.Length
        # Find the trailing single quote that ends the here-string
        # The here-string ends with standard PowerShell syntax: \n'@\n
        $endMarker = "`n'@"
        $idx2 = $patchV2Content.IndexOf($endMarker, $startPos)
        if ($idx2 -gt $startPos) {
            $replace4Value = $patchV2Content.Substring($startPos, $idx2 - $startPos)
            # Normalize whitespace/linebreaks in the replacement value
            $replace4Value = $replace4Value.Trim("`n").Trim("`r")
            
            # Apply the replacement in content
            $contentBefore = $content.Substring(0, $startIndex)
            $contentAfter = $content.Substring($endIndex)
            $content = $contentBefore + $replace4Value + "`n`n" + $contentAfter
            Write-Host "Success: Replaced STRATEGY_VARIATIONS and roleStrategyOptions."
        } else {
            Write-Warning "Could not find closing here-string end marker in patch_full_v2.ps1."
        }
    } else {
        Write-Warning "Could not find `$replace4 = @' marker in patch_full_v2.ps1."
    }
} else {
    Write-Host "Info: STRATEGY_VARIATIONS already replaced or not found."
}

# --- REPLACE 5 (resultCardTemplate score chips) ---
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
'@.Replace("`r`n", "`n")

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
'@.Replace("`r`n", "`n")

if ($content.Contains($target5)) {
    $content = $content.Replace($target5, $replace5)
    Write-Host "Success: Replaced resultCardTemplate score chips."
} else {
    Write-Host "Info: Target 5 already replaced or not found."
}

# --- REPLACE 5.5 (responseReasonTemplate) ---
$target5_5 = @'
function responseReasonTemplate(last) {
  const prediction = last.response.predictionScore ? "환율 방향을 맞혔고" : "환율 방향 예측은 빗나갔고";
  const impact = last.response.impactScore ? "우리 역할의 유불리도 정확히 판단했습니다" : "우리 역할의 유불리 판단은 다시 확인해야 합니다";
  const strategy = last.response.strategyScore === 2 ? "대응 선택도 역할에 잘 맞았습니다." : last.response.strategyScore === 1 ? "대응 선택은 부분적으로 적절했습니다." : "대응 선택은 위험이 컸습니다.";
  return `${prediction}, ${impact}. ${strategy}`;
}
'@.Replace("`r`n", "`n")

$replace5_5 = @'
function responseReasonTemplate(last) {
  const prediction = last.response.predictionScore ? "환율 방향을 맞혔고" : "환율 방향 예측은 빗나갔고";
  const impact = last.response.impactScore ? "우리 역할의 유불리도 정확히 판단했습니다." : "우리 역할의 유불리 판단은 다시 확인해야 합니다.";
  return `${prediction}, ${impact}`;
}
'@.Replace("`r`n", "`n")

if ($content.Contains($target5_5)) {
    $content = $content.Replace($target5_5, $replace5_5)
    Write-Host "Success: Replaced responseReasonTemplate."
} else {
    Write-Host "Info: Target 5.5 already replaced or not found."
}

# --- REPLACE 6 (assetBarChartTemplate widths) ---
$target6 = @'
          const width = Math.max(28, Math.round((team.money / maxMoney) * 680));
          const isTop = team.money === maxMoney;
          const valueX = Math.min(950, 230 + width + 16);
          return `
            <text class="bar-team-label" x="18" y="${y + 22}">${escapeHtml(team.name)}</text>
            <rect class="asset-bar ${isTop ? "is-top" : ""}" x="230" y="${y}" width="${width}" height="34" rx="6" fill="${visual.line}" ${isTop ? 'stroke="#d97706" stroke-width="4"' : ""}></rect>
            <text class="bar-value-label" x="${valueX}" y="${y + 22}">${team.money}만 원</text>
'@.Replace("`r`n", "`n")

$replace6 = @'
          const width = Math.max(28, Math.round((team.money / maxMoney) * 640));
          const isTop = team.money === maxMoney;
          const valueX = Math.min(950, 160 + width + 16);
          return `
            <text class="bar-team-label" x="18" y="${y + 22}">${escapeHtml(team.name)}</text>
            <rect class="asset-bar ${isTop ? "is-top" : ""}" x="160" y="${y}" width="${width}" height="34" rx="6" fill="${visual.line}" ${isTop ? 'stroke="#d97706" stroke-width="4"' : ""}></rect>
            <text class="bar-value-label" x="${valueX}" y="${y + 22}">${team.money}만 원</text>
'@.Replace("`r`n", "`n")

if ($content.Contains($target6)) {
    $content = $content.Replace($target6, $replace6)
    Write-Host "Success: Replaced assetBarChartTemplate widths."
} else {
    Write-Host "Info: Target 6 already replaced or not found."
}

# --- REPLACE 7 (exchangeImpactBoardTemplate note) ---
$target7 = @'
      <div class="board-note">
        💡 <strong>배움 핵심:</strong> 환율 변동은 역할(수출/수입 등)에 따라 영향이 정반대로 나타납니다. 예측에만 의존하기보다는 리스크를 분산(분할 환전 등)하고 안정을 확보하는 대응 전략이 합리적입니다.
      </div>
'@.Replace("`r`n", "`n")

$replace7 = @'
      <div class="board-note">
        💡 <strong>배움 핵심:</strong> 환율 변동은 각자가 맡은 역할(수출, 수입 등)에 따라 유리함과 불리함이 정반대로 나타납니다. 환율이 오를지 내릴지 어림짐작하기보다는, 상황에 맞춰 위험을 나누는(분할 환전 등) 대응 전략이 현명합니다.
      </div>
'@.Replace("`r`n", "`n")

if ($content.Contains($target7)) {
    $content = $content.Replace($target7, $replace7)
    Write-Host "Success: Replaced exchangeImpactBoardTemplate note."
} else {
    Write-Host "Info: Target 7 already replaced or not found."
}

# --- REPLACE 8 (calculateResponseScore method) ---
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
'@.Replace("`r`n", "`n")

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
'@.Replace("`r`n", "`n")

if ($content.Contains($target8)) {
    $content = $content.Replace($target8, $replace8)
    Write-Host "Success: Replaced calculateResponseScore method."
} else {
    Write-Host "Info: Target 8 already replaced or not found."
}

[System.IO.File]::WriteAllText($appJsPath, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Finished writing app.js!"
