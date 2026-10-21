import { uploadAdminImage } from '@shared/api/adminImage'
import { apiClient } from '@shared/api/client'
import type { AdminBannerRequest, AdminBannerView } from '@shared/api/types'

const BASE = '/api/v1/admin/banners'

// [catalog] GET /api/v1/admin/banners — 모든 배너(보이는 순서). 페이지 없이 한 번에 온다
export const getAdminBanners = (signal?: AbortSignal) =>
  apiClient
    .request<{ items: AdminBannerView[] }>(BASE, { signal })
    .then((response) => response.items)

// [catalog] POST /api/v1/admin/banners — 배너 만들기(맨 뒤에 붙는다)
export const createAdminBanner = (body: AdminBannerRequest) =>
  apiClient.request<AdminBannerView>(BASE, { method: 'POST', body })

// [catalog] PUT /api/v1/admin/banners/{bannerId} — 통째로 고친다. 순서(position)는 안 바뀐다
export const updateAdminBanner = (bannerId: string, body: AdminBannerRequest) =>
  apiClient.request<AdminBannerView>(`${BASE}/${bannerId}`, {
    method: 'PUT',
    body,
  })

// [catalog] DELETE /api/v1/admin/banners/{bannerId} — 되돌릴 수 없다(204)
export const deleteAdminBanner = (bannerId: string) =>
  apiClient.request<void>(`${BASE}/${bannerId}`, { method: 'DELETE' })

// [catalog] PUT /api/v1/admin/banners/order — 모든 배너 id를 보일 순서대로 한 번씩. 바뀐 전체 목록이 온다
export const reorderAdminBanners = (bannerIds: string[]) =>
  apiClient
    .request<{ items: AdminBannerView[] }>(`${BASE}/order`, {
      method: 'PUT',
      body: { bannerIds },
    })
    .then((response) => response.items)

/** 배너 사진 한 장을 올리고 CDN 주소를 돌려준다 — 배너 본문은 BANNER로 올린 사진만 받는다 */
export const uploadBannerImage = (file: File) =>
  uploadAdminImage(file, 'BANNER')
