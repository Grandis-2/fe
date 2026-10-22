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

// 일괄 재처리 한 번에 보낼 수 있는 작업 수(명세 syncJobIds maxItems).
const REPROCESS_BATCH_MAX = 1000

/**
 * 일괄 재처리 중 앞 묶음은 받아들여졌고 뒤 묶음이 실패했다. 받아들여진 합계와, 보내지 못해
 * 다시 보내야 할 예약 id를 싣는다 — 다시 보낼 때는 이 id만 보낸다.
 */
export class PartialReprocessError extends ApiRequestError {
  readonly accepted: BatchReprocess
  readonly unsentPreorderIds: string[]

  constructor(accepted: BatchReprocess, unsentPreorderIds: string[]) {
    super(
      {
        code: 'REPROCESS_PARTIAL',
        message: `재처리 ${accepted.targetCount}건은 접수했고 ${unsentPreorderIds.length}건은 보내지 못했어요. 보내지 못한 건만 다시 보낼 수 있어요.`,
        details: null,
      },
      409,
    )
    this.name = 'PartialReprocessError'
    this.accepted = accepted
    this.unsentPreorderIds = unsentPreorderIds
  }
}

// [preorder] GET /api/v1/admin/preorders/sync-jobs — 동기화 작업 목록
// → POST /api/v1/admin/preorders/sync-jobs/reprocess-batch — 조건으로 일괄 재처리
/**
 * 여러 예약의 외부 등록을 한 번에 다시 시도한다. preorderIds를 빼면 재처리 대기 전부.
 * 일괄 재처리는 작업 id를 받는데 예약 목록엔 없어서, 재처리 대기(DEAD_LETTER) REGISTER
 * 작업을 받아 예약 id로 골라 1000건씩 나눠 보낸다. 서버는 대상 수만 바로 주고 실제
 * 재처리는 이어서 한다.
 */
export async function reprocessAdminReservations(
  preorderIds?: string[],
  signal?: AbortSignal,
) {
  const wanted = preorderIds && new Set(preorderIds)
  const deadJobs = await fetchAllPages((page) =>
    getAdminSyncJobs({
      jobType: 'REGISTER',
      status: 'DEAD_LETTER',
      page,
      size: PAGE_SIZE_MAX,
    }),
  )
  const syncJobIds = deadJobs
    .filter((job) => !wanted || wanted.has(job.preorderId))
    .map((job) => job.syncJobId)
  if (syncJobIds.length === 0) {
    throw new ApiRequestError(
      {
        code: 'NOTHING_TO_REPROCESS',
        message: '재처리할 작업이 없습니다. 목록을 새로 고쳐 확인해 주세요.',
        details: null,
      },
      409,
    )
  }
  const total: BatchReprocess = {
    targetCount: 0,
    skippedCount: 0,
    estimatedSeconds: 0,
  }
  const preorderOf = new Map(
    deadJobs.map((job) => [job.syncJobId, job.preorderId]),
  )
  // 차례로 보낸다 — 서버가 요청마다 초당 정해진 수만큼 처리해서 예상 시간은 더해진다.
  // ponytail: 서버에는 전역 속도 제한이 없어 묶음이 겹쳐 돌면 외부 호출 속도가 묶음 수만큼 배로 늘어난다.
  // 그래서 앞 묶음의 예상 시간만큼 기다렸다 다음 묶음을 보낸다. be에 전역 제한이 생기면 이 대기를 뺀다.
  let waitMs = 0
  for (let i = 0; i < syncJobIds.length; i += REPROCESS_BATCH_MAX) {
    let batch: BatchReprocess
    try {
      if (waitMs > 0) await pause(waitMs, signal)
      batch = await apiClient.request<BatchReprocess>(
        `${BASE}/sync-jobs/reprocess-batch`,
        {
          method: 'POST',
          body: {
            syncJobIds: syncJobIds.slice(i, i + REPROCESS_BATCH_MAX),
          } satisfies ReprocessBatchRequest,
        },
      )
    } catch (caught: unknown) {
      // 앞 묶음이 하나도 안 받아들여졌으면 그대로 던진다. 받아들여진 게 있으면 그 수와 남은 건을 알린다.
      if (i === 0) throw caught
      const unsent = new Set(
        syncJobIds.slice(i).flatMap((id) => preorderOf.get(id) ?? []),
      )
      throw new PartialReprocessError(total, [...unsent])
    }
    total.targetCount += batch.targetCount
    total.skippedCount += batch.skippedCount
    total.estimatedSeconds += batch.estimatedSeconds
    waitMs = batch.estimatedSeconds * 1000
  }
  return total
}

// 취소 신호가 오면 기다림을 끝내고 실패로 돌린다 — 호출부가 남은 건을 보내지 못한 것으로 센다.
const pause = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })

// [preorder] GET /api/v1/admin/preorders — 예약 목록(관리자) · 재처리 필요만
// → reprocessAdminReservations
/**
 * 외부 등록이 실패한 예약을 다시 시도한다. productId를 주면 그 사전예약만, 빼면 전부.
 * 일괄 재처리는 상품으로 거를 수 없어 그 사전예약의 실패 예약을 먼저 받아 고른다.
 */
export async function reprocessFailedRegistrations(productId?: string) {
  if (!productId) return reprocessAdminReservations()
  const failed = await fetchAllPages((page) =>
    getAdminReservations({
      productId,
      registerJobStatus: 'DEAD_LETTER',
      page,
      size: PAGE_SIZE_MAX,
    }),
  )
  return reprocessAdminReservations(
    failed.map((reservation) => reservation.preorderId),
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
