import { useState } from 'react'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import * as styles from './Calendar.css'

export type CalendarProps = {
  value?: Date | null
  onChange: (date: Date) => void
  /**
   * 구간 선택. value가 시작일이 되고 rangeEnd가 종료일이 된다.
   * 넘기면 두 날 사이가 옅게 이어져 보인다.
   */
  rangeEnd?: Date | null
  className?: string
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const WEEKS_IN_GRID = 6

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

/** 달력 격자에 채울 42칸(6주)을 만든다. 앞뒤 달 날짜로 빈칸을 메운다. */
function getMonthGrid(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - firstDay.getDay())

  return Array.from({ length: WEEKS_IN_GRID * WEEKDAYS.length }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
}

export function Calendar({
  value,
  onChange,
  rangeEnd,
  className,
}: CalendarProps) {
  const [month, setMonth] = useState(() =>
    value
      ? new Date(value.getFullYear(), value.getMonth(), 1)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )

  const today = startOfDay(new Date())
  const days = getMonthGrid(month)

  const moveMonth = (offset: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1))

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          aria-label="이전 달"
          onClick={() => moveMonth(-1)}
        >
          <ChevronLeft className={styles.navIcon} aria-hidden="true" />
        </button>
        <div className={styles.monthLabel}>
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </div>
        <button
          type="button"
          className={styles.navButton}
          aria-label="다음 달"
          onClick={() => moveMonth(1)}
        >
          <ChevronRight className={styles.navIcon} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.grid}>
        {WEEKDAYS.map((weekday, index) => (
          <div key={weekday} className={styles.weekday[dayTone(index)]}>
            {weekday}
          </div>
        ))}

        {days.map((date) => {
          const outside = date.getMonth() !== month.getMonth()
          const selected = Boolean(
            (value && isSameDay(date, value)) ||
            (rangeEnd && isSameDay(date, rangeEnd)),
          )
          // 양 끝은 selected가 맡으므로 사이에 낀 날만 이어 칠한다.
          const inRange = Boolean(
            !selected &&
            value &&
            rangeEnd &&
            date > startOfDay(value) &&
            date < startOfDay(rangeEnd),
          )

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={[
                styles.day[outside ? 'outside' : dayTone(date.getDay())],
                inRange && styles.dayInRange,
                selected && styles.daySelected,
                !selected && isSameDay(date, today) && styles.dayToday,
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={selected}
              aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`}
              onClick={() => onChange(startOfDay(date))}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** 일요일은 빨강, 토요일은 파랑 */
function dayTone(dayIndex: number) {
  if (dayIndex === 0) return 'sunday' as const
  if (dayIndex === 6) return 'saturday' as const
  return 'weekday' as const
}
