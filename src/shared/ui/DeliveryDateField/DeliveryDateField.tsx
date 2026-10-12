import { useState } from 'react'

import { CalendarDays } from 'lucide-react'
import { createPortal } from 'react-dom'

import { formatDeliveryDate } from '@shared/lib/formatDeliveryDate'
import { parseDateOnly } from '@shared/lib/parseDateOnly'
import { usePopoverAnchor } from '@shared/lib/usePopoverAnchor'

import { Calendar } from '../Calendar'

import * as styles from './DeliveryDateField.css'

export type DeliveryDateFieldProps = {
  /** 'YYYY-MM-DD'. null이면 미정 */
  value: string | null
  onChange: (value: string | null) => void
  /**
   * 'compact'(기본)는 표 칸에 들어갈 때 — 아이콘까지 한 박스에 담아 좁게 쓴다.
   * 'field'는 폼 한 줄에 들어갈 때 — 아이콘을 밖에 두고 박스를 가운데 정렬해,
   * 같은 섹션의 다른 일시 입력칸과 높이·라운드를 맞춘다.
   */
  layout?: 'compact' | 'field'
}

const pad = (date: number) => String(date).padStart(2, '0')

const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const POPOVER_WIDTH = 312
const POPOVER_HEIGHT = 420

export function DeliveryDateField({
  value,
  onChange,
  layout = 'compact',
}: DeliveryDateFieldProps) {
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

  const toggle = () => {
    measure()
    setOpen((prev) => !prev)
  }

  return (
    <div className={styles.root}>
      {layout === 'field' ? (
        <div className={styles.row}>
          <span className={styles.iconBox}>
            <CalendarDays className={styles.iconLarge} aria-hidden="true" />
          </span>
          <button
            type="button"
            ref={triggerRef}
            className={value ? styles.summary : styles.summaryEmpty}
            aria-expanded={open}
            onClick={toggle}
          >
            {formatDeliveryDate(value)}
          </button>
        </div>
      ) : (
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
      )}

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
