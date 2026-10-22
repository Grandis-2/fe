import type {
  StockOverviewItem,
  StockReconcileDriftOption,
} from '@shared/api/types'

import {
  axisValueName,
  COLOR_GROUP_CODE,
  type AdminProductDetailModel,
} from './types'

/** 재고 탭의 한 줄 */
export type AdminProductStock = {
  /** 옵션 id — 상품 상세의 variantId와 같다 */
  optionId: string
  color: string
  /** 색상 스와치(#RRGGBB). 없으면 null */
  colorHex: string | null
  /** 색상을 뺀 축의 값들. getStockOptionGroups와 같은 순서다 */
  optionNames: string[]
  price: number
  /** 재고를 넣었는지. false면 수량이 모두 0이고 구매 화면에서 품절로 보인다 */
  registered: boolean
  /** 총량(관리자 배정) */
  total: number
  /** 확보 — 진행 중인 주문이 잡아 둔 수량 */
  reserved: number
  /** 판매 수량 */
  sold: number
  /** 가용 = 총량 - 확보 - 판매 */
  available: number
}

/** 장부 대조에서 주문 기준과 어긋난 옵션 — 화면은 DTO를 직접 쓸 수 없어 다시 내보낸다 */
export type AdminStockDrift = StockReconcileDriftOption

/**
 * 재고 표가 색상 뒤에 세울 열들 — 상품이 실제로 가진 옵션 축을 그대로 쓴다.
 * 상품마다 축 수가 달라서(스마트폰은 용량 하나, 노트북은 크기·RAM·용량·칩) 열을
 * 고정할 수 없다.
 */
export const getStockOptionGroups = (
  product: Pick<AdminProductDetailModel, 'optionAxes'>,
) => product.optionAxes.filter((axis) => axis.key !== COLOR_GROUP_CODE)

/**
 * 재고 응답(수량)과 상품 상세(색상·옵션·가격)를 옵션 id로 맞붙인다. 재고 API는
 * 옵션 id와 수량만 주고, 그 옵션이 무슨 색·용량인지는 상품 쪽에 있다.
 */
export function getAdminProductStocks(
  product: Pick<AdminProductDetailModel, 'optionAxes' | 'variants'>,
  stockItems: StockOverviewItem[],
): AdminProductStock[] {
  const colorAxis = product.optionAxes.find(
    (axis) => axis.key === COLOR_GROUP_CODE,
  )
  const optionAxes = getStockOptionGroups(product)

  return product.variants.flatMap((variant) => {
    const stock = stockItems.find((item) => item.optionId === variant.variantId)
    if (!stock) return []
    const colorValue = colorAxis?.values.find(
      (value) => value.normalizedValue === variant.selections[COLOR_GROUP_CODE],
    )

    return [
      {
        optionId: variant.variantId,
        color: colorValue?.value ?? '-',
        colorHex: colorValue?.hex ?? null,
        optionNames: optionAxes.map(
          (axis) => axisValueName(axis, variant.selections[axis.key]) ?? '-',
        ),
        price: variant.price,
        registered: stock.registered,
        total: stock.stockTotal,
        reserved: stock.stockReserved,
        sold: stock.stockSold,
        available: stock.available,
      },
    ]
  })
}

/**
 * 재고 상태. 임박은 남은 수량이 전체의 10% 이하다 — 운영자가 언제 채울지 보는 기준이라
 * 서버 값이 아니라 화면이 정한다.
 * - unregistered: 재고를 아직 넣지 않았다(구매 화면에서 품절로 보인다)
 * - out: 남은 수량 0
 */
export type StockLevel = 'unregistered' | 'out' | 'low' | 'ok'

const LOW_RATIO = 0.1

export const stockLevelOf = (
  row: Pick<AdminProductStock, 'registered' | 'available' | 'total'>,
): StockLevel => {
  if (!row.registered) return 'unregistered'
  if (row.available <= 0) return 'out'
  return row.available <= row.total * LOW_RATIO ? 'low' : 'ok'
}

export const stockLevelLabel: Record<Exclude<StockLevel, 'ok'>, string> = {
  unregistered: '재고 미등록',
  out: '품절',
  low: '임박',
}

/** 손볼 것부터 — 미등록, 그다음 남은 수량이 적은 순 */
export const sortStocksByUrgency = (rows: AdminProductStock[]) =>
  [...rows].sort(
    (a, b) =>
      Number(a.registered) - Number(b.registered) || a.available - b.available,
  )

/** 위쪽 합계 칸 — 미등록 옵션은 모두 0이라 그대로 더해도 된다 */
export const sumStocks = (rows: AdminProductStock[]) =>
  rows.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      available: acc.available + row.available,
      reserved: acc.reserved + row.reserved,
      sold: acc.sold + row.sold,
    }),
    { total: 0, available: 0, reserved: 0, sold: 0 },
  )
