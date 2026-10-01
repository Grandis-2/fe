import { useEffect, useRef, useState } from 'react'

import { CalendarDays } from 'lucide-react'

import { Calendar } from '@/shared/ui'

import * as styles from './PreorderPeriodField.css'

export type PreorderPeriodFieldProps = {
  /** datetime-local 형식('YYYY-MM-DDTHH:mm'). 비어 있으면 아직 안 고른 상태 */
  openAt: string
  /** 마감은 항상 오픈 당일 23:59이라 함께 계산해서 넘긴다 */
  onChange: (openAt: string, closeAt: string) => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const CLOSE_TIME = '23:59'
const DEFAULT_TIME = '09:00'

const pad = (value: number) => String(value).padStart(2, '0')

const HOURS = Array.from({ length: 24 }, (_, index) => pad(index))
const MINUTES = Array.from({ length: 60 }, (_, index) => pad(index))

const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const parseDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatKorean = (date: Date, time: string) =>
  `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]}) ${time}`

export function PreorderPeriodField({
  openAt,
  onChange,
}: PreorderPeriodFieldProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const hourListRef = useRef<HTMLDivElement>(null)
  const minuteListRef = useRef<HTMLDivElement>(null)

  // 달력 바깥을 누르면 닫는다.
  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const openDate = parseDate(openAt)
  const openTime = openAt.slice(11, 16) || DEFAULT_TIME
  const [hour, minute] = openTime.split(':')

  // 열릴 때 선택된 시/분이 보이도록 스크롤을 맞춘다.
  useEffect(() => {
    if (!open) return
    for (const list of [hourListRef.current, minuteListRef.current]) {
      const selected = list?.querySelector('[aria-selected="true"]')
      selected?.scrollIntoView({ block: 'center' })
    }
  }, [open])

  const commit = (date: Date, time: string) => {
    const day = toDateInput(date)
    onChange(`${day}T${time}`, `${day}T${CLOSE_TIME}`)
  }

  const summary = openDate
    ? `${formatKorean(openDate, openTime)} ~ ${formatKorean(openDate, CLOSE_TIME)}`
    : '오픈 일시를 선택해주세요'

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="달력 열기"
          onClick={() => setOpen((prev) => !prev)}
        >
          <CalendarDays className={styles.icon} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={openDate ? styles.summary : styles.summaryEmpty}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          {summary}
        </button>
      </div>

      {open && (
        <div className={styles.popover}>
          <Calendar
            className={styles.calendar}
            value={openDate}
            onChange={(date) => commit(date, openTime)}
          />

          <div className={styles.timePanel}>
            <div className={styles.timeTitle}>오픈 시각</div>
            <div className={styles.timeLists}>
              <div className={styles.timeList} ref={hourListRef} role="listbox" aria-label="시">
                {HOURS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="option"
                    aria-selected={value === hour}
                    className={
                      value === hour ? styles.timeItemActive : styles.timeItem
                    }
                    onClick={() =>
                      commit(openDate ?? new Date(), `${value}:${minute}`)
                    }
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className={styles.timeList} ref={minuteListRef} role="listbox" aria-label="분">
                {MINUTES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="option"
                    aria-selected={value === minute}
                    className={
                      value === minute ? styles.timeItemActive : styles.timeItem
                    }
                    onClick={() =>
                      commit(openDate ?? new Date(), `${hour}:${value}`)
                    }
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.closeHint}>
              마감은 오픈 당일 {CLOSE_TIME}로 자동 설정됩니다.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
