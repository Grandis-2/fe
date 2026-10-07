import { http } from 'msw'

import { categories, COLORS, products } from '../fixtures/product'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  CategoryTreeResponse,
  ProductDetailView,
  ProductListItem,
  ProductPage,
} from '../../types'
import type { RequestHandler } from 'msw'

// 백엔드 ProductListItem과 같은 규칙으로 상세에서 목록 한 칸을 만든다 — 최저가는 판매 중 옵션만 본다.
function toListItem(product: ProductDetailView): ProductListItem {
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
    // 백엔드에 추가 요청한 카드용 칸(모델명·색상칩). 목업은 색상 묶음 사진에서 만든다.
    modelNumber: `NV-${product.productId}`,
    colors: product.images.gallery.map(({ bundleKey, items }) => ({
      hex: COLORS.find(({ label }) => label === bundleKey)?.hex ?? '#888888',
      label: bundleKey,
      imageUrls: items.map(({ url }) => url),
    })),
  }
}

// 상위 카테고리로 찾으면 그 아래 하위에 배정된 상품도 함께 나온다.
function categoryScope(categoryId: number): number[] {
  const parent = categories.find((node) => node.categoryId === categoryId)
  return parent
    ? [categoryId, ...parent.children.map((child) => child.categoryId)]
    : [categoryId]
}

// 축 값 필터(color·storage) — 그 값을 고를 수 있는 옵션이 하나라도 있으면 통과.
const hasAxisValue = (
  product: ProductDetailView,
  key: string,
  values: string[],
) =>
  values.length === 0 ||
  product.variants.some((variant) => values.includes(variant.selections[key]))

// 공개 API의 404는 공통 NOT_FOUND다 — 비공개와 없는 상품을 구분하지 못하게 같은 응답이다.
const notFound = () =>
  fail(404, { code: 'NOT_FOUND', message: '대상을 찾을 수 없습니다.' })

const findProduct = (productId: string) =>
  products.find((product) => String(product.productId) === productId)

export const productHandlers: RequestHandler[] = [
  http.get(url('/api/v1/categories'), () =>
    ok<CategoryTreeResponse>({ items: categories }),
  ),

  http.get(url('/api/v1/products'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const page = Number(params.get('page') ?? 0)
    const size = Number(params.get('size') ?? 20)

    const violations = [
      !Number.isInteger(page) || page < 0
        ? { field: 'page', message: '0 이상이어야 합니다.' }
        : null,
      !Number.isInteger(size) || size < 1 || size > 100
        ? { field: 'size', message: '1~100 이어야 합니다.' }
        : null,
    ].filter((violation) => violation !== null)
    if (violations.length > 0) {
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: '입력값을 확인해 주세요.',
        violations,
      })
    }

    const keyword = params.get('q')?.trim().toLowerCase()
    const categoryId = params.get('categoryId')
    const scope = categoryId ? categoryScope(Number(categoryId)) : null
    const saleMode = params.get('saleMode')

    // 정렬은 productId 내림차순 고정이다.
    const matched = products
      .filter(
        (product) =>
          (!keyword || product.title.toLowerCase().includes(keyword)) &&
          (!scope ||
            (product.categoryId !== null &&
              scope.includes(product.categoryId))) &&
          (!saleMode || product.saleMode === saleMode) &&
          hasAxisValue(product, 'color', params.getAll('color')) &&
          hasAxisValue(product, 'storage', params.getAll('storage')),
      )
      .sort((a, b) => b.productId - a.productId)
      .map(toListItem)

    return ok<ProductPage<ProductListItem>>({
      page,
      size,
      total: matched.length,
      hasNext: (page + 1) * size < matched.length,
      items: matched.slice(page * size, (page + 1) * size),
    })
  }),

  http.get(
    url('/api/v1/products/:productId/variants/:variantId'),
    ({ params }) => {
      const variant = findProduct(String(params.productId))?.variants.find(
        (it) => String(it.variantId) === params.variantId,
      )
      return variant ? ok(variant) : notFound()
    },
  ),

  http.get(url('/api/v1/products/:productId'), ({ params }) => {
    const product = findProduct(String(params.productId))
    return product ? ok(product) : notFound()
  }),
]
