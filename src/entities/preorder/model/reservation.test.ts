import { describe, expect, it } from 'vitest'

import { cancelCause, type ReservationEvent } from './reservation'

const event = (
  eventSequence: number,
  fromStatus: ReservationEvent['fromStatus'],
  toStatus: ReservationEvent['toStatus'],
  actor: ReservationEvent['actor'],
  reason: string | null = null,
): ReservationEvent => ({
  eventSequence,
  fromStatus,
  toStatus,
  actor,
  reason,
  createdAt: '2026-10-25T00:00:00Z',
})

const accepted = event(1, null, 'PENDING_SYNC', 'USER')
const registered = event(2, 'PENDING_SYNC', 'REGISTERED', 'SYSTEM')

describe('cancelCause', () => {
  it('취소 이력이 없으면 null', () => {
    expect(cancelCause([accepted, registered])).toBeNull()
  })

  it('사용자가 취소를 시작했으면 USER — 취소 완료(SYSTEM)는 보지 않는다', () => {
    expect(
      cancelCause([
        accepted,
        registered,
        event(3, 'REGISTERED', 'CANCELING', 'USER', '단순 변심'),
        event(4, 'CANCELING', 'CANCELED', 'SYSTEM'),
      ]),
    ).toEqual({ cause: 'USER', reason: '단순 변심' })
  })

  it('서버가 시작한 취소는 결제 기한 만료', () => {
    expect(
      cancelCause([
        accepted,
        registered,
        event(3, 'REGISTERED', 'CANCELING', 'SYSTEM'),
        event(4, 'CANCELING', 'CANCELED', 'SYSTEM'),
      ])?.cause,
    ).toBe('EXPIRY')
  })

  it('처리 중(외부 등록 대기)에서 운영자가 취소했으면 등록 실패', () => {
    expect(
      cancelCause([
        accepted,
        event(2, 'PENDING_SYNC', 'CANCELED', 'ADMIN', '외부 등록 실패'),
      ]),
    ).toEqual({ cause: 'REGISTER_FAILED', reason: '외부 등록 실패' })
  })

  it('등록된 뒤 운영자가 취소했으면 ADMIN', () => {
    expect(
      cancelCause([
        accepted,
        registered,
        event(3, 'REGISTERED', 'CANCELING', 'ADMIN', '캠페인 종료'),
      ])?.cause,
    ).toBe('ADMIN')
  })

  it('취소가 거절돼 되돌아간 뒤 다시 취소했으면 마지막 취소를 본다', () => {
    expect(
      cancelCause([
        accepted,
        registered,
        event(3, 'REGISTERED', 'CANCELING', 'USER'),
        event(4, 'CANCELING', 'REGISTERED', 'SYSTEM'),
        event(5, 'REGISTERED', 'CANCELING', 'SYSTEM'),
      ])?.cause,
    ).toBe('EXPIRY')
  })
})
