import { useCallback, useEffect, useRef, useState } from 'react'

// 화살표 한 번에 보이는 폭의 85%만 넘겨, 직전 카드 끝이 살짝 남아 이어지는 줄임을 알 수 있게 한다.
const PAGE_RATIO = 0.85

// 가로 스크롤 줄 + 이전/다음 화살표(ScrollArrows). 끝에 닿으면 그쪽 화살표를 끈다.
// itemCount: 줄 자체의 폭은 그대로라 목록이 채워져도 ResizeObserver가 안 불린다 — 개수가 바뀌면 한 번 더 잰다.
export function useScrollArrows(itemCount?: number) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const sync = useCallback(() => {
    const el = rowRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [sync, itemCount])

  const page = (dir: 1 | -1) => {
    const el = rowRef.current
    el?.scrollBy({ left: dir * el.clientWidth * PAGE_RATIO })
  }

  return { rowRef, onScroll: sync, canPrev, canNext, page }
}
