import { http } from 'msw'

import {
  cartLines,
  orders,
  paymentAttempts as attempts,
  preorders,
  saveOrderDb,
} from '../fixtures/preorder'
import { fail, invalid, ok } from '../response'
import { url } from '../url'
import { codePointLength, isUuid } from '../validate'

import { findVariant, toCartLine, unavailableReason } from './cart'
import { advance, isPaymentExpired, transition } from './preorder'

import type {
  ApiViolation,
  CancelOrderResponse,
  CartOrderItem,
  ConfirmPaymentResponse,
  CursorPage,
  Order,
  OrderDetail,
  OrderItem,
  OrderStatus,
  PaymentAttempt,
  PlaceOrderResponse,
  ShipTo,
} from '../../types'
import type { OrderRecord } from '../fixtures/preorder'
import type { RequestHandler } from 'msw'

// 토스 승인은 흉내만 낸다 — paymentKey는 무엇이든 승인한다.
// ponytail: 장바구니 주문의 재고 확보는 흉내 내지 않고 가용 재고와 비교만 한다(확보·반납 없음).

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
const MAX_CART_ORDER_LINES = 50
// 장바구니 주문은 만든 때부터 10분 안에 결제해야 한다.
const CART_PAYMENT_WINDOW_MS = 10 * 60 * 1000
const ATTEMPT_LIFETIME_MS = 35 * 60 * 1000

const hasToken = (request: Request) =>
  request.headers.get('Authorization')?.startsWith('Bearer ') === true

