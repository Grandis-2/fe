import { apiClient } from '@shared/api/client'

import type { Product } from '../model/product'

export const getProduct = (
  productId: string,
  signal?: AbortSignal,
): Promise<Product> =>
  apiClient.request(`/api/v1/products/${encodeURIComponent(productId)}`, {
    signal,
  })
