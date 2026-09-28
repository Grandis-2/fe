import { useQuery } from '@tanstack/react-query'

import { getProduct } from './getProduct'

export const useProduct = (productId: string) =>
  useQuery({
    queryKey: ['products', 'detail', productId] as const,
    queryFn: () => getProduct(productId),
  })
