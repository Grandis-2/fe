/** 가장 오래 기다린 외부 등록이 이보다 오래되면 처리가 밀린 것으로 본다 */
export const SLOW_AFTER_MS = 60_000

const DAY_MS = 24 * 60 * 60 * 1000

/** 마감까지 남은 시간 — 하루 넘게 남으면 'D-2', 아니면 '5시간 20분'·'45분'·'곧 마감' */
export function untilClose(closesAt: string, now: number) {
  const left = Date.parse(closesAt) - now
  if (left >= DAY_MS) return `D-${Math.floor(left / DAY_MS)}`
  const minutes = Math.floor(left / 60_000)
  if (minutes < 1) return '곧 마감'
  if (minutes < 60) return `${minutes}분`
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
}
