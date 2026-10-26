import { useState } from 'react'

import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router'

import {
  AdminProductDisplayTag,
  AdminProductSaleTag,
  brandFilterOptions,
  brandNameOf,
  isPreorder,
  productTypeLabel,
  productTypeLabels,
  saleStateLabel,
  useAdminProductCount,
  useAdminProducts,
  type AdminProduct,
  type AdminSaleState,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_PRODUCT_NEW_PATH, adminProductPath } from '@shared/config/routes'
import { formatWon } from '@shared/lib/formatNumber'
import {
  Button,
  Dropdown,
  ImageWithFallback,
  Input,
  PriceText,
  SegmentedTabs,
  Table,
  Tag,
} from '@shared/ui'
import type { DropdownOption, TableColumn } from '@shared/ui'

import * as styles from './AdminProductsPage.css'

const typeFilters = [
  { value: 'all', label: '전체', saleMode: undefined },
  { value: 'preorder', label: '사전예약', saleMode: 'PREORDER' },
  { value: 'normal', label: '일반 판매', saleMode: 'IN_STOCK' },
] as const

type TypeFilter = (typeof typeFilters)[number]['value']

type Brand = (typeof brandFilterOptions)[number]['value']

const brandOptions: DropdownOption<Brand | undefined>[] = [
  { label: '전체 브랜드', value: undefined },
  ...brandFilterOptions,
]

// 값이 undefined면 '전체' — 서버에 판매 상태를 안 보낸다.
const statusOptions: DropdownOption<AdminSaleState | undefined>[] = [
  { label: '전체 판매 상태', value: undefined },
  ...Object.entries(saleStateLabel).map(([value, label]) => ({
    label,
    value: value as AdminSaleState,
  })),
]

type ProductSort = 'latest' | 'openAt' | 'name'

const sortOptions: DropdownOption<ProductSort>[] = [
  { label: '최근 등록순', value: 'latest' },
  { label: '오픈 임박순', value: 'openAt' },
  { label: '상품명순', value: 'name' },
]

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** 사전예약 접수 단계 옆에 붙일 시각 — 오픈 전이면 오픈, 그 뒤면 마감 */
const scheduleLabel = (product: AdminProduct) => {
  if (product.preorderStatus === 'BEFORE_OPEN' && product.opensAt) {
    return `${dateFormatter.format(new Date(product.opensAt))} 오픈`
  }
  if (product.preorderStatus && product.closesAt) {
    return `${dateFormatter.format(new Date(product.closesAt))} 마감`
  }
  return null
}

/**
 * 상품 목록. 검색어·브랜드·판매 상태·판매 방식은 서버가 걸러 준다. 정렬은 서버가 최근
 * 등록순만 지원해서, 조건에 맞는 상품을 전부 받아 화면이 정렬하고 10개씩 나눠 보인다.
 */
