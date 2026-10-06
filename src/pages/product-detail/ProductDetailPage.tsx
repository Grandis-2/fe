import type { CSSProperties } from 'react'

import { useNavigate, useParams } from 'react-router'

import {
  ProductColorSwatches,
  ProductOptionSelector,
  useProduct,
} from '@entities/product'
import { mockReviews, ReviewCard } from '@entities/review'
import { useRequireLogin } from '@features/login'
import { ProductGallery } from '@features/product-gallery'
import {
  PREORDER_BENEFIT_RATE,
  PurchaseSummary,
  QuantityControl,
  useProductPurchase,
  type PurchaseDraft,
  type PurchaseOptionGroup,
} from '@features/product-purchase'
import macbook1 from '@shared/assets/macbook_neo_sliver1.png'
import macbook2 from '@shared/assets/macbook_neo_sliver2.png'
import { PAYMENT_PATH, resultPath } from '@shared/config/routes'
import { formatWon } from '@shared/lib/formatNumber'
import { ActionButton } from '@shared/ui'
import { ProductPageTab } from '@widgets/product-page-tab'
import type { ProductPageTabKey } from '@widgets/product-page-tab'
import { ProductPurchaseBar } from '@widgets/product-purchase-bar'

import * as styles from './ProductDetailPage.css'
import { useProductDetailScroll } from './useProductDetailScroll'

// ponytail: 아직 상품 상세 API가 없어서 목업 옵션 데이터로 대체
const colorSwatches = [
  { hex: '#2E2E32', label: '스페이스 블랙' },
  { hex: '#E3E4E6', label: '실버' },
  { hex: '#7D7E80', label: '스페이스 그레이' },
]
// 색상 외의 옵션 그룹. 패널에는 색상(스와치)이 맨 위, 그 아래 이 순서대로 보인다.
// extraPrice는 고르면 기본가에 더해지는 금액이다.
const optionGroups: PurchaseOptionGroup[] = [
  {
    label: '크기',
    values: [{ label: '14인치' }, { label: '16인치', extraPrice: 400000 }],
  },
  {
    label: 'RAM',
    values: [
      { label: '16GB' },
      { label: '24GB', extraPrice: 300000 },
      { label: '32GB', extraPrice: 600000 },
    ],
  },
  {
    label: '용량',
    values: [
      { label: '512GB' },
      { label: '1TB', extraPrice: 300000 },
      { label: '2TB', extraPrice: 900000 },
    ],
  },
  {
    label: '칩',
    values: [
      { label: 'M5' },
      { label: 'M5 Pro', extraPrice: 500000 },
      { label: 'M5 Max', extraPrice: 1000000 },
    ],
  },
]

// 페이지 곳곳(제목/alt/라벨은 영문, 본문/요약 텍스트는 국문)에 흩어져 있던 상품명 리터럴을 한 곳으로 모은다.
const PRODUCT_TITLE = 'MacBook Pro 14'
const PRODUCT_NAME = '맥북 프로 14'
const PRODUCT_IMAGES = [macbook1, macbook2]
// ponytail: 상세 응답에 모델명 필드가 아직 없어서 하드코딩 — 결제 화면 목업(PaymentPage)과 같은 값.
const PRODUCT_MODEL_NUMBER = 'A3112'

const SECTION_LABELS: Record<ProductPageTabKey, string> = {
  benefits: '구매 혜택',
  info: '모델 정보',
  notice: '유의 사항',
  review: '구매 후기',
}

// 상세에서는 이 상품(맥북 프로 14) 후기만 보여준다.
const reviews = mockReviews.filter(({ productName }) =>
  productName.startsWith(PRODUCT_NAME),
)

// ponytail: 실제 배송 시작일 API 전까지 하드코딩
const SHIPMENT_STARTS_AT = new Date('2026-10-15')
const shipmentLabel = `${SHIPMENT_STARTS_AT.getMonth() + 1}월 ${SHIPMENT_STARTS_AT.getDate()}일 이후 순차배송`

// ponytail: 실제 상품 API 전까지 기본가 하드코딩 — 결제 화면 목업(PaymentPage)과 같은 값.
// 옵션 추가금액은 여기에 더해진다.
const BASE_PRICE = 2390000

