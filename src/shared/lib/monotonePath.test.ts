import { describe, expect, it } from 'vitest'

import { monotonePath } from './monotonePath'

/** path의 모든 숫자 쌍(x,y) */
const pairsOf = (d: string) =>
  [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(([, x, y]) => ({
    x: Number(x),
    y: Number(y),
  }))

describe('monotonePath', () => {
  it('점이 없거나 하나면 곡선 없이', () => {
    expect(monotonePath([])).toBe('')
    expect(monotonePath([{ x: 1, y: 2 }])).toBe('M1,2')
  })

  it('점 n개면 곡선 n-1개로 잇고, 처음과 끝 점을 지난다', () => {
    const d = monotonePath([
      { x: 0, y: 10 },
      { x: 10, y: 20 },
      { x: 20, y: 5 },
    ])
    expect(d.startsWith('M0,10')).toBe(true)
    expect(d.match(/C/g)).toHaveLength(2)
    expect(d.endsWith('20,5')).toBe(true)
  })

  it('조절점이 점들의 위아래 범위를 넘지 않는다 — 0 아래로 꺼지거나 봉우리가 생기지 않는다', () => {
    const points = [
      { x: 0, y: 100 },
      { x: 10, y: 100 },
      { x: 20, y: 0 },
      { x: 30, y: 0 },
      { x: 40, y: 60 },
      { x: 50, y: 58 },
    ]
    for (const { y } of pairsOf(monotonePath(points))) {
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(100)
    }
  })
})
