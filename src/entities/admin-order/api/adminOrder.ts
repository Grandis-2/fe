import { apiClient } from '@shared/api/client'
import { fetchConcatPage } from '@shared/api/fetchAllPages'
import { toQueryString } from '@shared/api/queryString'
import type {
  OrderStatus,
  AdminOrderDetail,
  AdminOrderListParams,
  AdminOrderPage,
  AdminOrderStats,
  AdvanceShippingRequest,
  ShippingStepResponse,
} from '@shared/api/types'

const BASE = '/api/v1/admin/orders'

/** 모든 회원의 주문(최신순). 상태·출처는 둘 다 주면 둘 다 맞는 것만 */
export const getAdminOrders = (
  params: AdminOrderListParams,
  signal?: AbortSignal,
) =>
  apiClient.request<AdminOrderPage>(`${BASE}${toQueryString(params)}`, {
    signal,
  })

// [order] GET /api/v1/admin/orders/stats — 상태별 주문 수
/** 상태마다 몇 건인지 한 번에. productId를 주면 그 상품을 담은 주문만 센다 */
export const getAdminOrderStats = (productId?: string, signal?: AbortSignal) =>
  apiClient.request<AdminOrderStats>(
    `${BASE}/stats${toQueryString({ productId })}`,
    { signal },
  )

/** 목록 조건 — statuses를 여럿 주면 상태별 목록을 준 순서대로 이어 붙여 쪽을 나눈다 */
export type AdminOrderListQuery = Omit<AdminOrderListParams, 'status'> & {
  statuses?: readonly OrderStatus[]
}

// [order] GET /api/v1/admin/orders — 전체 주문 목록 한 쪽, 상태 여럿
/**
 * 서버는 상태를 하나만 거를 수 있어서, 상태를 여럿 주면(취소 탭 = 취소 중 다음 취소 완료)
 * 상태별 목록을 이어 붙여 쪽을 나눈다.
 */
export const getAdminOrdersPage = (
  { statuses = [], ...params }: AdminOrderListQuery,
  signal?: AbortSignal,
) =>
  statuses.length > 1
    ? fetchConcatPage(
        statuses.map(
          (status) => (page: number, size: number) =>
            getAdminOrders({ ...params, status, page, size }, signal),
        ),
        params.page ?? 0,
        params.size ?? 20,
      )
    : getAdminOrders({ ...params, status: statuses[0] }, signal)

export const getAdminOrder = (orderId: string, signal?: AbortSignal) =>
  apiClient.request<AdminOrderDetail>(
    `${BASE}/${encodeURIComponent(orderId)}`,
    { signal },
  )

/**
 * 배송 단계를 한 칸 옮긴다. 이미 그 단계면 아무것도 바꾸지 않고 applied false라 두 번
 * 눌러도 안전하다. 갈 수 없으면 409 ORDER_STEP_NOT_ALLOWED(details.status에 지금 상태)
 */
export const advanceShipping = (
  orderId: string,
  body: AdvanceShippingRequest,
) =>
  apiClient.request<ShippingStepResponse>(
    `${BASE}/${encodeURIComponent(orderId)}/shipping-steps`,
    { method: 'POST', body },
  )
