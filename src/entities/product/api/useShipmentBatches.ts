import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getShipmentBatches } from './getShipmentBatches'

export const useShipmentBatches = (
  productId: string,
  { enabled = true }: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: ['products', 'shipment-batches', productId] as const,
    queryFn: async ({ signal }) =>
      (await getShipmentBatches(productId, signal)).items,
    enabled: enabled && productId !== '',
    ...queryPolicy.catalog,
  })
