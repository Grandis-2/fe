import type { ProductImageBundle } from '../../types'

/*
 * ponytail: 사진 목업. 실서버는 올린 사진을 저장해 CDN(cdn.grandis-nova.link)으로 보여주는데,
 * 목업은 올린 파일을 메모리에 들고 가짜 CDN 주소로 돌려준다 — 새로고침하면 사라져서
 * 사진이 깨져 보인다(상품에 걸린 주소는 남는다). 실제 업로드는 VITE_USE_MSW=false로 본다.
 */

/** 가짜 CDN 주소 */
export const MOCK_CDN_ORIGIN = 'https://mock-cdn.local'

/** 올린 파일 — 키는 'products/<id>.<ext>' · 'promotions/<id>.<ext>' */
export const mockUploadedFiles = new Map<string, Blob>()

/** 상품별 사진. 없는 상품은 사진이 없다 */
export const productImageStore = new Map<
  string,
  { gallery: ProductImageBundle[]; detail: ProductImageBundle[] }
>()

export const imagesOf = (productId: string) => {
  let images = productImageStore.get(productId)
  if (!images) {
    images = { gallery: [], detail: [] }
    productImageStore.set(productId, images)
  }
  return images
}

/** 묶음 하나를 받아 position·primary를 실서버처럼 채운다(첫 장이 대표) */
export const toBundle = (bundleKey: string, urls: string[]) => ({
  bundleKey,
  items: urls.map((url, position) => ({
    url,
    position,
    primary: position === 0,
  })),
})
