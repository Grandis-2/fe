import { http } from 'msw'

import { fail, ok } from '../response'
import { url } from '../url'

import type {
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  PreparePaymentRequest,
  PreparePaymentResponse,
} from '../../types'
import type { RequestHandler } from 'msw'

// ponytail: 실제 주문 시스템이 없어 메모리로 흉내낸다. ①(prepare)은 /payment에서,
// ③(confirm)은 토스가 진짜 브라우저 리다이렉트로 되돌려준 /payment/callback에서
// 호출된다 — 그 사이에 항상 완전한 페이지 이동이 끼어서 이 모듈도 다시 평가되므로,
// auth.ts/address.ts와 같은 이유로 sessionStorage에 실어 새로고침(리다이렉트)에도
// 살아남게 한다.
const DB_KEY = 'nova-payment-mock-db'

function loadOrderAmounts(): Map<string, number> {
  try {
    const raw = sessionStorage.getItem(DB_KEY)
    if (raw) return new Map(JSON.parse(raw) as [string, number][])
  } catch {
    // 파싱 실패 시 빈 상태로 시작한다.
  }
  return new Map()
}

// orderId -> 서버가 계산한 진짜 금액. ③ 결제 승인에서 이 값과 대조해 위변조를 잡는다.
const orderAmounts = loadOrderAmounts()

function saveOrderAmounts() {
  sessionStorage.setItem(DB_KEY, JSON.stringify([...orderAmounts.entries()]))
}

export const paymentHandlers: RequestHandler[] = [
  http.post(url('/api/v1/payments/prepare'), async ({ request }) => {
    const body = (await request
      .json()
      .catch(() => null)) as Partial<PreparePaymentRequest> | null

    if (!body?.orderName || !body.amount || body.amount <= 0) {
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: '요청 값이 올바르지 않습니다.',
      })
    }

    const orderId = `order_${crypto.randomUUID()}`
    orderAmounts.set(orderId, body.amount)
    saveOrderAmounts()

    return ok<PreparePaymentResponse>({ orderId, amount: body.amount })
  }),

  http.post(url('/api/v1/payments/confirm'), async ({ request }) => {
    const body = (await request
      .json()
      .catch(() => null)) as Partial<ConfirmPaymentRequest> | null

    const expected = body?.orderId ? orderAmounts.get(body.orderId) : undefined
    if (expected === undefined) {
      return fail(400, {
        code: 'INVALID_ORDER',
        message: '존재하지 않는 주문입니다.',
      })
    }

    if (body?.amount !== expected) {
      return fail(400, {
        code: 'AMOUNT_MISMATCH',
        message: '결제 금액이 일치하지 않습니다.',
      })
    }

    return ok<ConfirmPaymentResponse>({ status: 'DONE' })
  }),
]
