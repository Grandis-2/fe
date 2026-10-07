import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { ProductListParams } from '@shared/api/types'

import { getProducts } from './getProducts'

export const useProducts = (
  params: ProductListParams,
  { enabled = true }: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: ['products', 'list', params] as const,
    // 조건이 바뀌면 키가 바뀌어 이전 요청은 signal로 취소된다.
    queryFn: ({ signal }) => getProducts(params, signal),
    enabled,
    // 검색어·페이지를 바꾸는 동안 직전 결과를 그대로 두어 '불러오는 중'으로 깜빡이지 않게 한다.
    placeholderData: keepPreviousData,
    ...queryPolicy.catalog,
  })
