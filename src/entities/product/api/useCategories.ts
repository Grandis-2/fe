import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getCategories } from './getCategories'

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'] as const,
    queryFn: async ({ signal }) => (await getCategories(signal)).items,
    ...queryPolicy.catalog,
  })
