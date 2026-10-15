import { useEffect, useRef, useState } from 'react'

// 궤도는 고정 크기 도면을 칸 폭에 맞춰 줄여 그린다 — 그 비율을 정하려고 칸 폭을 잰다.
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}
