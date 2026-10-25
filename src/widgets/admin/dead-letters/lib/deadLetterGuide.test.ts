import { describe, expect, it } from 'vitest'

import { deadLetterGuide, deadLetterSteps } from './deadLetterGuide'

const base = {
  status: 'OPEN',
  failureReason: 'PROCESSING_FAILED',
  eventType: 'PREORDER_PAYMENT_CONFIRMED',
  receiveCount: 5,
  createdAt: '2026-10-24T03:31:40Z',
  redriveRequestedBy: null,
  redriveStartedAt: null,
  redrivenAt: null,
  outcomeAt: null,
  discardedBy: null,
  discardedAt: null,
  discardNote: null,
} as const

describe('deadLetterGuide', () => {
  it('처리 대기는 실패 이유마다 할 일이 다르다', () => {
    expect(deadLetterGuide(base).tone).toBe('danger')
    expect(
      deadLetterGuide({ ...base, failureReason: 'UNREADABLE_BODY' }).title,
    ).toMatch(/되돌려도 또 실패/)
    expect(
      deadLetterGuide({
        ...base,
        failureReason: 'UNKNOWN_EVENT_TYPE',
        eventType: 'PREORDER_GIFT_GRANTED',
      }).title,
    ).toMatch(/PREORDER_GIFT_GRANTED/)
  })

  it('보내는 중(REDRIVING)은 보냈다고 하지 않는다 — 보내기에 실패하면 이 상태로 남는다', () => {
    expect(deadLetterGuide({ ...base, status: 'REDRIVING' }).title).toBe(
      '원래 큐로 보내는 중이에요',
    )
    expect(deadLetterGuide({ ...base, status: 'REDRIVEN' }).title).toMatch(
      /보냈고/,
    )
  })
})

describe('deadLetterSteps', () => {
  it('처리 대기는 쌓임에서 막혀 있다', () => {
    expect(deadLetterSteps(base).map((step) => step.tone)).toEqual([
      'stuck',
      'todo',
      'todo',
      'todo',
    ])
  })

  it('다시 실패는 마지막 칸이 막힘이다', () => {
    const steps = deadLetterSteps({
      ...base,
      status: 'REDRIVE_FAILED',
      redriveRequestedBy: 'admin',
      redriveStartedAt: '2026-10-24T04:38:00Z',
      redrivenAt: '2026-10-24T04:39:00Z',
      outcomeAt: '2026-10-24T04:40:00Z',
    })
    expect(steps.map((step) => step.tone)).toEqual([
      'done',
      'done',
      'done',
      'stuck',
    ])
  })

  it('원문이 깨진 메시지는 되돌리지 않고 버리는 길이다', () => {
    expect(
      deadLetterSteps({ ...base, failureReason: 'UNREADABLE_BODY' }).map(
        (step) => step.label,
      ),
    ).toEqual(['DLQ에 쌓임', '재발행 요청', '버림'])
  })

  it('버린 메시지는 두 칸이다', () => {
    expect(
      deadLetterSteps({
        ...base,
        status: 'DISCARDED',
        discardedBy: 'admin',
        discardedAt: '2026-10-24T05:00:00Z',
      }),
    ).toHaveLength(2)
  })
})
