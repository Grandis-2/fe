import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  AdminProductDetail,
  AdminProductListItem,
  AdminProductListParams,
  AdminProductResponse,
  AdminProductUpsertRequest,
  OptionValueAddRequest,
  OptionValueEditRequest,
  PageResponse,
  PreorderCampaignRequest,
  ProductEditRequest,
  Variant,
  VariantAddRequest,
  VariantEditRequest,
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

/** 상품명·태그·기본가 등을 고친다. 보낸 필드만 바뀐다 */
export const editAdminProduct = (productId: string, body: ProductEditRequest) =>
  apiClient.request<AdminProductResponse>(`${BASE}/${productId}`, {
    method: 'PATCH',
    body,
  })

/** 옵션 값 하나의 이름·추가금·색상을 고친다 */
export const editOptionValue = (
  productId: string,
  valueId: string,
  body: OptionValueEditRequest,
) =>
  apiClient.request<AdminProductResponse>(
    `${BASE}/${productId}/option-values/${encodeURIComponent(valueId)}`,
    { method: 'PATCH', body },
  )

/** 기존 축에 값을 하나 더한다 — 옵션은 생기지 않고 값만 생긴다 */
export const addOptionValue = (
  productId: string,
  body: OptionValueAddRequest,
) =>
  apiClient.request<AdminProductResponse>(
    `${BASE}/${productId}/option-values`,
    {
      method: 'POST',
      body,
    },
  )

/** 아직 없는 조합 하나를 옵션으로 만든다 */
export const addVariant = (productId: string, body: VariantAddRequest) =>
  apiClient.request<Variant>(`${BASE}/${productId}/variants`, {
    method: 'POST',
    body,
  })

/** 옵션 하나를 판매 중지하거나 다시 판다 */
export const editVariant = (
  productId: string,
  variantId: string,
  body: VariantEditRequest,
) =>
  apiClient.request<Variant>(`${BASE}/${productId}/variants/${variantId}`, {
    method: 'PATCH',
    body,
  })

/** 사전예약 모집 일정을 바꾼다 — preorder 서비스라 경로가 다르다 */
export const putPreorderCampaign = (
  productId: string,
  body: PreorderCampaignRequest,
) =>
  apiClient.request<unknown>(
    `/api/v1/admin/preorders/products/${productId}/campaign`,
    { method: 'PUT', body },
  )

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
