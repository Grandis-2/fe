import { apiClient } from '@/shared/api/client'
import type {
  ProductCardListResponse,
  ProductListQuery,
} from '@/shared/api/types'

import type { ProductCardSummary } from '../model/productCard'

export const getProductCards = async (
  query: ProductListQuery,
): Promise<ProductCardSummary[]> => {
  const { items } = await apiClient.request<ProductCardListResponse>(
    `/products?query=${query}`,
  )
  return items
}
