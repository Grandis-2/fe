import { http } from 'msw'

import { categories, dispatchWindows, products } from '../fixtures/product'
import {
  bestProductCards,
  recommendedProductCards,
  searchProductCardGroups,
} from '../fixtures/productCards'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  Category,
  Paged,
  ProductCardListResponse,
  ProductCardSearchResponse,
  ProductDetail,
  ProductSort,
  ProductSummary,
  SaleStatus,
} from '../../types'
import type { RequestHandler } from 'msw'

const SORTS: ProductSort[] = [
  'RECOMMENDED',
  'OPEN_AT_ASC',
  'PRICE_ASC',
  'PRICE_DESC',
  'RATING_DESC',
  'REVIEW_COUNT_DESC',
  'NEWEST',
]

const SALE_STATUSES: SaleStatus[] = ['BEFORE_OPEN', 'OPEN', 'CLOSED']

function toSummary(product: ProductDetail): ProductSummary {
  const {
    productId,
    name,
    brand,
    thumbnailUrl,
    priceRange,
    openAt,
    saleStatus,
    stockPolicy,
    ratingSummary,
    badges,
  } = product
  return {
    productId,
    name,
    brand,
    thumbnailUrl,
    priceRange,
    openAt,
    saleStatus,
    stockPolicy,
    ratingSummary,
    badges,
  }
}

// categoryId 필터는 하위 카테고리를 포함하므로 서브트리를 펼쳐 둔다.
function collectCategoryIds(rootId: string): string[] {
  const found: string[] = []
  const walk = (nodes: Category[], inside: boolean) => {
    for (const node of nodes) {
      const hit = inside || node.categoryId === rootId
      if (hit) found.push(node.categoryId)
      walk(node.children, hit)
    }
  }
  walk(categories, false)
  return found
}

const byRating = (a: ProductSummary, b: ProductSummary) =>
  (b.ratingSummary.averageRating ?? -1) - (a.ratingSummary.averageRating ?? -1)

const comparators: Record<
  ProductSort,
  ((a: ProductSummary, b: ProductSummary) => number) | null
> = {
  RECOMMENDED: null,
  OPEN_AT_ASC: (a, b) => a.openAt.localeCompare(b.openAt),
  NEWEST: (a, b) => b.openAt.localeCompare(a.openAt),
  PRICE_ASC: (a, b) => a.priceRange.min - b.priceRange.min,
  PRICE_DESC: (a, b) => b.priceRange.max - a.priceRange.max,
  RATING_DESC: byRating,
  REVIEW_COUNT_DESC: (a, b) =>
    b.ratingSummary.reviewCount - a.ratingSummary.reviewCount,
}

const allProductCards = [
  ...bestProductCards,
  ...recommendedProductCards,
  ...searchProductCardGroups.flatMap((group) => group.cards),
]

// ponytail: 카드 목업(best-1, search-0-0 …)은 상세 목업이 따로 없어서, 카드에서 상세로
// 넘어가면 맥북 네오 상세를 틀로 쓰고 id·이름·saleMode만 카드 값으로 덮는다.
// 상세 목업을 상품마다 만들 때 제거.
function detailFromCard(productId: string): ProductDetail | undefined {
  const card = allProductCards.find((it) => it.productId === productId)
  const template = products.find((it) => it.productId === 'MB-NEO')
  if (!card || !template) return undefined
  const { name, saleMode } = card
  return { ...template, productId, name, saleMode }
}

