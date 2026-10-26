import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  freezeWhenDone,
  keepNewer,
  pollEvery,
  pollingRetry,
  queryPolicy,
} from '@shared/api/queryPolicy'
import type {
  BatchReprocessProgress,
  PreorderStats,
  ProductStatsItem,
  ProductStatsPhase,
  SyncJobStatus,
} from '@shared/api/types'
import type { RefreshInterval } from '@shared/config/refreshInterval'

import {
  cancelAdminReservation,
  getAdminReservation,
  getAdminReservationsPage,
  getProductStats,
  getReprocessBatch,
  getReservationStats,
  getSyncJobErrorGroups,
  reprocessAdminReservation,
  reprocessAdminReservations,
  reprocessFailedRegistrations,
  reprocessSyncJobs,
  resolveCancelJob,
  reprocessSyncJob,
  targetsOf,
  toAdminReservationDetail,
  updateAdminReservationNote,
  type AdminReservationListParams,
} from './adminReservation'

import type { AdminReservation } from '../model/types'

const RESERVATIONS_KEY = ['admin', 'reservations'] as const
const POLL_INTERVAL_MS = 10_000

/** 운영 현황 집계 키. 전체(productId 없음)의 추이는 useReservationStatsHistory가 모은다 */
export const reservationStatsKey = (productId?: string) =>
  [...RESERVATIONS_KEY, 'stats', productId] as const

// 목록·집계와 같은 접두사 아래라, 재처리·취소 뒤 한 번에 무효화된다.
const reservationKey = (preorderId: string) =>
  [...RESERVATIONS_KEY, 'detail', preorderId] as const

/**
 * 접수는 계속 들어오므로 주기적으로 다시 받는다. 간격은 화면이 고른다.
 * 실패하면 pollEvery가 그 간격에서 백오프하며 계속 다시 묻는다.
 */
export const useAdminReservations = (
  params: AdminReservationListParams = {},
  intervalMs: RefreshInterval = POLL_INTERVAL_MS,
) => {
  const queryClient = useQueryClient()
  const queryKey = [...RESERVATIONS_KEY, 'list', params] as const
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getAdminReservationsPage(params, signal),
    // 쪽·탭을 바꾸는 동안 이전 쪽을 둔다 — 표가 비었다 채워지며 높이가 튀지 않게.
    placeholderData: keepPreviousData,
    ...queryPolicy.live,
    ...pollEvery(queryClient, queryKey, intervalMs),
  })
}

/**
 * 지표 카드용 집계. 서버가 5초까지 캐시하므로 그보다 자주 받아도 같은 값이다.
 * keepPrevious면 상품을 바꿔 키가 바뀌는 동안 이전 숫자를 남겨 둔다(isPlaceholderData) — 숫자가 사라졌다 나타나지 않게.
 * 쓰는 쪽은 그동안 숫자를 흐리게 그려 이전 상품 숫자를 지금 값으로 읽지 않게 한다.
 */
export const useReservationStats = (
  productId?: string,
  intervalMs: RefreshInterval = POLL_INTERVAL_MS,
  { keepPrevious = false } = {},
) => {
  const queryClient = useQueryClient()
  const queryKey = reservationStatsKey(productId)
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getReservationStats(productId, signal),
    // 소수 초 자릿수가 응답마다 달라(0·3·6자리) 문자열이 아니라 시각으로 비교한다.
    structuralSharing: keepNewer<PreorderStats>(({ countedAt }) =>
      Date.parse(countedAt),
    ),
    placeholderData: keepPrevious ? keepPreviousData : undefined,
    ...queryPolicy.live,
    ...pollEvery(queryClient, queryKey, intervalMs),
  })
}

// 모듈에 둬야 렌더마다 Map을 새로 만들지 않는다(select 함수가 같으면 결과를 재사용).
const byProductId = (items: ProductStatsItem[]) =>
  new Map(items.map((item) => [item.productId, item]))

/**
 * 접수 중(OPEN)·마감된(CLOSED) 회차의 상품별 집계를 한 요청으로. 운영 대시보드와 대기열
 * 관리가 사전예약마다 상태를 나눠 보일 때 쓴다. data는 상품 id → 집계다.
 */
