import type { CSSProperties } from 'react'

import { useNavigate, useParams } from 'react-router'

import {
  ProductColorSwatches,
  ProductOptionSelector,
  useProduct,
  useShipmentBatches,
  type Product,
  type ShipmentBatch,
} from '@entities/product'
import { mockReviews, ReviewCard } from '@entities/review'
import { useRequireLogin } from '@features/login'
import { usePreorderSubmit } from '@features/preorder-queue'
import { ProductGallery } from '@features/product-gallery'
import {
  PREORDER_BENEFIT_RATE,
  PurchaseSummary,
  QuantityControl,
  useProductPurchase,
  type PurchaseDraft,
} from '@features/product-purchase'
import { PAYMENT_PATH, productPath, resultPath } from '@shared/config/routes'
import { formatWon } from '@shared/lib/formatNumber'
import { ActionButton, InlineAlert } from '@shared/ui'
import { ProductPageTab } from '@widgets/product-page-tab'
import type { ProductPageTabKey } from '@widgets/product-page-tab'
import { ProductPurchaseBar } from '@widgets/product-purchase-bar'

import * as styles from './ProductDetailPage.css'
import { useProductDetailScroll } from './useProductDetailScroll'

const SECTION_LABELS: Record<ProductPageTabKey, string> = {
  benefits: '구매 혜택',
  info: '모델 정보',
  notice: '유의 사항',
  review: '구매 후기',
}

