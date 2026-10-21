import type { ProductListItem } from './product'

/**
 * 고객 사전예약 홍보(catalog — /api/v1/promotions, 로그인 없이). 오늘(한국 날짜)이 기간 안인
 * 홍보만 온다. opensAt·closesAt은 묶인 사전예약 상품 중 가장 이른 오픈·가장 늦은 마감이고,
 * 셀 상품이 없거나 사전예약 서비스가 답하지 않으면 null이다.
 */
export type PromotionSummary = {
  promotionId: string
  name: string
  thumbnailUrl: string
  /** 'YYYY-MM-DD'(한국 날짜, 끝 날 포함) */
  startDate: string
  endDate: string
  opensAt: string | null
  closesAt: string | null
}

// GET /api/v1/promotions — 시작 날이 늦은 것부터, 페이지 없음
export type PromotionListResponse = { items: PromotionSummary[] }

// GET /api/v1/promotions/{promotionId} — 기간 밖이거나 없으면 404
export type PromotionDetailView = PromotionSummary & {
  /** 넣은 순서대로 세로로 이어 붙인다 */
  detailImageUrls: string[]
  /** 묶은 순서. 오픈 전·마감 뒤 사전예약과 일반 상품으로 바뀐 상품도 온다 */
  products: ProductListItem[]
}
