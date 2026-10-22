import { describe, expect, it } from 'vitest'

import { ApiRequestError } from '@shared/api/client'

import { failedShippingOutcome } from './shippingOutcome'

const apiError = (status: number, code: string, details?: { status: string }) =>
  new ApiRequestError(
    { code, message: '서버 문구', details: details ?? null },
    status,
  )

describe('failedShippingOutcome', () => {
  it('409는 지금 상태로 말하고 다시 보내지 않는다', () => {
    expect(
      failedShippingOutcome(
        apiError(409, 'ORDER_STEP_NOT_ALLOWED', { status: 'CANCELING' }),
      ),
    ).toEqual({ kind: 'rejected', reason: "지금 '취소 처리 중'" })
  })

  it('그 밖의 4xx는 서버 문구로 막는다', () => {
    expect(failedShippingOutcome(apiError(404, 'ORDER_NOT_FOUND'))).toEqual({
      kind: 'rejected',
      reason: '서버 문구',
    })
  })

  it('네트워크·5xx는 결과를 모른다 — 다시 보낼 수 있다', () => {
    expect(failedShippingOutcome(apiError(0, 'NETWORK_ERROR'))).toEqual({
      kind: 'unknown',
    })
    expect(failedShippingOutcome(apiError(503, 'UNAVAILABLE'))).toEqual({
      kind: 'unknown',
    })
    expect(failedShippingOutcome(new Error('boom'))).toEqual({
      kind: 'unknown',
    })
  })
})
