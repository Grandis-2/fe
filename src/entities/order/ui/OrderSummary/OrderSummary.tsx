import type { ReactNode } from 'react'

import { typography } from '@/shared/config/theme'
import { Button, PriceText } from '@/shared/ui'

import * as styles from './OrderSummary.css'

export type OrderSummaryRow = {
  label: string
  value: string
  /** 할인처럼 강조가 필요한 금액 */
  highlight?: boolean
}

export type OrderSummaryProps = {
  title?: string
  rows: OrderSummaryRow[]
  totalLabel?: string
  totalValue: string
  actionLabel: string
  onAction?: () => void
  actionDisabled?: boolean
  /** 결제 페이지의 약관 동의가 들어가는 자리. 장바구니에서는 넘기지 않는다. */
  children?: ReactNode
  className?: string
}

export function OrderSummary({
  title = '결제 정보',
  rows,
  totalLabel = '총 결제 금액',
  totalValue,
  actionLabel,
  onAction,
  actionDisabled,
  children,
  className,
}: OrderSummaryProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={[typography.title.mdSemibold, styles.title].join(' ')}>
        {title}
      </div>

      <div className={styles.rows}>
        {rows.map((row) => (
          <div key={row.label} className={styles.row}>
            <div className={[typography.body.sub, styles.rowLabel].join(' ')}>
              {row.label}
            </div>
            <div
              className={[
                typography.body.subMedium,
                row.highlight ? styles.rowValueHighlight : styles.rowValue,
              ].join(' ')}
            >
              {row.value}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.totalRow}>
        <div className={[typography.body.subMedium, styles.rowLabel].join(' ')}>
          {totalLabel}
        </div>
        <div className={typography.title.lgSemibold}>
          <PriceText value={totalValue} />
        </div>
      </div>

      {children}

      <div className={styles.actionRow}>
        <Button
          className={styles.action}
          disabled={actionDisabled}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
