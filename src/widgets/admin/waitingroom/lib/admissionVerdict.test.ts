import { describe, expect, it } from 'vitest'

import { admissionVerdict } from './admissionVerdict'

import type { AdmissionSignals } from './admissionSignals'

const signals: AdmissionSignals = {
  at: 60_000,
  coveredSeconds: 30,
  received: 14,
  processed: 14,
  backlog: 7,
  backlogPerMinute: 0,
  judged: true,
  judgedInSeconds: 0,
  congested: false,
}

const base = {
  waiting: 5000,
  stale: false,
  brakeFactor: 1,
  admitting: 15,
  signals,
}

describe('admissionVerdict', () => {
  it('외부 등록이 따라가면 따라가고 있다고 한다', () => {
    expect(admissionVerdict(base)).toMatchObject({
      kind: 'following',
      tone: 'success',
      title: '외부 등록이 따라가고 있어요',
    })
  })

  it('외부 등록 대기가 계속 늘면 밀린다고 하고 차이를 말한다', () => {
    const verdict = admissionVerdict({
      ...base,
      signals: { ...signals, received: 40, processed: 30, congested: true },
    })
    expect(verdict).toMatchObject({ kind: 'congested', tone: 'warning' })
    expect(verdict.hint).toContain('초당 10건 빨라요')
  })

  it('줄이 있는데 입장이 0이면 다른 것보다 먼저 멈춤이라고 한다', () => {
    expect(
      admissionVerdict({
        ...base,
        admitting: 0,
        brakeFactor: 0.5,
        signals: { ...signals, congested: true },
      }).kind,
    ).toBe('stopped')
  })

  it('줄이 없으면 입장 0이어도 멈춤이 아니다', () => {
    expect(
      admissionVerdict({ ...base, waiting: 0, admitting: 0 }).kind,
    ).not.toBe('stopped')
  })

  it('현황이 오래되면 다른 판단보다 먼저 알린다', () => {
    expect(
      admissionVerdict({
        ...base,
        stale: true,
        signals: { ...signals, congested: true },
      }).kind,
    ).toBe('stale')
  })

  it('브레이크는 밀림보다 먼저 말한다', () => {
    expect(
      admissionVerdict({
        ...base,
        brakeFactor: 0.1,
        signals: { ...signals, congested: true },
      }),
    ).toMatchObject({ kind: 'braking', tone: 'danger' })
  })

  it('기록이 모자라면 남은 시간을 말하고 판단을 미룬다', () => {
    expect(
      admissionVerdict({
        ...base,
        signals: { ...signals, judged: false, judgedInSeconds: 15 },
      }),
    ).toMatchObject({
      kind: 'measuring',
      hint: expect.stringContaining('15초'),
    })
  })
})
