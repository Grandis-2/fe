import type { AdminProductDetail, AdminStockItem } from '@shared/api/types'

import { COLOR_GROUP_CODE } from './types'

/** 재고 조회 탭의 한 줄 */
export type AdminProductStock = {
  /** 재고 API가 대상을 지정할 때 쓰는 키 */
  optionCode: string
  color: string
  /** 색상을 뺀 옵션 값들. getStockOptionGroups와 같은 순서다 */
  optionNames: string[]
  price: number
  /** 운영자가 설정한 총 수량 */
  totalCount: number
  /** 예약으로 확보된 수량 */
  confirmedCount: number
  /** 남은 수량 */
  remainingCount: number
}

/**
 * 재고 표가 색상 뒤에 세울 열들 — 상품이 실제로 가진 옵션 그룹을 그대로 쓴다.
 *
 * 열을 고정하면 안 된다. 폼이 그룹 코드를 opt1·opt2…로 발급하는데(form.ts) 전에는
 * 여기서 'storage'를 찾고 있어서, 폼으로 등록한 상품은 '용량' 칸이 늘 '-'였다.
 * 옵션 프리셋이 붙은 뒤로는 노트북처럼 그룹이 네 개인 상품도 있어서 더 맞지 않는다.
 */
export const getStockOptionGroups = (product: AdminProductDetail) =>
  product.optionGroups.filter((group) => group.groupCode !== COLOR_GROUP_CODE)

const valueName = (
  values: { valueCode: string; name: string }[],
  valueCode: string | undefined,
) => values.find((value) => value.valueCode === valueCode)?.name ?? '-'

/**
 * 재고 응답(수량)과 상품 상세(색상·옵션·가격)를 optionCode로 맞붙인다.
 * 재고 API는 옵션 코드와 수량만 주고, 그 옵션이 무슨 색·용량인지는 상품 쪽에 있다.
 */
export function getAdminProductStocks(
  product: AdminProductDetail,
  stockItems: AdminStockItem[],
): AdminProductStock[] {
  const colorValues =
    product.optionGroups.find((group) => group.groupCode === COLOR_GROUP_CODE)
      ?.values ?? []
  const optionGroups = getStockOptionGroups(product)

  return product.variants.flatMap((variant) => {
    const stock = stockItems.find(
      (item) => item.optionCode === variant.optionCode,
    )
    if (!stock) return []

    return [
      {
        optionCode: variant.optionCode,
        color: valueName(colorValues, variant.optionValues[COLOR_GROUP_CODE]),
        optionNames: optionGroups.map((group) =>
          valueName(group.values, variant.optionValues[group.groupCode]),
        ),
        price: variant.price,
        totalCount: stock.initialQuantity,
        confirmedCount: stock.reservedQuantity,
        remainingCount: stock.availableQuantity,
      },
    ]
  })
}
