import { useEffect, useRef } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import { confirmPayment } from '@entities/payment'
import { getErrorMessage } from '@shared/api/client'
import { resultPath } from '@shared/config/routes'

export function PaymentCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // StrictMode에서 effect가 두 번 실행돼도 confirm을 두 번 보내지 않도록 막는다.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    // successUrl은 paymentKey/orderId/amount를, failUrl은 code/message를 싣고 온다 —
    // 카카오 콜백이 error 파라미터 유무로 성공/실패를 가르는 것과 같은 방식이다.
    // 실패 사유(토스 message 또는 승인 API 오류 문구)는 /result?status=failed 화면이
    // state로 받아 보여 준다.
    const fail = (failReason: string | null) =>
      navigate(resultPath('failed'), { replace: true, state: { failReason } })

    if (!paymentKey || !orderId || !amount) {
      fail(searchParams.get('message'))
      return
    }

    // ponytail: 승인 응답에 주문 종류가 없어 사전예약 결제도 일반 구매 완료(paid)로 보낸다 —
    // 응답에 종류가 실리면 사전예약은 resultPath('preorder-paid')로 나눈다.
    confirmPayment({ paymentKey, orderId, amount: Number(amount) })
      .then(() => navigate(resultPath('paid'), { replace: true }))
      .catch((caught: unknown) =>
        fail(getErrorMessage(caught, '결제 승인 중 문제가 발생했어요.')),
      )
  }, [navigate, searchParams])

  return <div>결제를 확인하고 있습니다…</div>
}
