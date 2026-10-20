import type { AdminOrderStatus } from '@entities/admin-order'

/** 결제 뒤 배송까지 관리자가 손대는 단계 — 운영 대시보드 주문 카드가 이 순서로 그린다 */
export const ORDER_SUMMARY_STEPS = [
  'AWAITING_CONFIRMATION',
  'PREPARING_ITEMS',
  'READY_TO_SHIP',
  'SHIPPED',
] as const satisfies readonly AdminOrderStatus[]

export type OrderSummaryStep = (typeof ORDER_SUMMARY_STEPS)[number]
