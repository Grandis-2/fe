import { useNavigate, useParams, useSearchParams } from 'react-router'

import {
  isPreorder,
  saleStatusColor,
  saleStatusLabel,
  useAdminProduct,
  type AdminProductDetailModel,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_PRODUCTS_PATH, productPath } from '@shared/config/routes'
import type { AdminProductTab } from '@shared/config/routes'
import { Breadcrumb, InlineAlert, SegmentedTabs, Tag } from '@shared/ui'
import { AdminDispatchWindows } from '@widgets/admin/dispatch-windows'
import { AdminProductEditForm } from '@widgets/admin/product-form'
import { AdminProductStockTable } from '@widgets/admin/product-stock'
import {
  AdminProductVisibility,
  useProductVisibility,
} from '@widgets/admin/product-visibility'

import * as styles from './AdminProductDetailPage.css'

const tabs: { value: AdminProductTab; label: string }[] = [
  { value: 'edit', label: '수정' },
  { value: 'stock', label: '재고 조회' },
  { value: 'shipping', label: '배송 구간 설정' },
]

const DEFAULT_TAB: AdminProductTab = 'stock'

// 배송 차수는 사전 예약에만 있다 — 일반 판매는 순번도 차수도 없다.
const tabsOf = (product: AdminProductDetailModel) =>
  isPreorder(product) ? tabs : tabs.filter((item) => item.value !== 'shipping')

/**
 * 주소에서 상품과 탭만 읽고 화면을 조립한다. 데이터 조회·저장·에러 표시는
 * 각 탭의 위젯이 맡는다 — 탭 구성이 바뀌어도 위젯만 옮기면 된다.
 * 상품은 제목과 '어떤 탭을 보여줄지'(사전 예약 여부)를 정하는 데만 쓴다.
 */
export function AdminProductDetailPage() {
  const navigate = useNavigate()
  const visibility = useProductVisibility()
  const { productId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const product = useAdminProduct(productId)

  if (!product.data) {
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          {product.isError
            ? getErrorMessage(product.error, '상품을 불러오지 못했습니다.')
            : '불러오는 중입니다.'}
          <Breadcrumb
            items={[{ label: '상품 관리로 돌아가기', to: ADMIN_PRODUCTS_PATH }]}
          />
        </div>
      </div>
    )
  }

  const visibleTabs = tabsOf(product.data)
  // 일반 판매 상품에 ?tab=shipping으로 들어와도 기본 탭으로 보낸다.
  const tab =
    visibleTabs.find((item) => item.value === searchParams.get('tab'))?.value ??
    DEFAULT_TAB

  const setTab = (next: AdminProductTab) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    // 탭 전환마다 히스토리가 쌓이면 뒤로 가기로 목록에 못 돌아간다.
    setSearchParams(params, { replace: true })
  }

  const { name, saleStatus, displayStatus } = product.data

  return (
    <div className={styles.root}>
      <Breadcrumb
        items={[
          { label: '상품 관리', to: ADMIN_PRODUCTS_PATH },
          { label: name },
        ]}
      />

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{name}</h1>
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          color={saleStatusColor[saleStatus]}
        >
          {saleStatusLabel[saleStatus]}
        </Tag>
        {/* 전시 전환은 폼 저장과 별개 요청이라 탭 밖(제목 줄)에 둔다 —
            어느 탭에 있든 같은 자리에서 누를 수 있고, 저장 버튼과 섞이지 않는다. */}
        <AdminProductVisibility
          className={styles.visibility}
          product={{ productId, name, displayStatus }}
          pending={visibility.isPending}
          onPublish={visibility.confirmPublish}
          onHide={visibility.confirmHide}
        />
      </div>

      {visibility.isError && (
        <InlineAlert status="error">
          {getErrorMessage(visibility.error, '전시 상태를 바꾸지 못했습니다.')}
        </InlineAlert>
      )}

      <SegmentedTabs items={visibleTabs} value={tab} onChange={setTab} />

      {tab === 'stock' && <AdminProductStockTable productId={productId} />}

      {tab === 'edit' && (
        <AdminProductEditForm
          productId={productId}
          onSaved={() => navigate(ADMIN_PRODUCTS_PATH)}
          onCancel={() => navigate(ADMIN_PRODUCTS_PATH)}
          onPreview={() => navigate(productPath(productId))}
        />
      )}

      {tab === 'shipping' && <AdminDispatchWindows productId={productId} />}
    </div>
  )
}
