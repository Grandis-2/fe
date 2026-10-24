import { describe, expect, it } from 'vitest'

import { ApiRequestError } from '@shared/api/client'

import { admissionRateRefusal, admissionZone } from './admissionCapacity'

const capacity = {
  recommendedMax: 150,
  dangerLine: 400,
  appliedCredit: 120,
  readyTasks: 3,
  warmingTasks: 0,
  brakeFactor: 1,
  relayBadRatio: 0.01,
  scalingPending: false,
}

describe('admissionZone', () => {
  it('권장 안은 ok, 권장~위험선은 confirm, 위험선 위는 unreachable', () => {
    expect(admissionZone(150, 120, capacity)).toBe('ok')
    expect(admissionZone(151, 120, capacity)).toBe('confirm')
    expect(admissionZone(400, 120, capacity)).toBe('confirm')
    expect(admissionZone(401, 120, capacity)).toBe('unreachable')
  })

  it('줄이기는 권장·위험선과 상관없이 ok', () => {
    expect(admissionZone(300, 450, capacity)).toBe('ok')
  })

  it('권장 상한을 모르면 구간을 나누지 않는다', () => {
    expect(admissionZone(900, 15, null)).toBeNull()
    expect(
      admissionZone(900, 15, { ...capacity, recommendedMax: null }),
    ).toBeNull()
  })
})

describe('admissionRateRefusal', () => {
  const refusal = (code: string, status: number) =>
    new ApiRequestError(
      {
        code,
        message: '',
        details: { recommendedMax: 300, dangerLine: 500 },
      },
      status,
    )

  it('409·400 용량 거절에서 기준을 꺼낸다', () => {
    expect(
      admissionRateRefusal(refusal('ADMISSION_RATE_NEEDS_CONFIRM', 409)),
    ).toEqual({ kind: 'confirm', recommendedMax: 300, dangerLine: 500 })
    expect(
      admissionRateRefusal(refusal('ADMISSION_RATE_UNREACHABLE', 400)),
    ).toEqual({ kind: 'unreachable', recommendedMax: 300, dangerLine: 500 })
  })

  it('다른 실패는 null', () => {
    expect(admissionRateRefusal(refusal('VALIDATION_FAILED', 400))).toBeNull()
    expect(admissionRateRefusal(new Error('x'))).toBeNull()
  })
})
