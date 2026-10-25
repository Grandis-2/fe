import type {
  DeadLetterDetail,
  DeadLetterFailureReason,
  DeadLetterStatus,
  DeadLetterSummary,
} from '@shared/api/types'

// 서버 응답과 화면이 쓰는 모양이 같아서 매퍼 없이 그대로 재노출한다.
export type DeadLetter = DeadLetterSummary
export type DeadLetterRecord = DeadLetterDetail
export type { DeadLetterFailureReason, DeadLetterStatus }

/** 버리기 사유 길이(서버 검증과 같다) */
export const DEAD_LETTER_DISCARD_NOTE_MAX = 500

/** DLQ가 있는 서비스 — 주소·관련 대상(예약/주문)·이벤트 종류가 갈린다 */
export type DeadLetterService = 'preorder' | 'payment'

export const deadLetterServiceLabel: Record<DeadLetterService, string> = {
  preorder: '예약',
  payment: '결제',
}

export const deadLetterServices = Object.keys(
  deadLetterServiceLabel,
) as DeadLetterService[]

/** 주소 값을 서비스로 — 모르는 값이면 예약 */
export const toDeadLetterService = (value: string | null): DeadLetterService =>
  value === 'payment' ? 'payment' : 'preorder'

/**
 * 이벤트 종류를 '무엇이 반영되지 않았는지'로 옮긴다. 예약 상세에서 일반 관리자도 읽으므로
 * 이벤트 이름 대신 결과를 말한다.
 */
const eventTypeLabels: Record<string, string> = {
  PREORDER_PAYMENT_STARTED: '결제 시작 반영',
  PREORDER_PAYMENT_CONFIRMED: '결제 완료 반영',
  PREORDER_ORDER_SETTLED: '주문 정산 반영',
  PREORDER_EXPIRY_REQUESTED: '결제 기한 만료 처리',
  EXTERNAL_JOB_SUCCEEDED: '외부 등록 결과 반영',
  PREORDER_PRODUCT_REGISTERED: '사전예약 상품 등록 반영',
  PREORDER_PRODUCT_CHANGED: '사전예약 상품 변경 반영',
  PREORDER_CAMPAIGN_CANCELED: '사전예약 취소 반영',
  CAMPAIGN_RESYNC_REQUESTED: '사전예약 일정 다시 맞추기',
}

// 결제 서비스가 받는 이벤트(명세에 예로 든 것). 새 종류는 이름 그대로 보인다.
const paymentEventTypeLabels: Record<string, string> = {
  ORDER_REFUND_REQUESTED: '환불 요청 처리',
  ORDER_PAYMENT_AUTHORIZING: '결제 승인 중 알림 처리',
}

/** 필터에 쓰는 이벤트 종류. 예약은 결제 → 예약 → 상품 순 */
export const deadLetterEventTypes: Record<DeadLetterService, string[]> = {
  preorder: Object.keys(eventTypeLabels),
  payment: Object.keys(paymentEventTypeLabels),
}

/**
 * 환불 요청 — 버리면 그 주문이 취소 중에 머물고, 주문 쪽에서 환불 요청을 다시 보낼 방법이
 * 없다(명세). 버리기 전에 알린다.
 */
export const isRefundRequest = (eventType: string | null) =>
  eventType === 'ORDER_REFUND_REQUESTED'

/** 원문을 못 읽었으면 종류가 없고, 서버가 모르는 종류는 이름 그대로 보인다 */
export const deadLetterEventLabel = (eventType: string | null) =>
  eventType === null
    ? '알 수 없음(원문을 읽지 못함)'
    : (eventTypeLabels[eventType] ??
      paymentEventTypeLabels[eventType] ??
      eventType)

export const deadLetterStatusLabel: Record<DeadLetterStatus, string> = {
  OPEN: '처리 대기',
  REDRIVING: '다시 보내는 중',
  REDRIVEN: '다시 처리 중',
  SUCCEEDED: '처리됨',
  REDRIVE_FAILED: '다시 실패',
  DISCARDED: '버림',
}

