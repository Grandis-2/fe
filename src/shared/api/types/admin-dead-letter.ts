import type { OffsetPage } from './admin-reservation'

// 이벤트 DLQ — 서버끼리 주고받는 이벤트 메시지(SQS) 중 처리에 거듭 실패해 따로 모인 것이다.
// 외부 예약 시스템 등록 실패(sync-jobs의 DEAD_LETTER)와는 다른 경로다. 서비스마다 따로 있고
// 요청·응답 모양이 같다.
// - 예약: preorder.json, /api/v1/admin/preorders/dead-letters — 줄에 preorderId·customerId
// - 결제: order.json, /api/v1/admin/orders/payment-dead-letters — 줄에 orderId(결제 서비스는
//   밖에 열지 않아 주문 서비스가 받아 넘긴다)

export type DeadLetterStatus =
  | 'OPEN'
  | 'REDRIVING'
  | 'REDRIVEN'
  | 'SUCCEEDED'
  | 'REDRIVE_FAILED'
  | 'DISCARDED'

export type DeadLetterFailureReason =
  'UNREADABLE_BODY' | 'UNKNOWN_EVENT_TYPE' | 'PROCESSING_FAILED'

/** 목록 한 줄(원문 제외) — 되돌리기 응답도 이 모양이다 */
export type DeadLetterSummary = {
  deadLetterId: string
  /** SQS 메시지 id. 서버 로그에서 오류를 찾을 때 쓴다 */
  messageId: string
  /** 원문을 읽지 못했으면 null */
  eventId: string | null
  /** 원문을 읽지 못했으면 null. 서버가 모르는 종류도 문자열 그대로 온다 */
  eventType: string | null
  /** 예약 DLQ만. 예약과 무관한 이벤트면 null */
  preorderId?: string | null
  customerId?: string | null
  /** 결제 DLQ만. 주문 이벤트가 아니면 null — 관리자 주문 상세로 간다 */
  orderId?: string | null
  failureReason: DeadLetterFailureReason
  /** DLQ로 가기 전까지 받은 횟수 */
  receiveCount: number
  status: DeadLetterStatus
  /** 되돌리기 버튼을 보일지. 목록 값은 대략적이고 상세에서 정확히 판정한다 */
  redrivable: boolean
  /** 재실패로 새로 쌓인 행이면 이전 행 id */
  redrivenFromId: string | null
  sentAt: string | null
  /** 쌓인 시각 — 목록 기간 필터의 기준 */
  createdAt: string
  updatedAt: string
}

/** 상세 — 원문과 되돌리기·버리기 기록이 붙는다 */
export type DeadLetterDetail = DeadLetterSummary & {
  sourceQueue: string
  aggregateType: string | null
  aggregateId: string | null
  /** 받은 원문(보통 JSON, 최대 256KB). JSON.parse가 실패할 수 있다 */
  body: string
  redriveRequestedBy: string | null
  redriveStartedAt: string | null
  redrivenAt: string | null
  outcomeAt: string | null
  discardedBy: string | null
  discardedAt: string | null
  discardNote: string | null
}

/** GET 목록 — 1~100건씩. preorderId·customerId는 예약, orderId는 결제 DLQ에만 있다 */
export type DeadLetterListParams = {
  status?: DeadLetterStatus
  eventType?: string
  failureReason?: DeadLetterFailureReason
  preorderId?: string
  customerId?: string
  orderId?: string
  /** 쌓인 시각 하한(포함) */
  from?: string
  /** 쌓인 시각 상한(제외) */
  to?: string
  page?: number
  size?: number
}

export type DeadLetterPage = OffsetPage<DeadLetterSummary>

/** POST .../dead-letters/{id}/discard — 사유 1~500자(공백만은 안 됨) */
export type DiscardRequest = { note: string }

/** POST .../dead-letters/redrive-batch — 모두 선택이고 비우면 조건으로 고른다 */
export type RedriveBatchRequest = {
  /** 최대 1000건 */
  deadLetterIds?: string[]
  eventType?: string
  failureReason?: DeadLetterFailureReason
  /** 초당 보낼 건수 1~200(기본 20) */
  ratePerSecond?: number
}

export type BatchRedrive = {
  targetCount: number
  /** 대기 상태가 아니거나, 되돌릴 수 없거나, 없는 id라 건너뛴 수 */
  skippedCount: number
  estimatedSeconds: number
}
