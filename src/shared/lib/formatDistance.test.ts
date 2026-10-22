import { describe, expect, it } from 'vitest'

import { formatDistance } from './formatDistance'

const MINUTE = 60_000

describe('formatDistance', () => {
  it('1분 아래는 1분으로 둔다', () => {
    expect(formatDistance(10_000)).toBe('1분')
  })

  it('한 시간 안은 분, 하루 안은 시간, 그 위는 일로 내림한다', () => {
    expect(formatDistance(59 * MINUTE)).toBe('59분')
    expect(formatDistance(7 * 60 * MINUTE + 59 * MINUTE)).toBe('7시간')
    expect(formatDistance(3 * 24 * 60 * MINUTE + 5 * MINUTE)).toBe('3일')
  })

  it('지난 시각(음수)도 길이만 본다', () => {
    expect(formatDistance(-6 * 24 * 60 * MINUTE)).toBe('6일')
  })
})
