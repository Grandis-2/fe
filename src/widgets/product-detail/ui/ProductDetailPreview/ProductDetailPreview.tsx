import type { Product, ShipmentBatch } from '@entities/product'
import { useProductPurchase } from '@features/product-purchase'

import { DETAIL_SECTIONS, shipmentStartLabel } from '../../lib/productDetail'
import { ProductDetailImages } from '../ProductDetailImages'
import { ProductOverview } from '../ProductOverview'

import * as styles from './ProductDetailPreview.css'

export type ProductDetailPreviewProps = {
  product: Product
  shipmentBatches?: ShipmentBatch[]
}

const noop = () => {}

/**
 * 관리자가 구매자 상세를 미리 본다. 옵션을 골라 사진·가격이 바뀌는 건 그대로 해 보고,
 * 결제·장바구니만 막는다 — 미리보기에서 실제 주문이 생기면 안 된다.
 */
export function ProductDetailPreview({
  product,
  shipmentBatches,
}: ProductDetailPreviewProps) {
  const purchase = useProductPurchase(product)

  // 구매자 상세의 탭·고정 주문바는 창 스크롤에 묶여 있어 모달에선 빼고, 영역은 차례로 쌓는다.
  // 후기는 관리자가 올리는 내용이 아니라 뺐다.
  return (
    <div className={styles.root}>
      <ProductOverview
        product={product}
        purchase={purchase}
        shipmentLabel={shipmentStartLabel(shipmentBatches)}
        onCheckout={noop}
        checkoutDisabled
        onAddToCart={noop}
        addToCartDisabled
      />
      {DETAIL_SECTIONS.map((section) => (
        <section key={section} className={styles.section}>
          <h2 className={styles.sectionTitle}>{section}</h2>
          <ProductDetailImages product={product} section={section} />
        </section>
      ))}
    </div>
  )
}
