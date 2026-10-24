import { describe, expect, it } from 'vitest'

import { diagnose, type LoadTestSignals } from './diagnose'

const calm: LoadTestSignals = {
  braking: false,
  brakeFactor: 1,
  backlogPerMinute: 0,
  newRegisterFailures: 0,
  newEventFailures: 0,
  topErrorCode: null,
  rangeLabel: '최근 10분',
}

describe('diagnose', () => {
  it('실패 → 브레이크 → 적체 순으로 심각한 것을 먼저 말한다', () => {
    expect(diagnose(calm).kind).toBe('ok')
    expect(diagnose({ ...calm, backlogPerMinute: null }).kind).toBe('measuring')
    expect(diagnose({ ...calm, backlogPerMinute: 30 }).description).toContain(
      '분당 +30건',
    )
    expect(
      diagnose({
        ...calm,
        backlogPerMinute: 30,
        braking: true,
        brakeFactor: 0.5,
      }).description,
    ).toContain('0.5배')
    const failed = diagnose({
      ...calm,
      braking: true,
      newRegisterFailures: 3,
      topErrorCode: 'TIMEOUT',
    })
    expect(failed.status).toBe('error')
    expect(failed.title).toContain('3건')
    expect(failed.description).toContain('TIMEOUT')
  })

  it('표본이 모자라면(null) 실패로 보지 않는다', () => {
    expect(diagnose({ ...calm, newRegisterFailures: null }).kind).toBe('ok')
  })
})
