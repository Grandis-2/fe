import type {
  AdminMember,
  PaymentStatus,
  ReservationFailureCode,
  ReservationPayment,
  ReservationStatus,
  ReservationSummary,
} from '@shared/api/types'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
// 화면(pages/widgets)은 DTO를 직접 import할 수 없어 여기가 통로가 된다.
export type AdminReservation = ReservationSummary
export type AdminReservationStatus = ReservationStatus
export type AdminReservationFailureCode = ReservationFailureCode
export type AdminReservationPayment = ReservationPayment
export type AdminPaymentStatus = PaymentStatus
export type AdminMemberModel = AdminMember

/**
 * 화면 문구는 상태 4종을 그대로 쓴다.
 * ACCEPTED가 '처리 중'이다 — 접수는 되었지만 외부 등록이 아직 안 끝난 상태다.
 * FAILED는 '재처리 필요'다 — '확정 실패'라고 쓰면 끝난 것처럼 보이는데, 실제로는
 * 자동 재시도가 소진돼서 관리자 재처리를 기다리는 상태다.
 */
export const reservationStatusLabel: Record<ReservationStatus, string> = {
  ACCEPTED: '처리 중',
  CONFIRMED: '확정',
  FAILED: '재처리 필요',
  CANCELED: '취소',
}

export const reservationStatusColor: Record<
  ReservationStatus,
  'blue' | 'green' | 'red' | 'gray'
> = {
  ACCEPTED: 'blue',
  CONFIRMED: 'green',
  FAILED: 'red',
  CANCELED: 'gray',
}

// 표의 상태 열 너비를 가장 긴 문구에 맞출 때 쓴다(Tag의 widthOptions).
export const reservationStatusLabels = Object.values(reservationStatusLabel)

export const failureCodeLabel: Record<ReservationFailureCode, string> = {
  BUSINESS_REJECTED: '업무 거절',
  STOCK_EXHAUSTED: '재고 소진',
  RETRY_EXHAUSTED: '재시도 상한 초과',
  DEADLINE_EXCEEDED: '기한 초과',
  INTEGRATION_ERROR: '연동 오류',
}

/** 목록이 내려준 실패 코드의 화면 문구. 모르는 코드는 원문을 그대로 보여준다 */
export const failureLabelOf = (code: ReservationFailureCode | null) =>
  code ? (failureCodeLabel[code] ?? code) : null

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: '결제 대기',
  PAID: '결제 완료',
  EXPIRED: '기한 만료',
  REFUNDED: '환불 완료',
}

export const paymentStatusColor: Record<
  PaymentStatus,
  'yellow' | 'green' | 'red' | 'gray'
> = {
  // 결제 대기는 '아직 안 됨'이지 오류가 아니라서 노랑이다 — 기한이 지나면 빨강으로 간다.
  PENDING: 'yellow',
  PAID: 'green',
  EXPIRED: 'red',
  REFUNDED: 'gray',
}

export const paymentStatusLabels = Object.values(paymentStatusLabel)

/**
 * 결제 기한까지 남은 시간을 사람이 읽는 문구로. 기한이 지났으면 null.
 * 24시간 기한이라 '3시간 남음'처럼 시간 단위로 보여주고, 1시간 미만만 분으로 쪼갠다.
 */
export function paymentDueLabel(
  payment: ReservationPayment,
  now = Date.now(),
): string | null {
  const remaining = Date.parse(payment.dueAt) - now
  if (Number.isNaN(remaining) || remaining <= 0) return null

  const minutes = Math.floor(remaining / 60_000)
  if (minutes < 60) return `${minutes}분 남음`
  return `${Math.floor(minutes / 60)}시간 남음`
}

/**
 * 지표 카드가 나누는 단계. 예약 한 건은 정확히 한 단계에만 속해서, 다섯 카드를
 * 더하면 전체 예약 수가 된다.
 *
 * 확정(CONFIRMED)은 순번이 잡힌 상태일 뿐이고, 결제까지 끝나야 진짜 확정이다 —
 * 24시간 안에 결제하지 않으면 자동취소돼 순번에서 빠진다. 그래서 확정을 결제
 * 상태로 한 번 더 나눈다.
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

export function reservationStageOf(
  reservation: Pick<ReservationSummary, 'status' | 'payment'>,
): ReservationStage {
  switch (reservation.status) {
    case 'ACCEPTED':
      return 'PROCESSING'
    case 'FAILED':
      return 'REPROCESS_NEEDED'
    case 'CANCELED':
      return 'CANCELED'
    case 'CONFIRMED':
      // 결제 정보가 아직 없어도 결제가 끝난 건 아니므로 결제 대기로 본다.
      return reservation.payment?.status === 'PAID' ? 'PAID' : 'PAYMENT_PENDING'
  }
}

/** 단계별 건수. 없는 단계도 0으로 채워 둔다 */
export function countByStage(
  reservations: Pick<ReservationSummary, 'status' | 'payment'>[],
) {
  const counts = Object.fromEntries(
    reservationStages.map((stage) => [stage, 0]),
  ) as Record<ReservationStage, number>
  for (const reservation of reservations) {
    counts[reservationStageOf(reservation)] += 1
  }
  return counts
}

/**
 * 예약 번호는 서버가 UUID로만 내려준다. 운영자가 눈으로 읽고 서로 부를 수 있는
 * 짧은 번호가 필요해서 UUID에서 안정적으로 5자리를 만들어 쓴다.
 * 서버가 사람이 읽을 수 있는 번호를 내려주기 시작하면 이 함수를 지우고 그 필드를 쓴다.
 */
export function reservationNo(reservationId: string) {
  let hash = 0
  for (const char of reservationId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100_000
  }
  return `RSV-${String(hash).padStart(5, '0')}`
}

/**
 * 관리자가 재처리를 걸어도 되는 건인지.
 *
 * 자동 재시도가 다 소진된 건만 사람이 손볼 대상이고, 그 상태가 FAILED다. 아직
 * ACCEPTED인 건은 시스템이 재시도를 돌리는 중이라 관리자가 끼어들 게 없다 —
 * 그래서 대시보드의 '재처리 필요'(REGISTER의 deadCount)와 버튼이 열리는 행 수가 같다.
 */
export const isReprocessable = (reservation: ReservationSummary) =>
  reservation.status === 'FAILED'
