import { ChevronRight } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'

import {
  adminProductStatusColor,
  adminProductStatusLabel,
  findAdminProduct,
  getAdminProductStocks,
  type AdminProductStock,
} from '@/entities/admin-product'
import { SegmentedTabs, Table, Tag } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'
import {
  AdminProductForm,
  createEmptyProductFormValue,
} from '@/widgets/admin-product-form'
import type { AdminProductFormValue } from '@/widgets/admin-product-form'

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

const stockColumns: TableColumn<AdminProductStock>[] = [
  { key: 'color', header: '색상', align: 'center', render: (row) => row.color },
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

export function AdminProductDetailPage() {
  const navigate = useNavigate()
  const { productId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab = isTabValue(tabParam) ? tabParam : DEFAULT_TAB

  const setTab = (next: TabValue) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    // 탭 전환마다 히스토리가 쌓이면 뒤로 가기로 목록에 못 돌아간다.
    setSearchParams(params, { replace: true })
  }

  const product = findAdminProduct(productId)

  if (!product) {
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          찾을 수 없는 상품입니다.
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
          color={adminProductStatusColor[product.status]}
        >
          {adminProductStatusLabel[product.status]}
        </Tag>
      </div>

      <SegmentedTabs items={tabs} value={tab} onChange={setTab} />

      {tab === 'stock' && (
        <Table
          columns={stockColumns}
          rows={getAdminProductStocks(product)}
          rowKey={(row) => row.id}
          pageSize={10}
          emptyMessage="등록된 재고가 없습니다."
        />
      )}

      {tab === 'edit' && (
        <AdminProductForm
          mode="edit"
          // ponytail: 상세 조회 API가 붙으면 서버 값을 폼 값으로 변환해 넘긴다.
          defaultValue={{
            ...createEmptyProductFormValue(),
            name: product.name,
            isPreorder: product.type === 'preorder',
          }}
          onSubmit={(value: AdminProductFormValue) =>
            console.info('상품 수정', value)
          }
          onCancel={() => navigate('/admin/products')}
          onPreview={(value: AdminProductFormValue) =>
            console.info('미리보기', value)
          }
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
