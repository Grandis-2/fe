import { useCallback, useEffect, useState } from 'react'

import { RefreshCw } from 'lucide-react'

import { getAdminProducts, type AdminProduct } from '@entities/admin-product'
import {
  countByStage,
  failureLabelOf,
  getAdminMembers,
  getAdminReservations,
  isReprocessable,
  paymentDueLabel,
  paymentStatusColor,
  paymentStatusLabel,
  paymentStatusLabels,
  reprocessAdminReservation,
  reservationNo,
  reservationStageLabel,
  reservationStages,
  reservationStatusColor,
  reservationStatusLabel,
  reservationStatusLabels,
  type AdminMemberModel,
  type AdminReservation,
  type AdminReservationStatus,
} from '@entities/admin-reservation'
import { useModalStore } from '@shared/model/modalStore'
import {
  Button,
  ConfirmDialog,
  Dropdown,
  Input,
  SegmentedTabs,
  StatCard,
  Table,
  Tag,
} from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './AdminReservationsPage.css'

const ALL_PRODUCTS = '전체 상품'
const REFRESH_INTERVAL_MS = 10_000

const statusFilters = [
  { value: 'all', label: '전체' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'ACCEPTED', label: '처리 중' },
  { value: 'FAILED', label: '재처리 필요' },
  { value: 'CANCELED', label: '취소' },
] as const

