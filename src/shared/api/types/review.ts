// 리뷰 API(catalog 서비스) 모양. 모든 리뷰 API가 같은 ReviewView를 쓰고, 목록은 최신순 고정이다.

export type ReviewView = {
  reviewId: string
  productId: string
  // 현재 상품명 — 상품명이 바뀌면 따라 바뀐다.
  productTitle: string
  // 구매 당시 옵션 이름(예: '블랙 / 256GB'). 축이 없는 상품은 상품명.
  optionTitle: string
  // 상품 대표 사진. 없으면 null.
  imageUrl: string | null
  // 1~5 정수.
  rating: number
  body: string
  // 가린 작성자 이름(예: '김**', 이름이 없으면 '***').
  authorName: string
  createdAt: string
  // 수정하지 않았으면 createdAt과 같다.
  updatedAt: string
  // 내 리뷰·작성·수정 응답에만 있고 공개 목록에선 null.
  orderItemId: string | null
}

// GET /api/v1/reviews(구매후기 모아보기) 쿼리. 상위 카테고리면 하위 상품 리뷰까지 나온다.
export type ReviewListParams = {
  categoryId?: string
  page?: number
  size?: number
}

// GET /api/v1/reviews/mine 쿼리. orderItemId를 주면 그 주문상품의 내 리뷰만(0~1건) 온다.
export type MyReviewListParams = {
  orderItemId?: string
  page?: number
  size?: number
}

// POST /api/v1/reviews — 배송 완료된 일반 판매 주문상품 하나에 리뷰 하나. 모르는 필드는 400.
export type ReviewCreateRequest = Pick<ReviewView, 'rating' | 'body'> & {
  orderItemId: string
}

// PATCH /api/v1/reviews/{reviewId} — 보낸 필드만 바뀌고 둘 다 없으면 400.
export type ReviewUpdateRequest = Partial<Pick<ReviewView, 'rating' | 'body'>>
