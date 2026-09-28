import { type CSSProperties } from 'react'

import { useNavigate, useParams } from 'react-router'

import {
  ProductColorSwatches,
  ProductOptionSelector,
  useProduct,
} from '@/entities/product'
import { mockReviews, ReviewCard } from '@/entities/review'
import {
  QuantityPriceDisplay,
  useProductPurchase,
} from '@/features/product-purchase'
import macbook1 from '@/shared/assets/macbook_neo_sliver1.png'
import macbook2 from '@/shared/assets/macbook_neo_sliver2.png'
import { color } from '@/shared/config/theme'
import { Container, Slider, Button } from '@/shared/ui'
import { ProductPageTab } from '@/widgets/product-page-tab'
import type { ProductPageTabKey } from '@/widgets/product-page-tab'
import { ProductPurchaseBar } from '@/widgets/product-purchase-bar'

import * as styles from './ProductDetailPage.css'
import { useProductDetailScroll } from './useProductDetailScroll'

// ponytail: 아직 상품 상세 API가 없어서 목업 옵션 데이터로 대체
const colorSwatches = [
  { hex: '#1A1A1D', label: '미드나이트' },
  { hex: '#F5F5F0', label: '스타라이트' },
  { hex: '#F68C4C', label: '코즈믹 오렌지' },
]
const optionLabels = ['256GB', '512GB']

// 페이지 곳곳(제목/alt/라벨은 영문, 본문/요약 텍스트는 국문)에 흩어져 있던 상품명 리터럴을 한 곳으로 모은다.
const PRODUCT_TITLE = 'IPhone 18 Pro'
const PRODUCT_NAME = '아이폰 18 Pro'

// ponytail: 실제 탭 콘텐츠 API 전까지 자리표시자 배경색으로 대체
const tabPanelContent: Record<
  ProductPageTabKey,
  { label: string; background: string }
> = {
  benefits: { label: '구매 혜택', background: '#f5f5f5' },
  info: { label: '모델 정보', background: '#c1c1c1' },
  notice: { label: '유의 사항', background: '#6a6a6a' },
  review: { label: '구매 후기', background: color.background.base },
}

// 상세에서는 이 상품(아이폰 18 Pro) 후기만 보여준다.
const reviews = mockReviews.filter(({ productName }) =>
  productName.startsWith(PRODUCT_NAME),
)

// ponytail: 실제 배송 시작일 API 전까지 하드코딩
const SHIPMENT_STARTS_AT = new Date('2026-10-15')
const shipmentLabel = `${SHIPMENT_STARTS_AT.getMonth() + 1}월 ${SHIPMENT_STARTS_AT.getDate()}일 이후 순차배송`

// ponytail: 실제 상품 API 전까지 단가 하드코딩
const UNIT_PRICE = 120000

export function ProductDetailPage() {
  const navigate = useNavigate()
  const { productId = '' } = useParams()
  // 사전예약 여부는 상세 API의 saleMode로 판단한다(그 외 화면 데이터는 아직 목업).
  const { data: product } = useProduct(productId)
  const isPreorder = product?.saleMode === 'PREORDER'
  const purchase = useProductPurchase({
    colorSwatches,
    optionLabels,
    unitPrice: UNIT_PRICE,
    isPreorder,
  })
  const {
    selectedColor,
    setSelectedColor,
    selectedOption,
    setSelectedOption,
    quantity,
    setQuantity,
    colorLabel,
    optionLabel,
    priceLabel,
  } = purchase

  // 결제·사전예약 화면이 같은 주문을 이어서 보여줄 수 있도록 선택 상태를 함께 넘긴다.
  const handleCheckout = () => {
    const purchasePayload = {
      productName: PRODUCT_NAME,
      colorLabel,
      optionLabel,
      quantity,
      unitPrice: UNIT_PRICE,
    }
    // 사전예약 완료 후 뒤로가기로 상세에 돌아와 다시 제출하는 걸 막는다(결제는 되돌아가서 수정 가능해야 하므로 그대로 둠).
    navigate(isPreorder ? '/result?status=preorder' : '/payment', {
      state: purchasePayload,
      replace: isPreorder,
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
    isSheetOpen,
    setIsSheetOpen,
  } = useProductDetailScroll()

  return (
    <Container desktopPaddingX={0} mobilePaddingX={0}>
      <div className={styles.contentPadding}>
        <div className={styles.title}>{PRODUCT_TITLE}</div>
        <div className={styles.layout} ref={layoutRef}>
          <div>
            <div className={styles.imageFrame}>
              <div className={styles.sliderFill}>
                <Slider>
                  <img
                    src={macbook1}
                    alt={PRODUCT_TITLE}
                    className={styles.image}
                  />
                  <img
                    src={macbook2}
                    alt={PRODUCT_TITLE}
                    className={styles.image}
                  />
                </Slider>
              </div>
            </div>
          </div>
          <div className={styles.optionPanel}>
            <div className={styles.optionColumn}>
              <ProductColorSwatches
                colorName="색상"
                size="medium"
                colors={colorSwatches.map((swatch, index) => ({
                  ...swatch,
                  selected: index === selectedColor,
                }))}
                onSelect={setSelectedColor}
              />
              <ProductOptionSelector
                label="용량"
                options={optionLabels.map((label, index) => ({
                  label,
                  selected: index === selectedOption,
                }))}
                onSelect={setSelectedOption}
              />
            </div>
            <div className={styles.purchaseSummary}>
              <div className={styles.quantityPriceRow}>
                <QuantityPriceDisplay
                  isPreorder={isPreorder}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  priceLabel={priceLabel}
                  stepperLabel={PRODUCT_TITLE}
                />
              </div>
              {isPreorder && (
                <div className={styles.shipmentNotice}>{shipmentLabel}</div>
              )}
              <div
                className={isPreorder ? styles.actionsSingle : styles.actions}
              >
                {!isPreorder && (
                  <Button variant="subtle" icon="handbag">
                    장바구니
                  </Button>
                )}
                <Button onClick={handleCheckout}>
                  {isPreorder ? '사전예약하기' : '결제하기'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ProductPurchaseBar
        isPreorder={isPreorder}
        isLayoutVisible={isLayoutVisible}
        orderBarRef={orderBarRef}
        productName={PRODUCT_NAME}
        stepperLabel={PRODUCT_TITLE}
        purchase={purchase}
        shipmentLabel={shipmentLabel}
        isSheetOpen={isSheetOpen}
        onSheetOpenChange={setIsSheetOpen}
        onCheckout={handleCheckout}
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
      {Object.entries(tabPanelContent)
        .filter(([tab]) => !isPreorder || tab !== 'review')
        .map(([tab, { label, background }]) => (
          <div
            key={tab}
            ref={registerPanelRef(tab as ProductPageTabKey)}
            className={styles.tabPanel}
            style={{ background }}
          >
            {tab === 'review' ? (
              <div className={styles.reviewList}>
                {reviews.map(({ id, ...review }) => (
                  <ReviewCard key={id} {...review} />
                ))}
              </div>
            ) : (
              label
            )}
          </div>
        ))}
      <div
        className={styles.orderBarSpacer}
        style={{ height: orderBarHeight }}
      />
    </Container>
  )
}
