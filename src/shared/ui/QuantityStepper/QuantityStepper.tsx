import { Minus, Plus } from 'lucide-react'

import * as styles from './QuantityStepper.css'

export type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** 어떤 상품의 수량인지 스크린리더가 알 수 있게 상품명을 넘긴다. */
  label?: string
  className?: string
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  className,
}: QuantityStepperProps) {
  const suffix = label ? ` (${label})` : ''

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      role="group"
      aria-label={`수량${suffix}`}
    >
      <button
        type="button"
        className={styles.step}
        aria-label={`수량 줄이기${suffix}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <div className={styles.divider} />
      {/* 버튼을 눌러 바뀐 값을 스크린리더가 읽도록 live 영역으로 둔다. */}
      <div className={styles.value} aria-live="polite">
        {value}
      </div>
      <div className={styles.divider} />
      <button
        type="button"
        className={styles.step}
        aria-label={`수량 늘리기${suffix}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
