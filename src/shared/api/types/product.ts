export type SaleStatus = 'BEFORE_OPEN' | 'OPEN' | 'CLOSED'

// 스펙에 UNLIMITED만 등장한다. 다른 값이 생기면 여기에 추가한다.
export type StockPolicy = 'UNLIMITED'

export type ProductBadge = 'PREORDER' | 'NEW'

export type ProductSort =
  | 'RECOMMENDED'
  | 'OPEN_AT_ASC'
  | 'PRICE_ASC'
  | 'PRICE_DESC'
  | 'RATING_DESC'
  | 'REVIEW_COUNT_DESC'
  | 'NEWEST'

export type Category = {
  categoryId: string
  name: string
  parentId: string | null
  sortOrder: number
  children: Category[]
}

export type PriceRange = {
  min: number
  max: number
}

export type RatingSummary = {
  averageRating: number | null
  reviewCount: number
}

export type ProductSummary = {
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

export type ProductSale = {
  openAt: string
  closeAt: string | null
  serverTimeAt: string
  saleStatus: SaleStatus
  stockPolicy: StockPolicy
}

export type DispatchWave = {
  wave: number
  fromSeq: number
  toSeq: number
  estimatedDeliveryDate: string | null
}

export type DispatchWindowVersion = {
  waves: DispatchWave[]
  undeterminedFromSeq: number | null
  productId: string
  version: number
  // publishedAt이 별도로 있는 걸로 보아 발행 상태가 존재한다. 확인되면 정정할 것.
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: string
  createdBy: string
  publishedAt: string | null
  confirmedCountByWave: Record<string, number> | null
}

export type ProductDetail = ProductSummary & {
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

export type CategoryTreeResponse = {
  items: Category[]
}

// 메인페이지 카드 캐러셀 전용 — ProductDetail/ProductSummary는 목록 페이지·상세
// 페이지가 필요로 하는 정보(카테고리, 평점, variants 등)까지 다 실어서 카드 하나
// 그리는 데는 과하다. 카드가 실제로 쓰는 모양만 딱 맞춘 별도 DTO.
export type ProductListQuery = 'best' | 'recommend'

export type ProductCardColorDto = {
  hex: string
  label: string
  imageUrls: string[]
}

export type ProductCardOptionDto = {
  label: string
  extraPrice: number
}

// 카드 목록 전용 판매 상태. ProductSummary의 saleStatus(BEFORE_OPEN/OPEN/CLOSED)와는
// 별개로, 카드 API가 사전예약 여부만 이 값으로 내려준다.
export type SaleMode = 'PREORDER' | 'IN_STOCK'

export type ProductCardSummaryDto = {
  productId: string
  name: string
  modelNumber: string
  brand?: string
  basePrice: number
  saleMode: SaleMode
  colors: ProductCardColorDto[]
  options: ProductCardOptionDto[]
}

export type ProductCardListResponse = {
  items: ProductCardSummaryDto[]
}

// 카테고리 검색 화면은 가격 정렬만 노출한다.
export type ProductCardSort = Extract<ProductSort, 'PRICE_ASC' | 'PRICE_DESC'>

export type ProductCardSearchParams = {
  category?: string
  subCategory?: string
  brand?: string
  sort?: ProductCardSort
}

export type ProductCardSearchResponse = ProductCardListResponse & {
  total: number
}
