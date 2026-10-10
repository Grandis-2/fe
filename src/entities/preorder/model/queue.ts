import type {
  PreorderAcceptedResponse,
  QueueEnterResponse,
  QueueStatusResponse,
} from '@shared/api/types'

// 응답 모양 그대로 쓴다. 조회 응답에만 다음 조회까지 기다릴 초(Retry-After 헤더)를 붙인다.
export type QueueEntry = QueueEnterResponse & { retryAfter: number | null }
export type QueuePoll = QueueStatusResponse & { retryAfter: number | null }
export type PreorderAccepted = PreorderAcceptedResponse
