import type { Paged } from './common'

// 구매자용 상품 조회 API(be catalog ProductController · CategoryController) 응답 모양.
// 이름은 백엔드 레코드(ProductListItem · ProductDetailView · CategoryNode)를 그대로 따른다.
// id는 Long이라 숫자로, 금액은 BigDecimal이라 숫자로, 시각은 Instant라 ISO 문자열로 온다.

export type SaleMode = 'PREORDER' | 'IN_STOCK'

// 상품·옵션의 판매 상태. 공개 여부와 별개다 — 상품 PAUSED는 목록에서 빠지고 상세엔 판매 중지로 보인다.
export type ProductSaleStatus = 'ACTIVE' | 'PAUSED'

// 사전예약의 접수 단계. 회차 시각과 서버 시각으로 계산된다. 일반 상품은 null.
export type PreorderSaleStatus = 'BEFORE_OPEN' | 'OPEN' | 'CLOSED'

// 2단계 트리 — 상위(parentId null) 아래 하위가 id 순으로 온다.
export type CategoryNode = {
  categoryId: number
  code: string
  name: string
  parentId: number | null
  children: CategoryNode[]
}

export type CategoryTreeResponse = {
  items: CategoryNode[]
}

// GET /api/v1/products 쿼리. 정렬은 없다(productId 내림차순 고정).
// color·storage는 같은 이름을 반복해 여러 값을 보낸다(?color=블랙&color=화이트).
export type ProductListParams = {
  q?: string
  categoryId?: number
  saleMode?: SaleMode
  color?: string[]
  storage?: string[]
  // 0부터 센다. size는 1~100(기본 20).
  page?: number
  size?: number
}

// 상품 목록 봉투는 totalPages 없이 page·size·total·hasNext·items만 온다.
export type ProductPage<TItem> = Omit<Paged<TItem>, 'totalPages'>

export type ProductListItem = {
  productId: number
  saleMode: SaleMode
  title: string
  // 대표 사진. 없으면 null(화면이 대체 이미지).
  imageUrl: string | null
  status: ProductSaleStatus
  // 판매 중 옵션의 최저가. 판매 중 옵션이 없으면 null.
  minPrice: number | null
  // false면 옵션이 없거나 전부 판매 중지 — "판매 중지"로 그린다.
  sellable: boolean
  // 일반 상품의 판매 중 옵션 재고가 전부 0. 사전예약은 항상 false.
  soldOut: boolean
  preorderStatus: PreorderSaleStatus | null
  opensAt: string | null
  closesAt: string | null
  // 아래 둘은 상품 카드(모델명·색상칩)용으로 백엔드에 추가 요청한 칸이다 — 아직 안 와서 optional.
  // 오면 optional을 떼고 모양을 응답에 맞춘다.
  modelNumber?: string
  colors?: { hex: string; label: string; imageUrls: string[] }[]
}

export type ProductOptionAxis = {
  // 축 키(color·storage 또는 관리자가 정한 키).
  key: string
  label: string
  values: {
    value: string
    normalizedValue: string
    surcharge: number
    // 색상 축 값의 색상칩 색. 백엔드에 추가 요청한 칸이라 아직 optional.
    colorHex?: string
  }[]
}

export type ProductDetailVariant = {
  variantId: number
  sku: string
  title: string
  price: number
  filterAttributes: Record<string, string>
  displayAttributes: Record<string, string>
  // 축 키 → 고른 값의 normalizedValue. 선택기가 조합을 찾는 키다.
  selections: Record<string, string>
  status: ProductSaleStatus
  // 일반 상품의 가용 수량. 사전예약은 null(무제한 접수).
  availableQuantity: number | null
}

type ProductImageBundle = {
  // 색상 묶음 키. 기본 묶음은 ''.
  bundleKey: string
  items: { url: string; position: number; primary: boolean }[]
}

// 배송 차수는 여기 없다 — GET /api/v1/products/{id}/shipment-batches(preorder)를 따로 부른다.
export type ProductDetailView = Omit<
  ProductListItem,
  'minPrice' | 'preorderStatus' | 'opensAt' | 'closesAt' | 'colors'
> & {
  categoryId: number | null
  description: string | null
  visible: boolean
  basePrice: number
  warranty: { offered: boolean; surcharge: number }
  // 사전예약 회차. 일반 상품은 null.
  campaign: {
    opensAt: string
    closesAt: string
    status: PreorderSaleStatus
  } | null
  optionAxes: ProductOptionAxis[]
  // 판매 중지 옵션도 상태 그대로 온다 — 화면이 선택을 막는다.
  variants: ProductDetailVariant[]
  images: {
    gallery: ProductImageBundle[]
    detail: ProductImageBundle[]
  }
}

// GET /api/v1/products/{id}/shipment-batches(preorder) 한 줄. 날짜는 LocalDate라 'YYYY-MM-DD'로 온다.
export type ShipmentBatch = {
  batchNumber: number
  positionFrom: number
  // null이면 상한 없는 마지막 차수.
  positionTo: number | null
  estimatedShipStart: string
  estimatedShipEnd: string
}

export type ShipmentBatchListResponse = {
  items: ShipmentBatch[]
}
