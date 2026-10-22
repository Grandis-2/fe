import { http } from 'msw'

import { settleDueDraws } from '../drawSettlement'
import { mockMembers } from '../fixtures/admin-reservation'
import { draws } from '../fixtures/draw'
import { orders as memberOrders, saveOrderDb } from '../fixtures/preorder'
import { mockUuid } from '../fixtures/product'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { codePointLength, readPaging, toPage } from '../validate'

import { expireCartOrders } from './order'

import type {
  AdminOrderDetail,
  AdminOrderPage,
  AdminOrderSummary,
  AdvanceShippingRequest,
  OrderEvent,
  OrderSource,
  OrderStatus,
  ShippingStep,
  ShippingStepResponse,
} from '../../types'
import type { RequestHandler } from 'msw'

// 관리자 주문. 회원 목업이 만든 주문(장바구니·사전예약 결제)에 다른 회원의 시드 주문을 더해
// 보여 준다 — 회원 주문은 "나"(첫 번째 회원)의 것으로 본다. 배송 단계를 옮기면 회원 목업의
// 주문도 같이 바뀌어 마이페이지 주문 내역에 그대로 보인다.

type AdminOrderRecord = Omit<AdminOrderDetail, 'refundFailed'> & {
  refundFailed?: boolean
}

const ME = mockMembers[0].memberId
const HOUR = 60 * 60 * 1000
const iso = (agoMs: number) => new Date(Date.now() - agoMs).toISOString()

const STATUSES: OrderStatus[] = [
  'AWAITING_CONFIRMATION',
  'PREPARING_ITEMS',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
  'AWAITING_PAYMENT',
  'CANCELED',
]
const SOURCES: OrderSource[] = ['CART', 'BUY_NOW', 'DRAW', 'PREORDER']

// 받은 상태까지 오는 이력. 당첨 주문은 결제 없이 결제 완료(AWAITING_CONFIRMATION)로 생긴다.
const PATH: OrderStatus[] = [
  'AWAITING_PAYMENT',
  'AUTHORIZING',
  'AWAITING_CONFIRMATION',
  'PREPARING_ITEMS',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
]

function historyTo(
  status: OrderStatus,
  source: OrderSource,
  createdAt: string,
): OrderEvent[] {
  const start = source === 'DRAW' ? 'AWAITING_CONFIRMATION' : 'AWAITING_PAYMENT'
  const target = status === 'CANCELED' ? 'AWAITING_PAYMENT' : status
  const path = PATH.slice(PATH.indexOf(start), PATH.indexOf(target) + 1)
  const events: OrderEvent[] = path.map((toStatus, i) => ({
    eventSequence: i + 1,
    fromStatus: i === 0 ? null : path[i - 1],
    toStatus,
    actor:
      i === 0
        ? source === 'DRAW'
          ? 'SYSTEM'
          : 'USER'
        : toStatus === 'AUTHORIZING'
          ? 'USER'
          : toStatus === 'AWAITING_CONFIRMATION'
            ? 'SYSTEM'
            : 'ADMIN',
    reason:
      i === 0
        ? source === 'DRAW'
          ? 'DRAW_WON'
          : null
        : toStatus === 'AWAITING_CONFIRMATION'
          ? 'PAYMENT_APPROVED'
          : toStatus === 'AUTHORIZING'
            ? null
            : '정상 처리',
    createdAt,
  }))
  if (status === 'CANCELED') {
    events.push({
      eventSequence: events.length + 1,
      fromStatus: 'AWAITING_PAYMENT',
      toStatus: 'CANCELED',
      actor: 'SYSTEM',
      reason: 'PAYMENT_EXPIRED',
      createdAt,
    })
  }
  return events
}

const buildSeedOrders = (): AdminOrderRecord[] =>
  Array.from({ length: 28 }, (_, i) => {
    const source = SOURCES[i % SOURCES.length]
    // 당첨 주문은 결제 전 상태가 없다.
    const status =
      source === 'DRAW'
        ? STATUSES[i % 5]
        : STATUSES[Math.floor(i / SOURCES.length) % STATUSES.length]
    const member = mockMembers[(i + 1) % mockMembers.length]
    const draw = draws[i % draws.length]
    const createdAt = iso((i + 1) * 5 * HOUR)
    const unitPrice = source === 'DRAW' ? 0 : 1_250_000 + (i % 4) * 100_000
    const quantity = source === 'CART' ? 1 + (i % 2) : 1
    return {
      orderId: mockUuid(5, 1000 + i),
      customerId: member.memberId,
      status,
      source,
      totalAmount: unitPrice * quantity,
      paymentDueAt:
        status === 'AWAITING_PAYMENT' &&
        (source === 'CART' || source === 'BUY_NOW')
          ? new Date(Date.now() + 10 * 60 * 1000).toISOString()
          : null,
      items: [
        {
          orderItemId: mockUuid(5, 2000 + i),
          productId: source === 'DRAW' ? draw.gift.productId : mockUuid(2, i),
          optionId: source === 'DRAW' ? draw.gift.variantId : mockUuid(3, i),
          productTitle:
            source === 'DRAW'
              ? draw.gift.productTitle
              : ['아이폰 18', '갤럭시 S26', '맥북 프로 16', '아이패드 에어'][
                  i % 4
                ],
          optionTitle:
            source === 'DRAW'
              ? draw.gift.optionTitle
              : ['블랙 / 256GB', '실버 / 512GB'][i % 2],
          unitPrice,
          quantity,
          warrantyQuantity: 0,
          warrantyUnitPrice: 0,
          lineAmount: unitPrice * quantity,
          imageUrl: source === 'DRAW' ? draw.gift.imageUrl : null,
        },
      ],
      shipTo: {
        name: member.name,
        phone: '01012345678',
        postalCode: '06234',
        line1: '서울특별시 강남구 테헤란로 123',
        line2: i % 3 === 0 ? null : `${100 + i}호`,
      },
      createdAt,
      events: historyTo(status, source, createdAt),
    }
  })

