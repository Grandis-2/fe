import { useEffect, useEffectEvent, useRef, useState } from 'react'

import {
  useEnterQueue,
  useQueueStatus,
  type QueuePoll,
} from '@entities/preorder'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { isRetryableError } from '@shared/api/queryPolicy'
import { track } from '@shared/lib/analytics'
import { formatNumber } from '@shared/lib/formatNumber'
import { useDeadline } from '@shared/lib/useDeadline'

import {
  usePreorderQueueStore,
  type PreorderAdmission,
} from '../model/preorderQueueStore'

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
// 진입 응답이 이만큼 안 오면 모달을 띄운다 — 바로 입장이면 그 전에 답이 와서 깜빡이지 않고,
// 응답이 늦으면(최대 타임아웃 10초) 눌렀는데 아무 일도 없는 것처럼 보이지 않게.
const SLOW_ENTER_MS = 500
// 이만큼 조회에 성공하지 못하면 줄에서 빠졌을 수 있다(명세: 250초 넘게 조회하지 않으면).
// 안내만 바꾸고 조회는 계속한다. 운영자가 이탈 유예를 늘렸어도 구매자 응답엔 그 값이 없어 기본값을 쓴다.
const LEAVE_GRACE_MS = 250_000

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

// 입장 속도(분당 입장 수) — 예상 시간은 구간이라 줄이 움직이는지 보이지 않아, 직전 조회보다 줄어든 순번으로 센다.
// 1명 미만이어도 움직였으면 0으로 보이지 않게 1로 올린다.
const formatPace = (perMinute: number) =>
  formatNumber(perMinute === 0 ? 0 : Math.max(1, Math.round(perMinute)))

type Options = {
  productId: string
  // 차례가 오면(모달이 닫혀 있어도) 받은 입장권과 함께 호출된다.
  onComplete: (admission: PreorderAdmission) => void
  // 마감·오픈 전·없는 상품처럼 줄을 설 수 없으면 서버 문구와 함께 호출된다.
  onFail: (message: string) => void
  // 나가기를 누르면 호출된다 — 줄을 비워 다른 상품에 설 수 있게 한다.
  onLeave: () => void
}

