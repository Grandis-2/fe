import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { keepNewer, pollingRetry, queryPolicy } from '@shared/api/queryPolicy'
import type { PreorderStatus } from '@shared/api/types'
import { useDeadline } from '@shared/lib/useDeadline'

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

// 결제 기한이 지난(PAYMENT_EXPIRED) 예약도 기다린다 — 서버가 주기 작업으로 만료 취소를 시작해 취소 완료까지 간다.
const settlePollMs = (data: ReservationDetail | undefined) =>
  data &&
  (SETTLING.includes(data.status) || data.displayStatus === 'PAYMENT_EXPIRED')
    ? SETTLE_POLL_MS
    : null

// 결제를 기다리는 예약은 기한이 되는 순간 한 번 다시 묻는다 — 그때부터 만료 취소가 시작돼 위 폴링이 이어받는다.
// 서버 시계보다 조금 늦게 묻고, 아직 결제 대기로 오면 1초 뒤 다시 묻는다.
const untilDueMs = (data: ReservationDetail | undefined) =>
  data && NEEDS_PURCHASE.includes(data.displayStatus) && data.paymentDueAt
    ? Math.max(Date.parse(data.paymentDueAt) - Date.now(), 0) + 1_000
    : null

// 외부 등록은 접수 후 이 시간까지만 저절로 묻는다. 관리자 대조가 '등록 지연'으로 잡는 시간(RECONCILE_GRACE_MS)과
// 같아 사용자와 운영자가 같은 시점에 지연을 본다. 끝내 실패한 등록(재처리 대기)은 관리자가 다시 처리해야 끝나므로
// 3초마다 계속 묻지 않고 멈춘 뒤 [다시 확인](recheck)으로만 묻는다.
const REGISTER_WAIT_MS = 60_000

// 처리를 기다리는 동안 실패하면 백오프하며 다시 묻는다. 외부 등록 대기가 접수 후 60초를 넘기면 자동 조회를 끄고
// timedOut으로 알린다(useOrder와 같은 모양). 취소·만료 취소는 서버가 곧 끝내므로 제한을 두지 않는다.
export const useReservation = (preorderId: string) => {
  const queryClient = useQueryClient()
  const queryKey = reservationKeys.detail(preorderId)
  const cached = queryClient.getQueryData<ReservationDetail>(queryKey)
  const registering = cached?.status === 'PENDING_SYNC'
  const deadline = useDeadline(
    registering,
    REGISTER_WAIT_MS,
    registering ? Date.parse(cached.createdAt) : undefined,
  )
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => getReservation(preorderId, signal),
    enabled: preorderId !== '' && !deadline.passed,
    refetchInterval: ({ state: { data } }) =>
      settlePollMs(data) ?? untilDueMs(data) ?? false,
    // PAYMENT_IN_PROGRESS·PAYMENT_EXPIRED로 바뀔 땐 version이 그대로라 같은 값은 받는다.
    structuralSharing: keepNewer<ReservationDetail>(({ version }) => version),
    ...queryPolicy.live,
    ...pollingRetry(
      () => settlePollMs(queryClient.getQueryData<ReservationDetail>(queryKey)),
      { expired: () => deadline.passed },
    ),
  })
  return {
    ...query,
    // 제한이 지났고 마지막 요청도 끝났다. [다시 확인]은 한 번 더 묻고, 그래도 처리 중이면 다시 멈춘다.
    timedOut: deadline.passed && query.fetchStatus === 'idle',
    recheck: deadline.restart,
  }
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
