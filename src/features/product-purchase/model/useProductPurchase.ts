import { useState } from 'react'

export type ProductColorOption = { hex: string; label: string }

// 색상/용량/수량 선택 + 파생되는 가격 텍스트를 한곳에 모은다. 상세 페이지의 옵션 패널과
// 모바일 구매 바(하단바+바텀시트)가 이 상태를 그대로 공유해서 써야 해서 별도로 뺐다.
export function useProductPurchase({
  colorSwatches,
  optionLabels,
  unitPrice,
  isPreorder,
}: {
  colorSwatches: ProductColorOption[]
  optionLabels: string[]
  unitPrice: number
  isPreorder: boolean
}) {
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedOption, setSelectedOption] = useState(0)
  const [stepperQuantity, setStepperQuantity] = useState(1)
  // 사전예약은 1인 1개 — 응답이 오기 전에 스테퍼를 눌렀더라도 주문 수량은 1로 고정한다.
  const quantity = isPreorder ? 1 : stepperQuantity
  const colorLabel = colorSwatches[selectedColor].label
  const optionLabel = optionLabels[selectedOption]
  const priceLabel = `${(unitPrice * quantity).toLocaleString()}원`

  return {
    selectedColor,
    setSelectedColor,
    selectedOption,
    setSelectedOption,
    quantity,
    setQuantity: setStepperQuantity,
    colorLabel,
    optionLabel,
    priceLabel,
  }
}

// 이 훅 결과를 그대로 prop 하나로 넘기는 소비자(widgets/product-purchase-bar)가
// Pick으로 필요한 필드만 뽑아 쓸 수 있게 반환 타입을 내보낸다.
export type ProductPurchase = ReturnType<typeof useProductPurchase>
