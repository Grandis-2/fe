import type {
  AdminProductDetail,
  AdminProductSummary,
  AdminStockItem,
  DisplayStatus,
  ProductBadge,
  SaleStatus,
} from '@shared/api/types'

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

/**
 * 전시 상태는 브랜드 색으로 말하고, 노출 여부는 채움으로 가른다.
 * 판매 상태 열(초록·파랑·회색)과 나란히 서는 자리라, 전시까지 의미색을 쓰면
 * 두 열이 한 덩어리로 읽힌다.
 *
 * - 게시중: secondary + subtle(채움) — 지금 구매자에게 보이는 중
 * - 숨김:   secondary + outline(테두리) — 냈다가 내림
 * - 초안:   gray + outline — 아직 한 번도 낸 적 없어 브랜드 색을 줄 자리가 아니다
 */
export const displayStatusColor: Record<DisplayStatus, 'gray' | 'secondary'> = {
  DRAFT: 'gray',
  PUBLISHED: 'secondary',
  HIDDEN: 'secondary',
}

export const displayStatusVariant: Record<DisplayStatus, 'subtle' | 'outline'> =
  {
    DRAFT: 'outline',
    PUBLISHED: 'subtle',
    HIDDEN: 'outline',
  }

// 표의 전시 열 너비를 가장 긴 문구에 맞출 때 쓴다(Tag의 widthOptions).
export const displayStatusLabels = Object.values(displayStatusLabel)

/** 숨길 때 사유는 서버가 5~500자를 요구한다 */
export const HIDE_REASON_MIN_LENGTH = 5
export const HIDE_REASON_MAX_LENGTH = 500

/** 사전 예약 상품인지 — 별도 필드가 없어 badges로 판단한다 */
export const isPreorder = (product: { badges: ProductBadge[] }) =>
  product.badges.includes('PREORDER')

export const productTypeLabel = (product: { badges: ProductBadge[] }) =>
  isPreorder(product) ? '사전 예약' : '일반 판매'

// 표의 Tag 열 너비를 가장 긴 문구에 맞출 때 쓴다(Tag의 widthOptions).
export const saleStatusLabels = Object.values(saleStatusLabel)
export const productTypeLabels = [
  productTypeLabel({ badges: ['PREORDER'] }),
  productTypeLabel({ badges: [] }),
]

/**
 * 등록·수정 폼에서 고를 수 있는 브랜드.
 *
 * 자유 입력으로 두면 안 된다 — 구매자 쪽 브랜드 필터가 이 문자열을 그대로
 * 쿼리(`?brand=Apple`)로 쓰고 정확히 일치할 때만 걸러서, 'samsung'·'삼성'처럼
 * 한 글자만 달라도 그 상품은 필터에서 조용히 사라진다.
 *
 * LG가 들어 있는 건 메가 메뉴의 PC/주변기기 브랜드 묶음이 이미 LG를 내걸고
 * 있어서다. 여기서 빼면 그 타일은 영원히 빈 결과만 돌려준다.
 *
 * ponytail: 브랜드 목록 API가 없어서 상수다. 생기면 응답으로 갈아 끼운다.
 */
export const PRODUCT_BRANDS = ['Samsung', 'Apple', 'LG'] as const
