import { apiClient } from '@shared/api/client'

import type { Product } from '../model/product'

// [catalog] GET /api/v1/products/{productId} — 상품 상세
export const getProduct = (
  productId: string,
  signal?: AbortSignal,
): Promise<Product> =>
  apiClient.request(`/api/v1/products/${encodeURIComponent(productId)}`, {
    signal,
  })
