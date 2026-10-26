import type { ReprocessBatchesProgress } from '@entities/admin-reservation'

/**
 * 대시보드에서 시작한 일괄 재처리 한 번 — 서버 응답(대상 수·건너뛴 수·예상 시간·진행 조회 id),
 * 시작 시각, 고른 범위(상품 id, 전체면 null)와 시작 직전의 재처리 필요 건수.
 */
export type ReprocessRun = {
  target: number
  skipped: number
  estimatedSeconds: number
  /** 진행 조회(reprocess-batches/{batchId})에 쓰는 묶음 id들 */
  batchIds: string[]
  startedAt: number
  /** 실행 시점에 고른 상품 — 이후 화면에서 고르기를 바꿔도 이 범위로 센다 */
  scope: string | null
  /** 시작 직전의 재처리 필요(DEAD_LETTER) 건수. 못 쟀으면 null */
  deadLetterAtStart: number | null
}

/** 서버가 센 결과 — 보낸 작업마다 외부 등록이 어떻게 끝났는지 */
export type ReprocessOutcome = Pick<
  ReprocessBatchesProgress,
  'succeeded' | 'failed' | 'canceled' | 'unsent'
>

export type ReprocessProgress = {
  /** 다룬 건수 — 결과가 나왔거나 보내지 못한 것. 서버 진행을 아직 못 받았으면 시간으로 어림한다 */
  sent: number
  remainingSeconds: number
  /** 모든 대상의 결과가 나왔다 */
  finished: boolean
  /** 시작 직전의 재처리 필요 건수. 못 쟀으면 null */
  deadLetterAtStart: number | null
  /** 지금(집계 시각 기준) 재처리 필요 건수. 못 받았으면 null */
  deadLetterNow: number | null
  /** 시작 전보다 줄어든 건수(0 이상). 둘 중 하나라도 없으면 null */
  reduced: number | null
  /** 서버가 센 결과. 진행을 아직 못 받았으면 null */
  outcome: ReprocessOutcome | null
}

/**
 * 재처리 진행. 서버의 진행 조회(batches)를 받았으면 그 값으로 — 다룬 건수와 결과(성공·다시
 * 실패·취소)를 그대로 쓰고, 결과가 다 나와야 끝났다고 본다. 아직 못 받았으면 서버가 초당
 * 일정하게 보낸다고 보고 시간으로 어림하고, 집계 시각이 예상 시간을 넘은 뒤를 끝으로 본다.
 * 남은 시간은 언제나 예상 시간으로 센다(서버는 남은 시간을 주지 않는다).
 */
export function reprocessProgress(
  run: ReprocessRun,
  batches: ReprocessBatchesProgress | undefined,
  /** 지금 재처리 필요 건수. 집계를 못 받았으면 null */
  deadLetterNow: number | null,
  /** 그 집계를 서버가 센 시각(ms, countedAt) */
  countedAt: number,
): ReprocessProgress {
  const durationMs = Math.max(1, run.estimatedSeconds) * 1000
  const elapsed = Math.max(0, countedAt - run.startedAt)
  const reduced =
    run.deadLetterAtStart !== null && deadLetterNow !== null
      ? Math.max(0, run.deadLetterAtStart - deadLetterNow)
      : null
  const base = {
    remainingSeconds: Math.max(0, Math.ceil((durationMs - elapsed) / 1000)),
    deadLetterAtStart: run.deadLetterAtStart,
    deadLetterNow,
    reduced,
  }
  if (batches)
    return {
      ...base,
      sent: batches.targetCount - batches.pending,
      finished: batches.finished,
      outcome: {
        succeeded: batches.succeeded,
        failed: batches.failed,
        canceled: batches.canceled,
        unsent: batches.unsent,
      },
    }
  return {
    ...base,
    sent: Math.round(run.target * Math.min(1, elapsed / durationMs)),
    finished: deadLetterNow !== null && elapsed >= durationMs,
    outcome: null,
  }
}
