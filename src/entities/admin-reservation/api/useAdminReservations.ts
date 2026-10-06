import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { pollingInterval, queryPolicy } from '@shared/api/queryPolicy'
import type { AdminReservationListParams } from '@shared/api/types'

import {
  getAdminMembers,
  getAdminReservations,
  reprocessAdminReservation,
} from './adminReservation'

const RESERVATIONS_KEY = ['admin', 'reservations'] as const
const POLL_INTERVAL_MS = 10_000

const adminReservationsKey = (params: AdminReservationListParams) =>
  [...RESERVATIONS_KEY, 'list', params] as const

/**
 * 접수는 계속 들어오므로 주기적으로 다시 받는다. 조회가 실패하면 pollingInterval이
 * 간격을 40초로 늘려, 이미 힘든 서버를 10초마다 두드리지 않는다.
 */
export const useAdminReservations = (params: AdminReservationListParams = {}) =>
  useQuery({
    queryKey: adminReservationsKey(params),
    queryFn: ({ signal }) => getAdminReservations(params, signal),
    select: (paged) => paged.items,
    ...queryPolicy.live,
    refetchInterval: pollingInterval(POLL_INTERVAL_MS),
  })

// 회원 이름은 예약 응답에 없어서 따로 받아 memberId ↔ 이름을 이어준다.
// 이름은 예약만큼 자주 바뀌지 않아 폴링하지 않는다.
export const useAdminMembers = () =>
  useQuery({
    queryKey: ['admin', 'members'] as const,
    queryFn: ({ signal }) => getAdminMembers(undefined, signal),
    select: (response) => response.items,
    ...queryPolicy.account,
  })

/**
 * 자동 재시도가 소진된 예약의 외부 등록을 다시 시도한다.
 * 응답 본문은 쓰지 않고 목록을 무효화해 표 전체를 다시 받는다 — 재처리가 상태와
 * 시도 횟수를 함께 바꾸는데, 그 결과를 응답이 내려주지 않기 때문이다.
 */
export const useReprocessReservation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reprocessAdminReservation,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY }),
  })
}