export const deadLetterStatusColor: Record<
  DeadLetterStatus,
  'red' | 'blue' | 'green' | 'gray'
> = {
  OPEN: 'red',
  REDRIVING: 'blue',
  REDRIVEN: 'blue',
  SUCCEEDED: 'green',
  REDRIVE_FAILED: 'red',
  DISCARDED: 'gray',
}

// 객체 키 순서가 필터 순서다.
export const deadLetterStatuses = Object.keys(
  deadLetterStatusLabel,
) as DeadLetterStatus[]

// 표의 상태 열 너비를 가장 긴 문구에 맞출 때 쓴다(Tag의 widthOptions).
export const deadLetterStatusLabels = Object.values(deadLetterStatusLabel)

export const deadLetterFailureReasonLabel: Record<
  DeadLetterFailureReason,
  string
> = {
  PROCESSING_FAILED: '처리 중 오류',
  UNKNOWN_EVENT_TYPE: '모르는 이벤트 종류',
  UNREADABLE_BODY: '원문을 읽을 수 없음',
}

export const deadLetterFailureReasons = Object.keys(
  deadLetterFailureReasonLabel,
) as DeadLetterFailureReason[]

/** 되돌리기를 보내 놓고 결과를 기다리는 중 — 이 동안은 자주 다시 묻는다 */
export const isRedriveInFlight = (status: DeadLetterStatus) =>
  status === 'REDRIVING' || status === 'REDRIVEN'

/** 실패 이유 태그 — 처리 중 오류는 눌러야 할 것, 모르는 종류는 배포 대기, 원문 손상은 버릴 것 */
export const deadLetterFailureReasonTag: Record<
  DeadLetterFailureReason,
  { color: 'red' | 'yellow' | 'gray'; variant: 'subtle' | 'outline' }
> = {
  PROCESSING_FAILED: { color: 'red', variant: 'subtle' },
  UNKNOWN_EVENT_TYPE: { color: 'yellow', variant: 'subtle' },
  UNREADABLE_BODY: { color: 'gray', variant: 'outline' },
}

/** 실패 이유 옆 한 줄 설명 */
export const deadLetterFailureReasonHint: Record<
  DeadLetterFailureReason,
  string
> = {
  PROCESSING_FAILED: '받는 쪽에서 처리하다 오류가 났어요',
  UNKNOWN_EVENT_TYPE: '받는 서버가 이 종류를 몰라요',
  UNREADABLE_BODY: '원문이 깨져 읽지 못했어요',
}

/**
 * 되돌려도 또 실패할 메시지 — 원문을 읽지 못하면 받는 쪽도 못 읽는다. 서버도 조건 일괄
 * 되돌리기에서 이 이유를 건너뛴다.
 */
export const isRedrivableReason = (reason: DeadLetterFailureReason) =>
  reason !== 'UNREADABLE_BODY'

/**
 * 목록 탭. 결과 기다림은 되돌리기를 보내는 중(REDRIVING)과 처리 결과를 기다리는
 * 중(REDRIVEN)을 합친다 — 둘 다 관리자가 할 일 없이 기다리는 상태라 나눠 볼 까닭이 없다.
 * 다시 실패(REDRIVE_FAILED)는 기록으로 남는 이전 행이라 손댈 것(처리 대기)과 따로 둔다 —
 * 다시 실패하면 새 행이 처리 대기로 쌓인다.
 */
export const deadLetterTabs = [
  { value: 'open', label: '처리 대기', statuses: ['OPEN'] },
  {
    value: 'waiting',
    label: '결과 기다림',
    statuses: ['REDRIVING', 'REDRIVEN'],
  },
  { value: 'succeeded', label: '처리됨', statuses: ['SUCCEEDED'] },
  { value: 'failed', label: '다시 실패', statuses: ['REDRIVE_FAILED'] },
  { value: 'discarded', label: '버림', statuses: ['DISCARDED'] },
  { value: 'all', label: '전체', statuses: [] },
] as const satisfies readonly {
  value: string
  label: string
  statuses: readonly DeadLetterStatus[]
}[]

export type DeadLetterTab = (typeof deadLetterTabs)[number]['value']
