import { HttpResponse, http } from 'msw'

import { adminProductStore } from '../fixtures/admin-product'
import {
  imagesOf,
  MOCK_CDN_ORIGIN,
  MOCK_UPLOAD_ORIGIN,
  mockUploadedFiles,
  productImageStore,
  toBundle,
} from '../fixtures/admin-product-image'
import { shipmentBatchStore } from '../fixtures/admin-shipment'
import { adminStockStore } from '../fixtures/admin-stock'
import { fail, invalid, ok } from '../response'
import { url } from '../url'

import type {
  AdminProductDetail,
  AdminProductListItem,
  AdminProductResponse,
  ImageUpload,
  ImageUploadRequest,
  OptionValueAddRequest,
  OptionValueEditRequest,
  PageResponse,
  PreorderCampaignRequest,
  PreorderSaleStatus,
  ProductBrandCode,
  ProductImageAddRequest,
  ProductEditRequest,
  ProductRegistrationRequest,
  ProductRegistrationResponse,
  SaleStatusChangeRequest,
  SaleStatusView,
  Variant,
  VariantAddRequest,
  VariantEditRequest,
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

/*
 * 판매 중지(PAUSED)한 상품. 저장소(예전 모양)엔 판매 상태 필드가 없어 따로 들고,
 * 목록·상세가 여기서 읽는다.
 */
const pausedProducts = new Set<string>()
const saleStatusOf = (productId: string) =>
  pausedProducts.has(productId) ? ('PAUSED' as const) : ('ACTIVE' as const)

// 저장된 상세에서 목록 한 줄을 만든다. 서버처럼 판매·전시를 한 필드로 주지 않는다 —
// 사전예약 단계와 일반 상품 상태를 따로 싣고, 전시는 두 불리언으로 나눈다.
const toListItem = (detail: AdminProductDetail): AdminProductListItem => ({
  productId: detail.productId,
  saleMode: detail.saleMode,
  title: detail.name,
  imageUrl: detail.thumbnailUrl,
  // 판매 상태는 접수 단계와도, 숨김(공개 여부)과도 다른 축이다.
  status: saleStatusOf(detail.productId),
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

const STORAGE_PATTERN = /^\d+(MB|GB|TB)$/i

/*
 * 기본가와 값별 추가금. 저장소(예전 모양)는 조합 가격만 들고 있어서 처음엔 가격에서
 * 거꾸로 구하지만, 한 번 고치면 여기 적어 두고 가격을 거기서 다시 계산한다 — 서버도
 * 옵션 가격을 기본가 + 고른 값의 추가금으로 계산한다. 값을 새로 더하면 아직 조합이
 * 없어 가격에서 구할 수 없으므로 반드시 여기 적어 둔다.
 */
const basePrices = new Map<string, number>()
const surcharges = new Map<string, number>()
const surchargeKey = (
  productId: string,
  groupCode: string,
  valueCode: string,
) => `${productId}|${groupCode}|${valueCode}`

const baseOf = (detail: AdminProductDetail) =>
  basePrices.get(detail.productId) ?? detail.priceRange.min

function surchargeOf(
  detail: AdminProductDetail,
  groupCode: string,
  valueCode: string,
) {
  const stored = surcharges.get(
    surchargeKey(detail.productId, groupCode, valueCode),
  )
  if (stored !== undefined) return stored
  const prices = detail.variants
    .filter((variant) => variant.optionValues[groupCode] === valueCode)
    .map((variant) => variant.price)
  return prices.length > 0 ? Math.min(...prices) - baseOf(detail) : 0
}

/** 가격에서 거꾸로 구하던 값을 고정한다 — 고치기 전에 불러야 다른 값이 흔들리지 않는다 */
function pinPrices(detail: AdminProductDetail) {
  for (const group of detail.optionGroups) {
    for (const value of group.values) {
      const key = surchargeKey(
        detail.productId,
        group.groupCode,
        value.valueCode,
      )
      if (!surcharges.has(key)) {
        surcharges.set(
          key,
          surchargeOf(detail, group.groupCode, value.valueCode),
        )
      }
    }
  }
  if (!basePrices.has(detail.productId)) {
    basePrices.set(detail.productId, baseOf(detail))
  }
}

const valueNameOf = (
  detail: AdminProductDetail,
  groupCode: string,
  valueCode: string | undefined,
) =>
  detail.optionGroups
    .find((group) => group.groupCode === groupCode)
    ?.values.find((value) => value.valueCode === valueCode)?.name ?? ''

/** 옵션 가격 = 기본가 + 고른 값의 추가금. 이름도 값 이름으로 다시 잇는다 */
function recompute(detail: AdminProductDetail) {
  const base = baseOf(detail)
  for (const variant of detail.variants) {
    variant.price =
      base +
      Object.entries(variant.optionValues).reduce(
        (sum, [groupCode, valueCode]) =>
          sum + surchargeOf(detail, groupCode, valueCode),
        0,
      )
    variant.name = detail.optionGroups
      .map((group) =>
        valueNameOf(
          detail,
          group.groupCode,
          variant.optionValues[group.groupCode],
        ),
      )
      .filter(Boolean)
      .join(' ')
  }
  const prices = detail.variants.map((variant) => variant.price)
  if (prices.length > 0) {
    detail.priceRange = { min: Math.min(...prices), max: Math.max(...prices) }
  }
  detail.updatedAt = new Date().toISOString()
}

/** 저장소의 조합 하나를 명세의 옵션(variant) 모양으로 바꾼다 */
function toVariantView(
  detail: AdminProductDetail,
  variant: AdminProductDetail['variants'][number],
): Variant {
  return {
    // 저장소엔 variantId가 없어 옵션 코드를 쓴다 — 재고 목업도 같은 값으로 옵션을
    // 가리켜야 상세와 재고가 맞붙는다.
    variantId: variant.optionCode,
    sku: variant.optionCode,
    title: variant.name,
    price: variant.price,
    filterAttributes: {},
    selections: Object.fromEntries(
      Object.entries(variant.optionValues).map(([groupCode, valueCode]) => [
        groupCode,
        normalize(valueNameOf(detail, groupCode, valueCode)),
      ]),
    ),
    status: variant.available ? 'ACTIVE' : 'PAUSED',
    availableQuantity: null,
  }
}

/**
 * 저장소의 상세(예전 모양)를 관리자 상세 응답(명세 모양)으로 바꾼다. 저장소는 다른
 * 목업(재고·배송 차수·예약)이 같이 쓰고 있어 그대로 두고, 읽을 때만 바꿔 내보낸다.
 */
function toAdminProductResponse(
  detail: AdminProductDetail,
): AdminProductResponse {
  const preorder = detail.saleMode === 'PREORDER'

  return {
    product: {
      productId: detail.productId,
      saleMode: detail.saleMode,
      title: detail.name,
      imageUrl: detail.thumbnailUrl,
      status: saleStatusOf(detail.productId),
      sellable:
        !pausedProducts.has(detail.productId) &&
        detail.variants.some((variant) => variant.available),
      soldOut: false,
      modelNumber: detail.modelNumber,
      // 저장소는 화면 이름(Samsung)이나 코드(SAMSUNG)를 들고 있다 — 대문자가 곧 코드다.
      brand: detail.brand.toUpperCase() as ProductBrandCode,
      modelName: detail.modelNumber,
      categoryId: detail.categoryId ?? '',
      description: detail.summary,
      visible: detail.displayStatus === 'PUBLISHED',
      basePrice: baseOf(detail),
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
          surcharge: surchargeOf(detail, group.groupCode, value.valueCode),
        })),
      })),
      variants: detail.variants.map((variant) =>
        toVariantView(detail, variant),
      ),
      images: productImageStore.get(detail.productId) ?? {
        gallery: [],
        detail: [],
      },
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

