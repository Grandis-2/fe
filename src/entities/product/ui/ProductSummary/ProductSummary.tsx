import type { ButtonHTMLAttributes } from 'react'

import { typography } from '@shared/config/theme'

import * as styles from './ProductSummary.css'

export type ProductSummaryProps = {
  name: string
  optionSummary: string
  ctaLabel: string
  onCtaClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick']
  className?: string
}

export function ProductSummary({
  name,
  optionSummary,
  ctaLabel,
  onCtaClick,
  className,
}: ProductSummaryProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.info}>
        <div className={[typography.title.lgSemibold, styles.name].join(' ')}>
          {name}
        </div>
        <div className={[typography.body.sub, styles.options].join(' ')}>
          {optionSummary}
        </div>
      </div>
      <button
        type="button"
        className={[typography.button.mdBold, styles.cta].join(' ')}
        onClick={onCtaClick}
      >
        {ctaLabel}
      </button>
    </div>
  )
}
