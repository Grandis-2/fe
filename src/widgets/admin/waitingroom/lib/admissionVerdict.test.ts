import { describe, expect, it } from 'vitest'

import { admissionVerdict, previewNote } from './admissionVerdict'

const base = {
  waiting: 5000,
  stale: false,
  brakeFactor: 1,
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
      title: '여유 있어요',
      hint: '올려도 돼요',
    })
  })

  it('줄이 있는데 입장이 0이면 다른 것보다 먼저 멈춤이라고 한다', () => {
    expect(
      admissionVerdict({ ...base, admitting: 0, brakeFactor: 0.5 }).title,
    ).toBe('입장 멈춤')
  })

  it('줄이 없으면 입장 0이어도 멈춤이 아니다', () => {
    expect(
      admissionVerdict({ ...base, waiting: 0, admitting: 0 }).title,
    ).not.toBe('입장 멈춤')
  })

  it('현황이 오래되면 여유가 있어 보여도 올리라고 하지 않는다', () => {
    expect(admissionVerdict({ ...base, stale: true })).toMatchObject({
      tone: 'warning',
      title: '현황 정보가 오래됐어요',
    })
  })

  it('브레이크가 걸리면 올려도 안 빨라진다고 한다', () => {
    expect(admissionVerdict({ ...base, brakeFactor: 0.5 }).hint).toContain(
      '올려도 안 빨라져요',
    )
  })

  it('외부 등록 대기가 늘면 낮추라고 한다', () => {
    expect(admissionVerdict({ ...base, backlogPerMinute: 30 }).tone).toBe(
      'danger',
    )
  })

  it('대기가 있고 입장이 처리의 70%를 넘으면 한계 근처다', () => {
    expect(admissionVerdict({ ...base, admitting: 200 })).toEqual({
      tone: 'warning',
      title: '한계에 가까워요',
      hint: '더 올리면 밀려요',
    })
  })

  it('들어오는 양이 거의 없으면 판단하지 않는다', () => {
    expect(
      admissionVerdict({ ...base, backlog: 0, admitting: 150, receiving: 0 })
        .tone,
    ).toBe('muted')
  })

  it('표본이 모자라면 재는 중이라고 한다', () => {
    expect(admissionVerdict({ ...base, processing: null }).title).toBe(
      '재는 중',
    )
  })
})

describe('previewNote', () => {
  it('처리 속도와 비교해 여유·한계 근처·넘음을 말한다', () => {
    expect(previewNote(100, 220).tone).toBe('success')
    expect(previewNote(180, 220).tone).toBe('warning')
    expect(previewNote(260, 220).tone).toBe('danger')
  })
})
