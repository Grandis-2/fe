import { useState } from 'react'

import { ChevronDown } from 'lucide-react'

import { ProductPaymentCard } from '@entities/product'
import { formatWon } from '@shared/lib/formatNumber'

import * as styles from './OrderItemList.css'

import type { PurchaseDraft } from '../../model/purchaseDraft'

// 상품이 많으면 수령인·배송지 입력이 한참 아래로 밀리므로 처음엔 이만큼만 보여 준다.
const COLLAPSED_COUNT = 2

export type OrderItemListProps = {
  items: PurchaseDraft[]
}

export function OrderItemList({ items }: OrderItemListProps) {
  const [expanded, setExpanded] = useState(false)
  const hiddenCount = items.length - COLLAPSED_COUNT
  const shownItems = expanded ? items : items.slice(0, COLLAPSED_COUNT)

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>주문 상품</span>
        <span className={styles.count}>{items.length}건</span>
      </div>

      <div className={styles.list}>
        {shownItems.map((item) => (
          <ProductPaymentCard
            key={item.variantId}
            className={styles.item}
            product={{
              name: item.productName,
              // ponytail: 백엔드 상세에 모델명 칸이 없어 비워 둔다(장바구니와 같음).
              modelNumber: '',
              optionSummary: item.optionSummary,
              quantityLabel: `수량 ${item.quantity}개`,
              priceLabel: formatWon(item.unitPrice * item.quantity),
            }}
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? '접기' : `상품 ${hiddenCount}개 더보기`}
          <ChevronDown
            aria-hidden="true"
            className={[styles.toggleIcon, expanded && styles.toggleIconOpen]
              .filter(Boolean)
              .join(' ')}
          />
        </button>
      )}
    </div>
  )
}
