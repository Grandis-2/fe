import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { searchProducts } from './searchProducts'

export const useProductSearch = (keyword: string) =>
  useQuery({
    queryKey: ['products', 'keyword', keyword] as const,
    // 키워드가 바뀌면 이전 요청은 signal로 취소된다.
    queryFn: ({ signal }) => searchProducts(keyword, signal),
    enabled: keyword !== '',
    // 글자를 더 칠 때마다 스켈레톤으로 깜빡이지 않게 직전 결과를 그대로 보여 준다.
    placeholderData: keepPreviousData,
    ...queryPolicy.catalog,
  })
