import type { ReactNode } from 'react'

import * as styles from './PurchaseSummary.css'

export type PurchaseSummaryRow = {
  label: string
  value: string
  // 할인처럼 눈에 띄어야 하는 금액.
  accent?: boolean
}

// 고른 구성 칩 하나. 색상은 hex로 앞에 색 점을 붙인다.
export type PurchaseSummaryOption = {
  label: string
  hex?: string
}

export type PurchaseSummaryProps = {
  options: PurchaseSummaryOption[]
  // 합계 위에 쌓이는 금액 줄(상품 금액, 할인 등).
  rows: PurchaseSummaryRow[]
  total: Omit<PurchaseSummaryRow, 'accent'>
  // 합계 밑 안내 문구(순차배송 등).
  note?: string
  // 장바구니/결제 버튼 영역.
  children: ReactNode
}

// 웹 전용 구매 요약 — 옵션 컬럼 밑에서 고른 구성, 금액, 할인, 구매 버튼을 한 카드로 모은다.
// 모바일은 하단 고정바(widgets/product-purchase-bar)가 같은 일을 해서 숨긴다.
export function PurchaseSummary({
  options,
  rows,
  total,
  note,
  children,
}: PurchaseSummaryProps) {
  return (
    <div className={styles.root}>
      <div className={styles.selected}>
        <span className={styles.selectedTitle}>선택한 옵션</span>
        <ul className={styles.chips}>
          {options.map(({ label, hex }) => (
            <li key={label} className={styles.chip}>
              {hex && (
                <span
                  className={styles.chipDot}
                  style={{ background: hex }}
                  aria-hidden
                />
              )}
              {label}
            </li>
          ))}
        </ul>
      </div>
      {rows.map(({ label, value, accent }) => (
        <div key={label} className={styles.row}>
          <span>{label}</span>
          <span className={accent ? styles.accent : undefined}>{value}</span>
        </div>
      ))}
      <div className={styles.total}>
        <span>{total.label}</span>
        <span className={styles.totalValue}>{total.value}</span>
      </div>
      {note && <div className={styles.note}>{note}</div>}
      {children}
    </div>
  )
}
