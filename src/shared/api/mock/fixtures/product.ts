import type {
  CategoryNode,
  OptionAxis,
  ProductDetailView,
  SaleMode,
  ShipmentBatch,
  Variant,
} from '../../types'

// 목업 id도 서버처럼 UUID 모양으로 만든다 — 핸들러가 형식 오류(400)를 흉내 내고, 다른 목업이 같은 id를 다시 만들 수 있게
// 규칙을 고정한다. 첫 글자로 종류를 나눈다(1 카테고리 · 2 상품 · 3 옵션 · 4 리뷰 · 5 주문상품).
export const mockUuid = (kind: 1 | 2 | 3 | 4 | 5, n: number) =>
  `${kind}0000000-0000-4000-8000-${String(n).padStart(12, '0')}`

// ponytail: 카테고리 이름이 아직 백엔드와 확정되지 않았다. 목업은 헤더 메뉴(brandMenus)의 상위 이름 + 브랜드 하위로
// 트리를 만든다 — 확정되면 이름을 맞춘다.
const TREE: [name: string, brands: string[]][] = [
  ['모바일', ['Apple', 'Samsung']],
  ['PC/주변기기', ['Apple', 'Samsung', 'LG']],
  ['웨어러블', ['Apple', 'Samsung']],
]

export const categories: CategoryNode[] = TREE.map(([name, brands], i) => {
  const categoryId = mockUuid(1, (i + 1) * 10)
  return {
    categoryId,
    name,
    parentId: null,
    children: brands.map((brand, j) => ({
      categoryId: mockUuid(1, (i + 1) * 10 + j + 1),
      name: brand,
      parentId: categoryId,
      children: [],
    })),
  }
})

// 색상별 촬영본(1~4)이 public/images에 이미 있다.
// ponytail: 상품 이미지는 아직 맥북 촬영본뿐이라 모든 상품이 같은 이미지를 쓴다.
const COLORS = [
  { slug: 'sliver', label: '실버', hex: '#D9D9DE' },
  { slug: 'blush', label: '블러쉬', hex: '#E8B4B8' },
  { slug: 'citrus', label: '시트러스', hex: '#D9F523' },
  { slug: 'indigo', label: '인디고', hex: '#3B3A6E' },
]
const STORAGES = [
  { label: '256GB', surcharge: 0 },
  { label: '512GB', surcharge: 130000 },
]

// 정규화값은 서버처럼 소문자·공백 제거로 만든다 — selections·bundleKey·필터가 이 값으로 맞춰진다.
const normalize = (value: string) => value.replace(/\s+/g, '').toLowerCase()

const optionAxes: OptionAxis[] = [
  {
    key: 'color',
    label: '색상',
    values: COLORS.map(({ slug, label, hex }) => ({
      valueId: `color-${slug}`,
      value: label,
      normalizedValue: normalize(label),
      hex,
      surcharge: 0,
    })),
  },
  {
    key: 'storage',
    label: '저장 용량',
    values: STORAGES.map(({ label, surcharge }) => ({
      valueId: `storage-${normalize(label)}`,
      value: label,
      normalizedValue: normalize(label),
      hex: null,
      surcharge,
    })),
  },
]

type Seed = {
  title: string
  categoryId: string
  basePrice: number
  saleMode?: SaleMode
  // 일반 상품의 재고. 0이면 품절.
  stock?: number
  // 옵션을 전부 판매 중지로 둔다 — 목록에서 "판매 중지"로 보인다.
  paused?: boolean
}

