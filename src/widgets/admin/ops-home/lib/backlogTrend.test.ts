import { describe, expect, it } from 'vitest'

import { backlogTrend } from './backlogTrend'

describe('backlogTrend', () => {
  it('표본이 모자라면 재는 중', () => {
    expect(backlogTrend({ backlog: 100, perMinute: null }).status).toBe(
      'measuring',
    )
  })

  it('분당 1건 이상 늘면 경고', () => {
    const trend = backlogTrend({ backlog: 1240, perMinute: 120.4 })
    expect(trend.status).toBe('rising')
    expect(trend.headline).toBe('분당 +120건 늘어나는 중')
  })

  it('줄고 있으면 지금 속도로 풀리기까지 걸리는 시간을 말한다', () => {
    expect(backlogTrend({ backlog: 640, perMinute: -80 }).headline).toBe(
      '분당 −80건 · 약 8분 뒤 해소',
    )
    expect(backlogTrend({ backlog: 9000, perMinute: -100 }).headline).toBe(
      '분당 −100건 · 약 1시간 30분 뒤 해소',
    )
  })

  it('거의 안 움직이거나 대기가 없으면 정상', () => {
    expect(backlogTrend({ backlog: 30, perMinute: 0.4 }).headline).toBe(
      '들어오는 만큼 처리 중',
    )
    expect(backlogTrend({ backlog: 0, perMinute: -5 })).toMatchObject({
      status: 'steady',
      headline: '대기 없음',
    })
  })
})
