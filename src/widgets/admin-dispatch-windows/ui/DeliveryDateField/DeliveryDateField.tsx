import { useState } from 'react'

import { CalendarDays } from 'lucide-react'
import { createPortal } from 'react-dom'

import { formatDeliveryDate } from '@/entities/admin-product'
import { parseDateOnly } from '@/shared/lib/parseDateOnly'
import { usePopoverAnchor } from '@/shared/lib/usePopoverAnchor'
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

const POPOVER_WIDTH = 312
const POPOVER_HEIGHT = 420

export function DeliveryDateField({ value, onChange }: DeliveryDateFieldProps) {
  const [open, setOpen] = useState(false)
  // 표 카드가 overflow로 잘라내기 때문에 달력은 body에 포털로 띄운다.
  const { triggerRef, popoverRef, style, measure } = usePopoverAnchor<
    HTMLButtonElement,
    HTMLDivElement
  >({
    open,
    onClose: () => setOpen(false),
    width: POPOVER_WIDTH,
    height: POPOVER_HEIGHT,
  })

  return (
    <div className={styles.root}>
      <button
        type="button"
        ref={triggerRef}
        className={value ? styles.trigger : styles.triggerEmpty}
        aria-expanded={open}
        onClick={() => {
          measure()
          setOpen((prev) => !prev)
        }}
      >
        <CalendarDays className={styles.icon} aria-hidden="true" />
        <span className={styles.text}>{formatDeliveryDate(value)}</span>
      </button>

      {open &&
        style &&
        createPortal(
          <div ref={popoverRef} className={styles.popover} style={style}>
            <Calendar
              className={styles.calendar}
              value={value ? parseDateOnly(value) : null}
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
