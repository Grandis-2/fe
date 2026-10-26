import type { CursorPage } from './common'

// 주문·결제 API(order 서비스 — api-docs의 order.json). 회원용 모양이 기준이고, 관리자 주문(/admin/orders)은 맨 아래에 회원 모양에서 파생한다.
// 재고·럭키 드로우 API는 다루지 않는다.
// 주문은 장바구니에서 고른 줄(CART), 상품 상세의 바로 구매(BUY_NOW), 결제 가능해진 사전예약(PREORDER)으로 만들고 토스로 결제한다.
// 화면과 경로의 주문 id는 주문 토큰(orderId)이다. 토스 결제창의 orderId는 tossOrderId라 다른 값이다.

// 표 순서대로 한 단계씩 진행한다. 승인이 거절되면 AUTHORIZING에서 AWAITING_PAYMENT로 돌아온다.
export type OrderStatus =
  | 'AWAITING_PAYMENT'
  | 'AUTHORIZING'
  | 'AWAITING_CONFIRMATION'
  | 'PREPARING_ITEMS'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELING'
  | 'CANCELED'

// CART(장바구니), BUY_NOW(상품 상세의 바로 구매), PREORDER(사전예약), DRAW(럭키 드로우 당첨 — 서버가 0원으로 만든다).
export type OrderSource = 'PREORDER' | 'BUY_NOW' | 'CART' | 'DRAW'

// 주문상품 한 줄(옵션마다 한 줄). 이름·단가·보증가는 주문 당시 값(사전예약은 예약 접수 당시)이다.
export type OrderItem = {
  // 주문상품 id — 리뷰 쓰기(POST /reviews)에 쓴다. 명세(order.json)엔 아직 없지만 서버는 내려준다.
  orderItemId: string
  productId: string
  // 장바구니의 variantId와 같은 값.
  optionId: string
  productTitle: string
  optionTitle: string
  unitPrice: number
  // 장바구니에서 같은 옵션의 보증 포함·미포함 줄을 함께 사면 그 합. 사전예약·드로우는 1.
  quantity: number
  // 그중 보증을 함께 산 수량. 사전예약·드로우는 0.
  warrantyQuantity: number
  // 보증 1개 가격. 보증을 사지 않았으면 0.
  warrantyUnitPrice: number
  // unitPrice × quantity + warrantyUnitPrice × warrantyQuantity.
  lineAmount: number
  // 주문 당시 이 옵션의 사진 — 장바구니·바로 구매는 장바구니에 보이던 사진, 드로우 당첨은 증정품 사진.
  // 사전예약 주문은 10-23 배포 뒤 만든 주문부터 사진이 온다. 사진이 없는 옵션, 사진을 남기기 전(10-20 이전)에 만든 주문,
  // 10-23 이전 사전예약 주문은 null.
  imageUrl: string | null
}

// 주문에 저장된 배송지. 상세 주소가 없으면 line2는 null.
export type ShipTo = {
  name: string
  phone: string
  postalCode: string
  line1: string
  line2: string | null
}

// 주문 — 목록 응답. 예약 id는 들어 있지 않다.
export type Order = {
  orderId: string
  status: OrderStatus
  source: OrderSource
  // 결제할 금액(원) — items의 lineAmount 합. 드로우 당첨 주문은 0.
  totalAmount: number
  // 장바구니·바로 구매 주문의 결제 기한(만든 때부터 10분). 사전예약(예약 상세의 paymentDueAt을 본다)·드로우는 null.
  paymentDueAt: string | null
  items: OrderItem[]
  shipTo: ShipTo
  createdAt: string
}

export type OrderEvent = {
  eventSequence: number
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  actor: 'USER' | 'ADMIN' | 'SYSTEM'
  // USER면 null, ADMIN 사유는 회원에게 가려져 null. SYSTEM은 코드 문자열(PAYMENT_APPROVED 등).
  reason: string | null
  createdAt: string
}

