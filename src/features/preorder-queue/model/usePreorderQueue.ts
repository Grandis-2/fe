import { useEffect, useState } from 'react'

const TICK_MS = 1000
// 순번 1이 된 뒤 바로 넘기지 않고 100%를 잠깐 보여준 다음 이동한다.
const COMPLETE_DELAY_MS = 800

const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1))

// ponytail: 대기열 API 연동 전 가짜 진행 — 실시간 순번/대기인원 API(폴링·SSE) 연동 시 교체
export function usePreorderQueue(onComplete: () => void) {
  const [startOrder] = useState(() => randomInt(80, 300))
  const [myOrder, setMyOrder] = useState(startOrder)
  const [behind, setBehind] = useState(() => randomInt(100, 400))

  useEffect(() => {
    if (myOrder <= 1) {
      const id = setTimeout(onComplete, COMPLETE_DELAY_MS)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => {
      // 앞사람이 빠지는 속도가 매번 달라야 실제 대기열처럼 보인다.
      setMyOrder((order) =>
        Math.max(1, order - randomInt(1, Math.ceil(startOrder / 12))),
      )
      setBehind((count) => count + randomInt(0, 8))
    }, TICK_MS)
    return () => clearTimeout(id)
  }, [myOrder, startOrder, onComplete])

  return {
    myOrder,
    totalWaiting: myOrder + behind,
    progressPercent: ((startOrder - myOrder) / (startOrder - 1)) * 100,
  }
}
