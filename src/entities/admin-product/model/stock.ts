import type { AdminProductDetail } from '@/shared/api/types'

/** 재고 조회 탭의 한 줄 */
export type AdminProductStock = {
  id: string
  color: string
  capacity: string
  totalCount: number
  price: number
  confirmedCount: number
  remainingCount: number
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
 * 상세 응답의 variants로 재고 표를 만든다.
 *
 * ponytail: 색상·용량·가격은 실제 응답에서 오지만 총수량/확정/잔여는 관리자
 * 상품 API 스펙에 아직 없다. 재고 엔드포인트가 정해지면 아래 계산을 교체한다.
 */
export function getAdminProductStocks(
  product: AdminProductDetail,
): AdminProductStock[] {
  return product.variants.map((variant, index) => {
    const totalCount = 1500 - index * 200
    const confirmedCount = Math.round(totalCount * (0.7 + index * 0.05))

    return {
      id: `${product.productId}-${variant.optionCode}`,
      color: valueName(product, 'color', variant.optionValues.color),
      capacity: valueName(product, 'storage', variant.optionValues.storage),
      totalCount,
      price: variant.price,
      confirmedCount,
      remainingCount: totalCount - confirmedCount,
    }
  })
}
