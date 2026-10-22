/** 대시보드에서 시작한 일괄 재처리 한 번 — 서버 응답(대상 수·예상 시간)과 시작 시각 */
export type ReprocessRun = {
  target: number
  skipped: number
  estimatedSeconds: number
  startedAt: number
}

export type ReprocessProgress = {
  /** 지금쯤 보냈을 건수 — 서버가 초당 일정하게 보낸다고 보고 시간으로 어림한다 */
  sent: number
  remainingSeconds: number
  /** 다 보냈다고 볼 만큼 지났고, 그 뒤에 센 집계를 받았다 */
  finished: boolean
  /** 끝났을 때 아직 재처리 필요로 남은 건수(다시 실패) */
  failed: number
  succeeded: number
  /** 절반 이상이 또 실패했다 — 외부 시스템 문제일 가능성이 크다 */
  mostlyFailed: boolean
}

// 집계는 서버가 5초까지 캐시해서, 끝난 뒤 5초는 지나야 끝난 상태가 숫자에 담긴다.
const STATS_CACHE_MS = 5_000

/** 외부 등록 작업 집계 — 상태별 건수(재처리 필요, 아직 등록 중이거나 재시도 대기) */
export type RegisterCounts = {
  /** 재처리 필요(DEAD_LETTER) 건수 */
  deadLetter: number
  /**
   * 아직 끝나지 않은 건수(PENDING·PROCESSING·RETRY_SCHEDULED). 재처리하면 작업이 PENDING으로
   * 돌아가 DEAD_LETTER에서 빠지므로, 이 값이 0이어야 등록이 끝난 것이다.
   */
  inFlight: number
}

/**
 * 재처리 진행을 어림한다. 서버는 일괄 재처리의 진행을 따로 주지 않아서 보낸 건수는 시간으로,
 * 결과는 예상 시간이 지나고 대기 중인 작업이 없어진 뒤의 집계로 본다.
 * ponytail: 집계엔 재처리하는 동안 새로 실패한 건도 섞여 '다시 실패'가 조금 많게 나올 수
 * 있다. 서버가 일괄 재처리 진행 조회를 주면 그 값으로 바꾼다.
 */
export function reprocessProgress(
  run: ReprocessRun,
  /** 지금 집계. 못 받았으면 null — 끝났다고 보지 않는다 */
  counts: RegisterCounts | null,
  /** 그 집계를 받은 시각(집계를 낸 쿼리의 갱신 시각) */
  now: number,
): ReprocessProgress {
  const durationMs = Math.max(1, run.estimatedSeconds) * 1000
  const elapsed = Math.max(0, now - run.startedAt)
  const finished =
    counts !== null &&
    counts.inFlight === 0 &&
    elapsed >= durationMs + STATS_CACHE_MS
  const failed = Math.min(run.target, counts?.deadLetter ?? 0)
  return {
    sent: Math.round(run.target * Math.min(1, elapsed / durationMs)),
    remainingSeconds: Math.max(0, Math.ceil((durationMs - elapsed) / 1000)),
    finished,
    failed,
    succeeded: run.target - failed,
    mostlyFailed: failed > 0 && failed * 2 >= run.target,
  }
}
