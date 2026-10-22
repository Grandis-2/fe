import { describe, expect, it } from 'vitest'

import { slopePerSecond } from './samples'

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
