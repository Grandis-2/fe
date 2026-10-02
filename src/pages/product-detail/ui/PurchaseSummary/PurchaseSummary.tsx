import type { ReactNode } from 'react'

import * as styles from './PurchaseSummary.css'

export type PurchaseSummaryRow = {
  label: string
  value: string
}

export type PurchaseSummaryProps = {
  // 선택한 구성을 한 문장으로 — 예: "M5 칩 탑재 실버 MacBook Pro 14인치 모델"
  title: string
  // 합계 위에 쌓이는 금액 줄(상품 금액, 할인 등).
  rows: PurchaseSummaryRow[]
  total: PurchaseSummaryRow
  // 합계 밑 안내 문구(순차배송 등).
  note?: string
  // 장바구니/결제 버튼 영역.
  children: ReactNode
}

// 웹 전용 구매 요약 — 옵션 컬럼 밑에서 고른 구성(제목), 금액, 할인, 구매 버튼을 한 카드로 모은다.
// 모바일은 하단 고정바(widgets/product-purchase-bar)가 같은 일을 해서 숨긴다.
export function PurchaseSummary({
  title,
  rows,
  total,
  note,
  children,
}: PurchaseSummaryProps) {
  return (
    <div className={styles.root}>
      <div className={styles.title}>{title}</div>
      <div className={styles.prices}>
        {rows.map(({ label, value }) => (
          <div key={label} className={styles.row}>
            <span>{label}</span>
            <span>{value}</span>
          </div>
        ))}
        <div className={styles.total}>
          <span>{total.label}</span>
          <span className={styles.totalValue}>{total.value}</span>
        </div>
      </div>
      {note && <div className={styles.note}>{note}</div>}
      {children}
    </div>
  )
}