// GET /api/v1/orders/{orderId} — 결제 승인이 PENDING이거나 500·503·504로 끝났을 때 폴링한다.
export type OrderDetail = Order & {
  events: OrderEvent[]
  // 취소 중 환불이 실패했으면 true — "환불이 완료되지 않았습니다. 고객센터로 문의해 주세요."
  refundFailed: boolean
}

// GET /api/v1/orders 쿼리. 다음 쪽에도 status·from은 처음과 같게 보낸다.
export type OrderListParams = {
  // 여러 개면 그중 하나에 해당하는 주문. 모르는 값·빈 값이 섞이면 400.
  status?: OrderStatus[]
  // 이 시각(ISO-8601) 이후에 만든 주문만.
  from?: string
  cursor?: string
  // 1~100(기본 20).
  size?: number
}

// counts는 status·from과 상관없이 내 주문 전부의 상태별 수 — 9개 상태가 다 오고 없는 상태는 0이다.
export type OrderPage = CursorPage<Order> & {
  counts: Record<OrderStatus, number>
}

// 주문 요청의 배송지. 상세 주소는 비우면 null로 저장된다. 길이: name 50, phone 20, postalCode 10, line1·line2 200자.
export type ShipToInput = Omit<ShipTo, 'line2'> & { line2?: string | null }

// 주문할 장바구니 줄 — 장바구니 조회 응답의 값을 그대로 옮긴다.
// 수량·보증 여부가 지금 장바구니와 다르면 409 CART_CHANGED, 보여 준 가격이 지금 값과 다르면 409 PRICE_CHANGED.
export type CartOrderItem = {
  variantId: string
  quantity: number
  // 생략하면 false.
  warranty?: boolean
  // 화면에 보여 준 단가(장바구니의 unitPrice).
  expectedUnitPrice: number
  // 보증 포함 줄이면 필수(장바구니의 warrantyPrice).
  expectedWarrantyPrice?: number
}

// POST /api/v1/orders — 금액은 보내지 않는다(서버가 계산한다). 503·네트워크 오류는 같은 본문으로 다시 보내면
// 기존 주문을 돌려받는다. 바로 구매는 Idempotency-Key 헤더(UUID)가 필수다(없으면 400 IDEMPOTENCY_KEY_REQUIRED).
export type PlaceOrderRequest =
  | {
      // 장바구니 일부 줄만 골라도 된다(1~50줄). 결제 안 된 장바구니 주문은 회원당 하나 —
      // 구성·가격·배송지가 같으면 기존 주문(reused), 다르면 새 주문을 만들고 앞 주문은 자동 취소된다.
      // 바로 구매(BUY_NOW)는 본문 모양이 같지만 옵션 하나(보증 미포함·포함 최대 두 줄)만 받고, 장바구니와 무관하다
      // (CART_CHANGED·PAYMENT_IN_PROGRESS 없음, 다른 주문을 취소하지 않음). 기존 주문은 같은 키로만 돌려받는다.
      source: 'CART' | 'BUY_NOW'
      items: CartOrderItem[]
      shipTo: ShipToInput
    }
  | {
      // 예약 하나에 주문 하나 — 다시 부르면 기존 주문(새 shipTo는 무시).
      source: 'PREORDER'
      // 예약 id(소문자 UUID).
      preorderId: string
      shipTo: ShipToInput
    }

// 201이면 새 주문(reused false), 200이면 기존 주문(reused true).
export type PlaceOrderResponse = Order & {
  reused: boolean
}

// POST /api/v1/orders/{orderToken}/cancel(본문 없음) — 결제하지 않은 장바구니·바로 구매 주문만. status는 늘 CANCELED.
// 사전예약 주문은 예약 취소로, 결제된 주문·드로우 당첨 주문은 취소할 수 없다(409 STATE_CONFLICT).
export type CancelOrderResponse = Pick<Order, 'orderId' | 'status'>

