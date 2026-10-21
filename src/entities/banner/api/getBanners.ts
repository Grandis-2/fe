import { apiClient } from '@shared/api/client'
import type { BannerListResponse } from '@shared/api/types'

// [catalog] GET /api/v1/banners — 메인 배너(비로그인)
export const getBanners = (signal?: AbortSignal) =>
  apiClient.request<BannerListResponse>('/api/v1/banners', { signal })
