import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getProduct } from './getProduct'

export const useProduct = (productId: string) =>
  useQuery({
    queryKey: ['products', 'detail', productId] as const,
    queryFn: ({ signal }) => getProduct(productId, signal),
    ...queryPolicy.catalog,
    // productId가 빈 문자열이면(라우트 파라미터가 아직 안 잡혔거나 잘못된 경로) 요청 자체를 안 보낸다.
    enabled: productId !== '',
  })
