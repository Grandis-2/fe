import { apiClient } from '@shared/api/client'
import { uploadToPresignedUrl } from '@shared/api/presignedUpload'
import type {
  AdminProductResponse,
  ImageUpload,
  ImageUploadRequest,
  ProductImageAddRequest,
} from '@shared/api/types'

import { productImageFileProblem } from '../model/images'

const BASE = '/api/v1/admin/products'

/** 사진 한 장을 올릴 서명 주소를 받는다 — 파일 하나에 한 번씩, 5분 안에 써야 한다 */
export const issueProductImageUpload = (body: ImageUploadRequest) =>
  apiClient.request<ImageUpload>(`${BASE}/image-uploads`, {
    method: 'POST',
    body,
  })

/** 등록된 상품의 묶음 맨 뒤에 사진 한 장을 넣는다 */
export const addProductImage = (
  productId: string,
  body: ProductImageAddRequest,
) =>
  apiClient.request<AdminProductResponse>(`${BASE}/${productId}/images`, {
    method: 'POST',
    body,
  })

/** 사진 한 장을 뺀다. 사진은 주소로 구분한다 — 주소에 / · : 가 있어 인코딩한다 */
export const removeProductImage = (productId: string, url: string) =>
  apiClient.request<AdminProductResponse>(
    `${BASE}/${productId}/images?url=${encodeURIComponent(url)}`,
    { method: 'DELETE' },
  )

/**
 * 사진 한 장을 올리고 CDN 주소(imageUrl)를 돌려준다 — 발급 → S3에 PUT 순서다.
 *
 * 사진을 고르는 즉시 부른다. 서명 주소가 5분이면 만료돼서, 등록 버튼을 누를 때 한꺼번에
 * 올리면 폼을 오래 쓴 경우 다 실패한다. 서버가 거절할 형식·크기는 발급 전에 막는다.
 * 실패는 메시지를 담아 던진다 — 업로더가 그 사진 칸에 보여준다.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const problem = productImageFileProblem(file)
  if (problem) throw new Error(problem)

  const issued = await issueProductImageUpload({
    contentType: file.type,
    contentLength: file.size,
  })
  await uploadToPresignedUrl({
    uploadUrl: issued.uploadUrl,
    headers: issued.headers,
    file,
  })
  return issued.imageUrl
}
