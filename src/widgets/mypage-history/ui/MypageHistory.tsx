import { useState } from 'react'

import { ReceiptText } from 'lucide-react'

import {
  HistoryCard,
  HistoryListSkeleton,
  isReviewableOrder,
  orderStatusTag,
  useCancelOrder,
  useOrders,
  type Order,
  type OrderStatus,
} from '@entities/order'
import {
  ProductPaymentCard,
  type ProductPaymentCardItem,
} from '@entities/product'
import { useMyReviews, type Review } from '@entities/review'
import { startOrderPayment } from '@features/payment'
import { openReviewForm } from '@features/review-write'
import { getErrorMessage } from '@shared/api/client'
import { formatDotDateMinute } from '@shared/lib/formatDotDate'
import { formatWon } from '@shared/lib/formatNumber'
import { shortId } from '@shared/lib/shortId'
import { showToast } from '@shared/model/toastStore'
import { ActionButton, Button, Chip, Dropdown, InlineAlert } from '@shared/ui'

import * as styles from './MypageHistory.css'

// 요약 칸과 상태 칩이 같이 쓰는 묶음 — 결제 대기는 사용자가 할 일이 남은 상태라 경고색으로 센다.
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

// 칩 — '전체' 아니면 요약 칸 하나와 같은 상태 묶음만 남긴다(취소된 주문은 '전체'에서만 보인다).
const statusFilters = ['전체', ...summary.map(({ label }) => label)]

// 0은 기간 제한 없음.
const periodOptions = [0, 1, 3, 6, 12].map((months) => ({
  label: months ? `${months}개월` : '전체',
  value: months,
}))

const matchesStatus = (order: Order, filter: string) =>
  filter === '전체' ||
  summary.some(
    ({ label, statuses }) =>
      label === filter && statuses.includes(order.status),
  )

const countOf = (orders: Order[], filter: string) =>
  orders.filter((order) => matchesStatus(order, filter)).length

const withinMonths = (order: Order, months: number) => {
  if (!months) return true
  const since = new Date()
  since.setMonth(since.getMonth() - months)
  return new Date(order.createdAt) >= since
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  })

type OrderItem = Order['items'][number]

const toCardItem = (item: OrderItem): ProductPaymentCardItem => ({
  imageSrc: item.imageUrl ?? undefined,
  productId: item.productId,
  name: item.productTitle,
  modelNumber: '',
  optionSummary: [
    item.optionTitle,
    item.warrantyQuantity > 0 && `보증 ${item.warrantyQuantity}개`,
  ]
    .filter(Boolean)
    .join(' · '),
  quantityLabel: `수량 ${item.quantity}개`,
  priceLabel: formatWon(item.lineAmount),
})

