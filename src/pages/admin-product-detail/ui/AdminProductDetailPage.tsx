import { useEffect, useState } from 'react'

import { ChevronRight } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'

import {
  getAdminProduct,
  getAdminProductStock,
  getAdminProductStocks,
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
} from '@/entities/admin-product'
import { SegmentedTabs, Table, Tag } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'
import { AdminProductForm } from '@/widgets/admin-product-form'

import * as styles from './AdminProductDetailPage.css'

const tabs = [
  { value: 'edit', label: '수정' },
  { value: 'stock', label: '재고 조회' },
  { value: 'shipping', label: '배송 구간 설정' },
] as const

type TabValue = (typeof tabs)[number]['value']

const DEFAULT_TAB: TabValue = 'stock'

const isTabValue = (value: string | null): value is TabValue =>
  tabs.some((tab) => tab.value === value)

const numberFormatter = new Intl.NumberFormat('ko-KR')

export function AdminProductDetailPage() {
  const navigate = useNavigate()
  const { productId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab = isTabValue(tabParam) ? tabParam : DEFAULT_TAB

  const [product, setProduct] = useState<AdminProductDetailModel>()
  const [stockItems, setStockItems] = useState<AdminStockItemModel[]>([])
  const [error, setError] = useState<string>()
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
  const handleSubmit = (
    value: AdminProductFormValue,
    detail: AdminProductDetailModel,
  ) =>
    void updateAdminProduct(productId, toUpsertRequest(value))
      .then(() =>
        Promise.all(
          toStockRequests(value, detail).map((body) =>
            putAdminProductStock(productId, body),
          ),
        ),
      )
      .then(() => navigate('/admin/products'))
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
      render: (row) => numberFormatter.format(row.totalCount),
    },
    {
      key: 'price',
      header: '가격',
      align: 'center',
      render: (row) => `${numberFormatter.format(row.price)}원`,
    },
    {
      key: 'confirmedCount',
      header: '확정',
      align: 'center',
      render: (row) => `${numberFormatter.format(row.confirmedCount)}건`,
    },
    {
      key: 'remainingCount',
      header: '잔여',
      align: 'center',
      render: (row) => `${numberFormatter.format(row.remainingCount)}건`,
    },
  ]

  if (!product) {
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          {error ?? '불러오는 중입니다.'}
          <Link className={styles.breadcrumbLink} to="/admin/products">
            상품 관리로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link className={styles.breadcrumbLink} to="/admin/products">
          상품 관리
        </Link>
        <ChevronRight className={styles.breadcrumbIcon} aria-hidden="true" />
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

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

      <SegmentedTabs items={tabs} value={tab} onChange={setTab} />

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
          onSubmit={(value) => handleSubmit(value, product)}
          onCancel={() => navigate('/admin/products')}
          onPreview={() => navigate(`/products/${product.productId}`)}
        />
      )}

      {tab === 'shipping' && (
        // 배송 구간 설정은 아직 범위가 정해지지 않아 안내만 둔다.
        <div className={styles.placeholder}>
          배송 구간 설정 화면은 준비 중입니다.
        </div>
      )}
    </div>
  )
}
