import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import {
  toPromotionRequest,
  type AdminPromotionFormValue,
} from '../model/types'

import {
  createAdminPromotion,
  getAdminPromotion,
  getAdminPromotions,
  updateAdminPromotion,
} from './adminPromotion'

// 목록·상세가 이 접두사로 시작해야 저장 뒤 한 번에 무효화된다.
const ADMIN_PROMOTIONS_KEY = ['admin', 'promotions'] as const

export const useAdminPromotions = () =>
  useQuery({
    queryKey: ADMIN_PROMOTIONS_KEY,
    queryFn: ({ signal }) => getAdminPromotions(signal),
    ...queryPolicy.live,
  })

export const useAdminPromotion = (promotionId: string) =>
  useQuery({
    queryKey: [...ADMIN_PROMOTIONS_KEY, promotionId],
    queryFn: ({ signal }) => getAdminPromotion(promotionId, signal),
    ...queryPolicy.live,
  })

export const useCreateAdminPromotion = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (value: AdminPromotionFormValue) =>
      createAdminPromotion(toPromotionRequest(value)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_PROMOTIONS_KEY }),
  })
}

export const useUpdateAdminPromotion = (promotionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (value: AdminPromotionFormValue) =>
      updateAdminPromotion(promotionId, toPromotionRequest(value)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_PROMOTIONS_KEY }),
  })
}
