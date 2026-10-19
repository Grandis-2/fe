import { useEffect } from 'react'

// 장면을 시간(초)에 따라 매 프레임 다시 그린다. React 상태를 거치지 않고 draw가 SVG 속성을
// 직접 바꾼다 — 초당 60번 리렌더하지 않으려고. 움직임 줄이기 설정이면 startAt 장면에서 멈춘다.
// draw는 useCallback으로 고정해 넘긴다(바뀌면 시계가 startAt부터 다시 돈다).
export function useFrameLoop(draw: (t: number) => void, startAt: number) {
  useEffect(() => {
    let t = startAt
    draw(t)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let last = performance.now()
    let raf = requestAnimationFrame(function loop(now) {
      // 탭이 백그라운드였다 돌아오면 dt가 커진다 — 한 번에 튀지 않게 상한을 둔다.
      t += Math.min(0.05, (now - last) / 1000)
      last = now
      draw(t)
      raf = requestAnimationFrame(loop)
    })
    return () => cancelAnimationFrame(raf)
  }, [draw, startAt])
}
