import { http, HttpResponse } from 'msw'

import { batchFor, orders, preorders, saveOrderDb } from '../fixtures/preorder'
import { products } from '../fixtures/product'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { isUuid, uuidViolation } from '../validate'

import type {
  ActivePreorder,
  CursorPage,
  OrderStatus,
  PreorderCancelResult,
  PreorderCounts,
  PreorderCountsResponse,
  PreorderDetail,
  PreorderDisplayStatus,
  PreorderEvent,
  PreorderEventListResponse,
  PreorderPage,
  PreorderStatus,
  PreorderSummary,
  OpenAlert,
  OpenAlertListResponse,
} from '../../types'
import type { PreorderRecord } from '../fixtures/preorder'
import type { RequestHandler } from 'msw'

const SECOND = 1000
const HOUR = 60 * 60 * SECOND
// 목업은 접수 5초 뒤 외부 등록이 끝나 결제 가능(REGISTERED)이 되고, 취소는 3초 뒤 끝난다.
const REGISTER_AFTER_MS = 5 * SECOND
const CANCEL_AFTER_MS = 3 * SECOND
const PAYMENT_WINDOW_MS = 24 * HOUR
// 결제한 예약을 취소하면 환불을 마쳐야 취소가 끝난다. .env.local에 VITE_MOCK_REFUND_FAIL=true를 넣으면
// 환불이 실패해 예약·주문이 취소 중에 머물고 주문 상세의 refundFailed가 true가 된다.
const REFUND_FAILS = import.meta.env.VITE_MOCK_REFUND_FAIL === 'true'
// 결제했고 아직 출고 전인 주문 — 예약을 취소하면 환불한다.
const REFUNDABLE: OrderStatus[] = [
  'AWAITING_CONFIRMATION',
  'PREPARING_ITEMS',
  'READY_TO_SHIP',
]
const STATUSES: PreorderStatus[] = [
  'PENDING_SYNC',
  'REGISTERED',
  'RESERVED',
  'CANCELING',
  'CANCELED',
]
const CANCELABLE: PreorderStatus[] = ['PENDING_SYNC', 'REGISTERED', 'RESERVED']
// 명세의 화면 단계 순서 — counts도 이 순서로 담는다.
const DISPLAY_STATUSES: PreorderDisplayStatus[] = [
  'RECEIVED',
  'PROCESSING',
  'PAYABLE',
  'PAYMENT_IN_PROGRESS',
  'PAYMENT_EXPIRED',
  'RESERVED',
  'CANCELING',
  'CANCELED',
]

const msSince = (iso: string) => Date.now() - new Date(iso).getTime()

// 상태를 바꾸고 이력을 남긴다. version은 상태가 바뀔 때마다 오른다.
export function transition(
  record: PreorderRecord,
  toStatus: PreorderStatus,
  actor: PreorderEvent['actor'],
  reason: string | null = null,
  at = new Date().toISOString(),
) {
  record.events.push({
    eventSequence: record.events.length + 1,
    fromStatus: record.status,
    toStatus,
    actor,
    reason,
    createdAt: at,
  })
  record.status = toStatus
  record.version += 1
  saveOrderDb()
}

// 서버가 비동기로 처리하는 일(외부 등록, 취소 완료)을 읽을 때 흉내 낸다.
export function advance(record: PreorderRecord) {
  if (
    record.status === 'PENDING_SYNC' &&
    msSince(record.createdAt) >= REGISTER_AFTER_MS
  ) {
    const at = new Date(
      new Date(record.createdAt).getTime() + REGISTER_AFTER_MS,
    ).toISOString()
    record.payableFrom = at
    record.externalReference = `EXT-${record.queuePosition}`
    transition(record, 'REGISTERED', 'SYSTEM', null, at)
  }
  // 결제 기한이 지나면 서버가 주기 작업(1분 간격)으로 만료 취소를 시작한다 — 목은 읽는 순간 바로 시작한다.
  if (record.status === 'REGISTERED' && isPaymentExpired(record))
    transition(record, 'CANCELING', 'SYSTEM')
  const lastEvent = record.events[record.events.length - 1]
  if (
    record.status === 'CANCELING' &&
    msSince(lastEvent.createdAt) >= CANCEL_AFTER_MS
  ) {
    const order = orders.find((it) => it.preorderId === record.preorderId)
    // 환불 중(취소 중)인 주문의 환불이 실패하면 예약도 취소 중에 머문다.
    if (order?.status === 'CANCELING' && REFUND_FAILS) {
      if (!order.refundFailed) {
        order.refundFailed = true
        saveOrderDb()
      }
      return record
    }
    transition(record, 'CANCELED', 'SYSTEM')
    // 예약이 취소되면 미결제 주문은 취소되고, 환불 중이던 주문은 환불을 마쳐 취소된다.
    if (order?.status === 'AWAITING_PAYMENT' || order?.status === 'CANCELING') {
      order.status = 'CANCELED'
      saveOrderDb()
    }
  }
  return record
}

