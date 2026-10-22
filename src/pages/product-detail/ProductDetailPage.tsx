import type { CSSProperties } from 'react'

import { MessageSquare } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { useProduct, useShipmentBatches } from '@entities/product'
import {
  ReviewCard,
  ReviewCardSkeleton,
  useProductReviews,
} from '@entities/review'
import { useRequireLogin } from '@features/login'
import { usePreorderSubmit } from '@features/preorder-queue'
import {
  useAddToCart,
  useProductPurchase,
  type PurchaseDraft,
} from '@features/product-purchase'
import { PAYMENT_PATH, paymentPath, resultPath } from '@shared/config/routes'
import { InlineAlert, SkeletonGroup } from '@shared/ui'
import {
  galleryImages,
  ProductDetailImages,
  ProductDetailSkeleton,
  ProductOverview,
  shipmentStartLabel,
} from '@widgets/product-detail'
import { ProductPageTab } from '@widgets/product-page-tab'
import type { ProductPageTabKey } from '@widgets/product-page-tab'
import { ProductPurchaseBar } from '@widgets/product-purchase-bar'

import * as styles from './ProductDetailPage.css'
import { useProductDetailScroll } from './useProductDetailScroll'

// 후기 말고는 관리자가 올린 영역 사진을 그린다 — 라벨이 곧 사진 묶음 이름이다.
const SECTION_LABELS = {
  benefits: '구매 혜택',
  info: '모델 정보',
  notice: '유의 사항',
  review: '구매 후기',
} as const satisfies Record<ProductPageTabKey, string>
const SECTION_TABS = Object.keys(SECTION_LABELS) as ProductPageTabKey[]

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
  // 사전예약은 리뷰 탭이 없다(사전예약 상품엔 리뷰를 쓸 수 없다).
  const reviews = useProductReviews(productId, {
    enabled: product !== undefined && !isPreorder,
  })
  const purchase = useProductPurchase(product)
  const preorderSubmit = usePreorderSubmit()
  const { addToCart, isAdding } = useAddToCart()
  const {
    variant,
    unavailableReason,
    quantity,
    colorAxis,
    selections,
    colorLabel,
    optionLabel,
    unitPrice,
  } = purchase
  // 조회가 끝나지 않았거나 실패했거나, 고른 조합을 살 수 없거나, 접수 중이면 결제/사전예약을 막는다.
  const isCheckoutReady =
    Boolean(variant) && !unavailableReason && !preorderSubmit.isPending

  // 장바구니는 회원 전용 — 비회원이면 로그인 모달을 연다. 고른 조합을 살 수 없으면 담지 않는다.
  const handleAddToCart = () => {
    if (!variant || !isCheckoutReady) return
    requireLogin(() => addToCart(variant.variantId, quantity))
  }

  // 일반 상품은 고른 옵션·수량을 결제 화면에 넘기고, 결제 화면이 바로 구매(BUY_NOW) 주문을 만든다.
  const handleCheckout = () => {
    if (!product || !variant || !isCheckoutReady) return
    const purchasePayload: PurchaseDraft = {
      variantId: variant.variantId,
      productName: product.title,
      optionSummary: [colorLabel, optionLabel].filter(Boolean).join(' · '),
      quantity,
      unitPrice,
      // 장바구니 줄 사진처럼 고른 색상의 첫 사진, 없으면 대표 사진.
      imageUrl:
        galleryImages(
          product,
          colorAxis ? selections[colorAxis.key] : undefined,
        )[0] ?? product.imageUrl,
    }
    // 결제·사전예약은 회원 전용 — 비회원이면 이동 대신 로그인 모달을 연다.
    requireLogin(() => {
      if (!isPreorder) {
        navigate(PAYMENT_PATH, { state: [purchasePayload] })
        return
      }
      // 사전예약은 대기열 입장권으로 접수한다 — 입장권이 없으면 사전예약 페이지로 보낸다(줄은 거기서 선다).
      // 접수 뒤 5초 안에 외부 등록되면 바로 결제로, 아니면 예약 접수 화면(나중에 구매 확정)으로 간다.
      // 접수 후엔 뒤로가기로 상세에 돌아와 다시 제출하지 않게 기록을 바꾼다.
      preorderSubmit.submitPreorder(
        {
          productId: product.productId,
          optionId: variant.variantId,
        },
        ({ preorderId }, registered) =>
          navigate(
            registered ? paymentPath(preorderId) : resultPath('preorder'),
            { state: { preorderId }, replace: true },
          ),
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
  } = useProductDetailScroll(productId, product !== undefined)

  if (!product) {
    return (
      <div className={styles.root} data-theme="dark" data-header-theme="dark">
        {isError || !isPending ? (
          <div className={styles.content}>
            <InlineAlert status={isError ? 'error' : 'info'}>
              상품을 불러오지 못했어요.
            </InlineAlert>
          </div>
        ) : (
          <ProductDetailSkeleton />
        )}
      </div>
    )
  }

  const { title } = product

  return (
    <div className={styles.root} data-theme="dark" data-header-theme="dark">
      <div className={styles.content}>
        <ProductOverview
          ref={layoutRef}
          product={product}
          purchase={purchase}
          shipmentLabel={shipmentLabel}
          onCheckout={handleCheckout}
          checkoutDisabled={!isCheckoutReady}
          onAddToCart={handleAddToCart}
          addToCartDisabled={!isCheckoutReady || isAdding}
        />
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
        onAddToCart={handleAddToCart}
        addToCartDisabled={!isCheckoutReady || isAdding}
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
        {SECTION_TABS.filter((tab) => !isPreorder || tab !== 'review').map(
          (tab) => (
            <section
              key={tab}
              ref={registerPanelRef(tab)}
              className={styles.section}
            >
              <h2 className={styles.sectionTitle}>{SECTION_LABELS[tab]}</h2>
              {tab === 'review' ? (
                <div className={styles.reviewList}>
                  {reviews.isError ? (
                    <InlineAlert status="error">
                      후기를 불러오지 못했어요.
                    </InlineAlert>
                  ) : reviews.isPending ? (
                    <SkeletonGroup className={styles.reviewList}>
                      {[0, 1].map((i) => (
                        <ReviewCardSkeleton key={i} />
                      ))}
                    </SkeletonGroup>
                  ) : reviews.data.items.length === 0 ? (
                    <InlineAlert
                      status="info"
                      variant="big"
                      icon={MessageSquare}
                      description="첫 후기를 기다리고 있어요."
                    >
                      아직 등록된 후기가 없어요
                    </InlineAlert>
                  ) : (
                    reviews.data.items.map((review) => (
                      <ReviewCard key={review.reviewId} review={review} />
                    ))
                  )}
                </div>
              ) : (
                <ProductDetailImages
                  product={product}
                  section={SECTION_LABELS[tab]}
                />
              )}
            </section>
          ),
        )}
      </div>
    </div>
  )
}
