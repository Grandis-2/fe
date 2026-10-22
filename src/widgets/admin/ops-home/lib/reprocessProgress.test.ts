import { describe, expect, it } from 'vitest'

import { reprocessProgress, type ReprocessRun } from './reprocessProgress'

const run: ReprocessRun = {
  target: 860,
  skipped: 0,
  estimatedSeconds: 43,
  startedAt: 1_000_000,
  scope: null,
  inFlightAtStart: 0,
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

  it('이번 재처리의 대기가 남으면 시간이 지나도 끝나지 않는다', () => {
    expect(
      reprocessProgress(
        run,
        { deadLetter: 5, inFlight: 3 },
        run.startedAt + 99_000,
      ).finished,
    ).toBe(false)
  })

  it('시작 때 이미 기다리던 건은 이번 재처리의 대기로 세지 않는다', () => {
    // 시작 때 접수 대기 5건이 있었고, 지금도 5건이면 우리 작업은 다 끝난 것이다.
    const before = { ...run, inFlightAtStart: 5 }
    expect(
      reprocessProgress(
        before,
        { deadLetter: 0, inFlight: 5 },
        run.startedAt + 60_000,
      ).finished,
    ).toBe(true)
  })

  it('집계를 못 받았으면 끝났다고 보지 않는다', () => {
    expect(reprocessProgress(run, null, run.startedAt + 99_000).finished).toBe(
      false,
    )
  })

  it('건너뛴 작업은 다시 실패로 세지 않는다', () => {
    // 재처리 필요로 남은 12건 중 2건은 서버가 건너뛰어 보내지 않은 것이다.
    const skipping = { ...run, target: 850, skipped: 2 }
    const progress = reprocessProgress(
      skipping,
      { deadLetter: 12, inFlight: 0 },
      run.startedAt + 60_000,
    )
    expect(progress.failed).toBe(10)
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
