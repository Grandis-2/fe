import { http } from 'msw'

import {
  orders,
  paymentAttempts as attempts,
  preorders,
  saveOrderDb,
} from '../fixtures/preorder'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { codePointLength, isUuid } from '../validate'

import { advance, isPaymentExpired, transition } from './preorder'

import type {
  ApiViolation,
  ConfirmPaymentResponse,
  CursorPage,
  Order,
  OrderDetail,
  OrderStatus,
  PaymentAttempt,
} from '../../types'
import type { OrderRecord } from '../fixtures/preorder'
import type { RequestHandler } from 'msw'

// ponytail: 메모리 상태라 새로고침하면 시드로 돌아간다. 토스 승인은 흉내만 낸다 — paymentKey는 무엇이든 승인한다.

const SHIP_TO_LIMITS = {
  name: 50,
  phone: 20,
  postalCode: 10,
  line1: 200,
  line2: 200,
} as const
const PAID: OrderStatus[] = [
  'AWAITING_CONFIRMATION',
  'PREPARING_ITEMS',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
]

const ATTEMPT_LIFETIME_MS = 35 * 60 * 1000

const hasToken = (request: Request) =>
  request.headers.get('Authorization')?.startsWith('Bearer ') === true

const unauthenticated = () =>
  fail(401, { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' })

// 없는 주문·남의 주문·형식이 틀린 id는 모두 404다.
const orderNotFound = () =>
  fail(404, { code: 'ORDER_NOT_FOUND', message: '주문을 찾을 수 없습니다.' })

const findOrder = (orderId: unknown) =>
  orders.find((it) => it.orderId === orderId)

function moveOrder(
  order: OrderRecord,
  toStatus: OrderStatus,
  actor: OrderRecord['events'][number]['actor'],
  reason: string | null = null,
) {
  order.events.push({
    eventSequence: order.events.length + 1,
    fromStatus: order.status,
    toStatus,
    actor,
    reason,
    createdAt: new Date().toISOString(),
  })
  order.status = toStatus
  saveOrderDb()
}

const toOrder = ({
  preorderId: _preorderId,
  events: _events,
  ...order
}: OrderRecord): Order => order

const toDetail = (order: OrderRecord): OrderDetail => ({
  ...toOrder(order),
  // 관리자 사유는 회원에게 가린다.
  events: order.events.map((event) =>
    event.actor === 'ADMIN' ? { ...event, reason: null } : event,
  ),
  refundFailed: false,
})

// 결제를 시작할 수 있는 예약인지 — 아니면 409 응답을 돌려준다.
function preorderBlock(preorderId: string) {
  const preorder = preorders.find((it) => it.preorderId === preorderId)
  if (!preorder) return null
  advance(preorder)
  if (preorder.status !== 'REGISTERED') {
    return fail(409, {
      code: 'PREORDER_NOT_PAYABLE',
      message: '결제할 수 있는 예약이 아닙니다.',
    })
  }
  if (isPaymentExpired(preorder)) {
    return fail(409, {
      code: 'PAYMENT_WINDOW_EXPIRED',
      message: '결제 기한이 지났습니다.',
    })
  }
  return null
}

export const orderHandlers: RequestHandler[] = [
  // 내 주문 — 최신순, 커서 페이지.
  http.get(url('/api/v1/orders'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    const params = new URL(request.url).searchParams
    const size = Number(params.get('size') ?? 20)
    if (!Number.isInteger(size) || size < 1 || size > 100)
      return invalid([{ field: 'size', message: '1~100 이어야 합니다.' }])
    // ponytail: 목업 커서는 다음 시작 위치를 숫자로 담는다 — 실서버 커서는 해석하지 않는다.
    const cursor = params.get('cursor')
    if (cursor !== null && !/^\d+$/.test(cursor)) {
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: '커서가 올바르지 않습니다.',
      })
    }
    const start = Number(cursor ?? 0)
    const sorted = [...orders].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
    return ok<CursorPage<Order>>({
      items: sorted.slice(start, start + size).map(toOrder),
      nextCursor: start + size < sorted.length ? String(start + size) : null,
    })
  }),

  // 주문 생성 — 결제 가능해진 예약으로만. 예약 하나에 주문 하나(다시 부르면 200과 기존 주문).
  http.post(url('/api/v1/orders'), async ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    const body: unknown = await request.json().catch(() => null)
    if (body === null || typeof body !== 'object')
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: '요청 값이 올바르지 않습니다.',
      })
    const { source, preorderId, shipTo } = body as Record<string, unknown>
    const address =
      shipTo !== null && typeof shipTo === 'object'
        ? (shipTo as Record<string, unknown>)
        : {}

    const violations: ApiViolation[] = [
      ...(source === 'PREORDER'
        ? []
        : [{ field: 'source', message: '지금은 PREORDER 주문만 받습니다.' }]),
      ...(typeof preorderId === 'string' &&
      isUuid(preorderId) &&
      preorderId === preorderId.toLowerCase()
        ? []
        : [{ field: 'preorderId', message: '예약 토큰 형식이 아닙니다.' }]),
      ...Object.entries(SHIP_TO_LIMITS).flatMap(([key, max]) => {
        const value = address[key]
        const optional = key === 'line2'
        if (optional && (value === undefined || value === null || value === ''))
          return []
        return typeof value === 'string' &&
          value.trim() !== '' &&
          codePointLength(value) <= max
          ? []
          : [{ field: `shipTo.${key}`, message: `1~${max}자로 입력해 주세요.` }]
      }),
    ]
    if (violations.length > 0) return invalid(violations)

    const preorder = preorders.find((it) => it.preorderId === preorderId)
    if (!preorder) {
      return fail(404, {
        code: 'PREORDER_NOT_FOUND',
        message: '예약을 찾을 수 없습니다.',
      })
    }

    // 같은 예약의 주문이 있으면 그 주문(새 shipTo는 무시, 기한이 지났어도 돌려준다).
    const existing = orders.find((it) => it.preorderId === preorderId)
    if (existing) {
      if (existing.status === 'CANCELED') {
        return fail(409, {
          code: 'ORDER_ALREADY_CANCELED',
          message: '이미 취소된 주문이 있어 다시 주문할 수 없습니다.',
        })
      }
      return ok(toOrder(existing))
    }
    const blocked = preorderBlock(preorder.preorderId)
    if (blocked) return blocked

    const createdAt = new Date().toISOString()
    const order: OrderRecord = {
      orderId: crypto.randomUUID(),
      preorderId: preorder.preorderId,
      status: 'AWAITING_PAYMENT',
      source: 'PREORDER',
      totalAmount: preorder.unitPrice,
      items: [
        {
          productId: preorder.productId,
          optionId: preorder.optionId,
          productTitle: preorder.productTitle,
          optionTitle: preorder.optionTitle,
          unitPrice: preorder.unitPrice,
          quantity: 1,
        },
      ],
      shipTo: {
        name: String(address.name).trim(),
        phone: String(address.phone).trim(),
        postalCode: String(address.postalCode).trim(),
        line1: String(address.line1).trim(),
        line2:
          typeof address.line2 === 'string' && address.line2.trim()
            ? address.line2.trim()
            : null,
      },
      createdAt,
      events: [
        {
          eventSequence: 1,
          fromStatus: null,
          toStatus: 'AWAITING_PAYMENT',
          actor: 'USER',
          reason: null,
          createdAt,
        },
      ],
    }
    orders.push(order)
    saveOrderDb()
    const response = ok(toOrder(order), 201)
    response.headers.set('Location', `/api/v1/orders/${order.orderId}`)
    return response
  }),

  // 결제 준비 — 돈이 움직이지 않는다. 부를 때마다 새 tossOrderId.
  http.post(
    url('/api/v1/orders/:orderToken/payment-attempts'),
    ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      const order = findOrder(params.orderToken)
      if (!order) return orderNotFound()
      const blocked = preorderBlock(order.preorderId)
      if (blocked) return blocked
      if (order.status !== 'AWAITING_PAYMENT' || order.totalAmount === 0) {
        return fail(409, {
          code: 'ORDER_NOT_PAYABLE',
          message: '결제할 수 있는 주문이 아닙니다.',
        })
      }
      const tossOrderId = `nova_${crypto.randomUUID().replaceAll('-', '')}`
      attempts.set(tossOrderId, {
        orderId: order.orderId,
        amount: order.totalAmount,
        openedAt: Date.now(),
      })
      saveOrderDb()
      const [item] = order.items
      return ok<PaymentAttempt>(
        {
          tossOrderId,
          amount: order.totalAmount,
          orderName: `${item.productTitle} ${item.optionTitle}`.slice(0, 100),
        },
        201,
      )
    },
  ),

  // 결제 승인 — successUrl 쿼리 값을 옮겨 보낸다. 결과는 200의 result로 나뉜다.
  http.post(
    url('/api/v1/orders/:orderToken/payment-attempts/:tossOrderId/confirm'),
    async ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      const tossOrderId = String(params.tossOrderId)
      const body: unknown = await request.json().catch(() => null)
      const { paymentKey, amount } =
        body !== null && typeof body === 'object'
          ? (body as Record<string, unknown>)
          : {}
      const violations: ApiViolation[] = [
        ...(/^[A-Za-z0-9_-]{6,64}$/.test(tossOrderId)
          ? []
          : [{ field: 'tossOrderId', message: '형식이 올바르지 않습니다.' }]),
        ...(typeof paymentKey === 'string' &&
        paymentKey !== '' &&
        paymentKey.length <= 200
          ? []
          : [{ field: 'paymentKey', message: '형식이 올바르지 않습니다.' }]),
        ...(Number.isInteger(amount) && (amount as number) > 0
          ? []
          : [{ field: 'amount', message: '양의 정수여야 합니다.' }]),
      ]
      if (violations.length > 0) return invalid(violations)

      const order = findOrder(params.orderToken)
      if (!order) return orderNotFound()
      // 이미 결제된 주문이면 추가 결제 없이 APPROVED — 새로고침해도 안전하다.
      if (PAID.includes(order.status)) {
        return ok<ConfirmPaymentResponse>({
          result: 'APPROVED',
          orderStatus: order.status,
          declineReason: null,
        })
      }
      const attempt = attempts.get(tossOrderId)
      if (!attempt || attempt.orderId !== order.orderId) {
        return fail(404, {
          code: 'PAYMENT_ATTEMPT_NOT_FOUND',
          message: '결제 요청을 찾을 수 없습니다.',
        })
      }
      if (amount !== attempt.amount || amount !== order.totalAmount) {
        return fail(409, {
          code: 'PAYMENT_AMOUNT_MISMATCH',
          message: '결제 금액이 주문 금액과 다릅니다.',
        })
      }
      const blocked = preorderBlock(order.preorderId)
      if (blocked) return blocked
      if (order.status !== 'AWAITING_PAYMENT') {
        return fail(409, {
          code: 'ORDER_NOT_PAYABLE',
          message: '결제할 수 있는 주문이 아닙니다.',
        })
      }

      attempts.delete(tossOrderId)
      saveOrderDb()
      moveOrder(order, 'AUTHORIZING', 'USER')
      if (Date.now() - attempt.openedAt > ATTEMPT_LIFETIME_MS) {
        moveOrder(
          order,
          'AWAITING_PAYMENT',
          'SYSTEM',
          'PAYMENT_DECLINED:PAYMENT_EXPIRED',
        )
        return ok<ConfirmPaymentResponse>({
          result: 'DECLINED',
          orderStatus: order.status,
          declineReason: 'PAYMENT_EXPIRED',
        })
      }
      moveOrder(order, 'AWAITING_CONFIRMATION', 'SYSTEM', 'PAYMENT_APPROVED')
      // 결제가 확인되면 예약이 확정된다.
      const preorder = preorders.find(
        (it) => it.preorderId === order.preorderId,
      )
      if (preorder) {
        preorder.reservedAt = new Date().toISOString()
        transition(preorder, 'RESERVED', 'SYSTEM')
      }
      return ok<ConfirmPaymentResponse>({
        result: 'APPROVED',
        orderStatus: order.status,
        declineReason: null,
      })
    },
  ),

  http.get(url('/api/v1/orders/:orderId'), ({ params, request }) => {
    if (!hasToken(request)) return unauthenticated()
    const order = findOrder(params.orderId)
    return order ? ok(toDetail(order)) : orderNotFound()
  }),
]