function buildProduct(
  n: number,
  {
    title,
    categoryId,
    basePrice,
    saleMode = 'IN_STOCK',
    stock = 10,
    paused,
  }: Seed,
): ProductDetailView {
  const isPreorder = saleMode === 'PREORDER'
  const variants: Variant[] = COLORS.flatMap((color, c) =>
    STORAGES.map((storage, s) => {
      const selections = {
        color: normalize(color.label),
        storage: normalize(storage.label),
      }
      return {
        variantId: mockUuid(3, n * 100 + c * 10 + s),
        sku: `NV${n}-${color.slug}-${storage.label}`,
        title: `${color.label} / ${storage.label}`,
        price: basePrice + storage.surcharge,
        filterAttributes: selections,
        selections,
        status: paused ? 'PAUSED' : 'ACTIVE',
        availableQuantity: isPreorder ? null : stock,
      }
    }),
  )
  const gallery = COLORS.map(({ slug, label }) => ({
    bundleKey: normalize(label),
    items: [1, 2, 3, 4].map((shot, position) => ({
      url: `/images/macbook_neo_${slug}${shot}.png`,
      position,
      primary: position === 0,
    })),
  }))
  const sellable = variants.some((variant) => variant.status === 'ACTIVE')
  return {
    productId: mockUuid(2, n),
    categoryId,
    saleMode,
    title,
    modelNumber: `NV-${n}`,
    description: null,
    imageUrl: gallery[0].items[0].url,
    status: 'ACTIVE',
    visible: true,
    basePrice,
    warranty: { offered: false, surcharge: 0 },
    sellable,
    soldOut: !isPreorder && sellable && stock <= 0,
    campaign: isPreorder
      ? {
          opensAt: '2026-10-01T01:00:00Z',
          closesAt: '2026-12-31T14:59:59Z',
          status: 'OPEN',
        }
      : null,
    optionAxes,
    variants,
    images: { gallery, detail: [] },
  }
}

const brandId = (parent: string, brand: string) =>
  categories
    .find((node) => node.name === parent)
    ?.children.find((child) => child.name === brand)?.categoryId ?? ''

// 상위 카테고리별 [하위 상품군, 개수, 시작가, 판매 방식]. 브랜드는 하위 카테고리를 번갈아 쓴다.
const LINES: [
  parent: string,
  line: string,
  count: number,
  price: number,
  mode?: SaleMode,
][] = [
  ['모바일', '스마트폰', 8, 1250000],
  ['모바일', '태블릿', 5, 890000],
  ['모바일', '폴더블', 3, 2190000, 'PREORDER'],
  ['PC/주변기기', '노트북', 6, 1290000],
  ['PC/주변기기', '모니터', 4, 450000],
  ['PC/주변기기', '키보드', 4, 89000],
  ['웨어러블', '스마트워치', 5, 390000],
  ['웨어러블', '무선이어폰', 6, 259000],
]

// 첫 상품은 사전예약 목업(entities/preorder)이 상세로 보내는 상품이라 손으로 둔다.
// 배열 뒤쪽일수록 최근 등록이다(NEWEST 정렬 기준).
const seeds: Seed[] = [
  {
    title: '맥북 프로 14',
    categoryId: brandId('PC/주변기기', 'Apple'),
    basePrice: 2390000,
    saleMode: 'PREORDER',
  },
  ...LINES.flatMap(([parent, line, count, price, saleMode]) => {
    const brands = TREE.find(([name]) => name === parent)?.[1] ?? []
    return Array.from({ length: count }, (_, i) => ({
      title: `NOVA ${line} ${i + 1}`,
      categoryId: brandId(parent, brands[i % brands.length]),
      basePrice: price + i * 50000,
      saleMode,
    }))
  }),
  // 목록의 품절 · 판매 중지 표시를 확인하는 용도.
  {
    title: 'NOVA 스마트밴드 (품절)',
    categoryId: brandId('웨어러블', 'Samsung'),
    basePrice: 79000,
    stock: 0,
  },
  {
    title: 'NOVA 마우스 (판매 중지)',
    categoryId: brandId('PC/주변기기', 'LG'),
    basePrice: 59000,
    paused: true,
  },
]

export const products: ProductDetailView[] = seeds.map((seed, i) =>
  buildProduct(i + 1, seed),
)

// 사전예약 상품의 배송 차수 — 1~500번은 1차, 그 뒤는 2차(상한 없음).
export const shipmentBatches: ShipmentBatch[] = [
  {
    batchNumber: 1,
    positionFrom: 1,
    positionTo: 500,
    estimatedShipStart: '2026-10-15',
    estimatedShipEnd: '2026-10-17',
  },
  {
    batchNumber: 2,
    positionFrom: 501,
    positionTo: null,
    estimatedShipStart: '2026-10-22',
    estimatedShipEnd: '2026-10-24',
  },
]
