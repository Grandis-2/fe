import { useState } from 'react'

import { CalendarDays } from 'lucide-react'
import { createPortal } from 'react-dom'

import { parseDateOnly } from '@/shared/lib/parseDateOnly'
import { usePopoverAnchor } from '@/shared/lib/usePopoverAnchor'
import { Calendar } from '@/shared/ui/Calendar'

import * as styles from './DateRangeField.css'

export type DateRange = {
  /** 'YYYY-MM-DD'. 비어 있으면 아직 안 고른 상태 */
  start: string
  end: string
}

export type DateRangeFieldProps = {
  value: DateRange
  onChange: (value: DateRange) => void
  placeholder?: string
  className?: string
}

const POPOVER_WIDTH = 312
const POPOVER_HEIGHT = 420

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const pad = (value: number) => String(value).padStart(2, '0')

const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const parse = (value: string) => (value ? parseDateOnly(value) : null)

const formatKorean = (date: Date) =>
  `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`

export function DateRangeField({
  value,
  onChange,
  placeholder = '기간을 선택해 주세요',
  className,
}: DateRangeFieldProps) {
  const [open, setOpen] = useState(false)
  const { triggerRef, popoverRef, style, measure } = usePopoverAnchor<
    HTMLButtonElement,
    HTMLDivElement
  >({
    open,
    onClose: () => setOpen(false),
    width: POPOVER_WIDTH,
    height: POPOVER_HEIGHT,
    align: 'start',
  })

  const start = parse(value.start)
  const end = parse(value.end)
  // 시작만 고른 상태에서는 다음 클릭이 종료일이 된다.
  const pickingEnd = Boolean(start && !end)

  const label =
    start && end
      ? `${formatKorean(start)} ~ ${formatKorean(end)}`
      : start
        ? `${formatKorean(start)} ~ 종료일 선택`
        : placeholder

  const pick = (date: Date) => {
    const picked = toDateInput(date)

    // 시작이 없거나 이미 구간이 완성됐으면 새 구간을 시작한다.
    if (!pickingEnd) {
      onChange({ start: picked, end: '' })
      return
    }
    // 시작보다 앞을 고르면 그 날이 새 시작이 된다 — 거꾸로 된 구간을 만들지 않는다.
    if (picked < value.start) {
      onChange({ start: picked, end: '' })
      return
    }
    onChange({ start: value.start, end: picked })
    setOpen(false)
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <CalendarDays className={styles.icon} aria-hidden="true" />
      <button
        type="button"
        ref={triggerRef}
        className={start ? styles.trigger : styles.triggerEmpty}
        aria-expanded={open}
        onClick={() => {
          measure()
          setOpen((prev) => !prev)
        }}
      >
        {label}
      </button>

      {open &&
        style &&
        createPortal(
          <div ref={popoverRef} className={styles.popover} style={style}>
            <Calendar value={start} rangeEnd={end} onChange={pick} />
            <div className={styles.hint}>
              {pickingEnd ? '종료일을 선택해 주세요' : '시작일을 선택해 주세요'}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