const paymentDueAt = (record: PreorderRecord) =>
  record.payableFrom
    ? new Date(
        new Date(record.payableFrom).getTime() + PAYMENT_WINDOW_MS,
      ).toISOString()
    : null

export const isPaymentExpired = (record: PreorderRecord) => {
  const due = paymentDueAt(record)
  return due !== null && Date.now() > new Date(due).getTime()
}

function displayStatusOf(record: PreorderRecord): PreorderDisplayStatus {
  switch (record.status) {
    case 'PENDING_SYNC':
      return msSince(record.createdAt) < 2 * SECOND ? 'RECEIVED' : 'PROCESSING'
    case 'REGISTERED': {
      const order = orders.find((it) => it.preorderId === record.preorderId)
      if (
        order?.status === 'AWAITING_PAYMENT' ||
        order?.status === 'AUTHORIZING'
      )
        return 'PAYMENT_IN_PROGRESS'
      return isPaymentExpired(record) ? 'PAYMENT_EXPIRED' : 'PAYABLE'
    }
    default:
      return record.status
  }
}

// 내 예약 전부의 화면 단계별 수 — 8개 단계가 다 들어 있고 없는 단계는 0.
const countByDisplayStatus = () => {
  const summaries = preorders.map(toSummary)
  return Object.fromEntries(
    DISPLAY_STATUSES.map((it) => [
      it,
      summaries.filter(({ displayStatus }) => displayStatus === it).length,
    ]),
  ) as PreorderCounts
}

export function toSummary(record: PreorderRecord): PreorderSummary {
  advance(record)
  return {
    preorderId: record.preorderId,
    productId: record.productId,
    productTitle: record.productTitle,
    optionId: record.optionId,
    optionTitle: record.optionTitle,
    unitPrice: record.unitPrice,
    imageUrl:
      products.find(({ productId }) => productId === record.productId)
        ?.imageUrl ?? null,
    status: record.status,
    displayStatus: displayStatusOf(record),
    queuePosition: record.queuePosition,
    shipmentBatch: batchFor(record.queuePosition),
    createdAt: record.createdAt,
    payableFrom: record.payableFrom,
    // REGISTERED일 때만 값이 있다.
    paymentDueAt: record.status === 'REGISTERED' ? paymentDueAt(record) : null,
    reservedAt: record.reservedAt,
    version: record.version,
  }
}

const toDetail = (record: PreorderRecord): PreorderDetail => ({
  ...toSummary(record),
  externalReference: record.externalReference,
  cancelable: CANCELABLE.includes(record.status),
})

const hasToken = (request: Request) =>
  request.headers.get('Authorization')?.startsWith('Bearer ') === true

