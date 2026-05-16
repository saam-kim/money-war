const ROLE_CARDS = [
  {
    name: "해외여행자",
    description: "해외여행을 위해 달러를 환전해야 합니다.",
    strongWhen: "환율 하락",
    weakWhen: "환율 상승",
    explanation: "환율이 오르면 같은 외화를 사기 위해 더 많은 원화가 필요하므로 여행 비용이 늘어납니다.",
    initialMoney: 100,
    initialStability: 52
  },
  {
    name: "수출기업",
    description: "해외에 상품을 팔고 달러로 대금을 받습니다.",
    strongWhen: "환율 상승",
    weakWhen: "환율 하락",
    explanation: "환율이 오르면 받은 달러를 원화로 바꿀 때 더 많은 원화를 받을 수 있습니다.",
    initialMoney: 120,
    initialStability: 58
  },
  {
    name: "수입기업",
    description: "해외 상품을 사 와서 국내에 판매합니다.",
    strongWhen: "환율 하락",
    weakWhen: "환율 상승",
    explanation: "환율이 오르면 수입 대금을 치르기 위해 더 많은 원화가 필요해 비용 부담이 커집니다.",
    initialMoney: 110,
    initialStability: 54
  },
  {
    name: "해외직구 소비자",
    description: "해외 쇼핑몰에서 물건을 직접 구매합니다.",
    strongWhen: "환율 하락",
    weakWhen: "환율 상승",
    explanation: "환율이 낮아지면 외국 돈으로 표시된 물건을 원화로 더 싸게 살 수 있습니다.",
    initialMoney: 95,
    initialStability: 48
  },
  {
    name: "유학생 가정",
    description: "해외 학교 등록금과 생활비를 외화로 보내야 합니다.",
    strongWhen: "환율 하락",
    weakWhen: "환율 상승",
    explanation: "환율이 오르면 같은 학비와 생활비를 보내기 위해 더 많은 원화가 필요합니다.",
    initialMoney: 105,
    initialStability: 50
  },
  {
    name: "외국인 관광객 대상 가게",
    description: "외국인 관광객에게 숙박, 음식, 기념품을 판매합니다.",
    strongWhen: "환율 상승",
    weakWhen: "환율 하락",
    explanation: "환율이 오르면 외국인에게 한국 물가가 상대적으로 싸게 느껴져 관광 소비가 늘 수 있습니다.",
    initialMoney: 100,
    initialStability: 55
  },
  {
    name: "해외 원자재 수입 공장",
    description: "생산에 필요한 원유, 금속 등 원자재를 해외에서 들여옵니다.",
    strongWhen: "환율 하락",
    weakWhen: "환율 상승",
    explanation: "환율과 원자재 가격이 함께 오르면 생산 비용 부담이 크게 커집니다.",
    initialMoney: 125,
    initialStability: 56
  },
  {
    name: "K-pop 공연 기획사",
    description: "해외 공연과 콘텐츠 판매로 외화를 벌어들입니다.",
    strongWhen: "환율 상승 (달러 수입 증가)",
    weakWhen: "환율 하락 (달러 수입 가치 감소)",
    explanation: "해외 공연과 콘텐츠 판매가 늘면 달러 수입이 증가할 수 있습니다.",
    initialMoney: 115,
    initialStability: 53
  }
];

