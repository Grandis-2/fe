import type { Paged } from './common'

// 구매자용 상품·카테고리 API(catalog 서비스 — api-docs의 catalog.json) 응답 모양.
// 이름은 명세의 스키마(ProductListItem · ProductDetailView · CategoryNode …)를 그대로 따른다.
// id는 UUID 문자열(옵션 값 id만 UUID 아닌 문자열), 금액은 원 단위 정수, 시각은 ISO-8601 UTC 문자열로 온다.
// 값이 없는 필드도 빠지지 않고 null로 온다.

export type SaleMode = 'PREORDER' | 'IN_STOCK'

// 상품·옵션의 판매 상태. 공개 여부와 별개다 — 상품 PAUSED는 목록에서 빠지고 상세엔 판매 중지로 보인다.
export type ProductSaleStatus = 'ACTIVE' | 'PAUSED'

// 사전예약의 접수 단계. 회차 시각과 서버 시각으로 계산된다. 일반 상품은 null.
export type PreorderSaleStatus = 'BEFORE_OPEN' | 'OPEN' | 'CLOSED'

export type ProductSort = 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC'

// 2단계 트리 — 배열 순서가 표시 순서다. 하위의 children은 늘 빈 배열.
export type CategoryNode = {
  categoryId: string
  name: string
  parentId: string | null
  children: CategoryNode[]
}

export type CategoryTreeResponse = {
  items: CategoryNode[]
}

// GET /api/v1/products 쿼리.
// color·storage는 같은 이름을 반복해 여러 값을 보낸다(?color=블랙&color=화이트). 축 안은 OR, 축끼리는 AND.
export type ProductListParams = {
  // 상품명·태그 부분 일치(대소문자 무시).
  q?: string
  // 상위 카테고리면 하위 상품까지 나온다. 없는 id는 빈 목록.
  categoryId?: string
  saleMode?: SaleMode
  color?: string[]
  storage?: string[]
  // 기본 NEWEST. 가격순은 minPrice 기준이고 null은 늘 맨 뒤.
  sort?: ProductSort
  // 0부터 센다. size는 1~100(기본 20).
  page?: number
  size?: number
}

// 목록 봉투는 totalPages 없이 page·size·total·hasNext·items만 온다(카테고리만 {items}).
export type PageResponse<TItem> = Omit<Paged<TItem>, 'totalPages'>

export type ProductListItem = {
  productId: string
  saleMode: SaleMode
  title: string
  // 첫 색상 묶음의 첫 장(색상 축이 없으면 기본 묶음 첫 장). 없으면 null — 화면이 대체 이미지.
  imageUrl: string | null
  // 회원 목록엔 ACTIVE만 나온다.
  status: ProductSaleStatus
  // 판매 중 옵션의 최저가(품절 포함, 판매 중지 제외). 판매 중 옵션이 없으면 null.
  minPrice: number | null
  // false면 판매 중 옵션이 없다 — "판매 중지"로 그린다.
  sellable: boolean
  // 일반 상품의 판매 중 옵션 재고가 전부 0. 사전예약은 항상 false.
  soldOut: boolean
  preorderStatus: PreorderSaleStatus | null
  opensAt: string | null
  closesAt: string | null
  // 아래 둘은 상품 카드(모델명·색상칩)용으로 백엔드에 추가될 칸이다 — 아직 명세에 없어 optional.
  // 명세에 들어오면 optional을 떼고 모양을 응답에 맞춘다.
  modelNumber?: string
  // 색상 축 값별 색상칩. 색상 축이 없으면 빈 배열.
  colors?: { label: string; hex: string; imageUrls: string[] }[]
}

export type OptionValue = {
  // UUID 아닌 문자열. 값 이름을 고쳐도 안 바뀐다.
  valueId: string
  // 표시 문구.
  value: string
  // 비교용 값 — 옵션 selections와 사진 bundleKey가 이 값으로 맞춰진다.
  normalizedValue: string
  // 색상 축 값의 스와치(#RRGGBB). 색상 축이 아니거나 없으면 null.
  hex: string | null
  surcharge: number
}

export type OptionAxis = {
  // 축 키(소문자). color·storage는 목록 필터에도 쓴다.
  key: string
  label: string
  values: OptionValue[]
}

// 실제로 파는 축 값 조합 하나. GET /products/{id}/variants/{variantId} 응답도 이 모양이다.
export type Variant = {
  variantId: string
  sku: string
  // 값 이름을 축 순서대로 ' / '로 이은 것(축이 없으면 상품명).
  title: string
  // 기본가 + 고른 값의 추가금. 보증은 들어 있지 않다.
  price: number
  // 목록 필터 축(color·storage)의 정규화값.
  filterAttributes: Record<string, string>
  // 축 키 → 고른 값의 normalizedValue. 선택기가 조합을 찾는 키다.
  selections: Record<string, string>
  status: ProductSaleStatus
  // 일반 상품의 구매 가능 재고. 사전예약은 null(무제한 접수).
  availableQuantity: number | null
}

export type ProductImageBundle = {
  // 갤러리는 색상 normalizedValue(색상 축이 없으면 ''), 상세는 영역 이름.
  bundleKey: string
  // position 순.
  items: { url: string; position: number; primary: boolean }[]
}

// 회원 상세·관리자 상세·등록 미리보기가 같은 모양이다.
// 배송 차수는 여기 없다 — preorder 서비스의 GET /api/v1/preorders/products/{productId}/shipment-batches를 따로 부른다.
export type ProductDetailView = Pick<
  ProductListItem,
  | 'productId'
  | 'saleMode'
  | 'title'
  | 'imageUrl'
  | 'status'
  | 'sellable'
  | 'soldOut'
  | 'modelNumber'
> & {
  categoryId: string
  description: string | null
  // 회원 상세에선 늘 true.
  visible: boolean
  basePrice: number
  // 보증은 따로 고르는 상품이라 옵션 price에 들어 있지 않다.
  warranty: { offered: boolean; surcharge: number }
  // 사전예약 회차. 일반 상품(또는 회차가 아직 없으면) null.
  campaign: {
    opensAt: string
    closesAt: string
    status: PreorderSaleStatus
  } | null
  // 관리자가 넣은 순서. 축이 없으면 빈 배열.
  optionAxes: OptionAxis[]
  // 판매 중지 옵션도 상태 그대로 온다 — 화면이 선택을 막는다. 등록 때 뺀 조합은 아예 없다.
  variants: Variant[]
  images: {
    gallery: ProductImageBundle[]
    detail: ProductImageBundle[]
  }
}
