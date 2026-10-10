import { useEffect, useRef } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import { confirmTossPayment } from '@features/payment'
import { getErrorMessage } from '@shared/api/client'
import { mypagePath, resultPath } from '@shared/config/routes'
import { showToast } from '@shared/model/toastStore'

export function PaymentCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // StrictMode에서 effect가 두 번 실행돼도 승인을 두 번 보내지 않도록 막는다.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    // orderToken·preorderId는 결제창을 열 때 successUrl·failUrl에 실어 둔 값이고,
    // 나머지는 토스가 붙여 준다 — 성공은 paymentKey·orderId(tossOrderId)·amount, 실패는 code·message.
    const orderToken = searchParams.get('orderToken')
    const preorderId = searchParams.get('preorderId') ?? undefined
    const paymentKey = searchParams.get('paymentKey')
    const tossOrderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    // 실패 사유는 /result?status=failed 화면이 state로 받아 보여 주고, '다시 결제하기'는 같은 예약으로 돌아간다.
    // 실패(failUrl)면 서버를 부르지 않는다 — 주문은 결제 대기 그대로다.
    const fail = (failReason: string | null) =>
      navigate(resultPath('failed'), {
        replace: true,
        state: { failReason, preorderId },
      })

    if (!orderToken || !paymentKey || !tossOrderId || !amount) {
      fail(searchParams.get('message'))
      return
    }

    confirmTossPayment({
      orderId: orderToken,
      tossOrderId,
      paymentKey,
      amount: Number(amount),
    })
      .then((outcome) => {
        switch (outcome.kind) {
          case 'approved':
            navigate(resultPath('preorder-paid'), {
              replace: true,
              state: { orderId: orderToken },
            })
            return
          case 'declined':
            fail(outcome.message)
            return
          case 'canceled':
            fail('예약이 취소되어 결제할 수 없어요.')
            return
          case 'pending':
            showToast(
              '결제를 확인하는 데 시간이 걸리고 있어요. 주문 내역에서 결과를 확인해 주세요.',
            )
            navigate(mypagePath('history'), { replace: true })
        }
      })
      .catch((caught: unknown) =>
        fail(getErrorMessage(caught, '결제 승인 중 문제가 발생했어요.')),
      )
  }, [navigate, searchParams])

  return <div>결제를 확인하고 있습니다…</div>
}
