import { apiClient } from '@shared/api/client'
import type {
  StockCorrectionRequest,
  StockCorrectionResponse,
  StockOverviewResponse,
  StockReconcileRunResponse,
  StockRequest,
} from '@shared/api/types'

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

// [order] GET /api/v1/admin/stock/reconcile-runs/latest — 마지막 재고 장부 대조 결과
/** 마지막으로 끝난 대조와 그때 어긋난 옵션. 한 번도 끝나지 않았으면 404 */
export const getLatestStockReconcileRun = (signal?: AbortSignal) =>
  apiClient.request<StockReconcileRunResponse>(
    '/api/v1/admin/stock/reconcile-runs/latest',
    { signal },
  )

// [order] POST /api/v1/admin/products/{productId}/stock/options/{optionId}/reconcile — 주문 기준으로 보정
/**
 * 옵션 하나의 확보·판매 수량을 주문 기준으로 덮는다. 총량은 그대로다. 주문 기준 합이
 * 총량보다 크면 409(STOCK_TOTAL_BELOW_EXPECTED) — 총량을 먼저 늘려야 한다.
 */
export const correctStockOption = (
  productId: string,
  optionId: string,
  body: StockCorrectionRequest,
) =>
  apiClient.request<StockCorrectionResponse>(
    `${stockPath(productId)}/options/${optionId}/reconcile`,
    { method: 'POST', body },
  )
