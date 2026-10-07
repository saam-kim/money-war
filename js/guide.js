(() => {
  'use strict';
  window.MWGuide = {
    render: () => `
      <article class="teacher-guide">
        <header class="guide-heading">
          <h2 tabindex="-1">교사용 수업 가이드</h2>
          <p class="guide-lead">뉴스 한 편에서 시작해,<br><strong>학생이 환율의 이유를 설명하는 수업으로.</strong></p>
          <p>정답을 맞히는 것에서 한 걸음 더 나아가, 배운 원리를 새로운 사례에 반복해서 적용합니다.</p>
          <div class="guide-facts"><span>약 30분</span><span>4 / 6라운드</span><span>2~8모둠</span></div>
        </header>
        <nav class="guide-nav" aria-label="수업 가이드 목차">
          <button type="button" data-guide-target="guide-prepare">수업 전 준비</button>
          <button type="button" data-guide-target="guide-flow">진행 순서</button>
          <button type="button" data-guide-target="guide-questions">질문 예시</button>
          <button type="button" data-guide-target="guide-keys">키보드 조작</button>
        </nav>
        <div class="guide-body">
          <section id="guide-prepare" class="guide-section" aria-labelledby="guide-prepare-title">
            <h3 id="guide-prepare-title" tabindex="-1">수업 전, 이것만 준비하세요.</h3>
            <ul class="guide-preparation">
              <li><strong>화면과 모둠</strong><p>교사 화면을 교실에 띄우고, <b>수업 준비</b>에서 모둠 수·이름과 라운드를 정합니다. 처음에는 4라운드로 짧게 운영해도 좋습니다.</p></li>
              <li><strong>개인 기록지와 답안판</strong><p>학생마다 기록지와 필기도구, 모둠마다 답안판을 준비합니다. 원인과 환율은 선택어에 동그라미를 치게 하세요.</p></li>
              <li><strong>기록지 인쇄</strong><p>라운드를 정한 뒤 <b>개인 기록지 인쇄</b>를 누르세요. 학생당 A4 한 장을 흑백·양면으로 사용합니다. 배율 100%, 긴 쪽 넘김, 머리글·바닥글 끄기를 권장합니다.</p></li>
              <li><strong>교사 리허설</strong><p>입장 화면의 <b>수업 리허설</b>로 먼저 진행해 보세요. 예시 답안이 제공되고 실제 수업 기록에는 반영되지 않습니다.</p></li>
            </ul>
            <p class="guide-note"><strong>시작할 때 한마디</strong> “원/달러 환율은 1달러를 사는 데 필요한 원화의 양입니다. 오늘은 뉴스 속 달러 거래를 찾아 환율의 방향을 설명해 봅시다.”</p>
          </section>
          <section id="guide-flow" class="guide-section" aria-labelledby="guide-flow-title">
            <h3 id="guide-flow-title" tabindex="-1">한 라운드, 이렇게 진행합니다.</h3>
            <ol class="guide-steps">
              <li><div><h4>뉴스를 읽고, 먼저 혼자 판단하기</h4><p>뉴스를 함께 읽은 뒤 개인 기록지에 원인과 환율 방향을 표시합니다. 모둠의 의견을 듣기 전에 각자 답을 남기게 하세요.</p></div></li>
              <li><div><h4>모둠에서 이유를 비교하기</h4><p>화면의 토의 문장 틀을 활용합니다. “달러를 사는 거래일까, 파는 거래일까?”부터 이야기하고 모둠 답안 하나를 정합니다.</p></div></li>
              <li><div><h4>답안판을 동시에 공개하고 입력하기</h4><p>신호에 맞춰 모든 모둠이 답안판을 들게 합니다. 교사는 모둠별로 <b>원인 하나 + 환율 방향 하나</b>를 입력합니다. 응답이 없으면 미제출로 기록하세요.</p></div></li>
              <li><div><h4>입력을 확인한 뒤, 이유를 단계별로 보기</h4><p>최초 답안 확인 화면에서 입력 실수를 고칩니다. 해설은 <b>달러 거래 → 수요·공급 변화 → 환율 방향</b> 순으로 공개하며 학생의 설명과 연결합니다.</p></div></li>
              <li><div><h4>결과를 보고, 개인 기록 고치기</h4><p>틀린 판단을 찾아 기록지의 수정 칸에 다시 동그라미를 칩니다. “어떤 답을 왜 바꿨나요?”를 짧게 확인한 뒤 다음 뉴스로 넘어갑니다.</p></div></li>
            </ol>
            <p class="guide-note"><strong>마지막에는 새로운 사례로 확인</strong> 개인 확인 A·B는 각자 풀게 합니다. 기록지 뒷면에 판단을 표시하고 뉴스의 근거에 밑줄을 긋게 한 뒤 함께 해설을 확인합니다.</p>
            <div class="guide-operation"><p><strong>타이머는 진행을 돕는 기준입니다.</strong> 시간이 끝나도 화면이 자동으로 넘어가지 않습니다. 필요하면 일시 정지하거나 10초를 추가하세요.</p><p><strong>점수는 최초 판단을 기준으로 합니다.</strong> 수요·공급 구분 2점 + 증가·감소 2점 + 환율 방향 2점, 라운드당 6점입니다. 해설 뒤 수정은 최초 점수를 바꾸지 않습니다. 모둠 점수와 개인의 이해 정도는 구분해 살펴보세요.</p></div>
          </section>
          <section id="guide-questions" class="guide-section" aria-labelledby="guide-questions-title">
            <h3 id="guide-questions-title" tabindex="-1">답이 엇갈릴 때, 이렇게 물어보세요.</h3>
            <dl class="guide-questions">
              <div><dt>수요와 공급이 헷갈린다면</dt><dd>“뉴스 속 사람들은 달러를 사려고 하나요, 팔려고 하나요?”<small>달러를 사는 거래는 달러 수요, 파는 거래는 달러 공급으로 연결합니다.</small></dd></div>
              <div><dt>증가와 감소가 헷갈린다면</dt><dd>“그 거래가 전보다 늘었나요, 줄었나요? 뉴스의 어느 표현이 근거인가요?”<small>뉴스에서 거래의 변화를 보여 주는 표현을 찾게 하세요.</small></dd></div>
              <div><dt>환율 방향이 헷갈린다면</dt><dd>“달러가 더 필요한 상황인가요, 시장에 더 많이 나오는 상황인가요? 1달러를 사는 데 필요한 원화는 어떻게 달라질까요?”<small>다른 조건이 같다는 전제 아래, 달러 거래부터 환율까지 순서대로 설명하게 합니다.</small></dd></div>
              <div><dt>정답은 맞았지만 이유가 짧다면</dt><dd>“뉴스의 근거 → 달러 거래 → 수요·공급 변화 → 환율을 한 문장으로 이어 볼까요?”<small>같은 질문을 다음 뉴스에도 적용해 원리를 다시 떠올리게 하세요.</small></dd></div>
            </dl>
          </section>
          <section id="guide-keys" class="guide-section" aria-labelledby="guide-keys-title">
            <h3 id="guide-keys-title" tabindex="-1">버튼 대신, 키보드로 편하게.</h3>
            <dl class="guide-key-list">
              <div><dt><kbd>N</kbd> / <kbd>P</kbd></dt><dd>다음 / 이전 단계</dd></div>
              <div><dt><kbd>T</kbd> / <kbd>+</kbd></dt><dd>타이머 일시 정지·시작 / 10초 추가</dd></div>
              <div><dt><kbd>↑</kbd> / <kbd>↓</kbd></dt><dd>답안 입력 중 이전 / 다음 모둠</dd></div>
              <div><dt><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd></dt><dd>달러 수요 증가 / 수요 감소 / 공급 증가 / 공급 감소</dd></div>
              <div><dt><kbd>5</kbd> / <kbd>6</kbd> / <kbd>0</kbd></dt><dd>환율 상승 / 하락 / 미제출 전환</dd></div>
              <div><dt><kbd>V</kbd> / <kbd>R</kbd></dt><dd>뉴스 다시 보기 / 모둠 수정 기록 열기</dd></div>
              <div><dt><kbd>1</kbd>~<kbd>8</kbd></dt><dd>결과 화면에서 해당 모둠의 답안과 다시 살펴볼 부분 확인</dd></div>
              <div><dt><kbd>H</kbd> / <kbd>Esc</kbd></dt><dd>단축키 안내 / 열린 안내 닫기</dd></div>
            </dl>
            <p class="guide-small">단축키는 해당 조작이 있는 화면에서 사용할 수 있습니다. 메뉴의 단축키 안내에서 사용 여부를 바꿀 수 있습니다.</p>
            <p class="guide-note"><strong>다음 시간에 이어서 하려면</strong> 같은 기기·브라우저에서 같은 주소로 열고 <b>이어서 수업</b>을 누르세요. 수업 진행 탭은 하나만 사용하면 편합니다.</p>
          </section>
        </div>
      </article>`
  };
})();
