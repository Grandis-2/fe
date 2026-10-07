import type {
  CategoryNode,
  ProductDetailVariant,
  ProductDetailView,
  ProductOptionAxis,
  SaleMode,
} from '../../types'

// ponytail: 백엔드 카테고리 행은 이름이 프론트와 확정되면 넣는다고 비워 둔 상태다(be V202610052320 주석).
// 그때까지 목업은 헤더 메뉴(brandMenus)의 상위 이름 + 브랜드 하위로 트리를 만든다 — 확정되면 이름을 맞춘다.
const TREE: [code: string, name: string, brands: string[]][] = [
  ['mobile', '모바일', ['Apple', 'Samsung']],
  ['pc', 'PC/주변기기', ['Apple', 'Samsung', 'LG']],
  ['wearable', '웨어러블', ['Apple', 'Samsung']],
]

export const categories: CategoryNode[] = TREE.map(
  ([code, name, brands], i) => {
    const categoryId = i + 1
    return {
      categoryId,
      code,
      name,
      parentId: null,
      children: brands.map((brand, j) => ({
        categoryId: categoryId * 10 + j + 1,
        code: `${code}-${brand.toLowerCase()}`,
        name: brand,
        parentId: categoryId,
        children: [],
      })),
    }
  },
)

// 색상별 촬영본(1~4)이 public/images에 이미 있다.
// ponytail: 상품 이미지는 아직 맥북 촬영본뿐이라 모든 상품이 같은 이미지를 쓴다.
export const COLORS = [
  { slug: 'sliver', label: '실버', hex: '#D9D9DE' },
  { slug: 'blush', label: '블러쉬', hex: '#E8B4B8' },
  { slug: 'citrus', label: '시트러스', hex: '#D9F523' },
  { slug: 'indigo', label: '인디고', hex: '#3B3A6E' },
]
const STORAGES = [
  { label: '256GB', surcharge: 0 },
  { label: '512GB', surcharge: 130000 },
]

const optionAxes: ProductOptionAxis[] = [
  {
    key: 'color',
    label: '색상',
    values: COLORS.map(({ label }) => ({
      value: label,
      normalizedValue: label,
      surcharge: 0,
    })),
  },
  {
    key: 'storage',
    label: '저장 용량',
    values: STORAGES.map(({ label, surcharge }) => ({
      value: label,
      normalizedValue: label,
      surcharge,
    })),
  },
]

type Seed = {
  title: string
  categoryId: number
  basePrice: number
  saleMode?: SaleMode
  // 일반 상품의 재고. 0이면 품절.
  stock?: number
  // 옵션을 전부 판매 중지로 둔다 — 목록에서 "판매 중지"로 보인다.
  paused?: boolean
}

function buildProduct(
  productId: number,
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
  const variants: ProductDetailVariant[] = COLORS.flatMap((color) =>
    STORAGES.map((storage) => {
      const selections = { color: color.label, storage: storage.label }
      return {
        variantId:
          productId * 100 +
          COLORS.indexOf(color) * 10 +
          STORAGES.indexOf(storage),
        sku: `${productId}-${color.slug}-${storage.label}`,
        title: `${color.label} ${storage.label}`,
        price: basePrice + storage.surcharge,
        filterAttributes: selections,
        displayAttributes: selections,
        selections,
        status: paused ? 'PAUSED' : 'ACTIVE',
        availableQuantity: isPreorder ? null : stock,
      }
    }),
  )
  const gallery = COLORS.map(({ slug, label }) => ({
    bundleKey: label,
    items: [1, 2, 3, 4].map((n) => ({
      url: `/images/macbook_neo_${slug}${n}.png`,
      position: n,
      primary: n === 1,
    })),
  }))
  const sellable = variants.some((variant) => variant.status === 'ACTIVE')
  return {
    productId,
    categoryId,
    saleMode,
    title,
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
          opensAt: '2026-10-01T01:00:00.000Z',
          closesAt: '2026-12-31T14:59:59.000Z',
          status: 'OPEN',
        }
      : null,
    optionAxes,
    variants,
    images: { gallery, detail: [] },
  }
}

const brandId = (code: string, brand: string) =>
  categories
    .find((node) => node.code === code)
    ?.children.find((child) => child.name === brand)?.categoryId ?? 0

// 상위 카테고리별 [하위 상품군, 개수, 시작가, 판매 방식]. 브랜드는 하위 카테고리를 번갈아 쓴다.
const LINES: [
  code: string,
  line: string,
  count: number,
  price: number,
  mode?: SaleMode,
][] = [
  ['mobile', '스마트폰', 8, 1250000],
  ['mobile', '태블릿', 5, 890000],
  ['mobile', '폴더블', 3, 2190000, 'PREORDER'],
  ['pc', '노트북', 6, 1290000],
  ['pc', '모니터', 4, 450000],
  ['pc', '키보드', 4, 89000],
  ['wearable', '스마트워치', 5, 390000],
  ['wearable', '무선이어폰', 6, 259000],
]

// 1번은 사전예약 목업(entities/preorder)이 상세로 보내는 상품이라 손으로 둔다.
const seeds: Seed[] = [
  {
    title: '맥북 프로 14',
    categoryId: brandId('pc', 'Apple'),
    basePrice: 2390000,
    saleMode: 'PREORDER',
  },
  ...LINES.flatMap(([code, line, count, price, saleMode]) => {
    const brands = TREE.find(([treeCode]) => treeCode === code)?.[2] ?? []
    return Array.from({ length: count }, (_, i) => ({
      title: `NOVA ${line} ${i + 1}`,
      categoryId: brandId(code, brands[i % brands.length]),
      basePrice: price + i * 50000,
      saleMode,
    }))
  }),
  // 목록의 품절 · 판매 중지 표시를 확인하는 용도.
  {
    title: 'NOVA 스마트밴드 (품절)',
    categoryId: brandId('wearable', 'Samsung'),
    basePrice: 79000,
    stock: 0,
  },
  {
    title: 'NOVA 마우스 (판매 중지)',
    categoryId: brandId('pc', 'LG'),
    basePrice: 59000,
    paused: true,
  },
]

export const products: ProductDetailView[] = seeds.map((seed, i) =>
  buildProduct(i + 1, seed),
)