// POST /api/v1/orders/{orderToken}/payment-attempts(본문 없음) 201 — 토스 결제위젯에 그대로 넘긴다.
// 부를 때마다 새 tossOrderId가 나오고, 결제창은 35분 안에 승인을 요청하지 않으면 만료된다.
export type PaymentAttempt = {
  // 결제창 requestPayment의 orderId에 넣는다(주문 토큰이 아니다).
  tossOrderId: string
  // 주문 총액. setAmount에 그대로 넣는다.
  amount: number
  // "상품명 옵션명"(여러 개면 " 외 N건", 100자 넘으면 "…").
  orderName: string
}

// POST /api/v1/orders/{orderToken}/payment-attempts/{tossOrderId}/confirm 본문 — successUrl 쿼리 값을 옮긴다.
export type ConfirmPaymentRequest = {
  paymentKey: string
  // 주문 총액과 비교만 한다(다르면 409 PAYMENT_AMOUNT_MISMATCH).
  amount: number
}

// 200 승인 결과 — APPROVED는 완료, DECLINED는 결제 준비부터 다시, PENDING은 주문 상세 폴링.
export type ConfirmPaymentResponse = {
  result: 'APPROVED' | 'DECLINED' | 'PENDING'
  orderStatus: OrderStatus
  // DECLINED일 때만. CARD_REJECTED는 다른 결제 수단, PAYMENT_EXPIRED는 결제창 다시 열기, FAILED는 일반 실패.
  declineReason: 'CARD_REJECTED' | 'PAYMENT_EXPIRED' | 'FAILED' | null
}

// ── 관리자 주문(/api/v1/admin/orders) ─────────────────────────────
// 모든 회원의 주문. 항목은 회원 응답에 customerId가 더해진 모양이고, 상세 이력엔 관리자 사유도 그대로 보인다.

export type AdminOrderSummary = Order & {
  customerId: string
  // 가린 회원 이름(첫 글자 뒤에 **). 회원 정보를 받지 못하면 null.
  customerName: string | null
}

export type AdminOrderDetail = OrderDetail & {
  customerId: string
  customerName: string | null
}

// GET /api/v1/admin/orders/stats — 상태별 주문 수. 모든 상태가 상태 표 순서대로 오고, 없는 상태는 0.
export type AdminOrderStats = {
  byStatus: Record<OrderStatus, number>
  countedAt: string
}

// 오프셋 페이지 — page는 0부터, 전체 건수는 total.
export type AdminOrderPage = {
  items: AdminOrderSummary[]
  page: number
  size: number
  total: number
}

// 둘 다 주면 둘 다 맞는 주문만. 모르는 값은 400.
export type AdminOrderListParams = {
  status?: OrderStatus
  source?: OrderSource
  page?: number
  // 1~100(기본 20).
  size?: number
}

// 배송 단계 — 한 단계씩만 옮긴다(건너뛸 수 없다).
// PREPARATION_STARTED: 결제 완료(AWAITING_CONFIRMATION) → PREPARING_ITEMS, PACKED: → READY_TO_SHIP, SHIPPED·DELIVERED는 같은 이름의 상태로.
export type ShippingStep =
  'PREPARATION_STARTED' | 'PACKED' | 'SHIPPED' | 'DELIVERED'

// POST /api/v1/admin/orders/{orderId}/shipping-steps — reason은 필수, 500자(코드 포인트) 이하이고 관리자 이력에만 보인다.
export type AdvanceShippingRequest = {
  step: ShippingStep
  reason: string
}

// 200 — 이미 그 단계였으면 applied false(바뀐 것 없음). 갈 수 없는 단계면 409 ORDER_STEP_NOT_ALLOWED(details.status에 현재 상태).
export type ShippingStepResponse = {
  orderId: string
  status: OrderStatus
  applied: boolean
}
