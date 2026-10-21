import type {
  CategoryNode,
  OptionAxis,
  ProductBrandCode,
  ProductDetailView,
  SaleMode,
  ShipmentBatch,
  Variant,
} from '../../types'

// 목업 id도 서버처럼 UUID 모양으로 만든다 — 핸들러가 형식 오류(400)를 흉내 내고, 다른 목업이 같은 id를 다시 만들 수 있게
// 규칙을 고정한다. 첫 글자로 종류를 나눈다(1 카테고리 · 2 상품 · 3 옵션 · 4 리뷰 · 5 주문상품 · 6 홍보).
export const mockUuid = (kind: 1 | 2 | 3 | 4 | 5 | 6, n: number) =>
  `${kind}0000000-0000-4000-8000-${String(n).padStart(12, '0')}`

// 명세처럼 상위 > 하위 카테고리 2단계다. 이름은 헤더 메뉴(brandMenus)와 같게 둔다.
// 브랜드는 카테고리가 아니라 상품의 brand 칸이다 — 상위마다 번갈아 배정할 브랜드를 같이 둔다.
const TREE: [name: string, children: string[], brands: ProductBrandCode[]][] = [
  ['모바일', ['스마트폰', '태블릿', '폴더블'], ['APPLE', 'SAMSUNG']],
  [
    'PC/주변기기',
    ['노트북', '데스크탑', '모니터', '키보드', '마우스'],
    ['APPLE', 'SAMSUNG', 'LG'],
  ],
  [
    '웨어러블',
    ['스마트워치', '무선이어폰', '스마트밴드'],
    ['APPLE', 'SAMSUNG'],
  ],
]

