import { apiClient } from '@shared/api/client'
import type {
  AdminPromotionUpsertRequest,
  AdminPromotionView,
} from '@shared/api/types'

// 백엔드에 아직 없는 경로다 — dev에서는 실서버에 붙어도 목업이 받는다.
const BASE = '/api/v1/admin/promotions'

// [명세 없음] GET /api/v1/admin/promotions — 백엔드에 아직 없어 dev에서도 목으로만 받는다
export const getAdminPromotions = (signal?: AbortSignal) =>
  apiClient.request<AdminPromotionView[]>(BASE, { signal })

// [명세 없음] GET /api/v1/admin/promotions/{promotionId}
export const getAdminPromotion = (promotionId: string, signal?: AbortSignal) =>
  apiClient.request<AdminPromotionView>(
    `${BASE}/${encodeURIComponent(promotionId)}`,
    { signal },
  )

// [명세 없음] POST /api/v1/admin/promotions
export const createAdminPromotion = (body: AdminPromotionUpsertRequest) =>
  apiClient.request<AdminPromotionView>(BASE, { method: 'POST', body })

// [명세 없음] PUT /api/v1/admin/promotions/{promotionId}
export const updateAdminPromotion = (
  promotionId: string,
  body: AdminPromotionUpsertRequest,
) =>
  apiClient.request<AdminPromotionView>(
    `${BASE}/${encodeURIComponent(promotionId)}`,
    { method: 'PUT', body },
  )