export const useProductStats = (
  phase: ProductStatsPhase,
  intervalMs: RefreshInterval = POLL_INTERVAL_MS,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  const queryClient = useQueryClient()
  const queryKey = [...RESERVATIONS_KEY, 'stats-products', phase] as const
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getProductStats(phase, signal),
    select: byProductId,
    enabled,
    ...queryPolicy.live,
    ...pollEvery(queryClient, queryKey, intervalMs),
  })
}

/**
 * 재시도가 소진된(DEAD_LETTER) 외부 등록을 다시 시도한다. 결과는 조금 뒤에 반영되므로
 * 목록·집계를 무효화해 다시 받는다.
 */
export const useReprocessReservation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reprocessAdminReservation,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY }),
  })
}

/** 실패한 외부 취소를 한 번 더 보낸다. 결과는 조금 뒤에 반영돼 다시 받는다 */
export const useRetryCancelJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reprocessSyncJob,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY }),
  })
}

/**
 * 외부에서 확인한 뒤 멈춘 외부 취소를 끝낸다. 409(이미 끝남·그사이 바뀜)여도 지금 상태를
 * 다시 받아 맞춘다.
 */
export const useResolveCancelJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resolveCancelJob,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY }),
  })
}

/**
 * 외부 등록 실패를 오류 코드별로. 부하 시험 중 무엇 때문에 실패하는지, 재처리 전에 왜
 * 실패했는지(status DEAD_LETTER) 본다. enabled가 false면 묻지 않는다(닫힌 모달).
 */
export const useSyncJobErrorGroups = (
  intervalMs: RefreshInterval | false,
  {
    status,
    enabled = true,
  }: { status?: SyncJobStatus; enabled?: boolean } = {},
) => {
  const queryClient = useQueryClient()
  const queryKey = [...RESERVATIONS_KEY, 'sync-job-errors', status] as const
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getSyncJobErrorGroups(status, signal),
    enabled,
    ...queryPolicy.live,
    ...pollEvery(queryClient, queryKey, intervalMs),
  })
}

// 일괄 재처리 진행을 묻는 간격 — 결과가 다 나올 때까지만 묻는다.
const BATCH_POLL_MS = 2_000

/** 일괄 재처리 묶음들을 합친 진행. finished는 모든 묶음이 대상을 다 다루고 결과도 다 나왔을 때 */
export type ReprocessBatchesProgress = Pick<
  BatchReprocessProgress,
  'targetCount' | 'unsent' | 'succeeded' | 'failed' | 'canceled' | 'pending'
> & { finished: boolean }

const isBatchDone = (batch: BatchReprocessProgress) =>
  batch.finishedAt !== null && batch.pending === 0

/**
 * 일괄 재처리의 진행 — 시작할 때 받은 batchId들을 끝날 때까지 묻고 합친다. 하나라도 아직
 * 못 받았으면 undefined(화면은 예상 시간으로 어림한다). 실패하면 백오프하고, expired(쓰는 쪽이
 * 정한 마감)가 지나면 끝나지 않았어도 묻기를 멈춘다.
 */
export const useReprocessBatches = (
  batchIds: readonly string[],
  { expired = false }: { expired?: boolean } = {},
) => {
  const queryClient = useQueryClient()
  const pollMs = (data: BatchReprocessProgress | undefined) =>
    !expired && data && !isBatchDone(data) ? BATCH_POLL_MS : null
  return useQueries({
    queries: batchIds.map((batchId) => {
      const queryKey = [
        ...RESERVATIONS_KEY,
        'reprocess-batch',
        batchId,
      ] as const
      return {
        queryKey,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getReprocessBatch(batchId, signal),
        ...queryPolicy.live,
        ...freezeWhenDone(isBatchDone),
        // 첫 응답 전에도 묻는다 — 시작 직후라 아직 없을 수 있다.
        refetchInterval: ({
          state: { data },
        }: {
          state: { data?: BatchReprocessProgress }
        }) => (expired || (data && isBatchDone(data)) ? false : BATCH_POLL_MS),
        ...pollingRetry(() => pollMs(queryClient.getQueryData(queryKey)), {
          expired: () => expired,
        }),
      }
    }),
    combine: (results): ReprocessBatchesProgress | undefined => {
      const batches = results.map((result) => result.data)
      if (batches.length === 0 || batches.some((batch) => !batch))
        return undefined
      const all = batches as BatchReprocessProgress[]
      const sum = (
        key: keyof ReprocessBatchesProgress & keyof BatchReprocessProgress,
      ) => all.reduce((total, batch) => total + (batch[key] as number), 0)
      return {
        targetCount: sum('targetCount'),
        unsent: sum('unsent'),
        succeeded: sum('succeeded'),
        failed: sum('failed'),
        canceled: sum('canceled'),
        pending: sum('pending'),
        finished: all.every(isBatchDone),
      }
    },
  })
}

