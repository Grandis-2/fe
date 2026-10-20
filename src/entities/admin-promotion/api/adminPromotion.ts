import { uploadAdminImage } from '@shared/api/adminImage'
import { apiClient } from '@shared/api/client'
import { fetchAllPages } from '@shared/api/fetchAllPages'
import type {
  AdminPromotionUpsertRequest,
  AdminPromotionView,
  PageResponse,
  PromotionLinkableProductView,
} from '@shared/api/types'

const BASE = '/api/v1/admin/promotions'
// 서버가 한 번에 주는 최대 크기
const PAGE_SIZE = 100

// [catalog] GET /api/v1/admin/promotions — 최신순. 상태 탭을 화면에서 거르므로 전부 받는다.
export const getAdminPromotions = (signal?: AbortSignal) =>
  fetchAllPages((page) =>
    apiClient.request<PageResponse<AdminPromotionView>>(
      `${BASE}?${new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) })}`,
      { signal },
    ),
  )

// [catalog] GET /api/v1/admin/promotions/{promotionId}
export const getAdminPromotion = (promotionId: string, signal?: AbortSignal) =>
  apiClient.request<AdminPromotionView>(
    `${BASE}/${encodeURIComponent(promotionId)}`,
    { signal },
  )

// [catalog] POST /api/v1/admin/promotions — 같은 키로 다시 보내면 처음 만든 홍보가 온다
export const createAdminPromotion = (
  idempotencyKey: string,
  body: AdminPromotionUpsertRequest,
) =>
  apiClient.request<AdminPromotionView>(BASE, {
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': idempotencyKey },
  })

// [catalog] PUT /api/v1/admin/promotions/{promotionId} — 통째로 바꾼다
export const updateAdminPromotion = (
  promotionId: string,
  body: AdminPromotionUpsertRequest,
) =>
  apiClient.request<AdminPromotionView>(
    `${BASE}/${encodeURIComponent(promotionId)}`,
    { method: 'PUT', body },
  )

// [catalog] GET /api/v1/admin/promotions/linkable-products — 수정 화면은 promotionId를
// 보내야 이미 묶인 상품도 함께 온다.
export const getPromotionLinkableProducts = (
  promotionId: string | undefined,
  signal?: AbortSignal,
) =>
  fetchAllPages((page) =>
    apiClient.request<PageResponse<PromotionLinkableProductView>>(
      `${BASE}/linkable-products?${new URLSearchParams({
        ...(promotionId && { promotionId }),
        page: String(page),
        size: String(PAGE_SIZE),
      })}`,
      { signal },
    ),
  )

/** 홍보 사진 한 장을 올리고 CDN 주소를 돌려준다 — 홍보 본문은 PROMOTION으로 올린 사진만 받는다 */
export const uploadPromotionImage = (file: File) =>
  uploadAdminImage(file, 'PROMOTION')
