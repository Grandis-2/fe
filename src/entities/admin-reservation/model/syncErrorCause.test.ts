import { describe, expect, it } from 'vitest'

import { syncErrorCause } from './types'

describe('syncErrorCause', () => {
  it('5xx·응답 없음은 일시 장애라 다시 보낼 수 있다', () => {
    expect(syncErrorCause('HTTP_503')).toEqual({
      label: '외부 예약 시스템 일시 중단',
      transient: true,
    })
    expect(syncErrorCause('HTTP_500_NO_BODY').transient).toBe(true)
    expect(syncErrorCause('TIMEOUT').transient).toBe(true)
  })

  it('거절과 모르는 코드는 다시 보내도 같다고 본다', () => {
    expect(syncErrorCause('MOCK_REJECTED').transient).toBe(false)
    expect(syncErrorCause('SOMETHING_NEW')).toEqual({
      label: '확인되지 않은 오류',
      transient: false,
    })
  })
})
