import type { AdminProductListParams } from '@shared/api/types'

/**
 * 관리자 상품 쿼리 키. 한곳에 모아 두는 이유는 무효화가 접두사 일치로 돌기 때문이다 —
 * 전시 상태를 바꾸면 ADMIN_PRODUCTS_KEY를 무효화해서 목록·상세·재고를 한 번에 다시
 * 받는데, 그게 성립하려면 세 키가 모두 이 접두사로 시작해야 한다. 파일마다 배열을
 * 손으로 적으면 한쪽만 고쳐도 타입 오류 없이 조용히 안 받아진다.
 */
export const ADMIN_PRODUCTS_KEY = ['admin', 'products'] as const

/** 목록. 검색어·상태가 바뀌면 키가 바뀌어 이전 요청이 취소된다 */
export const adminProductsKey = (params: AdminProductListParams) =>
  [...ADMIN_PRODUCTS_KEY, 'list', params] as const

/** 상세. 헤더·탭·재고 표·수정 폼이 같은 키를 써서 요청은 한 번만 나간다 */
export const adminProductKey = (productId: string) =>
  [...ADMIN_PRODUCTS_KEY, productId] as const

/** 조합별 재고. 상세 아래에 두어 상세를 무효화하면 재고도 같이 받는다 */
export const adminProductStockKey = (productId: string) =>
  [...adminProductKey(productId), 'stock'] as const
