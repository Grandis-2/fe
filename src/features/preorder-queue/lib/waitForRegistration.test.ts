import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getReservation } from '@entities/preorder'

import { waitForRegistration } from './waitForRegistration'

vi.mock('@entities/preorder', () => ({ getReservation: vi.fn() }))

const reservation = vi.mocked(getReservation)

// 끊길 때까지 응답하지 않는 조회.
const hang = (_id: string, signal?: AbortSignal) =>
  new Promise<never>((_, reject) =>
    signal?.addEventListener('abort', () => reject(new Error('aborted'))),
  )

describe('waitForRegistration', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    reservation.mockReset()
  })

  it('등록되면 true', async () => {
    reservation.mockResolvedValue({ status: 'REGISTERED' } as never)
    const result = waitForRegistration('p1', new AbortController().signal)
    await vi.advanceTimersByTimeAsync(1_000)
    await expect(result).resolves.toBe(true)
  })

  it('조회가 멈춰 있어도 5초에 끊고 false', async () => {
    reservation.mockImplementation(hang)
    const result = waitForRegistration('p1', new AbortController().signal)
    await vi.advanceTimersByTimeAsync(5_000)
    await expect(result).resolves.toBe(false)
    expect(reservation.mock.calls[0][1]?.aborted).toBe(true)
  })

  it('부른 쪽이 끊으면 진행 중인 조회도 끊고 false', async () => {
    reservation.mockImplementation(hang)
    const controller = new AbortController()
    const result = waitForRegistration('p1', controller.signal)
    await vi.advanceTimersByTimeAsync(1_000)
    controller.abort()
    // 다음 차례(1초 뒤)에 멈춘다.
    await vi.advanceTimersByTimeAsync(1_000)
    await expect(result).resolves.toBe(false)
    expect(reservation.mock.calls[0][1]?.aborted).toBe(true)
  })
})
