import { uploadAdminImage } from '@shared/api/adminImage'
import { apiClient } from '@shared/api/client'
import type {
  AdminProductResponse,
  ProductImageAddRequest,
} from '@shared/api/types'

import { productImageFileProblem } from '../model/images'

const BASE = '/api/v1/admin/products'

// [catalog] POST /api/v1/admin/products/{productId}/images — 사진 한 장 넣기
/** 등록된 상품의 묶음 맨 뒤에 사진 한 장을 넣는다 */
export const addProductImage = (
  productId: string,
  body: ProductImageAddRequest,
) =>
  apiClient.request<AdminProductResponse>(`${BASE}/${productId}/images`, {
    method: 'POST',
    body,
  })

// [catalog] DELETE /api/v1/admin/products/{productId}/images — 사진 한 장 빼기
/** 사진 한 장을 뺀다. 사진은 주소로 구분한다 — 주소에 / · : 가 있어 인코딩한다 */
export const removeProductImage = (productId: string, url: string) =>
  apiClient.request<AdminProductResponse>(
    `${BASE}/${productId}/images?url=${encodeURIComponent(url)}`,
    { method: 'DELETE' },
  )

/**
 * 상품 사진 한 장을 올리고 CDN 주소(imageUrl)를 돌려준다.
 *
 * 사진을 고르는 즉시 부른다 — 등록 버튼에서 한꺼번에 올리면 그만큼 기다려야 한다.
 * 서버가 거절할 형식·크기는 보내기 전에 막는다. 실패는 메시지를 담아 던진다 — 업로더가
 * 그 사진 칸에 보여준다.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const problem = productImageFileProblem(file)
  if (problem) throw new Error(problem)
  return uploadAdminImage(file, 'PRODUCT')
}
