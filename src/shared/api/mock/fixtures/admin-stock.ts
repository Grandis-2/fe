import { adminProductStore } from './admin-product'

import type { AdminStockItem } from '../../types'

/**
 * 상품의 옵션(variant)마다 재고 한 줄을 만든다.
 * availableQuantity + reservedQuantity = initialQuantity를 항상 지킨다.
 */
function seedItems(): AdminStockItem[] {
  return adminProductStore.flatMap((product) =>
    product.variants.map((variant, index) => {
      const initialQuantity = 1500 - index * 200
      const reservedQuantity = Math.round(
        initialQuantity * (0.7 + index * 0.05),
      )

      return {
        productId: product.productId,
        optionCode: variant.optionCode,
        policy: 'LIMITED' as const,
        initialQuantity,
        availableQuantity: initialQuantity - reservedQuantity,
        reservedQuantity,
        adjustmentsEnabled: true,
        updatedAt: '2026-09-12T03:00:00.000Z',
        updatedBy: null,
      }
    }),
  )
}

export const adminStockStore: AdminStockItem[] = seedItems()

export const findStockItem = (productId: string, optionCode: string) =>
  adminStockStore.find(
    (item) => item.productId === productId && item.optionCode === optionCode,
  )
