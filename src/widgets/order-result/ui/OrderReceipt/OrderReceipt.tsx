import { ProductPaymentCard } from '@entities/product'
import type { PurchaseDraft } from '@features/product-purchase'
import { formatWon } from '@shared/lib/formatNumber'

import * as styles from './OrderReceipt.css'

export type OrderReceiptRow = {
  label: string
  value: string
  tone?: keyof typeof styles.rowValue
}

export type OrderReceiptProps = {
  // 실패한 주문은 번호가 없어 맨 윗줄을 통째로 뺀다.
  number?: { label: string; value: string }
  items: PurchaseDraft[]
  rows: OrderReceiptRow[]
  amountLabel: string
  amount: number
  // 결제가 끝나지 않은 금액(결제 예정)은 브랜드색으로 띄운다.
  amountPending?: boolean
}

// 주문 결과 화면의 영수증 카드 — 주문번호, 주문 상품, 결제 정보 행, 금액 순.
export function OrderReceipt({
  number,
  items,
  rows,
  amountLabel,
  amount,
  amountPending,
}: OrderReceiptProps) {
  return (
    <div className={styles.root}>
      {number && (
        <div className={styles.numberRow}>
          <span className={styles.numberLabel}>{number.label}</span>
          <span className={styles.numberValue}>{number.value}</span>
        </div>
      )}

      <div className={styles.items}>
        {items.map((item) => (
          <ProductPaymentCard
            key={item.variantId}
            className={styles.item}
            product={{
              name: item.productName,
              // ponytail: 백엔드 상세에 모델명 칸이 없어 비워 둔다(주문서와 같음).
              modelNumber: '',
              optionSummary: item.optionSummary,
              quantityLabel: `수량 ${item.quantity}개`,
              priceLabel: formatWon(item.unitPrice * item.quantity),
            }}
          />
        ))}
      </div>

      <div className={styles.summary}>
        {rows.map((row) => (
          <div key={row.label} className={styles.row}>
            <span className={styles.rowLabel}>{row.label}</span>
            <span className={styles.rowValue[row.tone ?? 'default']}>
              {row.value}
            </span>
          </div>
        ))}
        <div className={styles.amountRow}>
          <span className={styles.amountLabel}>{amountLabel}</span>
          <span
            className={styles.amountValue[amountPending ? 'pending' : 'paid']}
          >
            {formatWon(amount)}
          </span>
        </div>
      </div>
    </div>
  )
}
