const ROLE_CARDS = [
  {
    name: "해외여행자",
    description: "해외여행을 준비하며 외화를 환전해야 합니다.",
    strongWhen: "환율 하락",
    weakWhen: "환율 상승",
    explanation: "환율이 오르면 같은 달러를 사기 위해 더 많은 원화가 필요하므로 해외여행 비용이 늘어납니다.",
    initialMoney: 100,
    initialStability: 52,
    initialRisk: 10,
    tradeType: "서비스 거래"
  },
  {
    name: "수출기업",
    description: "해외에 상품을 판매하고 달러로 대금을 받습니다.",
    strongWhen: "환율 상승",
    weakWhen: "환율 하락",
    explanation: "환율이 오르면 받은 달러를 원화로 바꿀 때 더 많은 원화를 받을 수 있어 유리할 수 있습니다.",
    initialMoney: 120,
    initialStability: 58,
    initialRisk: 16,
    tradeType: "재화 거래"
  },
  {
    name: "수입기업",
    description: "해외 상품을 사 와서 국내에 판매합니다.",
    strongWhen: "환율 하락",
    weakWhen: "환율 상승",
    explanation: "환율이 오르면 수입 대금을 치르기 위해 더 많은 원화가 필요해 비용 부담이 커집니다.",
    initialMoney: 110,
    initialStability: 54,
    initialRisk: 18,
    tradeType: "재화 거래"
  },
  {
    name: "해외직구 소비자",
    description: "해외 쇼핑몰에서 물건을 직접 구매합니다.",
    strongWhen: "환율 하락",
    weakWhen: "환율 상승",
    explanation: "환율이 낮아지면 외국 돈으로 표시된 물건을 원화로 더 싸게 살 수 있습니다.",
    initialMoney: 95,
    initialStability: 48,
    initialRisk: 12,
    tradeType: "재화 거래"
  },
  {
    name: "유학생 가정",
    description: "해외 학교 등록금과 생활비를 외화로 보내야 합니다.",
    strongWhen: "환율 하락",
    weakWhen: "환율 상승",
    explanation: "환율이 상승하면 같은 학비와 생활비를 보내기 위해 더 많은 원화가 필요합니다.",
    initialMoney: 105,
    initialStability: 50,
    initialRisk: 15,
    tradeType: "서비스 거래"
  },
  {
    name: "외국인 관광객 대상 가게",
    description: "외국인 관광객에게 숙박, 음식, 기념품을 판매합니다.",
    strongWhen: "환율 상승",
    weakWhen: "환율 하락",
    explanation: "환율이 오르면 외국인에게 한국 물가가 상대적으로 싸게 느껴져 관광 소비가 늘 수 있습니다.",
    initialMoney: 100,
    initialStability: 55,
    initialRisk: 13,
    tradeType: "서비스 거래"
  },
  {
    name: "해외 원자재 수입 공장",
    description: "생산에 필요한 원유, 금속 등 원자재를 해외에서 들여옵니다.",
    strongWhen: "환율 하락",
    weakWhen: "환율 상승",
    explanation: "환율 상승과 원자재 가격 상승이 함께 오면 생산 비용 부담이 크게 커집니다.",
    initialMoney: 125,
    initialStability: 56,
    initialRisk: 22,
    tradeType: "재화 거래"
  },
  {
    name: "K-pop 공연 기획사",
    description: "해외 공연과 콘텐츠 판매로 외화를 벌어들입니다.",
    strongWhen: "K-콘텐츠 수출 증가",
    weakWhen: "해외 비용 증가",
    explanation: "공연, 음원, 영상 콘텐츠는 서비스 거래와 문화 콘텐츠 거래로 볼 수 있습니다.",
    initialMoney: 115,
    initialStability: 53,
    initialRisk: 20,
    tradeType: "서비스 거래"
  }
];