const ROUNDS = [
  {
    title: "원/달러 환율 상승",
    difficulty: "하",
    shortStatus: "환율 상승",
    exchangeFrom: 1300,
    exchangeTo: 1420,
    situation: "1달러 1,300원에서 1,420원으로 상승했습니다. 달러 가치는 오르고 원화 가치는 하락했습니다.",
    teacherGuide: "먼저 자기 역할이 유리한지 불리한지 한 문장으로 판단하게 한 뒤 선택을 받으세요.",
    discussionPrompt: "우리 역할은 달러 가격이 오른 상황에서 비용이 늘어날까요, 수입이 늘어날까요?",
    resultFocus: "환율 상승은 외화를 써야 하는 주체와 외화를 벌어들이는 주체에게 반대 방향으로 작용합니다.",
    baseEffect: { scoreChange: 1, moneyChange: 0, stabilityChange: -2 },
    strongRoles: ["수출기업", "외국인 관광객 대상 가게", "K-pop 공연 기획사"],
    weakRoles: ["해외여행자", "수입기업", "해외직구 소비자", "유학생 가정", "해외 원자재 수입 공장"],
    choices: [
      {
        text: "필요한 외화를 나누어 환전한다",
        recommendedRoles: ["해외여행자", "해외직구 소비자", "유학생 가정"],
        effect: { scoreChange: 4, moneyChange: -3, stabilityChange: 6 },
        feedback: "한 번에 결정하지 않고 나누어 환전하면 환율 변동 위험을 줄일 수 있습니다."
      },
      {
        text: "더 오를 것 같아 바로 모두 환전한다",
        recommendedRoles: ["해외여행자", "유학생 가정"],
        effect: { scoreChange: 1, moneyChange: -8, stabilityChange: 1 },
        feedback: "예상이 맞을 수도 있지만 한 번에 거래하면 위험이 커집니다."
      },
      {
        text: "수출 가격을 유지하고 해외 판매를 늘린다",
        recommendedRoles: ["수출기업", "K-pop 공연 기획사"],
        effect: { scoreChange: 5, moneyChange: 12, stabilityChange: 2 },
        feedback: "환율 상승은 수출 대금을 원화로 바꿀 때 유리하게 작용할 수 있습니다."
      },
      {
        text: "수입 물량을 줄이고 국내 대체품을 찾는다",
        recommendedRoles: ["수입기업", "해외 원자재 수입 공장"],
        effect: { scoreChange: 4, moneyChange: 4, stabilityChange: 4 },
        feedback: "수입 비용이 오를 때 대체품을 찾으면 부담을 줄일 수 있습니다."
      }
    ],
    concept: "환율이 상승하면 외국 화폐의 가격이 오르고 원화 가치는 낮아집니다. 해외여행자나 수입기업은 비용이 늘 수 있고, 수출기업은 달러 수입을 원화로 바꿀 때 유리할 수 있습니다."
  },
  {
    title: "원/달러 환율 하락",
    difficulty: "하",
    shortStatus: "환율 하락",
    exchangeFrom: 1420,
    exchangeTo: 1250,
    situation: "1달러 1,420원에서 1,250원으로 하락했습니다. 달러 가치는 낮아지고 원화 가치는 상승했습니다.",
    teacherGuide: "1라운드와 반대되는 영향을 찾게 하세요. 같은 역할도 환율 방향이 바뀌면 판단이 달라집니다.",
    discussionPrompt: "원화 가치가 높아지면 우리 역할의 구매 비용이나 판매 수입은 어떻게 달라질까요?",
    resultFocus: "환율 하락은 외화를 사야 하는 사람에게 유리할 수 있지만 수출기업에는 부담이 될 수 있습니다.",
    baseEffect: { scoreChange: 1, moneyChange: 1, stabilityChange: 2 },
    strongRoles: ["해외여행자", "수입기업", "해외직구 소비자", "유학생 가정", "해외 원자재 수입 공장"],
    weakRoles: ["수출기업", "외국인 관광객 대상 가게"],
    choices: [
      {
        text: "해외 구매와 학비 송금을 앞당긴다",
        recommendedRoles: ["해외여행자", "해외직구 소비자", "유학생 가정"],
        effect: { scoreChange: 5, moneyChange: 8, stabilityChange: 3 },
        feedback: "원화 가치가 높을 때 외화 지출을 처리하면 비용을 줄일 수 있습니다."
      },
      {
        text: "수출 가격을 조정하고 품질 경쟁을 강화한다",
        recommendedRoles: ["수출기업"],
        effect: { scoreChange: 4, moneyChange: 3, stabilityChange: 5 },
        feedback: "환율 하락으로 가격 경쟁력이 약해질 수 있어 다른 경쟁력이 중요해집니다."
      },
      {
        text: "환율이 더 내려갈 때까지 모든 결정을 미룬다",
        recommendedRoles: ["해외여행자", "해외직구 소비자"],
        effect: { scoreChange: -1, moneyChange: 0, stabilityChange: -4 },
        feedback: "결정을 오래 미루면 좋은 기회를 놓치거나 불확실성이 커질 수 있습니다."
      },
      {
        text: "장기 계약으로 환율 변동을 관리한다",
        recommendedRoles: ["수출기업", "수입기업", "해외 원자재 수입 공장"],
        effect: { scoreChange: 3, moneyChange: 3, stabilityChange: 6 },
        feedback: "계약 시점을 조정하면 환율 변동의 영향을 관리할 수 있습니다."
      }
    ],
    concept: "환율이 하락하면 외국 화폐의 가격이 낮아지고 원화 가치는 상승합니다. 해외여행, 유학비 송금, 수입에는 유리할 수 있지만 수출기업은 가격 경쟁력이 약해질 수 있습니다."
  },
  {
    title: "달러 약세와 해외 소비 증가",
    difficulty: "중",
    shortStatus: "달러 약세 전망",
    exchangeFrom: 1320,
    exchangeTo: 1260,
    situation: "원/달러 환율이 더 내려갈 수 있다는 전망이 나오며 해외여행과 해외직구 수요가 증가했습니다.",
    teacherGuide: "달러 가격이 낮아질 때 외화를 쓰는 주체와 외화를 버는 주체의 판단이 어떻게 달라지는지 짚어 주세요.",
    discussionPrompt: "달러 결제 부담이 줄어들면 해외여행자, 해외직구 소비자, 수출기업의 선택은 어떻게 달라질까요?",
    resultFocus: "달러 약세는 달러를 써야 하는 주체에게 기회가 될 수 있지만 달러를 벌어들이는 주체에게는 부담이 될 수 있습니다.",
    baseEffect: { scoreChange: 1, moneyChange: 0, stabilityChange: 1 },
    strongRoles: ["해외여행자", "해외직구 소비자", "유학생 가정"],
    weakRoles: ["외국인 관광객 대상 가게"],
    choices: [
      {
        text: "해외여행 비용을 비교해 계획을 확정한다",
        recommendedRoles: ["해외여행자"],
        effect: { scoreChange: 5, moneyChange: 7, stabilityChange: 2 },
        feedback: "달러 가격이 낮아지면 해외여행 비용 부담이 줄어 여행 수요가 늘 수 있습니다."
      },
      {
        text: "달러 결제 상품을 비교해 일부 수입한다",
        recommendedRoles: ["수입기업", "해외직구 소비자"],
        effect: { scoreChange: 4, moneyChange: 6, stabilityChange: 2 },
        feedback: "달러 가격 변화는 해외 상품의 원화 기준 가격에도 영향을 줍니다."
      },
      {
        text: "국내 관광객 대상 행사를 강화한다",
        recommendedRoles: ["외국인 관광객 대상 가게", "해외여행자"],
        effect: { scoreChange: 3, moneyChange: 3, stabilityChange: 4 },
        feedback: "해외로 빠지는 수요에 대응해 국내 소비자를 붙잡는 전략입니다."
      },
      {
        text: "유행만 보고 큰 금액을 한 번에 투자한다",
        recommendedRoles: ["수출기업", "K-pop 공연 기획사"],
        effect: { scoreChange: -2, moneyChange: -6, stabilityChange: -4 },
        feedback: "환율 변화가 기회가 될 수 있지만 무리한 투자는 위험을 높입니다."
      }
    ],
    concept: "원/달러 환율이 낮아지면 달러로 결제하는 여행, 유학비 송금, 해외직구 부담이 줄어들 수 있습니다. 반대로 달러 수입을 원화로 바꾸는 수출기업은 불리해질 수 있습니다."
  },
  {
    title: "원자재 가격과 환율 동시 상승",
    difficulty: "상",
    shortStatus: "원자재·환율 상승",
    exchangeFrom: 1310,
    exchangeTo: 1435,
    situation: "국제 원자재 가격이 오르고 환율도 상승했습니다. 수입 비용 부담이 커졌습니다.",
    teacherGuide: "원자재 수입 공장과 일반 수입기업이 이중 부담을 받는 이유를 계산하듯 설명하세요.",
    discussionPrompt: "원자재 가격도 오르고 환율도 오르면 수입 공장의 비용은 왜 더 크게 늘어날까요?",
    resultFocus: "수입 비용은 국제 가격과 환율의 영향을 함께 받을 수 있습니다.",
    baseEffect: { scoreChange: 0, moneyChange: -4, stabilityChange: -4 },
    strongRoles: ["수출기업"],
    weakRoles: ["수입기업", "해외 원자재 수입 공장", "해외여행자", "유학생 가정"],
    choices: [
      {
        text: "원자재 사용량을 줄이고 생산 계획을 조정한다",
        recommendedRoles: ["해외 원자재 수입 공장", "수입기업"],
        effect: { scoreChange: 5, moneyChange: 5, stabilityChange: 5 },
        feedback: "비용 상승이 클 때는 생산 계획을 조정해 손실을 줄일 수 있습니다."
      },
      {
        text: "국내 대체 재료와 장기 계약을 찾는다",
        recommendedRoles: ["해외 원자재 수입 공장", "수입기업"],
        effect: { scoreChange: 5, moneyChange: 6, stabilityChange: 7 },
        feedback: "대체재와 장기 계약은 수입 비용 변동 위험을 줄이는 방법입니다."
      },
      {
        text: "오른 비용을 곧바로 가격에 모두 반영한다",
        recommendedRoles: ["수입기업", "해외 원자재 수입 공장"],
        effect: { scoreChange: 0, moneyChange: 4, stabilityChange: -6 },
        feedback: "가격을 급하게 올리면 단기 자금은 지켜도 소비자 이탈 위험이 커집니다."
      },
      {
        text: "수출 수입으로 비용 상승을 일부 보완한다",
        recommendedRoles: ["수출기업", "K-pop 공연 기획사"],
        effect: { scoreChange: 4, moneyChange: 7, stabilityChange: 2 },
        feedback: "달러 수입이 있는 기업은 환율 상승의 이익으로 비용 부담을 일부 줄일 수 있습니다."
      }
    ],
    concept: "원자재 가격과 환율이 함께 오르면 해외에서 사 오는 비용이 이중으로 커져 공장과 수입기업에 부담이 됩니다."
  },
  {
    title: "K-콘텐츠 해외 수출 증가",
    difficulty: "중",
    shortStatus: "콘텐츠 수출 증가",
    exchangeFrom: 1290,
    exchangeTo: 1340,
    situation: "해외에서 한국 콘텐츠 수요가 늘고 달러 수입이 증가했습니다. 문화 콘텐츠도 국제 거래의 중요한 대상이 되고 있습니다.",
    teacherGuide: "해외 콘텐츠 수요가 늘면 달러 수입이 늘고, 환율에 따라 원화 환산 결과가 달라진다는 점을 짚어 주세요.",
    discussionPrompt: "해외에서 달러 수입이 늘면 환율 변화는 기획사의 자금에 어떤 영향을 줄까요?",
    resultFocus: "문화 콘텐츠 수출이 늘면 해외에서 들어오는 달러 수입이 증가할 수 있습니다.",
    baseEffect: { scoreChange: 2, moneyChange: 3, stabilityChange: 2 },
    strongRoles: ["K-pop 공연 기획사", "수출기업", "외국인 관광객 대상 가게"],
    weakRoles: [],
    choices: [
      {
        text: "해외 홍보와 공연 일정을 확대한다",
        recommendedRoles: ["K-pop 공연 기획사", "수출기업"],
        effect: { scoreChange: 6, moneyChange: 10, stabilityChange: 1 },
        feedback: "해외 수요가 클 때 적극적으로 진출하면 수입이 늘 수 있지만 운영 부담도 커집니다."
      },
      {
        text: "계약 조건과 환전 시점을 나누어 관리한다",
        recommendedRoles: ["K-pop 공연 기획사", "수출기업"],
        effect: { scoreChange: 5, moneyChange: 6, stabilityChange: 7 },
        feedback: "콘텐츠 수출도 계약과 환율 관리를 함께 해야 안정적입니다."
      },
      {
        text: "외국인 관광객 연계 상품을 만든다",
        recommendedRoles: ["외국인 관광객 대상 가게", "K-pop 공연 기획사"],
        effect: { scoreChange: 4, moneyChange: 6, stabilityChange: 4 },
        feedback: "콘텐츠 인기는 관광, 숙박, 상품 판매 같은 소비 확대로 이어질 수 있습니다."
      },
      {
        text: "인기만 믿고 비용 검토 없이 해외 지사를 세운다",
        recommendedRoles: ["K-pop 공연 기획사", "수출기업"],
        effect: { scoreChange: -1, moneyChange: -7, stabilityChange: -5 },
        feedback: "해외 지사 설립은 큰 비용과 운영 부담이 따르므로 신중한 판단이 필요합니다."
      }
    ],
    concept: "K-pop 공연과 콘텐츠 판매가 해외에서 인기를 얻으면 달러 수입이 늘고, 환율 변화에 따라 원화로 바꿀 때의 결과가 달라집니다."
  },
  {
    title: "미국 금리 인상 가능성",
    difficulty: "중",
    shortStatus: "환율 상승 전망",
    exchangeFrom: 1280,
    exchangeTo: 1365,
    situation: "미국의 금리 인상 가능성이 커지며 달러 투자 수요가 늘었습니다. 시장에서는 달러 가치가 오를 수 있다는 전망이 나왔습니다.",
    teacherGuide: "금리가 높은 나라의 돈을 보유하려는 수요가 늘면 그 화폐 가치가 오를 수 있음을 연결해 주세요.",
    discussionPrompt: "달러를 보유하려는 사람이 늘어나면 원/달러 환율은 어느 방향으로 움직일까요?",
    resultFocus: "금리 변화는 달러 수요에 영향을 줄 수 있으며, 달러 수요가 커지면 환율 상승 압력이 생길 수 있습니다.",
    baseEffect: { scoreChange: 1, moneyChange: 0, stabilityChange: -1 },
    strongRoles: ["수출기업", "외국인 관광객 대상 가게", "K-pop 공연 기획사"],
    weakRoles: ["해외여행자", "수입기업", "해외직구 소비자", "유학생 가정", "해외 원자재 수입 공장"],
    choices: [
      {
        text: "달러 결제 계획을 앞당겨 위험을 줄인다",
        recommendedRoles: ["수입기업", "유학생 가정", "해외여행자"],
        effect: { scoreChange: 4, moneyChange: -2, stabilityChange: 5 },
        feedback: "환율 상승이 예상될 때 필요한 외화를 일부 확보하면 위험을 줄일 수 있습니다."
      },
      {
        text: "해외 판매 확대를 준비한다",
        recommendedRoles: ["수출기업", "K-pop 공연 기획사"],
        effect: { scoreChange: 5, moneyChange: 8, stabilityChange: 1 },
        feedback: "달러 수입이 있는 역할은 환율 상승을 기회로 활용할 수 있습니다."
      },
      {
        text: "계약 환율을 미리 정한다",
        recommendedRoles: ["수출기업", "수입기업"],
        effect: { scoreChange: 4, moneyChange: 2, stabilityChange: 6 },
        feedback: "계약 조건을 조정하면 환율 변동 위험을 낮출 수 있습니다."
      },
      {
        text: "근거 없이 전액 거래를 미룬다",
        recommendedRoles: ["해외직구 소비자"],
        effect: { scoreChange: -1, moneyChange: -5, stabilityChange: -3 },
        feedback: "예측 근거 없이 미루면 환율이 불리하게 움직일 때 부담이 커질 수 있습니다."
      }
    ],
    concept: "미국 금리가 오를 것이라는 전망은 달러 수요를 늘릴 수 있습니다. 달러 수요가 커지면 달러 가치가 오르고 원/달러 환율이 상승할 수 있습니다."
  },
  {
    title: "외국인 투자자금 국내 유입",
    difficulty: "중",
    shortStatus: "환율 하락 전망",
    exchangeFrom: 1360,
    exchangeTo: 1295,
    situation: "국내 주식시장에 외국인 투자자금이 들어오며 달러를 원화로 바꾸는 거래가 늘었습니다.",
    teacherGuide: "외국인 투자자가 국내 자산을 사려면 달러를 팔고 원화를 사야 한다는 점을 짚어 주세요.",
    discussionPrompt: "달러를 팔고 원화를 사는 거래가 늘면 원/달러 환율은 어떻게 움직일까요?",
    resultFocus: "원화 수요가 늘어나면 원화 가치가 오르고 환율 하락 압력이 생길 수 있습니다.",
    baseEffect: { scoreChange: 1, moneyChange: 1, stabilityChange: 2 },
    strongRoles: ["해외여행자", "수입기업", "해외직구 소비자", "유학생 가정", "해외 원자재 수입 공장"],
    weakRoles: ["수출기업", "외국인 관광객 대상 가게", "K-pop 공연 기획사"],
    choices: [
      {
        text: "필요한 달러 결제를 일부 앞당긴다",
        recommendedRoles: ["수입기업", "유학생 가정"],
        effect: { scoreChange: 5, moneyChange: 6, stabilityChange: 3 },
        feedback: "환율 하락은 외화를 사야 하는 역할의 비용 부담을 줄일 수 있습니다."
      },
      {
        text: "수출 가격 경쟁력을 다시 점검한다",
        recommendedRoles: ["수출기업"],
        effect: { scoreChange: 4, moneyChange: 2, stabilityChange: 5 },
        feedback: "환율 하락은 수출 가격 경쟁력에 부담이 될 수 있어 대응이 필요합니다."
      },
      {
        text: "해외직구와 여행 예산을 비교한다",
        recommendedRoles: ["해외여행자", "해외직구 소비자"],
        effect: { scoreChange: 4, moneyChange: 5, stabilityChange: 2 },
        feedback: "외화 가격이 낮아질 때 지출 계획을 세우면 비용을 줄일 수 있습니다."
      },
      {
        text: "환율 하락이 계속될 것이라 단정한다",
        recommendedRoles: ["해외여행자"],
        effect: { scoreChange: -1, moneyChange: -2, stabilityChange: -3 },
        feedback: "환율 방향을 단정하면 다음 변화에 취약해질 수 있습니다."
      }
    ],
    concept: "외국인 투자자금이 들어오면 원화를 사려는 수요가 늘 수 있습니다. 이때 원화 가치가 오르고 환율은 하락할 수 있습니다."
  },
  {
    title: "국제 유가 안정",
    difficulty: "하",
    shortStatus: "환율 하락 전망",
    exchangeFrom: 1335,
    exchangeTo: 1305,
    situation: "국제 유가가 안정되며 원유와 원자재를 수입하는 기업의 비용 부담이 줄어들 수 있다는 전망이 나왔습니다.",
    teacherGuide: "환율뿐 아니라 국제 가격도 수입 비용에 영향을 준다는 점을 연결해 주세요.",
    discussionPrompt: "원자재 가격 부담이 줄면 수입기업과 공장의 선택은 어떻게 달라질까요?",
    resultFocus: "수입 비용은 환율뿐 아니라 국제 가격의 영향을 함께 받습니다.",
    baseEffect: { scoreChange: 1, moneyChange: 2, stabilityChange: 2 },
    strongRoles: ["수입기업", "해외 원자재 수입 공장"],
    weakRoles: ["수출기업"],
    choices: [
      {
        text: "원자재 구매 시점을 나누어 조정한다",
        recommendedRoles: ["해외 원자재 수입 공장"],
        effect: { scoreChange: 5, moneyChange: 5, stabilityChange: 6 },
        feedback: "가격이 안정될 때도 나누어 구매하면 위험을 줄일 수 있습니다."
      },
      {
        text: "수입 물량과 재고 계획을 다시 세운다",
        recommendedRoles: ["수입기업"],
        effect: { scoreChange: 4, moneyChange: 4, stabilityChange: 4 },
        feedback: "비용 부담이 줄어들면 수입 계획을 조정할 여지가 생깁니다."
      },
      {
        text: "해외 판매 전략을 유지한다",
        recommendedRoles: ["수출기업"],
        effect: { scoreChange: 2, moneyChange: 1, stabilityChange: 2 },
        feedback: "직접 영향이 작아도 시장 변화는 점검해야 합니다."
      },
      {
        text: "가격이 낮다고 한 번에 과도하게 구매한다",
        recommendedRoles: ["수입기업", "해외 원자재 수입 공장"],
        effect: { scoreChange: -1, moneyChange: -3, stabilityChange: -2 },
        feedback: "무리한 구매는 재고 부담과 위험을 높일 수 있습니다."
      }
    ],
    concept: "국제 거래에서 비용은 환율과 국제 가격이 함께 결정합니다. 원자재 가격 안정은 수입기업과 공장의 부담을 줄일 수 있습니다."
  },
  {
    title: "해외 경기 둔화와 수출 주문 감소",
    difficulty: "상",
    shortStatus: "환율 하락 전망",
    exchangeFrom: 1345,
    exchangeTo: 1275,
    situation: "해외 소비가 위축되며 한국 상품 주문이 줄어들 수 있다는 전망이 나왔습니다. 수출기업은 판매 전략을 다시 검토하고 있습니다.",
    teacherGuide: "환율이 유리해도 해외 수요가 줄면 수출기업이 무조건 유리하지 않을 수 있음을 설명하세요.",
    discussionPrompt: "환율 조건이 나쁘지 않아도 해외 수요가 줄면 수출기업은 왜 어려워질까요?",
    resultFocus: "환율은 중요하지만 국제 거래 결과는 해외 수요, 가격 경쟁력, 계약 조건의 영향을 함께 받습니다.",
    baseEffect: { scoreChange: 0, moneyChange: -2, stabilityChange: -3 },
    strongRoles: ["수입기업", "해외직구 소비자"],
    weakRoles: ["수출기업", "K-pop 공연 기획사", "외국인 관광객 대상 가게"],
    choices: [
      {
        text: "판매 지역과 상품 구성을 조정한다",
        recommendedRoles: ["수출기업", "K-pop 공연 기획사"],
        effect: { scoreChange: 5, moneyChange: 3, stabilityChange: 5 },
        feedback: "해외 수요가 줄 때는 시장과 상품 전략을 조정해야 합니다."
      },
      {
        text: "국내 고객과 대체 시장을 찾는다",
        recommendedRoles: ["수출기업", "외국인 관광객 대상 가게"],
        effect: { scoreChange: 4, moneyChange: 2, stabilityChange: 4 },
        feedback: "수요 감소에 대응해 다른 시장을 찾는 전략입니다."
      },
      {
        text: "수입 단가가 내려갈 가능성을 살핀다",
        recommendedRoles: ["수입기업"],
        effect: { scoreChange: 3, moneyChange: 3, stabilityChange: 2 },
        feedback: "해외 수요 둔화는 일부 수입 가격에 영향을 줄 수 있습니다."
      },
      {
        text: "기존 방식대로 생산량을 크게 늘린다",
        recommendedRoles: ["수출기업"],
        effect: { scoreChange: -2, moneyChange: -6, stabilityChange: -5 },
        feedback: "수요가 줄 때 생산량을 무리하게 늘리면 위험이 커집니다."
      }
    ],
    concept: "환율만으로 국제 거래의 유불리를 판단할 수는 없습니다. 해외 수요가 줄면 수출기업은 환율이 유리해도 어려움을 겪을 수 있습니다."
  },
  {
    title: "지정학 위험과 달러 선호",
    difficulty: "상",
    shortStatus: "환율 상승 전망",
    exchangeFrom: 1325,
    exchangeTo: 1450,
    situation: "국제 정세 불안이 커지자 투자자들이 안전한 자산으로 여겨지는 달러를 더 많이 찾고 있습니다.",
    teacherGuide: "불안정한 시기에는 달러 수요가 늘어 환율 상승 압력이 생길 수 있음을 설명하세요.",
    discussionPrompt: "세계 경제가 불안할 때 달러를 찾는 사람이 늘면 환율은 어떻게 움직일까요?",
    resultFocus: "국제 정세와 시장 심리도 달러 수요를 바꾸어 환율에 영향을 줄 수 있습니다.",
    baseEffect: { scoreChange: 0, moneyChange: -1, stabilityChange: -4 },
    strongRoles: ["수출기업", "외국인 관광객 대상 가게", "K-pop 공연 기획사"],
    weakRoles: ["해외여행자", "수입기업", "해외직구 소비자", "유학생 가정", "해외 원자재 수입 공장"],
    choices: [
      {
        text: "필요한 외화를 나누어 확보한다",
        recommendedRoles: ["해외여행자", "유학생 가정", "수입기업"],
        effect: { scoreChange: 5, moneyChange: -1, stabilityChange: 6 },
        feedback: "불안한 상황에서는 나누어 거래해 위험을 낮출 수 있습니다."
      },
      {
        text: "달러 수입 계약의 환전 시점을 나눈다",
        recommendedRoles: ["수출기업", "K-pop 공연 기획사"],
        effect: { scoreChange: 5, moneyChange: 7, stabilityChange: 5 },
        feedback: "달러를 버는 역할도 환전 시점을 나누면 변동 위험을 관리할 수 있습니다."
      },
      {
        text: "비용 절감 계획을 먼저 세운다",
        recommendedRoles: ["해외 원자재 수입 공장", "수입기업"],
        effect: { scoreChange: 4, moneyChange: 2, stabilityChange: 4 },
        feedback: "불리한 환율에서는 비용 구조를 점검하는 대응이 필요합니다."
      },
      {
        text: "불안하니 모든 거래를 한 번에 처리한다",
        recommendedRoles: ["해외직구 소비자"],
        effect: { scoreChange: -1, moneyChange: -6, stabilityChange: -4 },
        feedback: "불안할수록 한 번에 결정하면 위험이 커질 수 있습니다."
      }
    ],
    concept: "국제 정세가 불안하면 달러를 선호하는 심리가 강해질 수 있습니다. 달러 수요가 늘면 원/달러 환율은 상승할 수 있습니다."
  }
];
