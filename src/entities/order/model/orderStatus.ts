// 주문 한 건의 진행 상태. 사전예약은 구매 확정(confirm) → 출시 후 순차 발송(preship) 순으로,
// 일반 구매는 배송 준비(ready)부터 시작한다.
export type OrderStatus =
  'confirm' | 'ready' | 'preship' | 'shipping' | 'delivered' | 'cancelled'

export const orderStatusLabel: Record<OrderStatus, string> = {
  confirm: '구매 확정 대기',
  ready: '배송 준비 중',
  preship: '출시 후 순차 발송',
  shipping: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소 완료',
}
