import {
  adminOrderStatusLabel,
  type AdminOrderRecord,
  type AdminOrderStatus,
} from '@entities/admin-order'
import { formatShortDateTime } from '@shared/lib/formatDotDate'
import type { ProgressStep } from '@shared/ui'

// 결제 완료부터 배송 완료까지 — 관리자가 한 칸씩 옮기는 흐름. 맨 앞 '주문'은 만든 시각이다.
const FLOW: { status: AdminOrderStatus; label: string }[] = [
  { status: 'AWAITING_CONFIRMATION', label: '결제 완료' },
  { status: 'PREPARING_ITEMS', label: '상품 준비' },
  { status: 'READY_TO_SHIP', label: '출고 대기' },
  { status: 'SHIPPED', label: '배송 중' },
  { status: 'DELIVERED', label: '배송 완료' },
]

/** 그 상태가 된 마지막 시각. 아직 안 됐으면 undefined */
export const enteredAt = (order: AdminOrderRecord, status: AdminOrderStatus) =>
  order.events.findLast((event) => event.toStatus === status)?.createdAt

/**
 * 주문이 어디까지 왔는지. 지난 칸은 시각, 다음 칸은 '다음 단계'로 테두리를 두르고, 결제 전이면
 * 결제 완료 칸에 지금 결제 상태를 적는다. 취소된 주문은 멈춘 자리 뒤를 '—'로 둔다.
 */
export function progressSteps(order: AdminOrderRecord): ProgressStep[] {
  const reached = FLOW.findLastIndex(({ status }) => enteredAt(order, status))
  const canceled = order.status === 'CANCELING' || order.status === 'CANCELED'

  return [
    {
      key: 'ordered',
      label: '주문',
      detail: formatShortDateTime(order.createdAt),
      tone: 'done',
    },
    ...FLOW.map(({ status, label }, index): ProgressStep => {
      const at = enteredAt(order, status)
      if (index <= reached && at)
        return {
          key: status,
          label,
          detail: formatShortDateTime(at),
          tone: 'done',
        }
      if (index === reached + 1 && !canceled)
        return {
          key: status,
          label,
          detail:
            index === 0 ? adminOrderStatusLabel[order.status] : '다음 단계',
          tone: 'now',
        }
      return { key: status, label, detail: '—', tone: 'todo' }
    }),
  ]
}