/**
 * 사전예약은 회차 오픈 3분 전부터 공개 여부 말고는 고칠 수 없다(409). 목업은 시각을
 * 세지 않고 오픈 전/뒤로만 가른다.
 */
const lockedResponse = (detail: AdminProductDetail) =>
  detail.saleMode === 'PREORDER' && detail.saleStatus !== 'BEFORE_OPEN'
    ? fail(409, {
        code: 'STATE_CONFLICT',
        message:
          '사전예약은 오픈 3분 전부터 공개 여부 말고는 바꿀 수 없습니다.',
      })
    : null

// 본문이 비었거나 JSON이 아니면 null — 핸들러가 400으로 돌려보낸다.
const readBody = <T>(request: Request) =>
  request.json().catch(() => null) as Promise<Partial<T> | null>

const findProduct = (productId: string) =>
  adminProductStore.find((product) => product.productId === productId)

/*
 * 등록 키별 기록. 같은 키로 다시 오면 새로 만들지 않고 처음 상품을 돌려준다. 준비
 * (회차·재고 생성)는 실서버처럼 잠시 뒤 끝난다 — readyAt이 지나면 초안을 푼다.
 */
type RegistrationRecord = { productId: string; body: string; readyAt: number }
const registrations = new Map<string, RegistrationRecord>()
const READY_DELAY_MS = 2000

