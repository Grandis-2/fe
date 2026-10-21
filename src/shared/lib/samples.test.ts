import { describe, expect, it } from 'vitest'

import { sumSeries } from './samples'

describe('sumSeries', () => {
  it('각 시각에 기록마다 그때까지의 마지막 값을 더한다', () => {
    const a = [
      { at: 0, value: 1 },
      { at: 10, value: 3 },
    ]
    const b = [
      { at: 5, value: 10 },
      { at: 15, value: 20 },
    ]
    // 둘 다 값을 받은 5부터 — 0은 b가 아직 없어 뺀다
    expect(sumSeries([a, b])).toEqual([
      { at: 5, value: 11 },
      { at: 10, value: 13 },
      { at: 15, value: 23 },
    ])
  })

  it('하나면 그대로, 비었거나 아직 값이 없는 기록이 있으면 빈 배열', () => {
    const a = [{ at: 0, value: 1 }]
    expect(sumSeries([a])).toEqual(a)
    expect(sumSeries([])).toEqual([])
    expect(sumSeries([a, []])).toEqual([])
  })
})
