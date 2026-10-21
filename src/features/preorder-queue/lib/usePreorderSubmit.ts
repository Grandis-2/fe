import { useEffect, useRef, useState } from 'react'

import { faro } from '@grafana/faro-react'
import { useNavigate } from 'react-router'

import { useSubmitPreorder, type PreorderAccepted } from '@entities/preorder'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { mypagePath, PREORDER_PATH } from '@shared/config/routes'
import { track } from '@shared/lib/analytics'
import { showToast } from '@shared/model/toastStore'

import { usePreorderQueueStore } from '../model/preorderQueueStore'

import { waitForRegistration } from './waitForRegistration'

// 이 입장권은 더 쓸 수 없다 — 지우고 다음에 누를 때 다시 줄을 선다.
const TICKET_ERRORS = [
  'ADMISSION_TICKET_INVALID',
  'ADMISSION_TICKET_STALE',
  'ADMISSION_TICKET_USED',
]

// 이미 접수된 예약이 있다 — 409 ACTIVE_PREORDER_EXISTS, 또는 응답을 못 받은 첫 접수가 커밋된 뒤
// 옵션을 바꿔 같은 키로 다시 보낸 422 KEY_PAYLOAD_MISMATCH. 다시 눌러도 같은 오류라 사전예약 내역으로 보낸다.
const isAlreadyAccepted = (caught: unknown) =>
  caught instanceof ApiRequestError &&
  ['ACTIVE_PREORDER_EXISTS', 'KEY_PAYLOAD_MISMATCH'].includes(caught.error.code)

type SubmitTarget = {
  productId: string
  optionId: string
}

// 사전예약하기 — 이 상품의 입장권이 살아 있으면 접수한다. 대기열은 사전예약 페이지에서만 서므로,
// 입장권이 없거나 만료됐으면 상세에서 줄을 세우지 않고 사전예약 페이지로 보낸다.
// 접수되면 외부 등록을 최대 5초 기다려 등록됐는지(registered)와 함께 onSuccess를 부른다.
export function usePreorderSubmit() {
  const admission = usePreorderQueueStore((state) => state.admission)
  const clearAdmission = usePreorderQueueStore((state) => state.clearAdmission)
  const submit = useSubmitPreorder()
  const navigate = useNavigate()
  const [isWaiting, setIsWaiting] = useState(false)
  const waitRef = useRef<AbortController>(null)

  // 기다리는 중에 화면을 떠나면 묻기를 멈추고, 늦게 끝나도 다른 화면으로 끌고 가지 않는다.
  useEffect(() => () => waitRef.current?.abort(), [])

  const submitPreorder = (
    { productId, optionId }: SubmitTarget,
    onSuccess: (accepted: PreorderAccepted, registered: boolean) => void,
  ) => {
    if (
      !admission ||
      admission.productId !== productId ||
      admission.expiresAt <= Date.now()
    ) {
      showToast('사전예약 페이지에서 대기열을 거쳐야 예약할 수 있어요.')
      navigate(PREORDER_PATH)
      return
    }
    // 버튼 속성 대신 여기서 동작 이름을 단다(Faro가 꺼져 있으면 api가 없다).
    faro.api?.startUserAction('preorder-apply')
    track('Preorder Apply Clicked', { productId, queued: false })
    submit.mutate(
      {
        productId,
        optionId,
        admissionTicket: admission.admissionTicket,
        idempotencyKey: admission.idempotencyKey,
      },
      {
        onSuccess: async (accepted) => {
          clearAdmission()
          // 같은 키 재전송인데 그사이 취소한(취소 중인) 예약이다 — 재신청은 새 입장권·새 키로 줄부터 다시 선다.
          if (
            accepted.replayed &&
            (accepted.status === 'CANCELING' || accepted.status === 'CANCELED')
          ) {
            showToast(
              '취소된 예약이에요. 다시 신청하려면 한 번 더 눌러 주세요.',
            )
            return
          }
          const controller = new AbortController()
          waitRef.current = controller
          setIsWaiting(true)
          const registered = await waitForRegistration(
            accepted.preorderId,
            controller.signal,
          )
          // 재전송이면 기존 예약이 replayed로 다시 온다 — 예약 하나는 한 번만 센다.
          track(
            'Preorder Submitted',
            { productId, preorderId: accepted.preorderId, registered },
            accepted.preorderId,
          )
          if (controller.signal.aborted) return
          setIsWaiting(false)
          onSuccess(accepted, registered)
        },
        onError: (caught) => {
          if (isAlreadyAccepted(caught)) {
            clearAdmission()
            showToast(
              '이미 접수한 예약이 있어요. 사전예약 내역에서 확인해 주세요.',
            )
            navigate(mypagePath('preorder-check'))
            return
          }
          if (
            caught instanceof ApiRequestError &&
            TICKET_ERRORS.includes(caught.error.code)
          )
            clearAdmission()
          showToast(getErrorMessage(caught, '사전예약을 접수하지 못했어요.'))
        },
      },
    )
  }

  return { submitPreorder, isPending: submit.isPending || isWaiting }
}
