import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { toBannerRequest, type AdminBannerFormValue } from '../model/types'

import {
  createAdminBanner,
  deleteAdminBanner,
  getAdminBanners,
  reorderAdminBanners,
  updateAdminBanner,
} from './adminBanner'

// 목록이 이 키라 만들기·수정·지우기 뒤 함께 무효화된다.
const ADMIN_BANNERS_KEY = ['admin', 'banners'] as const

export const useAdminBanners = () =>
  useQuery({
    queryKey: ADMIN_BANNERS_KEY,
    queryFn: ({ signal }) => getAdminBanners(signal),
    ...queryPolicy.live,
  })

export const useCreateAdminBanner = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (value: AdminBannerFormValue) =>
      createAdminBanner(toBannerRequest(value)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_BANNERS_KEY }),
  })
}

export const useUpdateAdminBanner = (bannerId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (value: AdminBannerFormValue) =>
      updateAdminBanner(bannerId, toBannerRequest(value)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_BANNERS_KEY }),
  })
}

export const useDeleteAdminBanner = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminBanner,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_BANNERS_KEY }),
  })
}

// 응답이 바뀐 전체 목록이라 다시 묻지 않고 그대로 캐시에 넣는다.
// 실패(400 bannerIds = 그사이 다른 관리자가 만들거나 지움)면 목록을 다시 읽어 최신 목록에서 다시 고르게 한다.
export const useReorderAdminBanners = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reorderAdminBanners,
    onSuccess: (banners) =>
      queryClient.setQueryData(ADMIN_BANNERS_KEY, banners),
    onError: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_BANNERS_KEY }),
  })
}
