/** 진행 중인 사전예약 하나의 상태 — 심각한 것부터 실패 → 밀림 → 정상 */
export type PreorderHealth = 'failing' | 'slow' | 'ok'

export const preorderHealthLabel: Record<PreorderHealth, string> = {
  // '지금 실패 중'이 아니라 처리 안 한 실패가 남았다는 뜻이라 남은 일로 부른다.
  failing: '재처리 필요',
  slow: '처리 밀림',
  ok: '정상',
}

/** 가장 오래 기다린 외부 등록이 이보다 오래되면 처리가 밀린 것으로 본다 */
export const SLOW_AFTER_MS = 60_000

/**
 * 실패(재처리 필요)가 하나라도 있으면 실패, 외부 등록을 1분 넘게 기다리는 예약이 있으면
 * 밀림. 정상 처리는 몇 초면 끝나서 1분이면 실패로 넘어가기 전에 먼저 알 수 있다.
 * @param oldestPendingAt 외부 등록을 기다리는 예약 중 가장 오래된 접수 시각. 없으면 null
 */
export function preorderHealth({
  failures,
  oldestPendingAt,
  now,
}: {
  failures: number
  oldestPendingAt: string | null
  now: number
}): PreorderHealth {
  if (failures > 0) return 'failing'
  if (oldestPendingAt && now - Date.parse(oldestPendingAt) > SLOW_AFTER_MS) {
    return 'slow'
  }
  return 'ok'
}

/** 마감까지 남은 시간 — '1시간 20분', '45분', '곧 마감' */
export function untilClose(closesAt: string, now: number) {
  const minutes = Math.floor((Date.parse(closesAt) - now) / 60_000)
  if (minutes < 1) return '곧 마감'
  if (minutes < 60) return `${minutes}분`
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
}
