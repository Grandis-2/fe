import type { AdminProduct, AdminProductStock } from './types'

// ponytail: 아직 관리자 상품 API가 없어서 목업 데이터로 화면을 채운다.
const baseProducts: Omit<AdminProduct, 'id'>[] = [
  {
    name: '맥북 프로 14',
    type: 'preorder',
    optionCount: 4,
    openPeriod: '2026년 9월 15일 09:00 ~ 2026년 9월 15일 23:59',
    status: 'selling',
  },
  {
    name: '맥북 에어 15',
    type: 'normal',
    optionCount: 4,
    openPeriod: null,
    status: 'selling',
  },
  {
    name: 'Samsung Galaxy Book 6',
    type: 'preorder',
    optionCount: 2,
    openPeriod: '2026년 9월 20일 10:00 ~ 2026년 9월 21일 23:59',
    status: 'scheduled',
  },
]

// 페이지네이션을 확인하려고 위 3종을 반복해서 채웠다.
// id가 겹치면 React key가 충돌해 행이 중복되거나 누락되므로 반드시 고유해야 한다.
export const adminProducts: AdminProduct[] = Array.from(
  { length: 13 },
  (_, index) => ({
    ...baseProducts[index % baseProducts.length],
    id: `product-${index + 1}`,
  }),
)

export function findAdminProduct(id: string) {
  return adminProducts.find((product) => product.id === id)
}

const stockVariants: Omit<AdminProductStock, 'id'>[] = [
  {
    color: '블랙',
    capacity: '256GB',
    totalCount: 1500,
    price: 1_200_000,
    confirmedCount: 1245,
    remainingCount: 255,
  },
  {
    color: '블랙',
    capacity: '512GB',
    totalCount: 900,
    price: 1_450_000,
    confirmedCount: 731,
    remainingCount: 169,
  },
  {
    color: '실버',
    capacity: '256GB',
    totalCount: 1200,
    price: 1_200_000,
    confirmedCount: 1120,
    remainingCount: 80,
  },
  {
    color: '실버',
    capacity: '512GB',
    totalCount: 700,
    price: 1_450_000,
    confirmedCount: 402,
    remainingCount: 298,
  },
]

/** 상품의 옵션 수만큼 재고 행을 돌려준다 */
export function getAdminProductStocks(product: AdminProduct) {
  return Array.from({ length: product.optionCount }, (_, index) => ({
    ...stockVariants[index % stockVariants.length],
    id: `${product.id}-stock-${index + 1}`,
  }))
}
