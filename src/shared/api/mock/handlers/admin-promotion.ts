import { http } from 'msw'

import { adminProductStore } from '../fixtures/admin-product'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { readPaging, toPage } from '../validate'

import type {
  AdminProductDetail,
  AdminPromotionStatus,
  AdminPromotionUpsertRequest,
  AdminPromotionView,
  ApiViolation,
  PromotionLinkableProductView,
} from '../../types'
import type { RequestHandler } from 'msw'

/*
 * 사전예약 홍보 목업(catalog 명세). 메모리에만 있어 새로고침하면 사라진다. 상품은 관리자
 * 상품 목업에서 찾는다.
 */
type StoredPromotion = Omit<AdminPromotionView, 'status' | 'products'> & {
  productIds: string[]
}
const promotions: StoredPromotion[] = []
// 같은 Idempotency-Key로 다시 오면 처음 만든 홍보를 준다.
const createdByKey = new Map<string, string>()

// 한국 날짜 기준
const today = () =>
  new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10)

const statusOf = ({
  startDate,
  endDate,
}: StoredPromotion): AdminPromotionStatus =>
  today() < startDate ? 'SCHEDULED' : today() > endDate ? 'ENDED' : 'ONGOING'

const findProduct = (productId: string) =>
  adminProductStore.find((product) => product.productId === productId)

const toView = ({ productIds, ...promotion }: StoredPromotion) => ({
  ...promotion,
  status: statusOf({ productIds, ...promotion }),
  // 지운 상품은 빠진다.
  products: productIds.flatMap((productId) => {
    const product = findProduct(productId)
    return product
      ? [{ productId, title: product.name, saleMode: product.saleMode }]
      : []
  }),
})

const valuesOf = (product: AdminProductDetail, groupCode: string) =>
  product.optionGroups
    .find((group) => group.groupCode === groupCode)
    ?.values.map((value) => value.name) ?? []

const toLinkable = (
  product: AdminProductDetail,
): PromotionLinkableProductView => ({
  productId: product.productId,
  title: product.name,
  saleMode: product.saleMode,
  opensAt: product.saleMode === 'PREORDER' ? product.openAt : null,
  colors: valuesOf(product, 'color'),
  storages: valuesOf(product, 'storage'),
})

const boundElsewhere = (productId: string, promotionId?: string) =>
  promotions.some(
    (promotion) =>
      promotion.promotionId !== promotionId &&
      promotion.productIds.includes(productId),
  )

const DATE = /^\d{4}-\d{2}-\d{2}$/
const FIELDS = new Set([
  'name',
  'startDate',
  'endDate',
  'thumbnailUrl',
  'detailImageUrls',
  'productIds',
])

async function readUpsert(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as Partial<AdminPromotionUpsertRequest> | null
  if (!body)
    return { violations: [{ field: 'body', message: '본문이 필요합니다.' }] }

  const name = body.name?.trim() ?? ''
  const productIds = body.productIds ?? []
  const check = (failed: boolean, field: string, message: string) =>
    failed ? { field, message } : null
  const violations = [
    ...Object.keys(body)
      .filter((key) => !FIELDS.has(key))
      .map((field) => ({ field, message: '모르는 필드입니다.' })),
    check(!name || name.length > 100, 'name', '1~100자여야 합니다.'),
    check(!DATE.test(body.startDate ?? ''), 'startDate', '날짜가 필요합니다.'),
    check(!DATE.test(body.endDate ?? ''), 'endDate', '날짜가 필요합니다.'),
    check(
      (body.endDate ?? '') < (body.startDate ?? ''),
      'endDate',
      '시작일 이후여야 합니다.',
    ),
    check(!body.thumbnailUrl, 'thumbnailUrl', '필수입니다.'),
    check(
      [body.thumbnailUrl ?? '', ...(body.detailImageUrls ?? [])].some((image) =>
        image.startsWith('blob:'),
      ),
      'detailImageUrls',
      '올린 사진 주소만 받습니다.',
    ),
    check(
      productIds.length < 1 || productIds.length > 20,
      'productIds',
      '1~20개여야 합니다.',
    ),
    check(
      new Set(productIds).size !== productIds.length,
      'productIds',
      '같은 상품을 두 번 넣을 수 없습니다.',
    ),
    check(
      productIds.some((productId) => !findProduct(productId)),
      'productIds',
      '없는 상품입니다.',
    ),
  ].filter((violation): violation is ApiViolation => violation !== null)

  if (violations.length > 0) return { violations }
  return {
    value: {
      name,
      startDate: body.startDate ?? '',
      endDate: body.endDate ?? '',
      thumbnailUrl: body.thumbnailUrl ?? '',
      detailImageUrls: body.detailImageUrls ?? [],
      productIds,
    },
  }
}

