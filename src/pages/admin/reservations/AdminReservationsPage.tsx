import { useState } from 'react'

import { CircleCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

import {
  useAdminProducts,
  useAdminShipmentBatches,
} from '@entities/admin-product'
import {
  countByStage,
  isReprocessable,
  isPaymentDueSoon,
  paymentDueLabel,
  paymentStateLabel,
  paymentStateOf,
  reservationNo,
  reservationStageLabel,
  reservationStateColor,
  reservationStateVariant,
  reservationStateLabel,
  reservationStateOf,
  useAdminReservations,
  useReprocessReservations,
  useReservationStats,
  type AdminReservation,
  type ReservationSort,
} from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import {
  refreshIntervalOptions,
  type RefreshInterval,
} from '@shared/config/refreshInterval'
import { adminReservationPath } from '@shared/config/routes'
import { toggleInSet } from '@shared/lib/toggleInSet'
import { useClampPage } from '@shared/lib/useClampPage'
import { closeModal, openModal } from '@shared/model/modalStore'
import {
  Button,
  Checkbox,
  CountBadge,
  Dropdown,
  InlineAlert,
  Input,
  Navigator,
  RefreshStatus,
  SegmentedTabs,
  Table,
  Tag,
} from '@shared/ui'
import type { DropdownOption, TableColumn } from '@shared/ui'

import * as styles from './AdminReservationsPage.css'

const ALL_PRODUCTS = '전체 상품'
// 오픈 중엔 실패가 쌓이는 걸 바로 봐야 해서, 집계 캐시 하한(5초)을 기본으로 둔다.
const DEFAULT_INTERVAL: RefreshInterval = 5_000

/** 접수 기간 — 고른 순간을 기준으로 하한(from)을 잡는다 */
type Period = 'all' | 'hour' | 'today' | 'week' | 'month'
const periodOptions: DropdownOption<Period>[] = [
  { label: '전체 기간', value: 'all' },
  { label: '최근 1시간', value: 'hour' },
  { label: '오늘', value: 'today' },
  { label: '최근 7일', value: 'week' },
  { label: '최근 30일', value: 'month' },
]
const DAY_MS = 24 * 60 * 60 * 1000
const fromOf = (period: Period, now: number) => {
  if (period === 'all') return undefined
  if (period === 'today') return new Date(new Date(now).setHours(0, 0, 0, 0))
  const span = { hour: 60 * 60 * 1000, week: 7 * DAY_MS, month: 30 * DAY_MS }
  return new Date(now - span[period])
}

/** 정렬 — 서버가 정렬해 쪽을 넘겨도 전체 순서가 이어진다. 순번순은 상품을 골라야 된다(명세) */
const sortOptions: DropdownOption<ReservationSort>[] = [
  { label: '최신 접수순', value: 'NEWEST' },
  { label: '오래된 접수순', value: 'OLDEST' },
  { label: '대기 순번순', value: 'QUEUE_POSITION' },
  { label: '결제 기한 임박순', value: 'PAYMENT_DUE' },
]

const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})
const dateTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
/** 오늘 접수는 시각만(초까지 — 오픈 직후엔 초 단위로 몰린다), 그 전은 날짜와 시각 */
const formatReceivedAt = (iso: string) => {
  const date = new Date(iso)
  return date.toDateString() === new Date().toDateString()
    ? timeFormat.format(date)
    : dateTimeFormat.format(date)
}

