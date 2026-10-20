import { useState } from 'react'

import type { Product, ProductOption } from '@entities/product'
import { formatWon } from '@shared/lib/formatNumber'

// 고르는 데 필요한 상세 응답 칸만 받는다.
export type PurchaseProduct = Pick<
  Product,
  | 'productId'
  | 'status'
  | 'saleMode'
  | 'basePrice'
  | 'discountRate'
  | 'optionAxes'
  | 'variants'
>

// 옵션 값 하나 — 라벨과 고르면 기본가에 더해지는 추가금액. 가격 내역(구매 바)에 쓴다.
export type PurchaseOptionValue = Omit<ProductOption, 'selected'>

// 색상 축의 키. 이 축은 색상칩으로, 나머지 축은 옵션 버튼으로 그린다.
const COLOR_AXIS_KEY = 'color'

type Variant = PurchaseProduct['variants'][number]
// 축 키 → 고른 값의 normalizedValue. 옵션(variant)의 selections와 같은 모양이라 그대로 비교한다.
type Selections = Variant['selections']

// 판매 중이고, 일반 상품이면 재고가 남은 옵션. 사전예약은 재고 제한이 없다(availableQuantity null).
const isBuyable = (variant: Variant, isPreorder: boolean) =>
  variant.status === 'ACTIVE' &&
  (isPreorder || (variant.availableQuantity ?? 0) > 0)

// 처음 고를 조합 — 살 수 있는 첫 옵션, 없으면 축마다 첫 값.
function initialSelections(product: PurchaseProduct | undefined): Selections {
  if (!product) return {}
  const isPreorder = product.saleMode === 'PREORDER'
  const buyable = product.variants.find((variant) =>
    isBuyable(variant, isPreorder),
  )
  return (
    buyable?.selections ??
    Object.fromEntries(
      product.optionAxes.map((axis) => [
        axis.key,
        axis.values[0]?.normalizedValue ?? '',
      ]),
    )
  )
}

// 축마다 값을 고르면 그 조합의 옵션(variant)을 찾아 가격·구매 가능 여부를 정한다. 상세 페이지의 옵션 패널과
// 모바일 구매 바(하단바+바텀시트)가 이 상태를 그대로 공유해서 써야 해서 별도로 뺐다.
// product는 상세 조회가 끝나기 전엔 undefined다 — 그동안은 빈 선택으로 두고, 결제는 페이지가 막는다.
export function useProductPurchase(product: PurchaseProduct | undefined) {
  const isPreorder = product?.saleMode === 'PREORDER'
  const axes = product?.optionAxes ?? []
  const [selections, setSelections] = useState(() => initialSelections(product))
  const [stepperQuantity, setStepperQuantity] = useState(1)

  // 응답이 처음 오거나 같은 경로 안에서 다른 상품으로 옮겨가면 선택을 새로 잡는다.
  // 렌더링 중 바로 초기화한다 — 이펙트에서 setState하면 리렌더가 한 번 더 발생해
  // react-hooks/set-state-in-effect에 걸린다(useProductDetailScroll의 같은 패턴 참고).
  const [prevProductId, setPrevProductId] = useState(product?.productId)
  if (product?.productId !== prevProductId) {
    setPrevProductId(product?.productId)
    setSelections(initialSelections(product))
    setStepperQuantity(1)
  }
  // 사전예약은 1인 1개 — 응답이 오기 전에 스테퍼를 눌렀더라도 주문 수량은 1로 고정한다.
  const quantity = isPreorder ? 1 : stepperQuantity

  const select = (axisKey: string, normalizedValue: string) =>
    setSelections((prev) => ({ ...prev, [axisKey]: normalizedValue }))

  const colorAxis = axes.find((axis) => axis.key === COLOR_AXIS_KEY)
  const optionAxes = axes.filter((axis) => axis.key !== COLOR_AXIS_KEY)
  const selectedValueOf = (axis: (typeof axes)[number]) =>
    axis.values.find((value) => value.normalizedValue === selections[axis.key])

  // 고른 조합과 축 값이 전부 같은 옵션. 없으면 판매하지 않는 조합이다.
  const variant = product?.variants.find((it) =>
    axes.every((axis) => it.selections[axis.key] === selections[axis.key]),
  )
  // 결제를 막아야 하는 이유. null이면 살 수 있다.
  const unavailableReason = !product
    ? null
    : product.status === 'PAUSED'
      ? '판매가 중지된 상품이에요.'
      : !variant
        ? '선택한 조합은 판매하지 않아요.'
        : variant.status === 'PAUSED'
          ? '선택한 옵션은 판매가 중지됐어요.'
          : !isBuyable(variant, isPreorder)
            ? '선택한 옵션은 품절이에요.'
            : null

  // 색상을 포함한 축 순서대로의 선택값 — 가격 내역에 추가금액을 보여 줄 때 쓴다.
  const selectedValues: PurchaseOptionValue[] = axes.flatMap((axis) => {
    const value = selectedValueOf(axis)
    return value ? [{ label: value.value, extraPrice: value.surcharge }] : []
  })
  const colorLabel = (colorAxis && selectedValueOf(colorAxis)?.value) ?? ''
  // 색상 외 축의 선택값을 이어 붙인다 — 주문 요약에는 이 한 줄로 넘어간다.
  const optionLabel = optionAxes
    .map((axis) => selectedValueOf(axis)?.value)
    .filter(Boolean)
    .join(' · ')

  const basePrice = product?.basePrice ?? 0
  const discountRate = product?.discountRate ?? 0
  // 옵션의 정가(listPrice)와 할인가(price)를 서버가 준다. 판매하지 않는 조합이면 서버와 같은 규칙
  // (기본가 + 값별 추가금, 할인은 100원 단위 버림)으로 계산해 보여만 준다.
  const listUnitPrice =
    variant?.listPrice ??
    basePrice +
      selectedValues.reduce((sum, value) => sum + (value.extraPrice ?? 0), 0)
  const unitPrice =
    variant?.price ??
    Math.floor((listUnitPrice * (100 - discountRate)) / 10000) * 100
  // 정가 합계 — 가격 내역은 정가에서 할인을 빼 보여 준다.
  const totalPrice = listUnitPrice * quantity
  // 실제로 결제할 금액.
  const payAmount = unitPrice * quantity
  const benefitAmount = totalPrice - payAmount
  // 할인 줄 이름 — 사전예약이면 사전예약 혜택, 일반 상품이면 할인율. 할인이 없으면 줄을 안 그린다.
  const discountLabel =
    discountRate > 0
      ? `${isPreorder ? '사전예약 혜택' : '할인율'} (${discountRate}%)`
      : null
  const priceLabel = formatWon(payAmount)

  return {
    selections,
    select,
    colorAxis,
    optionAxes,
    variant,
    unavailableReason,
    quantity,
    setQuantity: setStepperQuantity,
    colorLabel,
    optionLabel,
    // 가격이 어떻게 나왔는지(기본가 + 옵션 추가금액 × 수량) 보여 줄 때 쓴다.
    basePrice,
    selectedValues,
    unitPrice,
    totalPrice,
    benefitAmount,
    discountLabel,
    payAmount,
    priceLabel,
  }
}

// 이 훅 결과를 그대로 prop 하나로 넘기는 소비자(widgets/product-purchase-bar)가
// Pick으로 필요한 필드만 뽑아 쓸 수 있게 반환 타입을 내보낸다.
export type ProductPurchase = ReturnType<typeof useProductPurchase>
