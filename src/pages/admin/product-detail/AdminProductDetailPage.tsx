import { useState } from 'react'

import { useParams, useSearchParams } from 'react-router'

import {
  AdminProductDisplayTag,
  AdminProductSaleTag,
  brandNameOf,
  isPreorder,
  productTypeLabel,
  toPreviewProduct,
  useAdminProduct,
  useAdminShipmentBatches,
  type AdminProductDetailModel,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_PRODUCTS_PATH } from '@shared/config/routes'
import type { AdminProductTab } from '@shared/config/routes'
import {
  Breadcrumb,
  InlineAlert,
  PageSkeleton,
  SegmentedTabs,
  Tag,
} from '@shared/ui'
import {
  AdminProductActions,
  useProductSaleStatus,
  useProductVisibility,
} from '@widgets/admin/product-actions'
import { AdminProductEditForm } from '@widgets/admin/product-form'
import { AdminProductStockTable } from '@widgets/admin/product-stock'
import { AdminProductSummary } from '@widgets/admin/product-summary'
import { AdminShipmentBatches } from '@widgets/admin/shipment-batches'
import { ProductDetailPreviewModal } from '@widgets/product-detail'

import * as styles from './AdminProductDetailPage.css'

type Tab = { value: AdminProductTab; label: string }

/**
 * 판매 방식에 따라 탭이 갈린다. 배송 차수는 사전예약에만 있고(일반 판매는 순번도
 * 차수도 없다), 재고는 일반 상품만 센다(사전예약은 재고 API가 tracked false와 빈
 * 목록을 주고, 명세가 그때 재고 탭을 숨기라고 한다). 처음 여는 탭을 앞에 둔다.
 */
const tabsOf = (product: AdminProductDetailModel): Tab[] =>
  isPreorder(product)
    ? [
        { value: 'edit', label: '수정' },
        { value: 'shipping', label: '배송 구간' },
      ]
    : [
        { value: 'stock', label: '재고' },
        { value: 'edit', label: '수정' },
      ]

// 일반 상품은 재고 조회가, 사전예약은 재고 탭이 없어 수정이 처음 화면이다.
const defaultTabOf = (product: AdminProductDetailModel): AdminProductTab =>
  isPreorder(product) ? 'edit' : 'stock'

/**
 * 주소에서 상품과 탭만 읽고 화면을 조립한다. 데이터 조회·저장·에러 표시는
 * 각 탭의 위젯이 맡는다 — 탭 구성이 바뀌어도 위젯만 옮기면 된다.
 * 상품은 제목과 '어떤 탭을 보여줄지'(사전 예약 여부)를 정하는 데만 쓴다.
 */
export function AdminProductDetailPage() {
  const visibility = useProductVisibility()
  const saleStatus = useProductSaleStatus()
  const { productId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const product = useAdminProduct(productId)
  // 미리보기는 폼에 지금 있는 값으로 그린다 — 저장 전에 어떻게 보이는지 확인하려고 누른다.
  // 열려 있는 동안만 값이 있다. 배송 차수는 폼에 없어(배송 구간 탭) 저장된 것을 받는다.
  const [previewProduct, setPreviewProduct] =
    useState<ReturnType<typeof toPreviewProduct>>()
  const shipmentBatches = useAdminShipmentBatches(productId, {
    enabled: previewProduct?.saleMode === 'PREORDER',
  })

  if (!product.data) {
    // 불러오는 중이면 화면 모양을 먼저 깐다 — 실패일 때만 안내와 돌아갈 길을 보인다.
    if (!product.isError) {
      return (
        <div className={styles.root}>
          <PageSkeleton sections={2} fieldsPerSection={3} />
        </div>
      )
    }
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          {getErrorMessage(product.error, '상품을 불러오지 못했습니다.')}
          <Breadcrumb
            items={[{ label: '상품 관리로 돌아가기', to: ADMIN_PRODUCTS_PATH }]}
          />
        </div>
      </div>
    )
  }

  const visibleTabs = tabsOf(product.data)
  // 그 상품에 없는 탭(?tab=shipping인 일반 상품 등)으로 들어와도 기본 탭으로 보낸다.
  const tab =
    visibleTabs.find((item) => item.value === searchParams.get('tab'))?.value ??
    defaultTabOf(product.data)

  const setTab = (next: AdminProductTab) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    // 탭 전환마다 히스토리가 쌓이면 뒤로 가기로 목록에 못 돌아간다.
    setSearchParams(params, { replace: true })
  }

  const { name, status, campaign, displayStatus, brand, modelName } =
    product.data

  return (
    <div className={styles.root}>
      <Breadcrumb
        items={[
          { label: '상품 관리', to: ADMIN_PRODUCTS_PATH },
          { label: name },
        ]}
      />

      <div className={styles.titleRow}>
        <div className={styles.heading}>
          <div className={styles.titleLine}>
            <h1 className={styles.title}>{name}</h1>
            <AdminProductSaleTag status={status} stage={campaign?.status} />
            {/* 상태 뱃지끼리 붙여 둔다 — 판매와 전시는 둘 다 '지금 어떤 상태인가'다. */}
            <AdminProductDisplayTag status={displayStatus} />
          </div>
          <div className={styles.meta}>
            {[brandNameOf(brand), modelName].filter(Boolean).join(' · ')}
            <Tag
              size="small"
              color={isPreorder(product.data) ? 'preorder' : 'gray'}
              variant="subtle"
            >
              {productTypeLabel(product.data)}
            </Tag>
          </div>
        </div>
        {/* 전환은 폼 저장과 별개 요청이라 탭 밖(제목 줄)에 둔다 — 어느 탭에 있든
            같은 자리에서 누를 수 있고, 저장 버튼과 섞이지 않는다. 사전예약 오픈 3분
            전부터 수정 폼이 잠겨도 이 메뉴는 열린다(회차 취소는 오픈 뒤에만 된다). */}
        <AdminProductActions
          className={styles.actions}
          product={product.data}
          pending={visibility.isPending || saleStatus.isPending}
          onPublish={visibility.confirmPublish}
          onHide={visibility.confirmHide}
          onPause={saleStatus.confirmPause}
          onResume={saleStatus.confirmResume}
          onCancel={saleStatus.confirmCancel}
          onCloseEarly={saleStatus.confirmCloseEarly}
        />
      </div>

      <AdminProductSummary product={product.data} />

      {visibility.isError && (
        <InlineAlert status="error">
          {getErrorMessage(visibility.error, '전시 상태를 바꾸지 못했습니다.')}
        </InlineAlert>
      )}
      {saleStatus.isError && (
        <InlineAlert status="error">
          {getErrorMessage(saleStatus.error, '판매 상태를 바꾸지 못했습니다.')}
        </InlineAlert>
      )}

      <SegmentedTabs items={visibleTabs} value={tab} onChange={setTab} />

      {tab === 'stock' && <AdminProductStockTable productId={productId} />}

      {tab === 'edit' && (
        <AdminProductEditForm
          productId={productId}
          onPreview={(value) => setPreviewProduct(toPreviewProduct(value))}
          onEditShipmentBatches={() => setTab('shipping')}
        />
      )}

      {tab === 'shipping' && <AdminShipmentBatches productId={productId} />}

      <ProductDetailPreviewModal
        product={previewProduct}
        shipmentBatches={shipmentBatches.data}
        onClose={() => setPreviewProduct(undefined)}
      />
    </div>
  )
}
