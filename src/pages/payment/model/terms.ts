export type TermDetail = { heading: string; body: string }

export type Term = {
  id: string
  label: string
  /** 체크하지 않으면 결제를 막는 항목 */
  required: boolean
  detail?: TermDetail[]
}

export const terms: Term[] = [
  {
    id: 'finance',
    label: '전자금융거래 이용약관에 동의 (필수)',
    required: true,
    detail: [
      {
        heading: '전자금융거래 이용약관 (제1조 목적)',
        body: '이 약관은 회사가 제공하는 전자금융거래 서비스를 이용함에 있어 회사와 이용자 사이의 권리·의무 및 책임 사항을 정함을 목적으로 합니다.',
      },
      {
        heading: '제2조 용어의 정의',
        body: '"전자금융거래"란 회사가 전자적 장치를 통하여 서비스를 제공하고, 이용자가 회사의 종사자와 직접 대면하지 아니하고 자동화된 방식으로 이를 이용하는 거래를 말합니다.',
      },
    ],
  },
  {
    id: 'third-party',
    label: '주문 배송을 위한 개인정보 제3자 제공 동의 (필수)',
    required: true,
    detail: [
      {
        heading: '개인정보 제3자 제공 동의 (주문 및 배송 목적)',
        body: '회사는 고객님의 주문 상품 배송 및 원활한 고객 서비스를 위해 개인정보 보호법 제17조 및 제22조에 따라 아래와 같이 개인정보를 제3자에게 제공하고자 합니다.',
      },
      {
        heading: '제공하는 개인정보 항목',
        body: '수령인 성명, 수령인 연락처(휴대전화번호), 배송지 주소',
      },
      {
        heading: '제공받는 자',
        body: 'CJ대한통운, 한진택배, 우체국택배 등',
      },
      {
        heading: '제공 목적',
        body: '주문 상품의 배송 및 배송 관련 고객 응대',
      },
    ],
  },
  {
    id: 'delay',
    label:
      '예약 상품의 특성상 상품 준비 및 제작 상황에 따라 안내된 예상 배송일보다 배송이 늦어질 수 있습니다. 예상 배송일은 확정된 일정이 아니며, 배송이 지연될 수 있음을 확인하고 이에 동의합니다.',
    required: true,
  },
]
