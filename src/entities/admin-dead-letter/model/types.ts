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

/** 필터에 쓰는 이벤트 종류(명세 순서와 무관하게 결제 → 예약 → 상품 순) */
export const deadLetterEventTypes = Object.keys(eventTypeLabels)

/** 원문을 못 읽었으면 종류가 없고, 서버가 모르는 종류는 이름 그대로 보인다 */
export const deadLetterEventLabel = (eventType: string | null) =>
  eventType === null
    ? '알 수 없음(원문을 읽지 못함)'
    : (eventTypeLabels[eventType] ?? eventType)

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
