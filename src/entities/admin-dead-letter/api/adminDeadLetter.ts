import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  BatchRedrive,
  DeadLetterDetail,
  DeadLetterListParams,
  DeadLetterPage,
  DeadLetterSummary,
  DiscardRequest,
  RedriveBatchRequest,
} from '@shared/api/types'

const BASE = '/api/v1/admin/preorders/dead-letters'

/** 쌓인 메시지 목록(최신순). 조건은 모두 선택이다 */
export const getDeadLetters = (
  params: DeadLetterListParams = {},
  signal?: AbortSignal,
) =>
  apiClient.request<DeadLetterPage>(`${BASE}${toQueryString(params)}`, {
    signal,
  })

/** 원문과 되돌리기·버리기 기록까지 */
export const getDeadLetter = (deadLetterId: string, signal?: AbortSignal) =>
  apiClient.request<DeadLetterDetail>(`${BASE}/${deadLetterId}`, { signal })

/**
 * 원래 큐로 다시 보낸다. 202의 status는 보통 REDRIVEN이고 결과(SUCCEEDED·REDRIVE_FAILED)는
 * 나중에 바뀐다. 되돌릴 수 없거나 이미 보내는 중이면 409, 큐로 못 보내면 503(1분 뒤 다시)
 */
export const redriveDeadLetter = (deadLetterId: string) =>
  apiClient.request<DeadLetterSummary>(`${BASE}/${deadLetterId}/redrive`, {
    method: 'POST',
  })

/** 여러 건을 한 번에. 대상 수만 바로 주고 서버가 초당 ratePerSecond건씩 보낸다 */
export const redriveDeadLetters = (deadLetterIds: string[]) =>
  apiClient.request<BatchRedrive>(`${BASE}/redrive-batch`, {
    method: 'POST',
    body: { deadLetterIds } satisfies RedriveBatchRequest,
  })

/** OPEN인 행을 버린다. 되돌리거나 다시 버릴 수 없다. OPEN이 아니면 409 */
export const discardDeadLetter = (deadLetterId: string, body: DiscardRequest) =>
  apiClient.request<DeadLetterDetail>(`${BASE}/${deadLetterId}/discard`, {
    method: 'POST',
    body,
  })
