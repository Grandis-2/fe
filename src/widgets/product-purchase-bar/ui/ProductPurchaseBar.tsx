import type { RefObject } from 'react'

import {
  QuantityPriceDisplay,
  type ProductPurchase,
} from '@/features/product-purchase'
import { Button, Container } from '@/shared/ui'

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
  isSheetOpen: boolean
  onSheetOpenChange: (open: boolean) => void
  onCheckout: () => void
}

// 하단 고정 주문바(데스크톱은 스크롤 시 나타나는 상단 바) + 모바일 바텀시트를 한 단위로 묶는다.
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
  isSheetOpen,
  onSheetOpenChange,
  onCheckout,
}: ProductPurchaseBarProps) {
  // 처음 누르면 수량/가격을 확인할 바텀시트를 띄우고, 시트가 열린 상태에서
  // 다시 누르면 그대로 결제로 넘어간다.
  const handleCheckoutButtonClick = () => {
    if (!isSheetOpen) {
      onSheetOpenChange(true)
      return
    }
    onCheckout()
  }

  return (
    <>
      {isSheetOpen && (
        <div
          className={styles.sheetBackdrop}
          onClick={() => onSheetOpenChange(false)}
        />
      )}
      <div className={styles.bottomBarGroup}>
        {isSheetOpen && (
          <div className={styles.sheet}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetInfo}>
              <div className={styles.productName}>{productName}</div>
              <div className={styles.productOption}>
                {colorLabel} · {optionLabel}
              </div>
            </div>
            <div className={styles.sheetRow}>
              <QuantityPriceDisplay
                isPreorder={isPreorder}
                quantity={quantity}
                onQuantityChange={setQuantity}
                priceLabel={priceLabel}
                stepperLabel={stepperLabel}
              />
            </div>
          </div>
        )}
        <div
          ref={orderBarRef}
          className={[
            styles.orderBar,
            !isLayoutVisible && styles.orderBarVisible,
            isSheetOpen && styles.orderBarOpaque,
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
            <div className={styles.orderBarButtons}>
              {!isPreorder && (
                <Button
                  variant="subtle"
                  icon="handbag"
                  className={styles.orderBarIconButton}
                />
              )}
              <Button
                className={styles.orderBarCheckoutButton}
                onClick={handleCheckoutButtonClick}
              >
                {isPreorder ? (
                  '사전예약하기'
                ) : (
                  <>
                    <span className={styles.orderBarCheckoutLabelMobile}>
                      결제하기
                    </span>
                    <span className={styles.orderBarCheckoutLabelDesktop}>
                      {priceLabel} 결제하기
                    </span>
                  </>
                )}
              </Button>
            </div>
          </Container>
        </div>
      </div>
    </>
  )
}
