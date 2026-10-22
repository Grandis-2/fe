import { describe, expect, it } from 'vitest'

import { reprocessProgress, type ReprocessRun } from './reprocessProgress'

const run: ReprocessRun = {
  target: 860,
  skipped: 0,
  estimatedSeconds: 43,
  startedAt: 1_000_000,
}

describe('reprocessProgress', () => {
  it('보낸 건수와 남은 시간을 시간으로 어림한다', () => {
    const progress = reprocessProgress(
      run,
      { deadLetter: 400, inFlight: 460 },
      run.startedAt + 21_500,
    )
    expect(progress.sent).toBe(430)
    expect(progress.remainingSeconds).toBe(22)
    expect(progress.finished).toBe(false)
  })

  it('예상 시간에 집계 캐시(5초)까지 지나야 끝났다고 본다', () => {
    expect(
      reprocessProgress(
        run,
        { deadLetter: 0, inFlight: 0 },
        run.startedAt + 43_000,
      ).finished,
    ).toBe(false)
    expect(
      reprocessProgress(
        run,
        { deadLetter: 0, inFlight: 0 },
        run.startedAt + 48_000,
      ).finished,
    ).toBe(true)
  })

  it('아직 등록 중이거나 재시도 대기인 작업이 있으면 시간이 지나도 끝나지 않는다', () => {
    expect(
      reprocessProgress(
        run,
        { deadLetter: 5, inFlight: 3 },
        run.startedAt + 99_000,
      ).finished,
    ).toBe(false)
  })

  it('집계를 못 받았으면 끝났다고 보지 않는다', () => {
    expect(reprocessProgress(run, null, run.startedAt + 99_000).finished).toBe(
      false,
    )
  })

  it('끝난 뒤 남은 실패로 결과를 나눈다', () => {
    const few = reprocessProgress(
      run,
      { deadLetter: 12, inFlight: 0 },
      run.startedAt + 60_000,
    )
    expect([few.succeeded, few.failed, few.mostlyFailed]).toEqual([
      848,
      12,
      false,
    ])
    const most = reprocessProgress(
      run,
      { deadLetter: 790, inFlight: 0 },
      run.startedAt + 60_000,
    )
    expect(most.mostlyFailed).toBe(true)
    // 새로 생긴 실패가 섞여 대상보다 많아도 대상 수를 넘지 않는다.
    expect(
      reprocessProgress(
        run,
        { deadLetter: 900, inFlight: 0 },
        run.startedAt + 60_000,
      ).failed,
    ).toBe(860)
  })
})
