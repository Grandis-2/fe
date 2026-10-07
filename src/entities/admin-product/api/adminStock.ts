import { apiClient } from '@shared/api/client'
import type {
  AdminStockPutRequest,
  AdminStockResponse,
  AdminStockItem,
} from '@shared/api/types'

const stockPath = (productId: string) =>
  `/api/v1/admin/products/${productId}/stock`

/** 옵션별 재고 현황을 조회한다 */
export const getAdminProductStock = (productId: string) =>
  apiClient.request<AdminStockResponse>(stockPath(productId))

/**
 * 지정 옵션의 초기 수량·조정 설정을 반영한다.
 * 이미 확보된 수량보다 줄이면 409 STOCK_ADJUSTMENT_CONFLICT가 온다.
 */
export const putAdminProductStock = (
  productId: string,
  body: AdminStockPutRequest,
) =>
  apiClient.request<AdminStockItem>(stockPath(productId), {
    method: 'PUT',
    body,
  })
