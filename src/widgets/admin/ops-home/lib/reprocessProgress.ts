/**
 * 대시보드에서 시작한 일괄 재처리 한 번 — 서버 응답(대상 수·건너뛴 수·예상 시간), 시작 시각,
 * 고른 범위(상품 id, 전체면 null)와 시작 직전의 재처리 필요 건수.
 */
export type ReprocessRun = {
  target: number
  skipped: number
  estimatedSeconds: number
  startedAt: number
  /** 실행 시점에 고른 상품 — 이후 화면에서 고르기를 바꿔도 이 범위로 센다 */
  scope: string | null
  /** 시작 직전의 재처리 필요(DEAD_LETTER) 건수. 못 쟀으면 null */
  deadLetterAtStart: number | null
}

export type ReprocessProgress = {
  /** 지금쯤 보냈을 건수 — 서버가 초당 일정하게 보낸다고 보고 시간으로 어림한다 */
  sent: number
  remainingSeconds: number
  /** 예상 시간이 지났고, 그 뒤에 센 집계를 받았다 */
  finished: boolean
  /** 시작 직전의 재처리 필요 건수. 못 쟀으면 null */
  deadLetterAtStart: number | null
  /** 지금(집계 시각 기준) 재처리 필요 건수. 못 받았으면 null */
  deadLetterNow: number | null
  /** 시작 전보다 줄어든 건수(0 이상). 둘 중 하나라도 없으면 null */
  reduced: number | null
}

/**
 * 재처리 진행을 어림한다. 서버는 일괄 재처리의 진행을 따로 주지 않는다. 보낸 건수는 시간으로,
 * 끝남은 집계 시각이 예상 시간을 넘은 뒤로 본다. 결과는 "재처리 필요 건수가 얼마나 줄었는지"만
 * 말한다 — 이 값으로 보낸 작업이 몇 건 성공·실패했는지는 알 수 없다.
 * 집계 시각은 서버가 센 시각(countedAt)이라 서버 캐시(최대 5초)만큼 옛 값일 수 있는 건 이미
 * 시각에 담긴다. 서버와 브라우저 시계가 어긋나면 끝나는 시점도 그만큼 앞뒤로 움직인다.
 * ponytail: 집계엔 재처리 중 새로 생긴 실패도 섞여 '줄어든 건수'가 조금 적게 나올 수 있다.
 * 한계와 업그레이드 경로: 서버가 일괄 재처리의 진행(처리·성공·실패 건수)을 주거나 보낸 작업 id
 * 묶음의 상태를 조회하게 되면, 그 값으로 바꾸고 "모두 다시 등록했어요" 같은 단정 문구를 되살린다.
 */
export function reprocessProgress(
  run: ReprocessRun,
  /** 지금 재처리 필요 건수. 집계를 못 받았으면 null — 끝났다고 보지 않는다 */
  deadLetterNow: number | null,
  /** 그 집계를 서버가 센 시각(ms, countedAt) */
  countedAt: number,
): ReprocessProgress {
  const durationMs = Math.max(1, run.estimatedSeconds) * 1000
  const elapsed = Math.max(0, countedAt - run.startedAt)
  const finished = deadLetterNow !== null && elapsed >= durationMs
  const reduced =
    run.deadLetterAtStart !== null && deadLetterNow !== null
      ? Math.max(0, run.deadLetterAtStart - deadLetterNow)
      : null
  return {
    sent: Math.round(run.target * Math.min(1, elapsed / durationMs)),
    remainingSeconds: Math.max(0, Math.ceil((durationMs - elapsed) / 1000)),
    finished,
    deadLetterAtStart: run.deadLetterAtStart,
    deadLetterNow,
    reduced,
  }
}
