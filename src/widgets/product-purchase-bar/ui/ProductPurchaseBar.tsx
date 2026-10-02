import type { RefObject } from 'react'

import {
  QuantityPriceDisplay,
  type ProductPurchase,
} from '@features/product-purchase'
import { Button, Container } from '@shared/ui'

import * as styles from './ProductPurchaseBar.css'

export type ProductPurchaseBarProps = {
  isPreorder: boolean
  isLayoutVisible: boolean
  orderBarRef: RefObject<HTMLDivElement | null>
  productName: string
  stepperLabel: string
  // useProductPurchase() 결과를 그대로 받는다 — colorLabel/optionLabel/quantity/priceLabel을
  // 낱개 prop으로 풀어 넘기면 5개가 늘어나서, 이미 한 덩어리인 값을 그대로 전달한다.
  purchase: Pick<
    ProductPurchase,
    'colorLabel' | 'optionLabel' | 'quantity' | 'setQuantity' | 'priceLabel'
  >
  shipmentLabel: string
  onCheckout: () => void
  // 상품 조회가 안 끝났거나 실패한 동안 결제/사전예약을 막는다(ProductDetailPage의
  // isCheckoutReady 참고). 장바구니 버튼은 결제로 이어지지 않으니 그대로 둔다.
  checkoutDisabled?: boolean
}

// 하단 고정 주문바(데스크톱은 스크롤 시 나타나는 상단 바)를 그린다. 모바일 바는 수량/가격 줄과
// 버튼 줄로 이루어져 있다.
// 옵션 패널의 "장바구니 담기/결제하기" 행동 단위 로직은 features/product-purchase가 들고 있고,
// 이 위젯은 그 상태를 받아 하단바 UI로 그려주기만 한다.
export function ProductPurchaseBar({
  isPreorder,
  isLayoutVisible,
  orderBarRef,
  productName,
  stepperLabel,
  purchase: { colorLabel, optionLabel, quantity, setQuantity, priceLabel },
  shipmentLabel,
  onCheckout,
  checkoutDisabled,
}: ProductPurchaseBarProps) {
  return (
    <>
      <div
        className={[
          styles.bottomBarGroup,
          !isLayoutVisible && styles.bottomBarGroupVisible,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          ref={orderBarRef}
          className={[
            styles.orderBar,
            !isLayoutVisible && styles.orderBarVisible,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Container
            desktopPaddingX={20}
            desktopPaddingY={16}
            mobilePaddingX={20}
            mobilePaddingY={16}
            className={styles.orderBarContent}
          >
            {isPreorder && (
              <div className={styles.orderBarShipmentNotice}>
                {shipmentLabel}
              </div>
            )}
            <div className={styles.orderBarInfo}>
              <div className={styles.productName}>{productName}</div>
              <div className={styles.productOption}>
                {colorLabel} · {optionLabel}
              </div>
            </div>
            <div className={styles.orderBarQuantityPrice}>
              <QuantityPriceDisplay
                isPreorder={isPreorder}
                quantity={quantity}
                onQuantityChange={setQuantity}
                priceLabel={priceLabel}
                stepperLabel={stepperLabel}
              />
            </div>
            <div className={styles.orderBarButtons}>
              {!isPreorder && (
                <Button
                  variant="outline"
                  icon="handbag"
                  className={styles.orderBarIconButton}
                />
              )}
              <Button
                className={[
                  styles.orderBarCheckoutButton,
                  styles.orderBarCheckoutButtonMobile,
                ].join(' ')}
                onClick={onCheckout}
                disabled={checkoutDisabled}
              >
                {isPreorder ? '사전예약하기' : '결제하기'}
              </Button>
              <Button
                className={[
                  styles.orderBarCheckoutButton,
                  styles.orderBarCheckoutButtonDesktop,
                ].join(' ')}
                onClick={onCheckout}
                disabled={checkoutDisabled}
              >
                {isPreorder ? '사전예약하기' : `${priceLabel} 결제하기`}
              </Button>
            </div>
          </Container>
        </div>
      </div>
    </>
  )
}
