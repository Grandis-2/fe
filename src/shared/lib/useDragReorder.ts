import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react'

import { MOVE_ANIMATION_ID } from './useMoveAnimation'

export type ReorderVia = 'drag' | 'keyboard'

export type UseDragReorderOptions = {
  /** 지금 보이는 순서 */
  ids: readonly string[]
  /**
   * 자리를 옮긴 새 순서. 끄는 동안엔 다른 항목 위를 지날 때마다(놓일 자리를 미리 보여준다),
   * 키보드는 한 칸 옮길 때마다 부른다.
   */
  onReorder: (ids: string[], via: ReorderVia) => void
  /** 끌기가 끝났다. 목록 밖에 놓았거나 Esc로 취소했으면 cancelled */
  onDragEnd?: (cancelled: boolean) => void
  /** 키보드로 옮길 방향 — 세로 목록은 ↑/↓, 가로로 늘어선 타일은 ←/→ */
  axis?: 'vertical' | 'horizontal'
  /** 지금은 옮기면 안 된다(저장 중, 폼이 잠김) — 이벤트가 올 때마다 확인한다 */
  isLocked?: () => boolean
}

const KEYS = {
  vertical: { prev: 'ArrowUp', next: 'ArrowDown' },
  horizontal: { prev: 'ArrowLeft', next: 'ArrowRight' },
} as const

const moveTo = (ids: readonly string[], id: string, to: number) => {
  const next = ids.filter((item) => item !== id)
  next.splice(to, 0, id)
  return next
}

/**
 * 끌어서(HTML5 Drag and Drop) 또는 방향키로 순서를 바꾸는 목록. 항목마다 `itemProps(id)`를
 * 펼쳐 붙인다. 순서를 어디에 반영할지(폼 값·화면용 임시 순서·서버 저장)는 부르는 쪽이 정한다.
 */
export function useDragReorder({
  ids,
  onReorder,
  onDragEnd,
  axis = 'vertical',
  isLocked = () => false,
}: UseDragReorderOptions) {
  // 끌고 있는 항목
  const [draggingId, setDraggingId] = useState<string | null>(null)
  // 목록 위에 놓았는지. 브라우저가 놓기를 받아들였을 때만 drop이 온다 — dragend의
  // dropEffect는 브라우저마다 다르게 와서 이걸로 취소를 가린다.
  const droppedRef = useRef(false)

  const itemProps = (id: string) => ({
    draggable: true,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      if (isLocked()) {
        event.preventDefault()
        return
      }
      setDraggingId(id)
      droppedRef.current = false
      event.dataTransfer.effectAllowed = 'move'
      // Firefox는 데이터를 넣지 않으면 끌기를 시작하지 않는다.
      event.dataTransfer.setData('text/plain', id)
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      // 바깥에서 끌고 온 파일 등 이 목록의 끌기가 아니면 손대지 않는다.
      if (!draggingId) return
      // 끄는 항목 자기 위에서도 '놓을 수 있다'고 알린다 — 옮긴 항목은 늘 커서 밑에 있어서,
      // 안 알리면 놓는 순간 브라우저가 끌던 그림을 원래 자리로 되돌려 보낸다.
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      if (draggingId === id || isLocked()) return
      // 막 비켜나는 항목은 아직 커서 밑을 지나는 중이다 — 여기서 또 옮기면 두 항목이
      // 자리를 주고받으며 떨린다. 다 비켜난 뒤에 다시 본다(hover 색 전환 같은 건 상관없다).
      if (
        event.currentTarget
          .getAnimations()
          .some(({ id }) => id === MOVE_ANIMATION_ID)
      )
        return
      onReorder(moveTo(ids, draggingId, ids.indexOf(id)), 'drag')
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      if (!draggingId) return
      event.preventDefault()
      droppedRef.current = true
    },
    onDragEnd: () => {
      setDraggingId(null)
      onDragEnd?.(!droppedRef.current)
    },
    // 끌기를 못 쓰는 사용자를 위해 포커스한 항목은 방향키로 한 칸씩 옮긴다.
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget || isLocked()) return
      const index = ids.indexOf(id)
      const to =
        event.key === KEYS[axis].prev
          ? index - 1
          : event.key === KEYS[axis].next
            ? index + 1
            : -1
      if (to < 0 || to >= ids.length) return
      event.preventDefault()
      onReorder(moveTo(ids, id, to), 'keyboard')
      // 자리를 옮기며 DOM이 다시 끼워지면 포커스가 풀릴 수 있어 같은 항목에 되돌린다.
      const item = event.currentTarget
      requestAnimationFrame(() => item.focus())
    },
  })

  return { draggingId, itemProps }
}