export const categories: CategoryNode[] = TREE.map(([name, children], i) => {
  const categoryId = mockUuid(1, (i + 1) * 10)
  return {
    categoryId,
    name,
    parentId: null,
    children: children.map((child, j) => ({
      categoryId: mockUuid(1, (i + 1) * 10 + j + 1),
      name: child,
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
  brand: ProductBrandCode
  basePrice: number
  saleMode?: SaleMode
  // 일반 상품의 재고. 0이면 품절.
  stock?: number
  // 옵션을 전부 판매 중지로 둔다 — 목록에서 "판매 중지"로 보인다.
  paused?: boolean
  // 따로 고르는 보증 금액. 없으면 보증을 팔지 않는다.
  warranty?: number
  // 할인율(%). 없으면 사전예약 10, 일반 상품 0.
  discountRate?: number
  // 사전예약을 오늘부터 며칠 뒤 오전 9시(KST)에 열어 그날 23:59에 닫는다 — 오픈 전 화면·오픈 알림 확인용.
  opensInDays?: number
}

const DAY_MS = 24 * 60 * 60 * 1000
// 사전예약은 하루만 받는다 — 09:00(KST)에 열어 23:59:59에 닫는다.
const OPEN_MS = (15 * 60 * 60 - 1) * 1000

// 회차는 지금 기준으로 날짜를 잡아야 시간이 지나도 오픈 전·진행 중으로 남는다.
// 한국 날짜로 며칠 뒤 09:00(= 00:00Z)를 잡는다 — 한국 새벽엔 UTC 날짜가 하루 늦다.
const campaignIn = (days: number) => {
  const opensAt = new Date(Date.now() + 9 * 60 * 60 * 1000 + days * DAY_MS)
  opensAt.setUTCHours(0, 0, 0, 0)
  return {
    opensAt: opensAt.toISOString(),
    closesAt: new Date(opensAt.getTime() + OPEN_MS).toISOString(),
    status: 'BEFORE_OPEN' as const,
  }
}

function buildProduct(
  n: number,
  {
    title,
    categoryId,
    brand,
    basePrice,
    saleMode = 'IN_STOCK',
    stock = 10,
    paused,
    warranty,
    opensInDays,
    discountRate = saleMode === 'PREORDER' ? 10 : 0,
  }: Seed,
): ProductDetailView {
  const isPreorder = saleMode === 'PREORDER'
  const variants: Variant[] = COLORS.flatMap((color, c) =>
    STORAGES.map((storage, s) => {
      const selections = {
        color: normalize(color.label),
        storage: normalize(storage.label),
      }
      const listPrice = basePrice + storage.surcharge
      return {
        variantId: mockUuid(3, n * 100 + c * 10 + s),
        sku: `NV${n}-${color.slug}-${storage.label}`,
        title: `${color.label} / ${storage.label}`,
        // 서버처럼 정가에 할인율을 걸고 100원 단위로 버린다.
        price: Math.floor((listPrice * (100 - discountRate)) / 10000) * 100,
        listPrice,
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
    brand,
    modelNumber: `NV-${n}`,
    description: null,
    imageUrl: gallery[0].items[0].url,
    status: 'ACTIVE',
    visible: true,
    basePrice,
    discountRate,
    warranty: { offered: warranty !== undefined, surcharge: warranty ?? 0 },
    sellable,
    soldOut: !isPreorder && sellable && stock <= 0,
    campaign: !isPreorder
      ? null
      : opensInDays !== undefined
        ? campaignIn(opensInDays)
        : { ...campaignIn(0), status: 'OPEN' },
    optionAxes,
    variants,
    images: { gallery, detail: [] },
  }
}

const childId = (parent: string, child: string) =>
  categories
    .find((node) => node.name === parent)
    ?.children.find((node) => node.name === child)?.categoryId ?? ''

// 상위 카테고리별 [하위 카테고리, 개수, 시작가, 판매 방식]. 브랜드는 상위의 브랜드를 번갈아 쓴다.
const LINES: [
  parent: string,
  line: string,
  count: number,
  price: number,
  mode?: SaleMode,
  warranty?: number,
][] = [
  ['모바일', '스마트폰', 8, 1250000, 'IN_STOCK', 199000],
  ['모바일', '태블릿', 5, 890000],
  ['모바일', '폴더블', 3, 2190000, 'PREORDER'],
  ['PC/주변기기', '노트북', 6, 1290000, 'IN_STOCK', 290000],
  ['PC/주변기기', '모니터', 4, 450000],
  ['PC/주변기기', '키보드', 4, 89000],
  ['웨어러블', '스마트워치', 5, 390000],
  ['웨어러블', '무선이어폰', 6, 259000],
]

// 첫 상품은 사전예약 목록(/preorder)의 대표 상품이라 손으로 둔다.
// 배열 뒤쪽일수록 최근 등록이다(NEWEST 정렬 기준).
const seeds: Seed[] = [
  {
    title: '맥북 프로 14',
    categoryId: childId('PC/주변기기', '노트북'),
    brand: 'APPLE',
    basePrice: 2390000,
    saleMode: 'PREORDER',
  },
  ...LINES.flatMap(([parent, line, count, price, saleMode, warranty]) => {
    const brands = TREE.find(([name]) => name === parent)?.[2] ?? ['APPLE']
    return Array.from({ length: count }, (_, i) => ({
      title: `NOVA ${line} ${i + 1}`,
      categoryId: childId(parent, line),
      brand: brands[i % brands.length],
      basePrice: price + i * 50000,
      saleMode,
      warranty,
      // 일반 상품 줄마다 첫 상품은 할인 중 — 할인율 표시 확인용.
      ...(saleMode !== 'PREORDER' && i === 0 && { discountRate: 15 }),
    }))
  }),
  // 목록의 품절 · 판매 중지 표시를 확인하는 용도.
  {
    title: 'NOVA 스마트밴드 (품절)',
    categoryId: childId('웨어러블', '스마트밴드'),
    brand: 'SAMSUNG',
    basePrice: 79000,
    stock: 0,
  },
  {
    title: 'NOVA 마우스 (판매 중지)',
    categoryId: childId('PC/주변기기', '마우스'),
    brand: 'LG',
    basePrice: 59000,
    paused: true,
  },
  // 오픈 전 사전예약 — 오픈 알림을 신청해 볼 수 있다. 맨 뒤에 둬야 앞 상품들의 id가 그대로다.
  {
    title: '갤럭시 Z 폴드8',
    categoryId: childId('모바일', '폴더블'),
    brand: 'SAMSUNG',
    basePrice: 2390000,
    saleMode: 'PREORDER',
    opensInDays: 3,
  },
  {
    title: '아이폰 18 Pro',
    categoryId: childId('모바일', '스마트폰'),
    brand: 'APPLE',
    basePrice: 1790000,
    saleMode: 'PREORDER',
    opensInDays: 14,
  },
]

export const products: ProductDetailView[] = seeds.map((seed, i) =>
  buildProduct(i + 1, seed),
)

// 인기 검색어(순위 순). 목 검색(상품명·모델명·브랜드 부분 일치)에 결과가 있는 것만 둔다.
export const popularKeywords = [
  '맥북 프로 14',
  'NOVA 스마트폰',
  '폴더블',
  '무선이어폰',
  '노트북',
  '스마트워치',
  '태블릿',
  'SAMSUNG',
  '모니터',
  '키보드',
]

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
