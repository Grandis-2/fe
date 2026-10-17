import { apiClient } from '@shared/api/client'
import type { CategoryTreeResponse } from '@shared/api/types'

// [catalog] GET /api/v1/categories — 카테고리 트리 조회
export const getCategories = (signal?: AbortSignal) =>
  apiClient.request<CategoryTreeResponse>('/api/v1/categories', { signal })
