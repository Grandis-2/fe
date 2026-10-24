import { useMemo, useState } from 'react'

import { Bell, CalendarClock, History } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

import { HistoryCard, HistoryListSkeleton } from '@entities/order'
import {
  NEEDS_PURCHASE,
  OpenAlertToggle,
  reservationStatusTag,
  useCancelReservation,
  useMyOpenAlerts,
  useMyReservations,
  useReservationCounts,
  useToggleOpenAlert,
  type Reservation,
  type ReservationDisplayStatus,
} from '@entities/preorder'
import {
  ProductPaymentCard,
  type ProductPaymentCardItem,
} from '@entities/product'
import { getErrorMessage } from '@shared/api/client'
import { paymentPath } from '@shared/config/routes'
import { formatDotDateMinute } from '@shared/lib/formatDotDate'
import { formatWon } from '@shared/lib/formatNumber'
import { toggleInSet } from '@shared/lib/toggleInSet'
import { useEndReached } from '@shared/lib/useEndReached'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import {
  ActionButton,
  Button,
  Chip,
  InlineAlert,
  Skeleton,
  SkeletonGroup,
  Tag,
} from '@shared/ui'

import * as styles from './MypagePreorder.css'

// 화면 단계별 묶음 — 결제(구매 확정)가 필요한 것(NEEDS_PURCHASE), 진행 중인 것, 끝난 것. 서버가 이 단계로 거른다.
const IN_PROGRESS: ReservationDisplayStatus[] = [
  'RECEIVED',
  'PROCESSING',
  'RESERVED',
  'CANCELING',
]
const ENDED: ReservationDisplayStatus[] = ['PAYMENT_EXPIRED', 'CANCELED']
// 취소는 접수·결제 대기·예약 확정일 때 할 수 있다(배송 시작 여부는 취소할 때 서버가 확인한다).
const CANCELABLE: Reservation['status'][] = [
  'PENDING_SYNC',
  'REGISTERED',
  'RESERVED',
]

const STEP_LABELS = ['예약 접수', '구매 확정', '발송'] as const

// 목록을 한 번에 하나만 보인다. 고른 탭은 URL(?view=)에 남는다 — ?state=는 마이페이지 메뉴가 쓴다.
const VIEWS = [
  { value: 'progress', label: '진행 중' },
  { value: 'ended', label: '지난 예약' },
  { value: 'alerts', label: '알림 신청' },
] as const
type View = (typeof VIEWS)[number]['value']

// 'YYYY-MM-DD'를 시간대 변환 없이 'M.D'로 자른다.
const monthDay = (date: string) => {
  const [, month, day] = date.split('-').map(Number)
  return `${month}.${day}`
}

