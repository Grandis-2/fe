import { useEffect, useRef } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import { confirmPayment } from '@/entities/payment'

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
    // 실패 사유는 이미 만들어둔 /result?status=failed 화면에서 안내하므로 여기서는
    // 바로 넘긴다.
    if (!paymentKey || !orderId || !amount) {
      navigate('/result?status=failed', { replace: true })
      return
    }

    confirmPayment({ paymentKey, orderId, amount: Number(amount) })
      .then(() => navigate('/result?status=paid', { replace: true }))
      .catch(() => navigate('/result?status=failed', { replace: true }))
  }, [navigate, searchParams])

  return <div>결제를 확인하고 있습니다…</div>
}
