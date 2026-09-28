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
  /** 예상 배송일. null이면 미정 */
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
