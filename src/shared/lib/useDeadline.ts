import { useEffect, useState } from 'react'

/**
 * 폴링 제한 시간. active인 동안 from(없으면 active가 된 때)부터 limitMs가 지나면 passed가 된다.
 * from·limitMs가 바뀌면 처음부터 다시 센다. restart하면 from과 상관없이 그때부터 limitMs를 센다 — from이 이미
 * 지난 시각이면 다시 세자마자 지나 버리기 때문이다.
 *
 * 렌더 중에 Date.now()를 읽지 않으려고 타이머로 잰다. 제한이 지나도 이미 나간 요청은 끊지 않는다 —
 * 쓰는 쪽은 passed면 재시도를 그만두고(pollingRetry의 expired) 쿼리를 끈다(enabled).
 */
export function useDeadline(active: boolean, limitMs: number, from?: number) {
  const [restarted, setRestarted] = useState<{ from?: number; at: number }>()
  const [passedKey, setPassedKey] = useState<string | null>(null)
  // 다시 센 뒤 from이 바뀌면(다른 대상) restart는 잊고 새 from부터 센다.
  const start = restarted && restarted.from === from ? restarted.at : from
  const key = `${start}:${limitMs}`

  useEffect(() => {
    if (!active) return
    const wait = start === undefined ? limitMs : start + limitMs - Date.now()
    const id = setTimeout(() => setPassedKey(key), Math.max(0, wait))
    return () => clearTimeout(id)
  }, [active, key, limitMs, start])

  return {
    passed: active && passedKey === key,
    restart: () => setRestarted({ from, at: Date.now() }),
  }
}
