import { apiClient } from '@shared/api/client'
import type {
  ProductListItem,
  ProductListParams,
  PageResponse,
} from '@shared/api/types'

// 목록·키워드 검색·카테고리 둘러보기가 모두 이 API 하나다(백엔드에 /products/search는 없다).
export const getProducts = (
  params: ProductListParams,
  signal?: AbortSignal,
): Promise<PageResponse<ProductListItem>> => {
  // 값이 없는 키는 빼야 'undefined' 문자열이 쿼리로 새지 않는다. page 0은 값이라 남긴다.
  // color·storage 같은 배열은 같은 키를 반복해 붙인다.
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    for (const item of [value].flat()) {
      if (item !== undefined && item !== '') query.append(key, String(item))
    }
  }
  return apiClient.request(`/api/v1/products?${query}`, { signal })
}
