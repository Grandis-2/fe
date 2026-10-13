import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  AdminProductDetail,
  AdminProductListItem,
  AdminProductListParams,
  AdminProductResponse,
  AdminProductUpsertRequest,
  PageResponse,
  VisibilityChangeRequest,
  VisibilityView,
} from '@shared/api/types'

const BASE = '/api/v1/admin/products'

/** 전시 규칙 없이 상품 목록을 조회한다 — 비공개·준비 전·판매 중지까지 다 나온다 */
export const getAdminProducts = (
  params: AdminProductListParams = {},
  signal?: AbortSignal,
) =>
  apiClient.request<PageResponse<AdminProductListItem>>(
    `${BASE}${toQueryString(params)}`,
    { signal },
  )

/** 전시 상태와 무관하게 상품 상세를 조회한다 — 회원 상세에 태그·등록 상태가 붙는다 */
export const getAdminProduct = (productId: string, signal?: AbortSignal) =>
  apiClient.request<AdminProductResponse>(`${BASE}/${productId}`, { signal })

/** 상품을 초안으로 등록한다 */
export const createAdminProduct = (body: AdminProductUpsertRequest) =>
  apiClient.request<AdminProductDetail>(BASE, { method: 'POST', body })

/** 상품 전시 내용을 수정한다 (오픈 이후에는 409) */
export const updateAdminProduct = (
  productId: string,
  body: AdminProductUpsertRequest,
) =>
  apiClient.request<AdminProductDetail>(`${BASE}/${productId}`, {
    method: 'PATCH',
    body,
  })

/**
 * 공개 여부를 바꾼다. 사전예약 오픈 전후 언제든 되고, 되돌릴 수 있다 — 수정 잠금
 * 409가 없다. 사유는 받지 않는다(판매 중지와 다른 동작이다).
 */
export const setAdminProductVisibility = (
  productId: string,
  body: VisibilityChangeRequest,
) =>
  apiClient.request<VisibilityView>(`${BASE}/${productId}/visibility`, {
    method: 'PATCH',
    body,
  })
