import { ANONYMOUS } from '@tosspayments/tosspayments-sdk'

import { getTossPayments } from './tossClient'

// pages/payment-callback과 라우터가 같이 참조하는 경로 리터럴 — 카카오 로그인의
// KAKAO_CALLBACK_PATH와 같은 이유로 이 피처가 소유한다(라우팅을 트리거하는 SDK 호출이
// 여기 있으므로).
export const PAYMENT_CALLBACK_PATH = '/payment/callback'

type RequestTossPaymentParams = {
  orderId: string
  amount: number
  orderName: string
  customerName?: string
  customerEmail?: string
}

// 결제창(API 개별연동), CARD 고정. 정상 진행되면 브라우저가 successUrl/failUrl로
// 이동하므로(Redirect 방식) 이 함수는 보통 끝까지 실행되지 않는다 — 파라미터 오류
// 등은 reject된다. 사용자가 결제창을 그냥 닫은 경우(USER_CANCEL)도 SDK가 reject하지만
// 오류가 아니므로 삼키고 정상 반환한다(호출부가 에러 문구를 띄우지 않게).
export async function requestTossPayment({
  orderId,
  amount,
  orderName,
  customerName,
  customerEmail,
}: RequestTossPaymentParams) {
  const tossPayments = await getTossPayments()
  // ponytail: 세션에 아직 안정적인 회원 식별자(customerKey로 쓸 UUID 등)가 없어
  // ANONYMOUS로 둔다 — 백엔드가 회원 식별자를 세션에 내려주면 그 값으로 바꾼다.
  const payment = tossPayments.payment({ customerKey: ANONYMOUS })
  const callbackUrl = `${window.location.origin}${PAYMENT_CALLBACK_PATH}`

  try {
    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: amount },
      orderId,
      orderName,
      successUrl: callbackUrl,
      failUrl: callbackUrl,
      customerName,
      customerEmail,
      card: {
        useEscrow: false,
        flowMode: 'DEFAULT',
        useCardPoint: false,
        useAppCardOnly: false,
      },
    })
  } catch (caught) {
    if ((caught as { code?: unknown } | null)?.code !== 'USER_CANCEL') {
      throw caught
    }
  }
}
