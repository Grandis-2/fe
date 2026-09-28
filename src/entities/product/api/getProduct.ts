import { apiClient } from '@/shared/api/client'
import type { ProductDetail } from '@/shared/api/types'

import type { Product } from '../model/product'

export const getProduct = (productId: string): Promise<Product> =>
  apiClient.request<ProductDetail>(`/products/${encodeURIComponent(productId)}`)
