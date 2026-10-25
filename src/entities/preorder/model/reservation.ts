import type {
  PreorderDetail,
  PreorderDisplayStatus,
  PreorderEvent,
  PreorderSummary,
} from '@shared/api/types'
import type { TagProps } from '@shared/ui'

// 내 사전예약(preorder 서비스의 예약 원장). 프로모션 목업(Preorder)과 다른 것 — 응답 모양 그대로 쓴다.
// 시각은 ISO 문자열, 판단은 status로, 화면 문구·버튼은 displayStatus로 한다.
export type Reservation = PreorderSummary
export type ReservationDetail = PreorderDetail
export type ReservationEvent = PreorderEvent
export type ReservationDisplayStatus = PreorderDisplayStatus

// 예약 화면 단계별 태그(문구·색). 결제가 필요한 단계는 노란색으로 눈에 띄게 한다.
export const reservationStatusTag: Record<
  PreorderDisplayStatus,
  { label: string; color: TagProps['color'] }
> = {
  RECEIVED: { label: '접수 완료', color: 'gray' },
  PROCESSING: { label: '예약 처리 중', color: 'gray' },
  PAYABLE: { label: '구매 확정 대기', color: 'yellow' },
  PAYMENT_IN_PROGRESS: { label: '결제 진행 중', color: 'yellow' },
  PAYMENT_EXPIRED: { label: '결제 기한 지남', color: 'gray' },
  RESERVED: { label: '예약 확정', color: 'primary' },
  CANCELING: { label: '취소 처리 중', color: 'gray' },
  CANCELED: { label: '취소 완료', color: 'gray' },
}

// 구매 확정(결제)이 필요한 단계 — 결제창을 열었다 닫아 결제 진행 중으로 남은 예약도 다시 결제해야 한다.
// 사전예약 내역의 '구매 확정이 필요해요' 묶음과 헤더·마이페이지 메뉴의 숫자가 같이 쓴다.
export const NEEDS_PURCHASE: ReservationDisplayStatus[] = [
  'PAYABLE',
  'PAYMENT_IN_PROGRESS',
]

// 누가 왜 취소했는지 — 취소를 시작한 이력 한 줄(→ 취소 중, 또는 바로 취소 완료)로 가른다.
// 서버엔 '등록 실패' 상태가 없다. 외부 등록이 끝내 안 되면 작업이 재처리 대기(DEAD_LETTER)로 남아 예약은 처리 중이고,
// 운영자가 재처리하거나 취소한다. 그래서 처리 중에서 운영자가 취소한 예약이 사용자에겐 '등록 실패'다.
// 서버가 스스로 취소하는 건 결제 기한 만료뿐이다(SYSTEM).
export type CancelCause = 'USER' | 'EXPIRY' | 'REGISTER_FAILED' | 'ADMIN'
export const cancelCause = (
  events: readonly ReservationEvent[],
): { cause: CancelCause; reason: string | null } | null => {
  const started = events.findLast(
    ({ fromStatus, toStatus }) =>
      toStatus === 'CANCELING' ||
      (toStatus === 'CANCELED' && fromStatus !== 'CANCELING'),
  )
  if (!started) return null
  const { actor, fromStatus, reason } = started
  const cause: CancelCause =
    actor === 'USER'
      ? 'USER'
      : actor === 'SYSTEM'
        ? 'EXPIRY'
        : fromStatus === 'PENDING_SYNC'
          ? 'REGISTER_FAILED'
          : 'ADMIN'
  return { cause, reason }
}

// 서버 처리를 기다리다 자동 조회를 늦췄을 때의 안내(useReservation의 timedOut). 지금 단계에 맞는 문구를 고른다.
// 예약 접수·결제 화면이 같이 쓴다. 외부 등록은 끝내 안 되면 운영자가 처리하므로 '순서는 그대로'처럼 약속하지 않는다.
const registerDelayed = {
  title: '등록이 평소보다 오래 걸리고 있어요.',
  description:
    '외부 예약 시스템이 응답하지 않아 자동으로 다시 시도하고 있어요. 계속 안 되면 운영자가 확인해 처리하고, 결과는 이 화면과 사전예약 내역에 표시돼요.',
}
export const SETTLE_DELAYED_NOTICE: Partial<
  Record<ReservationDisplayStatus, { title: string; description: string }>
> = {
  RECEIVED: registerDelayed,
  PROCESSING: registerDelayed,
  PAYMENT_EXPIRED: {
    title: '기한이 지난 예약을 아직 취소하고 있어요.',
    description: '잠시 뒤 다시 확인해 주세요.',
  },
  CANCELING: {
    title: '취소가 평소보다 오래 걸리고 있어요.',
    description:
      '결제한 예약이면 환불이 끝나야 취소가 완료돼요. 환불 결과는 주문 내역에서 확인해 주세요.',
  },
}
