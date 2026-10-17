import {
  confirmOrderPayment,
  getOrder,
  PAID_ORDER_STATUSES,
} from '@entities/order'

import { confirmPayment, DECLINE_MESSAGE } from './confirmPolling'

import type { PaymentOutcome } from './confirmPolling'

export type { PaymentOutcome }

type ConfirmParams = {
  orderId: string
  tossOrderId: string
  paymentKey: string
  amount: number
}

// 승인 결과가 나올 때까지(AUTHORIZING이 끝날 때까지) 주문 상세를 다시 묻는다.
const checkOrder = async (orderId: string): Promise<PaymentOutcome | null> => {
  const { status } = await getOrder(orderId)
  if (PAID_ORDER_STATUSES.includes(status)) return { kind: 'approved' }
  if (status === 'AWAITING_PAYMENT')
    return { kind: 'declined', message: DECLINE_MESSAGE.FAILED }
  if (status === 'CANCELING' || status === 'CANCELED')
    return { kind: 'canceled' }
  return null
}

// 토스 successUrl로 돌아온 값으로 결제를 승인한다(order 명세 ③). 재시도·409·폴링 규칙은 confirmPayment.
export const confirmTossPayment = (params: ConfirmParams) =>
  confirmPayment(
    () => confirmOrderPayment(params),
    () => checkOrder(params.orderId),
  )
