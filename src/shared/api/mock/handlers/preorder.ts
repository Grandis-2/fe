import { http } from 'msw'

import { batchFor, orders, preorders, saveOrderDb } from '../fixtures/preorder'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { isUuid } from '../validate'

import type {
  CursorPage,
  PreorderCancelResult,
  PreorderDetail,
  PreorderDisplayStatus,
  PreorderEvent,
  PreorderEventListResponse,
  PreorderStatus,
  PreorderSummary,
} from '../../types'
import type { PreorderRecord } from '../fixtures/preorder'
import type { RequestHandler } from 'msw'

const SECOND = 1000
const HOUR = 60 * 60 * SECOND
// 목업은 접수 5초 뒤 외부 등록이 끝나 결제 가능(REGISTERED)이 되고, 취소는 3초 뒤 끝난다.
const REGISTER_AFTER_MS = 5 * SECOND
const CANCEL_AFTER_MS = 3 * SECOND
const PAYMENT_WINDOW_MS = 24 * HOUR
const STATUSES: PreorderStatus[] = [
  'PENDING_SYNC',
  'REGISTERED',
  'RESERVED',
  'CANCELING',
  'CANCELED',
]
const CANCELABLE: PreorderStatus[] = ['PENDING_SYNC', 'REGISTERED', 'RESERVED']

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
  const lastEvent = record.events[record.events.length - 1]
  if (
    record.status === 'CANCELING' &&
    msSince(lastEvent.createdAt) >= CANCEL_AFTER_MS
  ) {
    transition(record, 'CANCELED', 'SYSTEM')
    // 예약이 취소되면 미결제 주문도 취소된다.
    const order = orders.find((it) => it.preorderId === record.preorderId)
    if (order && order.status === 'AWAITING_PAYMENT') {
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

export function toSummary(record: PreorderRecord): PreorderSummary {
  advance(record)
  return {
    preorderId: record.preorderId,
    productId: record.productId,
    productTitle: record.productTitle,
    optionId: record.optionId,
    optionTitle: record.optionTitle,
    unitPrice: record.unitPrice,
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

export const preorderHandlers: RequestHandler[] = [
  // 내 예약 — 최신순, 취소된 예약 포함. 커서 페이지.
  http.get(url('/api/v1/preorders'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    const params = new URL(request.url).searchParams
    const size = Number(params.get('size') ?? 20)
    const status = params.get('status')
    const productId = params.get('productId')
    const cursor = params.get('cursor')
    const violations = [
      ...(Number.isInteger(size) && size >= 1 && size <= 100
        ? []
        : [{ field: 'size', message: '1~100 이어야 합니다.' }]),
      ...(status && !STATUSES.includes(status as PreorderStatus)
        ? [{ field: 'status', message: '형식이 올바르지 않습니다.' }]
        : []),
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
          (!productId || it.productId === productId),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return ok<CursorPage<PreorderSummary>>({
      items: matched.slice(start, start + size),
      nextCursor: start + size < matched.length ? String(start + size) : null,
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
      if (CANCELABLE.includes(record.status))
        transition(
          record,
          'CANCELING',
          'USER',
          typeof reason === 'string' ? reason : null,
        )
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
