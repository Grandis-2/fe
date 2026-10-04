import type {
  AdminProductDetail,
  ProductOptionGroup,
  ProductVariant,
  SaleStatus,
} from '../../types'

const COLORS = [
  { valueCode: 'BLK', name: '딥 블루', colorHex: '#3F4891' },
  { valueCode: 'SLV', name: '실버', colorHex: '#C7C9D1' },
]
const STORAGES = ['256', '512']

function buildOptionGroups(): ProductOptionGroup[] {
  return [
    {
      groupCode: 'color',
      name: '색상',
      sortOrder: 0,
      values: COLORS.map((colorValue, index) => ({
        ...colorValue,
        imageUrl: null,
        sortOrder: index,
      })),
    },
    {
      groupCode: 'storage',
      name: '용량',
      sortOrder: 1,
      values: STORAGES.map((storage, index) => ({
        valueCode: storage,
        name: `${storage}GB`,
        colorHex: null,
        imageUrl: null,
        sortOrder: index,
      })),
    },
  ]
}

function buildVariants(basePrice: number): ProductVariant[] {
  return COLORS.flatMap((colorValue, colorIndex) =>
    STORAGES.map((storage, storageIndex) => ({
      optionCode: `${storage}-${colorValue.valueCode}`,
      name: `${storage}GB ${colorValue.name}`,
      optionValues: { color: colorValue.valueCode, storage },
      price: basePrice + storageIndex * 250_000,
      listPrice: null,
      available: true,
      sortOrder: colorIndex * STORAGES.length + storageIndex,
      images: [],
    })),
  )
}

type Seed = {
  productId: string
  name: string
  brand: string
  saleStatus: SaleStatus
  displayStatus: AdminProductDetail['displayStatus']
  preorder: boolean
  openAt: string
  closeAt: string | null
  basePrice: number
}

const SEEDS: Seed[] = [
  {
    productId: 'SM-G999',
    name: '갤럭시 G999',
    brand: 'Samsung',
    saleStatus: 'OPEN',
    displayStatus: 'PUBLISHED',
    preorder: true,
    openAt: '2026-09-15T00:00:00.000Z',
    closeAt: '2026-09-15T14:59:00.000Z',
    basePrice: 1_200_000,
  },
  {
    productId: 'AP-I18',
    name: '아이폰 18',
    brand: 'Apple',
    saleStatus: 'OPEN',
    displayStatus: 'PUBLISHED',
    preorder: false,
    openAt: '2026-08-01T00:00:00.000Z',
    closeAt: null,
    basePrice: 1_350_000,
  },
  {
    productId: 'AP-I18-PRO',
    name: '아이폰 18 PRO',
    brand: 'Apple',
    saleStatus: 'BEFORE_OPEN',
    displayStatus: 'DRAFT',
    preorder: true,
    openAt: '2026-10-20T01:00:00.000Z',
    closeAt: '2026-10-20T14:59:00.000Z',
    basePrice: 1_650_000,
  },
  {
    productId: 'SM-FOLD8',
    name: 'Samsung Fold 8',
    brand: 'Samsung',
    saleStatus: 'CLOSED',
    displayStatus: 'HIDDEN',
    preorder: true,
    openAt: '2026-07-10T00:00:00.000Z',
    closeAt: '2026-07-10T14:59:00.000Z',
    basePrice: 2_100_000,
  },
]

function buildDetail(seed: Seed): AdminProductDetail {
  const variants = buildVariants(seed.basePrice)
  const prices = variants.map((variant) => variant.price)

  return {
    productId: seed.productId,
    // 시드에 모델명이 따로 없어 상품 ID를 그대로 쓴다.
    modelNumber: seed.productId,
    name: seed.name,
    brand: seed.brand,
    thumbnailUrl: null,
    saleMode: seed.preorder ? 'PREORDER' : 'IN_STOCK',
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    openAt: seed.openAt,
    saleStatus: seed.saleStatus,
    stockPolicy: 'UNLIMITED',
    ratingSummary: { averageRating: null, reviewCount: 0 },
    badges: seed.preorder ? ['PREORDER'] : [],
    categoryId: 'smartphone',
    categoryPath: ['스마트폰'],
    summary: null,
    descriptionHtml: null,
    images: [],
    specs: [],
    optionGroups: buildOptionGroups(),
    variants,
    sale: {
      openAt: seed.openAt,
      closeAt: seed.closeAt,
      serverTimeAt: new Date().toISOString(),
      saleStatus: seed.saleStatus,
      stockPolicy: 'UNLIMITED',
    },
    dispatchPreview: null,
    my: null,
    displayStatus: seed.displayStatus,
    hiddenReason: seed.displayStatus === 'HIDDEN' ? '재고 소진' : null,
    firstAcceptSeqIssuedAt: null,
    activeDispatchWindowVersion: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-09-12T03:00:00.000Z',
    updatedBy: 'admin',
  }
}

// 페이지네이션을 확인할 수 있도록 4종을 반복해 채운다.
// 이름까지 그대로 베끼면 같은 이름이 3~4개씩 생겨서, 예약 현황의 상품 필터
// 드롭다운이 '갤럭시 G999'만 네 줄 나오는 모양이 된다(어느 걸 고른 건지 알 수
// 없다). productId에 붙이는 번호를 이름에도 붙여 서로 구분되게 한다.
export const adminProductStore: AdminProductDetail[] = Array.from(
  { length: 13 },
  (_, index) => {
    const seed = SEEDS[index % SEEDS.length]
    return buildDetail({
      ...seed,
      productId: `${seed.productId}-${index + 1}`,
      name: `${seed.name} ${index + 1}`,
    })
  },
)
