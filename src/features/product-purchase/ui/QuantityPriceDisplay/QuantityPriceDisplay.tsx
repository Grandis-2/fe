import { PriceText, QuantityStepper } from '@shared/ui'

import * as styles from './QuantityPriceDisplay.css'

export type QuantityControlProps = {
  isPreorder: boolean
  quantity: number
  onQuantityChange: (value: number) => void
  stepperLabel: string
}

export type QuantityPriceDisplayProps = QuantityControlProps & {
  priceLabel: string
}

// 수량 스테퍼. 옵션 패널에서는 "수량" 제목 옆에 따로 놓이고, 모바일 구매 바에서는 가격과 한 줄로 놓여서
// 수량/가격을 따로도 쓸 수 있게 나눴다.
export function QuantityControl({
  isPreorder,
  quantity,
  onQuantityChange,
  stepperLabel,
}: QuantityControlProps) {
  // 사전예약은 1인 1개라 수량을 고를 수 없다.
  return isPreorder ? (
    <span className={styles.fixedQuantity}>1개</span>
  ) : (
    <QuantityStepper
      value={quantity}
      onChange={onQuantityChange}
      label={stepperLabel}
    />
  )
}

export function PriceDisplay({
  priceLabel,
}: Pick<QuantityPriceDisplayProps, 'priceLabel'>) {
  return (
    <span className={styles.price}>
      <PriceText value={priceLabel} />
    </span>
  )
}

// 모바일 구매 바의 수량/가격 줄이 완전히 같은 마크업이라 둘을 묶어 공용으로 둔다.
export function QuantityPriceDisplay({
  priceLabel,
  ...quantityProps
}: QuantityPriceDisplayProps) {
  return (
    <>
      <QuantityControl {...quantityProps} />
      <PriceDisplay priceLabel={priceLabel} />
    </>
  )
}