// 처리할 일이 있는 상태부터 — 실패가 맨 앞이다. stage는 집계 건수(countByStage)의 칸이다.
// query는 탭이 서버에 보내는 조건이다. 서버는 상태를 하나만 거를 수 있어 묶인 탭은 상태를
// 여럿 주고, 그 순서대로 이어 붙여 쪽을 나눈다(확정은 결제 대기 다음 결제 완료, 취소는 취소
// 중 다음 취소 완료). 처리 중(PENDING_SYNC)엔 외부 등록 실패도 섞여 나온다 — 서버에 '실패
// 빼고' 조건이 없다. 실패 행은 빨간 배경이라 구분된다. sort는 탭의 기본 순서 — 실패·처리
// 중은 오래 기다린 것부터, 확정은 결제 기한 임박순이다.
const statusFilters = [
  {
    value: 'REPROCESS_NEEDED',
    stage: 'REPROCESS_NEEDED',
    query: { registerJobStatus: 'DEAD_LETTER' },
    sort: 'OLDEST',
  },
  {
    value: 'PROCESSING',
    stage: 'PROCESSING',
    query: { statuses: ['PENDING_SYNC'] },
    sort: 'OLDEST',
  },
  {
    value: 'CONFIRMED',
    stage: 'CONFIRMED',
    query: { statuses: ['REGISTERED', 'RESERVED'] },
    sort: 'PAYMENT_DUE',
  },
  {
    value: 'CANCELED',
    stage: 'CANCELED',
    query: { statuses: ['CANCELING', 'CANCELED'] },
    sort: 'NEWEST',
  },
  { value: 'all', stage: 'ALL', query: {}, sort: 'NEWEST' },
] as const

const PAGE_SIZE = 10

type StatusFilter = (typeof statusFilters)[number]['value']

type Feedback = { status: 'success' | 'error'; message: string }

/**
 * 예약 접수 현황. 10초마다 자동 갱신하고, 외부 등록이 끝내 실패한 예약은 골라서 한 번에
 * 재처리한다(맨 왼쪽 체크박스). 탭 건수는 집계 API로 전체를 세고, 표는 서버가 나눈 쪽을
 * 넘겨 끝까지 본다.
 * 운영 대시보드의 외부 등록 실패 카드가 실패 탭을 연 채로 이 화면에 온다.
 */