const ROUNDS = [
  {
    title: "원/달러 환율 상승",
    shortStatus: "환율 상승",
    situation: "1달러 1,300원에서 1,420원으로 상승했습니다. 달러 가치가 오르고 원화 가치는 하락했습니다.",
    teacherGuide: "모둠별로 자기 역할이 환율 상승에서 유리한지 불리한지 먼저 판단하게 한 뒤 선택을 받으세요.",
    discussionPrompt: "우리 역할은 달러 가격이 오른 상황에서 비용이 늘어날까요, 수입이 늘어날까요?",
    resultFocus: "환율 상승은 외화를 써야 하는 주체와 외화를 벌어들이는 주체에게 반대 방향으로 작용합니다.",
    baseEffect: { scoreChange: 1, moneyChange: 0, stabilityChange: -2, riskChange: 3 },
    strongRoles: ["수출기업", "외국인 관광객 대상 가게", "K-pop 공연 기획사"],
    weakRoles: ["해외여행자", "수입기업", "해외직구 소비자", "유학생 가정", "해외 원자재 수입 공장"],
    choices: [
      {
        text: "필요한 외화를 지금 나누어 환전한다",
        recommendedRoles: ["해외여행자", "해외직구 소비자", "유학생 가정"],
        effect: { scoreChange: 4, moneyChange: -3, stabilityChange: 6, riskChange: -7 },
        feedback: "한 번에 결정하지 않고 나누어 환전하면 환율 변동 위험을 줄일 수 있습니다."
      },
      {
        text: "환율이 더 오를 것이라 보고 바로 모두 환전한다",
        recommendedRoles: ["해외여행자", "유학생 가정"],
        effect: { scoreChange: 1, moneyChange: -8, stabilityChange: 1, riskChange: 6 },
        feedback: "예상은 맞을 수도 있지만 한 번에 거래하면 위험도 커집니다."
      },
      {
        text: "수출 가격은 유지하고 해외 판매를 늘린다",
        recommendedRoles: ["수출기업", "K-pop 공연 기획사"],
        effect: { scoreChange: 5, moneyChange: 12, stabilityChange: 2, riskChange: 1 },
        feedback: "환율 상승은 수출 대금을 원화로 바꿀 때 유리할 수 있습니다."
      },
      {
        text: "수입 물량을 줄이고 국내 대체품을 찾는다",
        recommendedRoles: ["수입기업", "해외 원자재 수입 공장"],
        effect: { scoreChange: 4, moneyChange: 4, stabilityChange: 4, riskChange: -4 },
        feedback: "수입 비용이 오를 때 국내 대체품을 찾으면 부담을 낮출 수 있습니다."
      }
    ],
    concept: "환율이 상승하면 달러의 가격이 오르고 원화 가치는 낮아집니다. 해외여행자와 수입기업은 비용이 늘 수 있고, 수출기업은 달러 수입을 원화로 바꿀 때 유리할 수 있습니다."
  },
  {
    title: "원/달러 환율 하락",
    shortStatus: "환율 하락",
    situation: "1달러 1,420원에서 1,250원으로 하락했습니다. 달러 가치가 낮아지고 원화 가치는 상승했습니다.",
    teacherGuide: "1라운드와 반대되는 영향을 찾아보게 하세요. 같은 역할이라도 환율 방향이 바뀌면 판단이 달라집니다.",
    discussionPrompt: "원화 가치가 높아지면 우리 역할의 구매 비용이나 판매 수입은 어떻게 달라질까요?",
    resultFocus: "환율 하락은 외화를 사야 하는 사람에게 유리할 수 있지만, 수출기업에는 가격 경쟁력 부담이 될 수 있습니다.",
    baseEffect: { scoreChange: 1, moneyChange: 1, stabilityChange: 2, riskChange: -1 },
    strongRoles: ["해외여행자", "수입기업", "해외직구 소비자", "유학생 가정", "해외 원자재 수입 공장"],
    weakRoles: ["수출기업", "외국인 관광객 대상 가게"],
    choices: [
      {
        text: "해외 구매와 유학비 송금을 앞당긴다",
        recommendedRoles: ["해외여행자", "해외직구 소비자", "유학생 가정"],
        effect: { scoreChange: 5, moneyChange: 8, stabilityChange: 3, riskChange: -2 },
        feedback: "원화 가치가 높아졌을 때 외화 지출을 처리하면 비용을 줄일 수 있습니다."
      },
      {
        text: "수출 가격을 조정하고 품질 경쟁을 강화한다",
        recommendedRoles: ["수출기업"],
        effect: { scoreChange: 4, moneyChange: 3, stabilityChange: 5, riskChange: -1 },
        feedback: "환율 하락으로 수출 가격 경쟁력이 낮아질 수 있어 다른 경쟁력이 중요해집니다."
      },
      {
        text: "환율이 더 내려갈 때까지 모든 결정을 미룬다",
        recommendedRoles: ["해외여행자", "해외직구 소비자"],
        effect: { scoreChange: -1, moneyChange: 0, stabilityChange: -4, riskChange: 7 },
        feedback: "결정을 오래 미루면 좋은 기회를 놓치거나 불확실성이 커질 수 있습니다."
      },
      {
        text: "장기 계약 환율을 다시 점검한다",
        recommendedRoles: ["수출기업", "수입기업", "해외 원자재 수입 공장"],
        effect: { scoreChange: 3, moneyChange: 3, stabilityChange: 6, riskChange: -5 },
        feedback: "계약 시점을 조정하면 환율 변동의 영향을 관리할 수 있습니다."
      }
    ],
    concept: "환율이 하락하면 외국 화폐의 가격이 낮아지고 원화 가치는 상승합니다. 해외여행, 유학비 송금, 수입에는 유리할 수 있지만 수출기업은 가격 경쟁력이 약해질 수 있습니다."
  },
  {
    title: "엔화 가치 하락",
    shortStatus: "엔화 가치 하락",
    situation: "엔화 가치가 낮아져 일본 여행 수요가 증가했습니다. 일본 관련 소비와 여행 계획에 변화가 생겼습니다.",
    teacherGuide: "달러뿐 아니라 다른 나라 화폐 가치도 국제 거래에 영향을 준다는 점을 짚어 주세요.",
    discussionPrompt: "엔화 가치가 낮아지면 일본 여행, 일본 상품 구매, 국내 관광에는 각각 어떤 변화가 생길까요?",
    resultFocus: "특정 국가 화폐 가치의 변화는 그 나라 여행, 상품, 국내 경쟁 산업까지 연결됩니다.",
    baseEffect: { scoreChange: 1, moneyChange: 0, stabilityChange: 1, riskChange: 1 },
    strongRoles: ["해외여행자", "해외직구 소비자", "유학생 가정"],
    weakRoles: ["외국인 관광객 대상 가게"],
    choices: [
      {
        text: "일본 여행 상품과 환전 계획을 확대한다",
        recommendedRoles: ["해외여행자"],
        effect: { scoreChange: 5, moneyChange: 7, stabilityChange: 2, riskChange: 2 },
        feedback: "엔화 가치 하락은 일본 여행 비용을 낮추어 여행 수요를 늘릴 수 있습니다."
      },
      {
        text: "일본산 상품을 비교해 일부 수입한다",
        recommendedRoles: ["수입기업", "해외직구 소비자"],
        effect: { scoreChange: 4, moneyChange: 6, stabilityChange: 2, riskChange: 1 },
        feedback: "특정 국가의 화폐 가치 변화는 그 나라 상품 가격에도 영향을 줍니다."
      },
      {
        text: "국내 관광객 대상 행사를 강화한다",
        recommendedRoles: ["외국인 관광객 대상 가게", "해외여행자"],
        effect: { scoreChange: 3, moneyChange: 3, stabilityChange: 4, riskChange: -2 },
        feedback: "해외로 빠지는 수요에 대응해 국내 소비자를 붙잡는 전략입니다."
      },
      {
        text: "유행만 보고 큰 금액을 한 번에 투자한다",
        recommendedRoles: ["수출기업", "K-pop 공연 기획사"],
        effect: { scoreChange: -2, moneyChange: -6, stabilityChange: -4, riskChange: 9 },
        feedback: "환율 변화가 기회가 될 수 있지만 무리한 투자는 위험을 높입니다."
      }
    ],
    concept: "환율은 달러만의 문제가 아닙니다. 엔화 가치가 낮아지면 일본 여행과 일본 상품 구매가 상대적으로 쉬워질 수 있고, 국내 관광업은 경쟁 압력을 받을 수 있습니다."
  },
  {
    title: "국제 원자재 가격과 환율 동시 상승",
    shortStatus: "원자재·환율 상승",
    situation: "국제 원자재 가격이 오르고 환율도 상승했습니다. 수입 비용 부담이 커졌습니다.",
    teacherGuide: "원자재를 수입하는 공장과 일반 수입기업이 왜 이중 부담을 느끼는지 계산하듯 설명하게 하세요.",
    discussionPrompt: "원자재 가격도 오르고 환율도 오르면 수입 공장의 비용은 왜 더 크게 늘어날까요?",
    resultFocus: "재화 거래에서 수입 비용은 국제 가격과 환율의 영향을 함께 받을 수 있습니다.",
    baseEffect: { scoreChange: 0, moneyChange: -4, stabilityChange: -4, riskChange: 6 },
    strongRoles: ["수출기업"],
    weakRoles: ["수입기업", "해외 원자재 수입 공장", "해외여행자", "유학생 가정"],
    choices: [
      {
        text: "원자재 사용량을 줄이고 생산 계획을 조정한다",
        recommendedRoles: ["해외 원자재 수입 공장", "수입기업"],
        effect: { scoreChange: 5, moneyChange: 5, stabilityChange: 5, riskChange: -5 },
        feedback: "비용 상승이 클 때는 생산 계획을 조정해 손실을 줄일 수 있습니다."
      },
      {
        text: "국내 대체 원료와 장기 계약을 찾는다",
        recommendedRoles: ["해외 원자재 수입 공장", "수입기업"],
        effect: { scoreChange: 5, moneyChange: 6, stabilityChange: 7, riskChange: -6 },
        feedback: "대체재와 장기 계약은 수입 비용 변동 위험을 줄이는 방법입니다."
      },
      {
        text: "가격 상승분을 모두 소비자에게 바로 전가한다",
        recommendedRoles: ["수입기업", "해외 원자재 수입 공장"],
        effect: { scoreChange: 0, moneyChange: 4, stabilityChange: -6, riskChange: 6 },
        feedback: "가격을 급하게 올리면 단기 자금은 지켜도 소비자 이탈 위험이 커집니다."
      },
      {
        text: "수출 수입을 활용해 비용 상승을 일부 보완한다",
        recommendedRoles: ["수출기업", "K-pop 공연 기획사"],
        effect: { scoreChange: 4, moneyChange: 7, stabilityChange: 2, riskChange: -1 },
        feedback: "달러 수입이 있는 기업은 환율 상승의 이익으로 비용 부담을 일부 줄일 수 있습니다."
      }
    ],
    concept: "수입 원자재는 재화 거래입니다. 원자재 가격과 환율이 함께 오르면 해외에서 사 오는 비용이 이중으로 커져 공장과 수입기업에 큰 부담이 됩니다."
  },
  {
    title: "K-콘텐츠 해외 수출 증가",
    shortStatus: "콘텐츠 수출 증가",
    situation: "해외에서 한국 콘텐츠 수요가 늘고 달러 수입이 증가했습니다. 문화 콘텐츠도 국제 거래의 중요한 대상이 되고 있습니다.",
    teacherGuide: "국제 거래가 물건만의 거래가 아니라 공연, 관광, 교육 같은 서비스 거래도 포함한다는 점으로 마무리하세요.",
    discussionPrompt: "K-pop 공연과 영상 콘텐츠 판매는 왜 재화 거래가 아니라 서비스·문화 콘텐츠 거래로 볼 수 있을까요?",
    resultFocus: "문화 콘텐츠 수출은 서비스 거래와 연결되며 관광, 상품 판매, 자본 거래로도 확장될 수 있습니다.",
    baseEffect: { scoreChange: 2, moneyChange: 3, stabilityChange: 2, riskChange: 0 },
    strongRoles: ["K-pop 공연 기획사", "수출기업", "외국인 관광객 대상 가게"],
    weakRoles: [],
    choices: [
      {
        text: "해외 홍보와 공연 일정을 확대한다",
        recommendedRoles: ["K-pop 공연 기획사", "수출기업"],
        effect: { scoreChange: 6, moneyChange: 10, stabilityChange: 1, riskChange: 4 },
        feedback: "해외 수요가 늘 때 적극적으로 진출하면 수입을 키울 수 있지만 운영 위험도 늘어납니다."
      },
      {
        text: "저작권 계약과 환전 시점을 꼼꼼히 나눈다",
        recommendedRoles: ["K-pop 공연 기획사", "수출기업"],
        effect: { scoreChange: 5, moneyChange: 6, stabilityChange: 7, riskChange: -5 },
        feedback: "문화 콘텐츠 수출도 계약과 환율 관리를 함께 해야 안정적입니다."
      },
      {
        text: "외국인 관광객 연계 상품을 만든다",
        recommendedRoles: ["외국인 관광객 대상 가게", "K-pop 공연 기획사"],
        effect: { scoreChange: 4, moneyChange: 6, stabilityChange: 4, riskChange: -1 },
        feedback: "콘텐츠 인기는 관광, 숙박, 상품 판매 같은 서비스 거래와 연결될 수 있습니다."
      },
      {
        text: "인기만 믿고 비용 검토 없이 해외 지사를 세운다",
        recommendedRoles: ["K-pop 공연 기획사", "수출기업"],
        effect: { scoreChange: -1, moneyChange: -7, stabilityChange: -5, riskChange: 10 },
        feedback: "해외 공장이나 지사 설립은 자본 거래와 연결되며 신중한 판단이 필요합니다."
      }
    ],
    concept: "K-pop 공연과 콘텐츠 판매는 서비스 거래이자 문화 콘텐츠 거래입니다. 국제 거래는 물건뿐 아니라 공연, 교육, 관광 같은 서비스도 포함합니다."
  }
];

const TRADE_TYPES = [
  {
    title: "재화 거래",
    text: "자동차, 스마트폰, 식품, 원자재처럼 물건을 수출입하는 거래입니다."
  },
  {
    title: "서비스 거래",
    text: "공연, 관광, 운송, 교육 서비스처럼 형태가 없는 서비스를 사고파는 거래입니다."
  },
  {
    title: "자본 거래",
    text: "해외 주식 투자, 해외 공장 설립처럼 자본이 나라 사이를 이동하는 거래입니다."
  },
  {
    title: "노동 거래",
    text: "외국인 선수, 해외 노동자처럼 노동력이 나라 사이를 이동하는 거래입니다."
  }
];
