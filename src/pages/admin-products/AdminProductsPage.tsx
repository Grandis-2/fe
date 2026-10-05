import { useEffect, useState } from 'react'

import { useNavigate } from 'react-router'

import {
  getAdminProducts,
  isPreorder,
  productTypeLabel,
  productTypeLabels,
  saleStatusColor,
  saleStatusLabel,
  saleStatusLabels,
  type AdminProduct,
  type AdminSaleStatus,
} from '@entities/admin-product'
import { ADMIN_PRODUCT_NEW_PATH, adminProductPath } from '@shared/config/routes'
import { Button, Dropdown, Input, SegmentedTabs, Table, Tag } from '@shared/ui'
import type { TableColumn, TagProps } from '@shared/ui'

import * as styles from './AdminProductsPage.css'

const typeTagProps: Record<
  'preorder' | 'normal',
  Pick<TagProps, 'variant' | 'color'>
> = {
  preorder: { variant: 'subtle', color: 'primary' },
  normal: { variant: 'outline', color: 'primary' },
}

const typeFilters = [
  { value: 'all', label: '전체' },
  { value: 'preorder', label: '사전 예약' },
  { value: 'normal', label: '일반 판매' },
] as const

type TypeFilter = (typeof typeFilters)[number]['value']

// 드롭다운은 문자열만 다루므로 라벨 ↔ 서버 enum을 여기서 이어준다.
const statusOptions = ['전체', ...Object.values(saleStatusLabel)]
const saleStatusByLabel = Object.fromEntries(
  Object.entries(saleStatusLabel).map(([status, label]) => [label, status]),
) as Record<string, AdminSaleStatus>

const sortOptions = ['오픈 시각순', '상품명순']

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'long',
  timeStyle: 'short',
})

export function AdminProductsPage() {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [keyword, setKeyword] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [status, setStatus] = useState<string>()
  const [sortOpen, setSortOpen] = useState(false)
  const [sort, setSort] = useState<string>()

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [error, setError] = useState<string>()

  // 검색어와 판매 상태는 서버가 걸러준다.
  const saleStatus = status ? saleStatusByLabel[status] : undefined
  const trimmedKeyword = keyword.trim()

  useEffect(() => {
    let cancelled = false

    getAdminProducts({
      saleStatus,
      q: trimmedKeyword || undefined,
      // 표가 자체적으로 페이지를 나누므로 넉넉히 한 번에 받는다.
      size: 100,
    })
      .then((paged) => {
        if (!cancelled) {
          setProducts(paged.items)
          setError(undefined)
        }
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message)
      })

    return () => {
      cancelled = true
    }
  }, [saleStatus, trimmedKeyword])

  const openDetail = (product: AdminProduct) =>
    navigate(adminProductPath(product.productId))

  // 유형과 정렬은 목록 응답에 해당 파라미터가 없어 화면에서 처리한다.
  const visibleProducts = products
    .filter(
      (product) =>
        typeFilter === 'all' ||
        isPreorder(product) === (typeFilter === 'preorder'),
    )
    .toSorted((a, b) =>
      sort === '상품명순'
        ? a.name.localeCompare(b.name)
        : a.openAt.localeCompare(b.openAt),
    )

  const columns: TableColumn<AdminProduct>[] = [
    {
      key: 'name',
      header: '상품명',
      render: (product) => (
        <span className={styles.productName}>{product.name}</span>
      ),
    },
    {
      key: 'type',
      header: '유형',
      align: 'center',
      render: (product) => (
        <Tag
          size="medium"
          rounded={false}
          widthOptions={productTypeLabels}
          {...typeTagProps[isPreorder(product) ? 'preorder' : 'normal']}
        >
          {productTypeLabel(product)}
        </Tag>
      ),
    },
    {
      key: 'option',
      header: '옵션',
      align: 'center',
      render: (product) => `${product.variantCount}종`,
    },
    {
      key: 'openAt',
      header: '오픈 시각',
      align: 'center',
      render: (product) =>
        isPreorder(product)
          ? dateFormatter.format(new Date(product.openAt))
          : '해당없음',
    },
    {
      key: 'detail',
      header: '상세 정보',
      align: 'center',
      render: (product) => (
        <Button
          size="small"
          variant="outline"
          color="cancel"
          onClick={() => openDetail(product)}
        >
          수정
        </Button>
      ),
    },
    {
      key: 'status',
      header: '상태',
      align: 'center',
      render: (product) => (
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          widthOptions={saleStatusLabels}
          color={saleStatusColor[product.saleStatus]}
        >
          {saleStatusLabel[product.saleStatus]}
        </Tag>
      ),
    },
  ]

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>상품 관리</div>
        <Button
          icon="plus"
          size="medium"
          onClick={() => navigate(ADMIN_PRODUCT_NEW_PATH)}
        >
          새 상품 등록
        </Button>
      </div>

      <div className={styles.toolbar}>
        <SegmentedTabs
          items={typeFilters}
          value={typeFilter}
          onChange={setTypeFilter}
        />

        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Input
              label="상품명 검색"
              size="small"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <Dropdown
            label="상태"
            size="medium"
            width="120px"
            options={statusOptions}
            open={statusOpen}
            selectedOption={status}
            onToggle={() => setStatusOpen((prev) => !prev)}
            onSelect={(option) => {
              setStatus(option === '전체' ? undefined : option)
              setStatusOpen(false)
            }}
          />
          <Dropdown
            label="오픈 시각순"
            size="medium"
            width="140px"
            options={sortOptions}
            open={sortOpen}
            selectedOption={sort}
            onToggle={() => setSortOpen((prev) => !prev)}
            onSelect={(option) => {
              setSort(option)
              setSortOpen(false)
            }}
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={visibleProducts}
        rowKey={(product) => product.productId}
        pageSize={10}
        onRowClick={openDetail}
        rowAction={{
          header: '관리',
          label: (product) =>
            `${product.name} ${productTypeLabel(product)} 상세 보기`,
          onClick: openDetail,
        }}
        emptyMessage={error ?? '조건에 맞는 상품이 없습니다.'}
      />
    </div>
  )
}
