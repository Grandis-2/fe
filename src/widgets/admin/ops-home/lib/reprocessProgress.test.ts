import { describe, expect, it } from 'vitest'

import { reprocessProgress, type ReprocessRun } from './reprocessProgress'

const run: ReprocessRun = {
  target: 860,
  skipped: 0,
  estimatedSeconds: 43,
  batchIds: ['batch-1'],
  startedAt: 1_000_000,
  scope: null,
  deadLetterAtStart: 900,
}

describe('reprocessProgress', () => {
  it('보낸 건수와 남은 시간을 시간으로 어림한다', () => {
    const progress = reprocessProgress(
      run,
      undefined,
      400,
      run.startedAt + 21_500,
    )
    expect(progress.sent).toBe(430)
    expect(progress.remainingSeconds).toBe(22)
    expect(progress.finished).toBe(false)
  })

  it('서버 진행을 못 받으면 예상 시간이 지나도 끝으로 보지 않는다 — 끝은 마감이 정한다', () => {
    expect(
      reprocessProgress(run, undefined, 400, run.startedAt + 99_000).finished,
    ).toBe(false)
    expect(
      reprocessProgress(run, undefined, 400, run.startedAt + 99_000, true),
    ).toMatchObject({ finished: true, timedOut: true, outcome: null })
  })

  it('시작 전보다 줄어든 건수를 보여 준다(음수로는 가지 않는다)', () => {
    expect(
      reprocessProgress(run, undefined, 880, run.startedAt + 60_000).reduced,
    ).toBe(20)
    expect(
      reprocessProgress(run, undefined, 950, run.startedAt + 60_000).reduced,
    ).toBe(0)
  })

  it('시작 전 값을 못 쟀거나 집계가 없으면 줄어든 건수도 모른다', () => {
    const unknown = { ...run, deadLetterAtStart: null }
    expect(
      reprocessProgress(unknown, undefined, 880, run.startedAt + 60_000)
        .reduced,
    ).toBe(null)
    expect(
      reprocessProgress(run, undefined, null, run.startedAt + 60_000).reduced,
    ).toBe(null)
  })

  it('서버 진행을 받았으면 다룬 건수·결과를 그대로 쓰고 결과가 다 나와야 끝이다', () => {
    const batches = {
      targetCount: 860,
      sent: 860,
      unsent: 2,
      succeeded: 800,
      failed: 30,
      canceled: 3,
      pending: 25,
      finished: false,
    }
    const progress = reprocessProgress(
      run,
      batches,
      900,
      run.startedAt + 99_000,
    )
    expect(progress.sent).toBe(835)
    expect(progress.finished).toBe(false)
    expect(progress.outcome).toEqual({
      succeeded: 800,
      failed: 30,
      canceled: 3,
      unsent: 2,
    })
    expect(
      reprocessProgress(
        run,
        { ...batches, pending: 0, succeeded: 825, finished: true },
        null,
        run.startedAt + 10_000,
      ).finished,
    ).toBe(true)
  })

  it('마감이 지나면 끝나지 않았어도 끝으로 보고, 받은 진행을 결과로 쓰지 않는다', () => {
    const batches = {
      targetCount: 860,
      unsent: 0,
      succeeded: 500,
      failed: 10,
      canceled: 0,
      pending: 350,
      finished: false,
    }
    const progress = reprocessProgress(
      run,
      batches,
      900,
      run.startedAt + 99_000,
      true,
    )
    expect(progress).toMatchObject({
      finished: true,
      timedOut: true,
      outcome: null,
      sent: 510,
    })
    // 마감 전에 끝났으면 그대로 결과를 쓴다.
    expect(
      reprocessProgress(
        run,
        { ...batches, pending: 0, finished: true },
        900,
        run.startedAt + 99_000,
        true,
      ).timedOut,
    ).toBe(false)
  })
})
