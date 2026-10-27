import { useEffect, useRef } from 'react'

import { useNavigate, useSearchParams } from 'react-router'

import { confirmDrawEntryPayment } from '@features/payment'
import { getErrorMessage } from '@shared/api/client'
import { DRAW_PATH, drawPath } from '@shared/config/routes'
import { useUnmountSignal } from '@shared/lib/useUnmountSignal'
import { showToast } from '@shared/model/toastStore'
import { LoadingScreen } from '@shared/ui'

// 럭키 드로우 응모비를 토스에서 결제하고 돌아오는 곳. 결과가 어떻든 그 회차 화면으로 돌아가고,
// 응모 상태(결제 대기·응모 완료)는 거기서 내 응모를 다시 받아 보여 준다.
export function DrawPaymentCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // StrictMode에서 effect가 두 번 실행돼도 승인을 두 번 보내지 않도록 막는다.
  const started = useRef(false)
  // 결과를 기다리는 중에 화면을 떠나면 폴링을 멈추고, 늦게 나온 결과로 다른 화면에 끌고 가지 않는다.
  const signal = useUnmountSignal()

  useEffect(() => {
    if (started.current) return
    started.current = true

    // drawId는 결제창을 열 때 successUrl·failUrl에 실어 둔 값이고, 나머지는 토스가 붙여 준다 —
    // 성공은 paymentKey·orderId(tossOrderId)·amount, 실패는 code·message.
    const drawId = searchParams.get('drawId')
    const paymentKey = searchParams.get('paymentKey')
    const tossOrderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    if (!drawId) {
      navigate(DRAW_PATH, { replace: true })
      return
    }
    const back = (message: string) => {
      showToast(message)
      navigate(drawPath(drawId), { replace: true })
    }

    // 실패(failUrl)면 서버를 부르지 않는다 — 응모는 결제 대기 그대로다. 결제창을 닫은 것은 실패가 아니라 안 한 것이다.
    if (!paymentKey || !tossOrderId || !amount) {
      back(
        searchParams.get('code') === 'PAY_PROCESS_CANCELED'
          ? '결제를 취소했어요. 응모비를 결제하면 응모가 완료돼요.'
          : (searchParams.get('message') ?? '결제가 완료되지 않았어요.'),
      )
      return
    }

    confirmDrawEntryPayment(
      {
        drawId,
        tossOrderId,
        paymentKey,
        amount: Number(amount),
      },
      signal,
    )
      .then((outcome) => {
        if (signal.aborted) return
        switch (outcome.kind) {
          case 'approved':
            back('응모가 완료됐어요.')
            return
          case 'declined':
            back(outcome.message)
            return
          case 'canceled':
            back('응모비를 결제하지 못했어요.')
            return
          case 'pending':
            back(
              '결제 결과를 확인하지 못했어요. 응모 내역에서 확인해 주세요. 다시 결제하지 마세요.',
            )
        }
      })
      .catch((caught: unknown) => {
        if (signal.aborted) return
        back(getErrorMessage(caught, '응모비 결제 중 문제가 발생했어요.'))
      })
  }, [navigate, searchParams, signal])

  return <LoadingScreen>결제를 확인하고 있어요</LoadingScreen>
}
