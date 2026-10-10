import { useSubmitPreorder, type PreorderAccepted } from '@entities/preorder'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { showToast } from '@shared/model/toastStore'

import {
  joinPreorderQueue,
  usePreorderQueueStore,
} from '../model/preorderQueueStore'

// 이 입장권은 더 쓸 수 없다 — 지우고 다음에 누를 때 다시 줄을 선다.
const TICKET_ERRORS = [
  'ADMISSION_TICKET_INVALID',
  'ADMISSION_TICKET_STALE',
  'ADMISSION_TICKET_USED',
]

type SubmitTarget = {
  productId: string
  productName: string
  optionId: string
  // 줄을 다시 서야 할 때 차례가 오면 돌아올 경로.
  returnTo: string
}

// 사전예약하기 — 이 상품의 입장권이 살아 있으면 접수하고, 없거나 만료됐으면 대기열에 선다.
export function usePreorderSubmit() {
  const admission = usePreorderQueueStore((state) => state.admission)
  const clearAdmission = usePreorderQueueStore((state) => state.clearAdmission)
  const submit = useSubmitPreorder()

  const submitPreorder = (
    { productId, productName, optionId, returnTo }: SubmitTarget,
    onSuccess: (accepted: PreorderAccepted) => void,
  ) => {
    if (
      !admission ||
      admission.productId !== productId ||
      admission.expiresAt <= Date.now()
    ) {
      joinPreorderQueue({ productId, productName, to: returnTo })
      return
    }
    submit.mutate(
      {
        productId,
        optionId,
        admissionTicket: admission.admissionTicket,
        idempotencyKey: admission.idempotencyKey,
      },
      {
        onSuccess: (accepted) => {
          clearAdmission()
          onSuccess(accepted)
        },
        onError: (caught) => {
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

  return { submitPreorder, isPending: submit.isPending }
}
