import { useState } from 'react'

import { useNavigate } from 'react-router'

import { useAdminProducts } from '@entities/admin-product'
import {
  countByStage,
  isReprocessable,
  paymentDueLabel,
  paymentStateColor,
  paymentStateLabel,
  paymentStateLabels,
  paymentStateOf,
  paymentStateVariant,
  reservationNo,
  reservationStageLabel,
  reservationStages,
  reservationStateColor,
  reservationStateLabel,
  reservationStateLabels,
  reservationStateOf,
  useAdminMembers,
  useAdminReservations,
  useReprocessReservation,
  useReservationStats,
  type AdminReservation,
  type ReservationState,
} from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import {
  DEFAULT_REFRESH_INTERVAL,
  refreshIntervalOptions,
  type RefreshInterval,
} from '@shared/config/refreshInterval'
import { adminReservationPath } from '@shared/config/routes'
import { closeModal, openModal } from '@shared/model/modalStore'
import {
  Button,
  Dropdown,
  InlineAlert,
  Input,
  RefreshStatus,
  SegmentedTabs,
  StatCard,
  Table,
  Tag,
} from '@shared/ui'
import type { DropdownOption, TableColumn } from '@shared/ui'

import * as styles from './AdminReservationsPage.css'

const ALL_PRODUCTS = '전체 상품'

const statusFilters = [
  { value: 'all', label: '전체' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'PROCESSING', label: '처리 중' },
  { value: 'REPROCESS_NEEDED', label: '외부 등록 실패' },
  { value: 'CANCELED', label: '취소' },
] as const

// 한 번에 받는 최근 예약 수(서버 상한). 표·탭·검색은 이 안에서 한다.
const LIST_SIZE = 100

type StatusFilter = (typeof statusFilters)[number]['value']

/** 탭이 거르는 상태. 취소 탭은 곧 취소될 취소 중까지 함께 보여준다 */
const matchesFilter = (state: ReservationState, filter: StatusFilter) =>
  filter === 'all' ||
  state === filter ||
  (filter === 'CANCELED' && state === 'CANCELING')

/**
 * 예약 접수 현황. 10초마다 자동 갱신하고, 외부 등록이 끝내 실패한 예약은 재처리를
 * 걸 수 있다. 카드는 집계 API로 전체를 세고, 표는 최근 예약을 보여준다.
 */
