import { apiClient } from '@shared/api/client'
import type { Paged, ProductSort, ProductSummary } from '@shared/api/types'

export type ProductSearchOptions = { size?: number; sort?: ProductSort }

// 검색창·검색 결과 화면용 — 상품명·브랜드·요약에서 키워드를 찾는다(`q`).
export const searchProducts = (
  keyword: string,
  { size = 8, sort = 'RECOMMENDED' }: ProductSearchOptions = {},
  signal?: AbortSignal,
) =>
  apiClient.request<Paged<ProductSummary>>(
    `/api/v1/products?${new URLSearchParams({ q: keyword, size: String(size), sort })}`,
    { signal },
  )
