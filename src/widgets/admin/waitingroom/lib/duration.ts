/** 초를 사람이 읽는 길이로 — 250 → '4분 10초', 3700 → '1시간 1분' */
export function formatSeconds(seconds: number) {
  if (seconds < 60) return `${seconds}초`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes < 60) return rest ? `${minutes}분 ${rest}초` : `${minutes}분`
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
}

/**
 * 가장 오래 기다린 외부 등록이 몇 초째인지 — 집계를 받은 시각 기준이라 렌더마다 흔들리지
 * 않는다. 기다리는 것이 없으면 null.
 */
export const oldestSeconds = (
  oldestAt: string | null | undefined,
  at: number,
) =>
  oldestAt ? Math.max(0, Math.floor((at - Date.parse(oldestAt)) / 1000)) : null
