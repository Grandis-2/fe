import type { AdminProductListParams } from '@shared/api/types'

/**
 * 관리자 상품 쿼리 키. 한곳에 모아 두는 이유는 무효화가 접두사 일치로 돌기 때문이다 —
 * 전시 상태를 바꾸면 ADMIN_PRODUCTS_KEY를 무효화해서 목록·상세·재고를 한 번에 다시
 * 받는데, 그게 성립하려면 세 키가 모두 이 접두사로 시작해야 한다. 파일마다 배열을
 * 손으로 적으면 한쪽만 고쳐도 타입 오류 없이 조용히 안 받아진다.
 */
export const ADMIN_PRODUCTS_KEY = ['admin', 'products'] as const

export const adminProductsKey = (params: AdminProductListParams) =>
  [...ADMIN_PRODUCTS_KEY, 'list', params] as const

export const adminProductKey = (productId: string) =>
  [...ADMIN_PRODUCTS_KEY, productId] as const

export const adminProductStockKey = (productId: string) =>
  [...adminProductKey(productId), 'stock'] as const
