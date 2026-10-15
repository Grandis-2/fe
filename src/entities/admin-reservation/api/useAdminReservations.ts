import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { pollingInterval, queryPolicy } from '@shared/api/queryPolicy'
import type { AdminPreorderListParams } from '@shared/api/types'

import {
  cancelAdminReservation,
  getAdminMembers,
  getAdminReservation,
  getAdminReservations,
  getReservationStats,
  reprocessAdminReservation,
  toAdminReservationDetail,
  updateAdminReservationNote,
} from './adminReservation'

const RESERVATIONS_KEY = ['admin', 'reservations'] as const
const POLL_INTERVAL_MS = 10_000

// 목록·집계와 같은 접두사 아래라, 재처리·취소 뒤 한 번에 무효화된다.
const reservationKey = (preorderId: string) =>
  [...RESERVATIONS_KEY, 'detail', preorderId] as const

/** 자동 갱신 간격(ms). false면 자동으로 다시 받지 않는다 */
export type RefreshInterval = number | false

// 조회가 실패하면 pollingInterval이 간격을 4배로 늘려, 이미 힘든 서버를 계속 두드리지 않는다.
const refetchEvery = (intervalMs: RefreshInterval) =>
  intervalMs === false ? false : pollingInterval(intervalMs)

/** 접수는 계속 들어오므로 주기적으로 다시 받는다. 간격은 화면이 고른다 */
export const useAdminReservations = (
  params: AdminPreorderListParams = {},
  intervalMs: RefreshInterval = POLL_INTERVAL_MS,
) =>
  useQuery({
    queryKey: [...RESERVATIONS_KEY, 'list', params] as const,
    queryFn: ({ signal }) => getAdminReservations(params, signal),
    ...queryPolicy.live,
    refetchInterval: refetchEvery(intervalMs),
  })

/** 지표 카드용 집계. 서버가 5초까지 캐시하므로 그보다 자주 받아도 같은 값이다 */
export const useReservationStats = (
  productId?: string,
  intervalMs: RefreshInterval = POLL_INTERVAL_MS,
) =>
  useQuery({
    queryKey: [...RESERVATIONS_KEY, 'stats', productId] as const,
    queryFn: ({ signal }) => getReservationStats(productId, signal),
    ...queryPolicy.live,
    refetchInterval: refetchEvery(intervalMs),
  })

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
    ...queryPolicy.account,
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

/**
 * 예약 상세. 목록처럼 10초마다 다시 받는다 — 결제 대기 중 결제·기한 만료, 결제 뒤
 * 취소처럼 회원·서버가 상태를 바꾸므로. 취소가 끝난 예약만 더 바뀔 게 없어 멈춘다.
 */
export const useAdminReservation = (preorderId: string) =>
  useQuery({
    queryKey: reservationKey(preorderId),
    queryFn: ({ signal }) => getAdminReservation(preorderId, signal),
    select: toAdminReservationDetail,
    ...queryPolicy.live,
    refetchInterval: (query) =>
      query.state.data?.status === 'CANCELED'
        ? false
        : pollingInterval(POLL_INTERVAL_MS)(query),
  })

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
