import { mockUuid, products } from './product'

import type { ReviewView } from '../../types'

// 리뷰를 쓸 수 있는지 판단할 내 주문상품. 주문 서비스 데이터라 리뷰 목업이 따로 들고 있는다.
// 주문 API가 주문상품 id(orderItemId)를 내려주지 않아 화면에서 리뷰 쓰기로 이어지지는 않는다 — 목업 리뷰의 주인 표시용이다.
// ponytail: 주문 API 목업이 생기면 그쪽 주문상품을 읽는다.
export type MockOrderItem = {
  orderItemId: string
  productId: string
  // 구매 당시 옵션 이름 — 리뷰의 optionTitle이 된다.
  optionTitle: string
  delivered: boolean
}

export const myOrderItems: MockOrderItem[] = [
  {
    orderItemId: mockUuid(5, 1),
    productId: mockUuid(2, 10),
    optionTitle: '실버 / 256GB',
    delivered: true,
  },
  {
    orderItemId: mockUuid(5, 2),
    productId: mockUuid(2, 11),
    optionTitle: '인디고 / 512GB',
    delivered: true,
  },
  {
    orderItemId: mockUuid(5, 3),
    productId: mockUuid(2, 28),
    optionTitle: '실버 / 256GB',
    delivered: true,
  },
  // 사전예약 상품(배송 전) — 쓰면 409 REVIEW_NOT_ALLOWED.
  {
    orderItemId: mockUuid(5, 4),
    productId: mockUuid(2, 1),
    optionTitle: '실버 / 512GB',
    delivered: false,
  },
]

type Seed = [
  productNo: number,
  optionTitle: string,
  rating: number,
  body: string,
  authorName: string,
  createdAt: string,
  // 내 주문상품 번호(myOrderItems). 없으면 남의 리뷰.
  myOrderItemNo?: number,
]

// 최신순으로 적어 둔다. 상품 번호는 fixtures/product의 상품 순번이다.
const SEEDS: Seed[] = [
  [
    10,
    '실버 / 256GB',
    4,
    '가볍고 화면이 충분히 커서 강의 필기용으로 딱이에요. 스피커 음량이 조금 아쉬워요.',
    '김**',
    '2026-09-16T03:12:00Z',
    1,
  ],
  [
    11,
    '인디고 / 512GB',
    5,
    '화면이 정말 밝고 선명해요. 배송도 예정일보다 하루 빨리 받았어요. 펜슬 반응 속도도 만족스러워요.',
    '김**',
    '2026-09-03T08:40:00Z',
    2,
  ],
  [
    2,
    '실버 / 512GB',
    5,
    '배송도 빠르고 색상이 사진이랑 똑같아서 만족합니다.',
    '이**',
    '2026-07-02T05:00:00Z',
  ],
  [
    2,
    '인디고 / 256GB',
    4,
    '화면이 정말 선명해요. 배터리도 하루는 거뜬합니다.',
    '박**',
    '2026-06-28T05:00:00Z',
  ],
  [2, '블러쉬 / 256GB', 5, '좋아요', '최**', '2026-06-21T05:00:00Z'],
  [
    2,
    '실버 / 256GB',
    3,
    '제품은 좋은데 생각보다 무게가 좀 있네요. 들고 다니기엔 살짝 무거워요. 그래도 화면과 스피커는 확실히 좋아졌습니다.',
    '정**',
    '2026-06-15T05:00:00Z',
  ],
  [
    18,
    '실버 / 256GB',
    5,
    '가볍고 발열이 거의 없어서 카페에서 작업하기 딱 좋아요.',
    '강**',
    '2026-06-10T05:00:00Z',
  ],
  [
    18,
    '블러쉬 / 512GB',
    4,
    '키보드 타건감이 좋아요. 색상도 예쁩니다.',
    '윤**',
    '2026-06-03T05:00:00Z',
  ],
  [
    32,
    '인디고 / 256GB',
    5,
    '운동할 때 심박수 측정이 정확해서 만족하고 있어요.',
    '한**',
    '2026-05-27T05:00:00Z',
  ],
  [
    37,
    '시트러스 / 256GB',
    2,
    '노이즈 캔슬링은 좋은데 귀가 좀 아파요.',
    '***',
    '2026-05-20T05:00:00Z',
  ],
]

// 저장된 리뷰는 orderItemId를 늘 들고 있다 — 공개 목록에서만 null로 가린다.
export const reviews: ReviewView[] = SEEDS.map(
  ([productNo, optionTitle, rating, body, authorName, createdAt, myNo], i) => {
    const product = products[productNo - 1]
    return {
      reviewId: mockUuid(4, i + 1),
      productId: product.productId,
      productTitle: product.title,
      optionTitle,
      imageUrl: product.imageUrl,
      rating,
      body,
      authorName,
      createdAt,
      updatedAt: createdAt,
      orderItemId: mockUuid(5, myNo ?? 100 + i),
    }
  },
)
