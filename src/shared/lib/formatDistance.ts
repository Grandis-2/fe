const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * 두 시각 사이를 사람이 읽는 길이로 — "N분", "N시간", "N일". 앞뒤(뒤·전)는 호출부가
 * 붙인다. 1분이 안 되면 "1분"으로 둔다(0분 뒤 마감은 어색하다).
 */
export function formatDistance(ms: number): string {
  const abs = Math.abs(ms)
  if (abs < HOUR) return `${Math.max(1, Math.floor(abs / MINUTE))}분`
  if (abs < DAY) return `${Math.floor(abs / HOUR)}시간`
  return `${Math.floor(abs / DAY)}일`
}
