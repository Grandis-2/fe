import { isRetryableError } from '@shared/api/queryPolicy'
import { pollUntil } from '@shared/lib/pollUntil'

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
// 두 번 다 응답을 못 받으면 null(호출부가 상태를 폴링한다). 409·404 같은 4xx는 그대로 던진다.
export const sendConfirmWithRetry = <TResult>(
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
// 5xx·네트워크 오류도 아직 모르는 것으로 보고 다음 차례에 다시 묻고, 4xx는 던진다.
// signal이 끊기면(화면을 떠나면) 멈추고 pending을 준다 — 호출부는 끊겼으면 결과를 쓰지 않는다.
export const pollOutcome = async (
  check: () => Promise<PaymentOutcome | null>,
  signal: AbortSignal,
): Promise<PaymentOutcome> =>
  (await pollUntil(
    () =>
      check().catch((caught: unknown) => {
        if (isRetryableError(caught)) return null
        throw caught
      }),
    { intervalMs: POLL_MS, timeoutMs: POLL_LIMIT_MS, signal },
  )) ?? { kind: 'pending' }
