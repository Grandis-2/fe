import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import {
  activeReservationsQuery,
  findActiveReservation,
  useEnterQueue,
  useQueueStatus,
  type QueuePoll,
} from '@entities/preorder'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { isRetryableError } from '@shared/api/queryPolicy'
import { track } from '@shared/lib/analytics'
import { delay } from '@shared/lib/delay'
import { formatNumber } from '@shared/lib/formatNumber'
import { useDeadline } from '@shared/lib/useDeadline'

import {
  INSECURE_MESSAGE,
  usePreorderQueueStore,
  type PreorderAdmission,
} from '../model/preorderQueueStore'

import { admissionKey } from './admissionKey'

const TICK_MS = 1000
// 차례가 온 뒤 바로 넘기지 않고 100%를 잠깐 보여준 다음 이동한다.
const COMPLETE_DELAY_MS = 800
// 모달을 닫아 둔 사람은 진행률을 못 보고 있어서, 이만큼 세며 알린 뒤 이동한다 — 화면이 갑자기 바뀌지 않게.
const MOVE_NOTICE_SECONDS = 5
// 진입이 막혔을 때 다시 진입하기까지 — 줄이 가득 차면 10초, 일시 장애면 2초(명세).
const QUEUE_FULL_RETRY_MS = 10_000
const UNAVAILABLE_RETRY_MS = 2_000
// 예상 시간을 계산할 수 없을 때 서버가 주는 값 — 이 이상은 "오래 걸림".
const UNKNOWN_ETA = 450
// 누른 뒤 이만큼 답이 없으면 '입장 확인 중' 알약을 띄운다 — 응답이 늦어도(최대 타임아웃 10초) 눌렀는데 아무 일도
// 없는 것처럼 보이지 않게. 대기열 모달은 서버가 줄을 세웠을 때(WAITING)만 띄운다 — 바로 입장인데 대기열이
// 떴다 사라지면 줄을 선 것처럼 보인다.
const SLOW_ENTER_MS = 500
// 이만큼 조회에 성공하지 못하면 줄에서 빠졌을 수 있다(명세: 250초 넘게 조회하지 않으면).
// 안내만 바꾸고 조회는 계속한다. 운영자가 이탈 유예를 늘렸어도 구매자 응답엔 그 값이 없어 기본값을 쓴다.
const LEAVE_GRACE_MS = 250_000
// 줄 서기 전 진행 중인 예약 확인을 이만큼만 기다린다 — 늦거나 실패하면 그냥 줄을 선다(확인 때문에 대기열을 막지 않는다).
// 시트·상품 페이지가 30초 안에 받아 둔 값이 있으면 서버에 묻지 않고 바로 쓴다(activeReservationsQuery).
const EXISTING_CHECK_MS = 1_500

export type QueueStatus = 'waiting' | 'mine'
type QueueWaiting = Extract<QueuePoll, { status: 'WAITING' }>
export type PreorderQueueState = ReturnType<typeof usePreorderQueue>

// 예상 시간은 구간으로 보여 준다(명세 권장) — 0초로 보여 곧 입장으로 오해하지 않게.
const formatEta = (etaSeconds: number) =>
  etaSeconds < 30
    ? '곧 입장'
    : etaSeconds < 90
      ? '약 1분'
      : etaSeconds < UNKNOWN_ETA
        ? '약 5분'
        : '오래 걸림'

// 입장 속도(초당 입장 수) — 예상 시간은 구간이라 줄이 움직이는지 보이지 않아, 직전 조회보다 줄어든 순번으로 센다.
// 서버가 초 단위로 입장시키고 조회 간격도 초 단위라 초당으로 보인다. 움직였는데 1명이 안 되면 0이 아니라 '1명 미만'.
const formatPace = (perSecond: number) =>
  perSecond > 0 && perSecond < 0.5
    ? '1명 미만'
    : `${formatNumber(Math.round(perSecond))}명`

type Options = {
  productId: string
  // 차례가 오면(모달이 닫혀 있어도) 받은 입장권과 함께 호출된다.
  onComplete: (admission: PreorderAdmission) => void
  // 마감·오픈 전·없는 상품처럼 줄을 설 수 없으면 서버 문구와 함께 호출된다.
  onFail: (message: string) => void
  // 나가기를 누르면 호출된다 — 줄을 비워 다른 상품에 설 수 있게 한다.
  onLeave: () => void
  // 이 모델에 진행 중인 내 예약이 있어 줄을 서지 않았다 — 상품 페이지로 보내 그 예약 버튼을 보인다.
  onExisting: () => void
}

