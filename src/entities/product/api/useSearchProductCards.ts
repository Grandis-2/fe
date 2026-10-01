import { useQuery } from '@tanstack/react-query'

import { searchProductCards } from './searchProductCards'

import type { ProductCardSearchParams } from '../model/productCard'

export const useSearchProductCards = (params: ProductCardSearchParams) =>
  useQuery({
    queryKey: ['products', 'cards', 'search', params] as const,
    queryFn: () => searchProductCards(params),
  })
