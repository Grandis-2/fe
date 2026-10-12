import { confirmEntryPayment, getMyDrawEntry } from '@entities/draw'

import {
  DECLINE_MESSAGE,
  pollOutcome,
  sendConfirmWithRetry,
} from './confirmPolling'

import type { PaymentOutcome } from './confirmPolling'

type ConfirmParams = {
  drawId: string
  tossOrderId: string
  paymentKey: string
  amount: number
}

// 승인 결과가 나올 때까지(AUTHORIZING이 끝날 때까지) 내 응모를 다시 묻는다.
const waitForEntry = (drawId: string) =>
  pollOutcome(async () => {
    const entry = await getMyDrawEntry(drawId)
    if (entry?.status === 'PAID') return { kind: 'approved' }
    if (entry?.status === 'AWAITING_PAYMENT')
      return { kind: 'declined', message: DECLINE_MESSAGE.FAILED }
    return null
  })

// 토스 successUrl로 돌아온 값으로 응모비를 승인한다(order 명세). 재시도·폴링 규칙은 주문 결제 승인과 같고,
// 상태는 주문 상세 대신 내 응모로 묻는다. 409(마감 등)·404 같은 4xx는 그대로 던진다.
export async function confirmDrawEntryPayment(
  params: ConfirmParams,
): Promise<PaymentOutcome> {
  const result = await sendConfirmWithRetry(() => confirmEntryPayment(params))

  if (result?.result === 'APPROVED') return { kind: 'approved' }
  if (result?.result === 'DECLINED')
    return {
      kind: 'declined',
      message: DECLINE_MESSAGE[result.declineReason ?? 'FAILED'],
    }
  return waitForEntry(params.drawId)
}
