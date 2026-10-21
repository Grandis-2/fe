import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getPopularKeywords } from './getPopularKeywords'

export const usePopularKeywords = () =>
  useQuery({
    queryKey: ['products', 'popular-keywords'] as const,
    queryFn: async ({ signal }) => (await getPopularKeywords(signal)).keywords,
    ...queryPolicy.catalog,
  })