function settleRegistrations() {
  const now = Date.now()
  for (const record of registrations.values()) {
    const product = findProduct(record.productId)
    if (product?.displayStatus === 'DRAFT' && record.readyAt <= now) {
      // 등록 때 보낸 공개 여부를 따른다 — 사전예약은 공개, 일반 상품은 비공개로 온다.
      const { visible } = JSON.parse(record.body) as { visible?: boolean }
      product.displayStatus = visible ? 'PUBLISHED' : 'HIDDEN'
    }
  }
}

const registrationOf = (key: string, record: RegistrationRecord) => ({
  productId: record.productId,
  idempotencyKey: key,
  completed: findProduct(record.productId)?.displayStatus !== 'DRAFT',
})

/** 서버가 400을 줄 본문이면 그 위반을 돌려준다 — 프론트 검증을 빠져나간 값 확인용 */
function registrationViolations(body: Partial<ProductRegistrationRequest>) {
  const preorder = body.saleMode === 'PREORDER'
  const axes = body.optionAxes ?? []
  const batches = body.shipmentBatches ?? []
  return [
    !body.categoryId ? { field: 'categoryId', message: '필수입니다.' } : null,
    // 실서버와 같은 문구 — 문서엔 아직 없지만 필수다.
    !body.brand || !['APPLE', 'SAMSUNG', 'LG'].includes(body.brand)
      ? { field: 'brand', message: '형식이 맞지 않습니다.' }
      : null,
    !body.modelName?.trim()
      ? { field: 'modelName', message: 'must not be blank' }
      : null,
    body.saleMode !== 'PREORDER' && body.saleMode !== 'IN_STOCK'
      ? { field: 'saleMode', message: 'PREORDER 또는 IN_STOCK' }
      : null,
    !body.title?.trim() || body.title.length > 100
      ? { field: 'title', message: '1~100자여야 합니다.' }
      : null,
    axes.some(
      (axis) =>
        axis.key === 'storage' &&
        axis.values.some(
          (value) => !STORAGE_PATTERN.test(normalize(value.value)),
        ),
    )
      ? { field: 'optionAxes', message: '용량은 숫자와 MB·GB·TB만 됩니다.' }
      : null,
    preorder && !body.campaign
      ? { field: 'campaign', message: '사전예약은 필수입니다.' }
      : null,
    preorder &&
    body.campaign &&
    Date.parse(body.campaign.opensAt) < Date.now() + 30 * 60_000
      ? {
          field: 'campaign.opensAt',
          message: '지금부터 30분 뒤 이후여야 합니다.',
        }
      : null,
    preorder && (batches.length === 0 || batches.at(-1)?.positionTo !== null)
      ? {
          field: 'shipmentBatches',
          message: '마지막 차수는 positionTo가 null이어야 합니다.',
        }
      : null,
    !preorder && (body.campaign || body.shipmentBatches)
      ? { field: 'campaign', message: '일반 상품은 보낼 수 없습니다.' }
      : null,
    preorder && body.combinations?.some((combo) => combo.stock !== undefined)
      ? {
          field: 'combinations.stock',
          message: '사전예약은 재고를 받지 않습니다.',
        }
      : null,
    !preorder &&
    (body.combinations ?? []).some(
      (combo) => !combo.excluded && combo.stock === undefined,
    )
      ? {
          field: 'combinations.stock',
          message: '일반 상품은 재고가 필요합니다.',
        }
      : null,
  ].filter((violation) => violation !== null)
}

