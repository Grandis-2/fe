import { formatWon } from '@shared/lib/formatNumber'

import type { OrderStatus } from './orderStatus'

// 화면의 상품 줄(ProductPaymentCard)에 그대로 넘길 수 있는 모양이다.
export type OrderItem = {
  name: string
  modelNumber: string
  optionSummary: string
  quantityLabel: string
  priceLabel: string
}

export type Order = {
  /** YYYY-MM-DD */
  orderDate: string
  orderNumber: string
  status: OrderStatus
  preorder?: boolean
  amount: number
  items: OrderItem[]
  /** 구매 확정 마감(status가 confirm일 때) */
  purchaseDueAt?: Date
}

const HOUR = 60 * 60 * 1000

const item = (
  name: string,
  modelNumber: string,
  optionSummary: string,
  quantity: number,
  price: number,
): OrderItem => ({
  name,
  modelNumber,
  optionSummary,
  quantityLabel: `수량 ${quantity}개`,
  priceLabel: formatWon(price * quantity),
})

// ponytail: 아직 주문 내역 API가 없어서 상태별 목업 데이터로 대체 — API가 붙으면 entities/order/api로 교체.
// 마이페이지 주문 내역·예약 내역(구매 확정 대기)·내 리뷰(배송 완료 상품)와 헤더 배지가 같이 쓴다. 최신순으로 적어 둔다.
export const MOCK_ORDERS: Order[] = [
  {
    orderDate: '2026-10-07',
    orderNumber: 'RV26100712',
    status: 'confirm',
    preorder: true,
    amount: 1395000,
    // 마감 시각도 응답에 없어 지금 기준으로 만든다. 모듈 스코프라 렌더마다 새 Date가 생기지 않는다 —
    // 매번 새 Date를 넘기면 useCountdown의 타이머가 계속 새로 걸린다.
    purchaseDueAt: new Date(Date.now() + 18 * HOUR + 22 * 60 * 1000),
    items: [item('아이폰 18 Pro', 'A3290', '딥 블루 · 256GB', 1, 1550000)],
  },
  {
    orderDate: '2026-10-06',
    orderNumber: 'RV26100655',
    status: 'confirm',
    preorder: true,
    amount: 1701000,
    purchaseDueAt: new Date(Date.now() + 11 * HOUR),
    items: [item('맥북 에어 15', 'A3114', '스타라이트 · 256GB', 1, 1890000)],
  },
  {
    orderDate: '2026-10-06',
    orderNumber: 'NV26100688',
    status: 'ready',
    amount: 1708000,
    items: [
      item(
        '맥북 에어 13',
        'A3240',
        '미드나이트 · 16GB · 256GB · M4',
        1,
        1590000,
      ),
      item('맥세이프 충전기', 'A2580', '1m', 2, 59000),
    ],
  },
  {
    orderDate: '2026-10-05',
    orderNumber: 'NV26100531',
    status: 'preship',
    preorder: true,
    amount: 6143400,
    items: [
      item(
        '맥북 프로 14',
        'A3112',
        '스페이스 블랙 · 16GB · 512GB · M5',
        1,
        2390000,
      ),
      item('아이폰 18 Pro', 'A3290', '코스믹 오렌지 · 512GB', 2, 1850000),
      item('에어팟 프로 3', 'A3184', '화이트', 1, 369000),
      item(
        '애플 워치 S11',
        'A3301',
        '미드나이트 · 45mm · 스포츠 밴드',
        1,
        599000,
      ),
    ],
  },
  {
    orderDate: '2026-09-28',
    orderNumber: 'NV26092804',
    status: 'shipping',
    amount: 328000,
    items: [
      item('매직 키보드', 'A2450', '한국어 · 블랙', 1, 199000),
      item('매직 마우스', 'A3204', '블랙', 1, 129000),
    ],
  },
  {
    orderDate: '2026-09-12',
    orderNumber: 'NV26091277',
    status: 'delivered',
    amount: 899000,
    items: [
      item(
        '아이패드 에어 11',
        'A3266',
        '스타라이트 · 128GB · Wi-Fi',
        1,
        899000,
      ),
    ],
  },
  {
    orderDate: '2026-08-30',
    orderNumber: 'NV26083019',
    status: 'delivered',
    amount: 2194000,
    items: [
      item(
        '아이패드 프로 13',
        'A3357',
        '스페이스 블랙 · 256GB · Wi-Fi',
        1,
        1999000,
      ),
      item('애플 펜슬 프로', 'A2538', '화이트', 1, 195000),
    ],
  },
  {
    orderDate: '2026-05-21',
    orderNumber: 'NV26052140',
    status: 'cancelled',
    amount: 769000,
    items: [item('에어팟 맥스', 'A3184', '미드나이트', 1, 769000)],
  },
]
