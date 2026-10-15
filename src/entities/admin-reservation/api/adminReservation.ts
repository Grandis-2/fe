import { ApiRequestError, apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  AdminMemberListResponse,
  AdminPreorderDetail,
  AdminPreorderListParams,
  AdminPreorderSummary,
  OffsetPage,
  PreorderStats,
} from '@shared/api/types'

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

const getAdminReservation = (preorderId: string) =>
  apiClient.request<AdminPreorderDetail>(`${BASE}/${preorderId}`)

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
