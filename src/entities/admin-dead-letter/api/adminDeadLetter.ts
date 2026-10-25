import { apiClient } from '@shared/api/client'
import { PAGE_SIZE_MAX } from '@shared/api/fetchAllPages'
import { toQueryString } from '@shared/api/queryString'
import type {
  BatchRedrive,
  DeadLetterDetail,
  DeadLetterListParams,
  DeadLetterPage,
  DeadLetterStatus,
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

// ponytail: 상태마다 이만큼(1,000건)까지만 받는다 — 평소 비어 있는 목록이라 넘치면 장애다.
// 넘치면 total이 items보다 커서 화면이 "일부만"이라고 알린다. 서버가 오래된 순·커서를 주면 바꾼다.
const MAX_PAGES_PER_STATUS = 10

/**
 * 손댈 것만 모은 탭(처리 대기·결과 기다림)용 — 서버는 상태 하나만 거르고 최신순 한 쪽만 주니,
 * 상태마다 따로 끝까지 받아 합친다. 한 쪽만 받으면 오래 멈춘 메시지가 빠지고 원인별 묶음 수가
 * 틀린다. 받는 동안 새 메시지가 앞에 끼면 뒤 쪽이 밀려 같은 행이 또 오니 id로 거른다.
 * 최신순으로 돌려준다(서버 목록과 같은 순서).
 */
export async function getDeadLettersOf(
  service: DeadLetterService,
  statuses: readonly DeadLetterStatus[],
  params: Omit<DeadLetterListParams, 'status' | 'page' | 'size'>,
  signal?: AbortSignal,
): Promise<DeadLetterPage> {
  const byId = new Map<string, DeadLetterSummary>()
  let total = 0
  await Promise.all(
    statuses.map(async (status) => {
      for (let page = 0; page < MAX_PAGES_PER_STATUS; page += 1) {
        const result = await getDeadLetters(
          service,
          { ...params, status, page, size: PAGE_SIZE_MAX },
          signal,
        )
        result.items.forEach((item) => byId.set(item.deadLetterId, item))
        if (page === 0) total += result.total
        if (result.items.length < PAGE_SIZE_MAX) return
      }
    }),
  )
  const items = [...byId.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
  return { items, page: 0, size: items.length, total }
}

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
