import { http } from 'msw'

import { adminProductStore } from '../fixtures/admin-product'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  AdminProductDetail,
  AdminProductHideRequest,
  AdminProductSummary,
  AdminProductUpsertRequest,
  DisplayStatus,
  Paged,
  SaleStatus,
} from '../../types'
import type { RequestHandler } from 'msw'

const DISPLAY_STATUSES: DisplayStatus[] = ['DRAFT', 'PUBLISHED', 'HIDDEN']
const SALE_STATUSES: SaleStatus[] = ['BEFORE_OPEN', 'OPEN', 'CLOSED']

const notFound = () =>
  fail(404, {
    code: 'PRODUCT_NOT_FOUND',
    message: '대상을 찾을 수 없습니다.',
    retryable: false,
  })

const toSummary = (detail: AdminProductDetail): AdminProductSummary => ({
  productId: detail.productId,
  name: detail.name,
  brand: detail.brand,
  thumbnailUrl: detail.thumbnailUrl,
  priceRange: detail.priceRange,
  openAt: detail.openAt,
  saleStatus: detail.saleStatus,
  stockPolicy: detail.stockPolicy,
  ratingSummary: detail.ratingSummary,
  badges: detail.badges,
  displayStatus: detail.displayStatus,
  variantCount: detail.variants.length,
  activeDispatchWindowVersion: detail.activeDispatchWindowVersion,
  firstAcceptSeqIssuedAt: detail.firstAcceptSeqIssuedAt,
  updatedAt: detail.updatedAt,
  updatedBy: detail.updatedBy,
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
    const displayStatus = params.get('displayStatus')
    const saleStatus = params.get('saleStatus')
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
      displayStatus &&
      !DISPLAY_STATUSES.includes(displayStatus as DisplayStatus)
        ? { field: 'displayStatus', message: '지원하지 않는 전시 상태입니다.' }
        : null,
      saleStatus && !SALE_STATUSES.includes(saleStatus as SaleStatus)
        ? { field: 'saleStatus', message: '지원하지 않는 판매 상태입니다.' }
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
      .filter(
        (product) => !displayStatus || product.displayStatus === displayStatus,
      )
      .filter((product) => !saleStatus || product.saleStatus === saleStatus)
      .filter((product) => product.name.includes(keyword.trim()))

    const start = page * size
    const items = filtered.slice(start, start + size).map(toSummary)
    const totalPages = Math.ceil(filtered.length / size)

    return ok<Paged<AdminProductSummary>>({
      items,
      page,
      size,
      total: filtered.length,
      totalPages,
      hasNext: page + 1 < totalPages,
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
