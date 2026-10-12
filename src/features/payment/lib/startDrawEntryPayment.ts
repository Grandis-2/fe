import { createEntryPaymentAttempt } from '@entities/draw'

import {
  DRAW_PAYMENT_CALLBACK_PATH,
  requestTossPayment,
} from './requestTossPayment'

type StartDrawEntryPaymentParams = {
  // 응모비를 결제할 회차 — 응모를 마친(AWAITING_PAYMENT) 회차다.
  drawId: string
  customerName?: string
  customerEmail?: string
}

// 결제 준비(새 tossOrderId·응모비·회차 제목) → 토스 결제창. 결제창을 다시 열 때도 결제 준비부터 다시 부른다
// (이전 tossOrderId는 버린다). 돌아오는 주소에 회차 id를 실어 승인 경로에 쓴다.
export async function startDrawEntryPayment({
  drawId,
  customerName,
  customerEmail,
}: StartDrawEntryPaymentParams) {
  const attempt = await createEntryPaymentAttempt(drawId)
  await requestTossPayment({
    tossOrderId: attempt.tossOrderId,
    amount: attempt.amount,
    orderName: attempt.orderName,
    callbackPath: DRAW_PAYMENT_CALLBACK_PATH,
    callbackQuery: { drawId },
    customerName,
    customerEmail,
  })
}
