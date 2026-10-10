import type { TagProps } from '@shared/ui'

import type { OrderStatus } from './order'

// 카드 머리의 상태 태그 하나(문구·색).
export type StatusTag = { label: string; color: TagProps['color'] }

// 주문 상태별 태그(order 명세의 "화면" 칸). 승인 대기(AUTHORIZING)는 사용자가 기다릴 일이라 결제 대기와 같은 색이다.
export const orderStatusTag: Record<OrderStatus, StatusTag> = {
  AWAITING_PAYMENT: { label: '결제 대기', color: 'yellow' },
  AUTHORIZING: { label: '결제 확인 중', color: 'yellow' },
  AWAITING_CONFIRMATION: { label: '결제 완료', color: 'primary' },
  PREPARING_ITEMS: { label: '배송 준비 중', color: 'primary' },
  READY_TO_SHIP: { label: '배송 준비 중', color: 'primary' },
  SHIPPED: { label: '배송 중', color: 'blue' },
  DELIVERED: { label: '배송 완료', color: 'gray' },
  CANCELING: { label: '취소 처리 중', color: 'gray' },
  CANCELED: { label: '취소 완료', color: 'gray' },
}

// 결제가 끝난 주문 상태 — 승인 결과 판정(confirmTossPayment)과 기존 주문 재진입(PaymentPage)이 같은 기준을 쓴다.
// 여기 없는 상태(결제 대기·승인 중·취소, 명세에 없는 새 값)는 결제 완료로 보지 않는다.
export const PAID_ORDER_STATUSES: readonly OrderStatus[] = [
  'AWAITING_CONFIRMATION',
  'PREPARING_ITEMS',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
]
