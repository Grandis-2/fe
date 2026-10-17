import type { StockOverviewItem } from '@shared/api/types'

import {
  axisValueName,
  COLOR_GROUP_CODE,
  type AdminProductDetailModel,
} from './types'

/** 재고 조회 탭의 한 줄 */
export type AdminProductStock = {
  /** 옵션 id — 상품 상세의 variantId와 같다 */
  optionId: string
  color: string
  /** 색상을 뺀 축의 값들. getStockOptionGroups와 같은 순서다 */
  optionNames: string[]
  price: number
  /** 총량(관리자 배정) */
  total: number
  /** 확보 — 진행 중인 주문이 잡아 둔 수량 */
  reserved: number
  /** 판매 수량 */
  sold: number
  /** 가용 = 총량 - 확보 - 판매 */
  available: number
}

/**
 * 재고 표가 색상 뒤에 세울 열들 — 상품이 실제로 가진 옵션 축을 그대로 쓴다.
 * 상품마다 축 수가 달라서(스마트폰은 용량 하나, 노트북은 크기·RAM·용량·칩) 열을
 * 고정할 수 없다.
 */
export const getStockOptionGroups = (product: AdminProductDetailModel) =>
  product.optionAxes.filter((axis) => axis.key !== COLOR_GROUP_CODE)

/**
 * 재고 응답(수량)과 상품 상세(색상·옵션·가격)를 옵션 id로 맞붙인다. 재고 API는
 * 옵션 id와 수량만 주고, 그 옵션이 무슨 색·용량인지는 상품 쪽에 있다.
 */
export function getAdminProductStocks(
  product: AdminProductDetailModel,
  stockItems: StockOverviewItem[],
): AdminProductStock[] {
  const colorAxis = product.optionAxes.find(
    (axis) => axis.key === COLOR_GROUP_CODE,
  )
  const optionAxes = getStockOptionGroups(product)

  return product.variants.flatMap((variant) => {
    const stock = stockItems.find((item) => item.optionId === variant.variantId)
    if (!stock) return []

    return [
      {
        optionId: variant.variantId,
        color:
          axisValueName(colorAxis, variant.selections[COLOR_GROUP_CODE]) ?? '-',
        optionNames: optionAxes.map(
          (axis) => axisValueName(axis, variant.selections[axis.key]) ?? '-',
        ),
        price: variant.price,
        total: stock.stockTotal,
        reserved: stock.stockReserved,
        sold: stock.stockSold,
        available: stock.available,
      },
    ]
  })
}
