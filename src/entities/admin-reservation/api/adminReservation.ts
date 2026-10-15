import { ApiRequestError, apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  AdminCancelRequest,
  AdminMemberListResponse,
  AdminNoteRequest,
  AdminPreorderDetail,
  AdminPreorderListParams,
  AdminPreorderSummary,
  OffsetPage,
  PreorderStats,
} from '@shared/api/types'

import type { AdminReservationDetail } from '../model/types'

const BASE = '/api/v1/admin/preorders'

/** 모든 회원의 예약을 최신순으로 받는다 */
export const getAdminReservations = (
  params: AdminPreorderListParams = {},
  signal?: AbortSignal,
) =>
  apiClient.request<OffsetPage<AdminPreorderSummary>>(
    `${BASE}${toQueryString(params)}`,
    { signal },
  )

/** 상태별 예약 수와 동기화 작업 수. productId를 빼면 전체를 센다 */
export const getReservationStats = (productId?: string, signal?: AbortSignal) =>
  apiClient.request<PreorderStats>(
    `${BASE}/stats${toQueryString({ productId })}`,
    { signal },
  )

/** 예약 상세 — 회원, 내부 메모, 동기화 작업, 상태 이력까지 */
export const getAdminReservation = (preorderId: string, signal?: AbortSignal) =>
  apiClient.request<AdminPreorderDetail>(`${BASE}/${preorderId}`, { signal })

/**
 * 관리자가 예약을 취소한다. 사유는 이력에 남는다. 이미 취소 중·완료면 지금 상태로
 * 202, 배송이 시작됐으면 409 PREORDER_NOT_CANCELABLE
 */
export const cancelAdminReservation = (
  preorderId: string,
  body: AdminCancelRequest,
) =>
  apiClient.request<unknown>(`${BASE}/${preorderId}/cancel`, {
    method: 'POST',
    body,
  })

/** 내부 메모만 바꾼다. 이력·version은 그대로이고, 응답은 바뀐 뒤의 상세다 */
export const updateAdminReservationNote = (
  preorderId: string,
  body: AdminNoteRequest,
) =>
  apiClient.request<AdminPreorderDetail>(`${BASE}/${preorderId}`, {
    method: 'PATCH',
    body,
  })

/**
 * 외부 등록을 다시 시도한다. 재처리는 예약이 아니라 그 예약의 REGISTER 작업에 거는데,
 * 목록에는 작업 id가 없어서 상세에서 찾아 보낸다.
 */
export async function reprocessAdminReservation(preorderId: string) {
  const { syncJobs } = await getAdminReservation(preorderId)
  const job = syncJobs.find(
    (syncJob) =>
      syncJob.jobType === 'REGISTER' && syncJob.status === 'DEAD_LETTER',
  )
  // 그사이 다른 관리자가 재처리했거나 예약이 취소됐다 — 목록을 다시 받으면 맞춰진다.
  if (!job) {
    throw new ApiRequestError(
      {
        code: 'NOTHING_TO_REPROCESS',
        message: '재처리할 작업이 없습니다. 목록을 새로 고쳐 확인해 주세요.',
        details: null,
      },
      409,
    )
  }
  return apiClient.request<unknown>(
    `${BASE}/sync-jobs/${job.syncJobId}/reprocess`,
    { method: 'POST' },
  )
}

/** 회원 id를 이름으로 바꾼다. 한 번에 1~100개이고 ids 없이 부르면 400이다 */
export const getAdminMembers = (ids: string[], signal?: AbortSignal) =>
  apiClient.request<AdminMemberListResponse>(
    `/api/v1/admin/members${toQueryString({ ids: ids.join(',') })}`,
    { signal },
  )

/** 상세에 REGISTER 작업 상태를 붙인다 — 목록 한 줄과 같은 판단 함수를 쓰려고 */
export const toAdminReservationDetail = (
  detail: AdminPreorderDetail,
): AdminReservationDetail => ({
  ...detail,
  registerJobStatus:
    detail.syncJobs.find((job) => job.jobType === 'REGISTER')?.status ?? null,
})
