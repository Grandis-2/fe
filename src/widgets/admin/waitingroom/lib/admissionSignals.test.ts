import { describe, expect, it } from 'vitest'

import { admissionSignals, type FlowStats } from './admissionSignals'

const stats = (
  rates: FlowStats['rates'],
  pendingSync = 120,
  failures = 20,
): FlowStats => ({
  countedAt: '2026-10-08T05:00:00Z',
  preorders: { PENDING_SYNC: pendingSync },
  syncJobs: { REGISTER: { DEAD_LETTER: failures } },
  rates,
})

describe('admissionSignals', () => {
  it('현황을 못 받았으면 아무것도 내지 않는다', () => {
    const signals = admissionSignals(undefined)
    expect(signals.at).toBeNull()
    expect(signals.backlog).toBeNull()
    expect(signals.judged).toBe(false)
  })

  it('속도가 없으면(서버가 막 뜸) 대기만 내고 판단은 미룬다', () => {
    const signals = admissionSignals(stats(null))
    expect(signals.received).toBeNull()
    expect(signals.backlog).toBe(100)
    expect(signals.judged).toBe(false)
    expect(signals.judgedInSeconds).toBe(30)
  })

  it('잰 구간이 30초가 안 되면 속도는 내되 판단은 미룬다', () => {
    const signals = admissionSignals(
      stats({
        receivedPerSec: 14,
        registeredPerSec: 10,
        backlogPerMin: 240,
        windowSeconds: 20,
      }),
    )
    expect(signals.received).toBe(14)
    expect(signals.processed).toBe(10)
    expect(signals.judged).toBe(false)
    expect(signals.judgedInSeconds).toBe(10)
    expect(signals.congested).toBe(false)
  })

  it('잰 구간 동안 대기가 늘었으면 밀림이다', () => {
    const signals = admissionSignals(
      stats({
        receivedPerSec: 14,
        registeredPerSec: 10,
        backlogPerMin: 240,
        windowSeconds: 60,
      }),
    )
    expect(signals.judged).toBe(true)
    expect(signals.congested).toBe(true)
    expect(signals.backlogPerMinute).toBe(240)
  })

  it('조금 오르내리는 건 밀림으로 보지 않는다', () => {
    const signals = admissionSignals(
      stats({
        receivedPerSec: 10,
        registeredPerSec: 9.9,
        backlogPerMin: 6,
        windowSeconds: 60,
      }),
    )
    expect(signals.congested).toBe(false)
  })

  it('대기가 그대로거나 줄면 밀림이 아니다', () => {
    const steady = {
      receivedPerSec: 10,
      registeredPerSec: 10,
      backlogPerMin: 0,
      windowSeconds: 60,
    }
    expect(admissionSignals(stats(steady)).congested).toBe(false)
    expect(
      admissionSignals(stats({ ...steady, backlogPerMin: -30 })).congested,
    ).toBe(false)
  })
})
