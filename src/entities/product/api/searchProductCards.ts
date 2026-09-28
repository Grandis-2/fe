import { apiClient } from '@/shared/api/client'
import type {
  ProductCardSearchParams,
  ProductCardSearchResponse,
} from '@/shared/api/types'

import type { ProductCardSearchResult } from '../model/productCard'

export const searchProductCards = (
  params: ProductCardSearchParams,
): Promise<ProductCardSearchResult> => {
  // 값이 없는 키는 빼야 'undefined' 문자열이 쿼리로 새지 않는다.
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  )
  return apiClient.request<ProductCardSearchResponse>(
    `/products/search?${query}`,
  )
}