const toItem = (reservation: Reservation): ProductPaymentCardItem => ({
  imageSrc: reservation.imageUrl ?? undefined,
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

const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = '일월화수목금토'
const pad = (value: number) => String(value).padStart(2, '0')
const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

// 오픈일까지 남은 날(로컬 날짜 기준). 오늘 오픈이면 D-Day. 서머타임으로 하루가 23·25시간인 날이 있어 반올림한다.
const dDayOf = (opensAt: Date) => {
  const days = Math.round(
    (startOfDay(opensAt) - startOfDay(new Date())) / DAY_MS,
  )
  return days > 0 ? `D-${days}` : 'D-Day'
}

// '10.21 (화) 오전 10:00'
const formatOpensAt = (opensAt: Date) => {
  const hour = opensAt.getHours()
  return `${pad(opensAt.getMonth() + 1)}.${pad(opensAt.getDate())} (${WEEKDAYS[opensAt.getDay()]}) ${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${pad(opensAt.getMinutes())}`
}

export function MypagePreorder() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const view: View =
    VIEWS.find(({ value }) => value === searchParams.get('view'))?.value ??
    'progress'
  const selectView = (next: View) =>
    setSearchParams(
      (prev) => {
        prev.set('view', next)
        return prev
      },
      // 탭을 오갈 때마다 기록이 쌓이면 뒤로 가기로 페이지를 못 벗어난다.
      { replace: true },
    )
  // 구매 확정 묶음은 탭과 따로 늘 받는다(20건이 넘으면 '더 보기'). 탭 목록은 고른 탭의 단계만 받는다(알림 신청 탭에선 진행 중을 둔다).
  const payable = useMyReservations(NEEDS_PURCHASE)
  const list = useMyReservations(view === 'ended' ? ENDED : IN_PROGRESS)
  const { data: counts } = useReservationCounts()
  // 탭 목록 끝이 화면 가까이(400px) 오면 다음 쪽을 받는다. 다음 쪽이 실패하면 멈추고 버튼으로 다시 받는다.
  // 탭을 바꾼 직후엔 앞 탭의 쪽 정보가 남아 있어(isPlaceholderData) 새 첫 쪽이 올 때까지 기다린다.
  const endRef = useEndReached<HTMLDivElement>(
    view !== 'alerts' &&
      !list.isPlaceholderData &&
      list.hasNextPage &&
      !list.isFetchingNextPage &&
      !list.isFetchNextPageError,
    () => void list.fetchNextPage(),
    '400px',
  )
  const cancel = useCancelReservation()
  const openAlerts = useMyOpenAlerts()
  const toggleOpenAlert = useToggleOpenAlert()
  // 목록은 신청한 것만 오므로 끈 알림은 여기서 기억한다 — 다시 켤 수 있게 목록엔 남긴다.
  const [alertOffIds, setAlertOffIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const alertRows = useMemo(
    () =>
      (openAlerts.data ?? []).map((alert) => {
        const opensAt = new Date(alert.opensAt)
        return {
          ...alert,
          dDay: dDayOf(opensAt),
          opensAtLabel: formatOpensAt(opensAt),
        }
      }),
    [openAlerts.data],
  )

  // 모달에서 취소를 누른 예약과 그때의 version — 목록이 '취소 처리 중'으로 다시 오기 전에도 구매 확정을 막는다.
  // 서버가 그 예약을 새 상태로 알려 주면(version이 바뀌면) 막지 않고 서버 상태를 따른다 — 취소가 나중에
  // 거절돼 결제 가능으로 돌아와도 다시 누를 수 있다. 요청 자체가 실패하면 바로 뺀다.
  const [cancelingVersions, setCancelingVersions] = useState<
    ReadonlyMap<string, number>
  >(() => new Map())
  // 요청이 끝나기 전엔 version이 바뀌어도(외부 등록 등) 계속 막는다 — 곧 취소 중이 될 예약이다.
  const isCanceling = ({ preorderId, version }: Reservation) =>
    (cancel.isPending && cancel.variables?.preorderId === preorderId) ||
    cancelingVersions.get(preorderId) === version
  const setCanceling = ({ preorderId, version }: Reservation, on: boolean) =>
    setCancelingVersions((prev) => {
      const next = new Map(prev)
      if (on) next.set(preorderId, version)
      else next.delete(preorderId)
      return next
    })

  const needsPayment = useMemo(
    () => payable.data?.pages.flatMap(({ items }) => items) ?? [],
    [payable.data],
  )
  // 결제 기한 카운트다운 — 렌더마다 새 Date를 넘기면 useCountdown 타이머가 계속 새로 걸려 응답이 바뀔 때만 만든다.
  const dueDates = useMemo(
    () =>
      new Map(
        needsPayment.map(({ preorderId, paymentDueAt }) => [
          preorderId,
          paymentDueAt ? new Date(paymentDueAt) : undefined,
        ]),
      ),
    [needsPayment],
  )
  // 탭을 바꿔 받는 동안엔 앞 탭의 목록을 보이지 않는다.
  const rows = list.isPlaceholderData
    ? undefined
    : list.data?.pages.flatMap(({ items }) => items)

  // 탭 옆 건수 — 서버 counts(전체 기준)에서 묶음의 단계 수를 더한다. 받기 전엔 비운다.
  // 끈 알림도 다시 켤 수 있게 목록엔 남기고, 건수는 켜진 것만 센다.
  const sumOf = (stages: ReservationDisplayStatus[]) =>
    counts && stages.reduce((sum, stage) => sum + counts[stage], 0)
  const countOf: Record<View, number | undefined> = {
    progress: sumOf(IN_PROGRESS),
    ended: sumOf(ENDED),
    alerts:
      openAlerts.data &&
      alertRows.filter((alert) => !alertOffIds.has(alert.productId)).length,
  }

  // 토글이라 먼저 바꿔 보이고, 실패하면 되돌린다.
  const toggleAlert = (productId: string) => {
    const subscribed = alertOffIds.has(productId)
    setAlertOffIds((prev) => toggleInSet(prev, [productId], !subscribed))
    toggleOpenAlert.mutate(
      { productId, subscribed },
      {
        onError: (caught) => {
          setAlertOffIds((prev) => toggleInSet(prev, [productId], subscribed))
          showToast(getErrorMessage(caught, '오픈 알림을 바꾸지 못했어요.'))
        },
      },
    )
  }

  // 취소는 비동기로 끝난다 — 응답은 보통 '취소 중'이고, 목록을 다시 받아 상태를 맞춘다.
  const confirmCancel = (reservation: Reservation) =>
    openModal({
      title: '예약을 취소할까요?',
      // 결제한 예약은 환불을 마쳐야 취소가 끝난다.
      description: `${reservation.productTitle} · ${reservation.optionTitle}\n취소하면 순번이 사라지고, 다시 신청하려면 대기열부터 다시 서야 해요.${reservation.status === 'RESERVED' ? '\n결제한 금액은 환불되고, 환불이 끝나면 취소가 완료돼요.' : ''}`,
      confirmLabel: '예약 취소',
      cancelLabel: '닫기',
      onConfirm: () => {
        closeModal()
        const { preorderId } = reservation
        setCanceling(reservation, true)
        cancel.mutate(
          { preorderId },
          {
            onSuccess: () => showToast('예약 취소를 요청했어요.'),
            onError: (caught) => {
              setCanceling(reservation, false)
              showToast(getErrorMessage(caught, '예약을 취소하지 못했어요.'))
            },
          },
        )
      },
    })

  const cancelButton = (reservation: Reservation) =>
    CANCELABLE.includes(reservation.status) && (
      <Button
        variant="subtle"
        color="cancel"
        disabled={cancel.isPending || isCanceling(reservation)}
        onClick={() => confirmCancel(reservation)}
      >
        예약 취소
      </Button>
    )

  const card = (reservation: Reservation, highlight = false) => (
    <HistoryCard
      key={reservation.preorderId}
      tag={reservationStatusTag[reservation.displayStatus]}
      highlight={highlight ? 'payment' : undefined}
      preorder
      orderDate={formatDotDateMinute(reservation.createdAt)}
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
              variant="preorder"
              size="md"
              disabled={isCanceling(reservation)}
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
      <h1 className={styles.title}>사전예약 내역</h1>

      {/* 결제 기한이 있어 놓치면 예약이 취소된다 — 어느 탭을 보고 있어도 위에 둔다. 못 받았으면 없는 것과 구분해 알린다. */}
      {!payable.data && payable.isError ? (
        <InlineAlert status="error">
          {getErrorMessage(
            payable.error,
            '구매 확정할 예약을 불러오지 못했어요.',
          )}
        </InlineAlert>
      ) : (
        needsPayment.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>구매 확정이 필요해요</h2>
            {needsPayment.map((reservation) => card(reservation, true))}
            {payable.isFetchNextPageError && (
              <InlineAlert status="error">
                구매 확정할 예약을 더 불러오지 못했어요.
              </InlineAlert>
            )}
            {payable.hasNextPage && (
              <Button
                variant="outline"
                disabled={payable.isFetchingNextPage}
                onClick={() => void payable.fetchNextPage()}
              >
                {payable.isFetchNextPageError ? '다시 불러오기' : '더 보기'}
              </Button>
            )}
          </section>
        )
      )}

      <div className={styles.section}>
        <div
          className={styles.tabs}
          role="group"
          aria-label="사전예약 내역 보기"
        >
          {VIEWS.map(({ value, label }) => (
            <Chip
              key={value}
              selected={value === view}
              count={countOf[value]}
              onClick={() => selectView(value)}
            >
              {label}
            </Chip>
          ))}
        </div>

        {view === 'alerts' ? (
          <>
            {openAlerts.isError && (
              <InlineAlert status="error">
                {getErrorMessage(
                  openAlerts.error,
                  '알림 신청 내역을 불러오지 못했어요.',
                )}
              </InlineAlert>
            )}
            {openAlerts.isPending && (
              <SkeletonGroup className={styles.alerts}>
                {[0, 1].map((key) => (
                  <div key={key} className={styles.alert}>
                    <Skeleton height={40} />
                  </div>
                ))}
              </SkeletonGroup>
            )}
            {openAlerts.data?.length === 0 && (
              <InlineAlert status="info" variant="big" icon={Bell}>
                알림 신청한 사전예약이 없어요
              </InlineAlert>
            )}
            {alertRows.length > 0 && (
              <ul className={styles.alerts}>
                {alertRows.map((alert) => {
                  const on = !alertOffIds.has(alert.productId)
                  return (
                    <li key={alert.productId} className={styles.alert}>
                      {/* D-day 태그 폭을 가장 긴 값에 맞춰 제목 줄이 세로로 가지런하다. */}
                      <Tag
                        color="primary"
                        variant="subtle"
                        size="medium"
                        rounded={false}
                        widthOptions={alertRows.map(({ dDay }) => dDay)}
                      >
                        {alert.dDay}
                      </Tag>
                      <div className={styles.alertTexts}>
                        <span className={styles.alertTitle}>{alert.title}</span>
                        <span className={styles.alertDate}>
                          {alert.opensAtLabel} 오픈
                        </span>
                      </div>
                      <OpenAlertToggle
                        subscribed={on}
                        name={alert.title}
                        onToggle={() => toggleAlert(alert.productId)}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        ) : !rows ? (
          // 받은 목록이 있으면 다시 받다 실패해도 그대로 보인다 — 실패 문구는 처음 받기부터 실패했을 때만.
          list.isError ? (
            <InlineAlert status="error">
              {getErrorMessage(
                list.error,
                '사전예약 내역을 불러오지 못했어요.',
              )}
            </InlineAlert>
          ) : (
            <HistoryListSkeleton />
          )
        ) : rows.length === 0 ? (
          view === 'progress' ? (
            <InlineAlert status="info" variant="big" icon={CalendarClock}>
              진행 중인 예약이 없어요
            </InlineAlert>
          ) : (
            <InlineAlert status="info" variant="big" icon={History}>
              지난 예약이 없어요
            </InlineAlert>
          )
        ) : (
          <>
            {rows.map((reservation) => card(reservation))}
            {list.isFetchingNextPage && <HistoryListSkeleton count={1} />}
            {list.isFetchNextPageError && (
              <div className={styles.retry}>
                <InlineAlert status="error">
                  사전예약 내역을 더 불러오지 못했어요.
                </InlineAlert>
                <Button
                  variant="outline"
                  onClick={() => void list.fetchNextPage()}
                >
                  다시 불러오기
                </Button>
              </div>
            )}
          </>
        )}
        <div ref={endRef} aria-hidden="true" />
      </div>
    </div>
  )
}
