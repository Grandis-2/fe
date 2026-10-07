import { queryOptions, useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getProduct } from './getProduct'

// 상품 여러 개를 한 번에 볼 때(장바구니 → 결제) useQueries에 같은 키·정책으로 넘기려고 따로 뺀다.
export const productDetailQuery = (productId: string) =>
  queryOptions({
    queryKey: ['products', 'detail', productId] as const,
    queryFn: ({ signal }) => getProduct(productId, signal),
    ...queryPolicy.catalog,
    // productId가 빈 문자열이면(라우트 파라미터가 아직 안 잡혔거나 잘못된 경로) 요청 자체를 안 보낸다.
    enabled: productId !== '',
  })

export const useProduct = (productId: string) =>
  useQuery(productDetailQuery(productId))