export const productHandlers: RequestHandler[] = [
  http.get(url('/api/v1/categories'), () => ok({ items: categories })),

  // 메인페이지 카드 캐러셀 전용 — 페이지네이션/필터를 타지 않는 별도 curated 목록.
  // query가 없으면 undefined를 돌려주고, 아래 일반 목록 핸들러로 넘어간다
  // (MSW는 resolver가 undefined를 돌려주면 다음 매칭 핸들러를 이어서 시도한다).
  // ?mock=error를 붙이면 로딩/에러 화면을 눈으로 확인할 수 있다(예: /?mock=error).
  http.get(url('/api/v1/products'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const query = params.get('query')
    if (query !== 'best' && query !== 'recommend') return undefined
    if (params.get('mock') === 'error') {
      return fail(500, { code: 'MOCK_ERROR', message: '목업 에러 응답입니다.' })
    }
    const items = query === 'best' ? bestProductCards : recommendedProductCards
    return ok<ProductCardListResponse>({ items })
  }),

  // 카테고리 검색 화면(/search) 카드 목록. category·subCategory가 없으면 전체를 돌려준다.
  // /products/:productId보다 먼저 등록해야 'search'가 productId로 잡히지 않는다.
  http.get(url('/api/v1/products/search'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const category = params.get('category')
    const subCategory = params.get('subCategory')
    const brand = params.get('brand')
    const sort = params.get('sort')
    if (params.get('mock') === 'error') {
      return fail(500, { code: 'MOCK_ERROR', message: '목업 에러 응답입니다.' })
    }

    const items = searchProductCardGroups
      .filter(
        (group) =>
          (!category || group.category === category) &&
          (!subCategory || group.subCategory === subCategory),
      )
      .flatMap((group) => group.cards)
      .filter((card) => !brand || card.brand === brand)
    if (sort === 'PRICE_ASC') items.sort((a, b) => a.basePrice - b.basePrice)
    if (sort === 'PRICE_DESC') items.sort((a, b) => b.basePrice - a.basePrice)

    return ok<ProductCardSearchResponse>({ items, total: items.length })
  }),

  http.get(url('/api/v1/products'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const page = Number(params.get('page') ?? 0)
    const size = Number(params.get('size') ?? 20)
    const sort = (params.get('sort') ?? 'RECOMMENDED') as ProductSort
    const saleStatus = params.get('saleStatus')
    const minPrice = params.get('minPrice')
    const maxPrice = params.get('maxPrice')

    const violations = [
      !Number.isInteger(page) || page < 0
        ? { field: 'page', message: '0 이상이어야 합니다.' }
        : null,
      !Number.isInteger(size) || size < 1 || size > 100
        ? { field: 'size', message: '1 이상 100 이하여야 합니다.' }
        : null,
      !SORTS.includes(sort)
        ? { field: 'sort', message: '지원하지 않는 정렬입니다.' }
        : null,
      saleStatus && !SALE_STATUSES.includes(saleStatus as SaleStatus)
        ? { field: 'saleStatus', message: '지원하지 않는 판매 상태입니다.' }
        : null,
    ].filter((violation) => violation !== null)

    if (violations.length > 0) {
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: '입력값을 확인해 주세요.',
        violations,
      })
    }

    const categoryId = params.get('categoryId')
    const allowedCategories = categoryId ? collectCategoryIds(categoryId) : null
    const brand = params.get('brand')?.toLowerCase()
    const keyword = params.get('q')?.toLowerCase()
    const min = minPrice === null ? 0 : Number(minPrice)
    const max = maxPrice === null ? Number.MAX_SAFE_INTEGER : Number(maxPrice)

    const matched = products
      .filter((product) => {
        if (
          allowedCategories &&
          (product.categoryId === null ||
            !allowedCategories.includes(product.categoryId))
        ) {
          return false
        }
        if (brand && product.brand.toLowerCase() !== brand) return false
        if (saleStatus && product.saleStatus !== saleStatus) return false
        if (product.priceRange.max < min || product.priceRange.min > max) {
          return false
        }
        if (keyword) {
          const haystack = [product.name, product.brand, product.summary ?? '']
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(keyword)) return false
        }
        return true
      })
      .map(toSummary)

    const comparator = comparators[sort]
    if (comparator) matched.sort(comparator)

    const items = matched.slice(page * size, page * size + size)
    const totalPages = Math.ceil(matched.length / size)

    return ok<Paged<ProductSummary>>({
      items,
      page,
      size,
      total: matched.length,
      totalPages,
      hasNext: page + 1 < totalPages,
    })
  }),

  http.get(
    url('/api/v1/products/:productId/dispatch-windows/active'),
    ({ params }) => {
      const productId = String(params.productId)
      const version = dispatchWindows[productId]
      if (!version) {
        return fail(404, {
          code: 'PRODUCT_NOT_FOUND',
          message: '대상을 찾을 수 없습니다.',
        })
      }
      return ok(version)
    },
  ),

  http.get(
    url('/api/v1/products/:productId/variants/:optionCode'),
    ({ params }) => {
      const productId = String(params.productId)
      // /products/:productId와 조회 범위를 맞춘다 — 카드 전용 id도 같은 fallback으로 찾는다.
      const product =
        products.find((it) => it.productId === productId) ??
        detailFromCard(productId)
      const variant = product?.variants.find(
        (it) => it.optionCode === params.optionCode,
      )
      if (!variant) {
        return fail(404, {
          code: 'PRODUCT_OPTION_NOT_FOUND',
          message: '대상을 찾을 수 없습니다.',
        })
      }
      return ok(variant)
    },
  ),

  http.get(url('/api/v1/products/:productId'), ({ params }) => {
    const productId = String(params.productId)
    const product =
      products.find((it) => it.productId === productId) ??
      detailFromCard(productId)
    if (!product) {
      return fail(404, {
        code: 'PRODUCT_NOT_FOUND',
        message: '대상을 찾을 수 없습니다.',
      })
    }
    return ok(product)
  }),
]