// 다른 회원의 시드 주문은 배송 단계를 옮긴 결과가 새로고침 뒤에도 남도록 따로 싣는다
// (회원 주문은 회원 목업의 saveOrderDb가 싣는다). 모양이 바뀌면 키의 버전을 올린다.
const SEED_DB_KEY = 'nova-admin-order-mock-db-v2'

function loadSeedOrders(): AdminOrderRecord[] | null {
  try {
    const raw = localStorage.getItem(SEED_DB_KEY)
    return raw ? (JSON.parse(raw) as AdminOrderRecord[]) : null
  } catch {
    return null
  }
}

const seedOrders: AdminOrderRecord[] = loadSeedOrders() ?? buildSeedOrders()

function saveSeedOrders() {
  try {
    localStorage.setItem(SEED_DB_KEY, JSON.stringify(seedOrders))
  } catch {
    // 저장 공간이 막혀 있으면 메모리로만 동작한다.
  }
}

// 서버는 기한 만료 취소와 당첨 주문 생성을 스스로 한다 — 목업은 관리자 주문을 읽을 때 따라잡는다.
const catchUp = () => {
  expireCartOrders()
  settleDueDraws()
}

const all = (): AdminOrderRecord[] => [
  ...memberOrders.map(
    ({ preorderId: _p, cartItems: _c, ...order }) =>
      ({ ...order, customerId: ME }) as AdminOrderRecord,
  ),
  ...seedOrders,
]

const findRecord = (orderId: string) =>
  seedOrders.find((it) => it.orderId === orderId) ??
  memberOrders.find((it) => it.orderId === orderId)

const toSummary = ({
  events: _e,
  refundFailed: _r,
  ...order
}: AdminOrderRecord): AdminOrderSummary => order

const toDetail = (order: AdminOrderRecord): AdminOrderDetail => ({
  ...order,
  refundFailed: order.refundFailed ?? false,
})

// 단계 → 출발 상태 · 도착 상태(명세 표).
const STEP: Record<ShippingStep, [from: OrderStatus, to: OrderStatus]> = {
  PREPARATION_STARTED: ['AWAITING_CONFIRMATION', 'PREPARING_ITEMS'],
  PACKED: ['PREPARING_ITEMS', 'READY_TO_SHIP'],
  SHIPPED: ['READY_TO_SHIP', 'SHIPPED'],
  DELIVERED: ['SHIPPED', 'DELIVERED'],
}

const orderNotFound = () =>
  fail(404, { code: 'ORDER_NOT_FOUND', message: '주문을 찾을 수 없습니다.' })

export const adminOrderHandlers: RequestHandler[] = [
  http.get(url('/api/v1/admin/orders'), ({ request }) => {
    catchUp()
    const params = new URL(request.url).searchParams
    const { page, size, violations } = readPaging(params)
    const status = params.get('status')
    const source = params.get('source')
    if (
      status &&
      !PATH.concat('CANCELING', 'CANCELED').includes(status as OrderStatus)
    )
      violations.push({ field: 'status', message: '모르는 상태입니다.' })
    if (source && !SOURCES.includes(source as OrderSource))
      violations.push({ field: 'source', message: '모르는 출처입니다.' })
    if (violations.length > 0) return invalid(violations)

    const filtered = all()
      .filter((it) => !status || it.status === status)
      .filter((it) => !source || it.source === source)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const { items, total } = toPage(filtered, page, size)
    return ok<AdminOrderPage>({
      items: items.map(toSummary),
      page,
      size,
      total,
    })
  }),

  http.get(url('/api/v1/admin/orders/:orderId'), ({ params }) => {
    catchUp()
    const order = all().find((it) => it.orderId === params.orderId)
    return order ? ok(toDetail(order)) : orderNotFound()
  }),

  http.post(
    url('/api/v1/admin/orders/:orderId/shipping-steps'),
    async ({ params, request }) => {
      catchUp()
      const record = findRecord(String(params.orderId))
      if (!record) return orderNotFound()
      const body = ((await request.json().catch(() => null)) ??
        {}) as Partial<AdvanceShippingRequest>
      const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
      if (reason === '' || codePointLength(reason) > 500)
        return invalid([
          { field: 'reason', message: '1~500자로 입력해 주세요.' },
        ])
      const step = body.step && STEP[body.step]
      if (!step)
        return invalid([{ field: 'step', message: '모르는 단계입니다.' }])

      const [from, to] = step
      // 이미 그 단계면 바꾸지 않고 200 applied false.
      if (record.status === to)
        return ok<ShippingStepResponse>({
          orderId: record.orderId,
          status: record.status,
          applied: false,
        })
      if (record.status !== from)
        return fail(409, {
          code: 'ORDER_STEP_NOT_ALLOWED',
          message: '지금 상태에서는 이 배송 단계로 옮길 수 없습니다.',
          status: record.status,
        })

      record.events.push({
        eventSequence: record.events.length + 1,
        fromStatus: from,
        toStatus: to,
        actor: 'ADMIN',
        reason,
        createdAt: new Date().toISOString(),
      })
      record.status = to
      if (seedOrders.includes(record as AdminOrderRecord)) saveSeedOrders()
      else saveOrderDb()
      return ok<ShippingStepResponse>({
        orderId: record.orderId,
        status: to,
        applied: true,
      })
    },
  ),
]
