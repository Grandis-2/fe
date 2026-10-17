import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { AdminProductListParams } from '@shared/api/types'

import { getAdminProducts } from './adminProduct'
import { adminProductsKey } from './keys'
import { toAdminProduct } from './toAdminProduct'

/**
 * 관리자 상품 목록. 검색어·판매 상태가 바뀌면 키가 바뀌어 이전 요청이 취소된다 —
 * 타이핑 중에 늦게 온 옛 응답이 최신 결과를 덮지 않는다.
 */
export const useAdminProducts = (params: AdminProductListParams = {}) =>
  useQuery({
    queryKey: adminProductsKey(params),
    queryFn: ({ signal }) => getAdminProducts(params, signal),
    // 서버는 사전예약/일반에 따라 다른 필드로 상태를 주므로 화면이 쓰는 모양으로 바꾼다.
    select: (paged) => paged.items.map(toAdminProduct),
    ...queryPolicy.live,
  })
