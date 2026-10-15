import type {
  AdminPreorderSummary,
  PreorderStats,
  PreorderStatus,
} from '@shared/api/types'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
// 화면(pages/widgets)은 DTO를 직접 import할 수 없어 여기가 통로가 된다.
export type AdminReservation = AdminPreorderSummary

/** 외부 등록이 재시도까지 다 실패해 관리자 재처리를 기다리는 예약 */
export const isReprocessable = (
  reservation: Pick<AdminReservation, 'registerJobStatus'>,
) => reservation.registerJobStatus === 'DEAD_LETTER'

/* ------------------------------------------------------------------ *
 * 상태 열 — 예약이 어디까지 왔는지
 * ------------------------------------------------------------------ */

/**
 * 원장 상태를 화면 상태로 묶는다. 결제 대기(REGISTERED)도 순번은 잡혔으니 '확정'이고,
 * 결제는 옆 열이 따로 말한다. 재처리 필요는 원장으로는 처리 중(PENDING_SYNC)이지만
 * 관리자가 손대야 하는 건이라 따로 뺀다.
 */
export type ReservationState =
  'PROCESSING' | 'CONFIRMED' | 'REPROCESS_NEEDED' | 'CANCELING' | 'CANCELED'

export const reservationStateLabel: Record<ReservationState, string> = {
  PROCESSING: '처리 중',
  CONFIRMED: '확정',
  REPROCESS_NEEDED: '재처리 필요',
  CANCELING: '취소 중',
  CANCELED: '취소',
}

export const reservationStateColor: Record<
  ReservationState,
  'blue' | 'green' | 'red' | 'gray'
> = {
  PROCESSING: 'blue',
  CONFIRMED: 'green',
  REPROCESS_NEEDED: 'red',
  CANCELING: 'gray',
  CANCELED: 'gray',
}

// 표의 상태 열 너비를 가장 긴 문구에 맞출 때 쓴다(Tag의 widthOptions).
export const reservationStateLabels = Object.values(reservationStateLabel)

const STATE_OF_STATUS: Record<PreorderStatus, ReservationState> = {
  PENDING_SYNC: 'PROCESSING',
  REGISTERED: 'CONFIRMED',
  RESERVED: 'CONFIRMED',
  CANCELING: 'CANCELING',
  CANCELED: 'CANCELED',
}

export const reservationStateOf = (
  reservation: Pick<AdminReservation, 'status' | 'registerJobStatus'>,
): ReservationState =>
  isReprocessable(reservation)
    ? 'REPROCESS_NEEDED'
    : STATE_OF_STATUS[reservation.status]

/* ------------------------------------------------------------------ *
 * 결제 열
 * ------------------------------------------------------------------ */

export type PaymentState = 'PENDING' | 'IN_PROGRESS' | 'PAID' | 'EXPIRED'

export const paymentStateLabel: Record<PaymentState, string> = {
  PENDING: '결제 대기',
  IN_PROGRESS: '결제 중',
  PAID: '결제 완료',
  EXPIRED: '기한 만료',
}

/**
 * 결제 열은 브랜드 색만 쓰고, 두 축을 겹쳐 상태를 가른다. 옆의 상태 열이 의미별
 * 색(파랑·초록·빨강·회색)을 쓰고 있어서, 결제까지 색으로 말하면 두 열이 한 덩어리로
 * 읽힌다.
 *
 * - 색: 아직 결제할 수 있으면 primary, 기한이 지났으면 secondary
 * - 변형: 돈이 들어왔으면 subtle(채움), 아니면 outline(테두리만)
 */
export const paymentStateColor: Record<PaymentState, 'primary' | 'secondary'> =
  {
    PENDING: 'primary',
    IN_PROGRESS: 'primary',
    PAID: 'primary',
    EXPIRED: 'secondary',
  }

export const paymentStateVariant: Record<PaymentState, 'subtle' | 'outline'> = {
  PENDING: 'outline',
  IN_PROGRESS: 'outline',
  PAID: 'subtle',
  EXPIRED: 'outline',
}

export const paymentStateLabels = Object.values(paymentStateLabel)

