import type {
  AdminMember,
  AdminStatsResponse,
  ReservationCommand,
  ReservationDetail,
  ReservationFailureCode,
  ReservationHistoryEntry,
  ReservationStatus,
  ReservationSummary,
} from '@/shared/api/types'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
// 화면(pages/widgets)은 DTO를 직접 import할 수 없어 여기가 통로가 된다.
export type AdminReservation = ReservationSummary
export type AdminReservationDetail = ReservationDetail
export type AdminReservationCommand = ReservationCommand
export type AdminReservationHistoryEntry = ReservationHistoryEntry
export type AdminReservationStatus = ReservationStatus
export type AdminReservationFailureCode = ReservationFailureCode
export type AdminStats = AdminStatsResponse
export type AdminMemberModel = AdminMember

/**
 * 화면 문구는 상태 4종을 그대로 쓴다.
 * ACCEPTED가 '처리 중'이다 — 접수는 되었지만 외부 등록이 아직 안 끝난 상태다.
 */
export const reservationStatusLabel: Record<ReservationStatus, string> = {
  ACCEPTED: '처리 중',
  CONFIRMED: '확정',
  FAILED: '확정 실패',
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

// 표의 상태 열 너비를 가장 긴 문구('확정 실패')에 맞출 때 쓴다(Tag의 widthOptions).
export const reservationStatusLabels = Object.values(reservationStatusLabel)

export const failureCodeLabel: Record<ReservationFailureCode, string> = {
  BUSINESS_REJECTED: '업무 거절',
  STOCK_EXHAUSTED: '재고 소진',
  RETRY_EXHAUSTED: '재시도 상한 초과',
  DEADLINE_EXCEEDED: '기한 초과',
  INTEGRATION_ERROR: '연동 오류',
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
 * 확정 실패 사유. 목록은 failureCode를, 상세는 failure 객체를 내려준다.
 * 상세의 failure 스키마가 명세에 없어서, 비어 있으면 REGISTER 지시의
 * lastErrorCode로 대신 채운다.
 */
export function failureLabelOf(detail: ReservationDetail) {
  const code =
    detail.failure?.code ??
    detail.commands.find((command) => command.kind === 'REGISTER')
      ?.lastErrorCode

  if (!code) return null
  return failureCodeLabel[code as ReservationFailureCode] ?? code
}

/** 상세에는 registerAttemptCount가 없어 REGISTER 지시에서 꺼낸다 */
export const registerAttemptCountOf = (detail: ReservationDetail) =>
  detail.commands.find((command) => command.kind === 'REGISTER')
    ?.attemptCount ?? 0

/** 지시가 DLQ로 떨어졌는지 — 재처리/강제 종결을 열어줄 기준이다 */
export const isDeadLettered = (detail: ReservationDetail) =>
  detail.commands.some((command) => command.status === 'DEAD')

/** 종단 상태인데 뒷정리가 남았는지 */
export const hasPendingCleanup = (
  reservation: Pick<ReservationSummary, 'cleanup'>,
) =>
  Object.values(reservation.cleanup).some((state) => state !== 'NOT_REQUIRED')

/** 확정 실패 건수 합 — stats는 사유별로만 내려준다 */
export const failedCountOf = (stats: AdminStatsResponse) =>
  Object.values(stats.registration.failedByReason).reduce(
    (total, count) => total + count,
    0,
  )
