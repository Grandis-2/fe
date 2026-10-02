import { apiClient } from '@shared/api/client'
import type {
  ProductCardListResponse,
  ProductListQuery,
} from '@shared/api/types'

import type { ProductCardSummary } from '../model/productCard'

export const getProductCards = async (
  query: ProductListQuery,
  signal?: AbortSignal,
): Promise<ProductCardSummary[]> => {
  const { items } = await apiClient.request<ProductCardListResponse>(
    `/api/v1/products?query=${query}`,
    { signal },
  )
  return items
}
