import { useEffect, useRef } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

import { cartKeys } from '@entities/cart'
import { confirmTossPayment, forgetBuyNowKey } from '@features/payment'
import { getErrorMessage } from '@shared/api/client'
import { mypagePath, paymentPath, resultPath } from '@shared/config/routes'
import { useUnmountSignal } from '@shared/lib/useUnmountSignal'
import { showToast } from '@shared/model/toastStore'
import { Container, InlineAlert } from '@shared/ui'

export function PaymentCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // StrictMode에서 effect가 두 번 실행돼도 승인을 두 번 보내지 않도록 막는다.
  const started = useRef(false)
  // 결과를 기다리는 중에 화면을 떠나면 폴링을 멈추고, 늦게 나온 결과로 다른 화면에 끌고 가지 않는다.
  const signal = useUnmountSignal()

  useEffect(() => {
    if (started.current) return
    started.current = true

    // orderToken·preorderId(사전예약 주문만)는 결제창을 열 때 successUrl·failUrl에 실어 둔 값이고,
    // 나머지는 토스가 붙여 준다 — 성공은 paymentKey·orderId(tossOrderId)·amount, 실패는 code·message.
    const orderToken = searchParams.get('orderToken')
    const preorderId = searchParams.get('preorderId') ?? undefined
    const paymentKey = searchParams.get('paymentKey')
    const tossOrderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    // 실패 사유는 /result?status=failed 화면이 state로 받아 보여 주고, '다시 결제하기'는 사전예약이면 같은 예약의
    // 결제로, 장바구니 주문이면 주문 내역(결제 기한 안에서 같은 주문을 다시 결제)으로 간다.
    // 실패(failUrl)면 서버를 부르지 않는다 — 주문은 결제 대기 그대로다.
    const fail = (failReason: string | null) =>
      navigate(resultPath('failed'), {
        replace: true,
        state: { failReason, preorderId, orderId: orderToken },
      })

    if (!orderToken || !paymentKey || !tossOrderId || !amount) {
      // 사용자가 결제창을 닫으면 토스가 failUrl로 code=PAY_PROCESS_CANCELED를 붙여 보낸다 — 실패가 아니라
      // 결제를 안 한 것이니 실패 화면 대신 같은 예약의 결제 화면으로 돌려보낸다(requestTossPayment의 USER_CANCEL과 같은 취급).
      if (searchParams.get('code') === 'PAY_PROCESS_CANCELED' && preorderId) {
        navigate(paymentPath(preorderId), { replace: true })
        return
      }
      fail(searchParams.get('message'))
      return
    }

    confirmTossPayment(
      {
        orderId: orderToken,
        tossOrderId,
        paymentKey,
        amount: Number(amount),
      },
      signal,
    )
      .then((outcome) => {
        if (outcome.kind === 'approved') {
          // 이 주문이 바로 구매였다면 그 키를 버린다 — 같은 상품을 다시 사면 새 주문이어야 한다.
          forgetBuyNowKey({ orderId: orderToken })
          // 장바구니 주문은 승인되면 산 수량만큼 장바구니에서 빠진다 — 헤더 배지를 다시 받는다.
          if (!preorderId)
            void queryClient.invalidateQueries({ queryKey: cartKeys.all })
        }
        // 화면을 떠났으면 승인 결과는 위에서 반영만 하고, 이동·안내는 하지 않는다.
        if (signal.aborted) return
        switch (outcome.kind) {
          case 'approved':
            navigate(resultPath(preorderId ? 'preorder-paid' : 'paid'), {
              replace: true,
              state: { orderId: orderToken },
            })
            return
          case 'declined':
            fail(outcome.message)
            return
          case 'canceled':
            fail(
              preorderId
                ? '예약이 취소되어 결제할 수 없어요.'
                : '주문이 취소되어 결제할 수 없어요. 장바구니에서 다시 주문해 주세요.',
            )
            return
          case 'pending':
            // 승인이 진행 중이거나 끝났을 수 있어 "실패"라고 하지 않고, 다시 결제하지 않게 막는다.
            showToast(
              '결제 결과를 확인하지 못했어요. 주문 내역에서 확인해 주세요. 다시 결제하지 마세요.',
            )
            navigate(mypagePath('history'), { replace: true })
        }
      })
      .catch((caught: unknown) => {
        if (signal.aborted) return
        fail(getErrorMessage(caught, '결제 승인 중 문제가 발생했어요.'))
      })
  }, [navigate, queryClient, searchParams, signal])

  return (
    <Container>
      <InlineAlert status="info" variant="big" icon={LoaderCircle}>
        결제를 확인하고 있어요
      </InlineAlert>
    </Container>
  )
}
