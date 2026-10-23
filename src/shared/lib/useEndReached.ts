import { useEffect, useEffectEvent, useRef } from 'react'

// 무한 스크롤의 "다음 쪽" 신호 — 목록 끝에 둔 요소(ref)가 화면에서 rootMargin만큼 가까워지면 onReach를 부른다.
// 스크롤 칸(overflow) 안에 둬도 칸 밖으로 잘린 동안엔 보이지 않는 것으로 친다.
// 받는 중·끝·실패면 enabled를 꺼서 멈춘다. 받고 나서도 끝이 보이면 다시 켜질 때 또 부른다.
export function useEndReached<T extends Element>(
  enabled: boolean,
  onReach: () => void,
  rootMargin = '0px',
) {
  const ref = useRef<T>(null)
  const reach = useEffectEvent(onReach)

  useEffect(() => {
    const end = ref.current
    if (!end || !enabled) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reach()
      },
      { rootMargin },
    )
    observer.observe(end)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return ref
}
