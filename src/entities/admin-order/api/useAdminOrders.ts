import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { ApiRequestError } from '@shared/api/client'
import { pollEvery, pollingError, queryPolicy } from '@shared/api/queryPolicy'
import type {
  AdminOrderListParams,
  OrderStatus,
  ShippingStep,
} from '@shared/api/types'
import type { RefreshInterval } from '@shared/config/refreshInterval'

import {
  failedShippingOutcome,
  type ShippingOutcome,
} from '../lib/shippingOutcome'

import {
  advanceShipping,
  getAdminOrder,
  getAdminOrderStats,
  getAdminOrders,
} from './adminOrder'

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
 * 상태별 주문 수 — 상태별 집계(orders/stats) 한 번으로 받아 화면이 고른 상태만 꺼낸다.
 * 같은 키라 대시보드와 주문 관리 화면이 한 요청을 나눠 쓴다.
 * @returns 상태 → 건수. 못 받았으면 null
 */
export const useAdminOrderCounts = <TStatus extends OrderStatus>(
  statuses: readonly TStatus[],
  /** 자동으로 다시 받는 간격. 운영 대시보드처럼 열어 두는 화면이 준다 */
  intervalMs: RefreshInterval = false,
) => {
  const queryClient = useQueryClient()
  const queryKey = [...ADMIN_ORDERS_KEY, 'stats'] as const
  const stats = useQuery({
    queryKey,
    queryFn: ({ signal }) => getAdminOrderStats(undefined, signal),
    ...queryPolicy.live,
    ...pollEvery(queryClient, queryKey, intervalMs),
  })
  const counts = Object.fromEntries(
    statuses.map((status) => [status, stats.data?.byStatus[status] ?? null]),
  ) as Record<TStatus, number | null>
  const refetch = () => void stats.refetch()
  /** 받지 못했다 — 화면이 "마지막으로 받은 값"이라고 알린다. 폴링은 재시도 중에도 켠다 */
  return { counts, refetch, isError: pollingError(stats) !== null }
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

export type ShippingBatchResult = { orderId: string; outcome: ShippingOutcome }

/**
 * 여러 주문을 같은 단계로 옮긴다. 일괄 API가 없어 한 건씩 차례로 보내고, 실패는 던지지 않고
 * 건마다 결과로 남긴다. 목록은 끝난 뒤 한 번만 다시 받는다(건마다 받으면 요청이 몰린다).
 */
export const useAdvanceShippingBatch = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderIds,
      step,
      reason,
      onProgress,
      shouldStop,
    }: {
      orderIds: readonly string[]
      step: ShippingStep
      reason: string
      /** 한 건 끝날 때마다 지금까지의 결과 */
      onProgress: (results: ShippingBatchResult[]) => void
      /** 참이면 남은 건을 보내지 않는다(이미 보낸 건은 그대로) */
      shouldStop: () => boolean
    }) => {
      const results: ShippingBatchResult[] = []
      for (const orderId of orderIds) {
        if (shouldStop()) break
        const outcome = await advanceShipping(orderId, { step, reason }).then(
          ({ applied }): ShippingOutcome => ({
            kind: applied ? 'moved' : 'already',
          }),
          failedShippingOutcome,
        )
        results.push({ orderId, outcome })
        onProgress([...results])
      }
      return results
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_KEY }),
  })
}
