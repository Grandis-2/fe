import { useState, type FormEvent } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import {
  adminOrderSourceLabel,
  adminOrderSources,
  adminOrderStatusColor,
  adminOrderStatuses,
  adminOrderStatusLabel,
  adminOrderStatusLabels,
  nextShippingStepOf,
  orderNo,
  type AdminOrder,
  type AdminOrderSource,
  type AdminOrderStatus,
  useAdminOrderCounts,
  useAdminOrders,
} from '@entities/admin-order'
import { getErrorMessage } from '@shared/api/client'
import { adminOrderPath } from '@shared/config/routes'
import { formatShortDateTime } from '@shared/lib/formatDotDate'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { toggleInSet } from '@shared/lib/toggleInSet'
import {
  Button,
  Checkbox,
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
import { BulkShippingModal } from '@widgets/admin/order-bulk-shipping'

import * as styles from './AdminOrdersPage.css'

const PAGE_SIZE = 20
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SHORT_NO_PATTERN = /^[0-9a-f]{8}$/i
const ALL = 'all'

/** 위 카드 — 관리자가 손대야 하는 단계와 오래 머물면 문제인 취소 처리 중 */
const todoCards = [
  {
    status: 'AWAITING_CONFIRMATION',
    label: '배송 준비 시작',
    hint: '결제 완료 · 드로우 당첨 주문 포함',
  },
  { status: 'PREPARING_ITEMS', label: '포장 완료 대기', hint: '상품 준비 중' },
  {
    status: 'READY_TO_SHIP',
    label: '출고 대기',
    hint: '포장 끝, 택배사 인계 전',
  },
  {
    status: 'CANCELING',
    label: '취소 처리 중',
    hint: '오래 머물면 환불 실패 — 상세에서 확인',
  },
] as const satisfies readonly {
  status: AdminOrderStatus
  label: string
  hint: string
}[]
const todoStatuses = todoCards.map(({ status }) => status)

// 탭은 배송 흐름, 나머지 상태(결제 전·취소)는 드롭다운으로 — 상태 필터는 한 번에 하나다.
const tabStatuses = [
  'AWAITING_CONFIRMATION',
  'PREPARING_ITEMS',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
] as const satisfies readonly AdminOrderStatus[]
const tabs = [
  { value: ALL, label: '전체' },
  ...tabStatuses.map((status) => ({
    value: status,
    label: adminOrderStatusLabel[status],
  })),
]
const otherStatusOptions: DropdownOption<AdminOrderStatus | undefined>[] = [
  { value: undefined, label: '선택 안 함' },
  ...adminOrderStatuses
    .filter((status) => !(tabStatuses as readonly string[]).includes(status))
    .map((status) => ({ value: status, label: adminOrderStatusLabel[status] })),
]
const sourceOptions: DropdownOption<AdminOrderSource | undefined>[] = [
  { value: undefined, label: '모든 출처' },
  ...adminOrderSources.map((source) => ({
    value: source,
    label: adminOrderSourceLabel[source],
  })),
]

/** 주소의 값이 아는 값일 때만 쓴다 — 손으로 고친 주소가 400을 부르지 않게 */
const pick = <TValue extends string>(
  value: string | null,
  known: readonly TValue[],
) =>
  (known as readonly string[]).includes(value ?? '')
    ? (value as TValue)
    : undefined

// 목록에선 번호 앞뒤만 — 배송에 쓰는 전체 번호는 상세에서 본다.
const maskPhone = (phone: string) =>
  phone.replace(/^(\d{3})\D?\d{3,4}\D?(\d{4})$/, '$1-****-$2')

/**
 * 모든 회원의 주문. 위 카드로 처리할 일을 고르고, 같은 상태끼리 골라 다음 배송 단계로 한 번에
 * 옮긴다. 상태·출처·쪽은 주소에 둬서 상세에 들어갔다 돌아와도 보던 자리가 남는다.
 */
export function AdminOrdersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const source = pick<AdminOrderSource>(
    searchParams.get('source'),
    adminOrderSources,
  )
  const status = pick<AdminOrderStatus>(
    searchParams.get('status'),
    adminOrderStatuses,
  )
  // 손으로 고친 주소(?page=1.5, ?page=Infinity)도 첫 쪽으로 — 정수가 아니면 서버가 400을 준다.
  const pageParam = Number(searchParams.get('page'))
  const page = Number.isSafeInteger(pageParam) && pageParam >= 1 ? pageParam : 1

  const orders = useAdminOrders({
    source,
    status,
    page: page - 1,
    size: PAGE_SIZE,
  })
  const todo = useAdminOrderCounts(todoStatuses)
  const totalPages = orders.data ? Math.ceil(orders.data.total / PAGE_SIZE) : 0

  // 목록 API에 검색 조건이 없어(상태·출처·쪽뿐) 전체 주문 id로만 바로 연다.
  const [lookup, setLookup] = useState('')
  const [lookupError, setLookupError] = useState<string>()
  const openByOrderId = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const orderId = lookup.trim()
    if (UUID_PATTERN.test(orderId)) {
      navigate(adminOrderPath(orderId.toLowerCase()))
      return
    }
    setLookupError(
      SHORT_NO_PATTERN.test(orderId)
        ? '주문번호(8자리)로는 아직 찾을 수 없습니다. 전체 주문 id를 넣어 주세요.'
        : '주문 id 형식이 아닙니다.',
    )
  }

  // 같은 상태끼리만 옮길 수 있어 상태 하나를 고른 쪽에서만 체크 칸을 둔다. 쪽·필터를 바꾸면 푼다.
  const step = status ? nextShippingStepOf(status) : null
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkKey, setBulkKey] = useState(0)
  // 연 순간의 선택으로 고정한다 — 옮기는 동안 목록이 다시 와도 대상·건수가 바뀌지 않게.
  const [bulkOrders, setBulkOrders] = useState<AdminOrder[]>([])
  const rows = orders.data?.items ?? []
  // 고른 뒤 상태가 바뀌어(다른 관리자·회원 취소) 이 탭에서 빠진 주문은 보내지 않는다.
  const selectedOrders = rows.filter(
    (order) => order.status === status && selected.has(order.orderId),
  )
  const selectable = rows.filter((order) => order.status === status)
  const allSelected =
    selectable.length > 0 && selectedOrders.length === selectable.length
  const toggle = (ids: string[], checked: boolean) =>
    setSelected((prev) => toggleInSet(prev, ids, checked))

  // 필터를 바꾸면 첫 쪽부터 본다.
  const setParam = (
    key: 'source' | 'status' | 'page',
    value: string | undefined,
  ) => {
    setSelected(new Set())
    setSearchParams(
      (prev) => {
        if (
          value === undefined ||
          value === ALL ||
          (key === 'page' && value === '1')
        )
          prev.delete(key)
        else prev.set(key, value)
        if (key !== 'page') prev.delete('page')
        return prev
      },
      { replace: true },
    )
  }

  const refresh = () => {
    void orders.refetch()
    todo.refetch()
  }

  const columns: TableColumn<AdminOrder>[] = [
    ...(step
      ? [
          {
            key: 'select',
            header: (
              <Checkbox
                aria-label="이 쪽 주문 모두 선택"
                checked={allSelected}
                disabled={selectable.length === 0}
                onChange={(event) =>
                  toggle(
                    selectable.map((order) => order.orderId),
                    event.target.checked,
                  )
                }
              />
            ),
            align: 'center' as const,
            width: '56px',
            render: (order: AdminOrder) =>
              order.status === status && (
                <Checkbox
                  aria-label={`주문 ${orderNo(order.orderId)} 선택`}
                  checked={selected.has(order.orderId)}
                  // 행 전체가 상세로 가는 버튼이라, 고르기만 하고 머문다.
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) =>
                    toggle([order.orderId], event.target.checked)
                  }
                />
              ),
          },
        ]
      : []),
    // 번호 아래 주문 시각, 상품 아래 옵션·수량 — 함께 읽는 값을 한 칸에 묶어 열을 줄인다.
    {
      key: 'no',
      header: '주문',
      render: (order) => (
        <span className={styles.stacked}>
          <span className={styles.mainText}>{orderNo(order.orderId)}</span>
          <span className={styles.subText}>
            {formatShortDateTime(order.createdAt)}
          </span>
        </span>
      ),
    },
    {
      key: 'items',
      header: '상품',
      render: ({ items }) => {
        const [first, ...rest] = items
        if (!first) return <span className={styles.subText}>—</span>
        return (
          <span className={styles.stacked}>
            <span className={styles.mainText}>{first.productTitle}</span>
            <span className={styles.subText}>
              {rest.length > 0
                ? `${first.optionTitle} 외 ${rest.length}건`
                : `${first.optionTitle} · ${formatNumber(first.quantity)}개`}
            </span>
          </span>
        )
      },
    },
    {
      key: 'shipTo',
      header: '받는 사람',
      render: ({ shipTo }) => (
        <span className={styles.stacked}>
          <span className={styles.cellText}>{shipTo.name}</span>
          <span className={styles.subText}>{maskPhone(shipTo.phone)}</span>
        </span>
      ),
    },
    {
      key: 'source',
      header: '출처',
      render: (order) => (
        <span className={styles.cellText}>
          {adminOrderSourceLabel[order.source]}
        </span>
      ),
    },
    {
      key: 'amount',
      header: '금액',
      align: 'right',
      render: (order) => (
        <span className={styles.number}>{formatWon(order.totalAmount)}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (order) => {
        const next = nextShippingStepOf(order.status)
        return (
          <span className={styles.stacked}>
            <Tag
              variant="subtle"
              size="medium"
              rounded={false}
              widthOptions={adminOrderStatusLabels}
              color={adminOrderStatusColor[order.status]}
            >
              {adminOrderStatusLabel[order.status]}
            </Tag>
            {next && <span className={styles.next}>다음: {next.label}</span>}
          </span>
        )
      },
    },
  ]

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>주문 관리</h1>
        <RefreshStatus updatedAt={orders.dataUpdatedAt} onRefresh={refresh} />
      </header>

      {/* 카드를 누르면 그 상태로 거른다 — 지금 거른 상태의 카드는 테두리로 표시한다. */}
      <section className={styles.todo} aria-label="처리할 주문">
        {todoCards.map((card) => {
          const count = todo.counts[card.status]
          return (
            <button
              key={card.status}
              type="button"
              className={
                card.status === 'CANCELING'
                  ? styles.todoCard.danger
                  : styles.todoCard.default
              }
              aria-pressed={status === card.status}
              onClick={() => setParam('status', card.status)}
            >
              <span className={styles.todoLabel}>{card.label}</span>
              <span
                className={
                  count === null ? styles.todoValueMuted : styles.todoValue
                }
              >
                {count === null ? '—' : formatNumber(count)}
              </span>
              <span className={styles.todoHint}>{card.hint}</span>
            </button>
          )
        })}
      </section>

      {/* 다시 받기가 실패해도 이전 목록은 남는다 — 멈춘 목록을 최신으로 읽지 않게 알린다. */}
      {(orders.isError || todo.isError) && orders.data && (
        <InlineAlert status="warning">
          {getErrorMessage(orders.error, '주문을 불러오지 못했습니다.')} 아래
          숫자와 목록은 마지막으로 받은 값입니다.
        </InlineAlert>
      )}

      <div className={styles.filters}>
        <SegmentedTabs
          items={tabs}
          // 드롭다운 쪽 상태를 고르면 어느 탭도 켜지지 않는다.
          value={status ?? ALL}
          onChange={(next) => setParam('status', next)}
        />
        <div className={styles.dropdowns}>
          <Dropdown
            className={styles.field}
            label="선택 안 함"
            fieldLabel="다른 상태"
            size="small"
            options={otherStatusOptions}
            value={
              status && !(tabStatuses as readonly string[]).includes(status)
                ? status
                : undefined
            }
            onSelect={(next) => setParam('status', next)}
          />
          <Dropdown
            className={styles.field}
            label="모든 출처"
            fieldLabel="출처"
            size="small"
            options={sourceOptions}
            value={source}
            onSelect={(next) => setParam('source', next)}
          />
        </div>
      </div>

      <form className={styles.lookup} onSubmit={openByOrderId} noValidate>
        <Input
          label="주문 id로 바로 열기"
          size="small"
          value={lookup}
          error={lookupError}
          onChange={(event) => {
            setLookup(event.target.value)
            setLookupError(undefined)
          }}
        />
        <Button type="submit" size="small" variant="outline" color="cancel">
          열기
        </Button>
      </form>

      {step && selectable.length > 0 && (
        <div className={styles.selectionBar}>
          <span className={styles.selectionCount}>
            {formatNumber(selectedOrders.length)}건 선택됨
          </span>
          <Button
            size="small"
            disabled={selectedOrders.length === 0}
            onClick={() => {
              setBulkOrders(selectedOrders)
              setBulkKey((key) => key + 1)
              setBulkOpen(true)
            }}
          >
            선택한 {formatNumber(selectedOrders.length)}건 {step.label}
          </Button>
        </div>
      )}

      {orders.data && (
        <span className={styles.subText}>
          {status ? `${adminOrderStatusLabel[status]} ` : '전체 '}
          {formatNumber(orders.data.total)}건 · 최신 주문부터
        </span>
      )}

      <Table
        columns={columns}
        rows={rows}
        rowKey={(order) => order.orderId}
        onRowClick={(order) => navigate(adminOrderPath(order.orderId))}
        rowAction={{
          label: (order) => `주문 ${orderNo(order.orderId)} 상세 보기`,
          onClick: (order) => navigate(adminOrderPath(order.orderId)),
        }}
        loading={orders.isPending}
        loadingRows={10}
        emptyMessage={
          orders.isError
            ? getErrorMessage(orders.error, '주문을 불러오지 못했습니다.')
            : '조건에 맞는 주문이 없습니다.'
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

      {step && (
        <BulkShippingModal
          // 열 때마다 새로 — 지난 결과·사유가 남지 않게.
          key={bulkKey}
          open={bulkOpen}
          orders={bulkOrders}
          step={step}
          onClose={(finished) => {
            setBulkOpen(false)
            if (finished) setSelected(new Set())
          }}
          onShowNext={() => setParam('status', step.to)}
        />
      )}
    </div>
  )
}
