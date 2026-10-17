import {
  confirmOrderPayment,
  getOrder,
  PAID_ORDER_STATUSES,
} from '@entities/order'

import {
  DECLINE_MESSAGE,
  pollOutcome,
  sendConfirmWithRetry,
} from './confirmPolling'

import type { PaymentOutcome } from './confirmPolling'

export type { PaymentOutcome }

type ConfirmParams = {
  orderId: string
  tossOrderId: string
  paymentKey: string
  amount: number
}

// 승인 결과가 나올 때까지(AUTHORIZING이 끝날 때까지) 주문 상세를 다시 묻는다.
const waitForOrder = (orderId: string, signal: AbortSignal) =>
  pollOutcome(async () => {
    const { status } = await getOrder(orderId, signal)
    if (PAID_ORDER_STATUSES.includes(status)) return { kind: 'approved' }
    if (status === 'AWAITING_PAYMENT')
      return { kind: 'declined', message: DECLINE_MESSAGE.FAILED }
    if (status === 'CANCELING' || status === 'CANCELED')
      return { kind: 'canceled' }
    return null
  }, signal)

// 토스 successUrl로 돌아온 값으로 결제를 승인한다(order 명세 ③).
// 500·503·네트워크 오류면 승인이 진행 중일 수 있어, 결제 준비를 다시 부르지 않고 같은 값으로 한 번만 더 보낸 뒤
// 주문 상세를 폴링한다. 409·404 같은 4xx는 그대로 던진다(호출부가 서버 문구를 보여 준다).
// signal은 폴링에만 쓴다 — 승인 요청은 끊으면 돈은 빠졌는데 결과를 모르게 되므로 끝까지 보낸다.
export async function confirmTossPayment(
  params: ConfirmParams,
  signal: AbortSignal,
): Promise<PaymentOutcome> {
  const result = await sendConfirmWithRetry(() => confirmOrderPayment(params))

  if (result?.result === 'APPROVED') return { kind: 'approved' }
  if (result?.result === 'DECLINED')
    return {
      kind: 'declined',
      message: DECLINE_MESSAGE[result.declineReason ?? 'FAILED'],
    }
  // PENDING이거나 응답을 끝내 못 받았다.
  return waitForOrder(params.orderId, signal)
}
