import type { SaleMode } from './product'

/**
 * 사전예약 홍보(catalog — /api/v1/admin/promotions). 화면에서는 '사전예약'이라 부른다.
 * status는 오늘(한국 날짜)과 기간으로 서버가 정한다.
 */
export type AdminPromotionStatus = 'SCHEDULED' | 'ONGOING' | 'ENDED'

/** 홍보에 묶인 상품. 묶은 뒤 일반 상품으로 바뀌면 saleMode가 IN_STOCK이다 */
export type PromotionLinkedProduct = {
  productId: string
  title: string
  saleMode: SaleMode
}

export type AdminPromotionView = {
  promotionId: string
  name: string
  status: AdminPromotionStatus
  /** 'YYYY-MM-DD'(한국 날짜, 끝 날 포함) */
  startDate: string
  endDate: string
  thumbnailUrl: string
  detailImageUrls: string[]
  /** 보이는 순서대로. 지운 상품은 빠진다 */
  products: PromotionLinkedProduct[]
  createdAt: string
  updatedAt: string
}

/**
 * 만들기(POST)·고치기(PUT) 본문. 고치기도 모든 칸을 보낸다 — 모르는 필드는 400.
 * 사진은 purpose=PROMOTION으로 올려 받은 주소만, productIds는 1~20개.
 */
export type AdminPromotionUpsertRequest = Pick<
  AdminPromotionView,
  'name' | 'startDate' | 'endDate' | 'thumbnailUrl' | 'detailImageUrls'
> & { productIds: string[] }

/** GET /admin/promotions/linkable-products 한 줄 — 다른 홍보에 묶이지 않은 사전예약 상품 */
export type PromotionLinkableProductView = PromotionLinkedProduct & {
  /** 회차가 아직 없으면 null */
  opensAt: string | null
  colors: string[]
  storages: string[]
}
