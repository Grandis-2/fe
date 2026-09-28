import type { ProductCardSummaryDto, SaleMode } from '../../types'

const COLORS: { slug: string; label: string; hex: string }[] = [
  { slug: 'sliver', label: '실버', hex: '#D9D9DE' },
  { slug: 'blush', label: '블러쉬', hex: '#E8B4B8' },
  { slug: 'citrus', label: '시트러스', hex: '#D9F523' },
  { slug: 'indigo', label: '인디고', hex: '#3B3A6E' },
]

// 색상별 촬영본(1~4)이 public/images에 이미 있다.
const colors = COLORS.map(({ slug, label, hex }) => ({
  hex,
  label,
  imageUrls: [1, 2, 3, 4].map((n) => `/images/macbook_neo_${slug}${n}.png`),
}))

const options = [
  { label: '256GB', extraPrice: 0 },
  { label: '512GB', extraPrice: 130000 },
]

function buildCards(
  idPrefix: string,
  count: number,
  basePrice: number,
  name = 'NOVA MacBook Neo',
  saleMode: SaleMode = 'IN_STOCK',
): ProductCardSummaryDto[] {
  return Array.from({ length: count }, (_, i) => ({
    productId: `${idPrefix}-${i + 1}`,
    name: `${name} ${i + 1}`,
    modelNumber: 'MB-NEO',
    basePrice: basePrice + i * 50000,
    saleMode,
    colors,
    options,
  }))
}

export const bestProductCards = buildCards('best', 4, 1290000)
export const recommendedProductCards = buildCards('recommend', 8, 1690000)

// 헤더 메가 메뉴(CategoryNav)의 카테고리 > 하위 카테고리와 이름을 맞춘다.
// ponytail: 상품 이미지는 아직 맥북 촬영본뿐이라 모든 카테고리가 같은 이미지를 쓴다.
// saleMode 생략 시 IN_STOCK — 폴더블만 신제품 사전예약 시나리오로 PREORDER 예시를 남긴다.
const SEARCH_CATEGORIES: Record<string, [string, number, number, SaleMode?][]> =
  {
    모바일: [
      ['스마트폰', 8, 1250000],
      ['태블릿', 5, 890000],
      ['폴더블', 3, 2190000, 'PREORDER'],
    ],
    'PC/주변기기': [
      ['노트북', 6, 1290000],
      ['모니터', 4, 450000],
      ['키보드/마우스', 7, 89000],
    ],
    웨어러블: [
      ['스마트워치', 5, 390000],
      ['무선이어폰', 6, 259000],
      ['스마트밴드', 2, 79000],
    ],
  }

export const searchProductCardGroups = Object.entries(
  SEARCH_CATEGORIES,
).flatMap(([category, subCategories], categoryIndex) =>
  subCategories.map(([subCategory, count, basePrice, saleMode], subIndex) => ({
    category,
    subCategory,
    // id에 카테고리 이름('PC/주변기기')을 넣으면 '/' 때문에 상품 상세 경로가 깨진다.
    cards: buildCards(
      `search-${categoryIndex}-${subIndex}`,
      count,
      basePrice,
      `NOVA ${subCategory}`,
      saleMode,
    ),
  })),
)
