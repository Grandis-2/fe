import { useState } from 'react'

import { useNavigate } from 'react-router'

import {
  HistoryCard,
  orderStatusTag,
  useOrders,
  type Order,
  type OrderStatus,
} from '@entities/order'
import {
  ProductPaymentCard,
  type ProductPaymentCardItem,
} from '@entities/product'
import { getErrorMessage } from '@shared/api/client'
import { mypagePath } from '@shared/config/routes'
import { formatDotDate } from '@shared/lib/formatDotDate'
import { formatWon } from '@shared/lib/formatNumber'
import { ActionButton, Dropdown, SelectButton } from '@shared/ui'

import * as styles from './MypageHistory.css'

// 요약 칸 — 결제 대기는 사용자가 할 일이 남은 상태라 경고색으로 센다.
const summary: { label: string; statuses: OrderStatus[]; warning?: true }[] = [
  {
    label: '결제 대기',
    statuses: ['AWAITING_PAYMENT', 'AUTHORIZING'],
    warning: true,
  },
  {
    label: '배송 준비',
    statuses: ['AWAITING_CONFIRMATION', 'PREPARING_ITEMS', 'READY_TO_SHIP'],
  },
  { label: '배송 중', statuses: ['SHIPPED'] },
  { label: '배송 완료', statuses: ['DELIVERED'] },
]

const kindFilters = ['전체', '사전예약', '일반 구매'] as const
type KindFilter = (typeof kindFilters)[number]

// 0은 기간 제한 없음.
const periodOptions = [0, 1, 3, 6, 12].map((months) => ({
  label: months ? `${months}개월` : '전체',
  value: months,
}))

const matchesKind = (order: Order, kind: KindFilter) =>
  kind === '전체' || (kind === '사전예약') === (order.source === 'PREORDER')

const withinMonths = (order: Order, months: number) => {
  if (!months) return true
  const since = new Date()
  since.setMonth(since.getMonth() - months)
  return new Date(order.createdAt) >= since
}

const toItems = ({ items }: Order): ProductPaymentCardItem[] =>
  items.map((item) => ({
    productId: item.productId,
    name: item.productTitle,
    modelNumber: '',
    optionSummary: item.optionTitle,
    quantityLabel: `수량 ${item.quantity}개`,
    priceLabel: formatWon(item.unitPrice * item.quantity),
  }))

const renderItem = (product: ProductPaymentCardItem) => (
  <ProductPaymentCard product={product} />
)

// 주문은 취소 API가 없다 — 사전예약 주문은 예약을 취소하면 주문에 반영된다(예약 내역에서).
// 주문 응답엔 예약 id가 없어 결제를 이어갈 때도 예약 내역으로 보낸다.
export function MypageHistory() {
  const navigate = useNavigate()
  const [kind, setKind] = useState<KindFilter>('전체')
  const [period, setPeriod] = useState<number>(6)
  const { data, isPending, isError, error } = useOrders()

  const orders = data?.items ?? []
  const visibleOrders = orders.filter(
    (order) => matchesKind(order, kind) && withinMonths(order, period),
  )

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>
        주문 내역 <span className={styles.count}>{visibleOrders.length}건</span>
      </h1>

      <dl className={styles.summary}>
        {summary.map(({ label, statuses, warning }) => {
          const count = orders.filter((order) =>
            statuses.includes(order.status),
          ).length
          return (
            <div key={label} className={styles.summaryItem}>
              <dt className={styles.summaryLabel}>{label}</dt>
              <dd
                className={
                  styles.summaryValue[
                    !count ? 'empty' : warning ? 'warning' : 'default'
                  ]
                }
              >
                {count}
              </dd>
            </div>
          )
        })}
      </dl>

      <div className={styles.toolbar}>
        <div className={styles.chips}>
          {kindFilters.map((filter) => (
            <SelectButton
              key={filter}
              className={styles.chip}
              selected={filter === kind}
              onClick={() => setKind(filter)}
            >
              {filter}
            </SelectButton>
          ))}
        </div>
        <Dropdown
          size="small"
          width="96px"
          label="기간"
          options={periodOptions}
          value={period}
          onSelect={setPeriod}
        />
      </div>

      {isError ? (
        <div className={styles.empty}>
          {getErrorMessage(error, '주문 내역을 불러오지 못했어요.')}
        </div>
      ) : isPending ? (
        <div className={styles.empty}>주문 내역을 불러오는 중이에요.</div>
      ) : (
        visibleOrders.length === 0 && (
          <div className={styles.empty}>해당하는 주문 내역이 없어요.</div>
        )
      )}

      {visibleOrders.map((order) => {
        const awaitingPayment = order.status === 'AWAITING_PAYMENT'
        return (
          <HistoryCard
            key={order.orderId}
            tag={orderStatusTag[order.status]}
            highlight={awaitingPayment}
            preorder={order.source === 'PREORDER'}
            orderDate={formatDotDate(order.createdAt)}
            orderNumber={order.orderId.slice(0, 8).toUpperCase()}
            items={toItems(order)}
            renderItem={renderItem}
            footer={
              <>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>
                    {awaitingPayment ? '결제 예정' : '결제 금액'}
                  </span>
                  <span className={styles.totalValue}>
                    {formatWon(order.totalAmount)}
                  </span>
                </div>
                {awaitingPayment && (
                  <div className={styles.actions}>
                    <ActionButton
                      size="md"
                      onClick={() => navigate(mypagePath('preorder-check'))}
                    >
                      예약 내역에서 결제하기
                    </ActionButton>
                  </div>
                )}
              </>
            }
          />
        )
      })}
    </div>
  )
}
