import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { ProductListQuery } from '@shared/api/types'

import { getProductCards } from './getProductCards'

export const useProductCards = (query: ProductListQuery) =>
  useQuery({
    queryKey: ['products', 'cards', query] as const,
    queryFn: ({ signal }) => getProductCards(query, signal),
    ...queryPolicy.catalog,
  })
