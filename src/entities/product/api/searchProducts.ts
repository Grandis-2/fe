import { apiClient } from '@shared/api/client'
import type { Paged, ProductSummary } from '@shared/api/types'

// 검색창 결과용 — 상품명·브랜드·요약에서 키워드를 찾는다(`q`). 결과 화면엔 8개만 보여 준다.
export const searchProducts = (keyword: string, signal?: AbortSignal) =>
  apiClient.request<Paged<ProductSummary>>(
    `/api/v1/products?${new URLSearchParams({ q: keyword, size: '8' })}`,
    { signal },
  )
