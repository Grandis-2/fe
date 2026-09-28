import { useCallback, useEffect, useState } from 'react'

import { ChevronRight, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router'

import { getAdminProducts, type AdminProduct } from '@/entities/admin-product'
import {
  failedCountOf,
  getAdminMembers,
  getAdminReservations,
  getAdminStats,
  reservationNo,
  reservationStatusColor,
  reservationStatusLabel,
  type AdminMemberModel,
  type AdminReservation,
  type AdminReservationStatus,
  type AdminStats,
} from '@/entities/admin-reservation'
import { AdminReservationCreateModal } from '@/features/admin-reservation-create'
import { useModalStore } from '@/shared/model/modalStore'
import { Button, Dropdown, Input, SegmentedTabs, Table, Tag } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'

import * as styles from './AdminReservationsPage.css'

const ALL_PRODUCTS = '전체 상품'
const REFRESH_INTERVAL_MS = 10_000

const statusFilters = [
  { value: 'all', label: '전체' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'ACCEPTED', label: '처리 중' },
  { value: 'FAILED', label: '확정 실패' },
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
  const navigate = useNavigate()
  const openModal = useModalStore((state) => state.open)
  const closeModal = useModalStore((state) => state.close)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [keyword, setKeyword] = useState('')
  const [productOpen, setProductOpen] = useState(false)
  // 상품명은 겹칠 수 있어 이름이 아니라 productId로 고른다.
  const [productId, setProductId] = useState<string>()

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [members, setMembers] = useState<AdminMemberModel[]>([])
  const [reservations, setReservations] = useState<AdminReservation[]>([])
  const [stats, setStats] = useState<AdminStats>()
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

  const load = useCallback(() => {
    Promise.all([
      // 표가 자체적으로 페이지를 나누므로 넉넉히 한 번에 받는다.
      getAdminReservations({ status, productId, size: 100 }),
      getAdminStats(),
    ])
      .then(([paged, loadedStats]) => {
        setReservations(paged.items)
        setStats(loadedStats)
        setRefreshedAt(new Date())
        setError(undefined)
      })
      .catch((cause: Error) => setError(cause.message))
  }, [status, productId])

  // 접수는 계속 들어오므로 주기적으로 다시 받는다.
  useEffect(() => {
    load()
    const timer = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [load])

  const openDetail = (reservation: AdminReservation) =>
    navigate(`/admin/orders/${reservation.reservationId}`)

  const memberName = (memberId: string) =>
    members.find((member) => member.memberId === memberId)?.name ?? memberId

  // 예약번호로 거르는 쿼리 파라미터가 명세에 없어 받아온 목록에서 직접 찾는다.
  const trimmedKeyword = keyword.trim().toUpperCase()
  const visibleReservations = trimmedKeyword
    ? reservations.filter((reservation) =>
        reservationNo(reservation.reservationId).includes(trimmedKeyword),
      )
    : reservations

  const cards: { label: string; value: number | undefined }[] = [
    { label: '접수', value: stats?.accept.uniqueAcceptedCount },
    { label: '처리 중', value: stats?.registration.acceptedBacklogCount },
    { label: '확정', value: stats?.registration.confirmedCount },
    { label: '확정 실패', value: stats && failedCountOf(stats) },
    // 취소 건수는 stats에 없어서 목록 응답에서 센다.
    {
      label: '취소',
      value:
        stats && reservations.filter((r) => r.status === 'CANCELED').length,
    },
  ]

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
      render: (reservation) => (
        <>
          {reservation.acceptSeq.toLocaleString('ko-KR')}
          {reservation.overdue && (
            <span className={styles.overdueMark}> 기한 초과</span>
          )}
        </>
      ),
    },
    {
      key: 'status',
      header: '상태',
      align: 'center',
      render: (reservation) => (
        <Tag
          variant="outline"
          size="medium"
          rounded={false}
          color={reservationStatusColor[reservation.status]}
        >
          {reservationStatusLabel[reservation.status]}
        </Tag>
      ),
    },
    {
      key: 'manage',
      header: '관리',
      align: 'center',
      width: '80px',
      render: (reservation) => (
        <button
          type="button"
          className={styles.rowLink}
          aria-label={`${reservationNo(reservation.reservationId)} 상세 보기`}
          onClick={() => openDetail(reservation)}
        >
          <ChevronRight className={styles.rowLinkIcon} aria-hidden="true" />
        </button>
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
        {cards.map(({ label, value }) => (
          <div key={label} className={styles.card}>
            <div className={styles.cardLabel}>{label}</div>
            {/* 조회에 실패했으면 0건으로 보여주지 않는다 — 운영 판단이 정반대다. */}
            {stats?.queryFailed || value === undefined ? (
              <div className={styles.cardUnknown}>조회 실패</div>
            ) : (
              <div className={styles.cardValue}>
                {value.toLocaleString('ko-KR')}건
              </div>
            )}
          </div>
        ))}
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
          <Button
            icon="plus"
            size="medium"
            onClick={() =>
              openModal(
                <AdminReservationCreateModal
                  onCreated={load}
                  onClose={closeModal}
                />,
              )
            }
          >
            예약 생성
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        rows={visibleReservations}
        rowKey={(reservation) => reservation.reservationId}
        pageSize={10}
        onRowClick={openDetail}
        emptyMessage={error ?? '조건에 맞는 예약이 없습니다.'}
      />
    </div>
  )
}
