import type {
  ConfirmPaymentResponse,
  Order as OrderDto,
  OrderDetail as OrderDetailDto,
  OrderStatus as OrderStatusDto,
  PaymentAttempt,
} from '@shared/api/types'

// order 서비스의 주문 — 응답 모양 그대로 쓴다. 지금은 사전예약 주문만 있다.
export type Order = OrderDto
export type OrderDetail = OrderDetailDto
export type OrderStatus = OrderStatusDto
export type OrderPaymentAttempt = PaymentAttempt
export type OrderPaymentResult = ConfirmPaymentResponse
