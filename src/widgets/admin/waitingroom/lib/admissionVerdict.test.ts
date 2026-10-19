import { describe, expect, it } from 'vitest'

import { admissionVerdict, previewNote } from './admissionVerdict'

const base = {
  braking: false,
  backlogPerMinute: -5,
  backlog: 3000,
  admitting: 150,
  processing: 220,
  receiving: 140,
}

describe('admissionVerdict', () => {
  it('처리가 넉넉하고 대기가 줄면 올려도 된다', () => {
    expect(admissionVerdict(base)).toEqual({
      tone: 'success',
      message: '여유 있어요 · 올려도 돼요',
    })
  })

  it('브레이크가 걸리면 다른 것보다 먼저 말한다', () => {
    expect(admissionVerdict({ ...base, braking: true }).message).toContain(
      '원인부터',
    )
  })

  it('외부 등록 대기가 늘면 낮추라고 한다', () => {
    expect(admissionVerdict({ ...base, backlogPerMinute: 30 }).tone).toBe(
      'danger',
    )
  })

  it('대기가 있고 입장이 처리의 70%를 넘으면 빠듯하다', () => {
    expect(admissionVerdict({ ...base, admitting: 200 }).tone).toBe('warning')
  })

  it('들어오는 양이 거의 없으면 판단하지 않는다', () => {
    expect(
      admissionVerdict({ ...base, backlog: 0, admitting: 150, receiving: 0 })
        .tone,
    ).toBe('muted')
  })

  it('표본이 모자라면 재는 중이라고 한다', () => {
    expect(admissionVerdict({ ...base, processing: null }).message).toContain(
      '재는 중',
    )
  })
})

describe('previewNote', () => {
  it('처리 속도와 비교해 여유·빠듯·넘음을 말한다', () => {
    expect(previewNote(100, 220).tone).toBe('success')
    expect(previewNote(180, 220).tone).toBe('warning')
    expect(previewNote(260, 220).tone).toBe('danger')
  })
})
