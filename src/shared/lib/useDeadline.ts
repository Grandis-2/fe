import { useEffect, useState } from 'react'

/**
 * 폴링 제한 시간. active인 동안 from(없으면 active가 된 때)부터 limitMs가 지나면 passed가 된다.
 * from·limitMs가 바뀌거나 restart하면 처음부터 다시 센다.
 *
 * 렌더 중에 Date.now()를 읽지 않으려고 타이머로 잰다. 제한이 지나도 이미 나간 요청은 끊지 않는다 —
 * 쓰는 쪽은 passed면 재시도를 그만두고(pollingRetry의 expired) 쿼리를 끈다(enabled).
 */
export function useDeadline(active: boolean, limitMs: number, from?: number) {
  const [round, setRound] = useState(0)
  const [passedKey, setPassedKey] = useState<string | null>(null)
  const key = `${round}:${from}:${limitMs}`

  useEffect(() => {
    if (!active) return
    const wait = from === undefined ? limitMs : from + limitMs - Date.now()
    const id = setTimeout(() => setPassedKey(key), Math.max(0, wait))
    return () => clearTimeout(id)
  }, [active, key, limitMs, from])

  return {
    passed: active && passedKey === key,
    restart: () => setRound((value) => value + 1),
  }
}
