import { typography } from '@/shared/config/theme'
import { formatWon } from '@/shared/lib/formatNumber'
import { SelectButton } from '@/shared/ui'

import * as styles from './ProductOptionSelector.css'

// ProductColorSwatches와 같은 이유로 size에 따라 제목 크기가 갈린다 — 카드(작게)와
// 상세 페이지 옵션 패널(크게)이 같은 컴포넌트를 쓰되 맥락에 맞는 크기를 쓴다.
const labelTypography = {
  small: typography.body.subMedium,
  medium: typography.title.lgSemibold,
}

export type ProductOption = {
  label: string
  selected?: boolean
  // 이 옵션을 고르면 기본가에 더해지는 추가요금. 없으면 0원 취급.
  extraPrice?: number
}

export type ProductOptionSelectorProps = {
  label: string
  options: ProductOption[]
  size?: 'small' | 'medium'
  onSelect?: (index: number) => void
  className?: string
}

export function ProductOptionSelector({
  label,
  options,
  size = 'medium',
  onSelect,
  className,
}: ProductOptionSelectorProps) {
  return (
    <div className={[styles.root[size], className].filter(Boolean).join(' ')}>
      <div className={[labelTypography[size], styles.label].join(' ')}>
        {label}
      </div>
      <div className={styles.optionRow[size]}>
        {options.map((option, index) => (
          <SelectButton
            key={option.label}
            size={size}
            selected={option.selected}
            extra={
              size === 'medium' && option.extraPrice
                ? `+${formatWon(option.extraPrice)}`
                : undefined
            }
            onClick={() => onSelect?.(index)}
          >
            {option.label}
          </SelectButton>
        ))}
      </div>
    </div>
  )
}
