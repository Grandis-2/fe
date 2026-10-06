import { apiClient } from '@shared/api/client'
import type {
  AdminProductDetail,
  AdminProductHideRequest,
  AdminProductListParams,
  AdminProductSummary,
  AdminProductUpsertRequest,
  Paged,
} from '@shared/api/types'

const BASE = '/api/v1/admin/products'

const toQuery = (params: AdminProductListParams) => {
  const query = new URLSearchParams()
  if (params.displayStatus) query.set('displayStatus', params.displayStatus)
  if (params.saleStatus) query.set('saleStatus', params.saleStatus)
  if (params.q) query.set('q', params.q)
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.size !== undefined) query.set('size', String(params.size))
  const search = query.toString()
  return search ? `?${search}` : ''
}

/** 전시 상태와 무관하게 상품 목록을 조회한다 */
export const getAdminProducts = (
  params: AdminProductListParams = {},
  signal?: AbortSignal,
) =>
  apiClient.request<Paged<AdminProductSummary>>(`${BASE}${toQuery(params)}`, {
    signal,
  })

/** 전시 상태와 무관하게 상품 상세를 조회한다 */
export const getAdminProduct = (productId: string, signal?: AbortSignal) =>
  apiClient.request<AdminProductDetail>(`${BASE}/${productId}`, { signal })

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

/** DRAFT/HIDDEN → PUBLISHED */
export const publishAdminProduct = (productId: string) =>
  apiClient.request<AdminProductDetail>(`${BASE}/${productId}/publish`, {
    method: 'POST',
  })

/** PUBLISHED → HIDDEN. reason은 5자 이상이어야 한다 */
export const hideAdminProduct = (
  productId: string,
  body: AdminProductHideRequest,
) =>
  apiClient.request<AdminProductDetail>(`${BASE}/${productId}/hide`, {
    method: 'POST',
    body,
  })
