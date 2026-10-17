import { apiClient } from '@shared/api/client'
import type { StockOverviewResponse, StockRequest } from '@shared/api/types'

const stockPath = (productId: string) =>
  `/api/v1/admin/products/${productId}/stock`

// [order] GET /api/v1/admin/products/{productId}/stock — 재고 조회
/** 옵션별 재고 현황. 사전예약 상품은 재고를 세지 않아 tracked false와 빈 목록이 온다 */
export const getAdminProductStock = (productId: string, signal?: AbortSignal) =>
  apiClient.request<StockOverviewResponse>(stockPath(productId), { signal })

// [order] PUT /api/v1/admin/products/{productId}/stock — 재고 총량 설정
/**
 * 요청한 옵션의 총량을 덮어쓴다. 전부 반영되거나 전부 안 된다 — 한 옵션이라도 총량이
 * 이미 확보·판매된 수량보다 작으면 409(STOCK_BELOW_COMMITTED)다.
 */
export const putAdminProductStock = (productId: string, body: StockRequest) =>
  apiClient.request<unknown>(stockPath(productId), { method: 'PUT', body })
