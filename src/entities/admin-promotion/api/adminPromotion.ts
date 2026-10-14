import { apiClient } from '@shared/api/client'
import type {
  AdminPromotionUpsertRequest,
  AdminPromotionView,
} from '@shared/api/types'

// 백엔드에 아직 없는 경로다 — dev에서는 실서버에 붙어도 목업이 받는다.
const BASE = '/api/v1/admin/promotions'

export const getAdminPromotions = (signal?: AbortSignal) =>
  apiClient.request<AdminPromotionView[]>(BASE, { signal })

export const getAdminPromotion = (promotionId: string, signal?: AbortSignal) =>
  apiClient.request<AdminPromotionView>(
    `${BASE}/${encodeURIComponent(promotionId)}`,
    { signal },
  )

export const createAdminPromotion = (body: AdminPromotionUpsertRequest) =>
  apiClient.request<AdminPromotionView>(BASE, { method: 'POST', body })

export const updateAdminPromotion = (
  promotionId: string,
  body: AdminPromotionUpsertRequest,
) =>
  apiClient.request<AdminPromotionView>(
    `${BASE}/${encodeURIComponent(promotionId)}`,
    { method: 'PUT', body },
  )
