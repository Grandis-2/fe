import { useState } from 'react'

import { CircleCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

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
  reservationStateColor,
  reservationStateLabel,
  reservationStateLabels,
  reservationStateOf,
  useAdminMembers,
  useAdminReservations,
  useReprocessReservations,
  useReservationStats,
  type AdminReservation,
  type ReservationState,
} from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import {
  DEFAULT_REFRESH_INTERVAL,
  refreshIntervalOptions,
  type RefreshInterval,
} from '@shared/config/refreshInterval'
import { adminReservationPath } from '@shared/config/routes'
import { toggleInSet } from '@shared/lib/toggleInSet'
import { closeModal, openModal } from '@shared/model/modalStore'
import {
  Button,
  Checkbox,
  Dropdown,
  InlineAlert,
  Input,
  RefreshStatus,
  SegmentedTabs,
  Table,
  Tag,
} from '@shared/ui'
import type { DropdownOption, TableColumn } from '@shared/ui'

import * as styles from './AdminReservationsPage.css'

const ALL_PRODUCTS = '전체 상품'

// 처리할 일이 있는 상태부터 — 실패가 맨 앞이다. stage는 집계 건수(countByStage)의 칸이다.
const statusFilters = [
  { value: 'REPROCESS_NEEDED', stage: 'REPROCESS_NEEDED' },
  { value: 'PROCESSING', stage: 'PROCESSING' },
  { value: 'CONFIRMED', stage: 'CONFIRMED' },
  { value: 'CANCELED', stage: 'CANCELED' },
  { value: 'all', stage: 'ALL' },
] as const

// 한 번에 받는 최근 예약 수(서버 상한). 표·탭·검색은 이 안에서 한다.
const LIST_SIZE = 100

type StatusFilter = (typeof statusFilters)[number]['value']

/** 탭이 거르는 상태. 취소 탭은 곧 취소될 취소 중까지 함께 보여준다 */
const matchesFilter = (state: ReservationState, filter: StatusFilter) =>
  filter === 'all' ||
  state === filter ||
  (filter === 'CANCELED' && state === 'CANCELING')

type Feedback = { status: 'success' | 'error'; message: string }

/**
 * 예약 접수 현황. 10초마다 자동 갱신하고, 외부 등록이 끝내 실패한 예약은 골라서 한 번에
 * 재처리한다(맨 왼쪽 체크박스). 탭 건수는 집계 API로 전체를 세고, 표는 최근 예약을 보여준다.
 * 운영 대시보드의 외부 등록 실패 카드가 실패 탭을 연 채로 이 화면에 온다.
 */
