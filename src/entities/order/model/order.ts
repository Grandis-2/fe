import type {
  CancelOrderResponse,
  CartOrderItem as CartOrderItemDto,
  ConfirmPaymentResponse,
  Order as OrderDto,
  OrderDetail as OrderDetailDto,
  OrderStatus as OrderStatusDto,
  PaymentAttempt,
  PlaceOrderResponse,
} from '@shared/api/types'

// order 서비스의 주문 — 응답 모양 그대로 쓴다. 장바구니(CART)·사전예약(PREORDER)·드로우 당첨(DRAW) 주문이 있다.
export type Order = OrderDto
export type OrderDetail = OrderDetailDto
export type OrderStatus = OrderStatusDto
export type OrderPaymentAttempt = PaymentAttempt
export type OrderPaymentResult = ConfirmPaymentResponse
export type PlacedOrder = PlaceOrderResponse
export type CanceledOrder = CancelOrderResponse
export type CartOrderItem = CartOrderItemDto
