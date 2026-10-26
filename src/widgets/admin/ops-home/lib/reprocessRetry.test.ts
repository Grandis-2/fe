import { describe, expect, it } from 'vitest'

import { PartialReprocessError } from '@entities/admin-reservation'

import { retryOf, unsentAfterError, type Unsent } from './reprocessRetry'

const partial = (unsentPreorderIds: string[]) =>
  new PartialReprocessError(
    {
      targetCount: 1000,
      skippedCount: 2,
      estimatedSeconds: 50,
      batchIds: ['batch-2'],
    },
    unsentPreorderIds,
  )

const previous: Unsent = {
  scope: null,
  preorderIds: ['a'],
  accepted: {
    targetCount: 1000,
    skippedCount: 0,
    estimatedSeconds: 50,
    batchIds: ['batch-1'],
  },
  deadLetterAtStart: 1500,
}

describe('reprocessRetry', () => {
  it('부분 실패면 보내지 못한 예약과 접수 합계를 남긴다', () => {
    const next = unsentAfterError(null, null, 1500, partial(['b', 'c']))
    expect(next?.preorderIds).toEqual(['b', 'c'])
    expect(next?.accepted.targetCount).toBe(1000)
    expect(next?.deadLetterAtStart).toBe(1500)
  })

  it('이어 보내다 또 부분 실패하면 합계를 더하고 처음 시작 값을 유지한다', () => {
    const next = unsentAfterError(previous, null, 9999, partial(['c']))
    expect(next?.accepted).toEqual({
      targetCount: 2000,
      skippedCount: 2,
      estimatedSeconds: 100,
      batchIds: ['batch-1', 'batch-2'],
    })
    expect(next?.deadLetterAtStart).toBe(1500)
  })

  it('부분 실패가 아닌 오류면 남은 목록을 비운다', () => {
    // 재처리할 예약이 없다는 오류 뒤에도 옛 목록으로 같은 예약만 보내면 안 된다.
    const next = unsentAfterError(
      previous,
      null,
      1500,
      new Error('재처리할 작업이 없습니다'),
    )
    expect(next).toBeNull()
  })

  it('범위가 다르면 남은 목록을 이어 쓰지 않는다', () => {
    expect(retryOf(previous, 'product-1')).toBeNull()
    expect(retryOf(previous, null)).toBe(previous)
    expect(retryOf(null, null)).toBeNull()
  })
})
