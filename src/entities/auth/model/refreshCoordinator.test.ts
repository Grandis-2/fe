import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiRequestError } from '@shared/api/client'
import type { Session } from '@shared/api/types'

import { refreshSession } from '../api/auth'

import { ensureFreshSession } from './refreshCoordinator'
import { useSessionStore } from './sessionStore'

vi.mock('../api/auth', () => ({ refreshSession: vi.fn() }))
// retryable 401의 1초 대기를 건너뛴다.
vi.mock('@shared/lib/delay', () => ({ delay: () => Promise.resolve() }))

const refresh = vi.mocked(refreshSession)

const session = (sessionToken: string): Session => ({
  sessionToken,
  displayName: '테스트 회원',
  role: 'USER',
  profileComplete: true,
})

const unauthorized = (retryable = false) =>
  new ApiRequestError(
    {
      code: 'UNAUTHENTICATED',
      message: '로그인이 필요합니다.',
      details: retryable ? { retryable } : null,
    },
    401,
  )

const tokenNow = () => useSessionStore.getState().sessionToken

beforeEach(() => {
  refresh.mockReset()
  useSessionStore.getState().setSession(session('old'))
})

describe('ensureFreshSession', () => {
  it('동시에 여러 번 불러도 재발급은 한 번만 보낸다', async () => {
    refresh.mockResolvedValue(session('new'))

    const results = await Promise.all([
      ensureFreshSession(),
      ensureFreshSession(),
      ensureFreshSession(),
    ])

    expect(results).toEqual([true, true, true])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(tokenNow()).toBe('new')
  })

  it('재발급이 끝난 뒤 다시 부르면 새로 보낸다', async () => {
    refresh.mockResolvedValue(session('new'))

    await ensureFreshSession()
    await ensureFreshSession()

    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('401이면 세션을 지운다', async () => {
    refresh.mockRejectedValue(unauthorized())

    await expect(ensureFreshSession()).resolves.toBe(false)
    expect(tokenNow()).toBeNull()
  })

  it('retryable 401이면 한 번 더 보내고, 성공하면 새 세션을 쓴다', async () => {
    refresh
      .mockRejectedValueOnce(unauthorized(true))
      .mockResolvedValueOnce(session('new'))

    await expect(ensureFreshSession()).resolves.toBe(true)
    expect(refresh).toHaveBeenCalledTimes(2)
    expect(tokenNow()).toBe('new')
  })

  it('retryable 401이 두 번 나도 세션은 지우지 않는다', async () => {
    refresh.mockRejectedValue(unauthorized(true))

    await expect(ensureFreshSession()).resolves.toBe(false)
    expect(refresh).toHaveBeenCalledTimes(2)
    expect(tokenNow()).toBe('old')
  })

  it('네트워크 오류(status 0)면 세션을 지우지 않는다', async () => {
    refresh.mockRejectedValue(
      new ApiRequestError({ code: 'NETWORK', message: '', details: null }, 0),
    )

    await expect(ensureFreshSession()).resolves.toBe(false)
    expect(tokenNow()).toBe('old')
  })

  it('재발급 도중 로그인으로 들어온 세션은 401이어도 지우지 않는다', async () => {
    refresh.mockImplementation(async () => {
      useSessionStore.getState().setSession(session('login'))
      throw unauthorized()
    })

    await expect(ensureFreshSession()).resolves.toBe(false)
    expect(tokenNow()).toBe('login')
  })
})
