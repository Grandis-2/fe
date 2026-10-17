import { useState } from 'react'

import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router'

import {
  AdminProductDisplayTag,
  AdminProductSaleTag,
  isPreorder,
  productTypeLabel,
  productTypeLabels,
  saleStateLabel,
  useAdminProducts,
  type AdminProduct,
  type AdminSaleState,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_PRODUCT_NEW_PATH, adminProductPath } from '@shared/config/routes'
import { Button, Dropdown, Input, SegmentedTabs, Table, Tag } from '@shared/ui'
import type { DropdownOption, TableColumn, TagProps } from '@shared/ui'

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

// 값이 undefined면 '전체' — 서버에 판매 상태를 안 보낸다.
const statusOptions: DropdownOption<AdminSaleState | undefined>[] = [
  { label: '전체', value: undefined },
  ...Object.entries(saleStateLabel).map(([value, label]) => ({
    label,
    value: value as AdminSaleState,
  })),
]

type ProductSort = 'openAt' | 'name'

const sortOptions: DropdownOption<ProductSort>[] = [
  { label: '오픈 시각순', value: 'openAt' },
  { label: '상품명순', value: 'name' },
]

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'long',
  timeStyle: 'short',
})

/**
 * 상품 목록. 검색어·판매 상태는 서버가 걸러주고, 유형과 정렬은 응답에 해당
 * 파라미터가 없어 화면에서 처리한다.
 */
export function AdminProductsPage() {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [keyword, setKeyword] = useState('')
  const [saleStatus, setSaleStatus] = useState<AdminSaleState>()
  const [sort, setSort] = useState<ProductSort>('openAt')

  // 검색어와 유형은 서버가 걸러준다.
  const trimmedKeyword = keyword.trim()

  const {
    data: products = [],
    isPending,
    isError,
    error,
  } = useAdminProducts({
    q: trimmedKeyword || undefined,
    status: saleStatus,
    saleMode:
      typeFilter === 'all'
        ? undefined
        : typeFilter === 'preorder'
          ? 'PREORDER'
          : 'IN_STOCK',
    // 표가 자체적으로 페이지를 나누므로 넉넉히 한 번에 받는다.
    size: 100,
  })

  // 행 클릭·'관리'는 상세 보기라 기본 탭으로, '수정' 버튼은 이름 그대로 수정 탭으로 보낸다.
  const openDetail = (product: AdminProduct) =>
    navigate(adminProductPath(product.productId))

  const openEdit = (product: AdminProduct) =>
    navigate(adminProductPath(product.productId, 'edit'))

  /**
   * 검색어·유형·판매 상태는 서버가 걸러주고 정렬만 화면에서 한다 — 목록은 등록
   * 최신순 하나만 지원한다.
   *
   * 오픈 시각이 없는 상품(일반 판매)은 뒤로 모은다 — 빈 값끼리는 순서를 바꾸지 않아
   * 서버가 준 등록 최신순이 남는다.
   */
  const visibleProducts = products.toSorted((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (!a.opensAt || !b.opensAt) return Number(!a.opensAt) - Number(!b.opensAt)
    return a.opensAt.localeCompare(b.opensAt)
  })

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
      render: (product) => `${product.optionCount}종`,
    },
    {
      key: 'openAt',
      header: '오픈 시각',
      align: 'center',
      render: (product) =>
        product.opensAt
          ? dateFormatter.format(new Date(product.opensAt))
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
          // 행 클릭(onRowClick)이 같이 돌면 기본 탭으로 덮어쓴다 — 여기서 끊는다.
          onClick={(event) => {
            event.stopPropagation()
            openEdit(product)
          }}
        >
          수정
        </Button>
      ),
    },
    {
      key: 'status',
      header: '상태',
      align: 'center',
      // 사전예약은 접수 단계도 같이 — 판매 상태와 다른 축이라 하나로 못 합친다.
      render: (product) => (
        <AdminProductSaleTag
          status={product.status}
          stage={product.preorderStatus}
        />
      ),
    },
    {
      key: 'display',
      header: '전시',
      align: 'center',
      // 상태만 보여준다 — 바꾸는 건 상세 화면에서 한다. 되돌리기 어려운 조치라
      // 목록의 다른 동작 버튼('수정') 옆에 나란히 두면 잘못 누르기 쉽다.
      render: (product) => (
        <AdminProductDisplayTag status={product.displayStatus} />
      ),
    },
  ]

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>상품 관리</div>
        <Button
          icon={Plus}
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
            value={saleStatus}
            onSelect={setSaleStatus}
          />
          <Dropdown
            label="오픈 시각순"
            size="medium"
            width="140px"
            options={sortOptions}
            value={sort}
            onSelect={setSort}
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
