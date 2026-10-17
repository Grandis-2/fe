import { useEffect, useRef, useState } from 'react'

/**
 * 화면이 실제로 사라질 때 끊기는 signal. 마운트 때 한 번만 시작하는 작업(결제 승인 뒤 폴링)에 넘긴다.
 * StrictMode는 effect를 정리하고 곧바로(같은 작업 안에서) 다시 실행한다 — 정리할 때 바로 끊으면
 * 개발 모드에선 시작하자마자 끊기므로, 정리 뒤 다시 실행되지 않았을 때만 끊는다.
 */
export function useUnmountSignal() {
  const [controller] = useState(() => new AbortController())
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      queueMicrotask(() => {
        if (!mounted.current) controller.abort()
      })
    }
  }, [controller])

  return controller.signal
}