/** 여러 예약 일괄 재처리. 응답은 시작한 건수뿐이라 결과는 다시 조회해 본다 */
export const useReprocessReservations = () => {
  const queryClient = useQueryClient()
  return useMutation({
    // 목록 줄에 작업 id가 있어 작업 목록을 다시 받지 않고 바로 보낸다.
    mutationFn: (reservations: readonly AdminReservation[]) =>
      reprocessSyncJobs(targetsOf(reservations)),
    // 앞 묶음이 받아들여졌으면 뒤 묶음이 실패해도 목록은 바뀌었다 — 성공·실패 모두 다시 받는다.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY }),
  })
}

/**
 * 외부 등록 실패 전부(productId를 주면 그 사전예약만) 재처리. 운영 대시보드가 목록을
 * 거치지 않고 바로 부른다. 응답은 시작한 건수와 예상 시간뿐이라 결과는 집계로 본다.
 */
export const useReprocessFailedRegistrations = () => {
  const queryClient = useQueryClient()
  return useMutation({
    // preorderIds를 주면 그 예약만(부분 실패 뒤 다시 보낼 때), 아니면 productId 범위를 다시 찾는다.
    mutationFn: ({
      productId,
      preorderIds,
    }: {
      productId?: string
      preorderIds?: readonly string[]
    }) =>
      preorderIds
        ? reprocessAdminReservations([...preorderIds])
        : reprocessFailedRegistrations(productId),
    // 앞 묶음이 받아들여졌으면 뒤 묶음이 실패해도 집계는 바뀌었다 — 성공·실패 모두 다시 받는다.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY }),
  })
}

/**
 * 예약 상세. 목록처럼 10초마다 다시 받는다 — 결제 대기 중 결제·기한 만료, 결제 뒤
 * 취소처럼 회원·서버가 상태를 바꾸므로. 취소가 끝난 예약만 더 바뀔 게 없어 멈춘다.
 */
export const useAdminReservation = (preorderId: string) => {
  const queryClient = useQueryClient()
  const queryKey = reservationKey(preorderId)
  // select 전의 응답으로 판단한다(캐시에는 응답이 그대로 있다).
  const pollMs = (
    data: Awaited<ReturnType<typeof getAdminReservation>> | undefined,
  ) => (data && data.status !== 'CANCELED' ? POLL_INTERVAL_MS : null)
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getAdminReservation(preorderId, signal),
    select: toAdminReservationDetail,
    ...queryPolicy.live,
    refetchInterval: ({ state: { data } }) => pollMs(data) ?? false,
    ...pollingRetry(() => pollMs(queryClient.getQueryData(queryKey))),
  })
}

/** 관리자 예약 취소. 상태가 취소 중으로 바뀌어 목록·집계·상세를 다시 받는다 */
export const useCancelReservation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      preorderId,
      reason,
    }: {
      preorderId: string
      reason: string
    }) => cancelAdminReservation(preorderId, { reason }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY }),
  })
}

/** 내부 메모 저장. 응답이 바뀐 뒤의 상세라 다시 받지 않고 캐시를 바로 바꾼다 */
export const useSaveReservationNote = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      preorderId,
      internalNote,
    }: {
      preorderId: string
      internalNote: string | null
    }) => updateAdminReservationNote(preorderId, { internalNote }),
    onSuccess: (saved) =>
      queryClient.setQueryData(reservationKey(saved.preorderId), saved),
  })
}