/** 등록 본문으로 저장소(예전 모양) 상품을 만든다. 조합은 축의 모든 곱이다 */
function createFromRegistration(
  body: ProductRegistrationRequest,
): AdminProductDetail {
  const productId = `PRD-${crypto.randomUUID().slice(0, 8)}`
  const now = new Date().toISOString()
  const preorder = body.saleMode === 'PREORDER'
  const axes = body.optionAxes ?? []

  const optionGroups = axes.map((axis, groupIndex) => ({
    groupCode: axis.key,
    name: axis.label,
    sortOrder: groupIndex,
    values: axis.values.map((value, index) => {
      const valueCode = `${axis.key}-${index + 1}`
      surcharges.set(
        surchargeKey(productId, axis.key, valueCode),
        value.surcharge ?? 0,
      )
      return {
        valueCode,
        name: value.value,
        colorHex: value.hex ? value.hex.toUpperCase() : null,
        imageUrl: null,
        sortOrder: index,
      }
    }),
  }))
  basePrices.set(productId, body.basePrice)

  const combos = optionGroups.reduce<Record<string, string>[]>(
    (acc, group) =>
      acc.flatMap((picked) =>
        group.values.map((value) => ({
          ...picked,
          [group.groupCode]: value.valueCode,
        })),
      ),
    [{}],
  )
  // 등록 때 뺀 조합(excluded)은 만들지 않는다 — 이름(정규화값)으로 맞춘다.
  const nameOf = (groupCode: string, valueCode: string) =>
    normalize(
      optionGroups
        .find((group) => group.groupCode === groupCode)
        ?.values.find((value) => value.valueCode === valueCode)?.name ?? '',
    )
  const excluded = (body.combinations ?? []).filter((combo) => combo.excluded)
  const kept = combos.filter(
    (optionValues) =>
      !excluded.some((combo) =>
        Object.entries(optionValues).every(
          ([groupCode, valueCode]) =>
            normalize(combo.selections[groupCode] ?? '') ===
            nameOf(groupCode, valueCode),
        ),
      ),
  )
  const variants = kept.map((optionValues, index) => ({
    optionCode: `V-${crypto.randomUUID().slice(0, 8)}`,
    name: '',
    optionValues,
    price: 0,
    listPrice: null,
    available: true,
    sortOrder: index,
    images: [],
  }))

  const openAt = body.campaign?.opensAt ?? now
  const created: AdminProductDetail = {
    ...adminProductStore[0],
    productId,
    name: body.title,
    modelNumber: body.modelName,
    brand: body.brand,
    categoryId: body.categoryId,
    summary: body.description ?? null,
    saleMode: body.saleMode,
    badges: preorder ? ['PREORDER'] : [],
    tags: body.tags ? body.tags.split(',') : [],
    optionGroups,
    variants,
    images: [],
    specs: [],
    openAt,
    sale: {
      ...adminProductStore[0].sale,
      openAt,
      closeAt: body.campaign?.closesAt ?? null,
    },
    saleStatus: preorder ? 'BEFORE_OPEN' : 'OPEN',
    // 준비가 끝날 때까지 초안이다.
    displayStatus: 'DRAFT',
    hiddenReason: null,
    createdAt: now,
    updatedAt: now,
    updatedBy: 'admin',
  }
  recompute(created)

  // 일반 상품은 조합마다 재고가 생긴다 — 재고 목업이 같은 옵션 코드로 찾는다.
  if (!preorder) {
    for (const variant of variants) {
      const names = Object.fromEntries(
        Object.entries(variant.optionValues).map(([groupCode, valueCode]) => [
          groupCode,
          normalize(valueNameOf(created, groupCode, valueCode)),
        ]),
      )
      const stock =
        body.combinations?.find((combo) =>
          Object.entries(names).every(
            ([key, name]) => normalize(combo.selections[key] ?? '') === name,
          ),
        )?.stock ?? 0
      adminStockStore.push({
        productId,
        optionCode: variant.optionCode,
        policy: 'LIMITED',
        initialQuantity: stock,
        availableQuantity: stock,
        reservedQuantity: 0,
        adjustmentsEnabled: true,
        updatedAt: now,
        updatedBy: 'admin',
      })
    }
  }
  return created
}