const notFound = () =>
  fail(404, {
    code: 'PROMOTION_NOT_FOUND',
    message: '사전예약을 찾을 수 없습니다.',
  })

const conflict = () =>
  fail(409, {
    code: 'PROMOTION_PRODUCT_CONFLICT',
    message: '다른 사전예약에 연결된 상품이 있습니다.',
  })

export const adminPromotionHandlers: RequestHandler[] = [
  http.get(url('/api/v1/admin/promotions'), ({ request }) => {
    const { page, size, violations } = readPaging(
      new URL(request.url).searchParams,
    )
    if (violations.length > 0) return invalid(violations)
    return ok(toPage(promotions.map(toView), page, size))
  }),

  // 상세(/:promotionId)보다 먼저 잡혀야 한다.
  http.get(url('/api/v1/admin/promotions/linkable-products'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const { page, size, violations } = readPaging(params)
    if (violations.length > 0) return invalid(violations)
    const promotionId = params.get('promotionId') ?? undefined
    const mine =
      promotions.find((promotion) => promotion.promotionId === promotionId)
        ?.productIds ?? []

    const linkable = adminProductStore
      .filter(
        (product) =>
          mine.includes(product.productId) ||
          (product.saleMode === 'PREORDER' &&
            !boundElsewhere(product.productId, promotionId)),
      )
      .map(toLinkable)
    return ok(toPage(linkable, page, size))
  }),

  http.get(url('/api/v1/admin/promotions/:promotionId'), ({ params }) => {
    const found = promotions.find(
      (promotion) => promotion.promotionId === params.promotionId,
    )
    return found ? ok(toView(found)) : notFound()
  }),

  http.post(url('/api/v1/admin/promotions'), async ({ request }) => {
    const key = request.headers.get('Idempotency-Key')
    if (!key) {
      return invalid([{ field: 'Idempotency-Key', message: '필수입니다.' }])
    }
    const previous = promotions.find(
      (promotion) => promotion.promotionId === createdByKey.get(key),
    )
    if (previous) return ok(toView(previous))

    const { value, violations } = await readUpsert(request)
    if (!value) return invalid(violations)
    if (value.productIds.some((productId) => boundElsewhere(productId))) {
      return conflict()
    }

    const now = new Date().toISOString()
    const created = {
      promotionId: crypto.randomUUID(),
      ...value,
      createdAt: now,
      updatedAt: now,
    }
    promotions.unshift(created)
    createdByKey.set(key, created.promotionId)
    return ok(toView(created), 201)
  }),

  http.put(
    url('/api/v1/admin/promotions/:promotionId'),
    async ({ request, params }) => {
      const index = promotions.findIndex(
        (promotion) => promotion.promotionId === params.promotionId,
      )
      if (index < 0) return notFound()
      const { value, violations } = await readUpsert(request)
      if (!value) return invalid(violations)
      const promotionId = promotions[index].promotionId
      if (
        value.productIds.some((productId) =>
          boundElsewhere(productId, promotionId),
        )
      ) {
        return conflict()
      }

      promotions[index] = {
        ...promotions[index],
        ...value,
        updatedAt: new Date().toISOString(),
      }
      return ok(toView(promotions[index]))
    },
  ),
]
