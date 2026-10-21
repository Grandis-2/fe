import { apiClient } from '@shared/api/client'
import type { OpenAlert, OpenAlertListResponse } from '@shared/api/types'

const path = (productId: string) =>
  `/api/v1/preorders/products/${encodeURIComponent(productId)}/open-alert`

// [preorder] GET /api/v1/preorders/open-alerts — 내 오픈 알림 목록
// 오픈 전·공개 상품만, 오픈이 이른 순(최대 100건, 페이지 없음). D-day는 opensAt으로 화면에서 센다.
export const getMyOpenAlerts = async (signal?: AbortSignal) =>
  (
    await apiClient.request<OpenAlertListResponse>(
      '/api/v1/preorders/open-alerts',
      { signal },
    )
  ).items

// [preorder] GET /api/v1/preorders/products/{productId}/open-alert — 오픈 알림 신청 여부
// productId는 모델 id다. 회차가 없는 상품이어도 subscribed: false로 온다.
export const getOpenAlert = (productId: string, signal?: AbortSignal) =>
  apiClient.request<OpenAlert>(path(productId), { signal })

// [preorder] PUT·DELETE /api/v1/preorders/products/{productId}/open-alert — 오픈 알림 신청·해제
// 둘 다 여러 번 불러도 된다. 신청은 이미 오픈했거나 판매 중지면 409, 회차가 없으면 404.
export const setOpenAlert = async ({ productId, subscribed }: OpenAlert) => {
  await apiClient.request(path(productId), {
    method: subscribed ? 'PUT' : 'DELETE',
  })
}
