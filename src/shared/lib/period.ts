/** 목록을 시각으로 거르는 기간 — 관리자 목록의 '접수·주문 기간' 드롭다운 */
export type Period = 'all' | 'hour' | 'today' | 'yesterday' | 'week' | 'month'

export const periodLabels: Record<Period, string> = {
  all: '전체 기간',
  hour: '최근 1시간',
  today: '오늘',
  yesterday: '어제',
  week: '최근 7일',
  month: '최근 30일',
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 기간의 [from, to) — 서버에 보낼 ISO 시각. 1시간 말고는 이 기기 시간대의 자정에 맞춰, 같은
 * 날 안에서는 몇 번 불러도 같은 값이다(조회 키가 흔들려 다시 받지 않게). '최근 7일'은 오늘을
 * 넣은 7일이다.
 */
export function periodRange(
  period: Period,
  now: number,
): { from?: string; to?: string } {
  if (period === 'all') return {}
  if (period === 'hour')
    return { from: new Date(now - 60 * 60 * 1000).toISOString() }
  const today = new Date(now).setHours(0, 0, 0, 0)
  const daysBack = { today: 0, yesterday: 1, week: 6, month: 29 }[period]
  const from = new Date(today - daysBack * DAY_MS).toISOString()
  return period === 'yesterday'
    ? { from, to: new Date(today).toISOString() }
    : { from }
}
