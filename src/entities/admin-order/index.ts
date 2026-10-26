// 밖에서는 TanStack Query 훅으로만 들어온다 — 생 API 함수를 내보내면 signal 취소·
// 4xx 재시도 차단을 건너뛰는 길이 열린다.
export {
  useAdminOrder,
  useAdminOrderCounts,
  useAdminOrders,
  useAdvanceShipping,
  useAdvanceShippingBatch,
} from './api/useAdminOrders'
export type { ShippingBatchResult } from './api/useAdminOrders'
export type { ShippingOutcome } from './lib/shippingOutcome'
export {
  adminOrderSourceLabel,
  adminOrderStatusColor,
  adminOrderStatuses,
  adminOrderStatusLabel,
  adminOrderStatusLabels,
  nextShippingStepOf,
  orderActorLabel,
  orderEventReasonLabel,
  orderNo,
  SHIPPING_REASON_MAX,
} from './model/types'
export type {
  AdminOrder,
  AdminOrderEvent,
  AdminOrderRecord,
  AdminOrderSource,
  AdminOrderStatus,
  AdminShippingStep,
  NextShippingStep,
} from './model/types'
