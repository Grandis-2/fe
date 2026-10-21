import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getProductRanking } from './getProductRanking'

export const useProductRanking = () =>
  useQuery({
    queryKey: ['products', 'ranking'] as const,
    queryFn: async ({ signal }) => (await getProductRanking(signal)).items,
    ...queryPolicy.catalog,
  })
