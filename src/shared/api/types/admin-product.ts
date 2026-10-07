import type { SaleMode } from './product'

// 관리자 상품 API가 아직 쓰는 이전(프론트 제안) 상품 모양. 구매자 화면은 백엔드 계약(product.ts)으로 옮겼고,
// 관리자 상품을 백엔드(AdminProductController)에 맞출 때 이 블록도 같이 걷어낸다.
export type SaleStatus = 'BEFORE_OPEN' | 'OPEN' | 'CLOSED'

// 스펙에 UNLIMITED만 등장한다. 다른 값이 생기면 여기에 추가한다.
type StockPolicy = 'UNLIMITED'

export type ProductBadge = 'PREORDER' | 'NEW'

type PriceRange = {
  min: number
  max: number
}

type RatingSummary = {
  averageRating: number | null
  reviewCount: number
}

type ProductSummary = {
  productId: string
  name: string
  brand: string
  thumbnailUrl: string | null
  priceRange: PriceRange
  openAt: string
  saleStatus: SaleStatus
  stockPolicy: StockPolicy
  ratingSummary: RatingSummary
  badges: ProductBadge[]
}

export type ProductImage = {
  imageUrl: string
  alt: string | null
  sortOrder: number
  optionValueCode: string | null
}

export type ProductSpecGroup = {
  name: string
  items: { label: string; value: string }[]
}

export type ProductOptionValue = {
  valueCode: string
  name: string
  colorHex: string | null
  imageUrl: string | null
  sortOrder: number
}

export type ProductOptionGroup = {
  groupCode: string
  name: string
  sortOrder: number
  values: ProductOptionValue[]
}

export type ProductVariant = {
  optionCode: string
  name: string
  // groupCode -> valueCode (예: { color: 'BLK', storage: '256' })
  optionValues: Record<string, string>
  price: number
  listPrice: number | null
  available: boolean
  sortOrder: number
  images: ProductImage[]
}

type ProductSale = {
  openAt: string
  closeAt: string | null
  serverTimeAt: string
  saleStatus: SaleStatus
  stockPolicy: StockPolicy
}

type ProductDetail = ProductSummary & {
  // 모델명(예: A3112). 카드 API(ProductCardSummaryDto)엔 있는데 상세 스펙엔 없어 프론트에서
  // 추가했다 — 장바구니 카드가 이 값을 쓴다. 백엔드 스펙에 반영 요청할 것.
  modelNumber: string
  // 사전예약 여부. 상세 화면은 이 값으로 수량 고정·사전예약 버튼을 결정한다.
  saleMode: SaleMode
  categoryId: string | null
  categoryPath: string[]
  summary: string | null
  descriptionHtml: string | null
  images: ProductImage[]
  specs: ProductSpecGroup[]
  optionGroups: ProductOptionGroup[]
  variants: ProductVariant[]
  sale: ProductSale
  // 스펙 예시가 둘 다 null이라 형태를 알 수 없다. 응답 샘플 받으면 타입을 채운다.
  dispatchPreview: unknown
  my: unknown
}

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
