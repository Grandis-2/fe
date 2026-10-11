import type { CartLine } from '@entities/cart'
import type { Order } from '@entities/order'
import type { Reservation } from '@entities/preorder'

import type { PurchaseDraft } from '../model/purchaseDraft'

// 예약·주문 응답을 주문 상품 줄(OrderItemList·OrderReceipt가 그리는 모양)로 바꾼다.
// 이름·단가는 둘 다 예약 접수 당시 값이고, 사전예약은 수량이 늘 1이다.
export const reservationToDraft = (
  reservation: Pick<
    Reservation,
    'optionId' | 'productTitle' | 'optionTitle' | 'unitPrice'
  >,
): PurchaseDraft => ({
  variantId: reservation.optionId,
  productName: reservation.productTitle,
  optionSummary: reservation.optionTitle,
  quantity: 1,
  unitPrice: reservation.unitPrice,
})

export const orderToDrafts = ({ items }: Pick<Order, 'items'>) =>
  items.map((item): PurchaseDraft => ({
    variantId: item.optionId,
    productName: item.productTitle,
    // 보증은 줄 금액에 따로 붙는다 — 상품 줄엔 단가를 두고 보증 수량만 옵션 문구에 적는다.
    optionSummary: [
      item.optionTitle,
      item.warrantyQuantity > 0 && `보증 ${item.warrantyQuantity}개`,
    ]
      .filter(Boolean)
      .join(' · '),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }))

// 장바구니 줄 — 단가에 보증가를 더해 보여 준다(줄 금액 = (단가 + 보증가) × 수량).
export const cartLineToDraft = (line: CartLine): PurchaseDraft => ({
  variantId: line.variantId,
  productName: line.productTitle ?? '판매 종료된 상품',
  optionSummary: [line.optionTitle, line.warranty && '보증 포함']
    .filter(Boolean)
    .join(' · '),
  quantity: line.quantity,
  unitPrice: (line.unitPrice ?? 0) + (line.warrantyPrice ?? 0),
})
