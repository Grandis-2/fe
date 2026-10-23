import { apiClient } from '@shared/api/client'
import type { SearchRequest, ViewRequest } from '@shared/api/types'
import { getAnonymousId } from '@shared/lib/anonymousId'

// 랭킹·인기 검색어 집계용 신호. 응답을 기다리지 않고, 실패해도 사용자에게 알리지 않는다(명세: 400도 넘어가도 됨).
const fire = (path: string, body: ViewRequest | SearchRequest) => {
  apiClient.request<void>(path, { method: 'POST', body }).catch(() => {})
}

// [catalog] POST /api/v1/products/{productId}/views — 상품 상세가 뜰 때 한 번
export const sendProductView = (productId: string) =>
  fire(`/api/v1/products/${encodeURIComponent(productId)}/views`, {
    anonymousId: getAnonymousId(),
  })

// [catalog] POST /api/v1/products/searches — 검색창에서 검색을 실행할 때 한 번
export const sendSearch = (q: string) =>
  fire('/api/v1/products/searches', { q, anonymousId: getAnonymousId() })
