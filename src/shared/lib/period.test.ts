import { describe, expect, it } from 'vitest'

import { periodRange } from './period'

// 이 기기 시간대의 2026-10-26 15:30
const NOW = new Date(2026, 9, 26, 15, 30).getTime()
const at = (day: number) => new Date(2026, 9, day).toISOString()

describe('periodRange', () => {
  it('전체는 조건이 없다', () => {
    expect(periodRange('all', NOW)).toEqual({})
  })

  it('1시간은 지금부터 거꾸로 잰다', () => {
    expect(periodRange('hour', NOW)).toEqual({
      from: new Date(NOW - 60 * 60 * 1000).toISOString(),
    })
  })

  it('오늘·최근 7일·30일은 자정에 맞춘 하한만', () => {
    expect(periodRange('today', NOW)).toEqual({ from: at(26) })
    expect(periodRange('week', NOW)).toEqual({ from: at(20) })
    expect(periodRange('month', NOW)).toEqual({ from: at(26 - 29) })
  })

  it('어제는 어제 자정부터 오늘 자정 전까지', () => {
    expect(periodRange('yesterday', NOW)).toEqual({ from: at(25), to: at(26) })
  })

  it('같은 날 안에서는 언제 불러도 같은 값이다', () => {
    expect(periodRange('week', NOW)).toEqual(
      periodRange('week', NOW + 60 * 60 * 1000),
    )
  })

  // TZ=America/New_York에서 돌리면 서머타임이 끝나는 2026-11-01을 건넌다(한국은 서머타임이 없어 그대로 통과).
  it('서머타임이 바뀌는 날을 건너도 하한은 그날 자정이다', () => {
    const now = new Date(2026, 10, 3, 15, 30).getTime()
    const { from } = periodRange('week', now)
    expect(from).toBe(new Date(2026, 9, 28).toISOString())
  })
})