export function AdminReservationsPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [keyword, setKeyword] = useState('')
  // 상품명은 겹칠 수 있어 이름이 아니라 productId로 고른다.
  const [productId, setProductId] = useState<string>()
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(
    DEFAULT_REFRESH_INTERVAL,
  )

  const { data: products = [] } = useAdminProducts({
    saleMode: 'PREORDER',
    size: 100,
  })

  // 값이 undefined인 첫 항목이 '전체 상품' — 서버에 productId를 안 보낸다.
  const productOptions: DropdownOption<string | undefined>[] = [
    { label: ALL_PRODUCTS, value: undefined },
    ...products.map((product) => ({
      label: product.name,
      value: product.productId,
    })),
  ]

  // 탭은 화면이 거른다 — 서버 상태값 하나로는 '확정'(결제 대기 + 결제 완료)을 못 고른다.
  // shortcut: 최근 100건만 받는다. 넘으면 표 위에 알리고, 더 보려면 서버 페이지로 바꾼다.
  const {
    data: page,
    isPending,
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useAdminReservations({ productId, size: LIST_SIZE }, refreshInterval)
  const reservations = page?.items
  // 아직 한 번도 못 받았으면 data가 undefined — 카드가 0건이 아니라 '조회 실패'로 보여야 한다.
  const stats = useReservationStats(productId, refreshInterval)

  const reprocess = useReprocessReservation()

  // 회원 이름은 예약 응답에 없어서 보이는 회원 id만 모아 이름으로 바꾼다.
  const { data: members = [] } = useAdminMembers(
    (reservations ?? []).map((reservation) => reservation.customerId),
  )
  const memberName = (memberId: string) =>
    members.find((member) => member.memberId === memberId)?.name ?? '—'

  const openDetail = (reservation: AdminReservation) =>
    navigate(adminReservationPath(reservation.preorderId))

  const refresh = () => {
    void refetch()
    void stats.refetch()
  }

  // 되돌릴 수 없는 조치라서 한 번 더 묻는다. 끝나면 목록을 다시 받아 표를 갱신한다.
  const confirmReprocess = (reservation: AdminReservation) =>
    openModal({
      theme: 'light',
      title: '재처리를 시도할까요?',
      description: `${reservationNo(reservation.preorderId)} · ${reservation.productTitle}의 외부 등록을 다시 시도합니다.`,
      confirmLabel: '재처리',
      onConfirm: () => {
        closeModal()
        // 지난 실패 문구가 남아 있으면 이번 시도의 결과처럼 보인다.
        reprocess.reset()
        reprocess.mutate(reservation.preorderId)
      },
    })

  // 예약번호로 거르는 쿼리 파라미터가 명세에 없어 받아온 목록에서 직접 찾는다.
  const trimmedKeyword = keyword.trim().toUpperCase()
  const visibleReservations = (reservations ?? [])
    .filter((reservation) =>
      matchesFilter(reservationStateOf(reservation), statusFilter),
    )
    .filter(
      (reservation) =>
        !trimmedKeyword ||
        reservationNo(reservation.preorderId).includes(trimmedKeyword),
    )

  const stageCounts = stats.data && countByStage(stats.data)

  // 카드는 탭과 같은 칸이다 — 카드 숫자가 그 탭을 눌렀을 때의 건수다(표는 최근 100건).
  // 마지막 '상태 반영 실패'만 탭이 없다 — 예약 상태가 아니라 서버 안에서 멈춘 처리(이벤트
  // DLQ) 수라서, 해당 예약 상세의 '상태 반영 실패'에서 다시 처리한다.
  const cards = [
    ...reservationStages.map((stage) => ({
      label: reservationStageLabel[stage],
      value: stageCounts?.[stage],
    })),
    { label: '상태 반영 실패', value: stats.data?.deadLetters.waiting },
  ]

  const columns: TableColumn<AdminReservation>[] = [
    {
      key: 'no',
      header: '예약 번호',
      align: 'center',
      render: (reservation) => (
        <span className={styles.reservationNo}>
          {reservationNo(reservation.preorderId)}
        </span>
      ),
    },
    {
      key: 'product',
      header: '모델',
      align: 'center',
      render: (reservation) => reservation.productTitle,
    },
    {
      key: 'option',
      header: '옵션',
      align: 'center',
      render: (reservation) => reservation.optionTitle,
    },
    {
      key: 'member',
      header: '예약자',
      align: 'center',
      render: (reservation) => memberName(reservation.customerId),
    },
    {
      key: 'seq',
      header: '순번',
      align: 'center',
      render: (reservation) =>
        reservation.queuePosition.toLocaleString('ko-KR'),
    },
    {
      key: 'batch',
      header: '배송 차수',
      align: 'center',
      render: (reservation) => `${reservation.shipmentBatch.batchNumber}차`,
    },
    {
      key: 'status',
      header: '상태',
      align: 'center',
      render: (reservation) => {
        const state = reservationStateOf(reservation)
        return (
          <Tag
            variant="subtle"
            size="medium"
            rounded={false}
            widthOptions={reservationStateLabels}
            color={reservationStateColor[state]}
          >
            {reservationStateLabel[state]}
          </Tag>
        )
      },
    },
    {
      key: 'payment',
      header: '결제',
      align: 'center',
      render: (reservation) => {
        const payment = paymentStateOf(reservation)
        if (!payment) return <span className={styles.subText}>—</span>

        // 결제 대기만 남은 시간을 보여준다 — 24시간을 넘기면 예약이 자동취소된다.
        const due =
          payment === 'PENDING'
            ? paymentDueLabel(reservation.paymentDueAt)
            : null

        return (
          <span className={styles.stackedCell}>
            {/* 상태 열이 의미별 색을 쓰므로 결제는 브랜드 색 + 변형으로 구분한다. */}
            <Tag
              variant={paymentStateVariant[payment]}
              size="medium"
              rounded={false}
              widthOptions={paymentStateLabels}
              color={paymentStateColor[payment]}
            >
              {paymentStateLabel[payment]}
            </Tag>
            {due && <span className={styles.dueText}>{due}</span>}
          </span>
        )
      },
    },
    {
      key: 'reprocess',
      header: '재처리',
      align: 'center',
      width: '120px',
      render: (reservation) =>
        isReprocessable(reservation) ? (
          <Button
            size="small"
            onClick={(event) => {
              // 행 전체가 상세로 가는 버튼이라, 재처리만 하고 머문다.
              event.stopPropagation()
              confirmReprocess(reservation)
            }}
          >
            재처리
          </Button>
        ) : (
          <span className={styles.subText}>—</span>
        ),
    },
  ]

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>예약 현황</div>
        <Dropdown
          label="현재 선택된 상품"
          size="medium"
          width="200px"
          options={productOptions}
          value={productId}
          onSelect={setProductId}
        />
      </div>

      <RefreshStatus updatedAt={dataUpdatedAt} onRefresh={refresh}>
        <Dropdown
          label="자동 갱신 간격"
          size="small"
          width="140px"
          options={refreshIntervalOptions}
          value={refreshInterval}
          // 고르는 즉시 한 번 받는다 — 새 간격을 기다리지 않고 지금 값을 보여준다.
          onSelect={(next) => {
            setRefreshInterval(next)
            refresh()
          }}
        />
      </RefreshStatus>

      {/* 폴링이 실패해도 이미 받은 데이터는 남아 카드와 표에 그대로 보인다 —
          멈춘 숫자를 최신으로 읽으면 '실패를 0건으로 보여주기'와 똑같이 위험하다.
          그래서 숫자보다 먼저 읽히는 자리에 둔다. */}
      {((isError && reservations !== undefined) ||
        (stats.isError && stats.data !== undefined)) && (
        <InlineAlert status="warning">
          {getErrorMessage(
            error ?? stats.error,
            '예약을 다시 불러오지 못했습니다.',
          )}{' '}
          아래 숫자와 목록은 마지막으로 받은 값입니다.
        </InlineAlert>
      )}

      <div className={styles.cards}>
        {cards.map(({ label, value }) => {
          // 셋을 구분해야 한다 — 0건, 아직 못 받음, 조회 실패. 실패를 0건으로 보여주면
          // 운영 판단이 정반대가 되고, 로딩을 실패로 보여주면 멀쩡한데 놀라게 한다.
          const unknown = value === undefined
          return (
            <StatCard
              key={label}
              label={label}
              muted={unknown}
              value={
                value !== undefined
                  ? `${value.toLocaleString('ko-KR')}건`
                  : stats.isPending
                    ? '불러오는 중'
                    : '조회 실패'
              }
            />
          )
        })}
      </div>

      {reprocess.isError && (
        <InlineAlert status="error">
          {getErrorMessage(reprocess.error, '재처리에 실패했습니다.')}
        </InlineAlert>
      )}

      <div className={styles.toolbar}>
        <SegmentedTabs
          items={statusFilters}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Input
              label="예약번호 검색"
              size="small"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </div>
      </div>

      {page && page.total > page.items.length && (
        <div className={styles.subText}>
          전체 {page.total.toLocaleString('ko-KR')}건 중 최근{' '}
          {page.items.length.toLocaleString('ko-KR')}건만 표시합니다.
        </div>
      )}

      <Table
        columns={columns}
        rows={visibleReservations}
        rowKey={(reservation) => reservation.preorderId}
        onRowClick={openDetail}
        rowAction={{
          label: (reservation) =>
            `${reservationNo(reservation.preorderId)} 상세 보기`,
          onClick: openDetail,
        }}
        pageSize={10}
        loading={isPending}
        emptyMessage={
          isError
            ? getErrorMessage(error, '예약을 불러오지 못했습니다.')
            : '조건에 맞는 예약이 없습니다.'
        }
      />
    </div>
  )
}
