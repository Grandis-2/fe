import { apiClient } from '@shared/api/client'
import type { CategoryTreeResponse } from '@shared/api/types'

export const getCategories = (signal?: AbortSignal) =>
  apiClient.request<CategoryTreeResponse>('/api/v1/categories', { signal })
