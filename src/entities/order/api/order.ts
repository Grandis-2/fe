import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  ConfirmPaymentRequest,
  OrderListParams,
  OrderPage,
  PlaceOrderRequest,
} from '@shared/api/types'

import type {
  OrderDetail,
  OrderPaymentAttempt,
  OrderPaymentResult,
  Order,
} from '../model/order'

const path = (orderId: string) =>
  `/api/v1/orders/${encodeURIComponent(orderId)}`

// 내 주문 — 최신순, 커서 페이지.
export const getOrders = (params: OrderListParams, signal?: AbortSignal) =>
  apiClient.request<OrderPage>(`/api/v1/orders${toQueryString(params)}`, {
    signal,
  })

// 주문 상세 + 상태 이력. 결제 승인이 PENDING이거나 500·503·504로 끝났으면 이걸 폴링한다.
export const getOrder = (orderId: string, signal?: AbortSignal) =>
  apiClient.request<OrderDetail>(path(orderId), { signal })

// ① 주문 생성 — 결제 가능(PAYABLE)해진 예약으로. 금액은 보내지 않는다.
// 같은 예약으로 다시 부르면 기존 주문이 오므로 네트워크 오류·503은 같은 본문으로 다시 보내도 된다.
export const placeOrder = (body: PlaceOrderRequest) =>
  apiClient.request<Order>('/api/v1/orders', { method: 'POST', body })

// ② 결제 준비 — 토스 결제창을 열기 직전에(본문 없음). 부를 때마다 새 tossOrderId가 나온다.
export const createPaymentAttempt = (orderId: string) =>
  apiClient.request<OrderPaymentAttempt>(`${path(orderId)}/payment-attempts`, {
    method: 'POST',
  })

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
