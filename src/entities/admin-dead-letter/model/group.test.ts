import { describe, expect, it } from 'vitest'

import { groupDeadLetters } from './group'

import type { DeadLetter } from './types'

const item = (partial: Partial<DeadLetter>): DeadLetter => ({
  deadLetterId: 'a',
  messageId: 'm',
  eventId: null,
  eventType: 'PREORDER_PAYMENT_CONFIRMED',
  preorderId: null,
  customerId: null,
  failureReason: 'PROCESSING_FAILED',
  receiveCount: 5,
  status: 'OPEN',
  redrivable: true,
  redrivenFromId: null,
  sentAt: null,
  createdAt: '2026-10-24T03:00:00Z',
  updatedAt: '2026-10-24T03:00:00Z',
  ...partial,
})

describe('groupDeadLetters', () => {
  it('이벤트 종류 × 실패 이유로 묶고, 오래 멈춘 묶음부터', () => {
    const groups = groupDeadLetters([
      item({ deadLetterId: '1', createdAt: '2026-10-24T05:00:00Z' }),
      item({
        deadLetterId: '2',
        eventType: null,
        failureReason: 'UNREADABLE_BODY',
        createdAt: '2026-10-24T01:00:00Z',
      }),
      item({
        deadLetterId: '3',
        createdAt: '2026-10-24T02:00:00Z',
        redrivenFromId: 'old',
      }),
    ])
    expect(groups.map((group) => group.items.length)).toEqual([1, 2])
    expect(groups[0].failureReason).toBe('UNREADABLE_BODY')
    expect(groups[1].oldestAt).toBe('2026-10-24T02:00:00Z')
    expect(groups[1].hasRetried).toBe(true)
  })
})
