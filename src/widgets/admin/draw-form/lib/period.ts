const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const pad = (value: number) => String(value).padStart(2, '0')

/** datetime-local 칸에 넣는 로컬 시각 'YYYY-MM-DDTHH:mm' */
export const toLocalInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`

/** 빨리 정하기 — 지금(분 단위로 내림)부터 days일 뒤 같은 시각까지 */
export function quickPeriod(days: number, now = new Date()) {
  const start = new Date(now)
  start.setSeconds(0, 0)
  return {
    opensAt: toLocalInputValue(start),
    closesAt: toLocalInputValue(new Date(start.getTime() + days * DAY)),
  }
}

/** 응모 기간 길이 — "1일 8시간", "6시간", "2일". 마감이 시작보다 앞이면 null */
export function periodLength(opensAt: string, closesAt: string) {
  const ms = Date.parse(closesAt) - Date.parse(opensAt)
  if (!Number.isFinite(ms) || ms <= 0) return null
  const days = Math.floor(ms / DAY)
  const hours = Math.floor((ms % DAY) / HOUR)
  if (days === 0) return `${Math.max(1, hours)}시간`
  return hours === 0 ? `${days}일` : `${days}일 ${hours}시간`
}
