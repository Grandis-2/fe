import type { CursorPage } from './common'

// 주문·결제 API(order 서비스 — api-docs의 order.json) 회원용 모양. 관리자(배송·재고) API는 다루지 않는다.
// 지금은 사전예약 주문만 있다 — 결제 가능(PAYABLE)해진 예약으로 주문을 만들고 토스로 결제한다.
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

// 지금은 PREORDER만 생긴다.
export type OrderSource = 'PREORDER' | 'BUY_NOW' | 'CART'

// 주문상품 한 줄. 이름·단가는 예약 접수 당시 값이다.
export type OrderItem = {
  productId: string
  optionId: string
  productTitle: string
  optionTitle: string
  unitPrice: number
  // 지금은 늘 1.
  quantity: number
}

// 주문에 저장된 배송지. 상세 주소가 없으면 line2는 null.
export type ShipTo = {
  name: string
  phone: string
  postalCode: string
  line1: string
  line2: string | null
}

// 주문 — 생성·목록 응답. 예약 id와 결제 기한은 들어 있지 않다(기한은 예약 상세의 paymentDueAt).
export type Order = {
  orderId: string
  status: OrderStatus
  source: OrderSource
  // 결제할 금액(원).
  totalAmount: number
  // 지금은 늘 1개.
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

export type OrderListParams = {
  cursor?: string
  // 1~100(기본 20).
  size?: number
}

export type OrderPage = CursorPage<Order>

// POST /api/v1/orders — 금액은 보내지 않는다(서버가 예약 접수 당시 값으로 채운다).
// 같은 예약으로 다시 부르면 200과 기존 주문(새 shipTo는 무시), 처음이면 201.
export type PlaceOrderRequest = {
  source: 'PREORDER'
  // 예약 id(소문자 UUID).
  preorderId: string
  // 상세 주소는 비우면 null로 저장된다. 길이: name 50, phone 20, postalCode 10, line1·line2 200자.
  shipTo: Omit<ShipTo, 'line2'> & { line2?: string | null }
}

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
