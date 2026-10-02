import { apiClient } from '@shared/api/client'
import type { CountResponse } from '@shared/api/types'

export const getCartCount = async (signal?: AbortSignal) => {
  const { count } = await apiClient.request<CountResponse>(
    '/api/v1/cart/count',
    { signal },
  )
  return count
}
