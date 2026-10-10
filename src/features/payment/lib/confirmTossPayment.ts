import {
  confirmOrderPayment,
  getOrder,
  type OrderStatus,
} from '@entities/order'
import { isRetryableError } from '@shared/api/queryPolicy'

type ConfirmParams = {
  orderId: string
  tossOrderId: string
  paymentKey: string
  amount: number
}

export type PaymentOutcome =
  | { kind: 'approved' }
  // 결제가 이뤄지지 않았다 — 사유를 안내하고 결제 준비부터 다시.
  | { kind: 'declined'; message: string }
  // 그사이 예약이 취소돼 주문도 취소됐다.
  | { kind: 'canceled' }
  // 정해진 시간 안에 결과가 나오지 않았다 — "주문 내역에서 확인" 안내.
  | { kind: 'pending' }

const DECLINE_MESSAGE = {
  CARD_REJECTED:
    '카드사에서 결제를 거절했어요. 다른 결제 수단으로 다시 시도해 주세요.',
  PAYMENT_EXPIRED: '결제 시간이 지났어요. 결제창을 다시 열어 주세요.',
  FAILED: '결제가 완료되지 않았어요. 다시 시도해 주세요.',
} as const

const PAID: OrderStatus[] = [
  'AWAITING_CONFIRMATION',
  'PREPARING_ITEMS',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
]
const POLL_MS = 3_000
// 승인은 최대 70초쯤 걸릴 수 있다(명세) — 그보다 조금 더 기다린다.
const POLL_LIMIT_MS = 80_000

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 승인 결과가 나올 때까지(AUTHORIZING이 끝날 때까지) 주문 상세를 다시 묻는다.
async function waitForOrder(orderId: string): Promise<PaymentOutcome> {
  const deadline = Date.now() + POLL_LIMIT_MS
  while (Date.now() < deadline) {
    const status = await getOrder(orderId)
      .then((order) => order.status)
      .catch((caught: unknown) => {
        if (isRetryableError(caught)) return null
        throw caught
      })
    if (status && PAID.includes(status)) return { kind: 'approved' }
    if (status === 'AWAITING_PAYMENT')
      return { kind: 'declined', message: DECLINE_MESSAGE.FAILED }
    if (status === 'CANCELING' || status === 'CANCELED')
      return { kind: 'canceled' }
    await delay(POLL_MS)
  }
  return { kind: 'pending' }
}

// 토스 successUrl로 돌아온 값으로 결제를 승인한다(order 명세 ③).
// 500·503·네트워크 오류면 승인이 진행 중일 수 있어, 결제 준비를 다시 부르지 않고 같은 값으로 한 번만 더 보낸 뒤
// 주문 상세를 폴링한다. 409·404 같은 4xx는 그대로 던진다(호출부가 서버 문구를 보여 준다).
export async function confirmTossPayment(
  params: ConfirmParams,
): Promise<PaymentOutcome> {
  const send = () => confirmOrderPayment(params)
  const result = await send().catch((caught: unknown) => {
    if (!isRetryableError(caught)) throw caught
    return send().catch((again: unknown) => {
      if (!isRetryableError(again)) throw again
      return null
    })
  })

  if (result?.result === 'APPROVED') return { kind: 'approved' }
  if (result?.result === 'DECLINED')
    return {
      kind: 'declined',
      message: DECLINE_MESSAGE[result.declineReason ?? 'FAILED'],
    }
  // PENDING이거나 응답을 끝내 못 받았다.
  return waitForOrder(params.orderId)
}
