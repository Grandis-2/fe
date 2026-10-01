import type { AdminProductDetail, AdminStockItem } from '@/shared/api/types'

/** 재고 조회 탭의 한 줄 */
export type AdminProductStock = {
  /** 재고 API가 대상을 지정할 때 쓰는 키 */
  optionCode: string
  color: string
  capacity: string
  price: number
  /** 운영자가 설정한 총 수량 */
  totalCount: number
  /** 예약으로 확보된 수량 */
  confirmedCount: number
  /** 남은 수량 */
  remainingCount: number
  adjustmentsEnabled: boolean
}

const valueName = (
  product: AdminProductDetail,
  groupCode: string,
  valueCode: string | undefined,
) =>
  product.optionGroups
    .find((group) => group.groupCode === groupCode)
    ?.values.find((value) => value.valueCode === valueCode)?.name ?? '-'

/**
 * 재고 응답(수량)과 상품 상세(색상·용량·가격)를 optionCode로 맞붙인다.
 * 재고 API는 옵션 코드와 수량만 주고, 그 옵션이 무슨 색·용량인지는 상품 쪽에 있다.
 */
export function getAdminProductStocks(
  product: AdminProductDetail,
  stockItems: AdminStockItem[],
): AdminProductStock[] {
  return product.variants.flatMap((variant) => {
    const stock = stockItems.find(
      (item) => item.optionCode === variant.optionCode,
    )
    if (!stock) return []

    return [
      {
        optionCode: variant.optionCode,
        color: valueName(product, 'color', variant.optionValues.color),
        capacity: valueName(product, 'storage', variant.optionValues.storage),
        price: variant.price,
        totalCount: stock.initialQuantity,
        confirmedCount: stock.reservedQuantity,
        remainingCount: stock.availableQuantity,
        adjustmentsEnabled: stock.adjustmentsEnabled,
      },
    ]
  })
}