// 진입(POST) → Retry-After마다 조회(GET) → 입장권. 조회가 NOT_IN_QUEUE면 다시 진입한다(줄에 있었다면 같은 자리).
// 모달을 닫아도 조회는 계속된다 — 약 250초 넘게 조회하지 않으면 줄에서 빠지기 때문이다.
export function usePreorderQueue({
  productId,
  onComplete,
  onFail,
  onLeave,
}: Options) {
  const enter = useEnterQueue()
  const [isOpen, setIsOpen] = useState(true)
  // 서 있는 상품을 다시 누르면(joinPreorderQueue) 닫아 둔 창을 다시 연다 — 렌더 중에 바로 맞춘다.
  const reopenedAt = usePreorderQueueStore((state) => state.reopenedAt)
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
  // 직전 조회의 순번·받은 시각과 그 사이 분당 입장 수. 같은 응답이 와도(구조 공유로 같은 객체) 받은 시각으로
  // 새 조회인지 가린다.
  const [pace, setPace] = useState<{
    position: number
    at: number
    perMinute: number | null
  } | null>(null)
  // 진입이 막혔을 때 다시 진입할 예약 — 객체를 새로 만들어 같은 지연이 반복돼도 이펙트가 다시 돈다.
  const [retry, setRetry] = useState<{ delayMs: number } | null>(null)
  // 호출부가 매 렌더 새 함수를 넘겨도 타이머가 리셋되지 않도록 Effect Event로 감싼다.
  const handleComplete = useEffectEvent(onComplete)
  const handleFail = useEffectEvent(onFail)

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

  // 마운트되는 순간 줄을 선다. 두 번 불려도(StrictMode) 서버는 자리를 하나만 잡는다.
  useEffect(() => {
    join()
  }, [])

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

  // 마지막으로 성공한 조회부터 실패가 이어진 지 250초가 지났다.
  const mayHaveLeftQueue = useDeadline(
    poll.failureCount > 0,
    LEAVE_GRACE_MS,
    poll.dataUpdatedAt,
  ).passed

  const waiting = current?.status === 'WAITING' ? current : null
  // 렌더 중에 바로 맞춘다(이펙트에서 setState하면 react-hooks/set-state-in-effect에 걸린다).
  if (waiting && waiting !== lastWaiting) {
    setLastWaiting(waiting)
    // 다시 진입해 더 뒤로 섰으면 그 순번부터 센다.
    if (startPosition === null || waiting.position > startPosition)
      setStartPosition(waiting.position)
  }
  if (waiting && poll.dataUpdatedAt !== pace?.at) {
    // 다시 진입해 더 뒤로 섰으면 비교하지 않고 새로 잰다.
    const comparable =
      pace !== null &&
      waiting.position <= pace.position &&
      poll.dataUpdatedAt > pace.at
    setPace({
      position: waiting.position,
      at: poll.dataUpdatedAt,
      perMinute: comparable
        ? ((pace.position - waiting.position) /
            (poll.dataUpdatedAt - pace.at)) *
          60_000
        : null,
    })
  }

  // 진입 응답이 늦어 한 번 띄웠으면, 그 뒤 바로 입장이 와도 닫지 않고 100%를 보여 주고 넘어간다.
  const enterIsSlow = useDeadline(
    enter.isPending,
    SLOW_ENTER_MS,
    enter.submittedAt,
  ).passed
  const [shownWhileEntering, setShownWhileEntering] = useState(false)
  if (enterIsSlow && !shownWhileEntering) setShownWhileEntering(true)

  // 진입에서 바로 입장(200)하면 대기열을 보여 주지 않고 넘어간다. 그래서 첫 응답이 SLOW_ENTER_MS 안에
  // 오면 띄우지 않는다(띄웠다 바로 닫히며 깜빡이지 않게). 한 번이라도 기다렸거나, 진입 응답이 늦었거나,
  // 다시 진입을 예약했으면 보여 준다.
  const isHidden = lastWaiting === null && retry === null && !shownWhileEntering

  const status: QueueStatus =
    current?.status === 'ADMITTED' ? 'mine' : 'waiting'
  // 입장했으면 맨 앞(1번), 진입 응답 전이면 모른다(null).
  const position = status === 'mine' ? 1 : (waiting?.position ?? null)
  const admissionTicket =
    current?.status === 'ADMITTED' ? current.admissionTicket : null
  const expiresIn = current?.status === 'ADMITTED' ? current.expiresIn : 0

  // 내 차례가 오면 모달이 닫혀 있어도 넘어간다. 모달이 열려 있으면 100%를 잠깐 보여 주고,
  // 닫혀 있으면 QueuePill이 moveIn초를 센 뒤 넘어간다(그 사이 누르면 모달이 열려 바로 넘어간다).
  useEffect(() => {
    if (!admissionTicket || hasLeft) return
    if (trackedTicket.current !== admissionTicket) {
      trackedTicket.current = admissionTicket
      track('Preorder Queue Admitted', { productId })
    }
    const complete = () =>
      handleComplete({
        productId,
        admissionTicket,
        idempotencyKey: crypto.randomUUID(),
        expiresAt: Date.now() + expiresIn * 1000,
      })
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
  }, [productId, admissionTicket, expiresIn, isHidden, isOpen, moveIn, hasLeft])

  return {
    status,
    isHidden,
    // 조회가 실패하고 있을 때의 안내용(PollingNotice).
    poll: { fetchStatus: poll.fetchStatus, failureCount: poll.failureCount },
    mayHaveLeftQueue,
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
    // 다시 진입했는데 서버가 지켜 둔 자리로 돌려줬다(새로고침·같은 상품 다시 누름 — 약 250초 안).
    rejoined:
      status === 'waiting' &&
      entry?.status === 'WAITING' &&
      entry.rejoined === true,
    // 첫 조회 전엔 비교할 게 없어 비운다(null).
    admitPerMinute:
      status === 'waiting' && pace?.perMinute != null
        ? formatPace(pace.perMinute)
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
