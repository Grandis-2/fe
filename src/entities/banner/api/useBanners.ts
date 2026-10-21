import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getBanners } from './getBanners'

export const useBanners = () =>
  useQuery({
    queryKey: ['banners'] as const,
    queryFn: async ({ signal }) => (await getBanners(signal)).items,
    ...queryPolicy.catalog,
  })
