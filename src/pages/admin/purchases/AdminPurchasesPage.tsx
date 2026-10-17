import { useNavigate, useSearchParams } from 'react-router'

import {
  adminOrderSourceLabel,
  adminOrderSources,
  adminOrderStatusColor,
  adminOrderStatuses,
  adminOrderStatusLabel,
  adminOrderStatusLabels,
  orderNo,
  type AdminOrder,
  type AdminOrderSource,
  type AdminOrderStatus,
  useAdminOrders,
} from '@entities/admin-order'
import { getErrorMessage } from '@shared/api/client'
import { adminPurchasePath } from '@shared/config/routes'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import {
  Dropdown,
  InlineAlert,
  Navigator,
  SegmentedTabs,
  Table,
  Tag,
} from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './AdminPurchasesPage.css'

const PAGE_SIZE = 20
const ALL = 'all'

const sourceTabs = [
  { value: ALL, label: '전체' },
  ...adminOrderSources.map((source) => ({
    value: source,
    label: adminOrderSourceLabel[source],
  })),
]

const statusOptions = [
  { value: ALL, label: '모든 상태' },
  ...adminOrderStatuses.map((status) => ({
    value: status,
    label: adminOrderStatusLabel[status],
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

const itemsLabel = ({ items }: AdminOrder) => {
  const [first, ...rest] = items
  if (!first) return '—'
  const name = `${first.productTitle} · ${first.optionTitle}`
  return rest.length > 0 ? `${name} 외 ${rest.length}건` : name
}

const columns: TableColumn<AdminOrder>[] = [
  {
    key: 'no',
    header: '주문 번호',
    render: (order) => (
      <span className={styles.orderNo}>{orderNo(order.orderId)}</span>
    ),
  },
  { key: 'items', header: '상품', render: itemsLabel },
  { key: 'name', header: '받는 사람', render: (order) => order.shipTo.name },
  {
    key: 'source',
    header: '출처',
    align: 'center',
    render: (order) => adminOrderSourceLabel[order.source],
  },
  {
    key: 'amount',
    header: '금액',
    align: 'right',
    render: (order) => formatWon(order.totalAmount),
  },
  {
    key: 'createdAt',
    header: '주문 시각',
    align: 'center',
    render: (order) => formatDotDateTime(order.createdAt),
  },
  {
    key: 'status',
    header: '상태',
    align: 'center',
    render: (order) => (
      <Tag
        variant="subtle"
        size="medium"
        rounded={false}
        widthOptions={adminOrderStatusLabels}
        color={adminOrderStatusColor[order.status]}
      >
        {adminOrderStatusLabel[order.status]}
      </Tag>
    ),
  },
]

/**
 * 모든 회원의 주문. 출처·상태·쪽은 주소에 둬서 상세에 들어갔다 돌아와도 보던 자리가
 * 남는다. 배송을 시작할 수 있는 건 '결제 완료' 주문이다.
 */
export function AdminPurchasesPage() {
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
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const orders = useAdminOrders({
    source,
    status,
    page: page - 1,
    size: PAGE_SIZE,
  })
  const totalPages = orders.data ? Math.ceil(orders.data.total / PAGE_SIZE) : 0

  // 필터를 바꾸면 첫 쪽부터 본다.
  const setParam = (key: 'source' | 'status' | 'page', value: string) =>
    setSearchParams(
      (prev) => {
        if (value === ALL || (key === 'page' && value === '1')) prev.delete(key)
        else prev.set(key, value)
        if (key !== 'page') prev.delete('page')
        return prev
      },
      { replace: true },
    )

  return (
    <div className={styles.root}>
      <div className={styles.title}>주문 관리</div>

      <SegmentedTabs
        items={sourceTabs}
        value={source ?? ALL}
        onChange={(next) => setParam('source', next)}
      />

      <div className={styles.filters}>
        <Dropdown
          label="상태"
          size="small"
          width="160px"
          options={statusOptions}
          value={status ?? ALL}
          onSelect={(next) => setParam('status', next)}
        />
        {orders.data && (
          <span className={styles.count}>
            전체 {formatNumber(orders.data.total)}건
          </span>
        )}
      </div>

      {/* 다시 받기가 실패해도 이전 목록은 남는다 — 멈춘 목록을 최신으로 읽지 않게 알린다. */}
      {orders.isError && orders.data && (
        <InlineAlert status="warning">
          {getErrorMessage(orders.error, '주문을 불러오지 못했습니다.')} 아래
          목록은 마지막으로 받은 값입니다.
        </InlineAlert>
      )}

      <Table
        columns={columns}
        rows={orders.data?.items ?? []}
        rowKey={(order) => order.orderId}
        onRowClick={(order) => navigate(adminPurchasePath(order.orderId))}
        rowAction={{
          label: (order) => `주문 ${orderNo(order.orderId)} 상세 보기`,
          onClick: (order) => navigate(adminPurchasePath(order.orderId)),
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
    </div>
  )
}
