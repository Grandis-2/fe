import { describe, expect, it } from 'vitest'

import { waitEstimate } from './waitEstimate'

describe('waitEstimate', () => {
  it('줄이 없으면 null', () => {
    expect(waitEstimate(0, 100)).toBeNull()
  })

  it('입장을 멈췄거나 속도를 모르면 끝이 없다', () => {
    expect(waitEstimate(500, 0)).toBe('입장 멈춤')
    expect(waitEstimate(500, null)).toBe('입장 멈춤')
  })

  it('대기 인원 ÷ 초당 입장을 초·분·시간으로', () => {
    expect(waitEstimate(450, 10)).toBe('45초')
    expect(waitEstimate(18240, 100)).toBe('약 3분')
    expect(waitEstimate(72000, 10)).toBe('약 2시간 0분')
  })
})
