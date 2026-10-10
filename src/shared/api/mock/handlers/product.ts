import { http } from 'msw'

import { categories, products, shipmentBatches } from '../fixtures/product'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { isUuid, readPaging, toPage, uuidViolation } from '../validate'

import type {
  ApiViolation,
  CategoryTreeResponse,
  PageResponse,
  ProductDetailView,
  ProductListItem,
  ShipmentBatchListResponse,
} from '../../types'
import type { RequestHandler } from 'msw'

const SORTS = ['NEWEST', 'PRICE_ASC', 'PRICE_DESC']

// 명세의 ProductListItem 규칙대로 상세에서 목록 한 칸을 만든다 — 최저가는 판매 중 옵션만 본다(품절 포함).
export function toListItem(product: ProductDetailView): ProductListItem {
  const { campaign, variants } = product
  const prices = variants
    .filter((variant) => variant.status === 'ACTIVE')
    .map((variant) => variant.price)
  return {
    productId: product.productId,
    saleMode: product.saleMode,
    title: product.title,
    imageUrl: product.imageUrl,
    status: product.status,
    minPrice: prices.length > 0 ? Math.min(...prices) : null,
    sellable: product.sellable,
    soldOut: product.soldOut,
    preorderStatus: campaign?.status ?? null,
    opensAt: campaign?.opensAt ?? null,
    closesAt: campaign?.closesAt ?? null,
    // 백엔드에 추가될 카드용 칸. 목업은 색상 축 값과 그 색의 갤러리 묶음으로 만든다.
    modelNumber: product.modelNumber,
    colors:
      product.optionAxes
        .find(({ key }) => key === 'color')
        ?.values.map(({ value, normalizedValue, hex }) => ({
          label: value,
          hex: hex ?? '',
          imageUrls:
            product.images.gallery
              .find(({ bundleKey }) => bundleKey === normalizedValue)
              ?.items.map(({ url }) => url) ?? [],
        })) ?? [],
  }
}

// 상위 카테고리로 찾으면 그 아래 하위에 배정된 상품도 함께 나온다.
export function categoryScope(categoryId: string): string[] {
  const parent = categories.find((node) => node.categoryId === categoryId)
  return parent
    ? [categoryId, ...parent.children.map((child) => child.categoryId)]
    : [categoryId]
}

// 공백·대소문자를 무시하고 비교한다(`256 gb`와 `256GB`는 같다).
const normalize = (value: string) => value.replace(/\s+/g, '').toLowerCase()

// 같은 축 안은 OR, 축끼리는 AND — 조건을 모두 만족하는 판매 중 옵션이 하나는 있어야 한다.
const matchesAxes = (
  product: ProductDetailView,
  filters: [key: string, values: string[]][],
) =>
  product.variants.some(
    (variant) =>
      variant.status === 'ACTIVE' &&
      filters.every(
        ([key, values]) =>
          values.length === 0 ||
          values.includes(variant.filterAttributes[key] ?? ''),
      ),
  )

// 가격순은 minPrice 기준이고 null은 정렬 방향과 상관없이 맨 뒤다.
const byPrice =
  (direction: 1 | -1) => (a: ProductListItem, b: ProductListItem) =>
    a.minPrice === null
      ? 1
      : b.minPrice === null
        ? -1
        : (a.minPrice - b.minPrice) * direction

// 없는 상품·비공개·준비 전이 모두 같은 404다.
export const notFound = () =>
  fail(404, { code: 'NOT_FOUND', message: '대상을 찾을 수 없습니다.' })

// 경로의 id 형식부터 본다 — 틀리면 404가 아니라 400이다.
// url()의 origin 와일드카드도 params에 숫자 키('0')로 잡히므로 검사할 이름을 직접 받는다.
export const idViolations = (
  params: Record<string, unknown>,
  ...names: string[]
) =>
  names
    .filter((name) => !isUuid(String(params[name])))
    .map((name) => uuidViolation(name))

export const findProduct = (productId: string) =>
  products.find((product) => product.productId === productId)

export const productHandlers: RequestHandler[] = [
  http.get(url('/api/v1/categories'), () =>
    ok<CategoryTreeResponse>({ items: categories }),
  ),

  http.get(url('/api/v1/products'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const { page, size, violations } = readPaging(params)
    const categoryId = params.get('categoryId')
    const sort = params.get('sort') ?? 'NEWEST'
    const extra: ApiViolation[] = [
      ...(categoryId && !isUuid(categoryId)
        ? [uuidViolation('categoryId')]
        : []),
      ...(SORTS.includes(sort)
        ? []
        : [{ field: 'sort', message: '형식이 맞지 않습니다.' }]),
    ]
    if (violations.length + extra.length > 0)
      return invalid([...violations, ...extra])

    const keyword = params.get('q')?.trim().toLowerCase()
    const scope = categoryId ? categoryScope(categoryId) : null
    const saleMode = params.get('saleMode')
    const axes: [string, string[]][] = ['color', 'storage'].map((key) => [
      key,
      params.getAll(key).map(normalize),
    ])

    // 목록엔 판매 상태 ACTIVE만 나온다(판매 중지 상품은 상세 직접 링크로만 열린다).
    // 픽스처는 뒤쪽이 최근 등록이라 NEWEST는 뒤집어서 시작한다.
    const matched = products
      .filter(
        (product) =>
          product.status === 'ACTIVE' &&
          (!keyword || product.title.toLowerCase().includes(keyword)) &&
          (!scope || scope.includes(product.categoryId)) &&
          (!saleMode || product.saleMode === saleMode) &&
          (axes.every(([, values]) => values.length === 0) ||
            matchesAxes(product, axes)),
      )
      .reverse()
      .map(toListItem)
    if (sort === 'PRICE_ASC') matched.sort(byPrice(1))
    if (sort === 'PRICE_DESC') matched.sort(byPrice(-1))

    return ok<PageResponse<ProductListItem>>(toPage(matched, page, size))
  }),

  http.get(
    url('/api/v1/products/:productId/variants/:variantId'),
    ({ params }) => {
      const violations = idViolations(params, 'productId', 'variantId')
      if (violations.length > 0) return invalid(violations)
      const variant = findProduct(String(params.productId))?.variants.find(
        (it) => it.variantId === params.variantId,
      )
      return variant ? ok(variant) : notFound()
    },
  ),

  // preorder 서비스의 공개 API. 차수가 없으면(사전예약 상품이 아니거나 준비 전) 404다.
  http.get(
    url('/api/v1/preorders/products/:productId/shipment-batches'),
    ({ params }) => {
      const violations = idViolations(params, 'productId')
      if (violations.length > 0) return invalid(violations)
      const product = findProduct(String(params.productId))
      if (product?.saleMode !== 'PREORDER') {
        return fail(404, {
          code: 'PRODUCT_NOT_FOUND',
          message: '상품을 찾을 수 없습니다.',
        })
      }
      return ok<ShipmentBatchListResponse>({ items: shipmentBatches })
    },
  ),

  http.get(url('/api/v1/products/:productId'), ({ params }) => {
    const violations = idViolations(params, 'productId')
    if (violations.length > 0) return invalid(violations)
    const product = findProduct(String(params.productId))
    return product ? ok(product) : notFound()
  }),
]