type StatusFilter = (typeof statusFilters)[number]['value']

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export function AdminReservationsPage() {
  const openModal = useModalStore((state) => state.open)
  const closeModal = useModalStore((state) => state.close)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [keyword, setKeyword] = useState('')
  const [productOpen, setProductOpen] = useState(false)
  // 상품명은 겹칠 수 있어 이름이 아니라 productId로 고른다.
  const [productId, setProductId] = useState<string>()

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [members, setMembers] = useState<AdminMemberModel[]>([])
  // 아직 한 번도 못 받았으면 undefined — 카드가 0건이 아니라 '조회 실패'로 보여야 한다.
  const [reservations, setReservations] = useState<AdminReservation[]>()
  const [refreshedAt, setRefreshedAt] = useState<Date>()
  const [error, setError] = useState<string>()

  // 회원 이름은 예약 응답에 없어서 따로 받아 memberId ↔ 이름을 이어준다.
  useEffect(() => {
    void Promise.all([getAdminProducts({ size: 100 }), getAdminMembers()])
      .then(([paged, memberList]) => {
        setProducts(paged.items)
        setMembers(memberList.items)
      })
      .catch((cause: Error) => setError(cause.message))
  }, [])

  const selectedProductName = products.find(
    (product) => product.productId === productId,
  )?.name

  const status: AdminReservationStatus | undefined =
    statusFilter === 'all' ? undefined : statusFilter

  // 카드와 표가 같은 목록에서 나와야 숫자가 어긋나지 않는다. 그래서 상태 탭으로
  // 서버에서 거르지 않고 상품 기준으로만 받아, 탭은 아래에서 화면이 거른다.
  // ponytail: 결제 상태별 건수를 주는 집계 API가 없어서 목록(최대 100건)으로 센다.
  // 100건을 넘으면 카드가 덜 세진다 — 집계 API가 생기면 카드는 그쪽으로 옮긴다.
  const load = useCallback(() => {
    getAdminReservations({ productId, size: 100 })
      .then((paged) => {
        setReservations(paged.items)
        setRefreshedAt(new Date())
        setError(undefined)
      })
      .catch((cause: Error) => setError(cause.message))
  }, [productId])

  // 접수는 계속 들어오므로 주기적으로 다시 받는다.
  useEffect(() => {
    load()
    const timer = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [load])

  const memberName = (memberId: string) =>
    members.find((member) => member.memberId === memberId)?.name ?? memberId

  // 되돌릴 수 없는 조치라서 한 번 더 묻는다. 끝나면 목록을 다시 받아 표를 갱신한다.
  const confirmReprocess = (reservation: AdminReservation) =>
    openModal(
      <ConfirmDialog
        title="재처리를 시도할까요?"
        description={`${reservationNo(reservation.reservationId)} · ${reservation.productName}의 외부 등록을 다시 시도합니다.`}
        confirmLabel="재처리"
        onCancel={closeModal}
        onConfirm={() => {
          closeModal()
          void reprocessAdminReservation(reservation.reservationId)
            .then(load)
            .catch((cause: Error) => setError(cause.message))
        }}
      />,
    )

  // 예약번호로 거르는 쿼리 파라미터가 명세에 없어 받아온 목록에서 직접 찾는다.
  const trimmedKeyword = keyword.trim().toUpperCase()
  const visibleReservations = (reservations ?? [])
    .filter((reservation) => !status || reservation.status === status)
    .filter(
      (reservation) =>
        !trimmedKeyword ||
        reservationNo(reservation.reservationId).includes(trimmedKeyword),
    )

  const stageCounts = reservations && countByStage(reservations)

  // 예약 한 건이 정확히 한 카드에만 들어간다 — 다섯 카드의 합이 전체 예약 수다.
  // 누적 '접수'는 이 단계들과 겹쳐서 헷갈리므로 카드로 두지 않는다.
  const cards = reservationStages.map((stage) => ({
    label: reservationStageLabel[stage],
    value: stageCounts?.[stage],
  }))

  const columns: TableColumn<AdminReservation>[] = [
    {
      key: 'no',
      header: '예약 번호',
      align: 'center',
      render: (reservation) => (
        <span className={styles.reservationNo}>
          {reservationNo(reservation.reservationId)}
        </span>
      ),
    },
    {
      key: 'product',
      header: '모델',
      align: 'center',
      render: (reservation) => reservation.productName,
    },
    {
      key: 'option',
      header: '옵션',
      align: 'center',
      render: (reservation) => reservation.optionName,
    },
    {
      key: 'member',
      header: '예약자',
      align: 'center',
      render: (reservation) => memberName(reservation.memberId),
    },
    {
      key: 'seq',
      header: '순번',
      align: 'center',
      render: (reservation) => reservation.acceptSeq.toLocaleString('ko-KR'),
    },
    {
      key: 'status',
      header: '상태',
      align: 'center',
      render: (reservation) => {
        const failure = failureLabelOf(reservation.failureCode)
        return (
          <span className={styles.stackedCell}>
            <Tag
              variant="subtle"
              size="medium"
              rounded={false}
              widthOptions={reservationStatusLabels}
              color={reservationStatusColor[reservation.status]}
            >
              {reservationStatusLabel[reservation.status]}
            </Tag>
            {failure && <span className={styles.subText}>{failure}</span>}
          </span>
        )
      },
    },
    {
      key: 'payment',
      header: '결제',
      align: 'center',
      render: (reservation) => {
        const { payment } = reservation
        if (!payment) return <span className={styles.subText}>—</span>

        // 결제 대기만 남은 시간을 보여준다 — 24시간을 넘기면 예약이 자동취소된다.
        const due =
          payment.status === 'PENDING' ? paymentDueLabel(payment) : null

        return (
          <span className={styles.stackedCell}>
            {/* 상태 열과 나란히 있어서 같은 모양이면 한 덩어리로 읽힌다 — 테두리형으로 구분한다. */}
            <Tag
              variant="outline"
              size="medium"
              rounded={false}
              widthOptions={paymentStatusLabels}
              color={paymentStatusColor[payment.status]}
            >
              {paymentStatusLabel[payment.status]}
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
          <span className={styles.stackedCell}>
            <Button size="small" onClick={() => confirmReprocess(reservation)}>
              재처리
            </Button>
            <span className={styles.attemptText}>
              시도 {reservation.registerAttemptCount}회
            </span>
          </span>
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
          options={[ALL_PRODUCTS, ...products.map((product) => product.name)]}
          open={productOpen}
          selectedOption={selectedProductName ?? ALL_PRODUCTS}
          onToggle={() => setProductOpen((prev) => !prev)}
          // 첫 항목이 '전체 상품'이라 상품 배열보다 하나씩 밀려 있다.
          onSelect={(_, index) => {
            setProductId(
              index === 0 ? undefined : products[index - 1].productId,
            )
            setProductOpen(false)
          }}
        />
      </div>

      <div className={styles.refreshRow}>
        <button type="button" className={styles.refreshButton} onClick={load}>
          <RefreshCw className={styles.refreshIcon} aria-hidden="true" />
          마지막 갱신 {refreshedAt ? timeFormatter.format(refreshedAt) : '—'}
        </button>
        <span>10초마다 자동 갱신</span>
      </div>

      <div className={styles.cards}>
        {cards.map(({ label, value }) => {
          // 조회에 실패했으면 0건으로 보여주지 않는다 — 운영 판단이 정반대다.
          const unknown = value === undefined
          return (
            <StatCard
              key={label}
              label={label}
              muted={unknown}
              value={
                unknown ? '조회 실패' : `${value.toLocaleString('ko-KR')}건`
              }
            />
          )
        })}
      </div>

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

      <Table
        columns={columns}
        rows={visibleReservations}
        rowKey={(reservation) => reservation.reservationId}
        pageSize={10}
        emptyMessage={error ?? '조건에 맞는 예약이 없습니다.'}
      />
    </div>
  )
}
