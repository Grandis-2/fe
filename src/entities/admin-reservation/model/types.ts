import type {
  AdminPreorderDetail,
  AdminPreorderSort,
  AdminPreorderSummary,
  PreorderEvent,
  PreorderStats,
  PreorderStatus,
  SyncJob,
  SyncJobStatus,
} from '@shared/api/types'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
// 화면(pages/widgets)은 DTO를 직접 import할 수 없어 여기가 통로가 된다.
export type AdminReservation = AdminPreorderSummary
export type ReservationEvent = PreorderEvent
export type ReservationSyncJob = SyncJob
export type ReservationSort = AdminPreorderSort

/**
 * 예약 상세. 목록 한 줄처럼 REGISTER 작업 상태를 붙여 둔다 — 상태 태그·재처리 판단을
 * 목록과 같은 함수로 하려고(toAdminReservationDetail).
 */
export type AdminReservationDetail = AdminPreorderDetail &
  Pick<AdminPreorderSummary, 'registerJobStatus'>

/** 내부 메모 최대 길이 — 넘으면 서버가 400 */
export const RESERVATION_NOTE_MAX = 1000
/** 관리자 취소 사유 길이(앞뒤 공백 제외) — 서버가 5~500자만 받는다 */
export const RESERVATION_CANCEL_REASON_MIN = 5
export const RESERVATION_CANCEL_REASON_MAX = 500

/** 이력의 원장 상태 문구 */
export const preorderStatusLabel: Record<PreorderStatus, string> = {
  PENDING_SYNC: '접수',
  REGISTERED: '결제 대기',
  RESERVED: '예약 확정',
  CANCELING: '취소 중',
  CANCELED: '취소',
}

export const actorLabel: Record<PreorderEvent['actor'], string> = {
  USER: '회원',
  ADMIN: '관리자',
  SYSTEM: '시스템',
}

export const syncJobTypeLabel: Record<SyncJob['jobType'], string> = {
  REGISTER: '외부 등록',
  CANCEL: '외부 취소',
}

export const syncJobStatusLabel: Record<SyncJobStatus, string> = {
  PENDING: '대기',
  PROCESSING: '처리 중',
  RETRY_SCHEDULED: '재시도 대기',
  SUCCEEDED: '성공',
  DEAD_LETTER: '재처리 필요',
  CANCELED: '무효',
}

/** '2026.11.02 ~ 2026.11.06', 하루면 날짜 하나 */
export const formatShipPeriod = ({
  estimatedShipStart: start,
  estimatedShipEnd: end,
}: AdminReservation['shipmentBatch']) => {
  const dot = (date: string) => date.replaceAll('-', '.')
  return start === end ? dot(start) : `${dot(start)} ~ ${dot(end)}`
}

/** 외부 등록이 재시도까지 다 실패해 관리자 재처리를 기다리는 예약 */
export const isReprocessable = (
  reservation: Pick<AdminReservation, 'registerJobStatus'>,
) => reservation.registerJobStatus === 'DEAD_LETTER'

/* ------------------------------------------------------------------ *
 * 상태 열 — 예약이 어디까지 왔는지
 * ------------------------------------------------------------------ */

/**
 * 원장 상태를 화면 상태로 묶는다. 결제 대기(REGISTERED)도 순번은 잡혔으니 '확정'이고,
 * 결제는 옆 열이 따로 말한다. 외부 등록 실패는 원장으로는 처리 중(PENDING_SYNC)이지만
 * 관리자가 손대야 하는 건이라 따로 뺀다.
 */
export type ReservationState =
  'PROCESSING' | 'CONFIRMED' | 'REPROCESS_NEEDED' | 'CANCELING' | 'CANCELED'

export const reservationStateLabel: Record<ReservationState, string> = {
  PROCESSING: '처리 중',
  CONFIRMED: '확정',
  // 버튼 이름은 '재처리' 그대로 — 무엇이 실패했는지를 상태로 말한다.
  REPROCESS_NEEDED: '외부 등록 실패',
  CANCELING: '취소 중',
  CANCELED: '취소',
}

// 처리 중은 테두리만, 확정은 채운 브랜드 색 — 같은 색 안에서 진행 중과 끝남을 나눈다.
export const reservationStateColor: Record<
  ReservationState,
  'primary' | 'red' | 'gray'
> = {
  PROCESSING: 'primary',
  CONFIRMED: 'primary',
  REPROCESS_NEEDED: 'red',
  CANCELING: 'gray',
  CANCELED: 'gray',
}

export const reservationStateVariant: Record<
  ReservationState,
  'subtle' | 'outline'
> = {
  PROCESSING: 'outline',
  CONFIRMED: 'subtle',
  REPROCESS_NEEDED: 'subtle',
  CANCELING: 'subtle',
  CANCELED: 'subtle',
}

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

/** 결제 기한이 이만큼 안 남았으면 강조한다 */
const PAYMENT_DUE_SOON_MS = 3 * 60 * 60 * 1000

/** 결제 기한이 곧인지 — 기한이 없거나 이미 지났으면 false */
export function isPaymentDueSoon(
  paymentDueAt: string | null,
  now = Date.now(),
): boolean {
  if (!paymentDueAt) return false
  const remaining = Date.parse(paymentDueAt) - now
  return remaining > 0 && remaining < PAYMENT_DUE_SOON_MS
}

/* ------------------------------------------------------------------ *
 * 지표 카드
 * ------------------------------------------------------------------ */

/**
 * 지표 카드. 표 위 탭(전체·확정·처리 중·외부 등록 실패·취소)과 같은 칸이라, 카드 숫자가
 * 그 탭을 눌렀을 때 나올 건수다. 확정은 결제 대기와 결제 완료를 합친 것이다 — 결제는
 * 표의 결제 열이 따로 보여준다. 전체를 뺀 네 카드를 더하면 전체가 된다.
 */
export type ReservationStage =
  'ALL' | 'CONFIRMED' | 'PROCESSING' | 'REPROCESS_NEEDED' | 'CANCELED'

export const reservationStageLabel: Record<ReservationStage, string> = {
  ALL: '전체',
  CONFIRMED: '확정',
  PROCESSING: '처리 중',
  REPROCESS_NEEDED: '외부 등록 실패',
  CANCELED: '취소',
}

/**
 * 집계 API로 카드별 건수를 만든다. 외부 등록 실패(REGISTER 작업 DEAD_LETTER) 예약은
 * 원장으로는 처리 중(PENDING_SYNC)이라, 처리 중에서 빼야 카드끼리 겹치지 않는다.
 * 취소 중(CANCELING)은 곧 취소되므로 취소에 넣는다.
 */
export function countByStage(
  stats: Pick<PreorderStats, 'preorders' | 'syncJobs'>,
): Record<ReservationStage, number> {
  const { preorders } = stats
  const reprocessNeeded = stats.syncJobs.REGISTER.DEAD_LETTER
  return {
    ALL: Object.values(preorders).reduce((sum, count) => sum + count, 0),
    CONFIRMED: preorders.REGISTERED + preorders.RESERVED,
    PROCESSING: Math.max(0, preorders.PENDING_SYNC - reprocessNeeded),
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
