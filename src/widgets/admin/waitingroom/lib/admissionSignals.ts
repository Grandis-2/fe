/**
 * 밀리는지 판단할 만큼 잰 구간. 서버는 최근 1분을 재지만 막 뜬 직후엔 구간이 짧다 —
 * 이보다 짧으면 출렁임과 구분이 안 돼 판단을 미룬다.
 */
export const CONGESTION_WINDOW_MS = 30_000

/** 운영 현황(GET /admin/preorders/stats)에서 판정에 쓰는 칸만 */
export type FlowStats = {
  countedAt: string
  preorders: { PENDING_SYNC: number }
  syncJobs: { REGISTER: { DEAD_LETTER: number } }
  /** 서버가 잰 최근 1분 속도. 막 떴거나 접수 중이 아니면 null */
  rates: {
    receivedPerSec: number
    registeredPerSec: number
    backlogPerMin: number
    windowSeconds: number
  } | null
}

export type AdmissionSignals = {
  /** 센 시각(ms). 현황을 못 받았으면 null */
  at: number | null
  /** 속도를 잰 구간(초). 속도가 없으면 0 */
  coveredSeconds: number
  /** 초당 접수. 속도가 없으면 null */
  received: number | null
  /** 초당 외부 등록 처리(등록 대기에서 빠져나간 수). 속도가 없으면 null */
  processed: number | null
  /** 지금 외부 등록 대기(재처리 필요는 뺀다). 현황을 못 받았으면 null */
  backlog: number | null
  /** 외부 등록 대기의 분당 변화(늘면 +). 속도가 없으면 null */
  backlogPerMinute: number | null
  /** 판단할 만큼 잰 구간이 찼는지. 아니면 judgedInSeconds 뒤에 판단한다 */
  judged: boolean
  judgedInSeconds: number
  /** 잰 구간 동안 외부 등록 대기가 늘었다 = 처리가 접수를 못 따라간다 */
  congested: boolean
}

/**
 * 운영 현황에서 접수·처리 속도와 밀림을 꺼낸다. 속도는 서버가 10초 기록으로 잰 값이라 화면을
 * 새로 고쳐도, 관리자마다 같다.
 */
export function admissionSignals(
  stats: FlowStats | undefined,
): AdmissionSignals {
  const rates = stats?.rates ?? null
  const coveredMs = (rates?.windowSeconds ?? 0) * 1000
  const judged = coveredMs >= CONGESTION_WINDOW_MS
  return {
    at: stats ? Date.parse(stats.countedAt) : null,
    coveredSeconds: rates?.windowSeconds ?? 0,
    received: rates?.receivedPerSec ?? null,
    processed: rates?.registeredPerSec ?? null,
    // 재처리 필요(DEAD_LETTER)도 원장으로는 PENDING_SYNC지만 처리 중이 아니라 뺀다.
    backlog: stats
      ? Math.max(
          0,
          stats.preorders.PENDING_SYNC - stats.syncJobs.REGISTER.DEAD_LETTER,
        )
      : null,
    backlogPerMinute: rates?.backlogPerMin ?? null,
    judged,
    judgedInSeconds: Math.max(
      0,
      Math.ceil((CONGESTION_WINDOW_MS - coveredMs) / 1000),
    ),
    congested: judged && (rates?.backlogPerMin ?? 0) > 0,
  }
}
