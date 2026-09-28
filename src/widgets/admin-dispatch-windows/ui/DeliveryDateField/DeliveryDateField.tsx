import { useEffect, useRef, useState } from 'react'

import { CalendarDays } from 'lucide-react'
import { createPortal } from 'react-dom'

import { formatDeliveryDate } from '@/entities/admin-product'
import { Calendar } from '@/shared/ui'

import * as styles from './DeliveryDateField.css'

export type DeliveryDateFieldProps = {
  /** 'YYYY-MM-DD'. null이면 미정 */
  value: string | null
  onChange: (value: string | null) => void
}

const pad = (date: number) => String(date).padStart(2, '0')

const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

// 달력 카드의 대략적인 크기 — 화면 밖으로 나가는지 판단할 때만 쓴다.
const POPOVER_WIDTH = 312
const POPOVER_HEIGHT = 420
const GAP = 4

export function DeliveryDateField({ value, onChange }: DeliveryDateFieldProps) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<DOMRect>()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // 표 카드가 overflow로 잘라내기 때문에 달력은 body에 포털로 띄운다.
  // 그래서 위치를 트리거의 화면 좌표로 직접 계산한다.
  useEffect(() => {
    if (!open) return

    const update = () => setAnchor(triggerRef.current?.getBoundingClientRect())
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }

    // 스크롤하면 트리거가 움직이므로 위치를 다시 잡는다(캡처로 내부 스크롤까지).
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  const toggle = () => {
    setAnchor(triggerRef.current?.getBoundingClientRect())
    setOpen((prev) => !prev)
  }

  // 아래 공간이 모자라면 트리거 위로 띄운다.
  const placeAbove =
    anchor !== undefined &&
    anchor.bottom + POPOVER_HEIGHT > window.innerHeight &&
    anchor.top > POPOVER_HEIGHT

  const position = anchor && {
    top: placeAbove ? undefined : anchor.bottom + GAP,
    bottom: placeAbove ? window.innerHeight - anchor.top + GAP : undefined,
    left: Math.max(
      GAP,
      Math.min(anchor.right - POPOVER_WIDTH, window.innerWidth - POPOVER_WIDTH),
    ),
  }

  return (
    <div className={styles.root}>
      <button
        type="button"
        ref={triggerRef}
        className={value ? styles.trigger : styles.triggerEmpty}
        aria-expanded={open}
        onClick={toggle}
      >
        <CalendarDays className={styles.icon} aria-hidden="true" />
        <span className={styles.text}>{formatDeliveryDate(value)}</span>
      </button>

      {open &&
        position &&
        createPortal(
          <div ref={popoverRef} className={styles.popover} style={position}>
            <Calendar
              className={styles.calendar}
              value={value ? new Date(value) : null}
              onChange={(date) => {
                onChange(toDateInput(date))
                setOpen(false)
              }}
            />
            <div className={styles.footer}>
              <span className={styles.hint}>
                배송일은 미정으로 둘 수 있습니다.
              </span>
              <button
                type="button"
                className={styles.undecidedButton}
                onClick={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                미정으로 두기
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
