import { describe, expect, it } from 'vitest'

import { flowVerdict } from './flowVerdict'

describe('flowVerdict', () => {
  it('브레이크가 걸리면 적체보다 먼저 말한다', () => {
    expect(
      flowVerdict({ braking: true, backlogPerMinute: 30 }).message,
    ).toContain('입장을 자동으로 줄이는')
  })

  it('표본이 모자라면 재는 중이다', () => {
    expect(flowVerdict({ braking: false, backlogPerMinute: null }).status).toBe(
      'info',
    )
  })

  it('적체가 분당 1건 이상 늘면 밀린다고 말한다', () => {
    const verdict = flowVerdict({ braking: false, backlogPerMinute: 29.6 })
    expect(verdict.status).toBe('warning')
    expect(verdict.message).toContain('분당 30건')
  })

  it('늘지 않거나 줄면 정상이다', () => {
    expect(flowVerdict({ braking: false, backlogPerMinute: 0.4 }).status).toBe(
      'success',
    )
    expect(flowVerdict({ braking: false, backlogPerMinute: -12 }).status).toBe(
      'success',
    )
  })
})

describe('flowVerdict 범위', () => {
  it('브레이크는 고른 사전예약과 상관없이 모든 사전예약 기준이라고 밝힌다', () => {
    expect(
      flowVerdict({ braking: true, backlogPerMinute: 0, scope: '아이폰' })
        .message,
    ).toContain('모든 사전예약')
  })

  it('처리 흐름은 고른 사전예약 이름을 앞에 붙인다', () => {
    expect(
      flowVerdict({ braking: false, backlogPerMinute: 30, scope: '아이폰' })
        .message,
    ).toMatch(/^아이폰 — 처리가 밀려요/)
  })
})
