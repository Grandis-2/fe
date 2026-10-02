import { useEffect, useState } from 'react'

import { useNavigate, useParams, useSearchParams } from 'react-router'

import {
  getAdminProduct,
  getAdminProductStock,
  getAdminProductStocks,
  isPreorder,
  putAdminProductStock,
  saleStatusColor,
  saleStatusLabel,
  toFormValue,
  toStockRequests,
  toUpsertRequest,
  updateAdminProduct,
  type AdminProductDetailModel,
  type AdminProductFormValue,
  type AdminProductStock,
  type AdminStockItemModel,
} from '@entities/admin-product'
import { ADMIN_PRODUCTS_PATH, productPath } from '@shared/config/routes'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { Button, SegmentedTabs, Table, Tag } from '@shared/ui'
import type { TableColumn } from '@shared/ui'
import { AdminBreadcrumb } from '@widgets/admin-breadcrumb'
import { AdminDispatchWindows } from '@widgets/admin-dispatch-windows'
import { AdminProductForm } from '@widgets/admin-product-form'

import * as styles from './AdminProductDetailPage.css'

const tabs = [
  { value: 'edit', label: '수정' },
  { value: 'stock', label: '재고 조회' },
  { value: 'shipping', label: '배송 구간 설정' },
] as const

type TabValue = (typeof tabs)[number]['value']

const DEFAULT_TAB: TabValue = 'stock'

// 배송 차수는 사전 예약에만 있다 — 일반 판매는 순번도 차수도 없다.
const tabsOf = (product: AdminProductDetailModel | undefined) =>
  product && isPreorder(product)
    ? tabs
    : tabs.filter((item) => item.value !== 'shipping')

export function AdminProductDetailPage() {
  const navigate = useNavigate()
  const { productId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [product, setProduct] = useState<AdminProductDetailModel>()
  const visibleTabs = tabsOf(product)
  // 일반 판매 상품에 ?tab=shipping으로 들어와도 기본 탭으로 보낸다.
  const tab =
    visibleTabs.find((item) => item.value === searchParams.get('tab'))?.value ??
    DEFAULT_TAB
  const [stockItems, setStockItems] = useState<AdminStockItemModel[]>([])
  const [error, setError] = useState<string>()
  // 배송 구간 편집 버튼이 탭과 같은 줄에 있어서 상태를 여기서 든다.
  const [dispatchEditing, setDispatchEditing] = useState(false)
  useEffect(() => {
    let cancelled = false

    Promise.all([getAdminProduct(productId), getAdminProductStock(productId)])
      .then(([detail, stock]) => {
        if (cancelled) return
        setProduct(detail)
        setStockItems(stock.items)
        setError(undefined)
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message)
      })

    return () => {
      cancelled = true
    }
  }, [productId])

  const setTab = (next: TabValue) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    // 탭 전환마다 히스토리가 쌓이면 뒤로 가기로 목록에 못 돌아간다.
    setSearchParams(params, { replace: true })
  }

  /**
   * 상품 본문과 재고를 함께 저장한다.
   * ProductUpsert에는 수량 필드가 없어서 조합별 수량은 재고 API로 따로 보낸다.
   */
  const handleSubmit = (value: AdminProductFormValue) =>
    // PATCH가 variant 코드를 새로 만들므로, 재고는 반드시 그 응답을 기준으로
    // 보낸다. 수정 전 detail의 코드로 보내면 새 variant에 재고가 안 붙는다.
    void updateAdminProduct(productId, toUpsertRequest(value))
      .then((updated) =>
        Promise.all(
          toStockRequests(value, updated).map((body) =>
            putAdminProductStock(productId, body),
          ),
        ),
      )
      .then(() => navigate(ADMIN_PRODUCTS_PATH))
      .catch((cause: Error) => setError(cause.message))

  const stockColumns: TableColumn<AdminProductStock>[] = [
    {
      key: 'color',
      header: '색상',
      align: 'center',
      render: (row) => row.color,
    },
    {
      key: 'capacity',
      header: '용량',
      align: 'center',
      render: (row) => row.capacity,
    },
    {
      key: 'totalCount',
      header: '총수량',
      align: 'center',
      render: (row) => formatNumber(row.totalCount),
    },
    {
      key: 'price',
      header: '가격',
      align: 'center',
      render: (row) => formatWon(row.price),
    },
    {
      key: 'confirmedCount',
      // 같은 reservedQuantity지만 일반 판매에는 '확정' 단계가 없어 팔린 수량으로 읽힌다.
      header: product && isPreorder(product) ? '확정' : '판매',
      align: 'center',
      render: (row) => `${formatNumber(row.confirmedCount)}건`,
    },
    {
      key: 'remainingCount',
      header: '잔여',
      align: 'center',
      render: (row) => `${formatNumber(row.remainingCount)}건`,
    },
  ]

  if (!product) {
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          {error ?? '불러오는 중입니다.'}
          <AdminBreadcrumb
            items={[{ label: '상품 관리로 돌아가기', to: ADMIN_PRODUCTS_PATH }]}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <AdminBreadcrumb
        items={[
          { label: '상품 관리', to: ADMIN_PRODUCTS_PATH },
          { label: product.name },
        ]}
      />

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{product.name}</h1>
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          color={saleStatusColor[product.saleStatus]}
        >
          {saleStatusLabel[product.saleStatus]}
        </Tag>
      </div>

      <div className={styles.tabRow}>
        <SegmentedTabs items={visibleTabs} value={tab} onChange={setTab} />

        {/* 오픈 이후에는 배송 기준과 기존 배정을 바꾸지 않는다. */}
        {tab === 'shipping' &&
          !dispatchEditing &&
          product.saleStatus !== 'OPEN' && (
            <Button size="small" onClick={() => setDispatchEditing(true)}>
              수정하기
            </Button>
          )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {tab === 'stock' && (
        <Table
          columns={stockColumns}
          rows={getAdminProductStocks(product, stockItems)}
          rowKey={(row) => row.optionCode}
          pageSize={10}
          emptyMessage="등록된 재고가 없습니다."
        />
      )}

      {tab === 'edit' && (
        <AdminProductForm
          mode="edit"
          defaultValue={toFormValue(product, stockItems)}
          onSubmit={handleSubmit}
          onCancel={() => navigate(ADMIN_PRODUCTS_PATH)}
          onPreview={() => navigate(productPath(product.productId))}
        />
      )}

      {tab === 'shipping' && (
        <AdminDispatchWindows
          productId={product.productId}
          editing={dispatchEditing}
          onEditingChange={setDispatchEditing}
        />
      )}
    </div>
  )
}
