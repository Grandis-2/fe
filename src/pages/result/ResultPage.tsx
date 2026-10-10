import { useMemo } from 'react'

import { useLocation, useNavigate, useSearchParams } from 'react-router'

import { useOrder } from '@entities/order'
import { useReservation, type ReservationDetail } from '@entities/preorder'
import { orderToDrafts, reservationToDraft } from '@features/product-purchase'
import {
  HOME_PATH,
  mypagePath,
  paymentPath,
  PREORDER_PATH,
  RESULT_STATUSES,
  type ResultStatus,
} from '@shared/config/routes'
import { ActionButton } from '@shared/ui'
import {
  OrderReceipt,
  OrderStatusMark,
  PurchaseDeadline,
  type OrderReceiptRow,
  type OrderStatusTone,
} from '@widgets/order-result'

import * as styles from './ResultPage.css'

// 예약 접수 / 사전예약 구매 완료 / 일반 구매 완료 / 결제 실패 — 상태 표시·영수증·버튼 뼈대를
// 공유해서 한 페이지로 둔다. 진입할 때 ?status=로 고른다(RESULT_STATUSES).
const isResultStatus = (value: string | null): value is ResultStatus =>
  RESULT_STATUSES.includes(value as ResultStatus)

// 들어오는 쪽이 history state로 넘기는 값 — 상품 상세(접수)는 preorderId, 결제 콜백은 orderId(성공)나
// failReason·preorderId(실패). 새로고침하거나 주소로 직접 오면 없을 수 있다.
type ResultState = {
  preorderId?: string
  orderId?: string
  failReason?: string | null
}

const readState = (state: unknown): ResultState =>
  state !== null && typeof state === 'object' ? (state as ResultState) : {}

// 예약 접수 화면의 결제 상태 칸.
const reservationPaymentLabel: Partial<
  Record<ReservationDetail['displayStatus'], string>
> = {
  RECEIVED: '예약 처리 중 · 잠시 뒤 구매 확정 가능',
  PROCESSING: '예약 처리 중 · 잠시 뒤 구매 확정 가능',
  PAYABLE: '미결제 · 구매 확정 필요',
  PAYMENT_IN_PROGRESS: '미결제 · 결제 진행 중',
  PAYMENT_EXPIRED: '결제 기한 지남',
  RESERVED: '결제 완료',
  CANCELING: '예약 취소 중',
  CANCELED: '예약 취소됨',
}

// 'YYYY-MM-DD'를 시간대 변환 없이 'M.D'로 자른다.
const monthDay = (date: string) => {
  const [, month, day] = date.split('-').map(Number)
  return `${month}.${day}`
}

type Action = { label: string; to: string }

const content: Record<
  ResultStatus,
  {
    tone: OrderStatusTone
    badge: string
    heading: string
    description: string
    primary: Action
    secondary: Action
    note?: string
  }
> = {
  preorder: {
    tone: 'pending',
    badge: '구매 확정 대기',
    heading: '예약이 접수되었어요',
    description:
      '주문이 몰려 결제까지 완료되지 못했어요. 예약 순서는 확보되었으니, 24시간 안에 직접 구매를 확정해 주세요.',
    // 예약 id가 있으면 그 예약의 결제로 보낸다(아래 primaryTo).
    primary: { label: '지금 구매 확정하기', to: mypagePath('preorder-check') },
    secondary: { label: '예약 내역 보기', to: mypagePath('preorder-check') },
    note: '24시간 안에 구매를 확정하지 않으면 예약은 자동으로 취소돼요. 예약 내역에서도 구매를 확정할 수 있어요.',
  },
  'preorder-paid': {
    tone: 'success',
    badge: '사전예약 구매 완료',
    heading: '사전예약 구매가 완료되었어요',
    description:
      '출시일에 맞춰 순서대로 발송해 드려요. 배송이 시작되면 알림으로 알려드릴게요.',
    primary: { label: '주문 내역 보기', to: mypagePath('history') },
    secondary: { label: '쇼핑 계속하기', to: PREORDER_PATH },
  },
  paid: {
    tone: 'success',
    badge: '구매 완료',
    heading: '주문이 완료되었어요',
    description:
      '결제가 정상적으로 처리되었어요. 배송이 시작되면 알림으로 알려드릴게요.',
    primary: { label: '주문 내역 보기', to: mypagePath('history') },
    secondary: { label: '쇼핑 계속하기', to: HOME_PATH },
  },
  failed: {
    tone: 'failure',
    badge: '구매 실패',
    heading: '결제에 실패했어요',
    description:
      '결제가 완료되지 않아 주문이 접수되지 않았어요. 결제 수단을 확인한 뒤 다시 시도해 주세요.',
    primary: { label: '다시 결제하기', to: mypagePath('preorder-check') },
    secondary: { label: '예약 내역 보기', to: mypagePath('preorder-check') },
  },
}

