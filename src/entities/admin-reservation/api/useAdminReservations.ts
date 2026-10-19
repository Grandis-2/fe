import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import {
  keepNewer,
  pollEvery,
  pollingRetry,
  queryPolicy,
} from '@shared/api/queryPolicy'
import type { AdminPreorderListParams, PreorderStats } from '@shared/api/types'
import type { RefreshInterval } from '@shared/config/refreshInterval'

import {
  cancelAdminReservation,
  getAdminMembers,
  getAdminReservation,
  getAdminReservations,
  getAllAdminReservations,
  getReservationStats,
  getSyncJobErrorGroups,
  reprocessAdminReservation,
  reprocessAdminReservations,
  reprocessByErrorCodes,
  toAdminReservationDetail,
  updateAdminReservationNote,
} from './adminReservation'

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
  params: AdminPreorderListParams = {},
  intervalMs: RefreshInterval = POLL_INTERVAL_MS,
) => {
  const queryClient = useQueryClient()
  const queryKey = [...RESERVATIONS_KEY, 'list', params] as const
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getAdminReservations(params, signal),
    ...queryPolicy.live,
    ...pollEvery(queryClient, queryKey, intervalMs),
  })
}

/**
 * 모든 예약. 외부 원장과 맞춰 보는 데만 쓴다. 무거워서 화면에 처음 들어올 때 한 번만
 * 받고, 그 뒤엔 '대조 실행'의 refetch로만 다시 받는다. 상품은 받은 뒤 화면이 거른다 —
 * 상품을 바꿀 때마다 다시 받지 않으려고.
 */
export const useAllAdminReservations = () =>
  useQuery({
    // 재처리·취소 뒤 무효화(RESERVATIONS_KEY)에 끌려 혼자 다시 받으면 외부 원장과 받은
    // 시점이 어긋난다 — 접두사 밖에 둔다.
    queryKey: ['admin', 'reservations-snapshot'] as const,
    queryFn: ({ signal }) => getAllAdminReservations(signal),
    ...queryPolicy.snapshot,
  })

const statsQuery = (
  queryClient: QueryClient,
  productId: string | undefined,
  intervalMs: RefreshInterval,
) => {
  const queryKey = reservationStatsKey(productId)
  return {
    queryKey,
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      getReservationStats(productId, signal),
    // 소수 초 자릿수가 응답마다 달라(0·3·6자리) 문자열이 아니라 시각으로 비교한다.
    structuralSharing: keepNewer<PreorderStats>(({ countedAt }) =>
      Date.parse(countedAt),
    ),
    ...queryPolicy.live,
    ...pollEvery(queryClient, queryKey, intervalMs),
  }
}

/** 지표 카드용 집계. 서버가 5초까지 캐시하므로 그보다 자주 받아도 같은 값이다 */
export const useReservationStats = (
  productId?: string,
  intervalMs: RefreshInterval = POLL_INTERVAL_MS,
) => useQuery(statsQuery(useQueryClient(), productId, intervalMs))

/**
 * 여러 상품의 집계를 한꺼번에(상품마다 한 요청). 운영 홈이 진행 중인 사전예약마다
 * 상태를 나눠 보일 때 쓴다. 같은 키라 예약 현황의 상품별 집계와 캐시를 나눠 쓴다.
 */
export const useReservationStatsByProduct = (
  productIds: readonly string[],
  intervalMs: RefreshInterval = POLL_INTERVAL_MS,
) => {
  const queryClient = useQueryClient()
  return useQueries({
    queries: productIds.map((productId) =>
      statsQuery(queryClient, productId, intervalMs),
    ),
  })
}

/**
 * 표에 보이는 회원 id를 이름으로 바꾼다. 이름은 예약만큼 자주 바뀌지 않아 폴링하지
 * 않는다. id 순서가 달라도 같은 캐시를 쓰도록 정렬해 키로 쓴다.
 */
export const useAdminMembers = (memberIds: string[]) => {
  const ids = [...new Set(memberIds)].sort()
  return useQuery({
    queryKey: ['admin', 'members', ids] as const,
    queryFn: ({ signal }) => getAdminMembers(ids, signal),
    select: (response) => response.items,
    enabled: ids.length > 0,
    ...queryPolicy.catalog,
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

/** 외부 등록 실패를 오류 코드별로. 부하 시험 중 무엇 때문에 실패하는지 본다 */
export const useSyncJobErrorGroups = (intervalMs: RefreshInterval) => {
  const queryClient = useQueryClient()
  const queryKey = [...RESERVATIONS_KEY, 'sync-job-errors'] as const
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getSyncJobErrorGroups(signal),
    ...queryPolicy.live,
    ...pollEvery(queryClient, queryKey, intervalMs),
  })
}

/** 오류 코드별 일괄 재처리. 응답은 시작한 건수뿐이라 결과는 집계를 다시 받아 본다 */
export const useReprocessByErrorCodes = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reprocessByErrorCodes,
    onSettled: () =>
      // 중간 코드에서 실패해도 앞 코드는 이미 시작됐다 — 성공·실패 모두 다시 받는다.
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY }),
  })
}

/** 여러 예약 일괄 재처리. 응답은 시작한 건수뿐이라 결과는 다시 조회해 본다 */
export const useReprocessReservations = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reprocessAdminReservations,
    onSuccess: () =>
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
