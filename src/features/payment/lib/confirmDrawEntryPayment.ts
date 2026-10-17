import { confirmEntryPayment, getMyDrawEntry } from '@entities/draw'

import { confirmPayment, DECLINE_MESSAGE } from './confirmPolling'

import type { PaymentOutcome } from './confirmPolling'

type ConfirmParams = {
  drawId: string
  tossOrderId: string
  paymentKey: string
  amount: number
}

// 승인 결과가 나올 때까지(AUTHORIZING이 끝날 때까지) 내 응모를 다시 묻는다.
const checkEntry = async (drawId: string): Promise<PaymentOutcome | null> => {
  const entry = await getMyDrawEntry(drawId)
  if (entry?.status === 'PAID') return { kind: 'approved' }
  if (entry?.status === 'AWAITING_PAYMENT')
    return { kind: 'declined', message: DECLINE_MESSAGE.FAILED }
  return null
}

// 토스 successUrl로 돌아온 값으로 응모비를 승인한다(order 명세). 재시도·409·폴링 규칙은 주문 결제 승인과 같고,
// 상태는 주문 상세 대신 내 응모로 묻는다.
export const confirmDrawEntryPayment = (params: ConfirmParams) =>
  confirmPayment(
    () => confirmEntryPayment(params),
    () => checkEntry(params.drawId),
  )