export function AdminProductsPage() {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [keyword, setKeyword] = useState('')
  const [brand, setBrand] = useState<Brand>()
  const [saleStatus, setSaleStatus] = useState<AdminSaleState>()
  const [sort, setSort] = useState<ProductSort>('latest')

  // 탭 건수도 같은 검색·브랜드·판매 상태로 센다 — 표와 숫자가 어긋나지 않게.
  const filters = {
    q: keyword.trim() || undefined,
    brand,
    status: saleStatus,
  }
  const counts = {
    all: useAdminProductCount(filters).data,
    preorder: useAdminProductCount({ ...filters, saleMode: 'PREORDER' }).data,
    normal: useAdminProductCount({ ...filters, saleMode: 'IN_STOCK' }).data,
  }
  const saleMode = typeFilters.find(
    (filter) => filter.value === typeFilter,
  )?.saleMode

  const {
    data: products = [],
    isPending,
    isError,
    error,
  } = useAdminProducts({ ...filters, saleMode })

  // 오픈 시각이 없는 상품(일반 판매)은 뒤로 모은다 — 빈 값끼리는 순서를 바꾸지 않아
  // 서버가 준 최근 등록순이 남는다.
  const visibleProducts =
    sort === 'latest'
      ? products
      : products.toSorted((a, b) => {
          if (sort === 'name') return a.name.localeCompare(b.name)
          if (!a.opensAt || !b.opensAt) {
            return Number(!a.opensAt) - Number(!b.opensAt)
          }
          return a.opensAt.localeCompare(b.opensAt)
        })
  const total = counts[typeFilter]

  const openDetail = (product: AdminProduct) =>
    navigate(adminProductPath(product.productId))

  const tabs = typeFilters.map(({ value, label }) => ({
    value,
    label: (
      <span className={styles.tabLabel}>
        {label}
        {/* 못 받았으면 숫자를 빼서 0개로 읽히지 않게 한다. */}
        {counts[value] !== undefined && (
          <span className={styles.tabCount}>
            {counts[value].toLocaleString('ko-KR')}
          </span>
        )}
      </span>
    ),
  }))

  const columns: TableColumn<AdminProduct>[] = [
    // 이름 아래 브랜드·모델명 — 함께 읽는 값을 한 칸에 묶어 열을 줄인다.
    {
      key: 'product',
      header: '상품',
      render: (product) => (
        <span className={styles.product}>
          <ImageWithFallback
            className={styles.thumbnail}
            src={product.thumbnailUrl}
            alt=""
          />
          <span className={styles.stacked}>
            <span className={styles.mainText}>{product.name}</span>
            <span className={styles.subText}>
              {brandNameOf(product.brand) || product.brand} ·{' '}
              {product.modelName}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'type',
      header: '판매 방식',
      render: (product) => (
        <Tag
          size="medium"
          variant="subtle"
          rounded={false}
          color={isPreorder(product) ? 'primary' : 'gray'}
          widthOptions={productTypeLabels}
        >
          {productTypeLabel(product)}
        </Tag>
      ),
    },
    {
      key: 'price',
      header: '판매가',
      align: 'right',
      render: (product) =>
        product.minPrice === null ? (
          <span className={styles.subText}>—</span>
        ) : (
          <span className={styles.stacked}>
            <span className={styles.mainText}>
              <PriceText value={formatWon(product.minPrice)} from />
            </span>
            {product.soldOut ? (
              <span className={styles.soldOut}>품절</span>
            ) : (
              product.discountRate > 0 &&
              product.minListPrice !== null && (
                <span className={styles.subText}>
                  정가 {formatWon(product.minListPrice)} ·{' '}
                  {product.discountRate}% 할인
                </span>
              )
            )}
          </span>
        ),
    },
    {
      key: 'option',
      header: '옵션',
      align: 'right',
      render: (product) => (
        <span className={styles.number}>{product.optionCount}종</span>
      ),
    },
    // 사전예약은 접수 단계 태그 아래에 오픈·마감 시각 — 오픈 시각 열을 따로 두지 않는다.
    {
      key: 'sale',
      header: '판매',
      render: (product) => {
        const schedule = scheduleLabel(product)
        return (
          <span className={styles.stacked}>
            <span>
              <AdminProductSaleTag
                status={product.status}
                stage={product.preorderStatus}
              />
            </span>
            {schedule && <span className={styles.subText}>{schedule}</span>}
          </span>
        )
      },
    },
    {
      key: 'display',
      header: '전시',
      // 상태만 보여준다 — 바꾸는 건 상세 화면에서 한다(되돌리기 어려운 조치라 목록에서
      // 잘못 누르지 않게).
      render: (product) => (
        <AdminProductDisplayTag status={product.displayStatus} />
      ),
    },
  ]

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>상품 관리</h1>
        <Button
          icon={Plus}
          size="medium"
          onClick={() => navigate(ADMIN_PRODUCT_NEW_PATH)}
        >
          새 상품 등록
        </Button>
      </header>

      <SegmentedTabs items={tabs} value={typeFilter} onChange={setTypeFilter} />

      <div className={styles.filters}>
        <div className={styles.searchField}>
          <Input
            label="상품명 · 모델명 · 태그 검색"
            size="small"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <Dropdown
          className={styles.field}
          label="전체 브랜드"
          fieldLabel="브랜드"
          options={brandOptions}
          value={brand}
          onSelect={setBrand}
        />
        <Dropdown
          className={styles.field}
          label="전체 판매 상태"
          fieldLabel="판매 상태"
          options={statusOptions}
          value={saleStatus}
          onSelect={setSaleStatus}
        />
        <Dropdown
          className={styles.field}
          label="정렬"
          fieldLabel="정렬"
          options={sortOptions}
          value={sort}
          onSelect={setSort}
        />
      </div>

      {total !== undefined && total > products.length && (
        <div className={styles.subText}>
          전체 {total.toLocaleString('ko-KR')}개 중 최근{' '}
          {products.length.toLocaleString('ko-KR')}개만 표시합니다.
        </div>
      )}

      <Table
        columns={columns}
        rows={visibleProducts}
        rowKey={(product) => product.productId}
        pageSize={10}
        onRowClick={openDetail}
        rowAction={{
          label: (product) => `${product.name} 상세 보기`,
          onClick: openDetail,
        }}
        loading={isPending}
        emptyMessage={
          isError
            ? getErrorMessage(error, '상품을 불러오지 못했습니다.')
            : '조건에 맞는 상품이 없습니다.'
        }
      />
    </div>
  )
}
