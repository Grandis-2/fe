import { uploadAdminImage } from '@shared/api/adminImage'
import { apiClient } from '@shared/api/client'
import type { AdminBannerRequest, AdminBannerView } from '@shared/api/types'

const BASE = '/api/v1/admin/banners'

// [catalog] POST /api/v1/admin/banners — 배너 만들기(맨 뒤에 붙는다)
export const createAdminBanner = (body: AdminBannerRequest) =>
  apiClient.request<AdminBannerView>(BASE, { method: 'POST', body })

/** 배너 사진 한 장을 올리고 CDN 주소를 돌려준다 — 배너 본문은 BANNER로 올린 사진만 받는다 */
export const uploadBannerImage = (file: File) =>
  uploadAdminImage(file, 'BANNER')
