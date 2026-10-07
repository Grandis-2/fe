import { parseDateOnly } from '@shared/lib/parseDateOnly'

// live: 예약 중, soon: 오픈 전, done: 마감. 날짜만으로 정하므로 서버가 따로 내려주지 않아도 된다.
export type PreorderStatus = 'live' | 'soon' | 'done'

export type PreorderSchedule = {
  status: PreorderStatus
  ddayLabel: string
}

const DAY_MS = 24 * 60 * 60 * 1000

// 'YYYY-MM-DD'까지 남은 날 수. 오늘이면 0, 지났으면 음수.
const daysUntil = (date: string, today: Date) => {
  const target = parseDateOnly(date)
  if (!target) return Number.NaN
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
  // 서머타임으로 하루가 23·25시간인 날이 있어 반올림한다.
  return Math.round((target.getTime() - startOfToday.getTime()) / DAY_MS)
}

const dday = (days: number) => (days === 0 ? 'D-Day' : `D-${days}`)

// 마감일 당일까지 예약할 수 있다(closesAt 포함).
export function getPreorderSchedule(
  opensAt: string,
  closesAt: string,
  today = new Date(),
): PreorderSchedule {
  const untilOpen = daysUntil(opensAt, today)
  if (untilOpen > 0) {
    return { status: 'soon', ddayLabel: `오픈까지 ${dday(untilOpen)}` }
  }
  const untilClose = daysUntil(closesAt, today)
  if (untilClose >= 0) return { status: 'live', ddayLabel: dday(untilClose) }
  return { status: 'done', ddayLabel: '마감' }
}

// 'YYYY-MM-DD' → 'YYYY.MM.DD'
export const formatPreorderDate = (date: string) => date.replaceAll('-', '.')
