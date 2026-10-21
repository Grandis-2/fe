import { apiClient } from '@shared/api/client'
import type { PopularKeywords } from '@shared/api/types'

// [catalog] GET /api/v1/products/searches/popular — 인기 검색어(비로그인)
export const getPopularKeywords = (signal?: AbortSignal) =>
  apiClient.request<PopularKeywords>('/api/v1/products/searches/popular', {
    signal,
  })
