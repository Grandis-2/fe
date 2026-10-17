import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  ConfirmPaymentRequest,
  OrderListParams,
  OrderPage,
  PlaceOrderRequest,
} from '@shared/api/types'

import type {
  CanceledOrder,
  OrderDetail,
  OrderPaymentAttempt,
  OrderPaymentResult,
  PlacedOrder,
} from '../model/order'

const path = (orderId: string) =>
  `/api/v1/orders/${encodeURIComponent(orderId)}`

// [order] GET /api/v1/orders — 내 주문 목록
// 내 주문 — 최신순, 커서 페이지.
export const getOrders = (params: OrderListParams, signal?: AbortSignal) =>
  apiClient.request<OrderPage>(`/api/v1/orders${toQueryString(params)}`, {
    signal,
  })

// [order] GET /api/v1/orders/{orderId} — 내 주문 상세
// 주문 상세 + 상태 이력. 결제 승인이 PENDING이거나 500·503·504로 끝났으면 이걸 폴링한다.
export const getOrder = (orderId: string, signal?: AbortSignal) =>
  apiClient.request<OrderDetail>(path(orderId), { signal })

// [order] POST /api/v1/orders — 주문 생성
// ① 주문 생성 — 장바구니에서 고른 줄(CART), 바로 구매(BUY_NOW), 결제 가능해진 예약(PREORDER). 금액은 서버가 계산한다.
// 같은 본문으로 다시 부르면 기존 주문(reused)이 오므로 네트워크 오류·503은 그대로 다시 보내도 된다.
// 바로 구매는 idempotencyKey(UUID)가 필수다 — 다시 보낼 땐 같은 키, 키가 다르면 같은 내용이어도 새 주문이다.
export const placeOrder = ({
  idempotencyKey,
  ...body
}:
  | (PlaceOrderRequest & {
      source: 'CART' | 'PREORDER'
      idempotencyKey?: never
    })
  | (PlaceOrderRequest & { source: 'BUY_NOW'; idempotencyKey: string })) =>
  apiClient.request<PlacedOrder>('/api/v1/orders', {
    method: 'POST',
    body,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  })

// [order] POST /api/v1/orders/{orderId}/cancel — 주문 취소(결제 전)
// 결제 전 장바구니·바로 구매 주문 취소(본문 없음). 이미 취소됐으면 같은 응답. 사전예약 주문은 예약 취소로 한다.
export const cancelOrder = (orderId: string) =>
  apiClient.request<CanceledOrder>(`${path(orderId)}/cancel`, {
    method: 'POST',
  })

// [order] POST /api/v1/orders/{orderId}/payment-attempts — 결제 준비
// ② 결제 준비 — 토스 결제창을 열기 직전에(본문 없음). 부를 때마다 새 tossOrderId가 나온다.
export const createPaymentAttempt = (orderId: string) =>
  apiClient.request<OrderPaymentAttempt>(`${path(orderId)}/payment-attempts`, {
    method: 'POST',
  })

// [order] POST /api/v1/orders/{orderId}/payment-attempts/{tossOrderId}/confirm — 결제 승인
// ③ 결제 승인 — successUrl 쿼리(orderId=tossOrderId, paymentKey, amount)를 옮겨 보낸다. 최대 70초 걸릴 수 있다.
// 500·503·네트워크 오류면 결제 준비를 다시 부르지 말고 같은 값으로 한 번 더 보낸 뒤 주문 상세를 폴링한다.
export const confirmOrderPayment = ({
  orderId,
  tossOrderId,
  ...body
}: ConfirmPaymentRequest & { orderId: string; tossOrderId: string }) =>
  apiClient.request<OrderPaymentResult>(
    `${path(orderId)}/payment-attempts/${encodeURIComponent(tossOrderId)}/confirm`,
    { method: 'POST', body },
  )