export function AdminReservationsPage() {
  const navigate = useNavigate()
  // 탭·상품은 주소(?status=·?product=)에 둔다 — 운영 대시보드에서 실패 탭을 고른
  // 사전예약 그대로 열고, 상세에서 돌아와도 남는다. 모르는 탭이면 전체.
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter: StatusFilter =
    statusFilters.find(({ value }) => value === searchParams.get('status'))
      ?.value ?? 'all'
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (value === undefined) params.delete(key)
        else params.set(key, value)
        return params
      },
      { replace: true },
    )
  const setStatusFilter = (next: StatusFilter) =>
    setParam('status', next === 'all' ? undefined : next)
  const [keyword, setKeyword] = useState('')
  // 상품명은 겹칠 수 있어 이름이 아니라 productId로 고른다.
  const productId = searchParams.get('product') ?? undefined
  const setProductId = (next: string | undefined) => setParam('product', next)
  // 재처리할 예약(예약 id). 실제로 보내는 건 지금 표에서 재처리할 수 있는 것만이다.
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [feedback, setFeedback] = useState<Feedback>()
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
  const list = useAdminReservations(
    { productId, size: LIST_SIZE },
    refreshInterval,
  )
  const { data: page, isPending, isError, error, dataUpdatedAt, refetch } = list
  const reservations = page?.items
  // 아직 한 번도 못 받았으면 data가 undefined — 카드가 0건이 아니라 '조회 실패'로 보여야 한다.
  const stats = useReservationStats(productId, refreshInterval)
  // 이미 받은 값이 있는데 다시 받는 데 실패하고 있으면(재시도 중 포함) 멈춘 값임을 알린다.
  const staleError =
    (reservations !== undefined ? pollingError(list) : null) ??
    (stats.data !== undefined ? pollingError(stats) : null)

  const reprocess = useReprocessReservations()

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

  // 탭·검색으로 보이는 것 중 재처리할 수 있는 것만 고를 수 있다 — 상태가 바뀌어 빠진 예약은
  // 고른 채로 남아도 보내지 않는다.
  const selectable = visibleReservations.filter(isReprocessable)
  const selectedIds = selectable
    .filter((reservation) => selected.has(reservation.preorderId))
    .map((reservation) => reservation.preorderId)
  const allSelected =
    selectable.length > 0 && selectedIds.length === selectable.length
  const toggle = (ids: string[], checked: boolean) =>
    setSelected((prev) => toggleInSet(prev, ids, checked))

  // 외부로 등록을 다시 보내는 조치라 한 번 더 묻는다. 끝나면 목록을 다시 받아 표를 갱신한다.
  const confirmReprocess = () => {
    const ids = selectedIds
    openModal({
      theme: 'light',
      title: `${ids.length.toLocaleString('ko-KR')}건을 재처리할까요?`,
      description:
        '고른 예약을 외부 예약 시스템에 다시 등록합니다. 차례로 처리돼서 반영까지 몇 초 걸릴 수 있습니다.',
      confirmLabel: '재처리',
      onConfirm: () => {
        closeModal()
        setFeedback(undefined)
        reprocess.mutate(ids, {
          onSuccess: ({ targetCount, skippedCount, estimatedSeconds }) => {
            setSelected(new Set())
            setFeedback({
              status: 'success',
              message: [
                `${targetCount.toLocaleString('ko-KR')}건 재처리를 시작했습니다(약 ${estimatedSeconds}초).`,
                skippedCount > 0 &&
                  `${skippedCount.toLocaleString('ko-KR')}건은 이미 처리됐거나 상태가 바뀌어 건너뛰었습니다.`,
              ]
                .filter(Boolean)
                .join(' '),
            })
          },
          onError: (caught) =>
            setFeedback({
              status: 'error',
              message: getErrorMessage(caught, '재처리를 요청하지 못했습니다.'),
            }),
        })
      },
    })
  }

  const stageCounts = stats.data && countByStage(stats.data)

  // 탭에 전체 건수를 붙인다(집계 API) — 표는 최근 100건이라 탭 숫자와 표 줄 수가 다를 수 있다.
  // 집계를 못 받았으면 숫자를 빼서 0건으로 읽히지 않게 한다.
  const tabs = statusFilters.map(({ value, stage }) => ({
    value,
    label: (
      <span className={styles.tabLabel}>
        {reservationStageLabel[stage]}
        {stageCounts && (
          <span className={styles.tabCount}>
            {stageCounts[stage].toLocaleString('ko-KR')}
          </span>
        )}
      </span>
    ),
  }))
  const failures = stageCounts?.REPROCESS_NEEDED ?? 0

  const columns: TableColumn<AdminReservation>[] = [
    {
      key: 'select',
      header: (
        <Checkbox
          aria-label="재처리할 수 있는 예약 모두 선택"
          checked={allSelected}
          disabled={selectable.length === 0 || reprocess.isPending}
          onChange={(event) =>
            toggle(
              selectable.map((reservation) => reservation.preorderId),
              event.target.checked,
            )
          }
        />
      ),
      align: 'center',
      width: '56px',
      render: (reservation) =>
        isReprocessable(reservation) && (
          <Checkbox
            aria-label={`${reservationNo(reservation.preorderId)} 선택`}
            checked={selected.has(reservation.preorderId)}
            disabled={reprocess.isPending}
            // 행 전체가 상세로 가는 버튼이라, 고르기만 하고 머문다.
            onClick={(event) => event.stopPropagation()}
            onChange={(event) =>
              toggle([reservation.preorderId], event.target.checked)
            }
          />
        ),
    },
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
      {staleError !== null && (
        <InlineAlert status="warning">
          {getErrorMessage(staleError, '예약을 다시 불러오지 못했습니다.')} 아래
          숫자와 목록은 마지막으로 받은 값입니다.
        </InlineAlert>
      )}

      {stats.isError && !stats.data && (
        <InlineAlert status="error">
          {getErrorMessage(stats.error, '상태별 건수를 불러오지 못했습니다.')}
        </InlineAlert>
      )}

      {/* 실패는 어느 탭에서든 먼저 보이게 — 실패 탭이 아니면 그 탭으로 가는 단추를 단다. */}
      {failures > 0 && (
        <InlineAlert status="error">
          <span className={styles.alertRow}>
            <span>
              <b>
                {failures.toLocaleString('ko-KR')}건이 외부 등록에 실패해 결제
                단계로 못 넘어가고 있습니다.
              </b>{' '}
              재처리를 시도해 주세요.
            </span>
            {statusFilter !== 'REPROCESS_NEEDED' && (
              <Button
                size="small"
                onClick={() => setStatusFilter('REPROCESS_NEEDED')}
              >
                실패 예약 보기
              </Button>
            )}
          </span>
        </InlineAlert>
      )}

      {feedback && (
        <InlineAlert
          status={feedback.status}
          // 성공에 경고 삼각형이 붙으면 문구와 반대로 읽힌다.
          icon={feedback.status === 'success' ? CircleCheck : undefined}
        >
          {feedback.message}
        </InlineAlert>
      )}

      <div className={styles.toolbar}>
        <SegmentedTabs
          items={tabs}
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

      {selectable.length > 0 && (
        <div className={styles.selectionBar}>
          <span className={styles.selectionCount}>
            {selectedIds.length.toLocaleString('ko-KR')}건 선택됨
          </span>
          <Button
            size="small"
            disabled={selectedIds.length === 0 || reprocess.isPending}
            onClick={confirmReprocess}
          >
            {reprocess.isPending ? '재처리 요청 중…' : '선택한 예약 재처리'}
          </Button>
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
