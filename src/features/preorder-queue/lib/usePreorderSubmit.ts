import { useEffect, useRef, useState } from 'react'

import { faro } from '@grafana/faro-react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'

import {
  activeReservationsQuery,
  useSubmitPreorder,
  type PreorderAccepted,
} from '@entities/preorder'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { PREORDER_PATH, productPath } from '@shared/config/routes'
import { track } from '@shared/lib/analytics'
import { showToast } from '@shared/model/toastStore'

import {
  admissionUsableUntil,
  joinPreorderQueue,
  usePreorderQueueStore,
} from '../model/preorderQueueStore'

import { waitForRegistration } from './waitForRegistration'

// 이 입장권은 더 쓸 수 없다 — 지우고 다음에 누를 때 다시 줄을 선다.
const TICKET_ERRORS = [
  'ADMISSION_TICKET_INVALID',
  'ADMISSION_TICKET_STALE',
  'ADMISSION_TICKET_USED',
]

// 이미 접수된 예약이 있다 — 다시 눌러도 같은 오류라 버튼을 그 예약으로 바꾼다. 422는 응답을 못 받은 첫 접수가
// 커밋된 뒤 옵션을 바꿔 같은 키로 다시 보낸 것이다 — 예약은 앞 옵션이라, 바꾼 옵션으로 된 줄 알고 결제하지 않게 따로 알린다.
const alreadyAcceptedMessage = (caught: unknown) => {
  if (!(caught instanceof ApiRequestError)) return null
  if (caught.error.code === 'ACTIVE_PREORDER_EXISTS')
    return '이미 예약한 모델이에요.'
  if (caught.error.code === 'KEY_PAYLOAD_MISMATCH')
    return '앞서 고른 옵션으로 이미 접수됐어요. 예약 내용을 확인해 주세요.'
  return null
}

type SubmitTarget = {
  productId: string
  // 입장권이 만료돼 다시 줄을 설 때 대기열에 보여 준다.
  productName: string
  optionId: string
}

// 사전예약하기 — 이 상품의 입장권이 살아 있으면 접수한다. 대기열은 사전예약 페이지에서만 서므로,
// 입장권이 없으면 상세에서 줄을 세우지 않고 사전예약 페이지로 보낸다. 이 상품의 입장권이 만료됐으면
// (옵션을 고르다 시간이 지남) 목록으로 보내지 않고 이 자리에서 다시 줄을 세운다.
// 접수(202)되면 외부 등록을 최대 5초 기다려 등록됐는지(registered)와 함께 onSuccess를 부른다 — 등록됐으면 결제로
// 바로 가고(예약 접수 화면을 한 번 더 거치지 않게), 늦으면 예약 접수 화면이 이어서 기다린다.
export function usePreorderSubmit() {
  const admission = usePreorderQueueStore((state) => state.admission)
  const clearAdmission = usePreorderQueueStore((state) => state.clearAdmission)
  const submit = useSubmitPreorder()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isWaiting, setIsWaiting] = useState(false)
  const waitRef = useRef<AbortController>(null)

  // 접수·등록을 기다리는 중에 화면을 떠나면(다른 상품으로 옮겨 같은 페이지가 남아 있어도) 묻기를 멈추고,
  // 늦게 끝나도 앞 상품의 결제·예약 화면으로 끌고 가지 않는다.
  useEffect(() => () => waitRef.current?.abort(), [pathname])

  const submitPreorder = (
    { productId, productName, optionId }: SubmitTarget,
    onSuccess: (accepted: PreorderAccepted, registered: boolean) => void,
  ) => {
    if (!admission || admission.productId !== productId) {
      showToast('사전예약 페이지에서 대기열을 거쳐야 예약할 수 있어요.')
      navigate(PREORDER_PATH)
      return
    }
    if (admissionUsableUntil(admission) <= Date.now()) {
      clearAdmission()
      showToast('예약 가능 시간이 지나 다시 줄을 섰어요.')
      joinPreorderQueue({ productId, productName, to: productPath(productId) })
      return
    }
    // 버튼 속성 대신 여기서 동작 이름을 단다(Faro가 꺼져 있으면 api가 없다).
    faro.api?.startUserAction('preorder-apply')
    track('Preorder Apply Clicked', { productId, queued: false })
    const controller = new AbortController()
    waitRef.current = controller
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
          // 같은 입장권(같은 키)으로 다시 보낸 접수는 새 예약이 아니라 기존 예약이다 — 또 예약된 것으로 읽히지 않게 알린다.
          // 등록을 기다리다 화면을 떠나도 알리도록 기다리기 전에 띄운다.
          if (accepted.replayed)
            showToast('이미 접수된 예약이에요. 그 예약으로 이어서 진행해요.')
          // 재전송으로 돌아온 기존 예약이 이미 등록돼 있으면 기다리지 않는다.
          let registered = accepted.status === 'REGISTERED'
          if (!registered && !controller.signal.aborted) {
            setIsWaiting(true)
            registered = await waitForRegistration(
              accepted.preorderId,
              controller.signal,
            )
            // 다른 상품으로 옮겨 이 페이지가 남아 있으면 버튼이 '처리 중'으로 남지 않게 늘 끈다.
            setIsWaiting(false)
          }
          // 떠난 뒤에도 접수는 센다 — 결제로 바로 가지 않았으니 registered는 false다.
          // 재전송이면 기존 예약이 replayed로 다시 온다 — 예약 하나는 한 번만 센다.
          const left = controller.signal.aborted
          track(
            'Preorder Submitted',
            {
              productId,
              preorderId: accepted.preorderId,
              registered: registered && !left,
            },
            accepted.preorderId,
          )
          if (!left) onSuccess(accepted, registered)
        },
        onError: (caught) => {
          // 이미 이 모델의 예약이 있다 — 다른 화면으로 옮기지 않고 알린 뒤, 그 예약을 다시 받아 버튼을 그 예약으로 바꾼다.
          const alreadyMessage = alreadyAcceptedMessage(caught)
          if (alreadyMessage) {
            clearAdmission()
            showToast(alreadyMessage)
            void queryClient.invalidateQueries({
              queryKey: activeReservationsQuery.queryKey,
            })
            return
          }
          // 다시 보내도 응답을 못 받았다(useSubmitPreorder가 한 번 재전송) — 접수됐을 수 있으니 내 예약을 다시 받아,
          // 접수됐으면 버튼이 그 예약으로 바뀐다. 입장권·키는 그대로라 다시 눌러도 예약은 하나만 생긴다.
          if (caught instanceof ApiRequestError && caught.status === 0) {
            void queryClient.invalidateQueries({
              queryKey: activeReservationsQuery.queryKey,
            })
            showToast(
              '응답이 늦어 접수 여부를 확인하고 있어요. 다시 눌러도 예약은 하나만 접수돼요.',
            )
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

  // 접수 요청(최대 10초) → 외부 등록 확인(최대 5초) 중 어디인지. 버튼이 꺼진 채 멈춘 것처럼 보이지 않게 문구로 알린다.
  const phase: 'submitting' | 'registering' | null = submit.isPending
    ? 'submitting'
    : isWaiting
      ? 'registering'
      : null
  return { submitPreorder, isPending: phase !== null, phase }
}
