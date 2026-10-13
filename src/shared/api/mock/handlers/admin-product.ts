import { http } from 'msw'

import { adminProductStore } from '../fixtures/admin-product'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  AdminProductDetail,
  AdminProductHideRequest,
  AdminProductListItem,
  AdminProductUpsertRequest,
  PageResponse,
  PreorderStage,
} from '../../types'
import type { RequestHandler } from 'msw'

const notFound = () =>
  fail(404, {
    code: 'PRODUCT_NOT_FOUND',
    message: '대상을 찾을 수 없습니다.',
    retryable: false,
  })

// 저장된 상세에서 목록 한 줄을 만든다. 서버처럼 판매·전시를 한 필드로 주지 않는다 —
// 사전예약 단계와 일반 상품 상태를 따로 싣고, 전시는 두 불리언으로 나눈다.
const toListItem = (detail: AdminProductDetail): AdminProductListItem => ({
  productId: detail.productId,
  saleMode: detail.saleMode,
  title: detail.name,
  imageUrl: detail.thumbnailUrl,
  // 판매 상태는 접수 단계와 다른 축이다 — 접수가 마감돼도 판매 상태는 ACTIVE다.
  // 숨긴 상품만 판매 중지로 둬서 '판매 중지' 뱃지를 화면에서 볼 수 있게 한다.
  status: detail.displayStatus === 'HIDDEN' ? 'PAUSED' : 'ACTIVE',
  visible: detail.displayStatus === 'PUBLISHED',
  registrationCompleted: detail.displayStatus !== 'DRAFT',
  optionCount: detail.variants.length,
  minPrice: detail.priceRange.min,
  sellable: detail.saleStatus === 'OPEN',
  soldOut: false,
  // 저장된 상세의 saleStatus는 값이 접수 단계와 같다(BEFORE_OPEN·OPEN·CLOSED).
  preorderStatus:
    detail.saleMode === 'PREORDER'
      ? (detail.saleStatus as PreorderStage)
      : null,
  opensAt: detail.saleMode === 'PREORDER' ? detail.openAt : null,
  closesAt: detail.saleMode === 'PREORDER' ? detail.sale.closeAt : null,
})

const findProduct = (productId: string) =>
  adminProductStore.find((product) => product.productId === productId)

/** 등록/수정 본문을 저장 형태로 반영한다 */
function applyUpsert(
  target: AdminProductDetail,
  body: AdminProductUpsertRequest,
): AdminProductDetail {
  const variants = body.variants ?? target.variants
  const prices = variants.map((variant) => variant.price)
  const openAt = body.openAt ?? target.openAt
  const closeAt =
    body.closeAt === undefined ? target.sale.closeAt : body.closeAt

  return {
    ...target,
    name: body.name ?? target.name,
    brand: body.brand ?? target.brand,
    categoryId:
      body.categoryId === undefined ? target.categoryId : body.categoryId,
    summary: body.summary === undefined ? target.summary : body.summary,
    descriptionHtml:
      body.descriptionHtml === undefined
        ? target.descriptionHtml
        : body.descriptionHtml,
    images: body.images ?? target.images,
    specs: body.specs ?? target.specs,
    optionGroups: body.optionGroups ?? target.optionGroups,
    variants,
    badges: body.badges ?? target.badges,
    tags: body.tags ?? target.tags,
    openAt,
    priceRange:
      prices.length > 0
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : target.priceRange,
    sale: { ...target.sale, openAt, closeAt },
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
  }
}

