import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toBannerRequest, type AdminBannerFormValue } from '../model/types'

import { createAdminBanner } from './adminBanner'

// 목록이 생기면 이 접두사로 시작해야 만든 뒤 함께 무효화된다.
const ADMIN_BANNERS_KEY = ['admin', 'banners'] as const

export const useCreateAdminBanner = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (value: AdminBannerFormValue) =>
      createAdminBanner(toBannerRequest(value)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_BANNERS_KEY }),
  })
}
