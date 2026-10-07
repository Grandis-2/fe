import { useState } from 'react'

import { useNavigate } from 'react-router'

import {
  HistoryCard,
  MOCK_ORDERS,
  type Order,
  type OrderStatus,
} from '@entities/order'
import { ProductPaymentCard } from '@entities/product'
import { myReviewKey, useMyReviewStore } from '@entities/review'
import { ReviewFormModal, type ReviewTarget } from '@features/review-write'
import { mypagePath, PAYMENT_PATH } from '@shared/config/routes'
import { formatWon } from '@shared/lib/formatNumber'
import { parseDateOnly } from '@shared/lib/parseDateOnly'
import { ActionButton, Button, Dropdown, SelectButton } from '@shared/ui'

import * as styles from './MypageHistory.css'

const summary: { label: string; statuses: OrderStatus[] }[] = [
  { label: '구매 확정 대기', statuses: ['confirm'] },
  { label: '배송 준비', statuses: ['ready', 'preship'] },
  { label: '배송 중', statuses: ['shipping'] },
  { label: '배송 완료', statuses: ['delivered'] },
]

const kindFilters = ['전체', '사전예약', '일반 구매'] as const
type KindFilter = (typeof kindFilters)[number]

// 0은 기간 제한 없음.
const periods = [0, 1, 3, 6, 12] as const
const periodLabel = (months: number) => (months ? `${months}개월` : '전체')

const matchesKind = (order: Order, kind: KindFilter) =>
  kind === '전체' || (kind === '사전예약') === !!order.preorder

const withinMonths = (order: Order, months: number) => {
  if (!months) return true
  const since = new Date()
  since.setMonth(since.getMonth() - months)
  const ordered = parseDateOnly(order.orderDate)
  return !!ordered && ordered >= since
}

// 사전예약은 구매 확정 전·출시 전까지, 일반 구매는 배송 준비 중일 때만 취소할 수 있다.
const isCancelable = ({ preorder, status }: Order) =>
  preorder ? status === 'confirm' || status === 'preship' : status === 'ready'

export function MypageHistory() {
  const navigate = useNavigate()
  const [kind, setKind] = useState<KindFilter>('전체')
  const [period, setPeriod] = useState<number>(6)
  const [periodOpen, setPeriodOpen] = useState(false)
  const reviews = useMyReviewStore((state) => state.reviews)
  const [reviewFormOpen, setReviewFormOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null)

  const visibleOrders = MOCK_ORDERS.filter(
    (order) => matchesKind(order, kind) && withinMonths(order, period),
  )

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>
        주문 내역 <span className={styles.count}>{visibleOrders.length}건</span>
      </h1>

      <dl className={styles.summary}>
        {summary.map(({ label, statuses }) => {
          const count = MOCK_ORDERS.filter((order) =>
            statuses.includes(order.status),
          ).length
          return (
            <div key={label} className={styles.summaryItem}>
              <dt className={styles.summaryLabel}>{label}</dt>
              <dd
                className={
                  styles.summaryValue[
                    !count
                      ? 'empty'
                      : statuses.includes('confirm')
                        ? 'warning'
                        : 'default'
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
          options={periods.map(periodLabel)}
          selectedOption={periodLabel(period)}
          open={periodOpen}
          onToggle={() => setPeriodOpen((open) => !open)}
          onSelect={(_, index) => {
            setPeriod(periods[index])
            setPeriodOpen(false)
          }}
        />
      </div>

      {visibleOrders.length === 0 && (
        <div className={styles.empty}>해당하는 주문 내역이 없어요.</div>
      )}

      {visibleOrders.map((order) => {
        const pending = order.status === 'confirm'
        const cancelable = isCancelable(order)
        return (
          <HistoryCard
            key={order.orderNumber}
            status={order.status}
            preorder={order.preorder}
            orderDate={order.orderDate.replaceAll('-', '.')}
            orderNumber={order.orderNumber}
            numberLabel={pending ? '예약번호' : '주문번호'}
            purchaseDueAt={order.purchaseDueAt}
            items={order.items}
            renderItem={(product, index) => {
              if (order.status !== 'delivered')
                return <ProductPaymentCard product={product} />
              // 배송 완료 상품마다 리뷰 쓰기 — 이미 썼으면 내 리뷰 탭에서 본다.
              const key = myReviewKey(order.orderNumber, index)
              const review = reviews[key]
              return (
                <ProductPaymentCard
                  variant="checkout"
                  product={product}
                  actionLabel={
                    review
                      ? `★ ${review.rating} 내가 쓴 리뷰 보기`
                      : '리뷰 쓰기'
                  }
                  onActionClick={() => {
                    if (review) {
                      navigate(mypagePath('reviews'))
                      window.scrollTo(0, 0)
                      return
                    }
                    setReviewTarget({
                      key,
                      productName: product.name,
                      optionSummary: product.optionSummary,
                    })
                    setReviewFormOpen(true)
                  }}
                />
              )
            }}
            footer={
              <>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>
                    {pending ? '결제 예정' : '결제 금액'}
                  </span>
                  <span className={styles.totalValue}>
                    {formatWon(order.amount)}
                  </span>
                </div>
                {(cancelable || pending) && (
                  <div className={styles.actions}>
                    {/* ponytail: 주문 취소 API가 아직 없어 버튼만 둔다. */}
                    {cancelable && (
                      <Button variant="subtle" color="cancel">
                        {order.preorder ? '예약 취소' : '주문 취소'}
                      </Button>
                    )}
                    {pending && (
                      <ActionButton
                        size="md"
                        onClick={() => navigate(PAYMENT_PATH)}
                      >
                        구매 확정하기
                      </ActionButton>
                    )}
                  </div>
                )}
              </>
            }
          />
        )
      })}

      <ReviewFormModal
        open={reviewFormOpen}
        target={reviewTarget}
        onClose={() => setReviewFormOpen(false)}
      />
    </div>
  )
}
