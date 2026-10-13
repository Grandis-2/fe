import { http } from 'msw'

import { adminProductStore } from '../fixtures/admin-product'
import { fail, ok } from '../response'
import { url } from '../url'

import type {
  AdminProductDetail,
  AdminProductListItem,
  AdminProductResponse,
  AdminProductUpsertRequest,
  PageResponse,
  PreorderSaleStatus,
  VisibilityChangeRequest,
  VisibilityView,
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
  // 판매 상태는 접수 단계와도, 숨김(공개 여부)과도 다른 축이다. 목업엔 판매 중지를
  // 거는 경로가 없어 늘 판매 중이다 — '판매 중지' 뱃지는 스토리로 확인한다.
  status: 'ACTIVE',
  visible: detail.displayStatus === 'PUBLISHED',
  registrationCompleted: detail.displayStatus !== 'DRAFT',
  optionCount: detail.variants.length,
  minPrice: detail.priceRange.min,
  sellable: detail.saleStatus === 'OPEN',
  soldOut: false,
  // 저장된 상세의 saleStatus는 값이 접수 단계와 같다(BEFORE_OPEN·OPEN·CLOSED).
  preorderStatus:
    detail.saleMode === 'PREORDER'
      ? (detail.saleStatus as PreorderSaleStatus)
      : null,
  opensAt: detail.saleMode === 'PREORDER' ? detail.openAt : null,
  closesAt: detail.saleMode === 'PREORDER' ? detail.sale.closeAt : null,
})

// 명세의 정규화값은 공백만 뗀다(256 GB → 256GB). 대소문자는 그대로 둔다.
const normalize = (value: string) => value.replace(/\s+/g, '')

/**
 * 저장소의 상세(예전 모양)를 관리자 상세 응답(명세 모양)으로 바꾼다. 저장소는 등록·
 * 수정이 아직 예전 본문을 쓰기 때문에 그대로 두고, 읽을 때만 바꿔 내보낸다.
 */
function toAdminProductResponse(
  detail: AdminProductDetail,
): AdminProductResponse {
  const basePrice = detail.priceRange.min
  const preorder = detail.saleMode === 'PREORDER'

  // 저장소는 값마다 추가금을 들고 있지 않다 — 그 값을 고른 조합 중 가장 싼 가격에서
  // 기본가를 빼면 등록 때 더한 추가금이 나온다.
  const surchargeOf = (groupCode: string, valueCode: string) => {
    const prices = detail.variants
      .filter((variant) => variant.optionValues[groupCode] === valueCode)
      .map((variant) => variant.price)
    return prices.length > 0 ? Math.min(...prices) - basePrice : 0
  }
  const valueName = (groupCode: string, valueCode: string) =>
    detail.optionGroups
      .find((group) => group.groupCode === groupCode)
      ?.values.find((value) => value.valueCode === valueCode)?.name ?? ''

  return {
    product: {
      productId: detail.productId,
      saleMode: detail.saleMode,
      title: detail.name,
      imageUrl: detail.thumbnailUrl,
      status: 'ACTIVE',
      sellable: detail.variants.some((variant) => variant.available),
      soldOut: false,
      modelNumber: detail.modelNumber,
      categoryId: detail.categoryId ?? '',
      description: detail.summary,
      visible: detail.displayStatus === 'PUBLISHED',
      basePrice,
      warranty: { offered: false, surcharge: 0 },
      campaign: preorder
        ? {
            opensAt: detail.sale.openAt,
            closesAt: detail.sale.closeAt ?? detail.sale.openAt,
            // 저장소의 saleStatus는 값이 접수 단계와 같다.
            status: detail.saleStatus as PreorderSaleStatus,
          }
        : null,
      optionAxes: detail.optionGroups.map((group) => ({
        key: group.groupCode,
        label: group.name,
        values: group.values.map((value) => ({
          valueId: value.valueCode,
          value: value.name,
          normalizedValue: normalize(value.name),
          hex: value.colorHex,
          surcharge: surchargeOf(group.groupCode, value.valueCode),
        })),
      })),
      variants: detail.variants.map((variant) => ({
        // 저장소엔 variantId가 없어 옵션 코드를 쓴다 — 재고 목업도 같은 값으로
        // 옵션을 가리켜야 상세와 재고가 맞붙는다.
        variantId: variant.optionCode,
        sku: variant.optionCode,
        title: variant.name,
        price: variant.price,
        filterAttributes: {},
        selections: Object.fromEntries(
          Object.entries(variant.optionValues).map(([groupCode, valueCode]) => [
            groupCode,
            normalize(valueName(groupCode, valueCode)),
          ]),
        ),
        status: variant.available ? 'ACTIVE' : 'PAUSED',
        availableQuantity: null,
      })),
      images: { gallery: [], detail: [] },
    },
    tags: detail.tags?.length ? detail.tags.join(',') : null,
    registration: {
      productId: detail.productId,
      idempotencyKey: null,
      // 목업엔 비동기 준비가 없다 — 초안만 준비 전으로 본다.
      completed: detail.displayStatus !== 'DRAFT',
    },
  }
}

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
    return product ? ok(toAdminProductResponse(product)) : notFound()
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

  http.patch(
    url('/api/v1/admin/products/:productId/visibility'),
    async ({ request, params }) => {
      const product = findProduct(String(params.productId))
      if (!product) return notFound()

      const body = (await request
        .json()
        .catch(() => null)) as Partial<VisibilityChangeRequest> | null
      // 서버는 boolean만 받는다 — "true"나 1은 400이다.
      if (typeof body?.visible !== 'boolean') {
        return fail(400, {
          code: 'VALIDATION_FAILED',
          message: '요청 값이 올바르지 않습니다.',
          violations: [{ field: 'visible', message: 'boolean이어야 합니다.' }],
        })
      }

      // 목업은 공개 여부와 준비 상태를 한 필드(displayStatus)로 들고 있어서, 공개로
      // 바꾸면 준비가 끝난 것으로 본다. 실제 서버는 준비가 끝나야 보인다.
      product.displayStatus = body.visible ? 'PUBLISHED' : 'HIDDEN'
      product.updatedAt = new Date().toISOString()
      return ok<VisibilityView>({
        productId: product.productId,
        visible: body.visible,
      })
    },
  ),
]
