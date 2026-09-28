import { useQuery } from '@tanstack/react-query'

import type { ProductListQuery } from '@/shared/api/types'

import { getProductCards } from './getProductCards'

export const useProductCards = (query: ProductListQuery) =>
  useQuery({
    queryKey: ['products', 'cards', query] as const,
    queryFn: () => getProductCards(query),
  })
