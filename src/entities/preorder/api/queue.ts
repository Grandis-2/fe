import { apiClient } from '@shared/api/client'
import type {
  PreorderAcceptedResponse,
  PreorderRequest,
  QueueEnterResponse,
  QueueStatusResponse,
} from '@shared/api/types'

import type { PreorderAccepted, QueueEntry, QueuePoll } from '../model/queue'

const QUEUE_PATH = '/api/v1/preorders/queue'

const withProductId = (path: string, productId: string) =>
  `${path}?${new URLSearchParams({ productId })}`

// Retry-After는 WAITING일 때만 온다(초).
const readRetryAfter = (headers: Record<string, unknown>) => {
  const seconds = Number(headers['retry-after'])
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null
}

// 진입 — 예약 페이지에 들어올 때 한 번. 다시 불러도 자리는 하나만 잡힌다(본문 없음).
export const enterQueue = async (productId: string): Promise<QueueEntry> => {
  const { data, headers } =
    await apiClient.requestWithHeaders<QueueEnterResponse>(
      withProductId(QUEUE_PATH, productId),
      { method: 'POST' },
    )
  return { ...data, retryAfter: readRetryAfter(headers) }
}

// 조회 — 진입 202에서 받은 queueToken을 Queue-Token 헤더에 담아 Retry-After초마다 부른다.
export const getQueueStatus = async (
  productId: string,
  queueToken: string,
  signal?: AbortSignal,
): Promise<QueuePoll> => {
  const { data, headers } =
    await apiClient.requestWithHeaders<QueueStatusResponse>(
      withProductId(QUEUE_PATH, productId),
      { headers: { 'Queue-Token': queueToken }, signal },
    )
  return { ...data, retryAfter: readRetryAfter(headers) }
}

// 접수 — 입장권(X-Admission-Ticket)을 확인한 뒤 preorder로 넘어간다. 수량은 1개 고정.
// 재전송은 같은 Idempotency-Key·같은 입장권·같은 본문으로 보내야 중복 예약이 생기지 않는다.
export const submitPreorder = ({
  admissionTicket,
  idempotencyKey,
  ...body
}: PreorderRequest & {
  admissionTicket: string
  idempotencyKey: string
}): Promise<PreorderAccepted> =>
  apiClient.request<PreorderAcceptedResponse>(
    withProductId('/api/v1/preorders', body.productId),
    {
      method: 'POST',
      body,
      headers: {
        'X-Admission-Ticket': admissionTicket,
        'Idempotency-Key': idempotencyKey,
      },
    },
  )
