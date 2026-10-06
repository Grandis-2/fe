import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { AdminProductListParams } from '@shared/api/types'

import { getAdminProducts } from './adminProduct'

const adminProductsKey = (params: AdminProductListParams) =>
  ['admin', 'products', 'list', params] as const

/**
 * 관리자 상품 목록. 검색어·판매 상태가 바뀌면 키가 바뀌어 이전 요청이 취소된다 —
 * 타이핑 중에 늦게 온 옛 응답이 최신 결과를 덮지 않는다.
 */
export const useAdminProducts = (params: AdminProductListParams = {}) =>
  useQuery({
    queryKey: adminProductsKey(params),
    queryFn: ({ signal }) => getAdminProducts(params, signal),
    select: (paged) => paged.items,
    ...queryPolicy.live,
  })
