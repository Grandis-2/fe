import { describe, expect, it } from 'vitest'

import { brakeBands, summarizeWindow } from './recording'

const stat = (
  at: number,
  processed: number,
  backlog: number,
  failures = 0,
) => ({
  at,
  received: processed + backlog,
  processed,
  backlog,
  failures,
})
const queue = (at: number, brakeFactor = 1, waiting = 0, credit = 0) => ({
  at,
  waiting,
  credit,
  brakeFactor,
  braking: brakeFactor < 1,
})

describe('summarizeWindow', () => {
  const active = {
    startedAt: 1000,
    productId: null,
    scopeLabel: '전체',
    condition: '정상',
    baselineFailures: 2,
  }

  it('구간 안의 표본만 세고, 실패는 시작 때 값과 비교한다', () => {
    const record = summarizeWindow(
      active,
      11_000,
      [stat(0, 0, 99, 2), stat(1000, 0, 5, 2), stat(11_000, 100, 3, 2)],
      [queue(0, 1, 999), queue(5000, 1, 40, 15), queue(9000, 1, 10, 20)],
    )
    expect(record).toMatchObject({
      maxWaiting: 40,
      maxCredit: 20,
      avgProcessed: 10,
      maxBacklog: 5,
      newFailures: 0,
      result: '통과',
      complete: true,
    })
  })

  it('대기열 표본이 구간 앞뒤에 없으면 집계가 다 있어도 일부로 표시한다', () => {
    const record = summarizeWindow(
      active,
      120_000,
      [stat(1000, 0, 0, 2), stat(120_000, 60, 0, 2)],
      [queue(60_000, 1, 30, 10)],
    )
    expect(record.complete).toBe(false)
  })

  it('새로 고침 등으로 구간 앞 표본이 없으면 일부로 표시한다', () => {
    const record = summarizeWindow(
      active,
      120_000,
      [stat(60_000, 0, 0, 2), stat(120_000, 60, 0, 2)],
      [],
    )
    expect(record).toMatchObject({ complete: false, avgProcessed: 1 })
  })

  it('실패가 늘면 실패, 적체가 끝에 더 많으면 적체', () => {
    const failed = summarizeWindow(
      active,
      3000,
      [stat(1000, 0, 0, 2), stat(3000, 5, 0, 4)],
      [],
    )
    expect(failed).toMatchObject({ newFailures: 2, result: '실패' })
    const backed = summarizeWindow(
      active,
      3000,
      [stat(1000, 0, 0, 2), stat(3000, 5, 9, 2)],
      [],
    )
    expect(backed.result).toBe('적체')
  })

  it('표본이 없으면 판단하지 않는다', () => {
    expect(summarizeWindow(active, 3000, [], []).result).toBe('판단 못 함')
  })
})

describe('brakeBands', () => {
  it('30초 안에 다시 걸리면 한 띠로 합친다', () => {
    expect(
      brakeBands([
        queue(0, 0.6),
        queue(5000),
        queue(20_000, 0.8),
        queue(25_000),
        queue(70_000, 0.9),
      ]),
    ).toEqual([
      { from: 0, to: 25_000, label: '브레이크 0.6×' },
      { from: 70_000, to: 70_000, label: '브레이크 0.9×' },
    ])
  })

  it('브레이크가 이어진 동안을 한 띠로, 가장 낮은 배율을 붙인다', () => {
    expect(
      brakeBands([
        queue(0),
        queue(5000, 0.7),
        queue(10_000, 0.5),
        queue(15_000),
        queue(60_000, 0.8),
      ]),
    ).toEqual([
      { from: 5000, to: 15_000, label: '브레이크 0.5×' },
      { from: 60_000, to: 60_000, label: '브레이크 0.8×' },
    ])
  })
})