export function AdminReservationsPage() {
  const navigate = useNavigate()
  // 탭·상품은 주소(?status=·?product=)에 둔다 — 운영 대시보드에서 실패 탭을 고른
  // 사전예약 그대로 열고, 상세에서 돌아와도 남는다.
  const [searchParams, setSearchParams] = useSearchParams()
  // 처음 들어오면(status 없음) 할 일이 있는 외부 등록 실패부터. 모르는 값(옛 링크·잘못 친
  // 주소)이면 전체 — 실패 탭으로 열면 일반 예약이 다 빠져 보인다.
  const statusParam = searchParams.get('status')
  const tab =
    statusParam === null
      ? statusFilters[0]
      : (statusFilters.find(({ value }) => value === statusParam) ??
        statusFilters[statusFilters.length - 1])
  const statusFilter: StatusFilter = tab.value
  // 쪽도 주소(?page=, 1부터)에 둔다 — 상세에서 돌아와도 보던 쪽이다. 손으로 고친 값(1.5,
  // Infinity)은 첫 쪽으로 — 정수가 아니면 서버가 400을 준다.
  const pageParam = Number(searchParams.get('page'))
  const page = Number.isSafeInteger(pageParam) && pageParam >= 1 ? pageParam : 1
  // 쪽 말고 다른 조건이 바뀌면 첫 쪽으로 돌아간다 — 3쪽을 보다 탭을 바꾸면 빈 쪽이 뜬다.
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (value === undefined) params.delete(key)
        else params.set(key, value)
        if (key !== 'page') params.delete('page')
        return params
      },
      { replace: true },
    )
  const toFirstPage = () => setParam('page', undefined)
  // 고른 정렬. 없으면 탭의 기본 순서 — 탭을 바꾸면 그 탭의 기본으로 돌아간다.
  const [sortChoice, setSortChoice] = useState<ReservationSort>()
  const setStatusFilter = (next: StatusFilter) => {
    setParam('status', next)
    setSortChoice(undefined)
  }
  const selectSort = (next: ReservationSort) => {
    setSortChoice(next)
    toFirstPage()
  }
  // 상품명은 겹칠 수 있어 이름이 아니라 productId로 고른다.
  const productId = searchParams.get('product') ?? undefined
  // 차수 번호는 상품마다 따로라, 상품을 바꾸면 차수를 비운다.
  const [batchNumber, setBatchNumber] = useState<number>()
  const setProductId = (next: string | undefined) => {
    setParam('product', next)
    setBatchNumber(undefined)
  }
  const selectBatch = (next: number | undefined) => {
    setBatchNumber(next)
    toFirstPage()
  }
  // 외부 예약 번호는 정확히 같은 것만 찾아서, 다 친 뒤(Enter) 보낸다 — 칠 때마다 묻지 않게.
  const [referenceDraft, setReferenceDraft] = useState('')
  const [externalReference, setExternalReference] = useState<string>()
  const [period, setPeriod] = useState<Period>('all')
  // shortcut: 고른 순간을 기준으로 하한을 고정한다 — '최근 1시간'을 오래 띄워 두면 창이 밀리지 않는다. 문제가 되면 갱신마다 다시 잡는다.
  const [from, setFrom] = useState<string>()
  const selectPeriod = (next: Period) => {
    setPeriod(next)
    setFrom(fromOf(next, Date.now())?.toISOString())
    toFirstPage()
  }
  // 재처리할 예약(예약 id). 실제로 보내는 건 지금 표에서 재처리할 수 있는 것만이다.
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [feedback, setFeedback] = useState<Feedback>()
  const [refreshInterval, setRefreshInterval] =
    useState<RefreshInterval>(DEFAULT_INTERVAL)

  const { data: products = [] } = useAdminProducts({ saleMode: 'PREORDER' })

  // 값이 undefined인 첫 항목이 '전체 상품' — 서버에 productId를 안 보낸다.
  const productOptions: DropdownOption<string | undefined>[] = [
    { label: ALL_PRODUCTS, value: undefined },
    ...products.map((product) => ({
      label: product.name,
      value: product.productId,
    })),
  ]

  const batches = useAdminShipmentBatches(productId ?? '', {
    enabled: productId !== undefined,
  })
  const batchOptions: DropdownOption<number | undefined>[] = [
    { label: '전체 차수', value: undefined },
    ...(batches.data ?? []).map((batch) => ({
      label: `${batch.batchNumber}차`,
      value: batch.batchNumber,
    })),
  ]

  // 순번순은 상품이 있어야 해서(없으면 400), 상품을 비우면 탭 기본 순서로 돌아간다.
  const sort =
    sortChoice === 'QUEUE_POSITION' && !productId
      ? tab.sort
      : (sortChoice ?? tab.sort)
  const visibleSortOptions = productId
    ? sortOptions
    : sortOptions.filter((option) => option.value !== 'QUEUE_POSITION')

  // 탭·필터 모두 서버가 거르고, 쪽도 서버가 나눈다 — 100건이 넘어도 쪽을 넘겨 끝까지 본다.
  const list = useAdminReservations(
    {
      ...tab.query,
      sort,
      productId,
      batchNumber: productId ? batchNumber : undefined,
      externalReference,
      from,
      page: page - 1,
      size: PAGE_SIZE,
    },
    refreshInterval,
  )
  const { data, isPending, isError, error, dataUpdatedAt, refetch } = list
  const reservations = data?.items
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0
  useClampPage(
    page,
    data && !list.isPlaceholderData ? totalPages : null,
    (next) => setParam('page', next > 1 ? String(next) : undefined),
  )
  // 아직 한 번도 못 받았으면 data가 undefined — 카드가 0건이 아니라 '조회 실패'로 보여야 한다.
  const stats = useReservationStats(productId, refreshInterval)
  // 이미 받은 값이 있는데 다시 받는 데 실패하고 있으면(재시도 중 포함) 멈춘 값임을 알린다.
  const staleError =
    (reservations !== undefined ? pollingError(list) : null) ??
    (stats.data !== undefined ? pollingError(stats) : null)

  const reprocess = useReprocessReservations()

  const openDetail = (reservation: AdminReservation) =>
    navigate(adminReservationPath(reservation.preorderId))

  const refresh = () => {
    void refetch()
    void stats.refetch()
  }

  const visibleReservations = reservations ?? []

  // 탭·검색으로 보이는 것 중 재처리할 수 있는 것만 고를 수 있다 — 상태가 바뀌어 빠진 예약은
  // 고른 채로 남아도 보내지 않는다.
  const selectable = visibleReservations.filter(isReprocessable)
  const selectedRows = selectable.filter((reservation) =>
    selected.has(reservation.preorderId),
  )
  const allSelected =
    selectable.length > 0 && selectedRows.length === selectable.length
  const toggle = (ids: string[], checked: boolean) =>
    setSelected((prev) => toggleInSet(prev, ids, checked))

  // 외부로 등록을 다시 보내는 조치라 한 번 더 묻는다. 끝나면 목록을 다시 받아 표를 갱신한다.
  const confirmReprocess = () => {
    openModal({
      theme: 'light',
      title: `${selectedRows.length.toLocaleString('ko-KR')}건을 재처리할까요?`,
      description:
        '고른 예약을 외부 예약 시스템에 다시 등록합니다. 차례로 처리돼서 반영까지 몇 초 걸릴 수 있습니다.',
      confirmLabel: '재처리',
      onConfirm: () => {
        closeModal()
        setFeedback(undefined)
        reprocess.mutate(selectedRows, {
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

  // 탭에 전체 건수를 붙인다(집계 API). 표는 상품 말고 다른 조건(차수·기간·외부 번호)도 따라서
  // 탭 숫자와 표 건수가 다를 수 있다. 집계를 못 받았으면 숫자를 빼서 0건으로 읽히지 않게 한다.
  // 실패 건수는 빨간 배지로 — 따로 경고 띠를 두지 않아도 어느 탭에서든 먼저 보인다.
  const tabs = statusFilters.map(({ value, stage }) => ({
    value,
    label: (
      <span className={styles.tabLabel}>
        {reservationStageLabel[stage]}
        {stageCounts &&
          (stage === 'REPROCESS_NEEDED' && stageCounts[stage] > 0 ? (
            <CountBadge>
              {stageCounts[stage].toLocaleString('ko-KR')}
            </CountBadge>
          ) : (
            <span className={styles.tabCount}>
              {stageCounts[stage].toLocaleString('ko-KR')}
            </span>
          ))}
      </span>
    ),
  }))

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
    // 번호 아래 접수 시각, 모델 아래 옵션·차수 — 함께 읽는 값을 한 칸에 묶어 열을 줄인다.
    {
      key: 'no',
      header: '예약',
      render: (reservation) => (
        <span className={styles.stacked}>
          <span className={styles.mainText}>
            {reservationNo(reservation.preorderId)}
          </span>
          <span className={styles.subText}>
            {formatReceivedAt(reservation.createdAt)}
          </span>
        </span>
      ),
    },
    {
      key: 'product',
      header: '상품',
      render: (reservation) => (
        <span className={styles.stacked}>
          <span className={styles.mainText}>{reservation.productTitle}</span>
          <span className={styles.subText}>
            {reservation.optionTitle} · {reservation.shipmentBatch.batchNumber}
            차
          </span>
        </span>
      ),
    },
    {
      key: 'member',
      header: '예약자',
      render: (reservation) => (
        <span className={styles.cellText}>
          {reservation.customerName ?? '—'}
        </span>
      ),
    },
    {
      key: 'seq',
      header: '순번',
      align: 'right',
      render: (reservation) => (
        <span className={styles.number}>
          {reservation.queuePosition.toLocaleString('ko-KR')}
        </span>
      ),
    },
    // 상태는 의미별 색 태그로 구분한다. 외부 등록 실패는 행 배경까지 깔려 따로 눈에 띈다.
    {
      key: 'status',
      header: '상태',
      render: (reservation) => {
        const state = reservationStateOf(reservation)
        return (
          <Tag
            variant={reservationStateVariant[state]}
            size="medium"
            rounded={false}
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
      render: (reservation) => {
        const payment = paymentStateOf(reservation)
        if (!payment) return <span className={styles.subText}>—</span>

        // 결제 대기만 남은 시간을 보여준다 — 24시간을 넘기면 예약이 자동취소된다.
        const due =
          payment === 'PENDING'
            ? paymentDueLabel(reservation.paymentDueAt)
            : null
        const soon = due !== null && isPaymentDueSoon(reservation.paymentDueAt)

        return (
          <span className={styles.stacked}>
            <span className={styles.cellText}>
              {paymentStateLabel[payment]}
            </span>
            {due && (
              <span className={soon ? styles.dueSoon : styles.subText}>
                {due}
              </span>
            )}
          </span>
        )
      },
    },
  ]

  return (
    <div className={styles.root}>
      {/* 운영 대시보드와 같이 제목 줄 오른쪽에 마지막 갱신을 둔다. */}
      <header className={styles.header}>
        <h1 className={styles.title}>예약 현황</h1>
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
      </header>

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

      {feedback && (
        <InlineAlert
          status={feedback.status}
          // 성공에 경고 삼각형이 붙으면 문구와 반대로 읽힌다.
          icon={feedback.status === 'success' ? CircleCheck : undefined}
        >
          {feedback.message}
        </InlineAlert>
      )}

      <SegmentedTabs
        items={tabs}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      {/* 탭 아래 — 서버가 거르는 조건과 정렬. 탭 건수는 상품만 따른다(집계 API 조건). */}
      <div className={styles.filters}>
        <form
          className={styles.referenceField}
          onSubmit={(event) => {
            event.preventDefault()
            setExternalReference(referenceDraft.trim() || undefined)
            toFirstPage()
          }}
        >
          <Input
            label="외부 예약 번호"
            size="small"
            value={referenceDraft}
            onChange={(event) => {
              setReferenceDraft(event.target.value)
              // 지우면 바로 조건을 푼다 — 빈 칸에 Enter를 또 누르게 하지 않는다.
              if (!event.target.value.trim()) {
                setExternalReference(undefined)
                toFirstPage()
              }
            }}
          />
        </form>
        <Dropdown
          className={styles.field}
          label={ALL_PRODUCTS}
          fieldLabel="상품"
          options={productOptions}
          value={productId}
          onSelect={setProductId}
        />
        <Dropdown
          className={styles.field}
          label="전체 차수"
          fieldLabel={
            productId ? '배송 차수' : '배송 차수, 상품을 먼저 고르세요'
          }
          options={batchOptions}
          value={batchNumber}
          onSelect={selectBatch}
          disabled={!productId}
        />
        <Dropdown
          className={styles.field}
          label="전체 기간"
          fieldLabel="접수 기간"
          options={periodOptions}
          value={period}
          onSelect={selectPeriod}
        />
        <Dropdown
          className={styles.field}
          label="정렬"
          fieldLabel="정렬"
          options={visibleSortOptions}
          value={sort}
          onSelect={selectSort}
        />
      </div>

      {selectable.length > 0 && (
        <div className={styles.selectionBar}>
          <span className={styles.selectionCount}>
            {selectedRows.length.toLocaleString('ko-KR')}건 선택됨
          </span>
          <Button
            size="small"
            disabled={selectedRows.length === 0 || reprocess.isPending}
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
        rowClassName={(reservation) =>
          isReprocessable(reservation) ? styles.failedRow : undefined
        }
        onRowClick={openDetail}
        rowAction={{
          label: (reservation) =>
            `${reservationNo(reservation.preorderId)} 상세 보기`,
          onClick: openDetail,
        }}
        loading={isPending}
        loadingRows={PAGE_SIZE}
        emptyMessage={
          isError
            ? getErrorMessage(error, '예약을 불러오지 못했습니다.')
            : '조건에 맞는 예약이 없습니다.'
        }
      />

      {totalPages > 1 && (
        <Navigator
          className={styles.navigator}
          totalPages={totalPages}
          currentPage={page}
          onPageChange={(next) => setParam('page', String(next))}
        />
      )}
    </div>
  )
}
