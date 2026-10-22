import { describe, expect, it } from 'vitest'

import { periodLength, quickPeriod } from './period'

describe('quickPeriod', () => {
  it('지금을 분 단위로 내린 시각부터 그 날수 뒤까지', () => {
    const now = new Date(2026, 9, 21, 10, 7, 42)
    expect(quickPeriod(3, now)).toEqual({
      opensAt: '2026-10-21T10:07',
      closesAt: '2026-10-24T10:07',
    })
  })
})

describe('periodLength', () => {
  it('일과 시간으로 읽는다', () => {
    expect(periodLength('2026-10-21T10:00', '2026-10-22T18:00')).toBe(
      '1일 8시간',
    )
    expect(periodLength('2026-10-21T10:00', '2026-10-24T10:00')).toBe('3일')
    expect(periodLength('2026-10-21T10:00', '2026-10-21T16:30')).toBe('6시간')
  })

  it('마감이 시작보다 앞이거나 비면 null', () => {
    expect(periodLength('2026-10-22T10:00', '2026-10-21T10:00')).toBeNull()
    expect(periodLength('', '')).toBeNull()
  })
})
