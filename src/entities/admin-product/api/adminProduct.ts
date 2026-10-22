import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  AdminProductListItem,
  AdminProductListParams,
  AdminProductResponse,
  OptionValueAddRequest,
  OptionValueEditRequest,
  PageResponse,
  PreorderCampaignRequest,
  PreorderCampaignResponse,
  ProductRegistrationRequest,
  ProductRegistrationResponse,
  SaleStatusChangeRequest,
  SaleStatusView,
  ProductEditRequest,
  RegistrationStatusView,
  Variant,
  VariantAddRequest,
  VariantEditRequest,
  GiftCandidate,
  GiftCandidateParams,
  VisibilityChangeRequest,
  VisibilityView,
} from '@shared/api/types'

const BASE = '/api/v1/admin/products'

// [catalog] GET /api/v1/admin/products — 관리자 상품 목록
/** 전시 규칙 없이 상품 목록을 조회한다 — 비공개·준비 전·판매 중지까지 다 나온다 */
export const getAdminProducts = (
  params: AdminProductListParams = {},
  signal?: AbortSignal,
) =>
  apiClient.request<PageResponse<AdminProductListItem>>(
    `${BASE}${toQueryString(params)}`,
    { signal },
  )

// [catalog] GET /api/v1/admin/products/gift-candidates — 럭키 드로우 증정품 후보
/** 증정품으로 고를 수 있는 상품과 옵션(가용 재고 포함) — 회차 만들기 화면이 쓴다 */
export const getGiftCandidates = (
  params: GiftCandidateParams,
  signal?: AbortSignal,
) =>
  apiClient.request<PageResponse<GiftCandidate>>(
    `${BASE}/gift-candidates${toQueryString(params)}`,
    { signal },
  )

// [catalog] GET /api/v1/admin/products/{productId} — 상품 상세
/** 전시 상태와 무관하게 상품 상세를 조회한다 — 회원 상세에 태그·등록 상태가 붙는다 */
export const getAdminProduct = (productId: string, signal?: AbortSignal) =>
  apiClient.request<AdminProductResponse>(`${BASE}/${productId}`, { signal })

// [catalog] POST /api/v1/admin/products — 상품 등록
/**
 * 상품을 등록한다. 같은 키로 다시 보내면 새로 만들지 않고 처음 등록한 상품을 돌려준다
 * — 응답을 못 받았을 때 같은 키로 다시 보내야 상품이 두 개 생기지 않는다.
 */
export const registerAdminProduct = (
  idempotencyKey: string,
  body: ProductRegistrationRequest,
) =>
  apiClient.request<ProductRegistrationResponse>(BASE, {
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': idempotencyKey },
  })

// [catalog] GET /api/v1/admin/products/registrations/{idempotencyKey} — 등록 상태 조회
/** 등록 상태 — 준비가 끝났는지(completed). 등록 응답을 못 받았을 때 productId도 여기 있다 */
export const getRegistrationStatus = (idempotencyKey: string) =>
  apiClient.request<RegistrationStatusView>(
    `${BASE}/registrations/${encodeURIComponent(idempotencyKey)}`,
  )

// [catalog] PATCH /api/v1/admin/products/{productId} — 상품 정보 수정
/** 상품명·태그·기본가 등을 고친다. 보낸 필드만 바뀐다 */
export const editAdminProduct = (productId: string, body: ProductEditRequest) =>
  apiClient.request<AdminProductResponse>(`${BASE}/${productId}`, {
    method: 'PATCH',
    body,
  })

// [catalog] PATCH /api/v1/admin/products/{productId}/option-values/{valueId} — 옵션 값 수정
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

// [catalog] POST /api/v1/admin/products/{productId}/option-values — 옵션 값 추가
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

// [catalog] POST /api/v1/admin/products/{productId}/variants — 옵션 추가
/** 아직 없는 조합 하나를 옵션으로 만든다 */
export const addVariant = (productId: string, body: VariantAddRequest) =>
  apiClient.request<Variant>(`${BASE}/${productId}/variants`, {
    method: 'POST',
    body,
  })

// [catalog] PATCH /api/v1/admin/products/{productId}/variants/{variantId} — 옵션 판매 상태 변경
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

// [preorder] GET /api/v1/admin/preorders/products/{productId}/campaign — 모집 일정 조회
/** 회차 일정과 발급한 순번 수(issuedCount). 회차가 없으면 404 */
export const getPreorderCampaign = (productId: string, signal?: AbortSignal) =>
  apiClient.request<PreorderCampaignResponse>(
    `/api/v1/admin/preorders/products/${productId}/campaign`,
    { signal },
  )

// [preorder] PUT /api/v1/admin/preorders/products/{productId}/campaign — 모집 일정 생성, 변경
/** 사전예약 모집 일정을 바꾼다 — preorder 서비스라 경로가 다르다 */
export const putPreorderCampaign = (
  productId: string,
  body: PreorderCampaignRequest,
) =>
  apiClient.request<unknown>(
    `/api/v1/admin/preorders/products/${productId}/campaign`,
    { method: 'PUT', body },
  )

// [preorder] POST /api/v1/admin/preorders/products/{productId}/campaign/close — 접수 조기 마감
/**
 * 접수 중인 회차를 지금 마감한다. 새 접수만 막히고 받은 예약과 순번은 그대로다.
 * 다시 열 수 없다. 이미 마감됐으면 그대로 200, 오픈 전이면 409
 */
export const closePreorderCampaign = (productId: string) =>
  apiClient.request<unknown>(
    `/api/v1/admin/preorders/products/${productId}/campaign/close`,
    { method: 'POST' },
  )

// [catalog] PATCH /api/v1/admin/products/{productId}/sale-status — 상품 판매 상태 변경
/**
 * 판매 상태를 바꾼다. 사전예약 오픈 뒤 중지는 회차 취소다(사유 필수, 되돌릴 수 없음).
 */
export const setAdminProductSaleStatus = (
  productId: string,
  body: SaleStatusChangeRequest,
) =>
  apiClient.request<SaleStatusView>(`${BASE}/${productId}/sale-status`, {
    method: 'PATCH',
    body,
  })

// [catalog] PATCH /api/v1/admin/products/{productId}/visibility — 공개 여부 변경
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
