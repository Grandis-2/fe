import { PriceText, QuantityStepper } from '@shared/ui'
import type { QuantityStepperProps } from '@shared/ui'

import * as styles from './QuantityPriceDisplay.css'

export type QuantityControlProps = {
  isPreorder: boolean
  quantity: number
  onQuantityChange: (value: number) => void
  stepperLabel: string
  stepperSize?: QuantityStepperProps['size']
}

// 수량 스테퍼. 옵션 패널에서는 "수량" 제목 옆에 따로 놓이고, 모바일 구매 바에서는 가격과 한 줄로 놓인다.
export function QuantityControl({
  isPreorder,
  quantity,
  onQuantityChange,
  stepperLabel,
  stepperSize,
}: QuantityControlProps) {
  // 사전예약은 1인 1개라 수량을 고를 수 없다.
  return isPreorder ? (
    <span className={styles.fixedQuantity}>1개</span>
  ) : (
    <QuantityStepper
      value={quantity}
      onChange={onQuantityChange}
      label={stepperLabel}
      size={stepperSize}
    />
  )
}

// 선택한 옵션·수량으로 확정된 금액이라 "~"(…부터)를 붙이지 않는다.
export function PriceDisplay({ priceLabel }: { priceLabel: string }) {
  return (
    <span className={styles.price}>
      <PriceText value={priceLabel} />
    </span>
  )
}
