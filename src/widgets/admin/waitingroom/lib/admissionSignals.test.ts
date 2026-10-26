import { describe, expect, it } from 'vitest'

import {
  admissionSignals,
  congestionThreshold,
  type FlowStats,
} from './admissionSignals'

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

  it('문턱 = 무작위 흔들림(3√(2×대기)) + 1초치 접수, 바닥은 10건', () => {
    // 지금 실서버(초당 20명 · 등록 0.5초): 대기 약 10 → 3√20 + 20 ≈ 33
    expect(Math.round(congestionThreshold(10, 20, 60))).toBe(33)
    // 위험선(초당 150명 · 0.8초): 대기 약 120 → 3√240 + 150 ≈ 196
    expect(Math.round(congestionThreshold(120, 150, 60))).toBe(196)
    expect(congestionThreshold(0, 0, 60)).toBe(10)
    // 30초만 쟀으면 분당으로 늘린 만큼 흔들림도 두 배
    expect(congestionThreshold(120, 150, 30)).toBeCloseTo(
      congestionThreshold(120, 150, 60) * 2,
    )
  })

  it('1초 몰림의 톱니는 거르고, 처리가 몇 % 넘게 느리면 잡는다', () => {
    const at150 = (backlogPerMin: number) => ({
      receivedPerSec: 150,
      registeredPerSec: 150 - backlogPerMin / 60,
      backlogPerMin,
      windowSeconds: 60,
    })
    // 대기 100(실패 20을 뺌) — 문턱 약 192. 몰림으로 100건 오르내린 건 밀림이 아니다.
    expect(admissionSignals(stats(at150(100), 120)).congested).toBe(false)
    // 처리가 초당 5건(약 3%) 느리면 분당 300건씩 늘어 밀림이다.
    expect(admissionSignals(stats(at150(300), 120)).congested).toBe(true)
  })
})
