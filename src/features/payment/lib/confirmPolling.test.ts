import { describe, expect, it } from 'vitest'

import { ApiRequestError } from '@shared/api/client'

import { confirmPayment, DECLINE_MESSAGE } from './confirmPolling'

const apiError = (status: number, code: string, message = code) =>
  new ApiRequestError({ code, message, details: null }, status, 'trace')

const neverCalled = () => Promise.reject(new Error('상태를 묻지 않아야 한다'))

describe('confirmPayment', () => {
  it('APPROVED면 상태를 묻지 않고 승인', async () => {
    await expect(
      confirmPayment(
        async () => ({ result: 'APPROVED', declineReason: null }),
        neverCalled,
      ),
    ).resolves.toEqual({ kind: 'approved' })
  })

  it('DECLINED면 사유 문구', async () => {
    await expect(
      confirmPayment(
        async () => ({ result: 'DECLINED', declineReason: 'CARD_REJECTED' }),
        neverCalled,
      ),
    ).resolves.toEqual({
      kind: 'declined',
      message: DECLINE_MESSAGE.CARD_REJECTED,
    })
  })

  it('PENDING이면 상태를 폴링해 그 결과를 따른다', async () => {
    await expect(
      confirmPayment(
        async () => ({ result: 'PENDING', declineReason: null }),
        async () => ({ kind: 'approved' }),
      ),
    ).resolves.toEqual({ kind: 'approved' })
  })

  // 타임아웃으로 끊긴 첫 승인이 서버에서는 진행 중이라, 재전송이 409를 받는 경우.
  it('타임아웃 뒤 재전송이 409여도 실제 상태가 결제 완료면 승인', async () => {
    let sent = 0
    const outcome = await confirmPayment(
      () => {
        sent += 1
        return Promise.reject(
          sent === 1
            ? apiError(0, 'TIMEOUT')
            : apiError(409, 'ORDER_NOT_PAYABLE'),
        )
      },
      async () => ({ kind: 'approved' }),
    )
    expect(outcome).toEqual({ kind: 'approved' })
    expect(sent).toBe(2)
  })

  it('5xx·타임아웃은 같은 값으로 한 번만 더 보낸다', async () => {
    let sent = 0
    await confirmPayment(
      () => {
        sent += 1
        return Promise.reject(apiError(503, 'DEPENDENCY_UNAVAILABLE'))
      },
      async () => ({ kind: 'approved' }),
    )
    expect(sent).toBe(2)
  })

  it('409인데 결제 대기로 남았으면 서버 사유를 보여 준다', async () => {
    await expect(
      confirmPayment(
        () =>
          Promise.reject(
            apiError(409, 'PAYMENT_WINDOW_EXPIRED', '결제 기한이 지났습니다.'),
          ),
        async () => ({ kind: 'declined', message: DECLINE_MESSAGE.FAILED }),
      ),
    ).resolves.toEqual({ kind: 'declined', message: '결제 기한이 지났습니다.' })
  })

  it('409인데 그사이 취소됐으면 취소', async () => {
    await expect(
      confirmPayment(
        () => Promise.reject(apiError(409, 'PREORDER_NOT_PAYABLE')),
        async () => ({ kind: 'canceled' }),
      ),
    ).resolves.toEqual({ kind: 'canceled' })
  })

  it('404 같은 나머지 4xx는 그대로 던진다', async () => {
    const notFound = apiError(404, 'PAYMENT_ATTEMPT_NOT_FOUND')
    await expect(
      confirmPayment(() => Promise.reject(notFound), neverCalled),
    ).rejects.toBe(notFound)
  })
})
