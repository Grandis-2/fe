import type {
  AdminOrderDetail,
  AdminOrderSummary,
  OrderEvent,
  OrderSource,
  OrderStatus,
  ShippingStep,
} from '@shared/api/types'
import { shortId } from '@shared/lib/shortId'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
export type AdminOrder = AdminOrderSummary
export type AdminOrderRecord = AdminOrderDetail
export type AdminOrderEvent = OrderEvent
export type AdminOrderStatus = OrderStatus
export type AdminOrderSource = OrderSource
export type AdminShippingStep = ShippingStep

/** 배송 단계 사유 길이(서버 검증과 같다 — 코드 포인트 기준) */
export const SHIPPING_REASON_MAX = 500

/**
 * 관리자가 보는 상태 이름. 회원 화면은 상품 준비·출고 대기를 '배송 준비 중' 하나로
 * 묶지만, 관리자는 다음에 누를 단계가 달라 나눠 보여준다.
 */
export const adminOrderStatusLabel: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: '결제 대기',
  AUTHORIZING: '결제 확인 중',
  AWAITING_CONFIRMATION: '결제 완료',
  PREPARING_ITEMS: '상품 준비 중',
  READY_TO_SHIP: '출고 대기',
  SHIPPED: '배송 중',
  DELIVERED: '배송 완료',
  CANCELING: '취소 처리 중',
  CANCELED: '취소됨',
}

export const adminOrderStatusColor: Record<
  OrderStatus,
  'yellow' | 'primary' | 'blue' | 'green' | 'gray' | 'red'
> = {
  AWAITING_PAYMENT: 'yellow',
  AUTHORIZING: 'yellow',
  AWAITING_CONFIRMATION: 'red',
  PREPARING_ITEMS: 'primary',
  READY_TO_SHIP: 'primary',
  SHIPPED: 'blue',
  DELIVERED: 'green',
  CANCELING: 'gray',
  CANCELED: 'gray',
}

// 객체 키 순서가 필터 순서다.
export const adminOrderStatuses = Object.keys(
  adminOrderStatusLabel,
) as OrderStatus[]

// 표의 상태 열 너비를 가장 긴 문구에 맞출 때 쓴다(Tag의 widthOptions).
export const adminOrderStatusLabels = Object.values(adminOrderStatusLabel)

export const adminOrderSourceLabel: Record<OrderSource, string> = {
  CART: '장바구니',
  BUY_NOW: '바로 구매',
  PREORDER: '사전예약',
  DRAW: '럭키드로우 당첨',
}

export const adminOrderSources = Object.keys(
  adminOrderSourceLabel,
) as OrderSource[]

/** 화면에 보이는 짧은 주문 번호 — 회원 화면의 주문번호와 같다. 전체 id는 상세에서 본다 */
export const orderNo = shortId

export type NextShippingStep = {
  step: ShippingStep
  /** 버튼 문구 */
  label: string
  /** 사유 칸에 미리 채워 둘 문구 */
  defaultReason: string
  to: OrderStatus
}

// 상태 → 다음 배송 단계(명세 표). 건너뛸 수 없어 지금 상태에서 갈 수 있는 건 하나뿐이다.
const NEXT_STEP: Partial<Record<OrderStatus, NextShippingStep>> = {
  AWAITING_CONFIRMATION: {
    step: 'PREPARATION_STARTED',
    label: '배송 준비 시작',
    defaultReason: '배송 준비를 시작합니다.',
    to: 'PREPARING_ITEMS',
  },
  PREPARING_ITEMS: {
    step: 'PACKED',
    label: '포장 완료',
    defaultReason: '포장을 마쳤습니다.',
    to: 'READY_TO_SHIP',
  },
  READY_TO_SHIP: {
    step: 'SHIPPED',
    label: '출고',
    defaultReason: '택배사에 넘겼습니다.',
    to: 'SHIPPED',
  },
  SHIPPED: {
    step: 'DELIVERED',
    label: '배송 완료',
    defaultReason: '배송을 마쳤습니다.',
    to: 'DELIVERED',
  },
}

/** 지금 상태에서 누를 수 있는 배송 단계. 결제 전·취소·배송 완료면 없다 */
export const nextShippingStepOf = (status: OrderStatus) =>
  NEXT_STEP[status] ?? null

// 시스템 사유 코드 → 문구. 콜론 뒤에 세부 코드가 붙는 것(PAYMENT_DECLINED:CARD_REJECTED)은 앞만 본다.
const systemReasonLabels: Record<string, string> = {
  PAYMENT_APPROVED: '결제 승인',
  PAYMENT_DECLINED: '결제 거절',
  PAYMENT_NOT_STARTED: '결제창을 쓸 수 없어 결제 대기로 되돌림',
  PAYMENT_EXPIRED: '결제 기한 만료로 취소',
  REPLACED_BY_NEW_ORDER: '새 장바구니 주문으로 대체되어 취소',
  DRAW_WON: '럭키드로우 당첨으로 생성',
  PREORDER_CANCEL: '예약 취소',
  PREORDER_CANCELED: '취소된 예약의 미결제 주문 정리',
  REFUND_COMPLETED: '환불 완료',
  REFUND_FAILED: '환불 실패',
}

/** 이력 사유. 관리자 사유는 그대로, 시스템 코드는 문구로(모르는 코드는 코드 그대로) */
export const orderEventReasonLabel = ({ actor, reason }: OrderEvent) => {
  if (reason === null || actor !== 'SYSTEM') return reason
  const [code, detail] = reason.split(':')
  const label = systemReasonLabels[code] ?? reason
  return detail && systemReasonLabels[code] ? `${label}(${detail})` : label
}

export const orderActorLabel: Record<OrderEvent['actor'], string> = {
  USER: '회원',
  ADMIN: '관리자',
  SYSTEM: '시스템',
}
