import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { ApiRequestError } from '@shared/api/client'
import { queryPolicy } from '@shared/api/queryPolicy'
import type {
  AdminOrderListParams,
  OrderStatus,
  ShippingStep,
} from '@shared/api/types'
import type { RefreshInterval } from '@shared/config/refreshInterval'

import { advanceShipping, getAdminOrder, getAdminOrders } from './adminOrder'

const ADMIN_ORDERS_KEY = ['admin', 'orders'] as const

/**
 * 주문 한 쪽. 쪽·필터를 바꾸는 동안 이전 쪽을 그대로 두고(placeholderData) 다 오면
 * 바꾼다 — 바꿀 때마다 표가 비었다 채워지며 높이가 튀지 않는다.
 */
export const useAdminOrders = (params: AdminOrderListParams) =>
  useQuery({
    queryKey: [...ADMIN_ORDERS_KEY, 'list', params] as const,
    queryFn: ({ signal }) => getAdminOrders(params, signal),
    placeholderData: keepPreviousData,
    ...queryPolicy.live,
  })

/**
 * 상태별 주문 수. 건수만 필요해 상태마다 한 건씩 받고 total을 쓴다 — 목록과 같은 키라
 * 주문 관리 화면이 같은 조건으로 연 쪽과 캐시를 나눠 쓴다.
 * @returns 상태 → 건수. 못 받았으면 null
 */
export const useAdminOrderCounts = <TStatus extends OrderStatus>(
  statuses: readonly TStatus[],
  /** 자동으로 다시 받는 간격. 운영 대시보드처럼 열어 두는 화면이 준다 */
  intervalMs: RefreshInterval = false,
) => {
  const queries = useQueries({
    queries: statuses.map((status) => {
      const params = { status, size: 1 }
      return {
        queryKey: [...ADMIN_ORDERS_KEY, 'list', params] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getAdminOrders(params, signal),
        ...queryPolicy.live,
        refetchInterval: intervalMs,
      }
    }),
  })
  const counts = Object.fromEntries(
    statuses.map((status, index) => [
      status,
      queries[index]?.data?.total ?? null,
    ]),
  ) as Record<TStatus, number | null>
  const refetch = () => {
    for (const query of queries) void query.refetch()
  }
  return { counts, refetch }
}

export const useAdminOrder = (orderId: string) =>
  useQuery({
    queryKey: [...ADMIN_ORDERS_KEY, 'detail', orderId] as const,
    queryFn: ({ signal }) => getAdminOrder(orderId, signal),
    ...queryPolicy.live,
  })

/**
 * 배송 단계를 옮긴다. 틀리면 배송이 꼬이는 값이라 서버 확인 뒤 반영한다. 다른 관리자가
 * 먼저 옮겼거나(409) 이미 그 단계였어도(applied false) 지금 상태로 다시 그린다.
 */
export const useAdvanceShipping = () => {
  const queryClient = useQueryClient()
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_KEY })
  return useMutation({
    mutationFn: ({
      orderId,
      step,
      reason,
    }: {
      orderId: string
      step: ShippingStep
      reason: string
    }) => advanceShipping(orderId, { step, reason }),
    onSuccess: refresh,
    onError: (caught) => {
      if (caught instanceof ApiRequestError && caught.status === 409)
        void refresh()
    },
  })
}
