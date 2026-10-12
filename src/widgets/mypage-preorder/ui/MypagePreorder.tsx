import { useMemo, useState } from 'react'

import { useNavigate } from 'react-router'

import { HistoryCard } from '@entities/order'
import {
  reservationStatusTag,
  useCancelReservation,
  useMyReservations,
  type Reservation,
  type ReservationDisplayStatus,
} from '@entities/preorder'
import {
  ProductPaymentCard,
  type ProductPaymentCardItem,
} from '@entities/product'
import { getErrorMessage } from '@shared/api/client'
import { paymentPath } from '@shared/config/routes'
import { formatDotDate } from '@shared/lib/formatDotDate'
import { formatWon } from '@shared/lib/formatNumber'
import { showToast } from '@shared/model/toastStore'
import {
  ActionButton,
  Button,
  ConfirmDialog,
  Modal,
  SelectButton,
  Tag,
} from '@shared/ui'

import * as styles from './MypagePreorder.css'

// 화면 단계별 묶음 — 결제(구매 확정)가 필요한 것, 진행 중인 것, 끝난 것.
const NEEDS_PAYMENT: ReservationDisplayStatus[] = [
  'PAYABLE',
  'PAYMENT_IN_PROGRESS',
]
const IN_PROGRESS: ReservationDisplayStatus[] = [
  'RECEIVED',
  'PROCESSING',
  'RESERVED',
  'CANCELING',
]
// 취소는 접수·결제 대기·예약 확정일 때 할 수 있다(배송 시작 여부는 취소할 때 서버가 확인한다).
const CANCELABLE: Reservation['status'][] = [
  'PENDING_SYNC',
  'REGISTERED',
  'RESERVED',
]

const STEP_LABELS = ['예약 접수', '구매 확정', '발송'] as const

// 'YYYY-MM-DD'를 시간대 변환 없이 'M.D'로 자른다.
const monthDay = (date: string) => {
  const [, month, day] = date.split('-').map(Number)
  return `${month}.${day}`
}

const toItem = (reservation: Reservation): ProductPaymentCardItem => ({
  productId: reservation.productId,
  name: reservation.productTitle,
  modelNumber: '',
  optionSummary: reservation.optionTitle,
  quantityLabel: '수량 1개',
  priceLabel: formatWon(reservation.unitPrice),
})

const renderItem = (product: ProductPaymentCardItem) => (
  <ProductPaymentCard product={product} />
)

const openAlerts = [
  {
    id: 1,
    title: '아이폰 18 Pro, Pro Max',
    opensAt: '10.10 (금) 오전 10:00',
    dDay: 'D-3',
  },
  {
    id: 2,
    title: '아이폰 Duo',
    opensAt: '10.21 (화) 오전 10:00',
    dDay: 'D-14',
  },
  {
    id: 3,
    title: '애플 비전 프로 2',
    opensAt: '11.04 (화) 오전 10:00',
    dDay: 'D-28',
  },
]

// D-day 태그 폭을 가장 긴 값에 맞춰 제목 줄이 세로로 가지런하다.
const alertDDays = openAlerts.map((alert) => alert.dDay)

