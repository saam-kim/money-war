(function (root) {
  'use strict';
  const causes = {
    A: { label: '달러 수요 증가', market: 'demand', change: 'increase', rate: 'up', won: 'down' },
    B: { label: '달러 수요 감소', market: 'demand', change: 'decrease', rate: 'down', won: 'up' },
    C: { label: '달러 공급 증가', market: 'supply', change: 'increase', rate: 'down', won: 'up' },
    D: { label: '달러 공급 감소', market: 'supply', change: 'decrease', rate: 'up', won: 'down' }
  };
  const rounds = [
    { id: 'travel', title: '미국 여행 예약이 늘었다', text: '우리나라 사람들의 미국 여행 예약이 늘었습니다. 여행 경비를 마련하려고 원화를 달러로 바꾸려는 사람이 많아졌습니다.', cause: 'A', action: '원화를 주고 달러를 사려는 거래가 늘었습니다.', context: '미국 여행 경비를 마련하려는 사람이 늘었습니다.' },
    { id: 'study', title: '미국 유학 계획을 취소했다', text: '국내 가정들이 미국 유학 계획을 취소했습니다. 달러로 바꿔 보낼 학비와 생활비가 줄었습니다.', cause: 'B', action: '원화를 주고 달러를 사려는 거래가 줄었습니다.', context: '학비와 생활비를 달러로 보낼 필요가 줄었습니다.' },
    { id: 'content', title: '해외 콘텐츠 판매 대금이 늘었다', text: '국내 콘텐츠 회사들이 해외에서 받은 달러 판매 대금이 늘었습니다. 국내 지출을 위해 이 달러를 원화로 바꾸는 거래가 많아졌습니다.', cause: 'C', action: '달러를 팔고 원화를 받으려는 거래가 늘었습니다.', context: '국내에서 쓸 돈을 마련하려고 달러 대금을 환전합니다.' },
    { id: 'visitors', title: '한국을 찾는 미국 관광객이 줄었다', text: '한국을 찾는 미국 관광객이 줄었습니다. 여행 경비로 가져온 달러를 원화로 바꾸는 거래도 줄었습니다.', cause: 'D', action: '달러를 팔고 원화를 받으려는 거래가 줄었습니다.', context: '미국 관광객이 국내에서 사용할 원화의 환전이 줄었습니다.' },
    { id: 'outward', title: '국내 기업이 미국에 공장을 짓는다', text: '국내 기업이 미국에 새 공장을 짓기로 했습니다. 공사비 지급을 위해 국내 원화 자금을 달러로 바꿀 예정입니다.', cause: 'A', action: '원화를 주고 달러를 사려는 거래가 늘어납니다.', context: '미국 공사비를 지급하려고 국내 원화 자금을 환전합니다.' },
    { id: 'inward', title: '미국 기업이 한국에 공장을 짓는다', text: '미국 기업이 한국에 공장을 세우기로 했습니다. 국내 토지·시설 비용 지급을 위해 가져온 달러를 원화로 바꿀 예정입니다.', cause: 'C', action: '달러를 팔고 원화를 받으려는 거래가 늘어납니다.', context: '한국의 토지와 시설을 사려고 가져온 달러를 환전합니다.' }
  ].map(news => ({ ...news, sourceRefs: ['fx-transaction', 'fx-market', 'fx-value', 'fx-application'] }));
  const individual = [
    { id: 'coffee', title: '개인 확인 A · 원두 수입', text: '국내 카페들이 미국산 원두 구매를 줄여 달러로 지급할 수입 대금이 감소했습니다.', cause: 'B', action: '수입 대금을 마련하려고 달러를 사는 거래가 줄었습니다.' },
    { id: 'remittance', title: '개인 확인 B · 해외 송금', text: '해외 취업자들이 국내 가족에게 보내는 달러가 줄어, 받은 달러를 원화로 바꾸는 거래도 감소했습니다.', cause: 'D', action: '송금받은 달러를 팔고 원화를 받는 거래가 줄었습니다.' }
  ].map(news => ({ ...news, sourceRefs: ['fx-transaction', 'fx-market', 'fx-value', 'fx-application'] }));
  const direction = value => value === 'up' ? '↑ 상승' : '↓ 하락';
  const api = { causes, rounds, individual, direction };
  root.MWData = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
