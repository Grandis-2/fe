import { describe, expect, it } from 'vitest'

import { MAX_SAMPLES, slopePerSecond, sumSeries } from './samples'

describe('slopePerSecond', () => {
  it('windowMs 안의 가장 오래된 표본과 비교하고, 없으면 바로 앞과 비교한다', () => {
    const samples = [
      { at: 0, value: 0 },
      { at: 10_000, value: 10 },
      { at: 20_000, value: 30 },
      { at: 60_000, value: 30 },
    ]
    expect(slopePerSecond(samples, 15_000)).toEqual([
      { at: 10_000, value: 1 }, // 0과 비교
      { at: 20_000, value: 2 }, // 10초 전(10_000)과 비교 — 0은 창 밖
      { at: 60_000, value: 0 }, // 창 안에 없어 바로 앞(20_000)과 비교
    ])
  })
})

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

  it('합친 표본은 MAX_SAMPLES개까지만 남긴다', () => {
    const a = Array.from({ length: MAX_SAMPLES }, (_, i) => ({
      at: i * 2,
      value: 1,
    }))
    const b = Array.from({ length: MAX_SAMPLES }, (_, i) => ({
      at: i * 2 + 1,
      value: 1,
    }))
    const merged = sumSeries([a, b])
    expect(merged).toHaveLength(MAX_SAMPLES)
    expect(merged.at(-1)).toEqual({ at: MAX_SAMPLES * 2 - 1, value: 2 })
  })
})
