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
import { shortId } from '@shared/lib/shortId'
import { useDeadline } from '@shared/lib/useDeadline'
import { ActionButton, InlineAlert, PollingNotice } from '@shared/ui'
import {
  OrderReceipt,
  OrderStatusMark,
  PurchaseDeadline,
  PurchaseSteps,
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
    secondary: {
      label: '사전예약 내역 보기',
      to: mypagePath('preorder-check'),
    },
    note: '24시간 안에 구매를 확정하지 않으면 예약은 자동으로 취소돼요. 사전예약 내역에서도 구매를 확정할 수 있어요.',
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
      '결제가 완료되지 않았어요. 주문은 결제 기한까지 결제 대기로 남아 있으니, 결제 수단을 확인한 뒤 다시 시도해 주세요.',
    // 사전예약이면 같은 예약의 결제로(아래 primaryTo), 장바구니·바로 구매 주문이면 주문 내역에서 기한 안에 다시 결제한다.
    primary: { label: '다시 결제하기', to: mypagePath('history') },
    // 바로 구매는 장바구니를 거치지 않았고, 여기선 어느 쪽 주문인지 모른다 — 둘 다 맞는 홈으로.
    secondary: { label: '쇼핑 계속하기', to: HOME_PATH },
  },
}

// 예약 접수 화면은 예약의 화면 단계에 따라 상단과 꺼진 버튼 문구를 바꾼다. 구매를 확정할 수 있는 단계는
// content.preorder 그대로다. 외부 등록이 5초 안에 끝나지 않아 넘어온 예약은 처리 중에서 시작하고, 결제 기한이
// 지나면 서버가 만료 취소를 시작해 기한 지남 → 취소 중 → 취소 완료로 간다.
type DisplayStatus = ReservationDetail['displayStatus']
type PreorderStage = Pick<
  (typeof content)['preorder'],
  'tone' | 'badge' | 'heading' | 'description' | 'note'
> & { disabledLabel: string }

const PURCHASABLE: DisplayStatus[] = ['PAYABLE', 'PAYMENT_IN_PROGRESS']

const registering: PreorderStage = {
  tone: 'pending',
  badge: '예약 처리 중',
  heading: '예약 순서를 확보했어요',
  description:
    '주문이 몰려 예약 등록이 조금 늦어지고 있어요. 등록이 끝나면 이 화면에서 바로 구매를 확정할 수 있고, 화면을 닫아도 예약 순서는 그대로예요.',
  note: content.preorder.note,
  disabledLabel: '예약 처리 중이에요',
}
const canceled = {
  tone: 'failure',
  note: undefined,
  disabledLabel: '취소된 예약이에요',
} as const

const preorderStage: Partial<Record<DisplayStatus, PreorderStage>> = {
  RECEIVED: registering,
  PROCESSING: registering,
  PAYMENT_EXPIRED: {
    ...canceled,
    badge: '기한 지남',
    heading: '구매 확정 기한이 지났어요',
    description: '기한 안에 확정하지 않은 예약은 자동으로 취소돼요.',
    disabledLabel: '구매 확정 기한이 지났어요',
  },
  CANCELING: {
    ...canceled,
    badge: '예약 취소 중',
    heading: '예약을 취소하고 있어요',
    description: '취소가 끝나면 사전예약 내역에도 반영돼요.',
  },
  CANCELED: {
    ...canceled,
    badge: '예약 취소',
    heading: '예약이 취소되었어요',
    description:
      '구매 확정 기한이 지났거나 취소를 요청한 예약이에요. 다시 예약하려면 사전예약 페이지에서 새로 신청해 주세요.',
  },
  RESERVED: {
    tone: 'success',
    badge: '사전예약 구매 완료',
    heading: '이미 구매를 확정한 예약이에요',
    description: '출시일에 맞춰 순서대로 발송해 드려요.',
    note: undefined,
    disabledLabel: '구매 확정 완료',
  },
}

// 예약을 끝내 받지 못했다(주소의 예약 id가 틀렸거나 남의 예약이면 404) — 처리 중이라고 하지 않는다.
const loadFailed: PreorderStage = {
  tone: 'failure',
  badge: '확인 필요',
  heading: '예약을 불러오지 못했어요',
  description: '사전예약 내역에서 예약 상태를 확인해 주세요.',
  note: undefined,
  disabledLabel: '예약을 확인할 수 없어요',
}

