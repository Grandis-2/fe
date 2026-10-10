import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { createPaymentAttempt, getOrder, getOrders, placeOrder } from './order'

// 승인 결과를 기다리는 동안(AUTHORIZING) 주문 상세를 다시 묻는다.
const AUTHORIZING_POLL_MS = 3_000
// ponytail: 목록은 첫 쪽(최대 100건)만 받는다 — 화면에 더 보기가 생기면 useInfiniteQuery로 nextCursor를 잇는다.
const FIRST_PAGE = { size: 100 }

const orderKeys = {
  all: ['orders'] as const,
  mine: ['orders', 'mine'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
}

export const useOrders = () =>
  useQuery({
    queryKey: orderKeys.mine,
    queryFn: ({ signal }) => getOrders(FIRST_PAGE, signal),
    ...queryPolicy.live,
  })

export const useOrder = (orderId: string) =>
  useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
    enabled: orderId !== '',
    refetchInterval: ({ state: { data } }) =>
      data?.status === 'AUTHORIZING' ? AUTHORIZING_POLL_MS : false,
    ...queryPolicy.live,
  })

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
