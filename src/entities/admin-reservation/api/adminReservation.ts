import { ApiRequestError, apiClient } from '@shared/api/client'
import {
  fetchAllPages,
  fetchConcatPage,
  PAGE_SIZE_MAX,
} from '@shared/api/fetchAllPages'
import { toQueryString } from '@shared/api/queryString'
import type {
  AdminCancelRequest,
  AdminNoteRequest,
  AdminPreorderDetail,
  AdminPreorderListParams,
  AdminPreorderSummary,
  AdminSyncJobListParams,
  BatchReprocess,
  OffsetPage,
  PreorderStats,
  PreorderStatus,
  ReprocessBatchRequest,
  SyncJobListResponse,
  SyncJobStatus,
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

export type AdminReservationListParams = Omit<
  AdminPreorderListParams,
  'status'
> & { statuses?: readonly PreorderStatus[] }

// [preorder] GET /api/v1/admin/preorders — 예약 목록(관리자) 한 쪽, 상태 여럿
/**
 * 서버는 상태를 하나만 거를 수 있어서, 상태를 여럿 주면 상태별 목록을 준 순서대로 이어
 * 붙여 쪽을 나눈다('확정' 탭 = 결제 대기 다음에 결제 완료).
 */
export const getAdminReservationsPage = (
  { statuses = [], ...params }: AdminReservationListParams,
  signal?: AbortSignal,
) =>
  statuses.length > 1
    ? fetchConcatPage(
        statuses.map(
          (status) => (page: number, size: number) =>
            getAdminReservations({ ...params, status, page, size }, signal),
        ),
        params.page ?? 0,
        params.size ?? 20,
      )
    : getAdminReservations({ ...params, status: statuses[0] }, signal)

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

/** 목록 줄 중 외부 등록 작업이 있는 것만 재처리 대상으로 */
export const targetsOf = (
  reservations: readonly Pick<
    AdminPreorderSummary,
    'preorderId' | 'registerSyncJobId'
  >[],
): ReprocessTarget[] =>
  reservations.flatMap(({ preorderId, registerSyncJobId }) =>
    registerSyncJobId ? [{ preorderId, syncJobId: registerSyncJobId }] : [],
  )

/** 재처리할 외부 등록 작업 — 부분 실패 때 못 보낸 예약을 알려 주려고 예약 id를 같이 든다 */
export type ReprocessTarget = { preorderId: string; syncJobId: string }

const nothingToReprocess = () =>
  new ApiRequestError(
    {
      code: 'NOTHING_TO_REPROCESS',
      message: '재처리할 작업이 없습니다. 목록을 새로 고쳐 확인해 주세요.',
      details: null,
    },
    409,
  )

// [preorder] POST /api/v1/admin/preorders/sync-jobs/reprocess-batch — 일괄 재처리
/**
 * 외부 등록 작업을 한 번에 다시 시도한다. 1000건씩 나눠 보내고, 서버는 대상 수만 바로 주고
 * 실제 재처리는 이어서 한다.
 */
export async function reprocessSyncJobs(
  targets: readonly ReprocessTarget[],
  signal?: AbortSignal,
) {
  if (targets.length === 0) throw nothingToReprocess()
  const total: BatchReprocess = {
    targetCount: 0,
    skippedCount: 0,
    estimatedSeconds: 0,
  }
  // 차례로 보낸다 — 서버가 요청마다 초당 정해진 수만큼 처리해서 예상 시간은 더해진다.
  // ponytail: 서버에는 전역 속도 제한이 없어 묶음이 겹쳐 돌면 외부 호출 속도가 묶음 수만큼 배로 늘어난다.
  // 그래서 앞 묶음의 예상 시간만큼 기다렸다 다음 묶음을 보낸다. be에 전역 제한이 생기면 이 대기를 뺀다.
  let waitMs = 0
  for (let i = 0; i < targets.length; i += REPROCESS_BATCH_MAX) {
    let batch: BatchReprocess
    try {
      if (waitMs > 0) await pause(waitMs, signal)
      batch = await apiClient.request<BatchReprocess>(
        `${BASE}/sync-jobs/reprocess-batch`,
        {
          method: 'POST',
          body: {
            syncJobIds: targets
              .slice(i, i + REPROCESS_BATCH_MAX)
              .map((target) => target.syncJobId),
          } satisfies ReprocessBatchRequest,
        },
      )
    } catch (caught: unknown) {
      // 앞 묶음이 하나도 안 받아들여졌으면 그대로 던진다. 받아들여진 게 있으면 그 수와 남은 건을 알린다.
      if (i === 0) throw caught
      throw new PartialReprocessError(total, [
        ...new Set(targets.slice(i).map((target) => target.preorderId)),
      ])
    }
    total.targetCount += batch.targetCount
    total.skippedCount += batch.skippedCount
    total.estimatedSeconds += batch.estimatedSeconds
    waitMs = batch.estimatedSeconds * 1000
  }
  return total
}

// [preorder] GET /api/v1/admin/preorders/sync-jobs — 동기화 작업 목록
// → reprocessSyncJobs
/**
 * 여러 예약의 외부 등록을 한 번에 다시 시도한다. preorderIds를 빼면 재처리 대기 전부.
 * 재처리 대기(DEAD_LETTER) REGISTER 작업을 받아 예약 id로 고른다 — 작업 id를 이미 알면
 * reprocessSyncJobs를 바로 부른다.
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
  return reprocessSyncJobs(
    deadJobs
      .filter((job) => !wanted || wanted.has(job.preorderId))
      .map(({ preorderId, syncJobId }) => ({ preorderId, syncJobId })),
    signal,
  )
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
// → reprocessSyncJobs
/**
 * 외부 등록이 실패한 예약을 다시 시도한다. productId를 주면 그 사전예약만, 빼면 전부.
 * 일괄 재처리는 상품으로 거를 수 없어 그 사전예약의 실패 예약을 먼저 받아 작업 id를 모은다.
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
  return reprocessSyncJobs(targetsOf(failed))
}

// [preorder] GET /api/v1/admin/preorders/sync-jobs — 동기화 작업 목록(errorGroups만)
/**
 * 외부 등록 작업의 마지막 시도 오류 코드별 수. 성공했거나 시도 전인 작업은 errorCode가
 * null이라 빼고, 지금 실패 중(재시도 대기·DEAD_LETTER)인 것만 남는다. status를 주면 그
 * 상태의 작업만 센다(DEAD_LETTER = 재처리할 실패의 원인).
 */
export const getSyncJobErrorGroups = async (
  status?: SyncJobStatus,
  signal?: AbortSignal,
) => {
  const { errorGroups } = await getAdminSyncJobs(
    { jobType: 'REGISTER', status, groupByError: true, size: 1 },
    signal,
  )
  return (errorGroups ?? []).filter(
    (group): group is { errorCode: string; count: number } =>
      group.errorCode !== null,
  )
}

/** 상세에 REGISTER 작업 상태를 붙인다 — 목록 한 줄과 같은 판단 함수를 쓰려고 */
export const toAdminReservationDetail = (
  detail: AdminPreorderDetail,
): AdminReservationDetail => ({
  ...detail,
  registerJobStatus:
    detail.syncJobs.find((job) => job.jobType === 'REGISTER')?.status ?? null,
})
