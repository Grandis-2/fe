import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getPreorder, getPreorders } from './preorders'

// 상품 목록·상세와 같은 공개 데이터라 catalog 정책이다.
export const usePreorders = () =>
  useQuery({
    queryKey: ['preorders', 'promotions'] as const,
    queryFn: ({ signal }) => getPreorders(signal),
    ...queryPolicy.catalog,
  })

export const usePreorder = (productId: string) =>
  useQuery({
    queryKey: ['preorders', 'promotions', productId] as const,
    queryFn: ({ signal }) => getPreorder(productId, signal),
    enabled: productId !== '',
    ...queryPolicy.catalog,
  })