// 외부 등록이 끝내 실패하면(재처리 대기) 처리 중으로 남는다. 관리자 대조가 '등록 지연'으로 잡는 시간
// (RECONCILE_GRACE_MS)과 같게 맞춰, 사용자와 운영자가 같은 시점에 지연을 본다.
const REGISTER_DELAYED_MS = 60_000

export function ResultPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const statusParam = searchParams.get('status')
  const status: ResultStatus = isResultStatus(statusParam)
    ? statusParam
    : 'paid'
  const isPaid = content[status].tone === 'success'
  const state = readState(location.state)
  const { orderId = '', failReason } = state
  // 예약 접수는 주소로 예약 id를 받는다(새로고침·공유). 결제 실패는 아직 history state로 받는다.
  const preorderId = searchParams.get('preorderId') ?? state.preorderId ?? ''
  const reservationQuery = useReservation(isPaid ? '' : preorderId)
  const orderQuery = useOrder(isPaid ? orderId : '')
  const reservation = reservationQuery.data
  const order = orderQuery.data
  // 예약 접수 화면의 단계. 예약을 받는 중에도 처리 중으로 둔다 — 5초 안에 등록됐으면 결제로 바로 갔으니,
  // 여기 온 예약은 대개 처리 중이다. 받지 못했으면(isError) 단계를 정하지 않고 불러오지 못했다고 알린다.
  const isPreorderView = status === 'preorder' && preorderId !== ''
  const loadError = isPreorderView && reservationQuery.isError
  const stage =
    isPreorderView && !loadError
      ? (reservation?.displayStatus ?? 'PROCESSING')
      : undefined
  const stageContent = loadError ? loadFailed : stage && preorderStage[stage]
  const { tone, badge, heading, description, primary, secondary, note } = {
    ...content[status],
    ...stageContent,
  }
  const isRegisterDelayed = useDeadline(
    reservation?.status === 'PENDING_SYNC',
    REGISTER_DELAYED_MS,
    reservation && Date.parse(reservation.createdAt),
  ).passed
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
        {
          label: '예상 배송일',
          value:
            status === 'preorder-paid'
              ? '출시일 이후 순차 발송'
              : '결제 확인 후 순차 발송',
        },
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
  // 사전예약 결제가 실패했으면 장바구니 대신 사전예약 내역으로 보낸다.
  const secondaryAction =
    status === 'failed' && preorderId
      ? { label: '사전예약 내역 보기', to: mypagePath('preorder-check') }
      : secondary
  const primaryDisabled =
    loadError || (stage !== undefined && !PURCHASABLE.includes(stage))

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

        {/* 처리·승인을 기다리며 다시 묻는 중에 실패하고 있으면 알린다. 승인은 70초가 지나면 멈춘다. */}
        <PollingNotice query={reservationQuery} />
        {isRegisterDelayed && (
          <InlineAlert status="warning">
            등록이 평소보다 오래 걸리고 있어요. 예약 순서는 그대로이고, 등록이
            끝나면 사전예약 내역에도 표시돼요.
          </InlineAlert>
        )}
        <PollingNotice
          query={orderQuery}
          timeout={
            orderQuery.timedOut
              ? {
                  title:
                    '결제 결과를 확인하지 못했어요. 주문 내역에서 확인해 주세요.',
                  description: '다시 결제하지 마세요.',
                  onRecheck: orderQuery.recheck,
                }
              : null
          }
        />

        {status === 'preorder' && dueAt && <PurchaseDeadline dueAt={dueAt} />}
        {status === 'preorder' && reservation && (
          <PurchaseSteps reservation={reservation} />
        )}

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
                    value: shortId(order.orderId),
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
            onClick={() => navigate(secondaryAction.to)}
          >
            {secondaryAction.label}
          </ActionButton>
          <ActionButton
            disabled={primaryDisabled}
            onClick={() => navigate(primaryTo)}
          >
            {primaryDisabled
              ? (stageContent?.disabledLabel ?? '예약 처리 중이에요')
              : primary.label}
          </ActionButton>
        </div>

        {note && <div className={styles.note}>{note}</div>}
      </div>
    </div>
  )
}
