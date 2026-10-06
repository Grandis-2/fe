import { useEffect, useEffectEvent, useState } from 'react'

const TICK_MS = 1000
// 순번 1이 된 뒤 바로 넘기지 않고 100%를 잠깐 보여준 다음 이동한다.
const COMPLETE_DELAY_MS = 800
// 모달을 닫아도 이 시간 동안은 순번이 유지된다.
const HOLD_SECONDS = 5 * 60

export type QueueStatus = 'waiting' | 'mine' | 'expired'
export type PreorderQueueState = ReturnType<typeof usePreorderQueue>

const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1))

const joinQueue = () => {
  const startOrder = randomInt(80, 300)
  return { startOrder, myOrder: startOrder, behind: randomInt(100, 400) }
}

// ponytail: 대기열 API 연동 전 가짜 진행 — 실시간 순번/대기인원 API(폴링·SSE) 연동 시 교체
export function usePreorderQueue(onComplete: () => void) {
  const [queue, setQueue] = useState(joinQueue)
  const [isOpen, setIsOpen] = useState(true)
  const [hasLeft, setHasLeft] = useState(false)
  const [holdSeconds, setHoldSeconds] = useState(HOLD_SECONDS)
  // 호출부가 매 렌더 새 함수를 넘겨도 타이머가 리셋되지 않도록 Effect Event로 감싼다 —
  // 항상 최신 onComplete를 부르되 이펙트의 의존성에는 들어가지 않는다.
  const handleComplete = useEffectEvent(onComplete)

  const { startOrder, myOrder, behind } = queue
  const status: QueueStatus =
    holdSeconds === 0 ? 'expired' : myOrder <= 1 ? 'mine' : 'waiting'

  // 모달이 닫혀 있어도 순번은 계속 줄어든다.
  useEffect(() => {
    if (status !== 'waiting' || hasLeft) return
    const id = setTimeout(() => {
      // 앞사람이 빠지는 속도가 매번 달라야 실제 대기열처럼 보인다.
      setQueue((prev) => ({
        ...prev,
        myOrder: Math.max(
          1,
          prev.myOrder - randomInt(1, Math.ceil(prev.startOrder / 12)),
        ),
        behind: prev.behind + randomInt(0, 8),
      }))
    }, TICK_MS)
    return () => clearTimeout(id)
  }, [queue, status, hasLeft])

  // 내 차례가 오면 모달이 닫혀 있어도 넘어간다 — 그 사이 QueuePill이 '내 차례예요'를 잠깐 보여 준다.
  useEffect(() => {
    if (status !== 'mine') return
    const id = setTimeout(() => handleComplete(), COMPLETE_DELAY_MS)
    return () => clearTimeout(id)
  }, [status])

  // 순번 유지 시간은 모달이 닫혀 있는 동안만 흐른다.
  useEffect(() => {
    if (isOpen || hasLeft || holdSeconds === 0) return
    const id = setTimeout(() => setHoldSeconds((s) => s - 1), TICK_MS)
    return () => clearTimeout(id)
  }, [isOpen, hasLeft, holdSeconds])

  // 틱마다 평균 (1 + 최대 감소폭) / 2명씩 빠진다.
  const averageStep = (1 + Math.ceil(startOrder / 12)) / 2
  const waitSeconds = ((myOrder - 1) / averageStep) * (TICK_MS / 1000)

  return {
    status,
    isOpen,
    hasLeft,
    holdSeconds,
    myOrder,
    ahead: myOrder - 1,
    waitTime:
      waitSeconds < 60 ? '1분 미만' : `약 ${Math.ceil(waitSeconds / 60)}분`,
    totalWaiting: myOrder + behind,
    progressPercent: ((startOrder - myOrder) / (startOrder - 1)) * 100,
    close: () => setIsOpen(false),
    // 순번이 만료됐으면 맨 뒤로 다시 줄을 선다.
    reopen: () => {
      if (status === 'expired') setQueue(joinQueue())
      setHoldSeconds(HOLD_SECONDS)
      setIsOpen(true)
    },
    leave: () => {
      setHasLeft(true)
      setIsOpen(false)
    },
  }
}
