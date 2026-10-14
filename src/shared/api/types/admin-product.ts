import type {
  PreorderSaleStatus,
  ProductDetailView,
  ProductSaleStatus,
  SaleMode,
} from './product'

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

/**
 * 관리자 상품 목록 한 줄(GET /api/v1/admin/products). 노출 규칙 없이 비공개·준비 전·
 * 판매 중지·마감 상품까지 모두 나오고, 등록 최신순으로만 정렬된다.
 *
 * 판매 상태와 전시 상태가 한 필드로 오지 않는다 — 사전예약은 preorderStatus,
 * 일반 상품은 status를 보고, 전시는 visible과 registrationCompleted를 같이 본다.
 * 화면이 쓰는 한 값으로 바꾸는 건 entities/admin-product/api의 매퍼가 한다.
 */
export type AdminProductListItem = {
  productId: string
  saleMode: SaleMode
  title: string
  /** 대표 사진. 없으면 null */
  imageUrl: string | null
  /** 상품 판매 상태 */
  status: ProductSaleStatus
  /** 관리자가 고른 공개 여부. 회원에게 보이려면 준비 완료도 필요하다 */
  visible: boolean
  /** false면 서버가 아직 준비(사전예약 회차·일반 상품 재고)를 끝내지 않았다 */
  registrationCompleted: boolean
  /** 판매 중지를 포함한 전체 옵션 수 */
  optionCount: number
  /** 판매 중인 옵션의 최저가(원). 없으면 null */
  minPrice: number | null
  sellable: boolean
  /** 일반 상품 품절 여부. 사전예약은 늘 false */
  soldOut: boolean
  /** 사전예약 접수 단계. 일반 상품이거나 회차가 없으면 null */
  preorderStatus: PreorderSaleStatus | null
  /** 사전예약 오픈 시각(ISO-8601 UTC). 없으면 null */
  opensAt: string | null
  closesAt: string | null
}

/** 등록 상태 — 등록 상태 조회(GET /admin/products/registrations/{key})와 같은 모양 */
export type RegistrationStatusView = {
  productId: string
  /** 등록 때 받은 멱등 키. 등록 API 도입 전 상품은 null */
  idempotencyKey: string | null
  /**
   * 준비 완료 — 사전예약은 회차, 일반 상품은 재고가 만들어지면 true.
   * false인 동안은 공개로 골라 뒀어도 회원에게 보이지 않는다.
   */
  completed: boolean
}

/** 관리자 상세(GET /api/v1/admin/products/{productId}) */
export type AdminProductResponse = {
  /** 회원 상세와 같은 모양이다. visible만 실제 값이고 회원 상세에선 늘 true다 */
  product: ProductDetailView
  /** 검색 키워드를 콤마로 이은 문자열. 없으면 null. 회원에게는 나가지 않는다 */
  tags: string | null
  registration: RegistrationStatusView
}

/** 공개 여부 전환(PATCH .../visibility). boolean만 받는다 — "true"·1은 400 */
export type VisibilityChangeRequest = {
  visible: boolean
}

export type VisibilityView = {
  productId: string
  visible: boolean
}

/**
 * 상품 수정(PATCH /admin/products/{productId}). 보낸 필드만 바뀐다 — 생략하면
 * 그대로 두고, 하나도 없으면 400이다. 응답은 관리자 상세와 같은 모양이다.
 */
export type ProductEditRequest = {
  /** 1~100자, 공백만은 불가 */
  title?: string
  /** 5,000자 이하. 빈 문자열이면 비운다 */
  description?: string
  /** 콤마로 이은 검색 키워드 500자 이하. 빈 문자열이면 비운다 */
  tags?: string
  /** 바꾸면 모든 옵션 가격이 다시 계산된다 */
  basePrice?: number
  warranty?: { offered: boolean; surcharge?: number }
}

/** 옵션 값 하나 수정. 보낸 필드만 바뀌고 셋 다 없으면 400 */
export type OptionValueEditRequest = {
  /** 1~60자. 바꾸면 그 값을 고른 옵션의 이름·selections도 함께 바뀐다 */
  value?: string
  /** 이 값을 고른 옵션만 가격이 다시 계산된다 */
  surcharge?: number
  /** color 축만. 빈 문자열이면 지운다 */
  hex?: string
}

/** 기존 축에 값 하나 추가. 새 축은 만들 수 없다 */
export type OptionValueAddRequest = {
  axisKey: string
  /** 1~60자, 같은 축 중복 불가, storage는 숫자+단위 */
  value: string
  surcharge?: number
  hex?: string
}

/** 아직 없는 조합 하나를 옵션으로 만든다. 새 옵션은 바로 판매 중이다 */
export type VariantAddRequest = {
  /** 축 키별 값 — 모든 축을 넣는다. 축이 없는 상품은 {} */
  selections: Record<string, string>
  /** 비우면 서버 기본값 */
  sku?: string
}

/** 옵션 하나를 판매 중지하거나 다시 판다. 이미 받은 주문·예약은 그대로다 */
export type VariantEditRequest = {
  status: ProductSaleStatus
}

/**
 * 사전예약 모집 일정 생성·변경(PUT /admin/preorders/products/{productId}/campaign).
 * 바꿀 때 오픈은 지금부터 10분 뒤 이후여야 하고, 이미 오픈한 회차는 409다.
 */
export type PreorderCampaignRequest = {
  opensAt: string
  closesAt: string
}

/**
 * 예전 상세 모양(프론트 제안). 등록·수정 본문(AdminProductUpsertRequest)과 목업
 * 저장소가 아직 이 모양이라 남겨 둔다 — 조회는 AdminProductResponse로 옮겼고,
 * 등록·수정을 명세에 맞출 때 같이 걷어낸다.
 */
export type AdminProductDetail = ProductDetail & {
  // 관리자가 달아 둔 검색 태그. 아직 스펙에 없어 필드가 올 때까지는 비어 온다 —
  // 그래서 반영 전에는 수정 폼을 다시 열면 골라 뒀던 태그가 비어 보인다.
  // 백엔드 스펙에 반영 요청할 것.
  tags?: string[]
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
  /** 태그(검색어). 구매자 화면엔 나오지 않는다 */
  tags?: string[]
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
  /** 상품명과 태그에서 대소문자 없이 부분 일치. 비우면 무시한다 */
  q?: string
  saleMode?: SaleMode
  status?: ProductSaleStatus
  /** 0부터 시작한다 */
  page?: number
  /** 1~100(기본 20) */
  size?: number
}
