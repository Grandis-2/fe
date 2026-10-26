import { describe, expect, it } from 'vitest'

import { productWaitEstimate, waitEstimate } from './waitEstimate'

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

describe('productWaitEstimate', () => {
  it('서버가 센 기다릴 시간을 쓴다', () => {
    expect(
      productWaitEstimate({
        waiting: 450,
        credit: 10,
        estimatedWaitSeconds: 90,
      }),
    ).toBe('약 2분')
  })

  it('서버 값이 없으면 지금 속도로 어림하고, 멈췄으면 끝이 없다', () => {
    expect(
      productWaitEstimate({
        waiting: 450,
        credit: 10,
        estimatedWaitSeconds: null,
      }),
    ).toBe('45초')
    expect(
      productWaitEstimate({
        waiting: 450,
        credit: 0,
        estimatedWaitSeconds: null,
      }),
    ).toBe('입장 멈춤')
  })

  it('줄이 없으면 null', () => {
    expect(
      productWaitEstimate({ waiting: 0, credit: 10, estimatedWaitSeconds: 0 }),
    ).toBeNull()
  })
})
