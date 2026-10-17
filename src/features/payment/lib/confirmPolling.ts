import type { OrderPaymentResult } from '@entities/order'
import { ApiRequestError } from '@shared/api/client'
import { isRetryableError } from '@shared/api/queryPolicy'
import { delay } from '@shared/lib/delay'

// 주문 결제와 럭키 드로우 응모비 결제가 같이 쓰는 승인 뒤처리.
export type PaymentOutcome =
  | { kind: 'approved' }
  // 결제가 이뤄지지 않았다 — 사유를 안내하고 결제 준비부터 다시.
  | { kind: 'declined'; message: string }
  // 그사이 예약이 취소돼 주문도 취소됐다.
  | { kind: 'canceled' }
  // 정해진 시간 안에 결과가 나오지 않았다 — "주문 내역에서 확인" 안내.
  | { kind: 'pending' }

export const DECLINE_MESSAGE = {
  CARD_REJECTED:
    '카드사에서 결제를 거절했어요. 다른 결제 수단으로 다시 시도해 주세요.',
  PAYMENT_EXPIRED: '결제 시간이 지났어요. 결제창을 다시 열어 주세요.',
  FAILED: '결제가 완료되지 않았어요. 다시 시도해 주세요.',
} as const

const POLL_MS = 3_000
// 승인은 최대 70초쯤 걸릴 수 있다(명세) — 그보다 조금 더 기다린다.
const POLL_LIMIT_MS = 80_000

// 500·503·네트워크 오류면 승인이 진행 중일 수 있어, 결제 준비를 다시 부르지 않고 같은 값으로 한 번만 더 보낸다.
// 두 번 다 응답을 못 받으면 null(호출부가 상태를 폴링한다). 4xx는 그대로 던진다.
const sendConfirmWithRetry = <TResult>(
  send: () => Promise<TResult>,
): Promise<TResult | null> =>
  send().catch((caught: unknown) => {
    if (!isRetryableError(caught)) throw caught
    return send().catch((again: unknown) => {
      if (!isRetryableError(again)) throw again
      return null
    })
  })

// 승인 결과가 나올 때까지 check로 상태를 다시 묻는다. check가 null을 주면 아직 모르는 것이다.
async function pollOutcome(
  check: () => Promise<PaymentOutcome | null>,
): Promise<PaymentOutcome> {
  const deadline = Date.now() + POLL_LIMIT_MS
  while (Date.now() < deadline) {
    const outcome = await check().catch((caught: unknown) => {
      if (isRetryableError(caught)) return null
      throw caught
    })
    if (outcome) return outcome
    await delay(POLL_MS)
  }
  return { kind: 'pending' }
}

// 승인을 보내고(send), 결과가 확정되지 않으면 상태(check)를 폴링한다.
// 409는 "이 요청은 승인 전에 거절됐다"는 뜻일 뿐이다 — 재전송·새로고침처럼 같이 들어온 다른 요청이 이미
// 승인 중일 수 있어서, 명세대로 실제 상태를 확인한다. 결제 대기로 남았으면 서버 사유(기한 지남 등)를 보여 준다.
// 404 같은 나머지 4xx는 그대로 던진다(호출부가 서버 문구를 보여 준다).
export async function confirmPayment(
  send: () => Promise<Pick<OrderPaymentResult, 'result' | 'declineReason'>>,
  check: () => Promise<PaymentOutcome | null>,
): Promise<PaymentOutcome> {
  const sent = await sendConfirmWithRetry(send).catch((caught: unknown) => {
    if (caught instanceof ApiRequestError && caught.status === 409)
      return caught
    throw caught
  })

  if (sent instanceof ApiRequestError) {
    const outcome = await pollOutcome(check)
    return outcome.kind === 'declined'
      ? { kind: 'declined', message: sent.error.message }
      : outcome
  }
  if (sent?.result === 'APPROVED') return { kind: 'approved' }
  if (sent?.result === 'DECLINED')
    return {
      kind: 'declined',
      message: DECLINE_MESSAGE[sent.declineReason ?? 'FAILED'],
    }
  // PENDING이거나 응답을 끝내 못 받았다.
  return pollOutcome(check)
}