// 고른 색상의 사진 묶음 — 색상 묶음이 없으면 기본 묶음(''), 그것도 없으면 첫 묶음.
function galleryImages(product: Product, colorValue: string | undefined) {
  const { gallery } = product.images
  const bundle =
    gallery.find(({ bundleKey }) => bundleKey === colorValue) ??
    gallery.find(({ bundleKey }) => bundleKey === '') ??
    gallery[0]
  return [...(bundle?.items ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(({ url }) => url)
}

// 구매자는 자기 순번(몇 번째 차수인지)을 접수 전엔 모르므로, 차수별 안내 대신 가장 빠른 출고 시작일만 보여 준다.
function shipmentStartLabel(batches: ShipmentBatch[] | undefined) {
  const first = batches
    ?.map(({ estimatedShipStart }) => estimatedShipStart)
    .sort()[0]
  if (!first) return undefined
  // 'YYYY-MM-DD'를 Date로 바꾸면 시간대에 따라 하루가 밀릴 수 있어 글자로 자른다.
  const [, month, day] = first.split('-').map(Number)
  return `${month}월 ${day}일 출고시작`
}

export function ProductDetailPage() {
  const navigate = useNavigate()
  const requireLogin = useRequireLogin()
  const { productId = '' } = useParams()
  const { data: product, isPending, isError } = useProduct(productId)
  const isPreorder = product?.saleMode === 'PREORDER'
  const { data: shipmentBatches } = useShipmentBatches(productId, {
    enabled: isPreorder,
  })
  const shipmentLabel = shipmentStartLabel(shipmentBatches)
  const purchase = useProductPurchase(product)
  const preorderSubmit = usePreorderSubmit()
  const {
    selections,
    select,
    colorAxis,
    optionAxes,
    variant,
    unavailableReason,
    quantity,
    setQuantity,
    colorLabel,
    optionLabel,
    unitPrice,
    totalPrice,
    benefitAmount,
    payAmount,
  } = purchase
  // 조회가 끝나지 않았거나 실패했거나, 고른 조합을 살 수 없거나, 접수 중이면 결제/사전예약을 막는다.
  const isCheckoutReady =
    Boolean(variant) && !unavailableReason && !preorderSubmit.isPending

  // 결제·사전예약 화면이 같은 주문을 이어서 보여줄 수 있도록 선택 상태를 함께 넘긴다.
  const handleCheckout = () => {
    if (!product || !variant || !isCheckoutReady) return
    const purchasePayload: PurchaseDraft = {
      variantId: variant.variantId,
      productName: product.title,
      optionSummary: [colorLabel, optionLabel].filter(Boolean).join(' · '),
      quantity,
      unitPrice,
    }
    // 결제·사전예약은 회원 전용 — 비회원이면 이동 대신 로그인 모달을 연다.
    requireLogin(() => {
      if (!isPreorder) {
        navigate(PAYMENT_PATH, { state: [purchasePayload] })
        return
      }
      // 사전예약은 대기열 입장권으로 접수한다 — 입장권이 없으면 줄을 서고, 차례가 오면 이 상세로 돌아온다.
      // 접수 후엔 뒤로가기로 상세에 돌아와 다시 제출하지 않게 기록을 바꾼다.
      preorderSubmit.submitPreorder(
        {
          productId: product.productId,
          productName: product.title,
          optionId: variant.variantId,
          returnTo: productPath(product.productId),
        },
        ({ preorderId }) =>
          navigate(resultPath('preorder'), {
            state: { preorderId },
            replace: true,
          }),
      )
    })
  }
  const {
    layoutRef,
    orderBarRef,
    isLayoutVisible,
    orderBarHeight,
    activeTab,
    handleTabChange,
    registerPanelRef,
  } = useProductDetailScroll(productId)

  if (!product) {
    return (
      <div className={styles.root} data-theme="dark" data-header-theme="dark">
        <div className={styles.content}>
          <InlineAlert status={isError ? 'error' : 'info'}>
            {isError || !isPending
              ? '상품을 불러오지 못했어요.'
              : '상품을 불러오는 중이에요.'}
          </InlineAlert>
        </div>
      </div>
    )
  }

  const { title, modelNumber } = product
  const selectedColor = colorAxis?.values.find(
    ({ normalizedValue }) => normalizedValue === selections[colorAxis.key],
  )
  // 상세에서는 이 상품 후기만 보여준다.
  // ponytail: 리뷰는 아직 목업이라 상품명 앞부분으로 거른다 — GET /products/{id}/reviews를 붙이면 교체.
  const reviews = mockReviews.filter(({ productName }) =>
    productName.startsWith(title),
  )

  return (
    <div className={styles.root} data-theme="dark" data-header-theme="dark">
      <div className={styles.content}>
        <div className={styles.layout} ref={layoutRef}>
          <div className={styles.imageColumn}>
            <ProductGallery
              images={galleryImages(product, selectedColor?.normalizedValue)}
              productName={title}
            />
          </div>
          <div className={styles.optionPanel}>
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>{title}</h1>
              {modelNumber && (
                <div className={styles.modelNumber}>{modelNumber}</div>
              )}
            </div>
            {colorAxis && (
              <ProductColorSwatches
                colorName={colorAxis.label}
                size="medium"
                colors={colorAxis.values.map((value) => ({
                  hex: value.hex ?? '',
                  label: value.value,
                  selected: value === selectedColor,
                }))}
                onSelect={(index) =>
                  select(colorAxis.key, colorAxis.values[index].normalizedValue)
                }
              />
            )}
            {optionAxes.map((axis) => (
              <ProductOptionSelector
                key={axis.key}
                label={axis.label}
                options={axis.values.map((value) => ({
                  label: value.value,
                  extraPrice: value.surcharge,
                  selected: value.normalizedValue === selections[axis.key],
                }))}
                onSelect={(index) =>
                  select(axis.key, axis.values[index].normalizedValue)
                }
              />
            ))}
            {/* 웹에서는 수량도 옵션처럼 제목과 스테퍼를 한 줄에 놓는다(모바일은 하단 구매 바에 있다). */}
            <div className={styles.quantityOption}>
              <div className={styles.quantityLabel}>수량</div>
              <QuantityControl
                isPreorder={isPreorder}
                quantity={quantity}
                onQuantityChange={setQuantity}
                stepperLabel={title}
                stepperSize="medium"
              />
            </div>
            <PurchaseSummary
              options={[
                ...(selectedColor
                  ? [{ label: colorLabel, hex: selectedColor.hex ?? undefined }]
                  : []),
                ...optionAxes.flatMap((axis) => {
                  const value = axis.values.find(
                    ({ normalizedValue }) =>
                      normalizedValue === selections[axis.key],
                  )
                  return value ? [{ label: value.value }] : []
                }),
              ]}
              rows={[
                { label: '상품 금액', value: formatWon(totalPrice) },
                { label: '수량', value: `${quantity}개` },
                {
                  label: `사전예약 혜택 (${PREORDER_BENEFIT_RATE * 100}%)`,
                  value: `-${formatWon(benefitAmount)}`,
                  accent: true,
                },
              ]}
              total={{
                label: '총 결제 금액',
                value: formatWon(payAmount),
              }}
              note={isPreorder ? shipmentLabel : undefined}
            >
              {unavailableReason && (
                <InlineAlert status="info">{unavailableReason}</InlineAlert>
              )}
              <div className={styles.actions}>
                {!isPreorder && (
                  <ActionButton variant="cart" fullWidth>
                    장바구니
                  </ActionButton>
                )}
                <ActionButton
                  fullWidth
                  className={isPreorder ? styles.checkoutFull : undefined}
                  onClick={handleCheckout}
                  disabled={!isCheckoutReady}
                >
                  {isPreorder ? '사전예약하기' : '결제하기'}
                </ActionButton>
              </div>
            </PurchaseSummary>
          </div>
        </div>
      </div>
      <ProductPurchaseBar
        isPreorder={isPreorder}
        isLayoutVisible={isLayoutVisible}
        orderBarRef={orderBarRef}
        productName={title}
        stepperLabel={title}
        purchase={purchase}
        shipmentLabel={shipmentLabel}
        onCheckout={handleCheckout}
        checkoutDisabled={!isCheckoutReady}
      />
      <div
        className={styles.tabBarWrapper}
        style={
          {
            '--order-bar-offset': `${isLayoutVisible ? 0 : orderBarHeight}px`,
          } as CSSProperties
        }
      >
        <ProductPageTab
          activeTab={activeTab}
          onTabChange={handleTabChange}
          excludeTabs={isPreorder ? ['review'] : undefined}
        />
      </div>
      <div className={styles.sections}>
        {Object.entries(SECTION_LABELS)
          .filter(([tab]) => !isPreorder || tab !== 'review')
          .map(([tab, label]) => (
            <section
              key={tab}
              ref={registerPanelRef(tab as ProductPageTabKey)}
              className={styles.section}
            >
              <h2 className={styles.sectionTitle}>{label}</h2>
              {tab === 'review' ? (
                <div className={styles.reviewList}>
                  {reviews.map(({ id, ...review }) => (
                    <ReviewCard key={id} {...review} />
                  ))}
                </div>
              ) : (
                <div className={styles.placeholder}>{label} 상세 이미지</div>
              )}
            </section>
          ))}
      </div>
      <div
        className={styles.orderBarSpacer}
        style={{ height: orderBarHeight }}
      />
    </div>
  )
}