const unauthenticated = () =>
  fail(401, { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' })

// 남의 예약·없는 예약·형식이 틀린 id는 모두 404다.
const preorderNotFound = () =>
  fail(404, { code: 'PREORDER_NOT_FOUND', message: '예약을 찾을 수 없습니다.' })

const findPreorder = (preorderId: unknown) =>
  preorders.find((it) => it.preorderId === preorderId)

// 오픈 알림 신청한 모델 id. 처음엔 오픈 전 상품 하나를 신청해 둔다.
// ponytail: 메모리 목록이라 새로고침하면 처음으로 돌아간다.
const openAlertIds = new Set(
  products
    .filter((it) => it.campaign?.status === 'BEFORE_OPEN')
    .slice(0, 1)
    .map((it) => it.productId),
)

const productNotFound = () =>
  fail(404, { code: 'PRODUCT_NOT_FOUND', message: '상품을 찾을 수 없습니다.' })

const invalidProductId = (productId: string) =>
  isUuid(productId) ? null : invalid([uuidViolation('productId')])

export const preorderHandlers: RequestHandler[] = [
  // 오픈 전·공개 상품만, 오픈이 이른 순. 판매 중지 상품은 끌 수 있게 남는다.
  // 예약 상세(/preorders/:preorderId)보다 먼저 잡혀야 한다.
  http.get(url('/api/v1/preorders/open-alerts'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    const items = products
      .flatMap(({ productId, title, campaign }) =>
        openAlertIds.has(productId) && campaign?.status === 'BEFORE_OPEN'
          ? [
              {
                productId,
                title,
                opensAt: campaign.opensAt,
                closesAt: campaign.closesAt,
              },
            ]
          : [],
      )
      .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
    return ok<OpenAlertListResponse>({ items })
  }),

  // 회차가 없는 상품이어도 subscribed: false로 온다.
  http.get(
    url('/api/v1/preorders/products/:productId/open-alert'),
    ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      const productId = String(params.productId)
      return (
        invalidProductId(productId) ??
        ok<OpenAlert>({ productId, subscribed: openAlertIds.has(productId) })
      )
    },
  ),

  // 여러 번 불러도 한 건. 회차가 없으면 404, 이미 오픈했거나 판매 중지면 409.
  http.put(
    url('/api/v1/preorders/products/:productId/open-alert'),
    ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      const productId = String(params.productId)
      const invalidId = invalidProductId(productId)
      if (invalidId) return invalidId
      const product = products.find((it) => it.productId === productId)
      if (!product?.campaign) return productNotFound()
      if (product.status === 'PAUSED') {
        return fail(409, {
          code: 'PRODUCT_PAUSED',
          message: '판매가 중지된 상품입니다.',
        })
      }
      if (product.campaign.status !== 'BEFORE_OPEN') {
        return fail(409, {
          code: 'PRODUCT_ALREADY_OPEN',
          message: '이미 오픈한 사전예약은 알림을 신청할 수 없습니다.',
        })
      }
      openAlertIds.add(productId)
      return ok<OpenAlert>({ productId, subscribed: true })
    },
  ),

  // 신청이 없거나 없는 상품이어도 204.
  http.delete(
    url('/api/v1/preorders/products/:productId/open-alert'),
    ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      const productId = String(params.productId)
      const invalidId = invalidProductId(productId)
      if (invalidId) return invalidId
      openAlertIds.delete(productId)
      return new HttpResponse(null, { status: 204 })
    },
  ),

  // 배지용 화면 단계별 수 — 목록 응답의 counts와 같다. :preorderId보다 먼저 둔다.
  http.get(url('/api/v1/preorders/counts'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    return ok<PreorderCountsResponse>({ counts: countByDisplayStatus() })
  }),

  // 진행 중인 내 예약 — 상품마다 한 건, 취소 완료는 빠진다. 목업은 한 페이지로 다 준다. :preorderId보다 먼저 둔다.
  http.get(url('/api/v1/preorders/active'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    return ok<CursorPage<ActivePreorder>>({
      items: preorders
        .map(toSummary)
        .filter(({ displayStatus }) => displayStatus !== 'CANCELED')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ productId, preorderId, displayStatus, paymentDueAt }) => ({
          productId,
          preorderId,
          displayStatus,
          paymentDueAt,
        })),
      nextCursor: null,
    })
  }),

  // 내 예약 — 최신순, 취소된 예약 포함. 커서 페이지. displayStatus는 여러 개면 그중 하나(조회 시각 기준)이고
  // counts는 거르기와 상관없이 전부의 단계별 수다.
  http.get(url('/api/v1/preorders'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    const params = new URL(request.url).searchParams
    const size = Number(params.get('size') ?? 20)
    const status = params.get('status')
    // displayStatus= 하나뿐이면 보내지 않은 것과 같고, 빈 값이 섞이면 400이다.
    const displayStatuses = params.getAll('displayStatus')
    const displayStatus =
      displayStatuses.length === 1 && displayStatuses[0] === ''
        ? []
        : displayStatuses
    const productId = params.get('productId')
    const cursor = params.get('cursor')
    const violations = [
      ...(Number.isInteger(size) && size >= 1 && size <= 100
        ? []
        : [{ field: 'size', message: '1~100 이어야 합니다.' }]),
      ...(status && !STATUSES.includes(status as PreorderStatus)
        ? [{ field: 'status', message: '형식이 올바르지 않습니다.' }]
        : []),
      ...(displayStatus.every((it) =>
        DISPLAY_STATUSES.includes(it as PreorderDisplayStatus),
      )
        ? []
        : [{ field: 'displayStatus', message: '형식이 올바르지 않습니다.' }]),
      ...(productId && !isUuid(productId)
        ? [{ field: 'productId', message: '형식이 올바르지 않습니다.' }]
        : []),
    ]
    if (violations.length > 0) return invalid(violations)
    // ponytail: 목업 커서는 다음 시작 위치를 숫자로 담는다 — 실서버 커서는 해석하지 않는다.
    if (cursor !== null && !/^\d+$/.test(cursor)) {
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: '커서가 올바르지 않습니다.',
      })
    }

    const start = Number(cursor ?? 0)
    const matched = preorders
      .map(toSummary)
      .filter(
        (it) =>
          (!status || it.status === status) &&
          (displayStatus.length === 0 ||
            displayStatus.includes(it.displayStatus)) &&
          (!productId || it.productId === productId),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return ok<PreorderPage>({
      items: matched.slice(start, start + size),
      nextCursor: start + size < matched.length ? String(start + size) : null,
      counts: countByDisplayStatus(),
    })
  }),

  http.get(url('/api/v1/preorders/:preorderId'), ({ params, request }) => {
    if (!hasToken(request)) return unauthenticated()
    const record = findPreorder(params.preorderId)
    return record ? ok(toDetail(record)) : preorderNotFound()
  }),

  http.get(
    url('/api/v1/preorders/:preorderId/history'),
    ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      const record = findPreorder(params.preorderId)
      if (!record) return preorderNotFound()
      advance(record)
      return ok<PreorderEventListResponse>({ items: record.events })
    },
  ),

  // 취소 — 202는 시작됐다는 뜻이고 완료는 비동기다. 이미 취소 중·취소됨이면 지금 상태로 202.
  http.post(
    url('/api/v1/preorders/:preorderId/cancel'),
    async ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      const record = findPreorder(params.preorderId)
      if (!record) return preorderNotFound()
      const body: unknown = await request.json().catch(() => ({}))
      const reason =
        body !== null && typeof body === 'object'
          ? (body as { reason?: unknown }).reason
          : undefined
      if (reason !== undefined && reason !== null) {
        if (typeof reason !== 'string' || [...reason].length > 500) {
          return fail(400, {
            code: 'VALIDATION_FAILED',
            message: '요청 값이 올바르지 않습니다.',
          })
        }
      }

      advance(record)
      const order = orders.find((it) => it.preorderId === record.preorderId)
      if (order?.status === 'SHIPPED' || order?.status === 'DELIVERED') {
        return fail(409, {
          code: 'PREORDER_NOT_CANCELABLE',
          message: '배송이 시작되어 취소할 수 없습니다.',
        })
      }
      if (CANCELABLE.includes(record.status)) {
        transition(
          record,
          'CANCELING',
          'USER',
          typeof reason === 'string' ? reason : null,
        )
        // 결제한(출고 전) 주문은 환불을 시작해 취소 중이 된다.
        if (order && REFUNDABLE.includes(order.status)) {
          order.status = 'CANCELING'
          saveOrderDb()
        }
      }
      return ok<PreorderCancelResult>(
        {
          preorderId: record.preorderId,
          status: record.status,
          version: record.version,
        },
        202,
      )
    },
  ),
]
