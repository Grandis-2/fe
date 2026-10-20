import { describe, expect, it } from 'vitest'

import { untilClose } from './preorderHealth'

const NOW = Date.parse('2026-10-08T05:10:00Z')

describe('untilClose', () => {
  it('하루 넘게 남으면 D-n', () => {
    expect(untilClose('2026-10-10T06:00:00Z', NOW)).toBe('D-2')
    expect(untilClose('2026-10-09T05:10:00Z', NOW)).toBe('D-1')
  })

  it('하루 안이면 분·시간으로, 1분 안이면 곧 마감', () => {
    expect(untilClose('2026-10-08T06:30:00Z', NOW)).toBe('1시간 20분')
    expect(untilClose('2026-10-08T05:55:00Z', NOW)).toBe('45분')
    expect(untilClose('2026-10-08T05:10:30Z', NOW)).toBe('곧 마감')
  })
})
