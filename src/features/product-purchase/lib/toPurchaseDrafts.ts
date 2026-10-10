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
    optionSummary: item.optionTitle,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }))
