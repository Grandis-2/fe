import { createPaymentAttempt } from '@entities/order'
import { track } from '@shared/lib/analytics'

import { PAYMENT_CALLBACK_PATH, requestTossPayment } from './requestTossPayment'

type StartOrderPaymentParams = {
  // 결제 대기(AWAITING_PAYMENT) 주문의 주문 토큰.
  orderId: string
  // 사전예약 주문이면 실패했을 때 같은 예약의 결제로 돌아오도록 함께 싣는다.
  preorderId?: string
  customerName?: string
  customerEmail?: string
}

// 결제 준비(새 tossOrderId·금액·주문명) → 토스 결제창. 결제창을 다시 열 때도 결제 준비부터 다시 부른다
// (이전 tossOrderId는 버린다). 결제 화면과 주문 내역의 '결제하기'가 같이 쓴다.
export async function startOrderPayment({
  orderId,
  preorderId,
  customerName,
  customerEmail,
}: StartOrderPaymentParams) {
  const attempt = await createPaymentAttempt(orderId)
  // 서버가 결제를 받아 준 뒤에 센다 — 결제할 수 없는 주문으로 거절되면 시작이 아니다.
  if (preorderId) track('Preorder Payment Started', { preorderId, orderId })
  await requestTossPayment({
    tossOrderId: attempt.tossOrderId,
    amount: attempt.amount,
    orderName: attempt.orderName,
    callbackPath: PAYMENT_CALLBACK_PATH,
    callbackQuery: preorderId
      ? { orderToken: orderId, preorderId }
      : { orderToken: orderId },
    customerName,
    customerEmail,
  })
}
