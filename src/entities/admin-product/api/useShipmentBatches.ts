import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { ShipmentBatchesRequest } from '@shared/api/types'

import {
  getAdminShipmentBatches,
  putAdminShipmentBatches,
} from './adminShipment'
import { adminShipmentBatchesKey } from './keys'

// 다른 관리자가 바꿀 수 있는 값이라 다시 볼 때마다 새로 묻는다.
// 회차가 없으면(일반 상품) 404라, 사전예약일 때만 부르도록 enabled로 막는다.
export const useAdminShipmentBatches = (
  productId: string,
  { enabled = true }: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: adminShipmentBatchesKey(productId),
    queryFn: ({ signal }) => getAdminShipmentBatches(productId, signal),
    ...queryPolicy.live,
    enabled,
  })

// 교체 응답이 곧 최신 차수라, 다시 조회하지 않고 캐시를 바로 바꾼다.
export const useSaveAdminShipmentBatches = (productId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ShipmentBatchesRequest) =>
      putAdminShipmentBatches(productId, body),
    onSuccess: (saved) =>
      queryClient.setQueryData(adminShipmentBatchesKey(productId), saved),
  })
}
