import { ApiRequestError, apiClient } from '@shared/api/client'
import { fetchAllPages, PAGE_SIZE_MAX } from '@shared/api/fetchAllPages'
import { toQueryString } from '@shared/api/queryString'
import type {
  AdminCancelRequest,
  AdminMemberListResponse,
  AdminNoteRequest,
  AdminPreorderDetail,
  AdminPreorderListParams,
  AdminPreorderSummary,
  AdminSyncJobListParams,
  BatchReprocess,
  OffsetPage,
  PreorderStats,
  ReprocessBatchRequest,
  SyncJobListResponse,
} from '@shared/api/types'

import type { AdminReservationDetail } from '../model/types'

const BASE = '/api/v1/admin/preorders'

// [preorder] GET /api/v1/admin/preorders — 예약 목록(관리자)
/** 모든 회원의 예약을 최신순으로 받는다 */
export const getAdminReservations = (
  params: AdminPreorderListParams = {},
  signal?: AbortSignal,
) =>
  apiClient.request<OffsetPage<AdminPreorderSummary>>(
    `${BASE}${toQueryString(params)}`,
    { signal },
  )

// [preorder] GET /api/v1/admin/preorders — 예약 목록(관리자)을 쪽 끝까지
/** 모든 예약을 끝까지 이어 받는다 — 외부 원장과 한 건씩 맞춰 볼 때만 쓴다(무겁다) */
export const getAllAdminReservations = (signal?: AbortSignal) =>
  fetchAllPages((page) =>
    getAdminReservations({ page, size: PAGE_SIZE_MAX }, signal),
  )

// [preorder] GET /api/v1/admin/preorders/stats — 운영 현황(관리자)
/** 상태별 예약 수와 동기화 작업 수. productId를 빼면 전체를 센다 */
export const getReservationStats = (productId?: string, signal?: AbortSignal) =>
  apiClient.request<PreorderStats>(
    `${BASE}/stats${toQueryString({ productId })}`,
    { signal },
  )

// [preorder] GET /api/v1/admin/preorders/{preorderId} — 예약 상세(관리자)
/** 예약 상세 — 회원, 내부 메모, 동기화 작업, 상태 이력까지 */
export const getAdminReservation = (preorderId: string, signal?: AbortSignal) =>
  apiClient.request<AdminPreorderDetail>(`${BASE}/${preorderId}`, { signal })

// [preorder] POST /api/v1/admin/preorders/{preorderId}/cancel — 관리자 예약 취소
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

// [preorder] PATCH /api/v1/admin/preorders/{preorderId} — 내부 메모 변경
/** 내부 메모만 바꾼다. 이력·version은 그대로이고, 응답은 바뀐 뒤의 상세다 */
export const updateAdminReservationNote = (
  preorderId: string,
  body: AdminNoteRequest,
) =>
  apiClient.request<AdminPreorderDetail>(`${BASE}/${preorderId}`, {
    method: 'PATCH',
    body,
  })

// [preorder] GET /api/v1/admin/preorders/{preorderId} — 예약 상세(관리자)
// → POST /api/v1/admin/preorders/sync-jobs/{syncJobId}/reprocess — DEAD_LETTER 작업 재처리
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

// [preorder] GET /api/v1/admin/preorders/sync-jobs — 동기화 작업 목록
const getAdminSyncJobs = (
  params: AdminSyncJobListParams,
  signal?: AbortSignal,
) =>
  apiClient.request<SyncJobListResponse>(
    `${BASE}/sync-jobs${toQueryString(params)}`,
    { signal },
  )

// [preorder] GET /api/v1/admin/preorders/sync-jobs — 동기화 작업 목록
// → POST /api/v1/admin/preorders/sync-jobs/reprocess-batch — 조건으로 일괄 재처리
/**
 * 여러 예약의 외부 등록을 한 번에 다시 시도한다. 일괄 재처리는 작업 id를 받는데 예약
 * 목록엔 없어서, 재처리 대기(DEAD_LETTER) REGISTER 작업을 받아 예약 id로 골라 보낸다.
 * 서버는 대상 수만 바로 주고 실제 재처리는 이어서 한다.
 */
export async function reprocessAdminReservations(preorderIds: string[]) {
  const wanted = new Set(preorderIds)
  const deadJobs = await fetchAllPages((page) =>
    getAdminSyncJobs({
      jobType: 'REGISTER',
      status: 'DEAD_LETTER',
      page,
      size: PAGE_SIZE_MAX,
    }),
  )
  const syncJobIds = deadJobs
    .filter((job) => wanted.has(job.preorderId))
    .map((job) => job.syncJobId)
  if (syncJobIds.length === 0) {
    throw new ApiRequestError(
      {
        code: 'NOTHING_TO_REPROCESS',
        message: '재처리할 작업이 없습니다. 대조를 다시 실행해 확인해 주세요.',
        details: null,
      },
      409,
    )
  }
  return apiClient.request<BatchReprocess>(
    `${BASE}/sync-jobs/reprocess-batch`,
    {
      method: 'POST',
      body: { syncJobIds } satisfies ReprocessBatchRequest,
    },
  )
}

// [preorder] GET /api/v1/admin/preorders/sync-jobs — 동기화 작업 목록(errorGroups만)
/**
 * 외부 등록 작업의 마지막 시도 오류 코드별 수. 성공했거나 시도 전인 작업은 errorCode가
 * null이라 빼고, 지금 실패 중(재시도 대기·DEAD_LETTER)인 것만 남는다.
 */
export const getSyncJobErrorGroups = async (signal?: AbortSignal) => {
  const { errorGroups } = await getAdminSyncJobs(
    { jobType: 'REGISTER', groupByError: true, size: 1 },
    signal,
  )
  return (errorGroups ?? []).filter((group) => group.errorCode !== null)
}

// [member] GET /api/v1/admin/members — 회원 이름 조회(관리자)
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