/**
 * 결제 단계. 외부 등록 전(처리 중)과 취소된 예약은 결제할 게 없어 null이다 — 취소 전에
 * 결제했는지(환불 대상인지)는 목록이 알려주지 않는다.
 */
export function paymentStateOf(
  reservation: Pick<AdminReservation, 'displayStatus'>,
): PaymentState | null {
  switch (reservation.displayStatus) {
    case 'PAYABLE':
      return 'PENDING'
    case 'PAYMENT_IN_PROGRESS':
      return 'IN_PROGRESS'
    case 'PAYMENT_EXPIRED':
      return 'EXPIRED'
    case 'RESERVED':
      return 'PAID'
    default:
      return null
  }
}

/**
 * 결제 기한까지 남은 시간을 사람이 읽는 문구로. 기한이 없거나 지났으면 null.
 * 24시간 기한이라 '3시간 남음'처럼 시간 단위로 보여주고, 1시간 미만만 분으로 쪼갠다.
 */
export function paymentDueLabel(
  paymentDueAt: string | null,
  now = Date.now(),
): string | null {
  if (!paymentDueAt) return null
  const remaining = Date.parse(paymentDueAt) - now
  if (Number.isNaN(remaining) || remaining <= 0) return null

  const minutes = Math.floor(remaining / 60_000)
  if (minutes < 60) return `${minutes}분 남음`
  return `${Math.floor(minutes / 60)}시간 남음`
}

/* ------------------------------------------------------------------ *
 * 지표 카드
 * ------------------------------------------------------------------ */

/**
 * 지표 카드가 나누는 단계. 예약 한 건은 정확히 한 단계에만 속해서, 다섯 카드를
 * 더하면 전체 예약 수가 된다.
 *
 * 확정은 결제까지 끝나야 진짜 확정이다 — 24시간 안에 결제하지 않으면 자동취소돼
 * 순번에서 빠진다. 그래서 결제 대기와 결제 완료로 나눈다.
 */
export type ReservationStage =
  'PROCESSING' | 'PAYMENT_PENDING' | 'PAID' | 'REPROCESS_NEEDED' | 'CANCELED'

export const reservationStageLabel: Record<ReservationStage, string> = {
  PROCESSING: '처리 중',
  PAYMENT_PENDING: '결제 대기',
  PAID: '결제 완료',
  REPROCESS_NEEDED: '재처리 필요',
  CANCELED: '취소',
}

// 객체 키 순서가 카드 순서다 — 정상 흐름(처리 중 → 결제 대기 → 결제 완료) 다음에 예외.
export const reservationStages = Object.keys(
  reservationStageLabel,
) as ReservationStage[]

/**
 * 집계 API로 단계별 건수를 만든다. 재처리 필요(REGISTER 작업 DEAD_LETTER) 예약은
 * 원장으로는 처리 중(PENDING_SYNC)이라, 처리 중에서 빼야 카드끼리 겹치지 않는다.
 * 취소 중(CANCELING)은 곧 취소되므로 취소에 넣는다.
 */
export function countByStage(
  stats: Pick<PreorderStats, 'preorders' | 'syncJobs'>,
): Record<ReservationStage, number> {
  const { preorders } = stats
  const reprocessNeeded = stats.syncJobs.REGISTER.DEAD_LETTER
  return {
    PROCESSING: Math.max(0, preorders.PENDING_SYNC - reprocessNeeded),
    PAYMENT_PENDING: preorders.REGISTERED,
    PAID: preorders.RESERVED,
    REPROCESS_NEEDED: reprocessNeeded,
    CANCELED: preorders.CANCELING + preorders.CANCELED,
  }
}

/**
 * 예약 번호는 서버가 UUID로만 내려준다. 운영자가 눈으로 읽고 서로 부를 수 있는
 * 짧은 번호가 필요해서 UUID에서 안정적으로 5자리를 만들어 쓴다.
 * 서버가 사람이 읽을 수 있는 번호를 내려주기 시작하면 이 함수를 지우고 그 필드를 쓴다.
 */
export function reservationNo(preorderId: string) {
  let hash = 0
  for (const char of preorderId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100_000
  }
  return `RSV-${String(hash).padStart(5, '0')}`
}
