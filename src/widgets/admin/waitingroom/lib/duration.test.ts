import { describe, expect, it } from 'vitest'

import { formatSeconds, oldestSeconds } from './duration'

describe('formatSeconds', () => {
  it('초·분·시간 단위로 읽는다', () => {
    expect(formatSeconds(45)).toBe('45초')
    expect(formatSeconds(250)).toBe('4분 10초')
    expect(formatSeconds(600)).toBe('10분')
    expect(formatSeconds(3700)).toBe('1시간 1분')
  })
})

describe('oldestSeconds', () => {
  it('받은 시각 기준으로 몇 초째인지, 없으면 null', () => {
    const at = Date.parse('2026-10-08T05:00:30Z')
    expect(oldestSeconds('2026-10-08T05:00:00Z', at)).toBe(30)
    expect(oldestSeconds(null, at)).toBeNull()
  })
})