export const adminProductHandlers: RequestHandler[] = [
  http.get(url('/api/v1/admin/products'), ({ request }) => {
    settleRegistrations()
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
    const key = request.headers.get('Idempotency-Key')
    if (!key) {
      return invalid([{ field: 'Idempotency-Key', message: '필수입니다.' }])
    }
    const raw = await request.text()

    // 같은 키 재전송 — 새로 만들지 않는다. 본문이 다르면 다른 등록이라 거절한다.
    const previous = registrations.get(key)
    if (previous) {
      if (previous.body !== raw) {
        return fail(409, {
          code: 'IDEMPOTENCY_KEY_REUSED',
          message: '같은 등록 키로 다른 내용을 보냈습니다.',
        })
      }
      settleRegistrations()
      const registration = registrationOf(key, previous)
      return ok<ProductRegistrationResponse>(
        { registration, product: null },
        registration.completed ? 200 : 202,
      )
    }

    let body: Partial<ProductRegistrationRequest> | null = null
    try {
      body = JSON.parse(raw) as Partial<ProductRegistrationRequest>
    } catch {
      body = null
    }
    if (!body)
      return invalid([{ field: 'body', message: 'JSON이어야 합니다.' }])
    const violations = registrationViolations(body)
    if (violations.length > 0) return invalid(violations)

    const created = createFromRegistration(body as ProductRegistrationRequest)
    adminProductStore.unshift(created)
    // 갤러리는 색상 정규화값으로, 상세는 영역 이름으로 묶여 돌아온다(실서버와 같다).
    productImageStore.set(created.productId, {
      gallery: (body.images?.gallery ?? []).map((bundle) =>
        toBundle(
          normalize(bundle.color ?? ''),
          bundle.items.map((item) => item.url),
        ),
      ),
      detail: (body.images?.detail ?? []).map((bundle) =>
        toBundle(
          bundle.section,
          bundle.items.map((item) => item.url),
        ),
      ),
    })
    if (body.shipmentBatches) {
      shipmentBatchStore.set(created.productId, body.shipmentBatches)
    }
    const record = {
      productId: created.productId,
      body: raw,
      readyAt: Date.now() + READY_DELAY_MS,
    }
    registrations.set(key, record)

    return ok<ProductRegistrationResponse>(
      {
        registration: registrationOf(key, record),
        product: toAdminProductResponse(created).product,
      },
      201,
    )
  }),

  http.get(url('/api/v1/admin/products/registrations/:key'), ({ params }) => {
    const key = String(params.key)
    const record = registrations.get(key)
    if (!record) return notFound()
    settleRegistrations()
    return ok(registrationOf(key, record))
  }),

  http.get(url('/api/v1/admin/products/:productId'), ({ params }) => {
    settleRegistrations()
    const product = findProduct(String(params.productId))
    return product ? ok(toAdminProductResponse(product)) : notFound()
  }),

  http.patch(
    url('/api/v1/admin/products/:productId'),
    async ({ request, params }) => {
      const product = findProduct(String(params.productId))
      if (!product) return notFound()

      const body = await readBody<ProductEditRequest>(request)
      const allowed = [
        'title',
        'description',
        'tags',
        'basePrice',
        'warranty',
        'brand',
        'modelName',
      ]
      // 서버는 모르는 필드를 400으로 막는다 — 예전 본문을 보내면 여기서 걸린다.
      const unknown = Object.keys(body ?? {}).find(
        (key) => !allowed.includes(key),
      )
      if (unknown) {
        return invalid([{ field: unknown, message: '알 수 없는 칸입니다.' }])
      }
      if (!body || Object.keys(body).length === 0) {
        return invalid([{ field: 'body', message: '바꿀 항목이 없습니다.' }])
      }
      const locked = lockedResponse(product)
      if (locked) return locked

      if (body.title !== undefined) {
        if (!body.title.trim() || body.title.length > 100) {
          return invalid([{ field: 'title', message: '1~100자여야 합니다.' }])
        }
        product.name = body.title
      }
      if (body.brand !== undefined) {
        if (!['APPLE', 'SAMSUNG', 'LG'].includes(body.brand)) {
          return invalid([{ field: 'brand', message: '형식이 맞지 않습니다.' }])
        }
        product.brand = body.brand
      }
      if (body.modelName !== undefined) {
        if (!body.modelName.trim() || body.modelName.length > 40) {
          return invalid([
            { field: 'modelName', message: 'size must be between 1 and 40' },
          ])
        }
        product.modelNumber = body.modelName
      }
      if (body.tags !== undefined) {
        // 빈 문자열이면 비운다.
        product.tags = body.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      }
      if (body.description !== undefined) {
        product.summary = body.description || null
      }
      if (body.basePrice !== undefined) {
        pinPrices(product)
        basePrices.set(product.productId, body.basePrice)
      }
      recompute(product)
      return ok(toAdminProductResponse(product))
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

  http.patch(
    url('/api/v1/admin/products/:productId/option-values/:valueId'),
    async ({ request, params }) => {
      const product = findProduct(String(params.productId))
      if (!product) return notFound()
      const valueId = String(params.valueId)
      const group = product.optionGroups.find((candidate) =>
        candidate.values.some((value) => value.valueCode === valueId),
      )
      const target = group?.values.find((value) => value.valueCode === valueId)
      if (!group || !target) return notFound()

      const body = await readBody<OptionValueEditRequest>(request)
      if (
        !body ||
        (body.value === undefined &&
          body.surcharge === undefined &&
          body.hex === undefined)
      ) {
        return invalid([{ field: 'body', message: '바꿀 항목이 없습니다.' }])
      }
      const locked = lockedResponse(product)
      if (locked) return locked

      if (body.value !== undefined) {
        const name = body.value.trim()
        if (!name || name.length > 60) {
          return invalid([{ field: 'value', message: '1~60자여야 합니다.' }])
        }
        const duplicate = group.values.some(
          (value) =>
            value.valueCode !== valueId &&
            normalize(value.name) === normalize(name),
        )
        if (duplicate) {
          return invalid([
            { field: 'value', message: '같은 값이 이미 있습니다.' },
          ])
        }
        target.name = name
      }
      if (body.hex !== undefined) {
        target.colorHex = body.hex ? body.hex.toUpperCase() : null
      }
      if (body.surcharge !== undefined) {
        pinPrices(product)
        surcharges.set(
          surchargeKey(product.productId, group.groupCode, valueId),
          body.surcharge,
        )
      }
      recompute(product)
      return ok(toAdminProductResponse(product))
    },
  ),

  http.post(
    url('/api/v1/admin/products/:productId/option-values'),
    async ({ request, params }) => {
      const product = findProduct(String(params.productId))
      if (!product) return notFound()

      const body = await readBody<OptionValueAddRequest>(request)
      // 새 축은 만들 수 없다 — 등록 때 정한 축이어야 한다(대소문자 무시).
      const group = product.optionGroups.find(
        (candidate) =>
          candidate.groupCode.toLowerCase() === body?.axisKey?.toLowerCase(),
      )
      if (!body || !group) {
        return invalid([
          { field: 'axisKey', message: '상품에 있는 축이어야 합니다.' },
        ])
      }
      const locked = lockedResponse(product)
      if (locked) return locked

      const name = body.value?.trim() ?? ''
      if (!name || name.length > 60) {
        return invalid([{ field: 'value', message: '1~60자여야 합니다.' }])
      }
      if (
        group.values.some((value) => normalize(value.name) === normalize(name))
      ) {
        return invalid([
          { field: 'value', message: '같은 값이 이미 있습니다.' },
        ])
      }
      if (
        group.groupCode === 'storage' &&
        !STORAGE_PATTERN.test(normalize(name))
      ) {
        return invalid([
          { field: 'value', message: '숫자와 MB·GB·TB만 됩니다(예: 256GB).' },
        ])
      }

      pinPrices(product)
      const valueCode = `${group.groupCode}-${crypto.randomUUID().slice(0, 8)}`
      group.values.push({
        valueCode,
        name,
        colorHex: body.hex ? body.hex.toUpperCase() : null,
        imageUrl: null,
        sortOrder: group.values.length,
      })
      surcharges.set(
        surchargeKey(product.productId, group.groupCode, valueCode),
        body.surcharge ?? 0,
      )
      // 값만 생기고 옵션(조합)은 생기지 않는다 — POST variants로 하나씩 만든다.
      return ok(toAdminProductResponse(product), 201)
    },
  ),

  http.post(
    url('/api/v1/admin/products/:productId/variants'),
    async ({ request, params }) => {
      const product = findProduct(String(params.productId))
      if (!product) return notFound()

      const body = await readBody<VariantAddRequest>(request)
      const selections = body?.selections ?? {}
      const locked = lockedResponse(product)
      if (locked) return locked

      // 모든 축의 값이 있어야 하고, 축에 있는 값이어야 한다.
      const optionValues: Record<string, string> = {}
      for (const group of product.optionGroups) {
        const picked = selections[group.groupCode]
        const value = group.values.find(
          (candidate) =>
            picked !== undefined &&
            normalize(candidate.name) === normalize(picked),
        )
        if (!value) {
          return invalid([
            {
              field: `selections.${group.groupCode}`,
              message: '축에 있는 값이어야 합니다.',
            },
          ])
        }
        optionValues[group.groupCode] = value.valueCode
      }
      const exists = product.variants.some((variant) =>
        product.optionGroups.every(
          (group) =>
            variant.optionValues[group.groupCode] ===
            optionValues[group.groupCode],
        ),
      )
      if (exists) {
        return invalid([
          { field: 'selections', message: '이미 있는 조합입니다.' },
        ])
      }

      pinPrices(product)
      const variant = {
        optionCode: `V-${crypto.randomUUID().slice(0, 8)}`,
        name: '',
        optionValues,
        price: 0,
        listPrice: null,
        // 새 옵션은 바로 판매 중이다.
        available: true,
        sortOrder: product.variants.length,
        images: [],
      }
      product.variants.push(variant)
      recompute(product)
      return ok(toVariantView(product, variant), 201)
    },
  ),

  http.patch(
    url('/api/v1/admin/products/:productId/variants/:variantId'),
    async ({ request, params }) => {
      const product = findProduct(String(params.productId))
      const variant = product?.variants.find(
        (candidate) => candidate.optionCode === String(params.variantId),
      )
      if (!product || !variant) return notFound()

      const body = await readBody<VariantEditRequest>(request)
      if (body?.status !== 'ACTIVE' && body?.status !== 'PAUSED') {
        return invalid([{ field: 'status', message: 'ACTIVE 또는 PAUSED' }])
      }
      const locked = lockedResponse(product)
      if (locked) return locked

      variant.available = body.status === 'ACTIVE'
      product.updatedAt = new Date().toISOString()
      return ok(toVariantView(product, variant))
    },
  ),

  // 판매 상태. 사전예약 오픈 뒤 중지는 회차 취소다(사유 필수, 되돌릴 수 없음).
  // 목업은 시각을 세지 않고 오픈 전/뒤로만 가른다(오픈 3분 전 잠금은 없다).
  http.patch(
    url('/api/v1/admin/products/:productId/sale-status'),
    async ({ request, params }) => {
      const product = findProduct(String(params.productId))
      if (!product) return notFound()

      const body = await readBody<SaleStatusChangeRequest>(request)
      if (body?.status !== 'ACTIVE' && body?.status !== 'PAUSED') {
        return invalid([{ field: 'status', message: 'ACTIVE 또는 PAUSED' }])
      }
      const reason = body.reason?.trim() ?? ''
      const opened =
        product.saleMode === 'PREORDER' && product.saleStatus !== 'BEFORE_OPEN'
      const view = (cancelled: boolean, status = 202) =>
        ok<SaleStatusView>(
          {
            productId: product.productId,
            status: saleStatusOf(product.productId),
            campaignCancellationRequested: cancelled,
          },
          cancelled ? status : 200,
        )

      if (!opened) {
        if (reason) {
          return invalid([
            { field: 'reason', message: '오픈 뒤 중지에만 보냅니다.' },
          ])
        }
        if (body.status === 'PAUSED') pausedProducts.add(product.productId)
        else pausedProducts.delete(product.productId)
        return view(false)
      }

      if (body.status === 'ACTIVE') {
        return fail(409, {
          code: 'STATE_CONFLICT',
          message: '오픈 뒤에는 다시 판매할 수 없습니다.',
        })
      }
      if (!reason || reason.length > 500) {
        return invalid([{ field: 'reason', message: '1~500자여야 합니다.' }])
      }
      pausedProducts.add(product.productId)
      return view(true)
    },
  ),

  // 일정은 preorder 서비스 경로다. 목업은 상품 저장소의 판매 시각을 같이 쓴다.
  http.put(
    url('/api/v1/admin/preorders/products/:productId/campaign'),
    async ({ request, params }) => {
      const product = findProduct(String(params.productId))
      if (!product || product.saleMode !== 'PREORDER') return notFound()
      if (product.saleStatus !== 'BEFORE_OPEN') {
        return fail(409, {
          code: 'PRODUCT_ALREADY_OPEN',
          message: '이미 오픈한 회차는 바꿀 수 없습니다.',
        })
      }

      const body = await readBody<PreorderCampaignRequest>(request)
      if (!body?.opensAt || !body.closesAt) {
        return invalid([
          { field: 'body', message: '오픈·마감 시각이 필요합니다.' },
        ])
      }
      const opensAt = Date.parse(body.opensAt)
      if (Date.parse(body.closesAt) <= opensAt) {
        return invalid([
          { field: 'closesAt', message: '오픈보다 뒤여야 합니다.' },
        ])
      }
      // 지금과 같은 일정을 다시 보내면 10분 규칙 없이 통과한다.
      const minute = (iso: string) => Math.floor(Date.parse(iso) / 60_000)
      const same =
        minute(body.opensAt) === minute(product.sale.openAt) &&
        minute(body.closesAt) === minute(product.sale.closeAt ?? '')
      if (!same && opensAt < Date.now() + 10 * 60_000) {
        return invalid([
          { field: 'opensAt', message: '지금부터 10분 뒤 이후여야 합니다.' },
        ])
      }

      product.sale.openAt = body.opensAt
      product.sale.closeAt = body.closesAt
      product.openAt = body.opensAt
      product.updatedAt = new Date().toISOString()
      return ok({
        productId: product.productId,
        opensAt: body.opensAt,
        closesAt: body.closesAt,
        saleStatus: product.saleStatus,
        issuedCount: 0,
        openNotifiedAt: null,
      })
    },
  ),

  // 사진 업로드 주소 발급 — 실서버와 같은 형식·크기 규칙으로 400을 준다.
  http.post(
    url('/api/v1/admin/products/image-uploads'),
    async ({ request }) => {
      const body = await readBody<ImageUploadRequest>(request)
      const contentType = body?.contentType ?? ''
      const contentLength = body?.contentLength ?? 0
      const types = ['image/jpeg', 'image/png', 'image/webp']
      if (!types.includes(contentType)) {
        return invalid([
          {
            field: 'contentType',
            message: 'image/jpeg, image/png, image/webp만 됩니다.',
          },
        ])
      }
      if (
        !Number.isInteger(contentLength) ||
        contentLength < 1 ||
        contentLength > 10 * 1024 * 1024
      ) {
        return invalid([
          {
            field: 'contentLength',
            message: '1 ~ 10,485,760 바이트여야 합니다.',
          },
        ])
      }
      const ext = contentType.split('/')[1].replace('jpeg', 'jpg')
      const key = `products/${crypto.randomUUID()}.${ext}`
      return ok<ImageUpload>(
        {
          uploadUrl: `${MOCK_UPLOAD_ORIGIN}/${key}?X-Amz-Signature=mock`,
          headers: { 'Content-Type': contentType },
          imageUrl: `${MOCK_CDN_ORIGIN}/${key}`,
          expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        },
        201,
      )
    },
  ),

  // 가짜 S3 — 올린 파일을 메모리에 둔다. 응답은 봉투가 아니라 상태 코드뿐이다(실서버와 같다).
  http.put(
    `${MOCK_UPLOAD_ORIGIN}/products/:file`,
    async ({ request, params }) => {
      mockUploadedFiles.set(
        `products/${String(params.file)}`,
        await request.blob(),
      )
      return new HttpResponse(null, { status: 200 })
    },
  ),

  // 가짜 CDN — 올린 파일을 그대로 돌려준다. 새로고침하면 메모리가 비어 404다.
  http.get(`${MOCK_CDN_ORIGIN}/products/:file`, ({ params }) => {
    const file = mockUploadedFiles.get(`products/${String(params.file)}`)
    return file
      ? new HttpResponse(file, { headers: { 'Content-Type': file.type } })
      : new HttpResponse(null, { status: 404 })
  }),

  // 등록 뒤 사진 한 장 넣기 — 묶음 맨 뒤에 붙고, 없는 묶음이면 새로 만든다.
  http.post(
    url('/api/v1/admin/products/:productId/images'),
    async ({ request, params }) => {
      const product = findProduct(String(params.productId))
      if (!product) return notFound()
      const body = await readBody<ProductImageAddRequest>(request)
      if (!body?.url || (body.kind !== 'GALLERY' && body.kind !== 'DETAIL')) {
        return invalid([{ field: 'url', message: '필수입니다.' }])
      }
      const images = imagesOf(product.productId)
      const all = [...images.gallery, ...images.detail].flatMap((bundle) =>
        bundle.items.map((item) => item.url),
      )
      if (all.includes(body.url)) {
        return invalid([{ field: 'url', message: '이미 있는 사진입니다.' }])
      }
      const bundles = body.kind === 'GALLERY' ? images.gallery : images.detail
      const key =
        body.kind === 'GALLERY'
          ? normalize(body.bundle ?? '')
          : (body.bundle ?? '')
      const bundle = bundles.find((item) => item.bundleKey === key)
      const urls = [...(bundle?.items.map((item) => item.url) ?? []), body.url]
      if (body.kind === 'GALLERY' && urls.length > 10) {
        return invalid([{ field: 'url', message: '묶음마다 10장까지입니다.' }])
      }
      const next = toBundle(key, urls)
      if (bundle) bundles.splice(bundles.indexOf(bundle), 1, next)
      else bundles.push(next)
      return ok(toAdminProductResponse(product), 201)
    },
  ),

  // 사진 한 장 빼기 — 빈 묶음은 함께 없어진다.
  http.delete(
    url('/api/v1/admin/products/:productId/images'),
    ({ request, params }) => {
      const product = findProduct(String(params.productId))
      if (!product) return notFound()
      const target = new URL(request.url).searchParams.get('url')
      const images = imagesOf(product.productId)
      const strip = (bundles: typeof images.gallery) =>
        bundles
          .map((bundle) =>
            toBundle(
              bundle.bundleKey,
              bundle.items
                .map((item) => item.url)
                .filter((itemUrl) => itemUrl !== target),
            ),
          )
          .filter((bundle) => bundle.items.length > 0)
      const count = (bundles: typeof images.gallery) =>
        bundles.reduce((sum, bundle) => sum + bundle.items.length, 0)
      const had = count(images.gallery) + count(images.detail)
      images.gallery = strip(images.gallery)
      images.detail = strip(images.detail)
      if (!target || count(images.gallery) + count(images.detail) === had) {
        return invalid([
          { field: 'url', message: '이 상품에 없는 사진입니다.' },
        ])
      }
      return ok(toAdminProductResponse(product))
    },
  ),
]
