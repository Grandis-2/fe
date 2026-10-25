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

import type { DeadLetterService } from '../model/types'

// 서비스마다 주소만 다르고 요청·응답 모양은 같다.
const BASE: Record<DeadLetterService, string> = {
  preorder: '/api/v1/admin/preorders/dead-letters',
  payment: '/api/v1/admin/orders/payment-dead-letters',
}

// [preorder] GET /api/v1/admin/preorders/dead-letters — DLQ 메시지 목록
// [order] GET /api/v1/admin/orders/payment-dead-letters — 결제 DLQ 메시지 목록
/** 쌓인 메시지 목록(최신순). 조건은 모두 선택이다 */
export const getDeadLetters = (
  service: DeadLetterService,
  params: DeadLetterListParams = {},
  signal?: AbortSignal,
) =>
  apiClient.request<DeadLetterPage>(
    `${BASE[service]}${toQueryString(params)}`,
    { signal },
  )

// [preorder] GET /api/v1/admin/preorders/dead-letters/{deadLetterId} — DLQ 메시지 상세
// [order] GET /api/v1/admin/orders/payment-dead-letters/{deadLetterId}
/** 원문과 되돌리기·버리기 기록까지 */
export const getDeadLetter = (
  service: DeadLetterService,
  deadLetterId: string,
  signal?: AbortSignal,
) =>
  apiClient.request<DeadLetterDetail>(`${BASE[service]}/${deadLetterId}`, {
    signal,
  })

// [preorder] POST /api/v1/admin/preorders/dead-letters/{deadLetterId}/redrive — 원래 큐로 되돌리기
// [order] POST /api/v1/admin/orders/payment-dead-letters/{deadLetterId}/redrive
/**
 * 원래 큐로 다시 보낸다. 202의 status는 보통 REDRIVEN이고 결과(SUCCEEDED·REDRIVE_FAILED)는
 * 나중에 바뀐다. 되돌릴 수 없거나 이미 보내는 중이면 409, 큐로 못 보내면 503(1분 뒤 다시)
 */
export const redriveDeadLetter = (
  service: DeadLetterService,
  deadLetterId: string,
) =>
  apiClient.request<DeadLetterSummary>(
    `${BASE[service]}/${deadLetterId}/redrive`,
    { method: 'POST' },
  )

// [preorder] POST /api/v1/admin/preorders/dead-letters/redrive-batch — 조건으로 일괄 되돌리기
// [order] POST /api/v1/admin/orders/payment-dead-letters/redrive-batch
/** 여러 건을 한 번에. 대상 수만 바로 주고 서버가 초당 ratePerSecond건씩 보낸다 */
export const redriveDeadLetters = (
  service: DeadLetterService,
  deadLetterIds: string[],
) =>
  apiClient.request<BatchRedrive>(`${BASE[service]}/redrive-batch`, {
    method: 'POST',
    body: { deadLetterIds } satisfies RedriveBatchRequest,
  })

// [preorder] POST /api/v1/admin/preorders/dead-letters/{deadLetterId}/discard — 버리기(사유 필수)
// [order] POST /api/v1/admin/orders/payment-dead-letters/{deadLetterId}/discard
/** OPEN인 행을 버린다. 되돌리거나 다시 버릴 수 없다. OPEN이 아니면 409 */
export const discardDeadLetter = (
  service: DeadLetterService,
  deadLetterId: string,
  body: DiscardRequest,
) =>
  apiClient.request<DeadLetterDetail>(
    `${BASE[service]}/${deadLetterId}/discard`,
    { method: 'POST', body },
  )