export function ResultPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const statusParam = searchParams.get('status')
  const status: ResultStatus = isResultStatus(statusParam)
    ? statusParam
    : 'paid'
  const { tone, badge, heading, description, primary, secondary, note } =
    content[status]
  const isPaid = tone === 'success'
  const {
    preorderId = '',
    orderId = '',
    failReason,
  } = readState(location.state)
  const { data: reservation } = useReservation(isPaid ? '' : preorderId)
  const { data: order } = useOrder(isPaid ? orderId : '')
  // useCountdown이 매 렌더 새 Date로 타이머를 다시 걸지 않게 값이 바뀔 때만 만든다.
  const paymentDueAt = reservation?.paymentDueAt
  const dueAt = useMemo(
    () => (paymentDueAt ? new Date(paymentDueAt) : null),
    [paymentDueAt],
  )

  const items = order
    ? orderToDrafts(order)
    : reservation
      ? [reservationToDraft(reservation)]
      : []
  // 금액은 서버가 정한 값이다 — 주문 총액, 아직 주문 전이면 예약 접수 당시 단가.
  const amount = order?.totalAmount ?? reservation?.unitPrice ?? 0

  const rows: OrderReceiptRow[] = isPaid
    ? [
        { label: '결제 수단', value: '신용·체크카드' },
        ...(order
          ? [
              {
                label: '배송지',
                value: [order.shipTo.line1, order.shipTo.line2]
                  .filter(Boolean)
                  .join(' '),
              },
            ]
          : []),
        { label: '예상 배송일', value: '출시일 이후 순차 발송' },
      ]
    : [
        ...(reservation
          ? [
              {
                label: '배송 차수',
                value: `${reservation.shipmentBatch.batchNumber}차 · ${monthDay(reservation.shipmentBatch.estimatedShipStart)}~${monthDay(reservation.shipmentBatch.estimatedShipEnd)} 발송 예정`,
              },
            ]
          : []),
        {
          label: '결제 상태',
          value:
            status === 'failed'
              ? '미결제'
              : ((reservation &&
                  reservationPaymentLabel[reservation.displayStatus]) ??
                '미결제 · 구매 확정 필요'),
          tone: status === 'failed' ? 'danger' : 'warning',
        },
      ]

  // 예약 접수·결제 실패의 기본 버튼은 그 예약의 결제로 보낸다. 예약 접수 직후엔 외부 등록이 끝나야(PAYABLE) 결제할 수 있다.
  const primaryTo =
    preorderId && (status === 'preorder' || status === 'failed')
      ? paymentPath(preorderId)
      : primary.to
  const primaryDisabled =
    status === 'preorder' &&
    reservation !== undefined &&
    reservation.displayStatus !== 'PAYABLE' &&
    reservation.displayStatus !== 'PAYMENT_IN_PROGRESS'

  return (
    <div
      className={[styles.root, styles.glow[tone]].join(' ')}
      data-theme="dark"
      data-header-theme="dark"
    >
      <div className={styles.content}>
        <div className={styles.hero}>
          <OrderStatusMark tone={tone} />
          <span className={styles.badge[tone]}>{badge}</span>
          <h1 className={styles.heading}>{heading}</h1>
          <div className={styles.description}>{description}</div>
        </div>

        {status === 'preorder' && dueAt && <PurchaseDeadline dueAt={dueAt} />}

        {status === 'failed' && (
          <div className={styles.failure}>
            {failReason && (
              <>
                <span className={styles.failureTitle}>실패 사유</span>
                <span className={styles.failureReason}>{failReason}</span>
              </>
            )}
            <span className={styles.failureNote}>
              결제 금액은 청구되지 않았어요.
            </span>
          </div>
        )}

        {items.length > 0 && (
          <OrderReceipt
            number={
              order
                ? {
                    label: '주문번호',
                    value: order.orderId.slice(0, 8).toUpperCase(),
                  }
                : reservation && status === 'preorder'
                  ? {
                      label: '예약 순번',
                      value: `${reservation.queuePosition.toLocaleString()}번`,
                    }
                  : undefined
            }
            items={items}
            rows={rows}
            amountLabel={isPaid ? '총 결제 금액' : '결제 예정 금액'}
            amount={amount}
            amountPending={!isPaid}
          />
        )}

        <div className={styles.actions}>
          <ActionButton
            variant="neutral"
            onClick={() => navigate(secondary.to)}
          >
            {secondary.label}
          </ActionButton>
          <ActionButton
            disabled={primaryDisabled}
            onClick={() => navigate(primaryTo)}
          >
            {primaryDisabled ? '예약 처리 중이에요' : primary.label}
          </ActionButton>
        </div>

        {note && <div className={styles.note}>{note}</div>}
      </div>
    </div>
  )
}
