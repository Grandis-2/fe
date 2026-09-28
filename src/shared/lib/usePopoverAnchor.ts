import { useEffect, useRef, useState, type CSSProperties } from 'react'

export type PopoverAnchorOptions = {
  open: boolean
  onClose: () => void
  /** 팝오버의 대략적인 크기 — 화면 밖으로 나가는지 판단할 때만 쓴다 */
  width: number
  height: number
  /** 트리거와의 간격 */
  gap?: number
  /** 트리거의 왼쪽에 맞출지 오른쪽에 맞출지 */
  align?: 'start' | 'end'
}

/**
 * 표 카드처럼 overflow가 걸린 부모 안에서도 잘리지 않게, 팝오버를 body에
 * 포털로 띄울 때 쓰는 위치 계산.
 *
 * 포털로 나가면 부모 기준의 absolute 배치를 못 쓰므로 트리거의 화면 좌표로
 * 직접 자리를 잡고, 스크롤·리사이즈 때 다시 잡는다. 아래 공간이 모자라면
 * 트리거 위로 뒤집는다. 바깥 클릭은 트리거와 팝오버 양쪽을 모두 확인해야
 * 한다 — 포털 때문에 DOM상 떨어져 있어서 contains 한 번으로는 못 잡는다.
 */
export function usePopoverAnchor<
  TTrigger extends HTMLElement,
  TPopover extends HTMLElement,
>({
  open,
  onClose,
  width,
  height,
  gap = 4,
  align = 'end',
}: PopoverAnchorOptions) {
  const triggerRef = useRef<TTrigger>(null)
  const popoverRef = useRef<TPopover>(null)
  const [anchor, setAnchor] = useState<DOMRect>()

  // 열기 직전 좌표를 잡아 둔다 — 첫 프레임부터 제자리에 뜬다.
  const measure = () => setAnchor(triggerRef.current?.getBoundingClientRect())

  useEffect(() => {
    if (!open) return

    const update = () => setAnchor(triggerRef.current?.getBoundingClientRect())
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        onClose()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    // 스크롤하면 트리거가 움직이므로 위치를 다시 잡는다(캡처로 내부 스크롤까지).
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  const placeAbove =
    anchor !== undefined &&
    anchor.bottom + height > window.innerHeight &&
    anchor.top > height

  const style: CSSProperties | undefined = anchor && {
    top: placeAbove ? undefined : anchor.bottom + gap,
    bottom: placeAbove ? window.innerHeight - anchor.top + gap : undefined,
    left: Math.max(
      gap,
      Math.min(
        align === 'end' ? anchor.right - width : anchor.left,
        window.innerWidth - width - gap,
      ),
    ),
  }

  return { triggerRef, popoverRef, style, measure }
}