// 결제 대기 주문 — 장바구니·바로 구매 주문은 여기서 결제(기한 10분 안)·취소한다. 사전예약 주문은 버튼 없이 상태만 보이고
// 결제·취소는 사전예약 내역에서 한다(주문 응답엔 예약 id가 없다) — 마이페이지 메뉴의 '사전예약 내역' 숫자가 그쪽으로 이끈다.
export function MypageHistory() {
  const cancelOrder = useCancelOrder()
  const [payingId, setPayingId] = useState<string | null>(null)

  // 결제 준비 → 토스 결제창. 정상 진행되면 페이지가 결제창으로 넘어간다.
  const pay = async (orderId: string) => {
    setPayingId(orderId)
    try {
      await startOrderPayment({ orderId })
    } catch (caught) {
      showToast(getErrorMessage(caught, '결제를 시작하지 못했어요.'))
    } finally {
      setPayingId(null)
    }
  }

  const cancel = (orderId: string) =>
    cancelOrder.mutate(orderId, {
      onSuccess: () => showToast('주문을 취소했어요.'),
      onError: (caught) =>
        showToast(getErrorMessage(caught, '주문을 취소하지 못했어요.')),
    })
  const [statusFilter, setStatusFilter] = useState('전체')
  const [period, setPeriod] = useState<number>(6)
  const { data, isPending, isError, error } = useOrders()
  // 주문상품마다 쓴 리뷰가 있으면 '리뷰 수정'으로 연다. 내 리뷰를 받기 전엔 버튼을 막는다.
  const myReviews = useMyReviews()
  const reviewByItem = new Map<string, Review>(
    (myReviews.data?.items ?? []).map((review) => [
      review.orderItemId ?? '',
      review,
    ]),
  )

  // 리뷰 버튼 — 쓴 리뷰가 있으면 내 리뷰 카드의 '리뷰 수정'과 같은 모양이다.
  const renderReviewButton = (item: OrderItem) => {
    const review = reviewByItem.get(item.orderItemId)
    return (
      <Button
        size="small"
        variant={review ? 'subtle' : 'solid'}
        color={review ? 'cancel' : 'primary'}
        disabled={myReviews.isPending}
        onClick={() =>
          openReviewForm({
            orderItemId: item.orderItemId,
            productName: item.productTitle,
            optionSummary: item.optionTitle,
            review,
          })
        }
      >
        {review ? '리뷰 수정' : '리뷰 쓰기'}
      </Button>
    )
  }

  // 리뷰 쓰기·수정 버튼은 가격 밑에 둔다.
  const renderItem = (order: Order) => (item: OrderItem) => (
    <ProductPaymentCard
      product={toCardItem(item)}
      priceAction={
        isReviewableOrder(order) ? renderReviewButton(item) : undefined
      }
    />
  )

  const orders = data?.items ?? []
  const visibleOrders = orders.filter(
    (order) =>
      matchesStatus(order, statusFilter) && withinMonths(order, period),
  )

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>주문 내역</h1>

      <dl className={styles.summary}>
        {summary.map(({ label, warning }) => {
          const count = countOf(orders, label)
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
          {statusFilters.map((filter) => (
            <Chip
              key={filter}
              selected={filter === statusFilter}
              onClick={() => setStatusFilter(filter)}
            >
              {filter}
              {/* 모바일은 요약 칸을 숨기고 건수를 칩에 붙인다 — 요약 칸과 같은 셈(기간 필터와 무관). */}
              <span className={styles.chipCount}>
                {countOf(orders, filter)}
              </span>
            </Chip>
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
        <HistoryListSkeleton />
      ) : (
        visibleOrders.length === 0 && (
          <InlineAlert status="info" variant="big" icon={ReceiptText}>
            해당하는 주문 내역이 없어요
          </InlineAlert>
        )
      )}

      {visibleOrders.map((order) => {
        const awaitingPayment = order.status === 'AWAITING_PAYMENT'
        return (
          <HistoryCard
            key={order.orderId}
            tag={orderStatusTag[order.status]}
            highlight={awaitingPayment ? 'warning' : undefined}
            preorder={order.source === 'PREORDER'}
            orderDate={formatDotDateMinute(order.createdAt)}
            orderNumber={shortId(order.orderId)}
            items={order.items}
            renderItem={renderItem(order)}
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
                {awaitingPayment && order.paymentDueAt && (
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>결제 기한</span>
                    <span className={styles.totalLabel}>
                      {formatTime(order.paymentDueAt)}까지
                    </span>
                  </div>
                )}
                {awaitingPayment &&
                  (order.source === 'CART' || order.source === 'BUY_NOW') && (
                    <div className={styles.actions}>
                      <Button
                        variant="subtle"
                        color="cancel"
                        disabled={cancelOrder.isPending}
                        onClick={() => cancel(order.orderId)}
                      >
                        주문 취소
                      </Button>
                      <ActionButton
                        size="md"
                        disabled={payingId !== null}
                        onClick={() => void pay(order.orderId)}
                      >
                        결제하기
                      </ActionButton>
                    </div>
                  )}
              </>
            }
          >
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt className={styles.factLabel}>받는 사람</dt>
                <dd className={styles.factValue}>{order.shipTo.name}</dd>
              </div>
              <div className={styles.fact}>
                <dt className={styles.factLabel}>배송지</dt>
                <dd className={styles.factValue}>
                  {[order.shipTo.line1, order.shipTo.line2]
                    .filter(Boolean)
                    .join(' ')}
                </dd>
              </div>
            </dl>
          </HistoryCard>
        )
      })}
    </div>
  )
}