// 진입(POST) → Retry-After마다 조회(GET) → 입장권. 조회가 NOT_IN_QUEUE면 다시 진입한다(줄에 있었다면 같은 자리).
// 모달을 닫아도 조회는 계속된다 — 약 250초 넘게 조회하지 않으면 줄에서 빠지기 때문이다.
export function usePreorderQueue({
  productId,
  onComplete,
  onFail,
  onLeave,
  onExisting,
}: Options) {
  const queryClient = useQueryClient()
  const enter = useEnterQueue()
  const [isOpen, setIsOpen] = useState(true)
  // 서 있는 상품을 다시 누르면(joinPreorderQueue) 닫아 둔 창을 다시 연다 — 렌더 중에 바로 맞춘다.
  const reopenedAt = usePreorderQueueStore((state) => state.reopenedAt)
  const restored = usePreorderQueueStore((state) => state.ticket?.restored)
  const [seenReopenedAt, setSeenReopenedAt] = useState(reopenedAt)
  if (reopenedAt !== seenReopenedAt) {
    setSeenReopenedAt(reopenedAt)
    setIsOpen(true)
  }
  const [hasLeft, setHasLeft] = useState(false)
  // 아래 effect는 moveIn을 셀 때마다 다시 돈다 — 입장 이벤트는 입장권마다 한 번만 남긴다.
  const trackedTicket = useRef<string | null>(null)
  const [moveIn, setMoveIn] = useState(MOVE_NOTICE_SECONDS)
  // 진행률의 출발점(처음 본 순번)과 마지막으로 본 대기 상태 — 입장한 뒤에도 숫자가 '-'로 비지 않게 남겨 둔다.
  const [startPosition, setStartPosition] = useState<number | null>(null)
  const [lastWaiting, setLastWaiting] = useState<QueueWaiting | null>(null)
  // 직전 조회의 순번·받은 시각과 그 사이 초당 입장 수. 같은 응답이 와도(구조 공유로 같은 객체) 받은 시각으로
  // 새 조회인지 가린다.
  const [pace, setPace] = useState<{
    position: number
    at: number
    perSecond: number | null
  } | null>(null)
  // 진입이 막혔을 때 다시 진입할 예약 — 객체를 새로 만들어 같은 지연이 반복돼도 이펙트가 다시 돈다.
  const [retry, setRetry] = useState<{ delayMs: number } | null>(null)
  // 호출부가 매 렌더 새 함수를 넘겨도 타이머가 리셋되지 않도록 Effect Event로 감싼다.
  const handleComplete = useEffectEvent(onComplete)
  const handleFail = useEffectEvent(onFail)
  const handleExisting = useEffectEvent(onExisting)

  const join = useEffectEvent(() =>
    enter.mutate(productId, {
      onError: (caught) => {
        const code = caught instanceof ApiRequestError ? caught.error.code : ''
        if (code === 'QUEUE_FULL' || isRetryableError(caught)) {
          setRetry({
            delayMs:
              code === 'QUEUE_FULL'
                ? QUEUE_FULL_RETRY_MS
                : UNAVAILABLE_RETRY_MS,
          })
          return
        }
        handleFail(getErrorMessage(caught, '대기열에 들어가지 못했어요.'))
      },
    }),
  )

  // 마운트되면 줄을 선다 — 그 전에 이 모델에 진행 중인 내 예약이 있는지 본다. 서버는 회원·모델마다 예약 하나라
  // 줄을 끝까지 서도 새로 접수할 수 없고, 같은 입장권을 다시 받으면 기존 예약으로 이어져 "또 예약됐다"로 보인다.
  // StrictMode에서 두 번 마운트돼도 앞 것은 정리에서 끊겨 한 번만 줄을 선다.
  useEffect(() => {
    let active = true
    void Promise.race([
      queryClient
        .fetchQuery(activeReservationsQuery)
        .then((items) => findActiveReservation(items, productId))
        .catch(() => null),
      delay(EXISTING_CHECK_MS).then(() => null),
    ]).then((existing) => {
      if (!active) return
      if (existing) handleExisting()
      else join()
    })
    return () => {
      active = false
    }
  }, [queryClient, productId])

  useEffect(() => {
    if (!retry) return
    const id = setTimeout(join, retry.delayMs)
    return () => clearTimeout(id)
  }, [retry])

  const entry = enter.data
  const poll = useQueueStatus(
    productId,
    entry?.status === 'WAITING' ? entry : undefined,
    enter.submittedAt,
    { enabled: !hasLeft },
  )
  // 조회 중이면 조회 응답이, 진입에서 바로 입장했으면 진입 응답이 지금 상태다.
  const current = poll.data ?? entry

  // 자리가 없으면 다시 진입하고, 마감이면 멈춘다.
  useEffect(() => {
    if (poll.data?.status !== 'CLOSED' || hasLeft) return
    if (poll.data.reason === 'NOT_IN_QUEUE') join()
    else handleFail('사전예약이 마감되었어요.')
  }, [poll.data, hasLeft])

  // 일시 장애는 pollingRetry가 백오프하며 계속 다시 묻고, 4xx는 멈춘다.
  useEffect(() => {
    if (poll.error && !isRetryableError(poll.error))
      handleFail(getErrorMessage(poll.error, '대기 순번을 확인하지 못했어요.'))
  }, [poll.error])

  // 마지막으로 성공한 조회부터 실패가 이어진 지 250초가 지났다. 오프라인이면 요청이 멈춰(paused) 실패로 세지지
  // 않으므로 끊긴 시간도 같이 센다.
  const mayHaveLeftQueue = useDeadline(
    poll.failureCount > 0 || poll.fetchStatus === 'paused',
    LEAVE_GRACE_MS,
    poll.dataUpdatedAt,
  ).passed

  // 줄에서 빠져(NOT_IN_QUEUE) 다시 섰더니 더 뒤로 갔다 — 순번이 말없이 뛰지 않게 앞 순번을 남겨 알린다.
  const [droppedFrom, setDroppedFrom] = useState<number | null>(null)
  const waiting = current?.status === 'WAITING' ? current : null
  // 렌더 중에 바로 맞춘다(이펙트에서 setState하면 react-hooks/set-state-in-effect에 걸린다).
  if (waiting && waiting !== lastWaiting) {
    // 순번은 줄어들기만 한다 — 늘었으면 다시 진입해 뒤로 선 것이다.
    if (lastWaiting && waiting.position > lastWaiting.position)
      setDroppedFrom(lastWaiting.position)
    setLastWaiting(waiting)
    // 다시 진입해 더 뒤로 섰으면 그 순번부터 센다.
    if (startPosition === null || waiting.position > startPosition)
      setStartPosition(waiting.position)
  }
  if (waiting && poll.dataUpdatedAt !== pace?.at) {
    // 다시 진입해 더 뒤로 섰으면 비교하지 않고 새로 잰다. 진입 응답(조회 전, dataUpdatedAt 0)과는 비교하지 않는다.
    const comparable =
      pace !== null &&
      pace.at > 0 &&
      waiting.position <= pace.position &&
      poll.dataUpdatedAt > pace.at
    setPace({
      position: waiting.position,
      at: poll.dataUpdatedAt,
      perSecond: comparable
        ? ((pace.position - waiting.position) /
            (poll.dataUpdatedAt - pace.at)) *
          1000
        : null,
    })
  }

  // 진입에서 바로 입장(200)하면 대기열을 보여 주지 않고 넘어간다 — 응답이 늦었어도 마찬가지다. 한 번이라도
  // 기다렸거나(WAITING) 다시 진입을 예약했으면(줄이 가득 참·일시 장애) 보여 준다.
  const isHidden = lastWaiting === null && retry === null

  const status: QueueStatus =
    current?.status === 'ADMITTED' ? 'mine' : 'waiting'
  // 대기열을 띄우기 전 답을 기다리는 중(진행 중 예약 확인 → 진입)이 SLOW_ENTER_MS를 넘겼다.
  const checking = useDeadline(
    isHidden && status !== 'mine' && !hasLeft,
    SLOW_ENTER_MS,
  ).passed
  // 입장했으면 맨 앞(1번), 진입 응답 전이면 모른다(null).
  const position = status === 'mine' ? 1 : (waiting?.position ?? null)
  const admissionTicket =
    current?.status === 'ADMITTED' ? current.admissionTicket : null
  const expiresIn = current?.status === 'ADMITTED' ? current.expiresIn : 0
  // expiresIn은 응답 시점 기준이다 — 넘어갈 때(모달 0.8초·알약 5초 뒤) 세면 그만큼 늦게 끝나는 줄 알고,
  // 남은 시간이 보이는데 눌러도 ADMISSION_TICKET_STALE로 줄 맨 뒤가 된다. 조회 응답은 받은 시각, 진입에서 바로
  // 입장했으면 보낸 시각(조금 이르게 잡히는 쪽)을 기준으로 한다.
  const admittedAt = poll.data ? poll.dataUpdatedAt : enter.submittedAt

  // 내 차례가 오면 모달이 닫혀 있어도 넘어간다. 모달이 열려 있으면 100%를 잠깐 보여 주고,
  // 닫혀 있으면 QueuePill이 moveIn초를 센 뒤 넘어간다(그 사이 누르면 모달이 열려 바로 넘어간다).
  useEffect(() => {
    if (!admissionTicket || hasLeft) return
    if (trackedTicket.current !== admissionTicket) {
      trackedTicket.current = admissionTicket
      track('Preorder Queue Admitted', { productId })
    }
    // 키는 입장권에서 계산한다(admissionKey) — 같은 입장권을 다시 받은 창이 재전송으로 기존 예약을 받게.
    // 계산이 실패하면(보안 연결이 아님 — 줄 서기 전에 막지만 새로고침으로 되살린 줄은 여기로 온다) 100%에서 멈추지 않고 알린다.
    const complete = () => {
      const expiresAt = admittedAt + expiresIn * 1000
      void admissionKey(admissionTicket)
        .then((idempotencyKey) =>
          handleComplete({
            productId,
            admissionTicket,
            idempotencyKey,
            expiresAt,
          }),
        )
        .catch(() => handleFail(INSECURE_MESSAGE))
    }
    if (isHidden) {
      complete()
      return
    }
    if (isOpen) {
      const id = setTimeout(complete, COMPLETE_DELAY_MS)
      return () => clearTimeout(id)
    }
    if (moveIn === 0) {
      complete()
      return
    }
    const id = setTimeout(() => setMoveIn((s) => s - 1), TICK_MS)
    return () => clearTimeout(id)
  }, [
    productId,
    admissionTicket,
    expiresIn,
    admittedAt,
    isHidden,
    isOpen,
    moveIn,
    hasLeft,
  ])

  return {
    status,
    isHidden,
    checking,
    // 조회가 실패하고 있을 때의 안내용(PollingNotice).
    poll: { fetchStatus: poll.fetchStatus, failureCount: poll.failureCount },
    mayHaveLeftQueue,
    // 줄에서 빠져 다시 섰을 때 앞 순번(없으면 null).
    droppedFrom,
    isOpen,
    hasLeft,
    moveIn,
    // 진입 응답 전에는 순번을 모른다(null).
    myOrder: position,
    ahead: Math.max(0, (position ?? 1) - 1),
    waitTime:
      status === 'mine'
        ? '곧 입장'
        : waiting
          ? formatEta(waiting.etaSeconds)
          : '확인 중',
    // 새로고침 뒤 다시 진입했는데 서버가 지켜 둔 자리(약 250초)로 돌려줬다. 새로 줄 설 때도 진입이 두 번
    // 나가면(StrictMode·연타) 두 번째가 rejoined로 오므로, 저장해 둔 줄을 되살렸을 때만 본다.
    rejoined:
      restored &&
      status === 'waiting' &&
      entry?.status === 'WAITING' &&
      entry.rejoined === true,
    // 첫 조회 전엔 비교할 게 없어 비운다(null).
    admitPerSecond:
      status === 'waiting' && pace?.perSecond != null
        ? formatPace(pace.perSecond)
        : null,
    // 대기 인원은 조회 응답에만 있다 — 첫 조회 전엔 내 순번까지만 센다.
    totalWaiting: lastWaiting?.totalWaiting ?? lastWaiting?.position ?? null,
    progressPercent:
      status === 'mine'
        ? 100
        : position === null || startPosition === null || startPosition <= 1
          ? 0
          : ((startPosition - position) / (startPosition - 1)) * 100,
    close: () => setIsOpen(false),
    reopen: () => setIsOpen(true),
    // 나가면 조회를 멈춘다 — 서버 줄에서는 약 250초 뒤 빠진다.
    leave: () => {
      setHasLeft(true)
      setIsOpen(false)
      onLeave()
    },
  }
}
