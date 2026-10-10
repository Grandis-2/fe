import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { PreorderStatus } from '@shared/api/types'

import {
  cancelReservation,
  getMyReservations,
  getReservation,
  getReservationHistory,
} from './reservation'

// 외부 등록·취소는 서버가 비동기로 끝낸다 — 이 상태면 상세를 다시 물어 바뀐 상태를 받는다.
const SETTLING: PreorderStatus[] = ['PENDING_SYNC', 'CANCELING']
const SETTLE_POLL_MS = 3_000
// ponytail: 목록은 첫 쪽(최대 100건)만 받는다 — 화면에 더 보기가 생기면 useInfiniteQuery로 nextCursor를 잇는다.
const FIRST_PAGE = { size: 100 }

export const reservationKeys = {
  all: ['reservations'] as const,
  mine: ['reservations', 'mine'] as const,
  detail: (preorderId: string) =>
    ['reservations', 'detail', preorderId] as const,
  history: (preorderId: string) =>
    ['reservations', 'history', preorderId] as const,
}

// 결제 기한·상태가 서버에서 바뀌는 값이라 볼 때마다 새로 묻는다.
// 헤더 배지처럼 로그인했을 때만 묻는 곳은 enabled로 끈다(비로그인은 401).
export const useMyReservations = ({
  enabled = true,
}: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: reservationKeys.mine,
    queryFn: ({ signal }) => getMyReservations(FIRST_PAGE, signal),
    enabled,
    ...queryPolicy.live,
  })

export const useReservation = (preorderId: string) =>
  useQuery({
    queryKey: reservationKeys.detail(preorderId),
    queryFn: ({ signal }) => getReservation(preorderId, signal),
    enabled: preorderId !== '',
    refetchInterval: ({ state: { data } }) =>
      data && SETTLING.includes(data.status) ? SETTLE_POLL_MS : false,
    ...queryPolicy.live,
  })

export const useReservationHistory = (preorderId: string) =>
  useQuery({
    queryKey: reservationKeys.history(preorderId),
    queryFn: ({ signal }) => getReservationHistory(preorderId, signal),
    enabled: preorderId !== '',
    ...queryPolicy.live,
  })

// 취소는 서버 확인 뒤 반영한다 — 응답은 상태·version뿐이라 예약 캐시를 통째로 다시 받는다.
export const useCancelReservation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: reservationKeys.all }),
  })
}
