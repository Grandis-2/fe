/** 사진을 어디에 쓰는가 — 상품 저장은 PRODUCT, 홍보 저장은 PROMOTION으로 올린 사진만 받는다 */
export type AdminImagePurpose = 'PRODUCT' | 'PROMOTION'

/**
 * 사진 한 장 올리기(POST /admin/images?purpose=, multipart 파트 file). 서버가 검사·재인코딩해
 * 저장한다 — JPEG·PNG(RGB·회색조), 10MiB·가로세로 8,000px·2,500만 픽셀 이하.
 */
export type AdminImageUpload = {
  /** CDN 주소. 상품·홍보 저장 요청의 사진 칸에 그대로 넣는다 */
  imageUrl: string
}
