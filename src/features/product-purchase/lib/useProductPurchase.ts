import { useState } from 'react'

import type { ProductColorSwatchItem, ProductOption } from '@entities/product'
import { formatWon } from '@shared/lib/formatNumber'

import { PREORDER_BENEFIT_RATE } from '../model/benefit'

// 스와치에서 색상 선택에 필요한 두 칸만 — 여기선 label이 항상 있어야 한다.
export type ProductColorOption = Required<
  Pick<ProductColorSwatchItem, 'hex' | 'label'>
>

// 옵션 값 하나 — 라벨과 고르면 기본가에 더해지는 추가금액(없으면 0원). 선택 여부는 훅이 들고 있다.
export type PurchaseOptionValue = Omit<ProductOption, 'selected'>

// 색상 외의 옵션 그룹(크기·RAM·용량·칩 등) 하나 — 라벨과 고를 수 있는 값들.
export type PurchaseOptionGroup = {
  label: string
  values: PurchaseOptionValue[]
}

// 색상/옵션 그룹들/수량 선택 + 파생되는 가격 텍스트를 한곳에 모은다. 상세 페이지의 옵션 패널과
// 모바일 구매 바(하단바+바텀시트)가 이 상태를 그대로 공유해서 써야 해서 별도로 뺐다.
export function useProductPurchase({
  productId,
  colorSwatches,
  optionGroups,
  basePrice,
  isPreorder,
}: {
  // 같은 /products/:productId 경로 안에서 다른 상품으로 옮겨가도 라우트 컴포넌트는
  // 그대로 유지되므로, 상품이 바뀌면 이전 상품에서 고르던 색상/옵션/수량이 넘어오지
  // 않도록 초기화 기준으로 쓴다.
  productId: string
  colorSwatches: ProductColorOption[]
  optionGroups: PurchaseOptionGroup[]
  // 옵션 추가금액을 더하기 전의 기본가.
  basePrice: number
  isPreorder: boolean
}) {
  const [selectedColor, setSelectedColor] = useState(0)
  // 옵션 그룹마다 고른 값의 인덱스 — optionGroups와 같은 순서다.
  const [selectedOptions, setSelectedOptions] = useState(() =>
    optionGroups.map(() => 0),
  )
  const [stepperQuantity, setStepperQuantity] = useState(1)

  // 렌더링 중 바로 초기화한다 — 이펙트에서 setState하면 리렌더가 한 번 더 발생해
  // react-hooks/set-state-in-effect에 걸린다(useProductDetailScroll의 같은 패턴 참고).
  const [prevProductId, setPrevProductId] = useState(productId)
  if (productId !== prevProductId) {
    setPrevProductId(productId)
    setSelectedColor(0)
    setSelectedOptions(optionGroups.map(() => 0))
    setStepperQuantity(1)
  }
  // 사전예약은 1인 1개 — 응답이 오기 전에 스테퍼를 눌렀더라도 주문 수량은 1로 고정한다.
  const quantity = isPreorder ? 1 : stepperQuantity
  // 색상이 없는 상품(colorSwatches가 빈 배열)이면 빈 라벨로 둔다.
  const colorLabel = colorSwatches[selectedColor]?.label ?? ''
  const selectOption = (groupIndex: number, valueIndex: number) =>
    setSelectedOptions((prev) =>
      prev.map((selected, i) => (i === groupIndex ? valueIndex : selected)),
    )
  // 고른 값들을 그룹 순서대로 이어 붙인다 — 주문 요약에는 이 한 줄로 넘어간다.
  const selectedValues = optionGroups.map(
    (group, i) => group.values[selectedOptions[i]],
  )
  const optionLabel = selectedValues.map((value) => value.label).join(' · ')
  // 선택한 옵션의 추가금액을 기본가에 더한 단가 — 결제 화면에도 이 값이 넘어간다.
  const unitPrice =
    basePrice + selectedValues.reduce((sum, v) => sum + (v.extraPrice ?? 0), 0)
  const totalPrice = unitPrice * quantity
  // 결제 화면(PaymentPage)과 같은 비율로 할인해서 두 화면의 합계가 맞는다.
  const benefitAmount = Math.round(totalPrice * PREORDER_BENEFIT_RATE)
  // 할인까지 뺀, 실제로 결제할 금액.
  const payAmount = totalPrice - benefitAmount
  const priceLabel = formatWon(payAmount)

  return {
    selectedColor,
    setSelectedColor,
    selectedOptions,
    selectOption,
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
    payAmount,
    priceLabel,
  }
}

// 이 훅 결과를 그대로 prop 하나로 넘기는 소비자(widgets/product-purchase-bar)가
// Pick으로 필요한 필드만 뽑아 쓸 수 있게 반환 타입을 내보낸다.
export type ProductPurchase = ReturnType<typeof useProductPurchase>
