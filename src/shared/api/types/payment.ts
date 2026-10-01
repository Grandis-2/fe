// ponytail: 아직 별도 주문 생성 절차가 없어서 결제 준비 요청에 최종 결제 금액을 그대로
// 실어 보낸다. amount는 사전예약 혜택까지 반영된, 실제로 결제창에 띄울 금액이어야
// 한다(할인 전 금액을 보내면 결제창엔 할인 전 금액이 뜨고 화면엔 할인 후 금액이 뜨는
// 불일치가 생긴다). 실제 주문 시스템이 생기면 이미 만들어진 주문 ID 하나만 보내는
// 형태로 바뀔 것이다.
export type PreparePaymentRequest = {
  orderName: string
  amount: number
}

export type PreparePaymentResponse = {
  orderId: string
  // 서버가 계산한 진짜 금액 — 프론트가 보낸 unitPrice*quantity를 그대로 믿지 않고
  // 결제 승인(confirm) 시점에 이 값과 대조한다.
  amount: number
}

export type ConfirmPaymentRequest = {
  paymentKey: string
  orderId: string
  amount: number
}

export type ConfirmPaymentResponse = {
  status: 'DONE'
}
