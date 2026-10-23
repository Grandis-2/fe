import { describe, expect, it } from 'vitest'

import { toQueryString } from './queryString'

describe('toQueryString', () => {
  it('배열은 같은 키를 값마다 반복하고, 빈 배열·빈 값은 뺀다', () => {
    expect(
      toQueryString({
        status: ['AWAITING_PAYMENT', 'AUTHORIZING'],
        displayStatus: [],
        cursor: undefined,
        size: 0,
      }),
    ).toBe('?status=AWAITING_PAYMENT&status=AUTHORIZING&size=0')
  })

  it('붙일 게 없으면 빈 문자열이다', () => {
    expect(toQueryString({ status: [], q: '' })).toBe('')
  })
})
