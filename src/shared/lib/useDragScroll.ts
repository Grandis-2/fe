import { useRef, type MouseEvent, type PointerEvent } from 'react'

// 이만큼 움직여야 끄는 것으로 본다 — 그보다 작으면 칩·버튼 클릭이다.
const DRAG_THRESHOLD_PX = 5

/**
 * 가로 스크롤 줄을 마우스로 잡고 끌게 한다(터치는 브라우저 기본 스크롤 그대로). 끌고 나서
 * 놓을 때 생기는 클릭은 막아, 끌다 놓은 자리의 칩이 눌리지 않게 한다. 돌려준 핸들러를
 * 스크롤되는 요소에 펼친다.
 */
export function useDragScroll<T extends HTMLElement>() {
  const drag = useRef<{ x: number; left: number } | null>(null)
  const dragged = useRef(false)

  const end = () => {
    drag.current = null
  }

  return {
    onPointerDown: (event: PointerEvent<T>) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft }
      dragged.current = false
    },
    onPointerMove: (event: PointerEvent<T>) => {
      const start = drag.current
      if (!start) return
      const dx = event.clientX - start.x
      if (!dragged.current && Math.abs(dx) < DRAG_THRESHOLD_PX) return
      dragged.current = true
      event.currentTarget.scrollLeft = start.left - dx
    },
    onPointerUp: end,
    onPointerLeave: end,
    onPointerCancel: end,
    onClickCapture: (event: MouseEvent<T>) => {
      if (!dragged.current) return
      dragged.current = false
      event.preventDefault()
      event.stopPropagation()
    },
  }
}
