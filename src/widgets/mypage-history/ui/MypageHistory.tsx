import { HistoryCard, type HistoryCardStatus } from '@entities/order'
import {
  ProductPaymentCard,
  type ProductPaymentCardItem,
} from '@entities/product'

import * as styles from './MypageHistory.css'

const renderItem = (item: ProductPaymentCardItem) => (
  <ProductPaymentCard product={item} />
)

const item: ProductPaymentCardItem = {
  name: '맥북 프로 14',
  modelNumber: 'A3112',
  optionSummary: '스페이스 블랙 · 512GB · AppleCare+ 포함',
  quantityLabel: '수량 1개',
  priceLabel: '2,390,000원',
}

// ponytail: 아직 구매 내역 API가 없어서 상태별 목업 데이터로 대체
const orders: {
  status: HistoryCardStatus
  orderDate: string
  orderNumber: string
}[] = [
  {
    status: 'delivered-before-review',
    orderDate: '2026.08.01',
    orderNumber: '20260801-000123',
  },
  {
    status: 'delivered-after-review',
    orderDate: '2026.07.15',
    orderNumber: '20260715-000098',
  },
  {
    status: 'shipping',
    orderDate: '2026.09.10',
    orderNumber: '20260910-000201',
  },
  {
    status: 'preparing',
    orderDate: '2026.09.20',
    orderNumber: '20260920-000305',
  },
  {
    status: 'cancelled',
    orderDate: '2026.06.02',
    orderNumber: '20260602-000042',
  },
]

export function MypageHistory() {
  return (
    <div className={styles.root}>
      {orders.map((order) => (
        <HistoryCard
          key={order.orderNumber}
          status={order.status}
          orderDate={order.orderDate}
          orderNumber={order.orderNumber}
          items={[item]}
          renderItem={renderItem}
        />
      ))}
    </div>
  )
}
