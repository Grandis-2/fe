import { apiClient } from '@shared/api/client'
import type { ProductRankingResponse } from '@shared/api/types'

// [catalog] GET /api/v1/products/ranking — 조회수 랭킹(비로그인)
export const getProductRanking = (signal?: AbortSignal) =>
  apiClient.request<ProductRankingResponse>('/api/v1/products/ranking', {
    signal,
  })
