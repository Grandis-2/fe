import { describe, expect, it } from 'vitest'

import {
  canAct,
  canBatchExternalCancel,
  codesOfGroup,
  countByGroup,
  findingGroupOf,
  type ReconcileFinding,
} from './types'

const finding = (
  checkCode: string,
  actionStatus: ReconcileFinding['actionStatus'] = 'NOT_STARTED',
) => ({ checkCode, actionStatus }) as ReconcileFinding

describe('대조 불일치 묶음', () => {
  it('모르는 검사 종류는 수동 조사로 본다', () => {
    expect(findingGroupOf('SOMETHING_NEW')).toBe('manual')
  })

  it('종류별 건수를 묶음별로 더하고, 묶음의 종류는 나온 것만 고른다', () => {
    const counts = {
      CANCELED_BUT_MOCK_ACTIVE: 2,
      MOCK_ONLY: 1,
      NUMBER_MISMATCH: 3,
      SOMETHING_NEW: 1,
    }
    expect(countByGroup(counts)).toEqual({
      all: 7,
      externalCancel: 3,
      reprocess: 0,
      reservationCancel: 0,
      manual: 4,
    })
    expect(codesOfGroup('externalCancel', counts)).toEqual([
      'CANCELED_BUT_MOCK_ACTIVE',
      'MOCK_ONLY',
    ])
    expect(codesOfGroup('reprocess', counts)).toEqual([])
  })

  it('조치는 조치 전과 실패한 외부 취소만, 일괄 외부 취소는 외부에만 있는 건을 뺀다', () => {
    expect(canAct(finding('PENDING_BUT_MOCK_ACTIVE'))).toBe(true)
    expect(canAct(finding('PENDING_BUT_MOCK_ACTIVE', 'REQUESTED'))).toBe(false)
    expect(canAct(finding('CANCEL_JOB_INCOMPLETE', 'FAILED'))).toBe(true)
    expect(canAct(finding('NUMBER_MISMATCH'))).toBe(false)
    expect(canBatchExternalCancel(finding('CANCEL_JOB_INCOMPLETE'))).toBe(true)
    expect(canBatchExternalCancel(finding('MOCK_ONLY'))).toBe(false)
  })
})
