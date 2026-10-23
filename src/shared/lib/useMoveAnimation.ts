import { useLayoutEffect, useRef, type RefObject } from 'react'

const DURATION_MS = 150
// 자리 옮김 애니메이션의 이름 — hover 색 바뀜 같은 CSS 전환과 가려낼 때 쓴다(useDragReorder).
export const MOVE_ANIMATION_ID = 'move'

/**
 * 목록 순서가 바뀌면 자리를 옮긴 항목을 옛 자리에서 새 자리로 미끄러뜨린다(FLIP).
 * 화면에 그리기 직전에 지난 위치와 새 위치의 차이만큼 되돌려 놓고 0으로 풀어 준다 —
 * 끌어 옮길 때 다른 줄이 비켜나며 그 사이로 들어가는 것처럼 보인다.
 *
 * container의 자식 순서와 keys 순서가 같아야 한다. 위치는 offsetTop(부모 기준)으로 재서
 * 페이지 스크롤에는 움직이지 않는다.
 */
export function useMoveAnimation(
  containerRef: RefObject<HTMLElement | null>,
  keys: readonly string[],
) {
  const topsRef = useRef(new Map<string, number>())

  // 순서가 안 바뀌면 위치도 그대로라 아무것도 안 한다 — 렌더마다 돌려도 싸다.
  useLayoutEffect(() => {
    const items = [...(containerRef.current?.children ?? [])] as HTMLElement[]
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const tops = new Map<string, number>()
    items.forEach((item, index) => {
      const key = keys[index]
      if (key === undefined) return
      const top = item.offsetTop
      tops.set(key, top)
      const before = topsRef.current.get(key)
      if (reduced || before === undefined || before === top) return
      item.animate(
        [{ transform: `translateY(${before - top}px)` }, { transform: 'none' }],
        { id: MOVE_ANIMATION_ID, duration: DURATION_MS, easing: 'ease-out' },
      )
    })
    topsRef.current = tops
  })
}
