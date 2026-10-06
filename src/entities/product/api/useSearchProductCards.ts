import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { searchProductCards } from './searchProductCards'

import type { ProductCardSearchParams } from '../model/productCard'

export const useSearchProductCards = (
  params: ProductCardSearchParams,
  { enabled = true }: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: ['products', 'cards', 'search', params] as const,
    // 필터를 바꾸면 키가 바뀌어 이전 조건의 요청은 signal로 취소된다.
    queryFn: ({ signal }) => searchProductCards(params, signal),
    enabled,
    ...queryPolicy.catalog,
  })