export function ProductDetailPage() {
  const navigate = useNavigate()
  const requireLogin = useRequireLogin()
  const { productId = '' } = useParams()
  // 사전예약 여부는 상세 API의 saleMode로 판단한다(그 외 화면 데이터는 아직 목업).
  const { data: product, isPending, isError } = useProduct(productId)
  const isPreorder = product?.saleMode === 'PREORDER'
  // 조회가 끝나지 않았거나 실패한 동안은 saleMode를 모르는 채로 결제/사전예약이
  // 진행되지 않도록 막는다 — isPreorder가 로딩 중 기본값(false)이라 그대로 두면
  // 사전예약 상품인데도 일반 결제 흐름을 탈 수 있다.
  const isCheckoutReady = Boolean(product) && !isPending && !isError
  const purchase = useProductPurchase({
    productId,
    colorSwatches,
    optionGroups,
    basePrice: BASE_PRICE,
    isPreorder,
  })
  const {
    selectedColor,
    setSelectedColor,
    selectedOptions,
    selectOption,
    quantity,
    setQuantity,
    colorLabel,
    optionLabel,
    unitPrice,
    totalPrice,
    benefitAmount,
    payAmount,
  } = purchase

  // 결제·사전예약 화면이 같은 주문을 이어서 보여줄 수 있도록 선택 상태를 함께 넘긴다.
  const handleCheckout = () => {
    if (!isCheckoutReady) return
    const purchasePayload: PurchaseDraft = {
      productName: PRODUCT_NAME,
      colorLabel,
      optionLabel,
      quantity,
      unitPrice,
    }
    // 결제·사전예약은 회원 전용 — 비회원이면 이동 대신 로그인 모달을 연다.
    requireLogin(() =>
      // 사전예약 완료 후 뒤로가기로 상세에 돌아와 다시 제출하는 걸 막는다(결제는 되돌아가서 수정 가능해야 하므로 그대로 둠).
      navigate(isPreorder ? resultPath('preorder') : PAYMENT_PATH, {
        state: purchasePayload,
        replace: isPreorder,
      }),
    )
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

  const renderOptionGroup = (
    group: PurchaseOptionGroup,
    groupIndex: number,
  ) => (
    <ProductOptionSelector
      key={group.label}
      label={group.label}
      options={group.values.map((value, valueIndex) => ({
        ...value,
        selected: valueIndex === selectedOptions[groupIndex],
      }))}
      onSelect={(valueIndex) => selectOption(groupIndex, valueIndex)}
    />
  )

  return (
    <div className={styles.root} data-theme="dark" data-header-theme="dark">
      <div className={styles.content}>
        <div className={styles.layout} ref={layoutRef}>
          <div className={styles.imageColumn}>
            <ProductGallery
              images={PRODUCT_IMAGES}
              productName={PRODUCT_TITLE}
            />
          </div>
          <div className={styles.optionPanel}>
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>{PRODUCT_NAME}</h1>
              <div className={styles.modelNumber}>{PRODUCT_MODEL_NUMBER}</div>
            </div>
            <ProductColorSwatches
              colorName="색상"
              size="medium"
              colors={colorSwatches.map((swatch, index) => ({
                ...swatch,
                selected: index === selectedColor,
              }))}
              onSelect={setSelectedColor}
            />
            {optionGroups.map(renderOptionGroup)}
            {/* 웹에서는 수량도 옵션처럼 제목과 스테퍼를 한 줄에 놓는다(모바일은 하단 구매 바에 있다). */}
            <div className={styles.quantityOption}>
              <div className={styles.quantityLabel}>수량</div>
              <QuantityControl
                isPreorder={isPreorder}
                quantity={quantity}
                onQuantityChange={setQuantity}
                stepperLabel={PRODUCT_TITLE}
                stepperSize="medium"
              />
            </div>
            <PurchaseSummary
              options={[
                { label: colorLabel, hex: colorSwatches[selectedColor]?.hex },
                ...optionGroups.map((group, i) => ({
                  label: group.values[selectedOptions[i]].label,
                })),
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
        productName={PRODUCT_NAME}
        stepperLabel={PRODUCT_TITLE}
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
