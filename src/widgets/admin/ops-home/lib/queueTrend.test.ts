import { describe, expect, it } from 'vitest'

import { queueTrend } from './queueTrend'

describe('queueTrend', () => {
  it('표본이 모자라면 재는 중', () => {
    expect(queueTrend({ waiting: 100, perMinute: null }).status).toBe(
      'measuring',
    )
  })

  it('분당 1명 이상 늘면 늘어나는 중', () => {
    const trend = queueTrend({ waiting: 1240, perMinute: 120.4 })
    expect(trend.status).toBe('rising')
    expect(trend.headline).toBe('분당 +120명 늘어나는 중')
  })

  it('줄고 있으면 지금 속도로 비기까지 걸리는 시간을 말한다', () => {
    expect(queueTrend({ waiting: 640, perMinute: -80 }).headline).toBe(
      '분당 −80명 · 약 8분 뒤 비어요',
    )
    expect(queueTrend({ waiting: 9000, perMinute: -100 }).headline).toBe(
      '분당 −100명 · 약 1시간 30분 뒤 비어요',
    )
  })

  it('거의 안 움직이거나 대기가 없으면 유지', () => {
    expect(queueTrend({ waiting: 30, perMinute: 0.4 }).headline).toBe(
      '들어오는 만큼 입장 중',
    )
    expect(queueTrend({ waiting: 0, perMinute: -5 })).toMatchObject({
      status: 'steady',
      headline: '대기 없음',
    })
  })
})
