import { useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchAllPages, PAGE_SIZE_MAX } from '@shared/api/fetchAllPages'
import { pollEvery, queryPolicy } from '@shared/api/queryPolicy'
import type { AdminProductListParams } from '@shared/api/types'
import type { RefreshInterval } from '@shared/config/refreshInterval'

import { getAdminProducts, getGiftCandidates } from './adminProduct'
import { ADMIN_PRODUCTS_KEY, adminProductsKey } from './keys'
import { toAdminProduct } from './toAdminProduct'

/**
 * 조건에 맞는 관리자 상품 전부. 상품은 관리자가 만드는 데이터라 많아야 수백 개여서 쪽을
 * 끝까지 이어 받는다(100개씩) — 첫 쪽만 받으면 100개 뒤 상품이 목록·이름·필터에서 빠진다.
 * 서버에 정렬 조건이 없어 정렬은 받은 뒤 화면이 한다. 검색어·판매 상태가 바뀌면 키가 바뀌어
 * 이전 요청이 취소된다 — 타이핑 중에 늦게 온 옛 응답이 최신 결과를 덮지 않는다.
 */
export const useAdminProducts = (
  params: Omit<AdminProductListParams, 'page' | 'size'> = {},
) =>
  useQuery({
    queryKey: adminProductsKey(params),
    queryFn: ({ signal }) =>
      fetchAllPages((page) =>
        getAdminProducts({ ...params, page, size: PAGE_SIZE_MAX }, signal),
      ),
    // 서버는 사전예약/일반에 따라 다른 필드로 상태를 주므로 화면이 쓰는 모양으로 바꾼다.
    select: (items) => items.map(toAdminProduct),
    ...queryPolicy.live,
  })

/** 조건에 맞는 상품 수 — 한 건만 받고 전체 건수(total)를 쓴다 */
export const useAdminProductCount = (
  params: Omit<AdminProductListParams, 'page' | 'size'>,
  /** 자동으로 다시 받는 간격. 운영 대시보드처럼 열어 두는 화면이 준다 */
  intervalMs: RefreshInterval = false,
) => {
  const queryClient = useQueryClient()
  const countParams = { ...params, size: 1 }
  const queryKey = adminProductsKey(countParams)
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getAdminProducts(countParams, signal),
    select: (paged) => paged.total,
    ...queryPolicy.live,
    // 실패하면 그 간격에서 백오프하며 다시 묻는다.
    ...pollEvery(queryClient, queryKey, intervalMs),
  })
}

/**
 * 럭키 드로우 증정품 후보 전체. 고를 수 있는 것만 오므로 쪽을 끝까지 이어 받는다 — 일반
 * 목록의 첫 100개에서 거르면 조건에 안 맞는 상품이 자리를 차지해 고를 것이 빠진다.
 */
export const useGiftCandidates = () =>
  useQuery({
    queryKey: [...ADMIN_PRODUCTS_KEY, 'gift-candidates'] as const,
    queryFn: ({ signal }) =>
      fetchAllPages((page) =>
        getGiftCandidates({ page, size: PAGE_SIZE_MAX }, signal),
      ),
    ...queryPolicy.live,
  })
