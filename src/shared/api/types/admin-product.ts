import type {
  ProductBadge,
  ProductDetail,
  ProductImage,
  ProductOptionGroup,
  ProductSpecGroup,
  ProductSummary,
  ProductVariant,
  SaleStatus,
} from './product'

export type DisplayStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN'

// 관리자 목록은 구매자용 요약(ProductSummary)에 운영 정보가 더 붙는다.
export type AdminProductSummary = ProductSummary & {
  displayStatus: DisplayStatus
  variantCount: number
  activeDispatchWindowVersion: number | null
  firstAcceptSeqIssuedAt: string | null
  updatedAt: string
  updatedBy: string | null
}

// 관리자 상세도 마찬가지로 구매자용 상세에 운영 정보가 더 붙는다.
export type AdminProductDetail = ProductDetail & {
  displayStatus: DisplayStatus
  hiddenReason: string | null
  firstAcceptSeqIssuedAt: string | null
  activeDispatchWindowVersion: number | null
  createdAt: string
  updatedAt: string
  updatedBy: string | null
}

/**
 * 등록(POST)과 수정(PATCH)이 같은 본문을 쓴다.
 * 스펙에 required가 없어 전 필드가 선택이다 — 최소 필드가 확정되면 좁힌다.
 */
export type AdminProductUpsertRequest = {
  productId?: string | null
  name?: string
  brand?: string
  categoryId?: string | null
  summary?: string | null
  descriptionHtml?: string | null
  images?: ProductImage[]
  specs?: ProductSpecGroup[]
  optionGroups?: ProductOptionGroup[]
  variants?: ProductVariant[]
  openAt?: string
  closeAt?: string | null
  badges?: ProductBadge[]
}

export type AdminProductListParams = {
  displayStatus?: DisplayStatus
  saleStatus?: SaleStatus
  q?: string
  /** 0부터 시작한다 */
  page?: number
  size?: number
}

export type AdminProductHideRequest = {
  reason: string
}
