import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { keepNewer, pollingRetry, queryPolicy } from '@shared/api/queryPolicy'
import type { PreorderStatus } from '@shared/api/types'

import {
  NEEDS_PURCHASE,
  type ReservationDetail,
  type ReservationDisplayStatus,
} from '../model/reservation'

import {
  cancelReservation,
  getMyReservations,
  getReservation,
  getReservationCounts,
  getReservationHistory,
} from './reservation'

// 외부 등록·취소는 서버가 비동기로 끝낸다 — 이 상태면 상세를 다시 물어 바뀐 상태를 받는다.
const SETTLING: PreorderStatus[] = ['PENDING_SYNC', 'CANCELING']
const SETTLE_POLL_MS = 3_000

export const reservationKeys = {
  all: ['reservations'] as const,
  mine: (displayStatus: ReservationDisplayStatus[]) =>
    ['reservations', 'mine', displayStatus] as const,
  counts: ['reservations', 'counts'] as const,
  detail: (preorderId: string) =>
    ['reservations', 'detail', preorderId] as const,
  history: (preorderId: string) =>
    ['reservations', 'history', preorderId] as const,
}

// 내 예약 — 화면 단계(displayStatus) 중 하나에 해당하는 것을 서버가 거르고 nextCursor로 20건씩 잇는다(무한 스크롤).
// 결제 기한·상태가 서버에서 바뀌는 값이라 볼 때마다 새로 묻는다. 탭을 바꾸는 동안엔 앞 목록을 그대로 두고
// 화면은 isPlaceholderData로 받는 중으로 그린다.
export const useMyReservations = (displayStatus: ReservationDisplayStatus[]) =>
  useInfiniteQuery({
    queryKey: reservationKeys.mine(displayStatus),
    queryFn: ({ pageParam, signal }) =>
      getMyReservations({ displayStatus, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: ({ nextCursor }) => nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    ...queryPolicy.live,
  })

// 화면 단계별 예약 수(조건과 상관없는 전체). 헤더 배지처럼 로그인했을 때만 묻는 곳은 enabled로 끈다(비로그인은 401).
export const useReservationCounts = (enabled = true) =>
  useQuery({
    queryKey: reservationKeys.counts,
    queryFn: ({ signal }) => getReservationCounts(signal),
    enabled,
    ...queryPolicy.live,
  })

// 구매 확정(결제)이 필요한 사전예약 수 — 헤더 마이페이지 아이콘과 마이페이지 메뉴의 숫자가 같이 써서
// 둘이 어긋나지 않는다.
export const usePendingPurchaseCount = (enabled = true) => {
  const { data } = useReservationCounts(enabled)
  if (!enabled || !data) return 0
  return NEEDS_PURCHASE.reduce((sum, stage) => sum + data[stage], 0)
}

const settlePollMs = (data: ReservationDetail | undefined) =>
  data && SETTLING.includes(data.status) ? SETTLE_POLL_MS : null

// 처리를 기다리는 동안 실패하면 백오프하며 다시 묻는다.
// ponytail: 제한 시간은 두지 않는다 — 명세에 외부 등록·취소 처리 시간이 없다. 정해지면 useOrder처럼 useDeadline을 붙인다.
export const useReservation = (preorderId: string) => {
  const queryClient = useQueryClient()
  const queryKey = reservationKeys.detail(preorderId)
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getReservation(preorderId, signal),
    enabled: preorderId !== '',
    refetchInterval: ({ state: { data } }) => settlePollMs(data) ?? false,
    // PAYMENT_IN_PROGRESS·PAYMENT_EXPIRED로 바뀔 땐 version이 그대로라 같은 값은 받는다.
    structuralSharing: keepNewer<ReservationDetail>(({ version }) => version),
    ...queryPolicy.live,
    ...pollingRetry(() =>
      settlePollMs(queryClient.getQueryData<ReservationDetail>(queryKey)),
    ),
  })
}

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