export const adminProductHandlers: RequestHandler[] = [
  http.get(url('/api/v1/admin/products'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const page = Number(params.get('page') ?? 0)
    const size = Number(params.get('size') ?? 20)
    const saleMode = params.get('saleMode')
    const status = params.get('status')
    const keyword = params.get('q') ?? ''

    const violations = [
      !Number.isInteger(page) || page < 0
        ? { field: 'page', message: '0 이상이어야 합니다.' }
        : null,
      !Number.isInteger(size) || size < 1 || size > 100
        ? { field: 'size', message: '1 이상 100 이하여야 합니다.' }
        : null,
      keyword.length > 100
        ? { field: 'q', message: '100자 이하여야 합니다.' }
        : null,
      saleMode && !['PREORDER', 'IN_STOCK'].includes(saleMode)
        ? { field: 'saleMode', message: '지원하지 않는 판매 방식입니다.' }
        : null,
      status && !['ACTIVE', 'PAUSED'].includes(status)
        ? { field: 'status', message: '지원하지 않는 판매 상태입니다.' }
        : null,
    ].filter((violation) => violation !== null)

    if (violations.length > 0) {
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: '입력값을 확인해 주세요.',
        retryable: false,
        violations,
      })
    }

    const filtered = adminProductStore
      .map(toListItem)
      .filter((product) => !saleMode || product.saleMode === saleMode)
      .filter((product) => !status || product.status === status)
      // 태그는 검색용이라 이름과 같이 본다 — 구매자 목록에는 안 나오고 검색어로만 걸린다.
      .filter((product) => {
        const trimmed = keyword.trim()
        if (!trimmed) return true
        const tags = findProduct(product.productId)?.tags ?? []
        return (
          product.title.includes(trimmed) ||
          tags.some((tag) => tag.includes(trimmed))
        )
      })

    const start = page * size

    // 관리자 목록 봉투엔 totalPages가 없다(PageResponse).
    return ok<PageResponse<AdminProductListItem>>({
      items: filtered.slice(start, start + size),
      page,
      size,
      total: filtered.length,
      hasNext: start + size < filtered.length,
    })
  }),

  http.post(url('/api/v1/admin/products'), async ({ request }) => {
    const body = (await request.json()) as AdminProductUpsertRequest

    if (!body.name?.trim()) {
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: '입력값을 확인해 주세요.',
        retryable: false,
        violations: [{ field: 'name', message: '필수 항목입니다.' }],
      })
    }

    // 등록은 항상 초안(DRAFT)으로 시작한다.
    const created = applyUpsert(
      {
        ...adminProductStore[0],
        productId: body.productId ?? `PRD-${crypto.randomUUID().slice(0, 8)}`,
        displayStatus: 'DRAFT',
        saleStatus: 'BEFORE_OPEN',
        hiddenReason: null,
        variants: [],
        optionGroups: [],
        images: [],
        specs: [],
        createdAt: new Date().toISOString(),
      },
      body,
    )
    adminProductStore.unshift(created)

    return ok(created, 201)
  }),

  http.get(url('/api/v1/admin/products/:productId'), ({ params }) => {
    const product = findProduct(String(params.productId))
    return product ? ok(product) : notFound()
  }),

  http.patch(
    url('/api/v1/admin/products/:productId'),
    async ({ request, params }) => {
      const index = adminProductStore.findIndex(
        (product) => product.productId === String(params.productId),
      )
      if (index === -1) return notFound()

      // 오픈 이후에는 전시 내용을 바꾸지 않는다.
      if (adminProductStore[index].saleStatus === 'OPEN') {
        return fail(409, {
          code: 'PRODUCT_ALREADY_OPEN',
          message: '오픈 이후에는 변경할 수 없습니다.',
          retryable: false,
        })
      }

      const body = (await request.json()) as AdminProductUpsertRequest
      adminProductStore[index] = applyUpsert(adminProductStore[index], body)
      return ok(adminProductStore[index])
    },
  ),

  http.post(url('/api/v1/admin/products/:productId/publish'), ({ params }) => {
    const product = findProduct(String(params.productId))
    if (!product) return notFound()

    product.displayStatus = 'PUBLISHED'
    product.hiddenReason = null
    product.updatedAt = new Date().toISOString()
    return ok(product)
  }),

  http.post(
    url('/api/v1/admin/products/:productId/hide'),
    async ({ request, params }) => {
      const product = findProduct(String(params.productId))
      if (!product) return notFound()

      const body = (await request.json()) as AdminProductHideRequest
      const reason = body.reason ?? ''
      if (reason.length < 5 || reason.length > 500) {
        return fail(400, {
          code: 'VALIDATION_FAILED',
          message: '입력값을 확인해 주세요.',
          retryable: false,
          violations: [
            { field: 'reason', message: '5자 이상 500자 이하여야 합니다.' },
          ],
        })
      }

      product.displayStatus = 'HIDDEN'
      product.hiddenReason = reason
      product.updatedAt = new Date().toISOString()
      return ok(product)
    },
  ),
]
