import type { Draw, DrawPhase } from '../model/draw'

export type DrawSchedule = {
  phase: DrawPhase
  // 응모 중이면 마감까지 남은 날('D-3', 마감일 당일은 'D-day'), 그 밖엔 null.
  dday: string | null
  // 마감이 하루 남았거나 당일이라 눈에 띄게 보일 때.
  urgent: boolean
}

type DrawPeriod = Pick<Draw, 'opensAt' | 'closesAt'>

const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

// 달력 기준 남은 날 수 — 오늘이면 0. 서머타임으로 하루가 23·25시간인 날이 있어 반올림한다.
const daysUntil = (iso: string, now: Date) =>
  Math.round(
    (startOfDay(new Date(iso)).getTime() - startOfDay(now).getTime()) / DAY_MS,
  )

// 서버가 내려주는 phase는 응답 시점 값이라 화면을 오래 띄워 두면 어긋난다(명세) — 시각으로 직접 정한다.
export function getDrawPhase(
  { opensAt, closesAt }: DrawPeriod,
  now = new Date(),
): DrawPhase {
  if (now.getTime() < Date.parse(opensAt)) return 'SCHEDULED'
  return now.getTime() < Date.parse(closesAt) ? 'OPEN' : 'CLOSED'
}

export function getDrawSchedule(
  period: DrawPeriod,
  now = new Date(),
): DrawSchedule {
  const phase = getDrawPhase(period, now)
  if (phase !== 'OPEN') return { phase, dday: null, urgent: false }
  const days = daysUntil(period.closesAt, now)
  return {
    phase,
    dday: days <= 0 ? 'D-day' : `D-${days}`,
    urgent: days <= 1,
  }
}

// 'M.D' — 카드의 오픈 예정·마감 날짜.
export const formatDrawMonthDay = (iso: string) => {
  const date = new Date(iso)
  return `${date.getMonth() + 1}.${date.getDate()}`
}

// '10월 12일 (월) 11:00' — 응모 기간 같은 상세 일정.
export const formatDrawDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
