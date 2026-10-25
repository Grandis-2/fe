import { describe, expect, it } from 'vitest'

import { mypagePath, paymentPath, resultPath } from '@shared/config/routes'

import { existingReservationAction } from './existingReservation'

type DisplayStatus = Parameters<
  typeof existingReservationAction
>[0]['displayStatus']

const action = (displayStatus: DisplayStatus) =>
  existingReservationAction({ preorderId: 'p1', displayStatus })

describe('existingReservationAction', () => {
  it('구매 확정이 필요하면 그 예약의 결제로 보낸다', () => {
    for (const status of ['PAYABLE', 'PAYMENT_IN_PROGRESS'] as const)
      expect(action(status)).toEqual({
        label: '구매 확정하기',
        to: paymentPath('p1'),
      })
  })

  it('외부 등록을 기다리면 예약 접수 화면으로 보낸다', () => {
    for (const status of ['RECEIVED', 'PROCESSING'] as const)
      expect(action(status)).toEqual({
        label: '예약 확인하기',
        to: resultPath('preorder', 'p1'),
      })
  })

  it('확정·기한 지남·취소 중이면 사전예약 내역으로 보낸다', () => {
    for (const status of ['RESERVED', 'PAYMENT_EXPIRED', 'CANCELING'] as const)
      expect(action(status)).toEqual({
        label: '예약 내역 보기',
        to: mypagePath('preorder-check'),
      })
  })
})
