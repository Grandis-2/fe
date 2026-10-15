import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { pollingInterval, queryPolicy } from '@shared/api/queryPolicy'
import type { AdminPreorderListParams } from '@shared/api/types'

import {
  getAdminMembers,
  getAdminReservations,
  getReservationStats,
  reprocessAdminReservation,
} from './adminReservation'

const RESERVATIONS_KEY = ['admin', 'reservations'] as const
const POLL_INTERVAL_MS = 10_000

/**
 * 접수는 계속 들어오므로 주기적으로 다시 받는다. 조회가 실패하면 pollingInterval이
 * 간격을 40초로 늘려, 이미 힘든 서버를 10초마다 두드리지 않는다.
 */
export const useAdminReservations = (params: AdminPreorderListParams = {}) =>
  useQuery({
    queryKey: [...RESERVATIONS_KEY, 'list', params] as const,
    queryFn: ({ signal }) => getAdminReservations(params, signal),
    ...queryPolicy.live,
    refetchInterval: pollingInterval(POLL_INTERVAL_MS),
  })

/** 지표 카드용 집계. 서버가 5초까지 캐시하므로 목록과 같은 간격이면 충분하다 */
export const useReservationStats = (productId?: string) =>
  useQuery({
    queryKey: [...RESERVATIONS_KEY, 'stats', productId] as const,
    queryFn: ({ signal }) => getReservationStats(productId, signal),
    ...queryPolicy.live,
    refetchInterval: pollingInterval(POLL_INTERVAL_MS),
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
