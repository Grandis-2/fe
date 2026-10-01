import { PriceText, QuantityStepper } from '@/shared/ui'

import * as styles from './QuantityPriceDisplay.css'

export type QuantityPriceDisplayProps = {
  isPreorder: boolean
  quantity: number
  onQuantityChange: (value: number) => void
  priceLabel: string
  stepperLabel: string
}

// 옵션 패널의 수량/가격 줄과 모바일 구매 바텀시트의 수량/가격 줄이 완전히 같은 마크업이라 공용으로 뺐다.
export function QuantityPriceDisplay({
  isPreorder,
  quantity,
  onQuantityChange,
  priceLabel,
  stepperLabel,
}: QuantityPriceDisplayProps) {
  return (
    <>
      {/* 사전예약은 1인 1개라 수량을 고를 수 없다. */}
      {isPreorder ? (
        <span className={styles.fixedQuantity}>1개</span>
      ) : (
        <QuantityStepper
          value={quantity}
          onChange={onQuantityChange}
          label={stepperLabel}
        />
      )}
      <span className={styles.price}>
        <PriceText value={priceLabel} />
      </span>
    </>
  )
}