export function MypagePreorder() {
  const navigate = useNavigate()
  const { data, isPending, isError, error } = useMyReservations()
  const cancel = useCancelReservation()
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null)
  // ponytail: 알림 신청 API가 없어 화면 안에서만 켜고 끈다.
  const [alertOffIds, setAlertOffIds] = useState<Set<number>>(new Set())

  const reservations = useMemo(() => data?.items ?? [], [data])
  // 결제 기한 카운트다운 — 렌더마다 새 Date를 넘기면 useCountdown 타이머가 계속 새로 걸려 응답이 바뀔 때만 만든다.
  const dueDates = useMemo(
    () =>
      new Map(
        reservations.map(({ preorderId, paymentDueAt }) => [
          preorderId,
          paymentDueAt ? new Date(paymentDueAt) : undefined,
        ]),
      ),
    [reservations],
  )
  const needsPayment = reservations.filter(({ displayStatus }) =>
    NEEDS_PAYMENT.includes(displayStatus),
  )
  const inProgress = reservations.filter(({ displayStatus }) =>
    IN_PROGRESS.includes(displayStatus),
  )
  const ended = reservations.filter(
    ({ displayStatus }) =>
      !NEEDS_PAYMENT.includes(displayStatus) &&
      !IN_PROGRESS.includes(displayStatus),
  )

  const toggleAlert = (id: number) =>
    setAlertOffIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // 취소는 비동기로 끝난다 — 응답은 보통 '취소 중'이고, 목록을 다시 받아 상태를 맞춘다.
  const confirmCancel = () => {
    if (!cancelTarget) return
    cancel.mutate(
      { preorderId: cancelTarget.preorderId },
      {
        onSuccess: () => showToast('예약 취소를 요청했어요.'),
        onError: (caught) =>
          showToast(getErrorMessage(caught, '예약을 취소하지 못했어요.')),
      },
    )
    setCancelTarget(null)
  }

  const cancelButton = (reservation: Reservation) =>
    CANCELABLE.includes(reservation.status) && (
      <Button
        variant="subtle"
        color="cancel"
        disabled={cancel.isPending}
        onClick={() => setCancelTarget(reservation)}
      >
        예약 취소
      </Button>
    )

  const card = (reservation: Reservation, highlight = false) => (
    <HistoryCard
      key={reservation.preorderId}
      tag={reservationStatusTag[reservation.displayStatus]}
      highlight={highlight}
      preorder
      orderDate={formatDotDate(reservation.createdAt)}
      orderNumber={`${reservation.queuePosition.toLocaleString()}번`}
      numberLabel="예약 순번"
      purchaseDueAt={
        highlight ? dueDates.get(reservation.preorderId) : undefined
      }
      items={[toItem(reservation)]}
      renderItem={renderItem}
      footer={
        highlight ? (
          <div className={styles.actions}>
            {cancelButton(reservation)}
            <ActionButton
              size="md"
              onClick={() => navigate(paymentPath(reservation.preorderId))}
            >
              구매 확정하기
            </ActionButton>
          </div>
        ) : (
          cancelButton(reservation) || undefined
        )
      }
    >
      {!highlight && (
        <>
          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt className={styles.factLabel}>배송 차수</dt>
              <dd className={styles.factValue}>
                {reservation.shipmentBatch.batchNumber}차
              </dd>
            </div>
            <div className={styles.fact}>
              <dt className={styles.factLabel}>발송 예정</dt>
              <dd className={styles.factValue}>
                {monthDay(reservation.shipmentBatch.estimatedShipStart)}~
                {monthDay(reservation.shipmentBatch.estimatedShipEnd)}
              </dd>
            </div>
          </dl>
          {/* 예약 확정(결제 완료)이면 두 단계까지 끝났다. */}
          <ol className={styles.steps}>
            {STEP_LABELS.map((label, index) => {
              const done =
                index === 0 ||
                (index === 1 && reservation.status === 'RESERVED')
              return (
                <li key={label} className={styles.step}>
                  <div className={styles.bar[done ? 'done' : 'todo']} />
                  <span className={styles.stepLabel[done ? 'done' : 'todo']}>
                    {label}
                  </span>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </HistoryCard>
  )

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>예약 내역</h1>

      {isError && (
        <div className={styles.sectionTitle}>
          {getErrorMessage(error, '예약 내역을 불러오지 못했어요.')}
        </div>
      )}
      {isPending && (
        <div className={styles.sectionTitle}>
          예약 내역을 불러오는 중이에요.
        </div>
      )}

      {needsPayment.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>구매 확정이 필요해요</h2>
          {needsPayment.map((reservation) => card(reservation, true))}
        </section>
      )}

      {data && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            진행 중인 예약{' '}
            <span className={styles.count}>{inProgress.length}</span>
          </h2>
          {inProgress.map((reservation) => card(reservation))}
        </section>
      )}

      {ended.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            지난 예약 <span className={styles.count}>{ended.length}</span>
          </h2>
          {ended.map((reservation) => card(reservation))}
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>알림 신청한 사전예약</h2>
        <ul className={styles.alerts}>
          {openAlerts.map((alert) => {
            const on = !alertOffIds.has(alert.id)
            return (
              <li key={alert.id} className={styles.alert}>
                <Tag
                  color="primary"
                  variant="subtle"
                  size="medium"
                  rounded={false}
                  widthOptions={alertDDays}
                >
                  {alert.dDay}
                </Tag>
                <div className={styles.alertTexts}>
                  <span className={styles.alertTitle}>{alert.title}</span>
                  <span className={styles.alertDate}>{alert.opensAt} 오픈</span>
                </div>
                <SelectButton
                  className={styles.alertToggle}
                  selected={on}
                  onClick={() => toggleAlert(alert.id)}
                >
                  {on ? '알림 받는 중' : '알림 받기'}
                </SelectButton>
              </li>
            )
          })}
        </ul>
      </section>

      {/* 어두운 페이지 안에서 띄워야 다이얼로그도 어둡다(전역 모달은 밝게 뜬다). */}
      <Modal open={cancelTarget !== null} onClose={() => setCancelTarget(null)}>
        <ConfirmDialog
          title="예약을 취소할까요?"
          description={
            cancelTarget
              ? `${cancelTarget.productTitle} · ${cancelTarget.optionTitle}\n취소하면 순번이 사라지고, 다시 신청하려면 대기열부터 다시 서야 해요.`
              : undefined
          }
          confirmLabel="예약 취소"
          cancelLabel="닫기"
          onConfirm={confirmCancel}
          onCancel={() => setCancelTarget(null)}
        />
      </Modal>
    </div>
  )
}
