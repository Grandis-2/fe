import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { pollingRetry, queryPolicy } from '@shared/api/queryPolicy'
import { paymentCheckSignal } from '@shared/api/requestLog'
import type { OrderStatus } from '@shared/api/types'
import { useDeadline } from '@shared/lib/useDeadline'

import {
  cancelOrder,
  createPaymentAttempt,
  getOrder,
  getOrders,
  placeOrder,
} from './order'

// 승인 결과를 기다리는 동안(AUTHORIZING) 주문 상세를 다시 묻는다.
const AUTHORIZING_POLL_MS = 3_000
// 승인은 최대 70초쯤 걸릴 수 있다(명세: 최대 대기 시간이 지나면 '주문 내역에서 확인' 안내).
const AUTHORIZING_LIMIT_MS = 70_000
// 내 주문 목록 조건 — statuses는 그중 하나에 해당하는 주문(없으면 전체), months는 최근 몇 개월(없거나 0이면 기간 제한 없음).
export type OrderFilter = { statuses?: OrderStatus[]; months?: number }

const orderKeys = {
  all: ['orders'] as const,
  mine: (filter: OrderFilter) => ['orders', 'mine', filter] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
}

// 오늘 0시(이 기기 시간대)에서 months개월 전 — 하루 동안 같은 값이라 다음 쪽도 처음과 같은 조건으로 묻는다.
const monthsAgo = (months: number) => {
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setMonth(since.getMonth() - months)
  return since.toISOString()
}

// 내 주문 — 서버가 거르고 nextCursor로 20건씩 잇는다(무한 스크롤). 응답마다 오는 counts는 조건과 상관없는 전체 기준이다.
// 조건을 바꾸는 동안엔 앞 응답을 그대로 둔다 — counts는 그대로 쓰고, 목록 자리는 isPlaceholderData로 받는 중으로 그린다.
export const useOrders = ({ statuses, months }: OrderFilter) =>
  useInfiniteQuery({
    queryKey: orderKeys.mine({ statuses, months }),
    queryFn: ({ pageParam, signal }) =>
      getOrders(
        {
          status: statuses,
          from: months ? monthsAgo(months) : undefined,
          cursor: pageParam,
        },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: ({ nextCursor }) => nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    ...queryPolicy.live,
  })

const authorizingPollMs = (
  data: Awaited<ReturnType<typeof getOrder>> | undefined,
) => (data?.status === 'AUTHORIZING' ? AUTHORIZING_POLL_MS : null)

// AUTHORIZING이 70초를 넘기면 자동 조회를 끄고 timedOut으로 알린다 — 화면은 "다시 결제" 대신
// "주문 내역에서 확인"과 [다시 확인](recheck)을 보인다. 그 안에서 실패하면 백오프하며 다시 묻는다.
export const useOrder = (orderId: string) => {
  const queryClient = useQueryClient()
  const queryKey = orderKeys.detail(orderId)
  const pollMs = () => authorizingPollMs(queryClient.getQueryData(queryKey))
  const deadline = useDeadline(pollMs() !== null, AUTHORIZING_LIMIT_MS)
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => getOrder(orderId, paymentCheckSignal(signal)),
    enabled: orderId !== '' && !deadline.passed,
    refetchInterval: ({ state: { data } }) => authorizingPollMs(data) ?? false,
    ...queryPolicy.live,
    ...pollingRetry(pollMs, { expired: () => deadline.passed }),
  })
  return {
    ...query,
    // 제한이 지났고 마지막 요청도 끝났다(오프라인이면 다시 연결돼 한 번 더 물은 뒤).
    timedOut: deadline.passed && query.fetchStatus === 'idle',
    recheck: deadline.restart,
  }
}

// 주문 생성·결제 준비는 돈이 움직이지 않는 단계지만, 명령이라 자동 재시도하지 않는다(사용자가 다시 누른다).
export const usePlaceOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: placeOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  })
}

export const useCreatePaymentAttempt = () =>
  useMutation({ mutationFn: createPaymentAttempt })

// 결제 전 장바구니·바로 구매 주문 취소 — 서버 확인 뒤 주문 목록·상세를 다시 받는다.
export const useCancelOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  })
}
