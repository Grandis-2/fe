import type {
  AdminProductDetail,
  AdminProductSummary,
  AdminStockItem,
  DisplayStatus,
  ProductBadge,
  SaleStatus,
} from '@/shared/api/types'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
export type AdminProduct = AdminProductSummary
export type AdminProductDetailModel = AdminProductDetail

// 화면(pages/widgets)은 DTO를 직접 import할 수 없어 여기서 다시 내보낸다.
export type AdminStockItemModel = AdminStockItem
export type AdminSaleStatus = SaleStatus
export type AdminDisplayStatus = DisplayStatus

export const saleStatusLabel: Record<SaleStatus, string> = {
  BEFORE_OPEN: '판매 예정',
  OPEN: '판매 중',
  CLOSED: '판매 종료',
}

export const saleStatusColor: Record<SaleStatus, 'green' | 'blue' | 'gray'> = {
  OPEN: 'green',
  BEFORE_OPEN: 'blue',
  CLOSED: 'gray',
}

export const displayStatusLabel: Record<DisplayStatus, string> = {
  DRAFT: '초안',
  PUBLISHED: '게시중',
  HIDDEN: '숨김',
}

/** 사전 예약 상품인지 — 별도 필드가 없어 badges로 판단한다 */
export const isPreorder = (product: { badges: ProductBadge[] }) =>
  product.badges.includes('PREORDER')

export const productTypeLabel = (product: { badges: ProductBadge[] }) =>
  isPreorder(product) ? '사전 예약' : '일반 판매'