const unauthenticated = () =>
  fail(401, { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' })

const unreadable = () =>
  fail(400, {
    code: 'VALIDATION_FAILED',
    message: '요청 값이 올바르지 않습니다.',
  })

// 없는 주문·남의 주문·형식이 틀린 id는 모두 404다.
const orderNotFound = () =>
  fail(404, { code: 'ORDER_NOT_FOUND', message: '주문을 찾을 수 없습니다.' })

const stateConflict = (message: string) =>
  fail(409, { code: 'STATE_CONFLICT', message })

const paymentInProgress = () =>
  fail(409, {
    code: 'PAYMENT_IN_PROGRESS',
    message: '승인 결과를 확인 중입니다.',
  })

const windowExpired = () =>
  fail(409, {
    code: 'PAYMENT_WINDOW_EXPIRED',
    message: '결제 기한이 지났습니다.',
  })

// 바로 구매 Idempotency-Key → 처음 만든 주문 id.
// ponytail: 메모리에만 둔다 — 새로고침하면 같은 키도 새 주문이 된다. 재현이 필요해지면 order DB에 같이 저장한다.
const buyNowKeys = new Map<string, string>()

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

const isCartDue = (order: OrderRecord) =>
  order.paymentDueAt !== null && Date.now() > Date.parse(order.paymentDueAt)

// 결제 기한이 지난 장바구니 주문은 서버가 곧 취소한다 — 읽을 때 흉내 낸다.
function expireCartOrders() {
  for (const order of orders) {
    if (
      (order.source === 'CART' || order.source === 'BUY_NOW') &&
      order.status === 'AWAITING_PAYMENT' &&
      isCartDue(order)
    )
      moveOrder(order, 'CANCELED', 'SYSTEM', 'PAYMENT_EXPIRED')
  }
}

const toOrder = ({
  preorderId: _preorderId,
  cartItems: _cartItems,
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

// 결제를 시작할 수 있는 예약인지 — 아니면 409 응답을 돌려준다. 장바구니 주문은 결제 기한을 본다.
function paymentBlock(order: Pick<OrderRecord, 'preorderId' | 'paymentDueAt'>) {
  if (
    order.paymentDueAt !== null &&
    Date.now() > Date.parse(order.paymentDueAt)
  )
    return windowExpired()
  const preorder = preorders.find((it) => it.preorderId === order.preorderId)
  if (!preorder) return null
  advance(preorder)
  if (preorder.status !== 'REGISTERED') {
    return fail(409, {
      code: 'PREORDER_NOT_PAYABLE',
      message: '결제할 수 있는 예약이 아닙니다.',
    })
  }
  return isPaymentExpired(preorder) ? windowExpired() : null
}

export function shipToViolations(
  address: Record<string, unknown>,
): ApiViolation[] {
  return Object.entries(SHIP_TO_LIMITS).flatMap(([key, max]) => {
    const value = address[key]
    if (
      key === 'line2' &&
      (value === undefined || value === null || value === '')
    )
      return []
    return typeof value === 'string' &&
      value.trim() !== '' &&
      codePointLength(value) <= max
      ? []
      : [{ field: `shipTo.${key}`, message: `1~${max}자로 입력해 주세요.` }]
  })
}

export const toShipTo = (address: Record<string, unknown>): ShipTo => ({
  name: String(address.name).trim(),
  phone: String(address.phone).trim(),
  postalCode: String(address.postalCode).trim(),
  line1: String(address.line1).trim(),
  line2:
    typeof address.line2 === 'string' && address.line2.trim()
      ? address.line2.trim()
      : null,
})

const sameShipTo = (a: ShipTo, b: ShipTo) =>
  (Object.keys(SHIP_TO_LIMITS) as (keyof ShipTo)[]).every(
    (key) => a[key] === b[key],
  )

// 옵션·보증 여부·수량·배송지가 같은 주문인지(가격은 보지 않는다).
const sameOrderContent = (
  order: OrderRecord,
  items: CartOrderItem[],
  shipTo: ShipTo,
) =>
  sameShipTo(order.shipTo, shipTo) &&
  order.cartItems?.length === items.length &&
  items.every((item) =>
    order.cartItems?.some(
      (prev) =>
        lineKey(prev) === lineKey(item) && prev.quantity === item.quantity,
    ),
  )

const lineKey = ({ variantId, warranty = false }: CartOrderItem) =>
  `${variantId}:${warranty}`

// 장바구니 주문 줄 검사 — 칸 오류는 위치가 붙은 field로 모은다.
function cartItemViolations(items: unknown): ApiViolation[] {
  if (!Array.isArray(items) || items.length === 0)
    return [{ field: 'items', message: '필수 항목입니다.' }]
  if (items.length > MAX_CART_ORDER_LINES)
    return [{ field: 'items', message: '한 번에 50줄까지 주문할 수 있습니다.' }]
  const violations = items.flatMap((raw: unknown, index): ApiViolation[] => {
    const item = (raw ?? {}) as Record<string, unknown>
    const at = (name: string) => `items[${index}].${name}`
    return [
      ...(typeof item.variantId === 'string' && isUuid(item.variantId)
        ? []
        : [{ field: at('variantId'), message: '필수 항목입니다.' }]),
      ...(Number.isInteger(item.quantity) &&
      (item.quantity as number) >= 1 &&
      (item.quantity as number) <= 99
        ? []
        : [{ field: at('quantity'), message: '1~99 사이여야 합니다.' }]),
      ...(typeof item.expectedUnitPrice === 'number' &&
      item.expectedUnitPrice >= 0
        ? []
        : [
            { field: at('expectedUnitPrice'), message: '0 이상이어야 합니다.' },
          ]),
      ...(item.warranty === true &&
      typeof item.expectedWarrantyPrice !== 'number'
        ? [
            {
              field: 'items.expectedWarrantyPrice',
              message: '보증 포함 줄은 필수 항목입니다.',
            },
          ]
        : []),
    ]
  })
  const keys = (items as CartOrderItem[]).map(lineKey)
  if (new Set(keys).size !== keys.length)
    violations.push({
      field: 'items',
      message: '같은 옵션 · 보증 줄을 두 번 고를 수 없습니다.',
    })
  return violations
}

// 고른 줄을 주문상품으로 합친다 — 같은 옵션의 보증 포함·미포함 줄은 한 줄(quantity 합, warrantyQuantity는 보증 줄 수량).
function toOrderItems(items: CartOrderItem[]): OrderItem[] {
  const merged = new Map<string, OrderItem>()
  for (const item of items) {
    const found = findVariant(item.variantId)
    if (!found) continue
    const { product, variant } = found
    const row = merged.get(item.variantId) ?? {
      productId: product.productId,
      optionId: variant.variantId,
      productTitle: product.title,
      optionTitle: variant.title,
      unitPrice: variant.price,
      quantity: 0,
      warrantyQuantity: 0,
      warrantyUnitPrice: 0,
      lineAmount: 0,
    }
    row.quantity += item.quantity
    if (item.warranty) {
      row.warrantyQuantity += item.quantity
      row.warrantyUnitPrice = product.warranty.surcharge
    }
    row.lineAmount =
      row.unitPrice * row.quantity +
      row.warrantyUnitPrice * row.warrantyQuantity
    merged.set(item.variantId, row)
  }
  return [...merged.values()]
}

// 장바구니 주문 만들기 — 실패하면 409·400 응답, 성공하면 주문.
// 바로 구매(BUY_NOW)도 가격·판매 상태·재고 규칙은 같고, 장바구니와 무관해 대조·승인 대기·회원당 하나 규칙만 빠진다
// (기존 주문은 Idempotency-Key로만 돌려받는다 — 아래 핸들러).
function placeCartOrder(
  items: CartOrderItem[],
  shipTo: ShipTo,
  source: 'CART' | 'BUY_NOW',
): Response | OrderRecord {
  // 앞 장바구니 주문이 승인 결과를 기다리면 새 주문을 받지 않는다.
  const authorizing =
    source === 'CART' &&
    orders.find((it) => it.source === 'CART' && it.status === 'AUTHORIZING')
  if (authorizing) return paymentInProgress()

  // 고른 줄의 옵션·보증 여부·수량이 지금 장바구니와 정확히 같아야 한다.
  const changed =
    source === 'CART' &&
    items.some(
      (item) =>
        !cartLines.some(
          (line) =>
            line.variantId === item.variantId &&
            line.warranty === (item.warranty ?? false) &&
            line.quantity === item.quantity,
        ),
    )
  if (changed) {
    return fail(409, {
      code: 'CART_CHANGED',
      message: '선택한 장바구니 구성이 변경되었습니다.',
    })
  }

  const blocked = items.filter((item) => {
    const reason = unavailableReason({
      ...item,
      warranty: item.warranty ?? false,
    })
    return (
      reason !== null &&
      reason !== 'OUT_OF_STOCK' &&
      reason !== 'INSUFFICIENT_STOCK'
    )
  })
  if (blocked.length > 0)
    return stateConflict(
      '현재 상태에서는 처리할 수 없습니다. 최신 상태를 조회해 주세요.',
    )

  const priceChanged = items.some((item) => {
    const line = toCartLine({
      cartItemId: '',
      variantId: item.variantId,
      warranty: item.warranty ?? false,
      quantity: item.quantity,
    })
    return (
      line.unitPrice !== item.expectedUnitPrice ||
      (item.warranty === true &&
        line.warrantyPrice !== item.expectedWarrantyPrice)
    )
  })
  if (priceChanged) {
    return fail(409, {
      code: 'PRICE_CHANGED',
      message: '가격이 변경되었습니다. 변경된 가격을 확인해 주세요.',
    })
  }

  const orderItems = toOrderItems(items)
  const short = orderItems.some(
    (row) =>
      row.quantity >
      (findVariant(row.optionId)?.variant.availableQuantity ?? 0),
  )
  if (short) {
    return fail(409, {
      code: 'INSUFFICIENT_STOCK',
      message: '주문 전체 수량을 확보할 수 없습니다.',
    })
  }

  const totalAmount = orderItems.reduce((sum, row) => sum + row.lineAmount, 0)
  // 결제 전 장바구니 주문은 회원당 하나 — 구성·가격·배송지가 같고 기한 안이면 그 주문을 돌려준다.
  if (source === 'CART') {
    const pending = orders.filter(
      (it) => it.source === 'CART' && it.status === 'AWAITING_PAYMENT',
    )
    const same = pending.find(
      (it) =>
        !isCartDue(it) &&
        it.totalAmount === totalAmount &&
        sameOrderContent(it, items, shipTo),
    )
    if (same) return same
    for (const previous of pending)
      moveOrder(previous, 'CANCELED', 'SYSTEM', 'REPLACED_BY_NEW_ORDER')
  }

  const createdAt = new Date().toISOString()
  return {
    orderId: crypto.randomUUID(),
    preorderId: null,
    cartItems: items.map((item) => ({
      ...item,
      warranty: item.warranty ?? false,
    })),
    status: 'AWAITING_PAYMENT',
    source,
    totalAmount,
    paymentDueAt: new Date(Date.now() + CART_PAYMENT_WINDOW_MS).toISOString(),
    items: orderItems,
    shipTo,
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
}

// 사전예약 주문 만들기 — 예약 하나에 주문 하나.
function placePreorderOrder(
  preorderId: string,
  shipTo: ShipTo,
): Response | OrderRecord {
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
    return existing
  }
  const blocked = paymentBlock({ preorderId, paymentDueAt: null })
  if (blocked) return blocked

  const createdAt = new Date().toISOString()
  return {
    orderId: crypto.randomUUID(),
    preorderId,
    cartItems: null,
    status: 'AWAITING_PAYMENT',
    source: 'PREORDER',
    totalAmount: preorder.unitPrice,
    paymentDueAt: null,
    items: [
      {
        productId: preorder.productId,
        optionId: preorder.optionId,
        productTitle: preorder.productTitle,
        optionTitle: preorder.optionTitle,
        unitPrice: preorder.unitPrice,
        quantity: 1,
        warrantyQuantity: 0,
        warrantyUnitPrice: 0,
        lineAmount: preorder.unitPrice,
      },
    ],
    shipTo,
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
}

// 장바구니 주문이 승인되면 산 수량만큼 장바구니에서 뺀다(남은 줄에서만).
function removePurchasedFromCart(order: OrderRecord) {
  for (const item of order.cartItems ?? []) {
    const index = cartLines.findIndex(
      (line) =>
        line.variantId === item.variantId &&
        line.warranty === (item.warranty ?? false),
    )
    if (index < 0) continue
    const line = cartLines[index]
    line.quantity -= item.quantity
    if (line.quantity <= 0) cartLines.splice(index, 1)
  }
  saveOrderDb()
}

export const orderHandlers: RequestHandler[] = [
  // 내 주문 — 최신순, 커서 페이지. 장바구니·사전예약·드로우 주문이 모두 나오고 취소된 주문도 나온다.
  http.get(url('/api/v1/orders'), ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    expireCartOrders()
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

  // 주문 생성 — 장바구니(CART)·바로 구매(BUY_NOW) 또는 사전예약(PREORDER). 새 주문은 201, 기존 주문은 200(reused).
  http.post(url('/api/v1/orders'), async ({ request }) => {
    if (!hasToken(request)) return unauthenticated()
    expireCartOrders()
    const body: unknown = await request.json().catch(() => null)
    if (body === null || typeof body !== 'object') return unreadable()
    const { source, preorderId, items, shipTo } = body as Record<
      string,
      unknown
    >
    if (
      source !== 'CART' &&
      source !== 'PREORDER' &&
      source !== 'BUY_NOW' &&
      source !== 'DRAW'
    )
      return unreadable()
    const address =
      shipTo !== null && typeof shipTo === 'object'
        ? (shipTo as Record<string, unknown>)
        : {}

    const violations: ApiViolation[] = [
      ...(source === 'DRAW'
        ? [{ field: 'source', message: '이 주문은 아직 받지 않습니다.' }]
        : []),
      ...(source === 'PREORDER' &&
      !(
        typeof preorderId === 'string' &&
        isUuid(preorderId) &&
        preorderId === preorderId.toLowerCase()
      )
        ? [{ field: 'preorderId', message: '예약 토큰 형식이 아닙니다.' }]
        : []),
      ...(source === 'CART' || source === 'BUY_NOW'
        ? cartItemViolations(items)
        : []),
      ...(source === 'BUY_NOW' &&
      Array.isArray(items) &&
      new Set(items.map((item: CartOrderItem) => item.variantId)).size > 1
        ? [
            {
              field: 'items',
              message: '바로 구매는 옵션 하나만 주문할 수 있습니다.',
            },
          ]
        : []),
      ...shipToViolations(address),
    ]
    if (violations.length > 0) return invalid(violations)

    // 바로 구매는 Idempotency-Key 필수 — 같은 키·같은 내용이면 처음 주문을 지금 상태 그대로 돌려준다.
    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (source === 'BUY_NOW' && !idempotencyKey)
      return fail(400, {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key 헤더가 필요합니다.',
      })
    if (source === 'BUY_NOW' && !isUuid(idempotencyKey as string))
      return invalid([
        { field: 'Idempotency-Key', message: 'UUID 형식이어야 합니다.' },
      ])
    const keyed =
      source === 'BUY_NOW'
        ? findOrder(buyNowKeys.get(idempotencyKey as string))
        : undefined
    if (
      keyed &&
      !sameOrderContent(keyed, items as CartOrderItem[], toShipTo(address))
    )
      return fail(422, {
        code: 'KEY_PAYLOAD_MISMATCH',
        message: '이전 요청과 내용이 다릅니다. 새 주문으로 다시 시도해 주세요.',
      })

    const result =
      keyed ??
      (source === 'CART' || source === 'BUY_NOW'
        ? placeCartOrder(items as CartOrderItem[], toShipTo(address), source)
        : placePreorderOrder(preorderId as string, toShipTo(address)))
    if (result instanceof Response) return result

    const reused = orders.includes(result)
    if (!reused) {
      orders.push(result)
      if (source === 'BUY_NOW')
        buyNowKeys.set(idempotencyKey as string, result.orderId)
      saveOrderDb()
    }
    const response = ok<PlaceOrderResponse>(
      { ...toOrder(result), reused },
      reused ? 200 : 201,
    )
    if (!reused)
      response.headers.set('Location', `/api/v1/orders/${result.orderId}`)
    return response
  }),

  // 결제 전 장바구니 주문 취소. 이미 취소됐으면 같은 200.
  http.post(url('/api/v1/orders/:orderToken/cancel'), ({ params, request }) => {
    if (!hasToken(request)) return unauthenticated()
    expireCartOrders()
    const order = findOrder(params.orderToken)
    if (!order) return orderNotFound()
    if (order.status === 'AUTHORIZING') return paymentInProgress()
    if (order.source === 'PREORDER')
      return stateConflict('사전예약 주문은 예약 취소로 취소합니다.')
    if (order.source === 'DRAW')
      return stateConflict('드로우 당첨 주문은 취소할 수 없습니다.')
    if (order.status === 'AWAITING_PAYMENT')
      moveOrder(order, 'CANCELED', 'USER')
    else if (order.status !== 'CANCELED')
      return stateConflict('결제된 주문은 아직 취소할 수 없습니다.')
    return ok<CancelOrderResponse>({
      orderId: order.orderId,
      status: order.status,
    })
  }),

  // 결제 준비 — 돈이 움직이지 않는다. 부를 때마다 새 tossOrderId.
  http.post(
    url('/api/v1/orders/:orderToken/payment-attempts'),
    ({ params, request }) => {
      if (!hasToken(request)) return unauthenticated()
      expireCartOrders()
      const order = findOrder(params.orderToken)
      if (!order) return orderNotFound()
      if (order.status !== 'AWAITING_PAYMENT' || order.totalAmount === 0) {
        return fail(409, {
          code: 'ORDER_NOT_PAYABLE',
          message: '결제할 수 있는 주문이 아닙니다.',
        })
      }
      const blocked = paymentBlock(order)
      if (blocked) return blocked
      const tossOrderId = crypto.randomUUID()
      attempts.set(tossOrderId, {
        orderId: order.orderId,
        amount: order.totalAmount,
        openedAt: Date.now(),
      })
      saveOrderDb()
      const [first] = order.items
      const name = `${first.productTitle} ${first.optionTitle}${order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ''}`
      return ok<PaymentAttempt>(
        {
          tossOrderId,
          amount: order.totalAmount,
          orderName: name.length > 100 ? `${name.slice(0, 99)}…` : name,
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
          message: '결제 시도를 찾을 수 없습니다.',
        })
      }
      if (amount !== attempt.amount || amount !== order.totalAmount) {
        return fail(409, {
          code: 'PAYMENT_AMOUNT_MISMATCH',
          message: '결제 금액이 주문 금액과 다릅니다.',
        })
      }
      if (order.status !== 'AWAITING_PAYMENT') {
        return fail(409, {
          code: 'ORDER_NOT_PAYABLE',
          message: '결제할 수 있는 주문이 아닙니다.',
        })
      }
      // 장바구니 주문의 기한은 승인을 시작할 때만 본다.
      const blocked = paymentBlock(order)
      if (blocked) return blocked

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
      if (order.source === 'CART') removePurchasedFromCart(order)
      // 사전예약은 결제가 확인되면 예약이 확정된다.
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
    expireCartOrders()
    const order = findOrder(params.orderId)
    return order ? ok(toDetail(order)) : orderNotFound()
  }),
]
